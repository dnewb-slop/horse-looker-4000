// @ts-check
// The pasture: rolling hills, scenery placed on them, and grazing animals.
//
// Each hill is a layer. Everything on the pasture stands on exactly one hill, between that hill's
// ridge and the ridge of the hill in front, which would hide it. Animals stay on their own hill
// until milestone 7 adds valleys and ridge crossings.

import {
  ANIMAL_MIN_SPACING,
  BARN_COUNT,
  BARN_HEIGHT,
  BARN_WIDTH,
  DATACENTER_COUNT,
  DATACENTER_HEIGHT,
  DATACENTER_WIDTH,
  GRAZE_DEPTH_SCALE,
  GRAZE_IDLE_MAX_S,
  GRAZE_IDLE_MIN_S,
  GRAZE_WALK_MAX,
  GRAZE_WALK_MIN,
  GRAZE_WALK_SPEED,
  HILL_AMPLITUDE_MAX,
  HILL_AMPLITUDE_MIN,
  HILL_COUNT,
  HORSE_HEIGHT,
  HORSE_WIDTH,
  LOOK_THRESHOLD_MAX,
  LOOK_THRESHOLD_MIN,
  LOOK_THRESHOLD_PEAK,
  OAK_COUNT,
  OAK_HEIGHT,
  OAK_WIDTH,
  SCENERY_FOOTPRINT_DEPTH,
  SLOPE_MARGIN_BOTTOM,
  SLOPE_MARGIN_TOP,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';
import { randomBetween, rngStep } from './rng.js';

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

/**
 * @typedef {'barn' | 'oak' | 'datacenter'} SceneryKind
 * @typedef {import('./levels.js').Breed} Breed
 * @typedef {import('./levels.js').AnimalKind} AnimalKind
 */

/**
 * A scenery object. (x, y) is the bottom center of its sprite, where it meets the ground.
 * @typedef {object} Scenery
 * @property {SceneryKind} kind
 * @property {number} x
 * @property {number} y
 * @property {number} hill index of the hill it stands on
 */

/**
 * An animal. (x, y) is where its feet meet the ground: the bottom center of its sprite.
 * @typedef {object} Animal
 * @property {number} id
 * @property {AnimalKind} kind
 * @property {Breed} breed coat colors: the horse's breed, or the breed a look-alike imitates
 * @property {number} x
 * @property {number} y
 * @property {number} hill index of the hill it stands on
 * @property {1 | -1} facing 1 faces right
 * @property {number} lookThreshold on-screen height needed to look at it, as a fraction of the
 *   viewport height
 * @property {number} lookMeter 0 to 1
 * @property {boolean} lookedAt
 * @property {number} rng this animal's own generator state, so grazing stays pure and seeded
 * @property {'idle' | 'walk'} mode
 * @property {number} idleTime seconds left standing still, while idle
 * @property {number} targetX where it is walking to, while walking
 * @property {number} targetY
 */

/** World sizes of each scenery kind. */
export const SCENERY_SIZE = {
  barn: { width: BARN_WIDTH, height: BARN_HEIGHT },
  oak: { width: OAK_WIDTH, height: OAK_HEIGHT },
  datacenter: { width: DATACENTER_WIDTH, height: DATACENTER_HEIGHT },
};

/** Tries per object before giving up on placing it. */
const PLACEMENT_TRIES = 500;

/**
 * The range of ground y where something standing on a hill is fully visible, across a span of
 * x. Below `bottom` the next hill's crest would cover its feet; above `top` it would float above
 * its own hill. Empty when bottom < top.
 * @param {Hill[]} hills
 * @param {number} hill index
 * @param {number} x center of the span
 * @param {number} halfWidth
 */
export function slopeRange(hills, hill, x, halfWidth) {
  let top = -Infinity;
  let bottom = WORLD_HEIGHT - SLOPE_MARGIN_BOTTOM;
  for (const sx of [x - halfWidth, x, x + halfWidth]) {
    top = Math.max(top, ridgeY(hills[hill], sx) + SLOPE_MARGIN_TOP);
    if (hill + 1 < hills.length) {
      bottom = Math.min(bottom, ridgeY(hills[hill + 1], sx) - SLOPE_MARGIN_BOTTOM);
    }
  }
  return { top, bottom };
}

/**
 * Whether ground point (x, y) on a hill is a valid place for an animal to stand.
 * @param {Hill[]} hills
 * @param {number} hill
 * @param {number} x
 * @param {number} y
 */
function canStand(hills, hill, x, y) {
  if (x < HORSE_WIDTH / 2 || x > WORLD_WIDTH - HORSE_WIDTH / 2) return false;
  if (y < HORSE_HEIGHT) return false;
  const { top, bottom } = slopeRange(hills, hill, x, HORSE_WIDTH / 2);
  return y >= top && y <= bottom;
}

/**
 * Whether an animal's feet at (x, y) would be inside a scenery object's base. Animals pass in
 * front of and behind scenery, never through it.
 * @param {Scenery[]} scenery
 * @param {number} x
 * @param {number} y
 */
export function inSceneryFootprint(scenery, x, y) {
  return scenery.some((s) => {
    const halfWidth = SCENERY_SIZE[s.kind].width / 2 + HORSE_WIDTH / 2;
    return Math.abs(x - s.x) < halfWidth && Math.abs(y - s.y) < SCENERY_FOOTPRINT_DEPTH;
  });
}

/**
 * Place the level's barns, live oaks and datacenters. Each stands on one hill's visible slope,
 * inside the pasture, and no two sprites overlap. Biggest first, so they always find room.
 * @param {() => number} rng
 * @param {Hill[]} hills
 * @returns {Scenery[]}
 */
export function placeScenery(rng, hills) {
  /** @type {SceneryKind[]} */
  const kinds = [
    ...Array(DATACENTER_COUNT).fill('datacenter'),
    ...Array(BARN_COUNT).fill('barn'),
    ...Array(OAK_COUNT).fill('oak'),
  ];
  /** @type {Scenery[]} */
  const placed = [];
  for (const kind of kinds) {
    const { width, height } = SCENERY_SIZE[kind];
    for (let i = 0; i < PLACEMENT_TRIES; i++) {
      const hill = Math.floor(rng() * hills.length);
      const x = randomBetween(rng, width / 2, WORLD_WIDTH - width / 2);
      const { top, bottom } = slopeRange(hills, hill, x, width / 2);
      const y = randomBetween(rng, Math.max(top, height), bottom);
      if (y < top || y > bottom || y < height) continue;
      const overlaps = placed.some((p) => {
        const other = SCENERY_SIZE[p.kind];
        return (
          Math.abs(x - p.x) < (width + other.width) / 2 &&
          y - height < p.y &&
          p.y - other.height < y
        );
      });
      if (overlaps) continue;
      placed.push({ kind, x, y, hill });
      break;
    }
  }
  return placed;
}

/**
 * Draw a look threshold from a triangular distribution over the configured range.
 * @param {number} u uniform in [0, 1)
 */
export function lookThresholdFrom(u) {
  const lo = LOOK_THRESHOLD_MIN;
  const hi = LOOK_THRESHOLD_MAX;
  const peak = LOOK_THRESHOLD_PEAK;
  const split = (peak - lo) / (hi - lo);
  return u < split
    ? lo + Math.sqrt(u * (hi - lo) * (peak - lo))
    : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - peak));
}

