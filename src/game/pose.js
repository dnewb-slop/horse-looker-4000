// @ts-check
// Which frame an animal shows: standing, the walk frame or grazing with its head down. Pure, so
// the renderer and looked-at detection agree on where the head is.

import { GRAZE_LOOK_UP_S, WALK_FRAME_RATE } from './config.js';

/**
 * @typedef {'stand' | 'walk' | 'graze'} Pose
 * @typedef {import('./detect.js').HeadBox} HeadBox
 * @typedef {{stand: HeadBox, graze: HeadBox}} PoseHeadBoxes where the head is standing (and
 *   walking, which only moves the legs) and grazing
 */

/**
 * Walking swaps between the standing frame and the walk frame; a grazing animal keeps its head
 * down until just before it walks off.
 * @param {import('./world.js').Animal} animal
 * @returns {Pose}
 */
export function animalPose(animal) {
  if (animal.mode === 'walk') {
    return Math.floor(animal.walkTime * WALK_FRAME_RATE) % 2 === 1 ? 'walk' : 'stand';
  }
  return animal.grazing && animal.idleTime > GRAZE_LOOK_UP_S ? 'graze' : 'stand';
}

/**
 * Where an animal's head is right now, as a head box.
 * @param {import('./world.js').Animal} animal
 * @param {PoseHeadBoxes} boxes
 */
export function headBoxFor(animal, boxes) {
  return animalPose(animal) === 'graze' ? boxes.graze : boxes.stand;
}
