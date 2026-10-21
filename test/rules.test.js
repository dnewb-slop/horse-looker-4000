// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HORSES_PER_LEVEL, LEVEL_CARD_S, LOSE_PAUSE_S, MAX_STRIKES } from '../src/game/config.js';
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

test('the rules match DESIGN.md: 5 horses complete a level, 3 non-horses lose', () => {
  assert.equal(HORSES_PER_LEVEL, 5);
  assert.equal(MAX_STRIKES, 3);
});

test('enough horses complete a level; enough non-horses lose; losing wins a tie', () => {
  const h = HORSES_PER_LEVEL;
  const n = MAX_STRIKES;
  assert.equal(nextPhase({ level: 1, horsesThisLevel: h - 1, nonHorsesTotal: n - 1 }), 'playing');
  assert.equal(nextPhase({ level: 1, horsesThisLevel: h, nonHorsesTotal: n - 1 }), 'levelComplete');
  assert.equal(nextPhase({ level: 2, horsesThisLevel: 1, nonHorsesTotal: n }), 'lost');
  assert.equal(nextPhase({ level: 2, horsesThisLevel: h, nonHorsesTotal: n }), 'lost');
});

/**
 * Put a play one horse from finishing its level, then let stepPlay notice.
 * @param {import('../src/game/play.js').Play} play
 */
function finishLevel(play) {
  const done = lookAt(play, isHorse, HORSES_PER_LEVEL);
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
  assert.equal(play.log.length, 2 + HORSES_PER_LEVEL);
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

test('the last allowed non-horse loses the game; after a pause with no looks, the lose screen', () => {
  let play = lookAt(createPlay(7, 2), notHorse, MAX_STRIKES);
  play = stepPlay(play, FAR_CAMERA, HEAD_BOXES, DT);
  assert.equal(play.phase, 'losing');

  // Zoomed right in on an animal not yet looked at: during the pause, its meter never fills.
  const target = play.animals.find((a) => !a.lookedAt);
  assert.ok(target);
  const zoom = (0.5 * 704) / 16;
  const close = { ...FAR_CAMERA, zoom, targetZoom: zoom, x: target.x, y: target.y - 8 };
  const log = play.log.length;
  for (let i = 0; i < Math.floor(LOSE_PAUSE_S / DT) - 1; i++) {
    play = stepPlay(play, close, HEAD_BOXES, DT);
  }
  assert.equal(play.phase, 'losing');
  assert.equal(play.log.length, log);
  assert.equal(play.nonHorsesTotal, MAX_STRIKES);
  assert.ok(play.animals.every((a) => a.lookedAt || a.lookMeter === 0));

  for (let i = 0; i < 3; i++) play = stepPlay(play, close, HEAD_BOXES, DT);
  assert.equal(play.phase, 'lost');
  const after = stepPlay(play, close, HEAD_BOXES, DT);
  assert.equal(after.phase, 'lost');
  assert.equal(after.log.length, log);
});
