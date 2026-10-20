// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCENERY_SIZE,
  generateHills,
  inSceneryFootprint,
  placeScenery,
  ridgeY,
  slopeRange,
  crossingRoute,
  groundRange,
  inValley,
  minGap,
  routeClear,
  spawnAnimals,
  stepAnimals,
} from '../src/game/world.js';
import { createRng } from '../src/game/rng.js';
import { LEVELS, levelRoster } from '../src/game/levels.js';
import { headVisible } from '../src/game/detect.js';
import { HORSE } from '../src/render/art/horse.js';
import {
  ANIMAL_MIN_SPACING,
  CROSS_OVERSHOOT,
  MIN_RIDGE_GAP,
  VALLEY_DEPTH,
  BARN_COUNT,
  DATACENTER_COUNT,
  HILL_COUNT,
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

/**
 * Whether an animal's feet are on its hill's ground: from its crest down into the valley behind
 * the next crest.
 * @param {import('../src/game/world.js').Hill[]} hills
 * @param {{hill: number, x: number, y: number}} a
 */
function onGround(hills, a) {
  const { top, bottom } = groundRange(hills, a.hill, a.x, 0);
  return a.y >= top - 1e-6 && a.y <= bottom + 1e-6;
}

test('neighboring ridges never come closer than the minimum gap', () => {
  for (let seed = 0; seed < 200; seed++) {
    const hills = generateHills(createRng(seed));
    for (let i = 1; i < hills.length; i++) {
      assert.ok(minGap(hills[i - 1], hills[i]) >= MIN_RIDGE_GAP - 1e-9, `seed ${seed} hill ${i}`);
    }
  }
});

test('animals spawn spaced apart, on their ground and clear of scenery; some start in a valley', () => {
  let inValleys = 0;
  for (const seed of SEEDS) {
    const { hills, scenery, animals } = level(seed);
    assert.equal(animals.length, 80, `seed ${seed}`);
    inValleys += animals.filter((a) => inValley(hills, a)).length;
    for (const a of animals) {
      assert.ok(onGround(hills, a), `seed ${seed}: animal ${a.id}`);
      assert.ok(!inSceneryFootprint(scenery, a.x, a.y));
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
  assert.ok(inValleys > SEEDS.length, `only ${inValleys} animals started in a valley`);
});

test('grazing animals stay on their ground, avoid scenery, and change hills only at a crest', () => {
  const dt = 1 / 60;
  let crossings = 0;
  for (const seed of SEEDS.slice(0, 10)) {
    const { hills, scenery, animals: start } = level(seed);
    let animals = start;
    for (let tick = 0; tick < 60 * 60; tick++) {
      const before = animals;
      animals = stepAnimals(animals, hills, scenery, dt);
      animals.forEach((a, i) => {
        const b = before[i];
        if (a.hill === b.hill) return;
        crossings++;
        // One hill at a time, switching exactly on the crest between them.
        assert.equal(Math.abs(a.hill - b.hill), 1);
        const crest = hills[Math.max(a.hill, b.hill)];
        assert.ok(Math.abs(a.y - ridgeY(crest, a.x)) < 1e-6, `seed ${seed}: animal ${a.id}`);
      });
      if (tick % 30 !== 0) continue;
      for (const a of animals) {
        assert.ok(onGround(hills, a), `seed ${seed}: animal ${a.id} off its ground`);
        assert.ok(!inSceneryFootprint(scenery, a.x, a.y), `seed ${seed}: animal ${a.id}`);
      }
    }
    const moved = animals.filter((a, i) => a.x !== start[i].x || a.y !== start[i].y);
    assert.ok(moved.length > start.length / 2, `seed ${seed}: only ${moved.length} moved`);
  }
  assert.ok(crossings > 20, `only ${crossings} ridge crossings in 10 minutes of grazing`);
});

/** Three flat hills, ridges at y = -100, 500 and 1000. */
const FLAT = [-100, 500, 1000].map((baseY, shade) => ({ baseY, waves: [], shade }));

/**
 * Walk an animal along a route to its end, noting each tick.
 * @param {{x: number, y: number, hill: number}} start
 * @param {import('../src/game/world.js').Waypoint[]} route
 */
function walk(start, route) {
  const [first] = spawnAnimals(createRng(1), FLAT, [], [{ kind: 'horse', breed: 'A' }]);
  /** @type {import('../src/game/world.js').Animal} */
  let a = { ...first, ...start, facing: 1, mode: 'walk', route };
  const ticks = [];
  while (a.mode === 'walk') {
    a = stepAnimals([a], FLAT, [], 1 / 60)[0];
    ticks.push({ ...a, head: headVisible(a, HORSE.headBox, FLAT, []) });
  }
  return ticks;
}

test('crossing toward the viewer sinks out of sight, rises head first, then switches hills', () => {
  const start = { x: 1000, y: 470, hill: 0 };
  const route = crossingRoute(FLAT, start, 1, 40);
  assert.ok(route && routeClear(FLAT, [], start, route, 0));
  const ticks = walk(start, route);
  const end = ticks[ticks.length - 1];
  assert.equal(end.hill, 1);
  assert.ok(Math.abs(end.y - (500 + CROSS_OVERSHOOT)) < 1e-9);
  // Fully out of sight in the valley, then the head shows before the feet clear the crest.
  const hidden = ticks.findIndex((t) => t.hill === 0 && !t.head);
  const peeking = ticks.findIndex((t, i) => i > hidden && t.hill === 0 && t.head && t.y > 500);
  assert.ok(hidden >= 0, 'never fully hidden');
  assert.ok(peeking > hidden, 'never peeked head first');
  assert.ok(ticks.slice(0, ticks.length).every((t) => t.y <= 500 + VALLEY_DEPTH + 1e-9));
});

test('crossing away from the viewer goes over the crest and out of sight onto the hill behind', () => {
  const start = { x: 1000, y: 530, hill: 1 };
  const route = crossingRoute(FLAT, start, -1, -40);
  assert.ok(route && routeClear(FLAT, [], start, route, 0));
  const ticks = walk(start, route);
  const end = ticks[ticks.length - 1];
  assert.equal(end.hill, 0);
  assert.ok(Math.abs(end.y - (500 - CROSS_OVERSHOOT)) < 1e-9);
  assert.ok(
    ticks.some((t) => t.hill === 0 && !t.head),
    'never out of sight',
  );
  assert.equal(end.facing, -1);
});

test('there is no crossing past the first or last hill', () => {
  assert.equal(crossingRoute(FLAT, { x: 1000, y: 200, hill: 0 }, -1, 30), null);
  assert.equal(crossingRoute(FLAT, { x: 1000, y: 1200, hill: 2 }, 1, 30), null);
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
    if (a.mode === 'walk') assert.equal(a.facing, a.route[0].x < a.x ? -1 : 1);
  }
});
