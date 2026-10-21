// @ts-check
// Dev-only sprite review page: renders every sprite at every tier, and a sample scene at
// several zoom levels, so Claude and the owner can judge the art. Not shipped to players.

import { clampCenter, createCamera } from '../src/game/camera.js';
import { HORSE_HEIGHT, HORSE_WIDTH } from '../src/game/config.js';
import { createRng } from '../src/game/rng.js';
import { LOOKALIKE_COAT } from '../src/game/levels.js';
import { generateHills } from '../src/game/world.js';
import { renderPasture } from '../src/render/renderer.js';
import { HILL_COLORS } from '../src/render/palette.js';
import { BREED_NAMES, KIND_NAMES } from '../src/ui/hud.js';
import {
  CREATURES,
  SCENERY,
  TIER_DENSITY,
  createSpriteSet,
  drawAnimal,
  drawScenery,
  poseGrid,
} from '../src/render/sprites.js';

const sprites = createSpriteSet();
/** @type {import('../src/render/sprites.js').Breed[]} */
const BREEDS = ['A', 'B', 'C'];
/** On-screen horse heights to show each tier at: inside that tier's range. */
const SHOW_PX = { dot: 6, far: 24, mid: 96, near: 220 };
/**
 * The standing sprite at every tier, then the walk, graze and rearing frames at Mid and Near.
 * @type {{pose: import('../src/game/pose.js').Pose, px: number, caption: string}[]}
 */
const SHOTS = [
  ...Object.entries(SHOW_PX).map(([tier, px]) => ({
    pose: /** @type {const} */ ('stand'),
    px,
    caption: `${tier} (${px} px tall)`,
  })),
  .../** @type {const} */ (['walk', 'graze', 'rear']).flatMap((pose) =>
    /** @type {const} */ (['mid', 'near']).map((tier) => ({
      pose,
      px: SHOW_PX[tier],
      caption: `${pose} · ${tier}`,
    })),
  ),
];

/**
 * One row of SHOTS for a creature.
 * @param {HTMLElement} row
 * @param {string} label
 * @param {{kind: import('../src/render/sprites.js').AnimalKind, breed: import('../src/render/sprites.js').Breed}} who
 */
function creatureRow(row, label, who) {
  for (const { pose, px, caption } of SHOTS) {
    // Only horses rear; the rest stand when looked at.
    if (pose === 'rear' && !CREATURES[who.kind].rear) continue;
    const zoom = px / HORSE_HEIGHT;
    const w = Math.max(48, Math.ceil(HORSE_WIDTH * zoom) + 16);
    // A rearing horse is taller than its sprite box.
    const tall = pose === 'rear' ? poseGrid(CREATURES[who.kind], pose, 'mid').length / 16 : 1;
    const h = Math.ceil(px * tall) + 12;
    const ctx = figure(row, w, h, `${label} · ${caption}`);
    const animal = { ...who, x: 0, y: 0, facing: /** @type {1} */ (1) };
    drawAnimal(ctx, stageCamera(w, h, zoom), sprites, animal, pose);
  }
}

/**
 * @param {HTMLElement} parent
 * @param {number} width
 * @param {number} height
 * @param {string} caption
 */
function figure(parent, width, height, caption) {
  const fig = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const label = document.createElement('figcaption');
  label.textContent = caption;
  fig.append(canvas, label);
  parent.append(fig);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = HILL_COLORS[3];
  ctx.fillRect(0, 0, width, height);
  return ctx;
}

/**
 * A camera that maps world (0, 0) to the canvas's bottom center at the given zoom.
 * @param {number} width
 * @param {number} height
 * @param {number} zoom
 */
function stageCamera(width, height, zoom) {
  return { ...createCamera(width, height), zoom, x: 0, y: -height / 2 / zoom + 4 / zoom };
}

