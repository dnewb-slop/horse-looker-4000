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
import { createEndPreview, createPlay, stepPlay } from './game/play.js';
import { createInput } from './input.js';
import { renderPasture } from './render/renderer.js';
import { HEAD_BOXES, createSpriteSet } from './render/sprites.js';
import { createMusic } from './ui/audio.js';
import { createStrip, createZoomReadout } from './ui/hud.js';
import { createScreens } from './ui/screens.js';
import { TRACKS } from './ui/tracks.js';

const STEP = 1 / TICK_HZ;
/** Don't try to catch up more than this after a stall (e.g. a background tab). */
const MAX_FRAME_TIME = 0.25;

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('pasture'));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const viewport = /** @type {HTMLElement} */ (document.querySelector('.viewport'));
const readout = createZoomReadout(
  /** @type {HTMLElement} */ (document.getElementById('zoom-readout')),
);
const sprites = createSpriteSet();
const stripEl = /** @type {HTMLElement} */ (document.getElementById('strip'));
const strip = createStrip(stripEl, sprites);
const music = createMusic(stripEl, TRACKS);
/** Clicks on the opening sequence since the last logic step. */
let introClicks = 0;
/** Set by "Horse again"; the next logic step starts a new game. */
let restart = false;
const screens = createScreens(
  /** @type {HTMLElement} */ (document.getElementById('screen')),
  sprites,
  TRACKS,
  {
    onClick: () => introClicks++,
    onHorseAgain: () => (restart = true),
  },
);

/** @param {string} name */
function readIntParam(name) {
  const param = new URLSearchParams(location.search).get(name);
  return param === null ? NaN : Number.parseInt(param, 10);
}

/**
 * A `?seed=123` URL reproduces a game exactly, and "Horse again" replays the same seed;
 * otherwise each game gets a random one.
 */
const parsedSeed = readIntParam('seed');
const fixedSeed = Number.isFinite(parsedSeed) ? parsedSeed >>> 0 : null;
const newSeed = () => fixedSeed ?? Math.floor(Math.random() * 2 ** 32);
/** `?level=2` starts at a later level, for playtesting and tests; it skips the intro. */
const parsedLevel = readIntParam('level');
const startLevel = parsedLevel >= 1 && parsedLevel <= LEVEL_COUNT ? parsedLevel : 1;
/** `?intro=off` skips the opening sequence, for tests. */
const showIntro = startLevel === 1 && new URLSearchParams(location.search).get('intro') !== 'off';
/** `?screen=win` or `?screen=lose` opens straight on an end screen, for testing them. */
const endScreen = { win: 'won', lose: 'lost' }[
  new URLSearchParams(location.search).get('screen') ?? ''
];
let play = endScreen
  ? createEndPreview(newSeed(), /** @type {'won' | 'lost'} */ (endScreen))
  : createPlay(newSeed(), startLevel, { intro: showIntro });
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
  const newGame = restart;
  restart = false;
  // "Horse again": a new game at level 1, skipping the intro.
  if (newGame) play = createPlay(newSeed(), 1);
  else play = stepPlay(play, camera, HEAD_BOXES, STEP, introClicks);
  introClicks = 0;
  // A new level or game starts with the whole pasture in view.
  if (newGame || play.level !== level) {
    camera = createCamera(camera.viewWidth, camera.viewHeight);
  }
}

let last = performance.now();
let accumulator = 0;

/** @param {number} now */
function frame(now) {
  const elapsed = Math.min((now - last) / 1000, MAX_FRAME_TIME);
  accumulator += elapsed;
  last = now;
  while (accumulator >= STEP) {
    update();
    accumulator -= STEP;
  }
  renderPasture(ctx, camera, play, play.seed, sprites);
  readout.update(zoomFactor(camera));
  strip.update(play);
  screens.update(play);
  // Losing drains the pasture of color, from the last imposter through the lose screen's fade-in.
  viewport.classList.toggle('lost', play.phase === 'losing' || play.phase === 'lost');
  music.update(play, elapsed);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);

// Read-only hook for browser tests and debugging.
Object.defineProperty(window, '__horseLooker', {
  value: Object.freeze({
    get seed() {
      return play.seed;
    },
    get camera() {
      return camera;
    },
    get play() {
      return play;
    },
    get music() {
      return music.state;
    },
  }),
});
