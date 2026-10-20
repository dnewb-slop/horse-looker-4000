// @ts-check
// The pasture: rolling hills, scenery placed on them, and grazing animals.
//
// Each hill is a layer. Everything on the pasture stands on exactly one hill, between that hill's
// ridge and the ridge of the hill in front, which would hide it. Animals stay on their own hill
// until milestone 7 adds valleys and ridge crossings.

import {
  ANIMAL_MIN_SPACING,
  CROSS_CHANCE,
  CROSS_OVERSHOOT,
  MIN_RIDGE_GAP,
  VALLEY_DEPTH,
  BARN_COUNT,
  BARN_HEIGHT,
  BARN_WIDTH,
  DATACENTER_COUNT,
  DATACENTER_HEIGHT,
  DATACENTER_WIDTH,
  GRAZE_CHANCE,
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
    let amplitude = randomBetween(rng, HILL_AMPLITUDE_MIN, HILL_AMPLITUDE_MAX);
    let hill = randomHill(rng, baseY, amplitude, i);
    // Keep valleys open: redraw flatter until this ridge stays clear of the one behind it.
    for (let tries = 0; i > 0 && minGap(hills[i - 1], hill) < MIN_RIDGE_GAP; tries++) {
      if (tries === GAP_TRIES) {
        // Last resort: a flat ridge far enough down. Rare, and always valid.
        hill = { baseY: maxRidge(hills[i - 1]) + MIN_RIDGE_GAP, waves: [], shade: i };
        break;
      }
      amplitude *= 0.8;
      hill = randomHill(rng, baseY, amplitude, i);
    }
    hills.push(hill);
  }
  return hills;
}

/** Redraws allowed before a ridge falls back to flat. */
const GAP_TRIES = 12;
/** World units between samples when comparing ridges. */
const GAP_SAMPLE = 10;

/**
 * @param {() => number} rng
 * @param {number} baseY
 * @param {number} amplitude
 * @param {number} shade
 * @returns {Hill}
 */
function randomHill(rng, baseY, amplitude, shade) {
  /** @type {Wave[]} */
  const waves = [1, 2.3, 5.1].map((multiple, k) => ({
    // About one to three long swells across the pasture, plus smaller ripples.
    frequency: ((2 * Math.PI) / WORLD_WIDTH) * multiple * randomBetween(rng, 0.8, 1.6),
    phase: randomBetween(rng, 0, 2 * Math.PI),
    amplitude: amplitude / (k + 1) ** 1.5,
  }));
  return { baseY, waves, shade };
}

/**
 * Smallest vertical gap from one ridge down to the next, across the pasture.
 * @param {Hill} back
 * @param {Hill} front
 */
export function minGap(back, front) {
  let gap = Infinity;
  for (let x = 0; x <= WORLD_WIDTH; x += GAP_SAMPLE) {
    gap = Math.min(gap, ridgeY(front, x) - ridgeY(back, x));
  }
  return gap;
}

