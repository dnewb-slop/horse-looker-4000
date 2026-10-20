// @ts-check
// Turns text-grid art into canvases and draws creatures and scenery at the right zoom tier.

import { worldToScreen } from '../game/camera.js';
import {
  BARN_HEIGHT,
  BARN_WIDTH,
  DATACENTER_HEIGHT,
  DATACENTER_WIDTH,
  DOT_MAX_PX,
  FAR_MAX_PX,
  HORSE_HEIGHT,
  HORSE_WIDTH,
  MID_MAX_PX,
  OAK_HEIGHT,
  OAK_WIDTH,
} from '../game/config.js';
import { drawBarn } from './art/barn.js';
import { drawDatacenter } from './art/datacenter.js';
import { HORSE } from './art/horse.js';
import { CENTAUR } from './art/centaur.js';
import { GOAT } from './art/goat.js';
import { HORSE_SUIT } from './art/horse-suit.js';
import { REVERSE_CENTAUR } from './art/reverse-centaur.js';
import { ROBOT_HORSE } from './art/robot-horse.js';
import { walkFrame } from './art/motion.js';
import { SHEEP } from './art/sheep.js';
import { drawOak } from './art/oak.js';
import {
  BARN_PALETTE,
  BREED_PALETTES,
  DATACENTER_PALETTE,
  LOOKALIKE_KEYS,
  MARKER_HORSE,
  MARKER_NON_HORSE,
  OAK_PALETTE,
} from './palette.js';

/**
 * @typedef {'dot' | 'far' | 'mid' | 'near'} Tier
 * @typedef {'far' | 'mid' | 'near'} GridTier
 * @typedef {'barn' | 'oak' | 'datacenter'} SceneryKind
 * @typedef {import('../game/levels.js').Breed} Breed
 * @typedef {import('../game/levels.js').AnimalKind} AnimalKind
 */

/**
 * Creature art: a standing grid per tier plus where the head is, and at Mid and Near a walk frame
 * (made from the standing grid by swinging the legs) and a graze frame with the head down.
 * @typedef {{x: number, y: number, w: number, h: number}} Box fractions of the sprite box
 * @typedef {object} CreatureArt
 * @property {string[]} far
 * @property {string[]} mid
 * @property {string[]} near
 * @property {Box} headBox
 * @property {import('./art/motion.js').WalkRig} walk
 * @property {{mid: string[], near: string[], headBox: Box}} graze
 */

/** Every creature's art. */
/** @type {Record<AnimalKind, CreatureArt>} */
export const CREATURES = {
  horse: HORSE,
  goat: GOAT,
  sheep: SHEEP,
  centaur: CENTAUR,
  reverseCentaur: REVERSE_CENTAUR,
  robotHorse: ROBOT_HORSE,
  horseSuit: HORSE_SUIT,
};

/** @type {AnimalKind[]} */
export const ANIMAL_KINDS = /** @type {AnimalKind[]} */ (Object.keys(CREATURES));

/** Head boxes by kind, standing and grazing, for the visible-head rule. */
export const HEAD_BOXES =
  /** @type {Record<AnimalKind, import('../game/pose.js').PoseHeadBoxes>} */ (
    Object.fromEntries(
      ANIMAL_KINDS.map((k) => [
        k,
        { stand: CREATURES[k].headBox, graze: CREATURES[k].graze.headBox },
      ]),
    )
  );

/**
 * The grid a creature shows in a pose at a tier. Far has no walk or graze frame: it stays still.
 * @param {CreatureArt} art
 * @param {import('../game/pose.js').Pose} pose
 * @param {GridTier} tier
 */
export function poseGrid(art, pose, tier) {
  if (tier === 'far' || pose === 'stand') return art[tier];
  if (pose === 'graze') return art.graze[tier];
  return walkFrame(art[tier], tier, art.walk);
}

/**
 * Colors for a creature in a breed's coat: the breed palette plus the look-alikes' extra keys.
 * @param {Breed} breed
 */
export function creaturePalette(breed) {
  return { ...BREED_PALETTES[breed], ...LOOKALIKE_KEYS };
}

/** Grid pixels per world unit at each tier. Every sprite at a tier shares this density. */
export const TIER_DENSITY = { far: 0.5, mid: 1, near: 2 };

/** @type {GridTier[]} */
export const GRID_TIERS = ['far', 'mid', 'near'];

/** Scenery world sizes and the code that draws each object. */
export const SCENERY = {
  barn: { width: BARN_WIDTH, height: BARN_HEIGHT, draw: drawBarn, palette: BARN_PALETTE },
  oak: { width: OAK_WIDTH, height: OAK_HEIGHT, draw: drawOak, palette: OAK_PALETTE },
  datacenter: {
    width: DATACENTER_WIDTH,
    height: DATACENTER_HEIGHT,
    draw: drawDatacenter,
    palette: DATACENTER_PALETTE,
  },
};

