// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_CARD_S } from '../src/game/config.js';
import { createPlay, stepPlay } from '../src/game/play.js';
import { countLooks, nextPhase } from '../src/game/rules.js';
import { createCamera } from '../src/game/camera.js';
import { HEAD_BOXES } from '../src/render/sprites.js';

const DT = 1 / 60;
// Zoomed all the way out: nothing on screen is big enough to look at.
const FAR_CAMERA = createCamera(1280, 704);

/**
 * Pretend the player just looked at these animals.
 * @param {import('../src/game/play.js').Play} play
 * @param {(a: import('../src/game/world.js').Animal) => boolean} pick
 * @param {number} count
 */
function lookAt(play, pick, count) {
  const looked = play.animals
    .filter((a) => !a.lookedAt && pick(a))
    .slice(0, count)
    .map((a) => ({ ...a, lookedAt: true }));
  const ids = new Set(looked.map((a) => a.id));
  const animals = play.animals.map((a) => (ids.has(a.id) ? { ...a, lookedAt: true } : a));
  return countLooks({ ...play, animals }, looked);
}

const isHorse = (/** @type {{kind: string}} */ a) => a.kind === 'horse';
const notHorse = (/** @type {{kind: string}} */ a) => a.kind !== 'horse';

test('looks count horses per level and non-horses per game, and are logged', () => {
  let play = createPlay(1);
  play = lookAt(play, isHorse, 3);
  play = lookAt(play, notHorse, 2);
  assert.equal(play.horsesThisLevel, 3);
  assert.equal(play.nonHorsesTotal, 2);
  assert.equal(play.lookedAt.length, 5);
  assert.equal(play.log.length, 5);
  assert.equal(play.log.filter((e) => e.kind === 'horse').length, 3);
});

test('ten horses complete a level; five non-horses lose; losing wins a tie', () => {
  assert.equal(nextPhase({ level: 1, horsesThisLevel: 9, nonHorsesTotal: 4 }), 'playing');
  assert.equal(nextPhase({ level: 1, horsesThisLevel: 10, nonHorsesTotal: 4 }), 'levelComplete');
  assert.equal(nextPhase({ level: 2, horsesThisLevel: 3, nonHorsesTotal: 5 }), 'lost');
  assert.equal(nextPhase({ level: 2, horsesThisLevel: 10, nonHorsesTotal: 5 }), 'lost');
});

/**
 * Put a play one horse from finishing its level, then let stepPlay notice.
 * @param {import('../src/game/play.js').Play} play
 */
function finishLevel(play) {
  const done = lookAt(play, isHorse, 10);
  return stepPlay({ ...done, phase: 'playing' }, FAR_CAMERA, HEAD_BOXES, DT);
}

test('a finished level shows its card, then the next level starts fresh', () => {
  let play = lookAt(createPlay(7), notHorse, 2);
  play = finishLevel(play);
  assert.equal(play.phase, 'levelComplete');
  assert.equal(play.level, 1);

  const ticks = Math.ceil(LEVEL_CARD_S / DT) + 1;
  for (let i = 0; i < ticks; i++) play = stepPlay(play, FAR_CAMERA, HEAD_BOXES, DT);
  assert.equal(play.phase, 'playing');
  assert.equal(play.level, 2);
  assert.equal(play.animals.length, 80);
  assert.equal(play.horsesThisLevel, 0);
  assert.deepEqual(play.lookedAt, []);
  // Imposters and the game log carry over.
  assert.equal(play.nonHorsesTotal, 2);
  assert.equal(play.log.length, 12);
  assert.deepEqual(play.hills, createPlay(7, 2).hills);
});

test('finishing level 3 wins the game after its card', () => {
  let play = finishLevel(createPlay(7, 3));
  assert.equal(play.phase, 'levelComplete');
  for (let i = 0; i < Math.ceil(LEVEL_CARD_S / DT) + 1; i++) {
    play = stepPlay(play, FAR_CAMERA, HEAD_BOXES, DT);
  }
  assert.equal(play.phase, 'won');
  assert.equal(play.level, 3);
});

test('the fifth non-horse ends the game at once, and nothing counts after', () => {
  let play = lookAt(createPlay(7, 2), notHorse, 5);
  play = stepPlay(play, FAR_CAMERA, HEAD_BOXES, DT);
  assert.equal(play.phase, 'lost');
  const after = stepPlay(play, FAR_CAMERA, HEAD_BOXES, DT);
  assert.equal(after.phase, 'lost');
  assert.equal(after.nonHorsesTotal, 5);
});
