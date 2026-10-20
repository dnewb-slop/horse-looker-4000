// @ts-check
// The playing state: one pasture with its scenery and animals, and what the player has looked at.
// Until milestone 5 adds the level table and rules, a level is a sandbox of horses.

import { SANDBOX_HORSE_COUNT } from './config.js';
import { stepLooks } from './detect.js';
import { createRng } from './rng.js';
import { generateHills, placeScenery, spawnAnimals, stepAnimals } from './world.js';

/**
 * @typedef {object} Play
 * @property {number} level 1-based
 * @property {import('./world.js').Hill[]} hills
 * @property {import('./world.js').Scenery[]} scenery
 * @property {import('./world.js').Animal[]} animals
 * @property {number[]} lookedAt ids of animals looked at this level, oldest first
 * @property {number} horsesThisLevel
 * @property {number} nonHorsesTotal
 */

/**
 * Generate a level from a seed. The same seed always makes the same level.
 * @param {number} seed
 * @returns {Play}
 */
export function createPlay(seed) {
  const rng = createRng(seed);
  const hills = generateHills(rng);
  const scenery = placeScenery(rng, hills);
  const animals = spawnAnimals(rng, hills, scenery, SANDBOX_HORSE_COUNT, ['A', 'B', 'C']);
  return {
    level: 1,
    hills,
    scenery,
    animals,
    lookedAt: [],
    horsesThisLevel: 0,
    nonHorsesTotal: 0,
  };
}

/**
 * Advance one logic step: animals graze, then look meters update for the camera's view.
 * @param {Play} play
 * @param {import('./camera.js').Camera} cam
 * @param {Record<import('./world.js').Animal['kind'], import('./detect.js').HeadBox>} headBoxes
 * @param {number} dt
 * @returns {Play}
 */
export function stepPlay(play, cam, headBoxes, dt) {
  const grazed = stepAnimals(play.animals, play.hills, play.scenery, dt);
  const { animals, looked } = stepLooks(grazed, cam, headBoxes, play.hills, play.scenery, dt);
  if (looked.length === 0) return { ...play, animals };
  const horses = looked.filter((a) => a.kind === 'horse').length;
  return {
    ...play,
    animals,
    lookedAt: [...play.lookedAt, ...looked.map((a) => a.id)],
    horsesThisLevel: play.horsesThisLevel + horses,
    nonHorsesTotal: play.nonHorsesTotal + looked.length - horses,
  };
}