/**
 * Which tier to draw at, from how tall a horse would be on screen.
 * @param {number} zoom screen pixels per world unit
 * @returns {Tier}
 */
export function spriteTier(zoom) {
  const px = HORSE_HEIGHT * zoom;
  if (px < DOT_MAX_PX) return 'dot';
  if (px < FAR_MAX_PX) return 'far';
  if (px < MID_MAX_PX) return 'mid';
  return 'near';
}

/**
 * Grid size in pixels for something of the given world size at a tier.
 * @param {number} worldWidth
 * @param {number} worldHeight
 * @param {GridTier} tier
 */
export function gridSize(worldWidth, worldHeight, tier) {
  const d = TIER_DENSITY[tier];
  return { width: Math.round(worldWidth * d), height: Math.round(worldHeight * d) };
}

/**
 * Check a grid's shape and keys. Returns a list of problems; empty means valid.
 * @param {string[]} rows
 * @param {number} width
 * @param {number} height
 * @param {Record<string, string>} palette
 */
export function validateGrid(rows, width, height, palette) {
  const problems = [];
  if (rows.length !== height) problems.push(`expected ${height} rows, got ${rows.length}`);
  rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`row ${y}: expected width ${width}, got ${row.length}`);
    for (const ch of row) {
      if (ch !== '.' && !(ch in palette)) problems.push(`row ${y}: unknown key '${ch}'`);
    }
  });
  return problems;
}

/**
 * @typedef {HTMLCanvasElement | OffscreenCanvas} SpriteImage
 * @typedef {import('../game/pose.js').Pose} Pose
 * @typedef {object} SpriteSet
 * @property {Record<AnimalKind, Record<Breed, Record<Pose, Record<GridTier, SpriteImage>>>>} creatures
 * @property {Record<SceneryKind, Record<GridTier, SpriteImage>>} scenery
 * @property {Record<AnimalKind, Record<Pose, Record<GridTier, SpriteImage>>>} markers looked-at outlines, one
 *   grid pixel bigger than the sprite on every side: blue for horses, red for everything else
 */

/**
 * The outline around a grid: every transparent cell touching an opaque one, including diagonally,
 * marked 'x'. The result is one cell bigger on every side, so the outline can sit outside the
 * sprite.
 * @param {string[]} rows
 * @returns {string[]}
 */
export function outlineGrid(rows) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  /** @param {number} x @param {number} y */
  const opaque = (x, y) => x >= 0 && y >= 0 && x < width && y < height && rows[y][x] !== '.';
  const out = [];
  for (let y = -1; y <= height; y++) {
    let row = '';
    for (let x = -1; x <= width; x++) {
      let edge = false;
      if (!opaque(x, y)) {
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1 && !edge; dx++) edge = opaque(x + dx, y + dy);
        }
      }
      row += edge ? 'x' : '.';
    }
    out.push(row);
  }
  return out;
}

/**
 * Paint a grid into a canvas, one canvas pixel per grid cell.
 * @param {string[]} rows
 * @param {Record<string, string>} palette
 * @returns {SpriteImage}
 */
export function gridToCanvas(rows, palette) {
  const width = rows[0]?.length ?? 0;
  const canvas =
    typeof OffscreenCanvas === 'function'
      ? new OffscreenCanvas(width, rows.length)
      : Object.assign(document.createElement('canvas'), { width, height: rows.length });
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (key === '.') continue;
      ctx.fillStyle = palette[key];
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return canvas;
}

/**
 * Build every sprite canvas once, at load.
 * @returns {SpriteSet}
 */
export function createSpriteSet() {
  /** @param {(tier: GridTier) => SpriteImage} make */
  const perTier = (make) => ({ far: make('far'), mid: make('mid'), near: make('near') });
  /** @param {(pose: Pose) => Record<GridTier, SpriteImage>} make */
  const perPose = (make) => ({ stand: make('stand'), walk: make('walk'), graze: make('graze') });
  /** @param {AnimalKind} kind */
  const creature = (kind) => {
    /** @param {Breed} breed */
    const coat = (breed) =>
      perPose((pose) =>
        perTier((tier) =>
          gridToCanvas(poseGrid(CREATURES[kind], pose, tier), creaturePalette(breed)),
        ),
      );
    return { A: coat('A'), B: coat('B'), C: coat('C') };
  };
  /** @param {AnimalKind} kind */
  const marker = (kind) => {
    const color = markerColor(kind);
    return perPose((pose) =>
      perTier((tier) =>
        gridToCanvas(outlineGrid(poseGrid(CREATURES[kind], pose, tier)), { x: color }),
      ),
    );
  };
  /**
   * @template T
   * @param {(kind: AnimalKind) => T} make
   * @returns {Record<AnimalKind, T>}
   */
  const perKind = (make) =>
    /** @type {Record<AnimalKind, T>} */ (
      Object.fromEntries(ANIMAL_KINDS.map((k) => [k, make(k)]))
    );
  /** @param {SceneryKind} kind */
  const scenery = (kind) =>
    perTier((tier) => {
      const s = SCENERY[kind];
      const { width, height } = gridSize(s.width, s.height, tier);
      return gridToCanvas(s.draw(width, height), s.palette);
    });
  return {
    creatures: perKind(creature),
    scenery: { barn: scenery('barn'), oak: scenery('oak'), datacenter: scenery('datacenter') },
    markers: perKind(marker),
  };
}

