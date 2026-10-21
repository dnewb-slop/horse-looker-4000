// @ts-check
// Which frame an animal shows: standing, the walk frame, grazing with its head down, or a horse
// rearing up or a horse suit's front man showing his own head when it is looked at. Pure, so the renderer and looked-at detection agree on where
// the head is.

import {
  GRAZE_LOOK_UP_S,
  REACTION_S,
  REAR_S,
  UNMASK_DELAY_S,
  UNMASK_S,
  WALK_FRAME_RATE,
} from './config.js';

/**
 * @typedef {'stand' | 'walk' | 'graze' | 'rear' | 'unmask'} Pose
 * @typedef {import('./detect.js').HeadBox} HeadBox
 * @typedef {{stand: HeadBox, graze: HeadBox}} PoseHeadBoxes where the head is standing (and
 *   walking, which only moves the legs) and grazing
 */

/**
 * Walking swaps between the standing frame and the walk frame; a grazing animal keeps its head
 * down until just before it walks off. Just looked at, a horse rears up and then stands while it
 * finishes its line; the men in a horse suit stand while the front one lifts the horse head off
 * and puts it back; every other animal stands, head up, to say its line.
 * @param {import('./world.js').Animal} animal
 * @returns {Pose}
 */
export function animalPose(animal) {
  if (animal.reactTime > 0) {
    const t = REACTION_S - animal.reactTime;
    if (animal.kind === 'horse' && t < REAR_S) return 'rear';
    if (animal.kind === 'horseSuit' && t >= UNMASK_DELAY_S && t < UNMASK_DELAY_S + UNMASK_S) {
      return 'unmask';
    }
    return 'stand';
  }
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
