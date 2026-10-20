// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTRO_FADE_S, INTRO_HOLDS_S, MAX_STRIKES } from '../src/game/config.js';
import { INTRO_LINES, introLineSeconds, introView, stepIntro } from '../src/game/intro.js';
import { createEndPreview, createPlay, stepPlay } from '../src/game/play.js';
import { createCamera } from '../src/game/camera.js';
import { HEAD_BOXES } from '../src/render/sprites.js';
import { LOSE_TEXT, WIN_TEXT, endModel } from '../src/ui/screens.js';

const DT = 1 / 60;
const CAMERA = createCamera(1280, 704);

test('the opening lines match DESIGN.md', () => {
  assert.deepEqual(INTRO_LINES, [
    'The year is 4000.',
    "The American Cowboy is dead. But there's one job the robots can't take ...",
    "It's you. The Horse Looker.",
  ]);
});

test('each intro line fades in, holds, then fades out', () => {
  assert.equal(introView({ line: 0, time: 0 }).opacity, 0);
  assert.ok(Math.abs(introView({ line: 0, time: INTRO_FADE_S / 2 }).opacity - 0.5) < 1e-9);
  assert.equal(introView({ line: 0, time: INTRO_FADE_S + INTRO_HOLDS_S[0] / 2 }).opacity, 1);
  assert.ok(introView({ line: 0, time: introLineSeconds(0) - 1e-6 }).opacity < 0.01);
  // The middle line holds longer, so it is still fully shown when the first would be fading.
  assert.equal(introView({ line: 1, time: introLineSeconds(0) - 0.1 }).opacity, 1);
  assert.equal(introView({ line: 1, time: 1 }).text, INTRO_LINES[1]);
});

test('the intro plays its lines in order, then ends', () => {
  /** @type {{line: number, time: number} | null} */
  let intro = { line: 0, time: 0 };
  const seen = new Set();
  let ticks = 0;
  while (intro) {
    seen.add(intro.line);
    intro = stepIntro(intro, DT, 0);
    ticks++;
  }
  assert.deepEqual([...seen], [0, 1, 2]);
  const total = INTRO_LINES.reduce((sum, _, i) => sum + introLineSeconds(i), 0);
  assert.ok(Math.abs(ticks * DT - total) < 0.05);
});

test('the first line is the quickest; the middle and last lines hold longer', () => {
  assert.equal(INTRO_HOLDS_S.length, INTRO_LINES.length);
  assert.ok(INTRO_HOLDS_S[0] < INTRO_HOLDS_S[1]);
  assert.ok(INTRO_HOLDS_S[0] < INTRO_HOLDS_S[2]);
});

test('a click skips to the next line; a click on the last line ends the intro', () => {
  assert.deepEqual(stepIntro({ line: 0, time: 0.3 }, DT, 1), { line: 1, time: 0 });
  assert.equal(stepIntro({ line: 2, time: 0.3 }, DT, 1), null);
});

test('a game can open with the intro, then play starts', () => {
  let play = createPlay(5, 1, { intro: true });
  assert.equal(play.phase, 'intro');
  for (let i = 0; i < 3; i++) play = stepPlay(play, CAMERA, HEAD_BOXES, DT, 1);
  assert.equal(play.phase, 'playing');
  assert.equal(play.intro, null);
});

test('no looks count during the intro', () => {
  const play = createPlay(5, 1, { intro: true });
  // Even fully zoomed in on an animal, the meter must not fill behind the intro.
  const a = play.animals[0];
  const zoom = (0.5 * 704) / 16;
  const cam = { ...CAMERA, zoom, targetZoom: zoom, x: a.x, y: a.y - 8 };
  let p = play;
  for (let i = 0; i < 120; i++) p = stepPlay(p, cam, HEAD_BOXES, DT);
  assert.ok(p.animals.every((x) => x.lookMeter === 0 && !x.lookedAt));
});

test('the lose screen tallies the whole game and lists every look', () => {
  const play = {
    ...createPlay(5, 2),
    phase: /** @type {const} */ ('lost'),
    log: [
      { kind: /** @type {const} */ ('horse'), breed: /** @type {const} */ ('A') },
      { kind: /** @type {const} */ ('goat'), breed: /** @type {const} */ ('B') },
      { kind: /** @type {const} */ ('horse'), breed: /** @type {const} */ ('C') },
    ],
  };
  const model = endModel(play);
  assert.equal(model.title, LOSE_TEXT);
  assert.match(LOSE_TEXT, /^Sorry kid, but you don't have what it takes/);
  assert.deepEqual(model.stats, [
    { label: 'Horses looked at', value: 2 },
    { label: 'Non-horses looked at', value: 1 },
    { label: 'Level reached', value: 2 },
  ]);
  assert.deepEqual(
    model.chips.map((c) => c.label),
    ['Friesian', 'Goat', 'Camarillo White'],
  );
});

test('the win screen shows the DESIGN.md line', () => {
  const model = endModel({ ...createPlay(5, 3), phase: 'won' });
  assert.equal(model.title, WIN_TEXT);
  assert.equal(WIN_TEXT, "That's some damn fine horse looking!");
});

test('end-screen previews are lost or won games with a sample log', () => {
  const lost = createEndPreview(5, 'lost');
  assert.equal(lost.phase, 'lost');
  assert.equal(lost.nonHorsesTotal, MAX_STRIKES);
  assert.equal(endModel(lost).chips.length, 3 + MAX_STRIKES);
  const won = createEndPreview(5, 'won');
  assert.equal(won.phase, 'won');
  assert.equal(won.level, 3);
  // A finished game stays finished.
  assert.equal(stepPlay(lost, CAMERA, HEAD_BOXES, DT).phase, 'lost');
});