/** @param {Hill} hill */
function maxRidge(hill) {
  let y = -Infinity;
  for (let x = 0; x <= WORLD_WIDTH; x += GAP_SAMPLE) y = Math.max(y, ridgeY(hill, x));
  return y;
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
 * @property {number} hill index of the hill it stands on. Its feet can be anywhere from that hill's
 *   crest down into the valley behind the next crest, where the next hill hides it.
 * @property {1 | -1} facing 1 faces right
 * @property {number} lookMeter 0 to 1
 * @property {boolean} lookedAt
 * @property {number} rng this animal's own generator state, so grazing stays pure and seeded
 * @property {'idle' | 'walk'} mode
 * @property {number} idleTime seconds left standing still, while idle
 * @property {boolean} grazing whether it puts its head down while idle (DESIGN.md: a grazing
 *   head is low, so it can drop behind a crest)
 * @property {number} walkTime seconds spent walking, which picks the walk frame
 * @property {Waypoint[]} route where it is walking, while walking
 */

/**
 * A point on a walk. Arriving there moves the animal onto `hill`, which is how an animal
 * crossing a ridge changes layers: exactly at the crest, where nothing of it is covered.
 * @typedef {{x: number, y: number, hill: number}} Waypoint
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
 * The ground an animal on a hill can stand on at x: from just below the hill's own crest down
 * into the hidden valley behind the next hill's crest.
 * @param {Hill[]} hills
 * @param {number} hill
 * @param {number} x
 * @param {number} [topMargin] how far below its own crest; crossings use 0 to reach the crest
 */
export function groundRange(hills, hill, x, topMargin = SLOPE_MARGIN_TOP) {
  return {
    top: ridgeY(hills[hill], x) + topMargin,
    bottom: hill + 1 < hills.length ? ridgeY(hills[hill + 1], x) + VALLEY_DEPTH : WORLD_HEIGHT,
  };
}

/** Rounding slack when a route ends exactly on a crest or valley floor. */
const EPSILON = 1e-6;

/**
 * Whether ground point (x, y) on a hill is a valid place for an animal to stand.
 * @param {Hill[]} hills
 * @param {number} hill
 * @param {number} x
 * @param {number} y
 * @param {number} [topMargin]
 */
function canStand(hills, hill, x, y, topMargin) {
  if (x < HORSE_WIDTH / 2 || x > WORLD_WIDTH - HORSE_WIDTH / 2) return false;
  if (y < HORSE_HEIGHT) return false;
  const { top, bottom } = groundRange(hills, hill, x, topMargin);
  return y >= top - EPSILON && y <= bottom + EPSILON;
}

/**
 * Whether an animal is in the valley behind the next crest, at least partly hidden by it.
 * @param {Hill[]} hills
 * @param {{x: number, y: number, hill: number}} animal
 */
export function inValley(hills, animal) {
  return animal.hill + 1 < hills.length && animal.y > ridgeY(hills[animal.hill + 1], animal.x);
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
      // Anywhere on the hill's ground, so some animals start in a valley.
      const { top, bottom } = groundRange(hills, hill, x);
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
        lookMeter: 0,
        lookedAt: false,
        ...firstRest(Math.floor(rng() * 2 ** 32)),
        mode: 'idle',
        idleTime: randomBetween(rng, 0, GRAZE_IDLE_MAX_S),
        walkTime: 0,
        route: [],
      });
      break;
    }
  }
  return animals;
}

/**
 * Whether an animal's first rest is spent grazing. Drawn from its own generator rather than the
 * pasture's, so adding it didn't move any animal of an existing seed.
 * @param {number} state the animal's generator state
 */
function firstRest(state) {
  const [value, rng] = rngStep(state);
  return { rng, grazing: value < GRAZE_CHANCE };
}

/**
 * World units between points checked along each leg of a walk, so it never leaves its ground or
 * cuts the corner of a scenery base.
 */
const WALK_SAMPLE_STEP = 2;

/**
 * Advance every animal's grazing by dt seconds: stand a while, then walk a short way or over a
 * ridge, and repeat.
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
 * Whether a walk along these waypoints stays on valid ground and clear of scenery bases. Each leg
 * is checked on the hill the animal is on while walking it.
 * @param {Hill[]} hills
 * @param {Scenery[]} scenery
 * @param {{x: number, y: number, hill: number}} from
 * @param {Waypoint[]} route
 * @param {number} [topMargin]
 */
export function routeClear(hills, scenery, from, route, topMargin) {
  let { x, y, hill } = from;
  for (const w of route) {
    const samples = Math.max(1, Math.ceil(Math.hypot(w.x - x, w.y - y) / WALK_SAMPLE_STEP));
    for (let i = 1; i <= samples; i++) {
      const px = x + ((w.x - x) * i) / samples;
      const py = y + ((w.y - y) * i) / samples;
      if (!canStand(hills, hill, px, py, topMargin) || inSceneryFootprint(scenery, px, py)) {
        return false;
      }
    }
    ({ x, y, hill } = w);
  }
  return true;
}

