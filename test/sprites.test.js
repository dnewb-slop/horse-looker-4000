// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATURES,
  GRID_TIERS,
  SCENERY,
  creaturePalette,
  gridSize,
  outlineGrid,
  spriteTier,
  validateGrid,
} from '../src/render/sprites.js';
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

test('every creature has grids of the right size at every tier with only palette keys', () => {
  for (const [kind, art] of Object.entries(CREATURES)) {
    for (const tier of GRID_TIERS) {
      const { width, height } = gridSize(HORSE_WIDTH, HORSE_HEIGHT, tier);
      assert.deepEqual(
        validateGrid(art[tier], width, height, creaturePalette('A')),
        [],
        `${kind} ${tier}`,
      );
    }
  }
});

test('every head box sits inside the sprite and covers head pixels', () => {
  for (const [kind, art] of Object.entries(CREATURES)) {
    const { x, y, w, h } = art.headBox;
    assert.ok(x >= 0 && y >= 0 && x + w <= 1 && y + h <= 1, kind);
    const near = art.near;
    const cols = near[0].length;
    const rows = near.length;
    let filled = 0;
    for (let gy = Math.floor(y * rows); gy < Math.ceil((y + h) * rows); gy++) {
      for (let gx = Math.floor(x * cols); gx < Math.ceil((x + w) * cols); gx++) {
        if (near[gy][gx] !== '.' && near[gy][gx] !== 'o') filled++;
      }
    }
    assert.ok(filled > 15, `${kind}: head box covers only ${filled} head pixels`);
  }
});

test('horse-shaped look-alikes match the horse at Far, so their telltales first show at Mid', () => {
  for (const kind of ['centaur', 'reverseCentaur', 'robotHorse', 'horseSuit']) {
    const art = CREATURES[/** @type {keyof typeof CREATURES} */ (kind)];
    assert.deepEqual(art.far, HORSE.far, kind);
    assert.notDeepEqual(art.mid, HORSE.mid, kind);
  }
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

test('outlineGrid traces a one-pixel border outside the sprite', () => {
  assert.deepEqual(outlineGrid(['B.', '..']), ['xxx.', 'x.x.', 'xxx.', '....']);
});

test('horse outlines are one grid pixel bigger on every side and never cover the horse', () => {
  for (const tier of GRID_TIERS) {
    const rows = HORSE[tier];
    const outline = outlineGrid(rows);
    assert.equal(outline.length, rows.length + 2);
    assert.ok(outline.every((r) => r.length === rows[0].length + 2));
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== '.') assert.equal(outline[y + 1][x + 1], '.', `${tier} ${x},${y}`);
      }
    });
  }
});