/**
 * Spawn animals at random spots on the hills, spaced apart and clear of scenery bases.
 * @param {() => number} rng
 * @param {Hill[]} hills
 * @param {Scenery[]} scenery
 * @param {{kind: AnimalKind, breed: Breed}[]} roster one entry per animal
 * @returns {Animal[]}
 */
export function spawnAnimals(rng, hills, scenery, roster) {
  /** @type {Animal[]} */
  const animals = [];
  for (let id = 0; id < roster.length; id++) {
    for (let i = 0; i < PLACEMENT_TRIES; i++) {
      const hill = Math.floor(rng() * hills.length);
      const x = randomBetween(rng, HORSE_WIDTH / 2, WORLD_WIDTH - HORSE_WIDTH / 2);
      const { top, bottom } = slopeRange(hills, hill, x, HORSE_WIDTH / 2);
      const y = randomBetween(rng, top, bottom);
      if (!canStand(hills, hill, x, y) || inSceneryFootprint(scenery, x, y)) continue;
      if (animals.some((a) => Math.hypot(a.x - x, a.y - y) < ANIMAL_MIN_SPACING)) continue;
      animals.push({
        id,
        kind: roster[id].kind,
        breed: roster[id].breed,
        x,
        y,
        hill,
        facing: rng() < 0.5 ? 1 : -1,
        lookThreshold: lookThresholdFrom(rng()),
        lookMeter: 0,
        lookedAt: false,
        rng: Math.floor(rng() * 2 ** 32),
        mode: 'idle',
        idleTime: randomBetween(rng, 0, GRAZE_IDLE_MAX_S),
        targetX: x,
        targetY: y,
      });
      break;
    }
  }
  return animals;
}

