// @ts-check
// Seeded random numbers. All game randomness goes through here so a seed reproduces a level.

/**
 * One mulberry32 step as a pure function, for state that must stay plain data (e.g. each
 * animal carries its own generator state).
 * @param {number} state 32-bit generator state
 * @returns {[number, number]} a float in [0, 1) and the next state
 */
export function rngStep(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/**
 * Create a mulberry32 generator.
 * @param {number} seed any 32-bit integer
 * @returns {() => number} returns floats in [0, 1)
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    const [value, next] = rngStep(state);
    state = next;
    return value;
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
