// @ts-check
// A California live oak: a broad, rounded, low-spreading canopy on a short dark trunk.
//
// Keys: o outline, G leaves, g leaf shade, L leaf highlight, T trunk, t trunk shade.

import { createRaster, inEllipse, noise } from '../raster.js';

/** Canopy clumps as [center x, center y, radius x, radius y], in fractions of the sprite box. */
const CLUMPS = [
  [0.16, 0.52, 0.15, 0.2],
  [0.31, 0.33, 0.2, 0.28],
  [0.5, 0.22, 0.23, 0.24],
  [0.69, 0.32, 0.2, 0.28],
  [0.85, 0.52, 0.14, 0.19],
  [0.5, 0.48, 0.42, 0.24],
];

/**
 * @param {number} w grid width in pixels
 * @param {number} h grid height in pixels
 * @returns {string[]}
 */
export function drawOak(w, h) {
  const r = createRaster(w, h);
  const cx = w * 0.5;

  // Trunk, flaring at the base, with two low branches into the canopy.
  r.fillWhere((x, y) => {
    const fy = y / h;
    if (fy < 0.55) return false;
    const half = w * (0.04 + (fy - 0.55) * 0.08);
    return Math.abs(x - cx) < half;
  }, 'T');
  r.fillWhere((x, y) => {
    const fy = y / h;
    if (fy < 0.55 || fy > 0.78) return false;
    const fx = (x - cx) / w;
    return Math.abs(Math.abs(fx) - (0.78 - fy) * 1.1) < 0.018 + 0.6 / w;
  }, 'T');
  r.fillWhere((x, y) => r.get(Math.floor(x), Math.floor(y)) === 'T' && x > cx + w * 0.01, 't');

  /** @param {number} x @param {number} y */
  const clumpAt = (x, y) =>
    CLUMPS.findIndex(([px, py, rx, ry]) => inEllipse(x / w, y / h, px, py, rx, ry));

  r.fillWhere((x, y) => clumpAt(x, y) >= 0, 'G');
  // Shade the underside of the canopy and the lower half of each clump; dither the edges.
  r.fillWhere((x, y) => {
    const i = clumpAt(x, y);
    if (i < 0) return false;
    const [, py, , ry] = CLUMPS[i];
    const below = (y / h - py) / ry; // -1 at the clump's top, 1 at its bottom
    return below > 0.35 + noise(Math.floor(x), Math.floor(y)) * 0.4 || y / h > 0.62;
  }, 'g');
  // Sunlit tops of clumps.
  r.fillWhere((x, y) => {
    const i = clumpAt(x, y);
    if (i < 0) return false;
    const [px, py, rx, ry] = CLUMPS[i];
    const up = (py - y / h) / ry;
    const left = (px - x / w) / rx;
    return up + left * 0.3 > 0.45 + noise(Math.floor(x) + 7, Math.floor(y)) * 0.35;
  }, 'L');

  r.outline('o');
  return r.rows();
}
