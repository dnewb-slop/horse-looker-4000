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
import { LEVEL_COUNT, TICK_HZ } from './game/config.js';
import { createPlay, stepPlay } from './game/play.js';
import { createInput } from './input.js';
import { renderPasture } from './render/renderer.js';
import { HEAD_BOXES, createSpriteSet } from './render/sprites.js';
import { createStrip, createZoomReadout } from './ui/hud.js';
import { createCard } from './ui/screens.js';

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
const card = createCard(/** @type {HTMLElement} */ (document.getElementById('card')));

/** @param {string} name */
function readIntParam(name) {
  const param = new URLSearchParams(location.search).get(name);
  return param === null ? NaN : Number.parseInt(param, 10);
}

/** A `?seed=123` URL reproduces a game exactly; otherwise pick one at random. */
const parsedSeed = readIntParam('seed');
const seed = Number.isFinite(parsedSeed) ? parsedSeed >>> 0 : Math.floor(Math.random() * 2 ** 32);
/** `?level=2` starts at a later level, for playtesting and tests. */
const parsedLevel = readIntParam('level');
const startLevel = parsedLevel >= 1 && parsedLevel <= LEVEL_COUNT ? parsedLevel : 1;
let play = createPlay(seed, startLevel);
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
  const level = play.level;
  play = stepPlay(play, camera, HEAD_BOXES, STEP);
  // A new level starts with the whole pasture in view.
  if (play.level !== level) camera = createCamera(camera.viewWidth, camera.viewHeight);
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
  card.update(play);
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
