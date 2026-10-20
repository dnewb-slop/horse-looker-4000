// @ts-check
// Placeholder art for the non-horses, built from plain shapes until milestone 8 brings real art.
// Shapes are laid out in world units on the shared 24 × 16 creature box, facing right with the
// ground at y = 16, and rasterized at each tier's density.
//
// Telltales follow DESIGN.md: centaurs, reverse centaurs, robot horses and horse suits use the
// plain horse grid at Far, so the player must zoom to Mid to tell them apart. Goats and sheep
// differ in body shape from Far on.
//
// Keys: the breed palette's (o outline, B coat, b shade, w highlight, M mane and hair, h hooves,
// e eye) plus LOOKALIKE_KEYS: S skin, T shirt, P trousers, R robot metal, r robot joints,
// K sneakers.

import { HORSE_HEIGHT, HORSE_WIDTH } from '../../game/config.js';
import { createRaster, inEllipse, inPolygon } from '../raster.js';
import { HORSE } from './horse.js';

/** Grid pixels per world unit, matching TIER_DENSITY in ../sprites.js. */
const DENSITY = { far: 0.5, mid: 1, near: 2 };

/**
 * @typedef {object} Pen draws in world units on a raster at some density
 * @property {(x0: number, y0: number, x1: number, y1: number, key: string) => void} rect
 * @property {(cx: number, cy: number, rx: number, ry: number, key: string) => void} ellipse
 * @property {(points: [number, number][], key: string) => void} polygon
 */

/**
 * Rasterize a shape drawing at one tier, then trace its outline.
 * @param {(pen: Pen) => void} draw
 * @param {'far' | 'mid' | 'near'} tier
 */
function render(draw, tier) {
  const d = DENSITY[tier];
  const r = createRaster(HORSE_WIDTH * d, HORSE_HEIGHT * d);
  draw({
    rect: (x0, y0, x1, y1, key) => r.fillRect(x0 * d, y0 * d, x1 * d, y1 * d, key),
    ellipse: (cx, cy, rx, ry, key) =>
      r.fillWhere((x, y) => inEllipse(x / d, y / d, cx, cy, rx, ry), key),
    polygon: (points, key) => r.fillWhere((x, y) => inPolygon(x / d, y / d, points), key),
  });
  r.outline('o');
  return r.rows();
}

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

/** @param {Pen} p */
function drawGoat(p) {
  p.rect(4, 7, 6, 9, 'b'); // tail
  p.ellipse(11, 9.5, 6.5, 3, 'B');
  p.rect(5.5, 10.5, 16.5, 12.5, 'b');
  for (const x of [6, 9, 13, 15.5]) {
    p.rect(x, 11.5, x + 2, 15, 'b');
    p.rect(x, 15, x + 2, 16, 'h');
  }
  p.polygon(
    [
      [15, 9],
      [17, 4.5],
      [19.5, 4.5],
      [18, 10],
    ],
    'B',
  );
  p.ellipse(20, 5.5, 3, 1.8, 'B');
  p.polygon(
    [
      [17.5, 4.5],
      [16, 1],
      [19, 4],
    ],
    'h',
  ); // horns
  p.rect(20.5, 6.5, 22, 9, 'M'); // beard
  p.rect(20, 4.5, 21, 5.5, 'e');
}

/** @param {Pen} p */
function drawSheep(p) {
  for (const x of [6, 9, 13.5, 16]) p.rect(x, 12, x + 1.5, 16, 'h');
  p.ellipse(11.5, 9, 8, 4.5, 'B');
  p.ellipse(10, 7.5, 5, 2.2, 'w');
  p.ellipse(20.5, 8, 2.6, 2, 'h'); // dark face
  p.rect(18, 6, 19.5, 7.5, 'h'); // ear
}

/** A horse body and legs without a head or neck, for the centaur. @param {Pen} p */
function drawHorseBody(p) {
  p.polygon(
    [
      [4, 7],
      [1.5, 9],
      [2.5, 12.5],
      [4.5, 9.5],
    ],
    'M',
  ); // tail
  p.ellipse(10.5, 8.8, 6.8, 2.8, 'B');
  for (const x of [5, 7.5, 13, 15]) {
    p.rect(x, 10.5, x + 2, 15, 'b');
    p.rect(x, 15, x + 2, 16, 'h');
  }
}

/** @param {Pen} p */
function drawCentaur(p) {
  drawHorseBody(p);
  p.rect(15, 3.5, 18.5, 9, 'S'); // upright human torso
  p.rect(18, 5, 20.5, 6.5, 'S'); // arm reaching forward
  p.ellipse(16.8, 2.2, 1.6, 1.6, 'S');
  p.rect(15, 0.5, 18.5, 1.8, 'M'); // hair
  p.rect(17.5, 1.8, 18, 2.3, 'e');
}

/** @param {Pen} p */
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
 * @param {(pen: Pen) => void} draw
 * @param {{x: number, y: number, w: number, h: number}} headBox
 * @returns {import('../sprites.js').CreatureArt}
 */
function shapes(draw, headBox) {
  return {
    far: render(draw, 'far'),
    mid: render(draw, 'mid'),
    near: render(draw, 'near'),
    headBox,
  };
}

export const GOAT = shapes(drawGoat, { x: 0.65, y: 0.05, w: 0.3, h: 0.45 });
export const SHEEP = shapes(drawSheep, { x: 0.72, y: 0.35, w: 0.25, h: 0.3 });

export const CENTAUR = {
  ...shapes(drawCentaur, { x: 0.6, y: 0, w: 0.2, h: 0.3 }),
  far: HORSE.far,
};

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
