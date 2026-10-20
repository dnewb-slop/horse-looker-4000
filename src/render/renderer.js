// @ts-check
// Draws the pasture. Reads game state only; never changes it.
//
// Hills are drawn back to front. Right after each hill come the tufts, scenery and animals
// standing on it, ordered by their base, so the hill in front covers anything behind its crest
// and a horse behind a barn is partly hidden.

import { screenToWorld, worldToScreen } from '../game/camera.js';
import { HORSE_HEIGHT, HORSE_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../game/config.js';
import { headCenter } from '../game/detect.js';
import { ridgeY } from '../game/world.js';
import { HORSE } from './art/horse.js';
import {
  HILL_COLORS,
  LOOK_METER,
  LOOK_METER_BACK,
  OUT_OF_BOUNDS,
  RIDGE_HIGHLIGHT,
  TUFT_COLOR,
} from './palette.js';
import { drawHorse, drawScenery } from './sprites.js';

/** Screen pixels between sampled points along a ridge. */
const RIDGE_STEP_PX = 6;

/** Grass tufts sit in a world grid; each cell holds 0–2 tufts. */
const TUFT_CELL = 30;
const TUFT_HEIGHT = 5;
/** Tufts start fading in once they would be this many screen pixels tall, fully shown at double. */
const TUFT_MIN_PX = 3;

/** Look meter bar size in screen pixels. */
const METER_HEIGHT_PX = 4;
const METER_MIN_WIDTH_PX = 16;
const METER_MAX_WIDTH_PX = 64;
/** Gap between the top of the sprite and the meter. */
const METER_GAP_PX = 6;

/**
 * @typedef {object} PastureView
 * @property {import('../game/world.js').Hill[]} hills
 * @property {import('../game/world.js').Scenery[]} [scenery]
 * @property {import('../game/world.js').Animal[]} [animals]
 */

/**
 * @param {CanvasRenderingContext2D} ctx already scaled so 1 unit = 1 CSS pixel
 * @param {import('../game/camera.js').Camera} cam
 * @param {PastureView} pasture
 * @param {number} seed
 * @param {import('./sprites.js').SpriteSet} [sprites] needed when there is scenery or animals
 */
export function renderPasture(ctx, cam, pasture, seed, sprites) {
  const { hills, scenery = [], animals = [] } = pasture;
  ctx.fillStyle = OUT_OF_BOUNDS;
  ctx.fillRect(0, 0, cam.viewWidth, cam.viewHeight);

  const topLeft = worldToScreen(cam, 0, 0);
  const bottomRight = worldToScreen(cam, WORLD_WIDTH, WORLD_HEIGHT);
  const left = Math.max(0, topLeft.x);
  const right = Math.min(cam.viewWidth, bottomRight.x);
  const bottom = Math.min(cam.viewHeight, bottomRight.y);

  ctx.save();
  ctx.beginPath();
  ctx.rect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  ctx.clip();

  const tufts = visibleTufts(cam, hills, seed);
  hills.forEach((hill, i) => {
    drawHill(ctx, cam, hill, left, right, bottom);
    drawTufts(ctx, cam, tufts[i]);
    if (!sprites) return;
    /** @type {({y: number, draw: () => void})[]} */
    const items = [];
    for (const s of scenery) {
      if (s.hill === i) items.push({ y: s.y, draw: () => drawScenery(ctx, cam, sprites, s) });
    }
    for (const a of animals) {
      if (a.hill === i) items.push({ y: a.y, draw: () => drawHorse(ctx, cam, sprites, a) });
    }
    items.sort((p, q) => p.y - q.y);
    for (const item of items) item.draw();
  });
  // Meters go on top of everything, so a filling animal behind a crest still shows progress.
  for (const a of animals) drawLookMeter(ctx, cam, a);

  ctx.restore();
}

/**
 * A thin white bar above the head of an animal whose look meter is filling or draining.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('../game/world.js').Animal} animal
 */
function drawLookMeter(ctx, cam, animal) {
  if (animal.lookedAt || animal.lookMeter <= 0) return;
  const top = worldToScreen(cam, headCenter(animal, HORSE.headBox).x, animal.y - HORSE_HEIGHT);
  const width = Math.round(
    Math.max(METER_MIN_WIDTH_PX, Math.min(METER_MAX_WIDTH_PX, HORSE_WIDTH * cam.zoom * 0.5)),
  );
  const x = Math.round(top.x - width / 2);
  const y = Math.round(top.y - METER_GAP_PX - METER_HEIGHT_PX);
  ctx.fillStyle = LOOK_METER_BACK;
  ctx.fillRect(x - 1, y - 1, width + 2, METER_HEIGHT_PX + 2);
  ctx.fillStyle = LOOK_METER;
  ctx.fillRect(x, y, Math.round(width * animal.lookMeter), METER_HEIGHT_PX);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('../game/world.js').Hill} hill
 * @param {number} left visible pasture edges, in screen pixels
 * @param {number} right
 * @param {number} bottom
 */
function drawHill(ctx, cam, hill, left, right, bottom) {
  /** @type {[number, number][]} */
  const ridge = [];
  for (let sx = left; ; sx += RIDGE_STEP_PX) {
    const x = Math.min(sx, right);
    const wy = ridgeY(hill, screenToWorld(cam, x, 0).x);
    ridge.push([x, worldToScreen(cam, 0, wy).y]);
    if (x >= right) break;
  }
  // Skip hills whose ridge is entirely below the view.
  if (ridge.every(([, y]) => y > bottom)) return;

  ctx.beginPath();
  ctx.moveTo(left, bottom + 1);
  for (const [x, y] of ridge) ctx.lineTo(x, y);
  ctx.lineTo(right, bottom + 1);
  ctx.closePath();
  ctx.fillStyle = HILL_COLORS[Math.min(hill.shade, HILL_COLORS.length - 1)];
  ctx.fill();

  ctx.beginPath();
  for (const [x, y] of ridge) ctx.lineTo(x, y);
  ctx.strokeStyle = RIDGE_HIGHLIGHT;
  ctx.lineWidth = Math.max(1, Math.min(4, cam.zoom * 1.5));
  ctx.stroke();
}

/**
 * Grass tufts in view, bucketed by the hill whose slope they sit on, so each is drawn with its
 * hill and gets covered by the hills in front. Placed deterministically per world cell, so they
 * stay put while zooming.
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('../game/world.js').Hill[]} hills
 * @param {number} seed
 * @returns {{x: number, y: number}[][]} world positions, one list per hill
 */
function visibleTufts(cam, hills, seed) {
  /** @type {{x: number, y: number}[][]} */
  const buckets = hills.map(() => []);
  if (TUFT_HEIGHT * cam.zoom < TUFT_MIN_PX) return buckets;

  const a = screenToWorld(cam, 0, 0);
  const b = screenToWorld(cam, cam.viewWidth, cam.viewHeight);
  for (let cy = Math.floor(a.y / TUFT_CELL); cy <= Math.floor(b.y / TUFT_CELL); cy++) {
    for (let cx = Math.floor(a.x / TUFT_CELL); cx <= Math.floor(b.x / TUFT_CELL); cx++) {
      let h = hash(cx, cy, seed);
      const count = h % 3;
      for (let i = 0; i < count; i++) {
        h = hash(h, i, seed);
        const x = (cx + (h & 0xff) / 256) * TUFT_CELL;
        const y = (cy + ((h >>> 8) & 0xff) / 256) * TUFT_CELL;
        let owner = -1;
        for (let k = 0; k < hills.length && ridgeY(hills[k], x) <= y; k++) owner = k;
        if (owner >= 0) buckets[owner].push({ x, y });
      }
    }
  }
  return buckets;
}

/**
 * Small blades of grass that fade in at close zoom.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {{x: number, y: number}[]} tufts world positions
 */
function drawTufts(ctx, cam, tufts) {
  const tuftPx = TUFT_HEIGHT * cam.zoom;
  if (tuftPx < TUFT_MIN_PX || tufts.length === 0) return;
  const blade = Math.max(1, Math.round(cam.zoom));
  const tall = Math.round(tuftPx);

  ctx.globalAlpha = Math.min(1, (tuftPx - TUFT_MIN_PX) / TUFT_MIN_PX) * 0.7;
  ctx.fillStyle = TUFT_COLOR;
  for (const t of tufts) {
    const p = worldToScreen(cam, t.x, t.y);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    // Three blades: a tall center and two shorter sides.
    ctx.fillRect(x, y - tall, blade, tall);
    ctx.fillRect(x - blade * 2, y - Math.round(tall * 0.6), blade, Math.round(tall * 0.6));
    ctx.fillRect(x + blade * 2, y - Math.round(tall * 0.7), blade, Math.round(tall * 0.7));
  }
  ctx.globalAlpha = 1;
}

/**
 * Cheap integer hash for decoration placement. Not used for game rules.
 * @param {number} x
 * @param {number} y
 * @param {number} seed
 */
function hash(x, y, seed) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ seed;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
