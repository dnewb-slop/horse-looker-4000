// @ts-check
// Bootstrap and frame loop: input → fixed-step logic → render.

import {
  applyDrag,
  applyWheel,
  createCamera,
  resizeView,
  stepCamera,
  zoomFactor,
} from './game/camera.js';
import { TICK_HZ } from './game/config.js';
import { createPlay, stepPlay } from './game/play.js';
import { createInput } from './input.js';
import { HORSE } from './render/art/horse.js';
import { renderPasture } from './render/renderer.js';
import { createSpriteSet } from './render/sprites.js';
import { createStrip, createZoomReadout } from './ui/hud.js';

const STEP = 1 / TICK_HZ;
/** Don't try to catch up more than this after a stall (e.g. a background tab). */
const MAX_FRAME_TIME = 0.25;

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('pasture'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const readout = createZoomReadout(
  /** @type {HTMLElement} */ (document.getElementById('zoom-readout')),
);
const sprites = createSpriteSet();
const strip = createStrip(/** @type {HTMLElement} */ (document.getElementById('strip')), sprites);
/** Head boxes by animal kind, for the visible-head rule. */
const HEAD_BOXES = { horse: HORSE.headBox };

/** A `?seed=123` URL reproduces a pasture exactly; otherwise pick one at random. */
function readSeed() {
  const param = new URLSearchParams(location.search).get('seed');
  const parsed = param === null ? NaN : Number.parseInt(param, 10);
  return Number.isFinite(parsed) ? parsed >>> 0 : Math.floor(Math.random() * 2 ** 32);
}

const seed = readSeed();
let play = createPlay(seed);
const input = createInput(canvas);
let camera = createCamera(canvas.clientWidth, canvas.clientHeight);

/** Match the backing store to the CSS size so pixel art stays crisp on high-DPI screens. */
function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  camera = resizeView(camera, canvas.clientWidth, canvas.clientHeight);
}

function update() {
  const frame = input.drain();
  for (const w of frame.wheels) camera = applyWheel(camera, w.deltaY, w.x, w.y);
  if (frame.dragX || frame.dragY) camera = applyDrag(camera, frame.dragX, frame.dragY);
  camera = stepCamera(camera, STEP);
  play = stepPlay(play, camera, HEAD_BOXES, STEP);
}

let last = performance.now();
let accumulator = 0;

/** @param {number} now */
function frame(now) {
  accumulator += Math.min((now - last) / 1000, MAX_FRAME_TIME);
  last = now;
  while (accumulator >= STEP) {
    update();
    accumulator -= STEP;
  }
  renderPasture(ctx, camera, play, seed, sprites);
  readout.update(zoomFactor(camera));
  strip.update(play);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);

// Read-only hook for browser tests and debugging.
Object.defineProperty(window, '__horseLooker', {
  value: Object.freeze({
    seed,
    get camera() {
      return camera;
    },
    get play() {
      return play;
    },
  }),
});