/**
 * A walk over a ridge, as waypoints (DESIGN.md, Hills).
 *
 * Toward the viewer: down into the valley behind the next hill (sinking out of sight), up to
 * that hill's crest (rising head first), switching onto it there, then down its front slope.
 * Away from the viewer: up to its own hill's crest, switching onto the hill behind there, down
 * into the hidden valley, then up onto the hill behind's visible slope.
 *
 * Returns null when there is no hill that way.
 * @param {Hill[]} hills
 * @param {{x: number, y: number, hill: number}} a
 * @param {1 | -1} toward 1 toward the viewer (onto the hill in front), -1 away
 * @param {number} dx how far sideways the whole crossing goes
 * @returns {Waypoint[] | null}
 */
export function crossingRoute(hills, a, toward, dx) {
  const x1 = a.x + dx * 0.35;
  const x2 = a.x + dx * 0.7;
  const x3 = a.x + dx;
  if (toward === 1) {
    if (a.hill + 1 >= hills.length) return null;
    const crest = hills[a.hill + 1];
    return [
      { x: x1, y: ridgeY(crest, x1) + VALLEY_DEPTH, hill: a.hill },
      { x: x2, y: ridgeY(crest, x2), hill: a.hill + 1 },
      { x: x3, y: ridgeY(crest, x3) + CROSS_OVERSHOOT, hill: a.hill + 1 },
    ];
  }
  if (a.hill === 0) return null;
  const crest = hills[a.hill];
  return [
    { x: x1, y: ridgeY(crest, x1), hill: a.hill - 1 },
    { x: x2, y: ridgeY(crest, x2) + VALLEY_DEPTH, hill: a.hill - 1 },
    { x: x3, y: ridgeY(crest, x3) - CROSS_OVERSHOOT, hill: a.hill - 1 },
  ];
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
  const restAgain = randomBetween(next, GRAZE_IDLE_MIN_S, GRAZE_IDLE_MAX_S);
  const cross = next() < CROSS_CHANCE;
  const toward = next() < 0.5 ? 1 : -1;
  // Decided now, for the rest that follows this walk.
  const grazing = next() < GRAZE_CHANCE;
  const dx = Math.cos(angle) * distance;

  /** @type {Waypoint[] | null} */
  let route = null;
  if (cross) {
    const over = crossingRoute(hills, a, toward, dx);
    // Crossings reach the crest itself, so they skip the usual margin below it.
    if (over && routeClear(hills, scenery, a, over, 0)) route = over;
  }
  if (!route) {
    // Mostly sideways: walking straight up or down a slope reads oddly from the side.
    const walk = [
      { x: a.x + dx, y: a.y + Math.sin(angle) * distance * GRAZE_DEPTH_SCALE, hill: a.hill },
    ];
    if (routeClear(hills, scenery, a, walk)) route = walk;
  }
  // Blocked: stay put and try another direction after the next rest.
  if (!route) return { ...a, rng: state, idleTime: restAgain, grazing };
  return {
    ...a,
    rng: state,
    mode: 'walk',
    idleTime: restAgain,
    grazing,
    route,
    facing: facingFor(a, route[0]),
  };
}

/**
 * @param {{x: number}} from
 * @param {{x: number}} to
 * @returns {1 | -1}
 */
function facingFor(from, to) {
  return to.x < from.x ? -1 : 1;
}

/**
 * @param {Animal} a
 * @param {number} dt
 * @returns {Animal}
 */
function stepWalk(a, dt) {
  const [target, ...rest] = a.route;
  const dx = target.x - a.x;
  const dy = target.y - a.y;
  const remaining = Math.hypot(dx, dy);
  const stride = GRAZE_WALK_SPEED * dt;
  const walkTime = a.walkTime + dt;
  if (remaining > stride) {
    return {
      ...a,
      walkTime,
      x: a.x + (dx / remaining) * stride,
      y: a.y + (dy / remaining) * stride,
    };
  }
  const arrived = { ...a, walkTime, x: target.x, y: target.y, hill: target.hill, route: rest };
  if (rest.length === 0) return { ...arrived, mode: 'idle' };
  return { ...arrived, facing: facingFor(arrived, rest[0]) };
}
