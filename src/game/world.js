// @ts-check
// World generation. For now: the rolling hills of the pasture. Animals and scenery come later.

import {
  HILL_AMPLITUDE_MAX,
  HILL_AMPLITUDE_MIN,
  HILL_COUNT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { randomBetween } from './rng.js';

/**
 * @typedef {object} Wave
 * @property {number} frequency radians per world unit
 * @property {number} phase
 * @property {number} amplitude world units
 */

/**
 * One band of hillside. It fills from its ridge line down to the bottom of the pasture.
 * @typedef {object} Hill
 * @property {number} baseY average ridge height in world units
 * @property {Wave[]} waves summed to shape the ridge
 * @property {number} shade index into the palette's hill colors, back to front
 */

/**
 * Generate the hills, ordered back (top of the pasture) to front (bottom).
 * @param {() => number} rng
 * @returns {Hill[]}
 */
export function generateHills(rng) {
  /** @type {Hill[]} */
  const hills = [];
  for (let i = 0; i < HILL_COUNT; i++) {
    // The first ridge sits above the pasture so the top edge is fully covered. Its waves sum to
    // at most 1.55 × the amplitude (1 + 1/2^1.5 + 1/3^1.5), so 2 × the maximum is always enough.
    const baseY = i === 0 ? -2 * HILL_AMPLITUDE_MAX : (WORLD_HEIGHT * i) / HILL_COUNT;
    const amplitude = randomBetween(rng, HILL_AMPLITUDE_MIN, HILL_AMPLITUDE_MAX);
    /** @type {Wave[]} */
    const waves = [1, 2.3, 5.1].map((multiple, k) => ({
      // About one to three long swells across the pasture, plus smaller ripples.
      frequency: ((2 * Math.PI) / WORLD_WIDTH) * multiple * randomBetween(rng, 0.8, 1.6),
      phase: randomBetween(rng, 0, 2 * Math.PI),
      amplitude: amplitude / (k + 1) ** 1.5,
    }));
    hills.push({ baseY, waves, shade: i });
  }
  return hills;
}

/**
 * Ridge height of a hill at world x.
 * @param {Hill} hill
 * @param {number} x
 */
export function ridgeY(hill, x) {
  let y = hill.baseY;
  for (const w of hill.waves) y += w.amplitude * Math.sin(w.frequency * x + w.phase);
  return y;
}
