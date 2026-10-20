// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENERY_SIZE,
  generateHills,
  inSceneryFootprint,
  lookThresholdFrom,
  placeScenery,
  ridgeY,
  slopeRange,
  spawnAnimals,
  stepAnimals,
} from '../src/game/world.js';
import { createRng } from '../src/game/rng.js';
import { LEVELS, levelRoster } from '../src/game/levels.js';
import {
  ANIMAL_MIN_SPACING,
  BARN_COUNT,
  DATACENTER_COUNT,
  HILL_COUNT,
  HORSE_WIDTH,
  LOOK_THRESHOLD_MAX,
  LOOK_THRESHOLD_MIN,
  LOOK_THRESHOLD_PEAK,
  OAK_COUNT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../src/game/config.js';

test('the same seed makes the same hills', () => {
  assert.deepEqual(generateHills(createRng(5)), generateHills(createRng(5)));
});

test('hills are ordered back to front and cover the top of the pasture', () => {
  for (let seed = 0; seed < 200; seed++) {
    const hills = generateHills(createRng(seed));
    assert.equal(hills.length, HILL_COUNT);
    for (let i = 1; i < hills.length; i++) assert.ok(hills[i].baseY > hills[i - 1].baseY);
    for (let x = 0; x <= WORLD_WIDTH; x += 25) {
      assert.ok(ridgeY(hills[0], x) <= 0, `seed ${seed} leaves a gap at x=${x}`);
    }
  }
});

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919);

/** @param {number} seed */
function level(seed) {
  const rng = createRng(seed);
  const hills = generateHills(rng);
  const scenery = placeScenery(rng, hills);
  const animals = spawnAnimals(rng, hills, scenery, levelRoster(rng, LEVELS[2]));
  return { hills, scenery, animals };
}

/**
 * @param {import('../src/game/world.js').Hill[]} hills
 * @param {{hill: number, x: number, y: number}} thing
 * @param {number} halfWidth
 */
function onVisibleSlope(hills, thing, halfWidth) {
  const { top, bottom } = slopeRange(hills, thing.hill, thing.x, halfWidth);
  return thing.y >= top - 1e-9 && thing.y <= bottom + 1e-9;
}

test('the same seed makes the same scenery and animals', () => {
  assert.deepEqual(level(12), level(12));
});

test('every scenery object is placed on a visible slope, inside the pasture, without overlaps', () => {
  for (const seed of SEEDS) {
    const { hills, scenery } = level(seed);
    assert.equal(scenery.length, BARN_COUNT + OAK_COUNT + DATACENTER_COUNT, `seed ${seed}`);
    for (const s of scenery) {
      const { width, height } = SCENERY_SIZE[s.kind];
      assert.ok(onVisibleSlope(hills, s, width / 2), `seed ${seed}: ${s.kind} off its slope`);
      assert.ok(s.x - width / 2 >= 0 && s.x + width / 2 <= WORLD_WIDTH);
      assert.ok(s.y - height >= 0 && s.y <= WORLD_HEIGHT);
    }
    for (let i = 0; i < scenery.length; i++) {
      for (let j = i + 1; j < scenery.length; j++) {
        const a = scenery[i];
        const b = scenery[j];
        const sa = SCENERY_SIZE[a.kind];
        const sb = SCENERY_SIZE[b.kind];
        const overlap =
          Math.abs(a.x - b.x) < (sa.width + sb.width) / 2 &&
          a.y - sa.height < b.y &&
          b.y - sb.height < a.y;
        assert.ok(!overlap, `seed ${seed}: ${a.kind} overlaps ${b.kind}`);
      }
    }
  }
});

test('animals spawn spaced apart, on a visible slope and clear of scenery', () => {
  for (const seed of SEEDS) {
    const { hills, scenery, animals } = level(seed);
    assert.equal(animals.length, 80, `seed ${seed}`);
    for (const a of animals) {
      assert.ok(onVisibleSlope(hills, a, HORSE_WIDTH / 2), `seed ${seed}: animal ${a.id}`);
      assert.ok(!inSceneryFootprint(scenery, a.x, a.y));
      assert.ok(a.lookThreshold >= LOOK_THRESHOLD_MIN && a.lookThreshold <= LOOK_THRESHOLD_MAX);
      assert.equal(a.lookMeter, 0);
      assert.equal(a.lookedAt, false);
    }
    for (let i = 0; i < animals.length; i++) {
      for (let j = i + 1; j < animals.length; j++) {
        const d = Math.hypot(animals[i].x - animals[j].x, animals[i].y - animals[j].y);
        assert.ok(d >= ANIMAL_MIN_SPACING, `seed ${seed}: animals ${i} and ${j} too close`);
      }
    }
  }
});

test('look thresholds span the configured range and peak where configured', () => {
  assert.equal(lookThresholdFrom(0), LOOK_THRESHOLD_MIN);
  assert.ok(Math.abs(lookThresholdFrom(1 - 1e-12) - LOOK_THRESHOLD_MAX) < 1e-6);
  // The peak splits the range in proportion to where it sits.
  const split =
    (LOOK_THRESHOLD_PEAK - LOOK_THRESHOLD_MIN) / (LOOK_THRESHOLD_MAX - LOOK_THRESHOLD_MIN);
  assert.ok(Math.abs(lookThresholdFrom(split) - LOOK_THRESHOLD_PEAK) < 1e-9);
});

test('grazing animals move, stay on their own hill and never walk through scenery', () => {
  const dt = 1 / 60;
  for (const seed of SEEDS.slice(0, 10)) {
    const { hills, scenery, animals: start } = level(seed);
    let animals = start;
    for (let tick = 0; tick < 60 * 60; tick++) {
      animals = stepAnimals(animals, hills, scenery, dt);
      if (tick % 30 !== 0) continue;
      for (const a of animals) {
        assert.ok(onVisibleSlope(hills, a, HORSE_WIDTH / 2), `seed ${seed}: animal ${a.id}`);
        assert.ok(!inSceneryFootprint(scenery, a.x, a.y), `seed ${seed}: animal ${a.id}`);
      }
    }
    const moved = animals.filter((a, i) => a.x !== start[i].x || a.y !== start[i].y);
    assert.ok(moved.length > start.length / 2, `seed ${seed}: only ${moved.length} moved`);
    assert.ok(animals.every((a, i) => a.hill === start[i].hill));
  }
});

test('grazing is deterministic and faces the way it walks', () => {
  const { hills, scenery, animals } = level(3);
  /** @param {import('../src/game/world.js').Animal[]} list */
  const run = (list) => {
    for (let tick = 0; tick < 600; tick++) list = stepAnimals(list, hills, scenery, 1 / 60);
    return list;
  };
  assert.deepEqual(run(animals), run(animals));
  for (const a of run(animals)) {
    if (a.mode === 'walk') assert.equal(a.facing, a.targetX < a.x ? -1 : 1);
  }
});
