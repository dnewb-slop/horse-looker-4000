// @ts-check
// Looked-at detection: each animal's look meter fills while the player is zoomed in on it.
// Pure functions: they take the camera and animals and return new animals.

import { worldToScreen } from './camera.js';
import {
  HORSE_HEIGHT,
  HORSE_WIDTH,
  LOOK_DRAIN_MULTIPLIER,
  LOOK_FILL_S,
  LOOK_MIN_PX,
} from './config.js';
import { headBoxFor } from './pose.js';
import { SCENERY_SIZE, ridgeY } from './world.js';

/**
 * Where the head is, as fractions of the sprite box for a sprite facing right.
 * @typedef {{x: number, y: number, w: number, h: number}} HeadBox
 */

/**
 * Center of an animal's head in world units, mirrored when it faces left.
 * @param {import('./world.js').Animal} animal
 * @param {HeadBox} box
 */
export function headCenter(animal, box) {
  const fx = animal.facing === 1 ? box.x + box.w / 2 : 1 - box.x - box.w / 2;
  return {
    x: animal.x - HORSE_WIDTH / 2 + fx * HORSE_WIDTH,
    y: animal.y - HORSE_HEIGHT + (box.y + box.h / 2) * HORSE_HEIGHT,
  };
}

/**
 * A head is hidden when the center of its head box is behind a hill in front or behind a scenery
 * object drawn in front of the animal. Scenery counts as its full rectangle.
 * @param {import('./world.js').Animal} animal
 * @param {HeadBox} box
 * @param {import('./world.js').Hill[]} hills
 * @param {import('./world.js').Scenery[]} scenery
 */
export function headVisible(animal, box, hills, scenery) {
  const head = headCenter(animal, box);
  for (let j = animal.hill + 1; j < hills.length; j++) {
    if (head.y > ridgeY(hills[j], head.x)) return false;
  }
  return !scenery.some((s) => {
    const inFront = s.hill > animal.hill || (s.hill === animal.hill && s.y > animal.y);
    if (!inFront) return false;
    const { width, height } = SCENERY_SIZE[s.kind];
    return Math.abs(head.x - s.x) < width / 2 && head.y > s.y - height && head.y < s.y;
  });
}

/**
 * Whether an animal's meter should fill right now: drawn at the Mid tier or closer, its center
 * on screen, and its head visible.
 * @param {import('./world.js').Animal} animal
 * @param {import('./camera.js').Camera} cam
 * @param {HeadBox} box
 * @param {import('./world.js').Hill[]} hills
 * @param {import('./world.js').Scenery[]} scenery
 */
export function isLooking(animal, cam, box, hills, scenery) {
  if (HORSE_HEIGHT * cam.zoom < LOOK_MIN_PX) return false;
  const c = worldToScreen(cam, animal.x, animal.y - HORSE_HEIGHT / 2);
  if (c.x < 0 || c.x >= cam.viewWidth || c.y < 0 || c.y >= cam.viewHeight) return false;
  return headVisible(animal, box, hills, scenery);
}

/**
 * Fill or drain every look meter by dt seconds. A full meter marks the animal looked at, once.
 * @param {import('./world.js').Animal[]} animals
 * @param {import('./camera.js').Camera} cam
 * @param {Record<import('./world.js').Animal['kind'], import('./pose.js').PoseHeadBoxes>} headBoxes
 * @param {import('./world.js').Hill[]} hills
 * @param {import('./world.js').Scenery[]} scenery
 * @param {number} dt
 * @returns {{animals: import('./world.js').Animal[], looked: import('./world.js').Animal[]}}
 *   `looked` lists animals that became looked at during this step
 */
export function stepLooks(animals, cam, headBoxes, hills, scenery, dt) {
  /** @type {import('./world.js').Animal[]} */
  const looked = [];
  const fill = dt / LOOK_FILL_S;
  const next = animals.map((a) => {
    if (a.lookedAt) return a;
    const looking = isLooking(a, cam, headBoxFor(a, headBoxes[a.kind]), hills, scenery);
    const lookMeter = looking
      ? Math.min(1, a.lookMeter + fill)
      : Math.max(0, a.lookMeter - fill * LOOK_DRAIN_MULTIPLIER);
    if (lookMeter === a.lookMeter) return a;
    if (lookMeter < 1) return { ...a, lookMeter };
    const done = { ...a, lookMeter, lookedAt: true };
    looked.push(done);
    return done;
  });
  return { animals: next, looked };
}
