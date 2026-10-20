// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRID_TIERS, SCENERY, gridSize, spriteTier, validateGrid } from '../src/render/sprites.js';
import { HORSE } from '../src/render/art/horse.js';
import { BREED_PALETTES } from '../src/render/palette.js';
import {
  DOT_MAX_PX,
  FAR_MAX_PX,
  HORSE_HEIGHT,
  HORSE_WIDTH,
  MID_MAX_PX,
} from '../src/game/config.js';

test('horse grids have the right size at every tier and use only palette keys', () => {
  for (const tier of GRID_TIERS) {
    const { width, height } = gridSize(HORSE_WIDTH, HORSE_HEIGHT, tier);
    for (const [breed, palette] of Object.entries(BREED_PALETTES)) {
      assert.deepEqual(validateGrid(HORSE[tier], width, height, palette), [], `${breed} ${tier}`);
    }
  }
});

test('every breed palette defines the same keys', () => {
  const keys = Object.keys(BREED_PALETTES.A).sort();
  for (const palette of Object.values(BREED_PALETTES))
    assert.deepEqual(Object.keys(palette).sort(), keys);
});

test('the horse head box sits inside the sprite and covers head pixels', () => {
  const { x, y, w, h } = HORSE.headBox;
  assert.ok(x >= 0 && y >= 0 && x + w <= 1 && y + h <= 1);
  const near = HORSE.near;
  const cols = near[0].length;
  const rows = near.length;
  let filled = 0;
  for (let gy = Math.floor(y * rows); gy < Math.ceil((y + h) * rows); gy++) {
    for (let gx = Math.floor(x * cols); gx < Math.ceil((x + w) * cols); gx++) {
      if (near[gy][gx] !== '.' && near[gy][gx] !== 'o') filled++;
    }
  }
  assert.ok(filled > 20, `head box covers only ${filled} head pixels`);
});

test('scenery draws at the right size at every tier with only palette keys', () => {
  for (const [kind, s] of Object.entries(SCENERY)) {
    for (const tier of GRID_TIERS) {
      const { width, height } = gridSize(s.width, s.height, tier);
      const rows = s.draw(width, height);
      assert.deepEqual(validateGrid(rows, width, height, s.palette), [], `${kind} ${tier}`);
      const solid = rows.join('').replace(/\./g, '').length;
      assert.ok(solid > width * height * 0.3, `${kind} ${tier} is mostly empty`);
    }
  }
});

test('scenery art is deterministic', () => {
  for (const s of Object.values(SCENERY)) assert.deepEqual(s.draw(60, 40), s.draw(60, 40));
});

test('datacenters are at least twice the size of barns', () => {
  assert.ok(SCENERY.datacenter.width >= 2 * SCENERY.barn.width);
});

test('the tier follows how tall a horse is on screen', () => {
  const zoomFor = (/** @type {number} */ px) => px / HORSE_HEIGHT;
  assert.equal(spriteTier(zoomFor(DOT_MAX_PX - 0.1)), 'dot');
  assert.equal(spriteTier(zoomFor(DOT_MAX_PX)), 'far');
  assert.equal(spriteTier(zoomFor(FAR_MAX_PX)), 'mid');
  assert.equal(spriteTier(zoomFor(MID_MAX_PX - 0.1)), 'mid');
  assert.equal(spriteTier(zoomFor(MID_MAX_PX)), 'near');
});

test('validateGrid reports bad shapes and unknown keys', () => {
  const problems = validateGrid(['..x', '...', '..'], 3, 2, { o: '#000' });
  assert.equal(problems.length, 3);
});
