// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAZE_LOOK_UP_S, WALK_FRAME_RATE } from '../src/game/config.js';
import { animalPose, headBoxFor } from '../src/game/pose.js';

/**
 * @param {Partial<import('../src/game/world.js').Animal>} over
 * @returns {import('../src/game/world.js').Animal}
 */
const animal = (over) => ({
  id: 0,
  kind: 'horse',
  breed: 'A',
  x: 0,
  y: 0,
  hill: 0,
  facing: 1,
  lookMeter: 0,
  lookPx: 32,
  lookedAt: false,
  reactTime: 0,
  rng: 1,
  mode: 'idle',
  idleTime: 5,
  grazing: false,
  walkTime: 0,
  route: [],
  ...over,
});

test('walking swaps between the standing and walk frames at the walk frame rate', () => {
  const frame = 1 / WALK_FRAME_RATE;
  const poses = [0.1, 1.1, 2.1, 3.1].map((n) =>
    animalPose(animal({ mode: 'walk', walkTime: n * frame })),
  );
  assert.deepEqual(poses, ['stand', 'walk', 'stand', 'walk']);
});

test('a grazing animal keeps its head down until just before it walks off', () => {
  assert.equal(animalPose(animal({ grazing: true, idleTime: GRAZE_LOOK_UP_S + 0.5 })), 'graze');
  assert.equal(animalPose(animal({ grazing: true, idleTime: GRAZE_LOOK_UP_S - 0.1 })), 'stand');
  assert.equal(animalPose(animal({ grazing: false, idleTime: 5 })), 'stand');
});

test('the head box follows the pose', () => {
  const boxes = {
    stand: { x: 0.7, y: 0, w: 0.3, h: 0.4 },
    graze: { x: 0.8, y: 0.5, w: 0.2, h: 0.5 },
  };
  assert.equal(headBoxFor(animal({ grazing: true }), boxes), boxes.graze);
  assert.equal(
    headBoxFor(animal({ mode: 'walk', walkTime: 1 / WALK_FRAME_RATE }), boxes),
    boxes.stand,
  );
});
