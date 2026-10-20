// @ts-check
// Drawing creature art from shapes. Shapes are laid out in world units on the shared 24 × 16
// creature box, facing right with the ground at y = 16, and rasterized at each tier's density.

import { HORSE_HEIGHT, HORSE_WIDTH } from '../../game/config.js';
import { createRaster, inEllipse, inPolygon } from '../raster.js';
import { HORSE } from './horse.js';

/** Grid pixels per world unit, matching TIER_DENSITY in ../sprites.js. */
const DENSITY = { far: 0.5, mid: 1, near: 2 };

/**
 * @typedef {'far' | 'mid' | 'near'} GridTier
 * @typedef {object} Pen draws in world units on a raster at some density
 * @property {(x0: number, y0: number, x1: number, y1: number, key: string) => void} rect
 * @property {(cx: number, cy: number, rx: number, ry: number, key: string) => void} ellipse
 * @property {(points: [number, number][], key: string) => void} polygon
 */

/**
 * @param {import('../raster.js').Raster} r
 * @param {number} d density
 * @returns {Pen}
 */
function penFor(r, d) {
  return {
    rect: (x0, y0, x1, y1, key) => r.fillRect(x0 * d, y0 * d, x1 * d, y1 * d, key),
    ellipse: (cx, cy, rx, ry, key) =>
      r.fillWhere((x, y) => inEllipse(x / d, y / d, cx, cy, rx, ry), key),
    polygon: (points, key) => r.fillWhere((x, y) => inPolygon(x / d, y / d, points), key),
  };
}

/**
 * Rasterize a shape drawing at one tier, then trace its outline.
 * @param {(pen: Pen) => void} draw
 * @param {GridTier} tier
 */
export function drawShapes(draw, tier) {
  const d = DENSITY[tier];
  const r = createRaster(HORSE_WIDTH * d, HORSE_HEIGHT * d);
  draw(penFor(r, d));
  r.outline('o');
  return r.rows();
}

/**
 * Draw on top of the horse grid with its head and neck removed and its barrel slimmed, so the
 * back sits `drop` world units lower. Used for creatures that are half horse.
 * @param {(pen: Pen) => void} draw
 * @param {'mid' | 'near'} tier
 * @param {number} drop world units to lower the back, taken out of the middle of the barrel
 */
export function drawOnHorseBody(draw, tier, drop) {
  const d = DENSITY[tier];
  const rows = HORSE[tier];
  const cut = Math.round(drop * d);
  const at = Math.round(6.5 * d);
  const blank = '.'.repeat(rows[0].length);
  const src = [...Array(cut).fill(blank), ...rows.slice(0, at), ...rows.slice(at + cut)];
  const r = createRaster(HORSE_WIDTH * d, HORSE_HEIGHT * d);
  src.forEach((row, y) => [...row].forEach((k, x) => r.set(x, y, k)));
  const back = 4.5 + drop;
  for (let y = 0; y < r.height; y++) {
    for (let x = 0; x < r.width; x++) {
      const wx = (x + 0.5) / d;
      const wy = (y + 0.5) / d;
      // Remove the neck above the back line, and the head and jaw in front of the chest.
      if ((wx >= 14.5 && wy < back + 0.7) || (wx >= 19.6 && wy < back + 5.5)) r.set(x, y, '.');
      // The neck's mane becomes coat, so whatever rises from the withers has a clean base.
      else if (wx >= 14 && wy < back + 5.5 && r.get(x, y) === 'M') r.set(x, y, 'B');
    }
  }
  // Close the top of the shoulders where the neck was cut away.
  r.fillWhere(
    (x, y) => x / d >= 14 && x / d < 19.6 && y / d >= back + 0.1 && y / d < back + 1.5,
    'B',
  );
  draw(penFor(r, d));
  r.outline('o');
  return r.rows();
}