/**
 * Looked-at marker color: blue for horses, red for non-horses.
 * @param {AnimalKind} kind
 */
export function markerColor(kind) {
  return kind === 'horse' ? MARKER_HORSE : MARKER_NON_HORSE;
}

/**
 * Draw an animal standing at world (x, y), its feet at the bottom center of the sprite. A
 * looked-at animal gets its marker: an outline traced around the sprite, or a ring around the dot.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {SpriteSet} sprites
 * @param {{kind: AnimalKind, x: number, y: number, breed: Breed, facing: 1 | -1, lookedAt?: boolean}} animal
 * @param {Pose} [pose]
 */
export function drawAnimal(ctx, cam, sprites, animal, pose = 'stand') {
  const tier = spriteTier(cam.zoom);
  if (tier === 'dot') {
    // Too small for a sprite: a blob of coat color, body-shaped.
    const p = worldToScreen(cam, animal.x, animal.y - HORSE_HEIGHT * 0.55);
    const w = Math.max(1, Math.round(HORSE_WIDTH * cam.zoom * 0.8));
    const h = Math.max(1, Math.round(HORSE_HEIGHT * cam.zoom * 0.45));
    ctx.fillStyle = BREED_PALETTES[animal.breed].B;
    ctx.fillRect(Math.round(p.x - w / 2), Math.round(p.y - h / 2), w, h);
    if (animal.lookedAt) {
      drawRing(ctx, p.x, p.y, Math.max(DOT_RING_MIN_PX, w), markerColor(animal.kind));
    }
    return;
  }
  if (animal.lookedAt) {
    // The outline grid has one extra grid pixel on each side.
    const pad = 1 / TIER_DENSITY[tier];
    drawImageAt(
      ctx,
      cam,
      sprites.markers[animal.kind][pose][tier],
      animal.x,
      animal.y + pad,
      HORSE_WIDTH + 2 * pad,
      HORSE_HEIGHT + 2 * pad,
      animal.facing,
    );
  }
  drawImageAt(
    ctx,
    cam,
    sprites.creatures[animal.kind][animal.breed][pose][tier],
    animal.x,
    animal.y,
    HORSE_WIDTH,
    HORSE_HEIGHT,
    animal.facing,
  );
}

/** Smallest radius of the ring marking a looked-at dot, in screen pixels. */
const DOT_RING_MIN_PX = 6;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x screen center
 * @param {number} y
 * @param {number} radius
 * @param {string} color
 */
function drawRing(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Draw a scenery object standing at world (x, y), its base at the bottom center.
 * Scenery never shrinks to a dot; it uses the Far grid instead.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {SpriteSet} sprites
 * @param {{kind: SceneryKind, x: number, y: number}} object
 */
export function drawScenery(ctx, cam, sprites, object) {
  const tier = spriteTier(cam.zoom);
  const grid = tier === 'dot' ? 'far' : tier;
  const s = SCENERY[object.kind];
  drawImageAt(
    ctx,
    cam,
    sprites.scenery[object.kind][grid],
    object.x,
    object.y,
    s.width,
    s.height,
    1,
  );
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {SpriteImage} image
 * @param {number} x world x of the bottom center
 * @param {number} y world y of the bottom center
 * @param {number} width world size
 * @param {number} height
 * @param {1 | -1} facing -1 mirrors the sprite to face left
 */
function drawImageAt(ctx, cam, image, x, y, width, height, facing) {
  const topLeft = worldToScreen(cam, x - width / 2, y - height);
  const left = Math.round(topLeft.x);
  const top = Math.round(topLeft.y);
  const w = Math.round(width * cam.zoom);
  const h = Math.round(height * cam.zoom);
  if (left > cam.viewWidth || top > cam.viewHeight || left + w < 0 || top + h < 0) return;
  if (facing === 1) {
    ctx.drawImage(image, left, top, w, h);
    return;
  }
  ctx.save();
  ctx.translate(left + w, top);
  ctx.scale(-1, 1);
  ctx.drawImage(image, 0, 0, w, h);
  ctx.restore();
}
