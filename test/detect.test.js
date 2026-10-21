// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../src/game/camera.js';
import {
  FAR_MAX_PX,
  HORSE_HEIGHT,
  LOOK_FILL_S,
  LOOK_MIN_PX,
  LOOK_ZOOM_SPREAD,
} from '../src/game/config.js';
import { headCenter, headVisible, isLooking, stepLooks } from '../src/game/detect.js';
import { createPlay, stepPlay } from '../src/game/play.js';
import { headBoxFor } from '../src/game/pose.js';
import { HORSE } from '../src/render/art/horse.js';
import { HEAD_BOXES, spriteTier } from '../src/render/sprites.js';

const BOX = HORSE.headBox;

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
    lookMeter: 0,
    lookPx: LOOK_MIN_PX,
    lookedAt: false,
    reactTime: 0,
    rng: 1,
    mode: 'idle',
    idleTime: 5,
    grazing: false,
    walkTime: 0,
    route: [],
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

test('a look starts as soon as the horse is drawn at the Mid tier', () => {
  // cameraShowing takes a fraction of an 800 px view; Mid starts at FAR_MAX_PX on screen.
  const atMid = (FAR_MAX_PX + 0.5) / 800;
  const atFar = (FAR_MAX_PX - 0.5) / 800;
  assert.equal(spriteTier(cameraShowing(atMid).zoom), 'mid');
  assert.equal(isLooking(horse(), cameraShowing(atMid), BOX, HILLS, []), true);
  assert.equal(spriteTier(cameraShowing(atFar).zoom), 'far');
  assert.equal(isLooking(horse(), cameraShowing(atFar), BOX, HILLS, []), false);
  assert.equal(isLooking(horse(), cameraShowing(0.3), BOX, HILLS, []), true);
});

test("each animal's look waits for its own zoom, up to LOOK_ZOOM_SPREAD past the Mid tier", () => {
  const needy = horse({ lookPx: LOOK_MIN_PX * (1 + LOOK_ZOOM_SPREAD) });
  const atMid = (LOOK_MIN_PX + 0.5) / 800;
  assert.equal(isLooking(needy, cameraShowing(atMid), BOX, HILLS, []), false);
  const past = (LOOK_MIN_PX * (1 + LOOK_ZOOM_SPREAD) + 0.5) / 800;
  assert.equal(isLooking(needy, cameraShowing(past), BOX, HILLS, []), true);
});

test('look thresholds are spread evenly from the Mid tier to 20% more zoom', () => {
  const max = LOOK_MIN_PX * (1 + LOOK_ZOOM_SPREAD);
  const thresholds = [];
  for (let seed = 0; seed < 25; seed++) {
    for (const a of createPlay(seed, 2).animals) thresholds.push(a.lookPx);
  }
  for (const t of thresholds) assert.ok(t >= LOOK_MIN_PX && t < max, String(t));
  // Even spread: each fifth of the range holds about a fifth of the animals.
  const bins = [0, 0, 0, 0, 0];
  for (const t of thresholds) bins[Math.floor(((t - LOOK_MIN_PX) / (max - LOOK_MIN_PX)) * 5)]++;
  for (const b of bins) assert.ok(Math.abs(b / thresholds.length - 0.2) < 0.03, String(bins));
  assert.deepEqual(
    createPlay(9, 1).animals.map((a) => a.lookPx),
    createPlay(9, 1).animals.map((a) => a.lookPx),
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

test('a horse in the valley can be looked at once its head peeks over the crest', () => {
  // Feet 10 below hill 1's crest at 500: the body is hidden, the head shows.
  const peeking = horse({ y: 510 });
  assert.equal(headVisible(peeking, BOX, HILLS, []), true);
  const cam = cameraShowing(0.3, { x: 1000, y: 502 });
  assert.equal(isLooking(peeking, cam, BOX, HILLS, []), true);
  // Deeper in the valley, the head is gone too.
  assert.equal(headVisible(horse({ y: 524 }), BOX, HILLS, []), false);
});

test('a head below the crest of a hill in front is hidden', () => {
  // Feet at 510 on hill 0 are past hill 1's ridge at 500, and so is the head.
  assert.equal(headVisible(horse({ y: 520 }), BOX, HILLS, []), false);
  assert.equal(headVisible(horse({ y: 400 }), BOX, HILLS, []), true);
});

test('the meter fills in its fill time, then marks the horse looked at once', () => {
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
  // Back to the Far tier.
  const drained = look(half, cameraShowing(0.02), LOOK_FILL_S / 8).animals;
  assert.ok(Math.abs(drained[0].lookMeter - 0.25) < 0.02);
  assert.equal(look(half, cameraShowing(0.02), LOOK_FILL_S).animals[0].lookMeter, 0);
});

test('every qualifying horse on screen fills its own meter', () => {
  const animals = [
    horse(),
    horse({ id: 1, x: 1010 }),
    // Deep in the valley behind hill 1's crest: its head is hidden, so it doesn't count.
    horse({ id: 2, x: 1010, y: 524 }),
  ];
  const { looked } = look(animals, cameraShowing(0.25), LOOK_FILL_S + 0.1);
  assert.deepEqual(looked, [0, 1]);
});

test('looked-at animals are counted by stepPlay', () => {
  let play = createPlay(4000);
  const target = play.animals.find((a) => headVisible(a, BOX, play.hills, play.scenery));
  assert.ok(target);
  const cam = cameraShowing(0.35, { x: target.x, y: target.y - HORSE_HEIGHT / 2 });
  // Freeze grazing for the test: everyone stands still for a long while.
  play = { ...play, animals: play.animals.map((a) => ({ ...a, idleTime: 100, grazing: false })) };
  for (let t = 0; t < 90; t++) play = stepPlay(play, cam, HEAD_BOXES, DT);
  const looked = play.animals.filter((a) => a.lookedAt).map((a) => a.id);
  assert.ok(looked.includes(target.id));
  assert.deepEqual(
    [...play.lookedAt].sort((a, b) => a - b),
    looked,
  );
  const horses = play.animals.filter((a) => a.lookedAt && a.kind === 'horse').length;
  assert.equal(play.horsesThisLevel, horses);
  assert.equal(play.nonHorsesTotal, looked.length - horses);
});

test('a grazing head is low, so it can drop behind a crest the standing head clears', () => {
  // Just behind hill 1's crest (y = 500): standing, the head shows above it; grazing, it doesn't.
  const peeking = horse({ y: 510 });
  const boxes = HEAD_BOXES.horse;
  assert.ok(headVisible(peeking, headBoxFor(peeking, boxes), HILLS, []));
  const grazing = { ...peeking, grazing: true, idleTime: 5 };
  assert.ok(!headVisible(grazing, headBoxFor(grazing, boxes), HILLS, []));
});
