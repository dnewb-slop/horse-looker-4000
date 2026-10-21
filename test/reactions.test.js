// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../src/game/camera.js';
import { HORSE_HEIGHT, REACTION_S, REAR_S } from '../src/game/config.js';
import { stepLooks } from '../src/game/detect.js';
import { createPlay } from '../src/game/play.js';
import { animalPose } from '../src/game/pose.js';
import { stepAnimals } from '../src/game/world.js';
import { REACTION_LINES, spriteTop } from '../src/render/bubbles.js';
import { CREATURES, HEAD_BOXES, poseGrid } from '../src/render/sprites.js';

const DT = 1 / 60;

test('each kind says the line DESIGN.md gives it', () => {
  assert.deepEqual(REACTION_LINES, {
    horse: 'Yayyy',
    goat: 'Nayyyy',
    sheep: 'Nayyyy',
    centaur: 'What’s up?',
    reverseCentaur: 'AAAaaaa',
    robotHorse: null,
    horseSuit: null,
  });
});

test('being looked at starts a reaction, during which the animal stays put', () => {
  const play = createPlay(3, 2);
  const target = play.animals[0];
  const zoom = (0.4 * 800) / HORSE_HEIGHT;
  const cam = { ...createCamera(1000, 800), zoom, targetZoom: zoom, x: target.x, y: target.y - 8 };
  let animals = play.animals;
  // Long enough to fill the meter of the animal in the middle, if its head is in view.
  for (let i = 0; i < 60 && !animals[0].lookedAt; i++) {
    animals = stepLooks(animals, cam, HEAD_BOXES, play.hills, play.scenery, DT).animals;
  }
  const looked = animals.find((a) => a.lookedAt);
  assert.ok(looked, 'something was looked at');
  assert.equal(looked.reactTime, REACTION_S);

  // Walking or not, it stays where it is until the reaction is over.
  /** @type {import('../src/game/world.js').Animal} */
  let moved = { ...looked, mode: 'walk', route: [{ x: 0, y: 0, hill: 0 }] };
  for (let t = 0; t < REACTION_S - 0.1; t += DT) {
    moved = stepAnimals([moved], play.hills, play.scenery, DT)[0];
    assert.equal(moved.x, looked.x);
    assert.equal(moved.y, looked.y);
  }
  for (let t = 0; t < 0.2; t += DT) moved = stepAnimals([moved], play.hills, play.scenery, DT)[0];
  assert.equal(moved.reactTime, 0);
});

test('a horse rears up first, then stands to finish its line; others just stand', () => {
  const found = createPlay(1).animals.find((a) => a.kind === 'horse');
  assert.ok(found);
  const horse = { ...found, grazing: true };
  assert.equal(animalPose({ ...horse, reactTime: REACTION_S }), 'rear');
  assert.equal(animalPose({ ...horse, reactTime: REACTION_S - REAR_S + 0.01 }), 'rear');
  assert.equal(animalPose({ ...horse, reactTime: REACTION_S - REAR_S - 0.01 }), 'stand');
  const goat = { ...horse, kind: /** @type {const} */ ('goat') };
  assert.equal(animalPose({ ...goat, reactTime: REACTION_S }), 'stand');
});

test('the rearing horse is taller, with the hooves still on the bottom row', () => {
  for (const tier of /** @type {const} */ (['mid', 'near'])) {
    const stand = poseGrid(CREATURES.horse, 'stand', tier);
    const rear = poseGrid(CREATURES.horse, 'rear', tier);
    assert.ok(rear.length > stand.length, tier);
    assert.equal(rear[0].length, stand[0].length);
    // The hind hooves stay planted: the bottom rows under them are unchanged.
    const hind = tier === 'mid' ? 10 : 20;
    for (let i = 1; i <= 2; i++) {
      assert.equal(rear.at(-i)?.slice(0, hind), stand.at(-i)?.slice(0, hind), `${tier} row -${i}`);
    }
  }
});

test('the bubble follows the head: higher and further back on a rearing horse', () => {
  const stand = spriteTop('horse', 'stand');
  const rear = spriteTop('horse', 'rear');
  assert.equal(stand.y, HORSE_HEIGHT);
  assert.ok(stand.x > 0, 'a standing horse holds its head at the front');
  assert.ok(rear.y > stand.y && rear.x < stand.x);
});