/** Points checked along a walk, so it never crosses a crest or a scenery base midway. */
const WALK_SAMPLES = 6;

/**
 * Advance every animal's grazing by dt seconds: stand a while, walk a short way, repeat.
 * @param {Animal[]} animals
 * @param {Hill[]} hills
 * @param {Scenery[]} scenery
 * @param {number} dt
 * @returns {Animal[]}
 */
export function stepAnimals(animals, hills, scenery, dt) {
  return animals.map((a) =>
    a.mode === 'idle' ? stepIdle(a, hills, scenery, dt) : stepWalk(a, dt),
  );
}

/**
 * @param {Animal} a
 * @param {Hill[]} hills
 * @param {Scenery[]} scenery
 * @param {number} dt
 * @returns {Animal}
 */
function stepIdle(a, hills, scenery, dt) {
  const idleTime = a.idleTime - dt;
  if (idleTime > 0) return { ...a, idleTime };

  let state = a.rng;
  const next = () => {
    const [value, s] = rngStep(state);
    state = s;
    return value;
  };
  const angle = next() * 2 * Math.PI;
  const distance = randomBetween(next, GRAZE_WALK_MIN, GRAZE_WALK_MAX);
  // Mostly sideways: walking straight up or down a slope reads oddly from the side.
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance * GRAZE_DEPTH_SCALE;
  const restAgain = randomBetween(next, GRAZE_IDLE_MIN_S, GRAZE_IDLE_MAX_S);

  let clear = true;
  for (let i = 1; i <= WALK_SAMPLES && clear; i++) {
    const x = a.x + (dx * i) / WALK_SAMPLES;
    const y = a.y + (dy * i) / WALK_SAMPLES;
    clear = canStand(hills, a.hill, x, y) && !inSceneryFootprint(scenery, x, y);
  }
  // Blocked: stay put and try another direction after the next rest.
  if (!clear) return { ...a, rng: state, idleTime: restAgain };
  return {
    ...a,
    rng: state,
    mode: 'walk',
    idleTime: restAgain,
    targetX: a.x + dx,
    targetY: a.y + dy,
    facing: dx < 0 ? -1 : 1,
  };
}

/**
 * @param {Animal} a
 * @param {number} dt
 * @returns {Animal}
 */
function stepWalk(a, dt) {
  const dx = a.targetX - a.x;
  const dy = a.targetY - a.y;
  const remaining = Math.hypot(dx, dy);
  const stride = GRAZE_WALK_SPEED * dt;
  if (remaining <= stride) return { ...a, x: a.targetX, y: a.targetY, mode: 'idle' };
  return { ...a, x: a.x + (dx / remaining) * stride, y: a.y + (dy / remaining) * stride };
}
