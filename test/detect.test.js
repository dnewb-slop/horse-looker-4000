// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../src/game/camera.js';
import { HORSE_HEIGHT, LOOK_FILL_S } from '../src/game/config.js';
import { headCenter, headVisible, isLooking, stepLooks } from '../src/game/detect.js';
import { createPlay, stepPlay } from '../src/game/play.js';
import { HORSE } from '../src/render/art/horse.js';

const BOX = HORSE.headBox;
const HEAD_BOXES = { horse: BOX };
const DT = 1 / 60;

/** Three flat hills: ridges at y = -100, 500 and 1000. */
const HILLS = [-100, 500, 1000].map((baseY, shade) => ({ baseY, waves: [], shade }));

/**
 * @param {Partial<import('../src/game/world.js').Animal>} [over]
 * @returns {import('../src/game/world.js').Animal}
 */
function horse(over = {}) {
  return {
    id: 0,
    kind: 'horse',
    breed: 'A',
    x: 1000,
    y: 400,
    hill: 0,
    facing: 1,
    lookThreshold: 0.2,
    lookMeter: 0,
    lookedAt: false,
    rng: 1,
    mode: 'idle',
    idleTime: 5,
    targetX: 1000,
    targetY: 400,
    ...over,
  };
}

/**
 * An 800 px tall view centered on the horse, zoomed so it is `fraction` of the view's height.
 * @param {number} fraction
 * @param {{x?: number, y?: number}} [at]
 */
function cameraShowing(fraction, at = {}) {
  const cam = createCamera(1000, 800);
  const zoom = (fraction * 800) / HORSE_HEIGHT;
  return { ...cam, zoom, targetZoom: zoom, x: at.x ?? 1000, y: at.y ?? 392 };
}

/**
 * Run look steps for a number of seconds.
 * @param {import('../src/game/world.js').Animal[]} animals
 * @param {import('../src/game/camera.js').Camera} cam
 * @param {number} seconds
 * @param {import('../src/game/world.js').Scenery[]} [scenery]
 */
function look(animals, cam, seconds, scenery = []) {
  /** @type {number[]} */
  const looked = [];
  for (let t = 0; t < Math.round(seconds * 60); t++) {
    const out = stepLooks(animals, cam, HEAD_BOXES, HILLS, scenery, DT);
    animals = out.animals;
    looked.push(...out.looked.map((a) => a.id));
  }
  return { animals, looked };
}

test('the head is mirrored when the horse faces left', () => {
  const right = headCenter(horse(), BOX);
  const left = headCenter(horse({ facing: -1 }), BOX);
  assert.ok(right.x > 1000 && left.x < 1000);
  assert.ok(Math.abs(right.x - 1000 - (1000 - left.x)) < 1e-9);
  assert.equal(right.y, left.y);
});

test('a big enough, centered horse is being looked at; a small one is not', () => {
  assert.equal(isLooking(horse(), cameraShowing(0.25), BOX, HILLS, []), true);
  assert.equal(isLooking(horse(), cameraShowing(0.15), BOX, HILLS, []), false);
  // Its own threshold decides.
  assert.equal(
    isLooking(horse({ lookThreshold: 0.15 }), cameraShowing(0.16), BOX, HILLS, []),
    true,
  );
});

test('a horse whose center is off screen is not being looked at', () => {
  const cam = cameraShowing(0.3, { x: 1000 + 1000 / ((0.3 * 800) / HORSE_HEIGHT) });
  assert.equal(isLooking(horse(), cam, BOX, HILLS, []), false);
});

test('a head behind scenery in front is hidden; scenery behind the horse does not hide it', () => {
  const head = headCenter(horse(), BOX);
  /** @type {import('../src/game/world.js').Scenery} */
  const barnInFront = { kind: 'barn', x: head.x, y: 450, hill: 0 };
  /** @type {import('../src/game/world.js').Scenery} */
  const barnBehind = { kind: 'barn', x: head.x, y: 350, hill: 0 };
  /** @type {import('../src/game/world.js').Scenery} */
  const barnOnHillInFront = { kind: 'barn', x: head.x, y: 420, hill: 1 };
  assert.equal(headVisible(horse(), BOX, HILLS, [barnInFront]), false);
  assert.equal(headVisible(horse(), BOX, HILLS, [barnBehind]), true);
  assert.equal(headVisible(horse(), BOX, HILLS, [barnOnHillInFront]), false);
  // A barn off to the side covers nothing.
  assert.equal(headVisible(horse(), BOX, HILLS, [{ ...barnInFront, x: head.x + 200 }]), true);
});

test('a head below the crest of a hill in front is hidden', () => {
  // Feet at 510 on hill 0 are past hill 1's ridge at 500, and so is the head.
  assert.equal(headVisible(horse({ y: 520 }), BOX, HILLS, []), false);
  assert.equal(headVisible(horse({ y: 400 }), BOX, HILLS, []), true);
});

test('the meter fills in about a second, then marks the horse looked at once', () => {
  const cam = cameraShowing(0.3);
  const half = look([horse()], cam, LOOK_FILL_S / 2);
  assert.ok(Math.abs(half.animals[0].lookMeter - 0.5) < 0.02);
  assert.equal(half.animals[0].lookedAt, false);

  const full = look(half.animals, cam, LOOK_FILL_S / 2 + 0.05);
  assert.equal(full.animals[0].lookedAt, true);
  assert.deepEqual(full.looked, [0]);

  // Staying zoomed in never counts it again.
  assert.deepEqual(look(full.animals, cam, 2).looked, []);
});

test('zooming out drains the meter at twice the fill speed', () => {
  const half = look([horse()], cameraShowing(0.3), LOOK_FILL_S / 2).animals;
  const drained = look(half, cameraShowing(0.05), LOOK_FILL_S / 8).animals;
  assert.ok(Math.abs(drained[0].lookMeter - 0.25) < 0.02);
  assert.equal(look(half, cameraShowing(0.05), LOOK_FILL_S).animals[0].lookMeter, 0);
});

test('every qualifying horse on screen fills its own meter', () => {
  const animals = [
    horse(),
    horse({ id: 1, x: 1010 }),
    horse({ id: 2, x: 1010, lookThreshold: 0.3 }),
  ];
  const { looked } = look(animals, cameraShowing(0.25), LOOK_FILL_S + 0.1);
  assert.deepEqual(looked, [0, 1]);
});

test('a looked-at horse counts toward the level', () => {
  let play = createPlay(4000);
  const target = play.animals.find((a) => headVisible(a, BOX, play.hills, play.scenery));
  assert.ok(target);
  const cam = cameraShowing(0.35, { x: target.x, y: target.y - HORSE_HEIGHT / 2 });
  // Freeze grazing for the test: everyone stands still for a long while.
  play = { ...play, animals: play.animals.map((a) => ({ ...a, idleTime: 100 })) };
  for (let t = 0; t < 90; t++) play = stepPlay(play, cam, HEAD_BOXES, DT);
  const looked = play.animals.filter((a) => a.lookedAt).map((a) => a.id);
  assert.ok(looked.includes(target.id));
  assert.deepEqual(
    [...play.lookedAt].sort((a, b) => a - b),
    looked,
  );
  assert.equal(play.horsesThisLevel, looked.length);
  assert.equal(play.nonHorsesTotal, 0);
});
