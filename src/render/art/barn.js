// @ts-check
// A red gambrel-roof barn, seen from the front. Drawn in code at any size so it keeps the same
// pixel density as the animals at every zoom tier.
//
// Keys: o outline, R red wall, r red shade, W white trim, D dark opening, k roof.

import { createRaster, inPolygon } from '../raster.js';

/**
 * @param {number} w grid width in pixels
 * @param {number} h grid height in pixels
 * @returns {string[]}
 */
export function drawBarn(w, h) {
  const r = createRaster(w, h);
  const t = Math.max(1, Math.round(w / 60)); // trim thickness
  const eave = h * 0.45;
  /** @type {[number, number][]} */
  const gable = [
    [w * 0.08, eave],
    [w * 0.2, h * 0.17],
    [w * 0.5, h * 0.03],
    [w * 0.8, h * 0.17],
    [w * 0.92, eave],
  ];
  const roofDepth = Math.max(1, h * 0.07);

  r.fillWhere((x, y) => inPolygon(x, y, gable), 'R');
  // The roof is the band along the gable's upper edge: cells whose point roofDepth above is outside.
  r.fillWhere((x, y) => inPolygon(x, y, gable) && !inPolygon(x, y - roofDepth, gable), 'k');
  r.fillRect(w * 0.1, eave, w * 0.9, h, 'R');
  // Shade under the eaves and along the right wall.
  r.fillRect(w * 0.1, eave, w * 0.9, eave + t, 'r');
  r.fillRect(w * 0.84, eave, w * 0.9, h, 'r');
  // White corner trim.
  r.fillRect(w * 0.1, eave, w * 0.1 + t, h, 'W');
  r.fillRect(w * 0.9 - t, eave, w * 0.9, h, 'W');

  // Hayloft door in the gable.
  framedOpening(r, w * 0.42, h * 0.2, w * 0.58, h * 0.38, t);
  // Big door with a white X brace.
  const [dx0, dy0, dx1, dy1] = [w * 0.34, h * 0.58, w * 0.66, h];
  r.fillRect(dx0, dy0, dx1, dy1, 'r');
  r.fillWhere((x, y) => {
    if (x < dx0 || x >= dx1 || y < dy0 || y >= dy1) return false;
    const u = (x - dx0) / (dx1 - dx0);
    const v = (y - dy0) / (dy1 - dy0);
    const near = (t * 0.8) / (dx1 - dx0);
    return Math.abs(u - v) < near || Math.abs(u + v - 1) < near;
  }, 'W');
  r.fillRect(dx0, dy0, dx1, dy0 + t, 'W');
  r.fillRect(dx0, dy0, dx0 + t, dy1, 'W');
  r.fillRect(dx1 - t, dy0, dx1, dy1, 'W');
  r.fillRect((dx0 + dx1) / 2 - t / 2, dy0, (dx0 + dx1) / 2 + t / 2, dy1, 'W');

  r.outline('o');
  return r.rows();
}

/**
 * @param {import('../raster.js').Raster} r
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} t
 */
function framedOpening(r, x0, y0, x1, y1, t) {
  r.fillRect(x0, y0, x1, y1, 'W');
  r.fillRect(x0 + t, y0 + t, x1 - t, y1 - t, 'D');
}
