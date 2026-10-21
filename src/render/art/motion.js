// @ts-check
// Animation frames made from a creature's standing grid, so it walks and grazes with its own
// colors and details. A walk frame scissors the legs apart. A graze frame turns the head and
// neck a quarter turn down, an exact pixel rotation that keeps the art crisp; the horse and the
// look-alikes built on it use its hand-drawn graze frame instead.

import { editGrid, eraseFromGrid } from './pen.js';

/** Grid pixels per world unit, matching TIER_DENSITY in ../sprites.js. */
const DENSITY = { mid: 1, near: 2 };

/** How far a hoof swings in the walk frame, in grid pixels. */
const SWING_PX = { mid: 1, near: 2 };

/**
 * @typedef {'mid' | 'near'} MotionTier
 * @typedef {object} LegGroup legs that swing together, as a world-unit x range
 * @property {number} x0
 * @property {number} x1
 * @property {1 | -1} swing 1 swings forward (toward the head), -1 back
 * @typedef {object} WalkRig
 * @property {number} legTop world y where the legs leave the body; they bend below it
 * @property {LegGroup[]} groups
 * @typedef {object} GrazeRig turns a head and neck down, for creatures without a hand-drawn graze
 * @property {(wx: number, wy: number) => boolean} head the head and neck, in world units
 * @property {[number, number]} pivot whole world units, so the turn lands on whole pixels
 * @property {[number, number]} shift whole world units to move the turned head after turning
 */

/**
 * The walk frame: each leg group leans its way, by nothing at the top of the legs up to
 * SWING_PX at the hooves.
 * @param {string[]} rows
 * @param {MotionTier} tier
 * @param {WalkRig} rig
 */
export function walkFrame(rows, tier, rig) {
  const d = DENSITY[tier];
  const bottom = rows.length / d;
  return rows.map((row, y) => {
    const wy = (y + 0.5) / d;
    if (wy < rig.legTop) return row;
    const t = (wy - rig.legTop) / (bottom - rig.legTop);
    const cells = [...row];
    const out = [...row];
    for (const g of rig.groups) {
      const [from, to] = [Math.round(g.x0 * d), Math.round(g.x1 * d)];
      for (let x = from; x < to; x++) out[x] = '.';
    }
    for (const g of rig.groups) {
      const [from, to] = [Math.round(g.x0 * d), Math.round(g.x1 * d)];
      // Round the size, not the signed offset, so both directions swing alike.
      const offset = g.swing * Math.round(t * SWING_PX[tier]);
      for (let x = from; x < to; x++) {
        if (cells[x] !== '.' && x + offset >= 0 && x + offset < out.length)
          out[x + offset] = cells[x];
      }
    }
    return out.join('');
  });
}

/**
 * The graze frame: the head and neck are cut out, turned a quarter turn clockwise about the
 * pivot (so a head facing right ends up facing down), moved by `shift`, and pasted back in front.
 * @param {string[]} rows
 * @param {MotionTier} tier
 * @param {GrazeRig} rig
 */
export function grazeFrame(rows, tier, rig) {
  const d = DENSITY[tier];
  const head = editGrid(rows, tier, (wx, wy) => (rig.head(wx, wy) ? undefined : '.'));
  const body = eraseFromGrid(rows, tier, (wx, wy) => rig.head(wx, wy));
  const [px, py] = [rig.pivot[0] * d, rig.pivot[1] * d];
  const [sx, sy] = [rig.shift[0] * d, rig.shift[1] * d];
  const turned = body.map((row, y) =>
    [...row]
      .map((k, x) => {
        // Undo the shift, then turn back a quarter turn to find the source cell.
        const [ux, uy] = [x - sx, y - sy];
        const srcX = px - py + uy;
        const srcY = py + px - ux - 1;
        const src = head[srcY]?.[srcX] ?? '.';
        return src === '.' ? k : src;
      })
      .join(''),
  );
  return eraseFromGrid(turned, tier, () => false);
}

/**
 * Where the head box ends up in the graze frame, as fractions of the sprite box.
 * @param {{x: number, y: number, w: number, h: number}} box
 * @param {GrazeRig} rig
 * @param {number} width world units of the sprite box
 * @param {number} height
 */
export function grazeHeadBox(box, rig, width, height) {
  const [px, py] = rig.pivot;
  const [x0, y0, x1, y1] = [
    box.x * width,
    box.y * height,
    (box.x + box.w) * width,
    (box.y + box.h) * height,
  ];
  // A quarter turn clockwise maps (x, y) to (px - (y - py), py + (x - px)).
  const nx0 = px - (y1 - py) + rig.shift[0];
  const nx1 = px - (y0 - py) + rig.shift[0];
  const ny0 = py + (x0 - px) + rig.shift[1];
  const ny1 = py + (x1 - px) + rig.shift[1];
  const clamp = (/** @type {number} */ v) => Math.min(1, Math.max(0, v));
  const x = clamp(nx0 / width);
  const y = clamp(ny0 / height);
  return { x, y, w: clamp(nx1 / width) - x, h: clamp(ny1 / height) - y };
}

/**
 * @typedef {object} RearRig tips a creature up onto its hind legs, for rearing up
 * @property {[number, number]} pivot world point the body turns about: the hip
 * @property {number} degrees how far the front lifts
 * @property {(wx: number, wy: number) => boolean} planted the hind legs, in world units, which stay
 *   where they are
 */

/**
 * The rearing frame: everything but the planted hind legs turns about the hip so the front lifts,
 * by nearest-neighbor sampling so every pixel keeps its palette color. Turning pixel art leaves
 * gaps in its outline, so any empty cell beside a colored one is outlined again. The grid grows
 * taller to fit the raised head; it keeps its width and the hooves stay on the bottom row.
 * @param {string[]} rows
 * @param {MotionTier} tier
 * @param {RearRig} rig
 */
export function rearFrame(rows, tier, rig) {
  const d = DENSITY[tier];
  const width = rows[0].length;
  const legs = editGrid(rows, tier, (wx, wy) => (rig.planted(wx, wy) ? undefined : '.'));
  const body = eraseFromGrid(rows, tier, (wx, wy) => rig.planted(wx, wy));
  const [px, py] = [rig.pivot[0] * d, rig.pivot[1] * d];
  const a = (rig.degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(a), Math.sin(a)];
  // Head room: how far above the pivot the turned sprite reaches.
  let reach = 0;
  body.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      if (row[x] === '.') continue;
      const [dx, dy] = [x + 0.5 - px, y + 0.5 - py];
      reach = Math.max(reach, -(dy * cos - dx * sin));
    }
  });
  const height = Math.max(rows.length, Math.ceil(reach + (rows.length - py)));
  const top = height - rows.length;
  // Each output cell samples the source cell that turns onto it.
  const turned = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const [dx, dy] = [x + 0.5 - px, y - top + 0.5 - py];
      const sx = Math.floor(px + dx * cos - dy * sin);
      const sy = Math.floor(py + dx * sin + dy * cos);
      // The planted legs' colors stay on top, so the turned body's outline can't cut them.
      const leg = legs[y - top]?.[x] ?? '.';
      if (leg !== '.' && leg !== 'o') return leg;
      const k = body[sy]?.[sx] ?? '.';
      return k === '.' ? leg : k;
    }),
  );
  /** @param {number} x @param {number} y */
  const filled = (x, y) => {
    const k = turned[y]?.[x];
    return k !== undefined && k !== '.' && k !== 'o';
  };
  return turned.map((row, y) =>
    row
      .map((k, x) =>
        k === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))
          ? 'o'
          : k,
      )
      .join(''),
  );
}
