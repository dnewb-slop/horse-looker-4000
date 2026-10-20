// @ts-check
// Placeholder art for the look-alikes still waiting on milestone 8: reverse centaurs, robot
// horses and horse suits. Goats, sheep and centaurs have their own files.
//
// Telltales follow DESIGN.md: these use the plain horse grid at Far, so the player must zoom to
// Mid to tell them apart.
//
// Keys: the breed palette's (o outline, B coat, b shade, w highlight, M mane and hair, h hooves,
// e eye) plus LOOKALIKE_KEYS: S skin, T shirt, P trousers, R robot metal, r robot joints,
// K sneakers.

import { HORSE } from './horse.js';
import { drawShapes } from './pen.js';

/**
 * The horse grid with keys swapped in its legs: rows from `fromY` (a fraction of the height)
 * down. Mane and tail pixels in those rows are left alone.
 * @param {string[]} rows
 * @param {number} fromY
 * @param {Record<string, string>} swap
 */
function recolorLegs(rows, fromY, swap) {
  const start = Math.ceil(rows.length * fromY);
  return rows.map((row, y) => (y < start ? row : row.replace(/./g, (k) => swap[k] ?? k)));
}

/** Where a horse's legs start, as a fraction of its sprite height. */
const LEG_TOP = 0.65;

/** @param {import('./pen.js').Pen} p */
function drawReverseCentaur(p) {
  for (const x of [8.5, 11.5]) {
    p.rect(x, 9.5, x + 2, 15, 'P');
    p.rect(x, 15, x + 2.5, 16, 'h');
  }
  p.rect(7, 5, 8.5, 9.5, 'S'); // arms
  p.rect(13.5, 5, 15, 9.5, 'S');
  p.rect(8, 4.5, 14, 10, 'T'); // shirt
  p.polygon(
    [
      [10, 5],
      [13.5, 5],
      [17.5, 1.5],
      [15.5, 0.5],
    ],
    'B',
  ); // a long horse neck
  p.polygon(
    [
      [11, 4.5],
      [15, 0.5],
      [14, 0.5],
      [10.5, 4],
    ],
    'M',
  ); // mane
  p.ellipse(18.5, 2, 3.3, 1.4, 'B'); // horse head
  p.rect(18, 1, 19, 2, 'e');
}

/**
 * @param {(pen: import('./pen.js').Pen) => void} draw
 * @param {{x: number, y: number, w: number, h: number}} headBox
 * @returns {import('../sprites.js').CreatureArt}
 */
function shapes(draw, headBox) {
  const tier = (/** @type {'far' | 'mid' | 'near'} */ t) => drawShapes(draw, t);
  return { far: tier('far'), mid: tier('mid'), near: tier('near'), headBox };
}

export const REVERSE_CENTAUR = {
  ...shapes(drawReverseCentaur, { x: 0.62, y: 0, w: 0.33, h: 0.25 }),
  far: HORSE.far,
};

export const ROBOT_HORSE = {
  far: HORSE.far,
  mid: recolorLegs(HORSE.mid, LEG_TOP, { b: 'R', h: 'r' }),
  near: recolorLegs(HORSE.near, LEG_TOP, { b: 'R', h: 'r' }),
  headBox: HORSE.headBox,
};

export const HORSE_SUIT = {
  far: HORSE.far,
  mid: recolorLegs(HORSE.mid, LEG_TOP, { h: 'K' }),
  near: recolorLegs(HORSE.near, LEG_TOP, { h: 'K' }),
  headBox: HORSE.headBox,
};