const horsesEl = /** @type {HTMLElement} */ (document.getElementById('horses'));
for (const breed of BREEDS) {
  const row = document.createElement('div');
  row.className = 'row';
  horsesEl.append(row);
  creatureRow(row, BREED_NAMES[breed], { kind: 'horse', breed });
}

const lookalikesEl = /** @type {HTMLElement} */ (document.getElementById('lookalikes'));
for (const kind of /** @type {(keyof typeof LOOKALIKE_COAT)[]} */ (Object.keys(LOOKALIKE_COAT))) {
  const row = document.createElement('div');
  row.className = 'row';
  lookalikesEl.append(row);
  creatureRow(row, KIND_NAMES[kind], { kind, breed: LOOKALIKE_COAT[kind] });
}

const sceneryEl = /** @type {HTMLElement} */ (document.getElementById('scenery'));
for (const kind of /** @type {const} */ (['barn', 'oak', 'datacenter'])) {
  const row = document.createElement('div');
  row.className = 'row';
  sceneryEl.append(row);
  for (const tier of /** @type {const} */ (['far', 'mid', 'near'])) {
    // Show each tier at the top of its range, where its pixels are largest.
    const zoom = { far: 2, mid: 8, near: 20 }[tier] / (TIER_DENSITY[tier] * 4);
    const s = SCENERY[kind];
    const w = Math.ceil(s.width * zoom) + 16;
    const h = Math.ceil(s.height * zoom) + 12;
    const ctx = figure(row, w, h, `${kind} · ${tier}`);
    drawScenery(ctx, stageCamera(w, h, zoom), sprites, { kind, x: 0, y: 0 });
  }
}

// A small scene around the middle of the pasture, drawn back to front by base.
const seed = 4000;
const hills = generateHills(createRng(seed));
/**
 * @typedef {{type: 'horse', x: number, y: number, breed: import('../src/render/sprites.js').Breed, facing: 1 | -1}} SceneHorse
 * @typedef {{type: 'scenery', x: number, y: number, kind: import('../src/render/sprites.js').SceneryKind}} SceneObject
 */
const things = /** @type {(SceneHorse | SceneObject)[]} */ ([
  { type: 'scenery', kind: 'barn', x: 1900, y: 1290 },
  { type: 'scenery', kind: 'oak', x: 2075, y: 1255 },
  { type: 'scenery', kind: 'datacenter', x: 2230, y: 1360 },
  { type: 'scenery', kind: 'oak', x: 1790, y: 1350 },
  { type: 'horse', breed: 'A', x: 1985, y: 1300, facing: 1 },
  { type: 'horse', breed: 'B', x: 2012, y: 1318, facing: -1 },
  { type: 'horse', breed: 'C', x: 2040, y: 1296, facing: 1 },
  { type: 'horse', breed: 'B', x: 1960, y: 1340, facing: 1 },
  { type: 'horse', breed: 'C', x: 2105, y: 1330, facing: -1 },
  { type: 'horse', breed: 'A', x: 1870, y: 1325, facing: -1 },
]).sort((a, b) => a.y - b.y);

const scenesEl = /** @type {HTMLElement} */ (document.getElementById('scenes'));
for (const factor of [1, 5, 16, 45]) {
  const [w, h] = [600, 375];
  const fig = document.createElement('figure');
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const label = document.createElement('figcaption');
  label.textContent = `×${factor}`;
  fig.append(canvas, label);
  scenesEl.append(fig);
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.imageSmoothingEnabled = false;
  const base = createCamera(w, h);
  const cam = clampCenter({
    ...base,
    zoom: base.minZoom * factor,
    targetZoom: base.minZoom * factor,
    x: 2010,
    y: 1300,
  });
  renderPasture(ctx, cam, { hills }, seed);
  for (const t of things) {
    if (t.type === 'horse') drawAnimal(ctx, cam, sprites, { ...t, kind: 'horse' });
    else drawScenery(ctx, cam, sprites, t);
  }
}

Object.defineProperty(window, '__spritesReady', { value: true });
