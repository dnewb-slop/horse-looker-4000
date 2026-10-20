// @ts-check
// A small datacenter: a long, low, pale building with cooling units on the roof.
//
// Keys: o outline, S siding, s siding shade, K dark (vents, doors, fans), U rooftop units,
// A status lights.

import { createRaster } from '../raster.js';

/**
 * @param {number} w grid width in pixels
 * @param {number} h grid height in pixels
 * @returns {string[]}
 */
export function drawDatacenter(w, h) {
  const r = createRaster(w, h);
  const t = Math.max(1, Math.round(w / 120));
  const roof = h * 0.3;

  // Rooftop cooling units, each with a dark fan.
  const units = 6;
  for (let i = 0; i < units; i++) {
    const x0 = w * (0.08 + i * 0.145);
    const x1 = x0 + w * 0.1;
    r.fillRect(x0, h * 0.06, x1, roof, 'U');
    const fx = (x0 + x1) / 2;
    r.fillRect(fx - w * 0.02, h * 0.1, fx + w * 0.02, h * 0.1 + Math.max(1, h * 0.06), 'K');
  }

  // Walls with a parapet and horizontal panel seams.
  r.fillRect(w * 0.02, roof, w * 0.98, h, 'S');
  r.fillRect(w * 0.02, roof, w * 0.98, roof + t * 2, 's');
  for (let y = roof + h * 0.2; y < h - t; y += h * 0.18)
    r.fillRect(w * 0.02, y, w * 0.98, y + t, 's');
  r.fillRect(w * 0.9, roof, w * 0.98, h, 's');

  // A strip of louvered vents and a loading door with status lights.
  const ventTop = h * 0.5;
  for (let x = w * 0.06; x < w * 0.7; x += w * 0.05) {
    r.fillRect(x, ventTop, x + w * 0.03, ventTop + h * 0.14, 'K');
  }
  r.fillRect(w * 0.76, h * 0.55, w * 0.86, h, 'K');
  const lamp = Math.max(1, Math.round(t * 1.5));
  r.fillRect(w * 0.735, h * 0.58, w * 0.735 + lamp, h * 0.58 + lamp, 'A');
  r.fillRect(w * 0.735, h * 0.66, w * 0.735 + lamp, h * 0.66 + lamp, 'A');

  r.outline('o');
  return r.rows();
}
