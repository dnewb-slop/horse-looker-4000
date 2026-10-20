// @ts-check
// Seeded random numbers. All game randomness goes through here so a seed reproduces a level.

/**
 * Create a mulberry32 generator.
 * @param {number} seed any 32-bit integer
 * @returns {() => number} returns floats in [0, 1)
 */
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A float in [min, max).
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 */
export function randomBetween(rng, min, max) {
  return min + rng() * (max - min);
}
