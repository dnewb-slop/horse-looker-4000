// @ts-check
// Reaction effects drawn with an animal: a looked-at robot horse's laser eyes, and the small fire
// they start in the grass in front of it. Timed from the animal's reaction, so they last exactly
// as long as it does. Reads game state only.

import { worldToScreen } from '../game/camera.js';
import {
  FIRE_HEIGHT,
  FIRE_WIDTH,
  HORSE_HEIGHT,
  HORSE_WIDTH,
  LASER_REACH,
  LASER_S,
  REACTION_S,
} from '../game/config.js';
import { LASER_CORE, LASER_GLOW } from './palette.js';
import { CREATURES, TIER_DENSITY, spriteTier } from './sprites.js';

/** The lasers reach the grass this far into their firing, and the fire catches there. */
const HIT_FRACTION = 0.4;
/** Seconds the fire takes to flare up, and to die down at the end. */
const FIRE_GROW_S = 0.3;
/** Fire frames a second. */
const FLICKER_HZ = 8;

/** @type {Map<string, {x: number, y: number}>} */
const eyes = new Map();

/**
 * The robot horse's LED eye, in world units from its feet, facing right: x from the center, y up.
 * The eye is the lowest red LED cell; the antenna's light is above it.
 * @param {'far' | 'mid' | 'near'} tier
 */
export function robotEye(tier) {
  const grid = tier === 'far' ? 'mid' : tier;
  const known = eyes.get(grid);
  if (known) return known;
  const rows = CREATURES.robotHorse[grid];
  const d = TIER_DENSITY[grid];
  let eye = { x: 0, y: HORSE_HEIGHT / 2 };
  rows.forEach((row, y) => {
    const x = row.lastIndexOf('L');
    if (x >= 0) eye = { x: (x + 0.5) / d - HORSE_WIDTH / 2, y: (rows.length - y - 0.5) / d };
  });
  eyes.set(grid, eye);
  return eye;
}

/**
 * How a robot horse's reaction looks at this moment: whether the lasers are firing, and how big
 * the fire is (0 to 1) and which frame it shows.
 * @param {number} reactTime seconds left reacting
 */
export function laserShow(reactTime) {
  const t = REACTION_S - reactTime;
  const lit = t - LASER_S * HIT_FRACTION;
  const fire =
    reactTime <= 0 || lit < 0 ? 0 : Math.min(1, lit / FIRE_GROW_S, reactTime / FIRE_GROW_S);
  return {
    beam: reactTime > 0 && t < LASER_S,
    fire,
    frame: Math.floor(t * FLICKER_HZ) % 2,
  };
}

/**
 * The lasers and fire for a reacting robot horse; nothing for anyone else.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../game/camera.js').Camera} cam
 * @param {import('./sprites.js').SpriteSet} sprites
 * @param {import('../game/world.js').Animal} animal
 */
export function drawReactionEffects(ctx, cam, sprites, animal) {
  if (animal.kind !== 'robotHorse' || animal.reactTime <= 0) return;
  const show = laserShow(animal.reactTime);
  const hit = { x: animal.x + LASER_REACH * animal.facing, y: animal.y };

  if (show.fire > 0) {
    const w = FIRE_WIDTH * show.fire;
    const h = FIRE_HEIGHT * show.fire;
    const p = worldToScreen(cam, hit.x - w / 2, hit.y - h);
    ctx.drawImage(
      sprites.effects.fire[show.frame],
      Math.round(p.x),
      Math.round(p.y),
      Math.max(1, Math.round(w * cam.zoom)),
      Math.max(1, Math.round(h * cam.zoom)),
    );
  }

  if (show.beam) {
    const tier = spriteTier(cam.zoom);
    const eye = robotEye(tier === 'dot' ? 'far' : tier);
    const from = worldToScreen(cam, animal.x + eye.x * animal.facing, animal.y - eye.y);
    const to = worldToScreen(cam, hit.x, hit.y);
    const width = Math.max(1, cam.zoom * 0.8);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = LASER_GLOW;
    ctx.lineWidth = width * 3;
    line(ctx, from, to);
    ctx.strokeStyle = LASER_CORE;
    ctx.lineWidth = width;
    line(ctx, from, to);
    ctx.restore();
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number}} from
 * @param {{x: number, y: number}} to
 */
function line(ctx, from, to) {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
