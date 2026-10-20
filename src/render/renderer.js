// @ts-check
// Draws the pasture. Reads game state only; never changes it.

import { screenToWorld, worldToScreen } from '../game/camera.js';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../game/config.js';
import { ridgeY } from '../game/world.js';
import { HILL_COLORS, OUT_OF_BOUNDS, RIDGE_HIGHLIGHT, TUFT_COLOR } from './palette.js';

/** Screen pixels between sampled points along a ridge. */
const RIDGE_STEP_PX = 6;

/** Grass tufts sit in a world grid; each cell holds 0–2 tufts. */
const TUFT_CELL = 30;
const TUFT_HEIGHT = 5;
/** Tufts start fading in once they would be this many screen pixels tall, fully shown at double. */
const TUFT_MIN_PX = 3;

/**
 * @param {CanvasRenderingContext2D} ctx already scaled so 1 unit = 1 CSS pixel
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('../game/world.js').Hill[]} hills
 * @param {number} seed
 */
export function renderPasture(ctx, cam, hills, seed) {
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

  for (const hill of hills) drawHill(ctx, cam, hill, left, right, bottom);
  drawTufts(ctx, cam, seed);

  ctx.restore();
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
 * Small blades of grass, placed deterministically per world cell so they stay put while zooming.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {number} seed
 */
function drawTufts(ctx, cam, seed) {
  const tuftPx = TUFT_HEIGHT * cam.zoom;
  if (tuftPx < TUFT_MIN_PX) return;

  const a = screenToWorld(cam, 0, 0);
  const b = screenToWorld(cam, cam.viewWidth, cam.viewHeight);
  const blade = Math.max(1, Math.round(cam.zoom));

  ctx.globalAlpha = Math.min(1, (tuftPx - TUFT_MIN_PX) / TUFT_MIN_PX) * 0.7;
  ctx.fillStyle = TUFT_COLOR;
  for (let cy = Math.floor(a.y / TUFT_CELL); cy <= Math.floor(b.y / TUFT_CELL); cy++) {
    for (let cx = Math.floor(a.x / TUFT_CELL); cx <= Math.floor(b.x / TUFT_CELL); cx++) {
      let h = hash(cx, cy, seed);
      const count = h % 3;
      for (let i = 0; i < count; i++) {
        h = hash(h, i, seed);
        const wx = (cx + (h & 0xff) / 256) * TUFT_CELL;
        const wy = (cy + ((h >>> 8) & 0xff) / 256) * TUFT_CELL;
        const p = worldToScreen(cam, wx, wy);
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const tall = Math.round(tuftPx);
        // Three blades: a tall center and two shorter sides.
        ctx.fillRect(x, y - tall, blade, tall);
        ctx.fillRect(x - blade * 2, y - Math.round(tall * 0.6), blade, Math.round(tall * 0.6));
        ctx.fillRect(x + blade * 2, y - Math.round(tall * 0.7), blade, Math.round(tall * 0.7));
      }
    }
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
