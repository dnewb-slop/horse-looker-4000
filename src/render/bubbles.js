// @ts-check
// Speech bubbles: what an animal says when it is looked at (DESIGN.md, Looking at animals). Drawn
// over everything for as long as the animal reacts. Reads game state only.

import { worldToScreen } from '../game/camera.js';
import { HORSE_WIDTH } from '../game/config.js';
import { animalPose } from '../game/pose.js';
import { BUBBLE_FILL, BUBBLE_INK } from './palette.js';
import { CREATURES, poseGrid } from './sprites.js';

/**
 * Each kind's line, or null for one that says nothing. The horse suit gets its own reaction (two
 * people splitting off) later.
 * @type {Record<import('../game/levels.js').AnimalKind, string | null>}
 */
export const REACTION_LINES = {
  horse: 'Yayyy',
  goat: 'Nayyyy',
  sheep: 'Nayyyy',
  centaur: 'What’s up?',
  reverseCentaur: 'AAAaaaa',
  robotHorse: 'Bzowt',
  horseSuit: null,
};

/** Bubble look, in screen pixels. Fixed on screen so it reads at any zoom. */
const FONT = '700 32px system-ui, sans-serif';
const PAD_X = 16;
const PAD_Y = 10;
const TEXT_HEIGHT = 32;
const TAIL = 12;
const GAP = 4;
const RADIUS = 12;
const BORDER = 4;
/** Closest a bubble comes to the edge of the view. */
const EDGE = 4;
/** Seconds the bubble takes to fade out at the end of the reaction. */
const FADE_S = 0.3;

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Rows of the sprite's top that the bubble centers over. */
const TOP_ROWS = 3;

/** @type {Map<string, {x: number, y: number}>} */
const tops = new Map();

/**
 * Where the top of a creature's sprite is in a pose, which is its head for every creature (the
 * centaur's is the person's), in world units from its feet, facing right: x from the center, y
 * up. Read from the Mid grid, one pixel per world unit, so it follows a rearing horse's head.
 * @param {import('../game/levels.js').AnimalKind} kind
 * @param {import('../game/pose.js').Pose} pose
 */
export function spriteTop(kind, pose) {
  const key = `${kind}:${pose}`;
  const known = tops.get(key);
  if (known) return known;
  const grid = poseGrid(CREATURES[kind], pose, 'mid');
  const first = grid.findIndex((row) => /[^.]/.test(row));
  let sum = 0;
  let count = 0;
  for (const row of grid.slice(first, first + TOP_ROWS)) {
    [...row].forEach((k, x) => {
      if (k !== '.') {
        sum += x + 0.5;
        count++;
      }
    });
  }
  const top = { x: sum / count - HORSE_WIDTH / 2, y: grid.length - first };
  tops.set(key, top);
  return top;
}

/**
 * A speech bubble above a reacting animal's head, its tail pointing down at the head.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('../game/world.js').Animal} animal
 */
export function drawBubble(ctx, cam, animal) {
  const line = REACTION_LINES[animal.kind];
  if (!line || animal.reactTime <= 0) return;
  const top = spriteTop(animal.kind, animalPose(animal));
  const tip = worldToScreen(cam, animal.x + top.x * animal.facing, animal.y - top.y);
  ctx.save();
  ctx.globalAlpha = Math.min(1, animal.reactTime / FADE_S);
  ctx.font = FONT;
  const w = Math.ceil(ctx.measureText(line).width) + PAD_X * 2;
  const h = TEXT_HEIGHT + PAD_Y * 2;
  // Kept inside the view, so a head near the edge still shows its line; the tail stays on the
  // bubble's bottom edge.
  const x = Math.round(clamp(tip.x - w / 2, EDGE, cam.viewWidth - EDGE - w));
  const y = Math.round(clamp(tip.y - GAP - TAIL - h, EDGE, cam.viewHeight - EDGE - h - TAIL));
  const tx = Math.round(clamp(tip.x, x + TAIL + RADIUS, x + w - TAIL - RADIUS));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, RADIUS);
  ctx.moveTo(tx - TAIL, y + h);
  ctx.lineTo(tx, y + h + TAIL);
  ctx.lineTo(tx + TAIL, y + h);
  ctx.fillStyle = BUBBLE_FILL;
  ctx.strokeStyle = BUBBLE_INK;
  ctx.lineWidth = BORDER;
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = BUBBLE_INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(line, x + w / 2, y + h / 2 + 2);
  ctx.restore();
}
