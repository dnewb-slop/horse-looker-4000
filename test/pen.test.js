// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawOnGrid, editGrid, eraseFromGrid, stampGrid } from '../src/render/art/pen.js';

test('editGrid changes cells by their world-unit centers', () => {
  // At Mid one cell is one world unit, so cell (1, 0) is centered at (1.5, 0.5).
  const out = editGrid(['BBB', 'BBB'], 'mid', (wx, wy) => (wx > 1 && wy < 1 ? 'w' : undefined));
  assert.deepEqual(out, ['Bww', 'BBB']);
});

test('editGrid uses each tier’s density', () => {
  // At Near a world unit is two cells, so only the first two columns are left of x = 1.
  assert.deepEqual(
    editGrid(['BBBB'], 'near', (wx) => (wx < 1 ? 'w' : undefined)),
    ['wwBB'],
  );
});

test('drawOnGrid draws shapes and re-traces the outline, except at Far', () => {
  const blank = ['....', '....', '....'];
  assert.deepEqual(
    drawOnGrid(blank, 'mid', (p) => p.rect(1, 1, 2, 2, 'B')),
    ['.o..', 'oBo.', '.o..'],
  );
  assert.deepEqual(
    drawOnGrid(blank, 'far', (p) => p.rect(2, 2, 4, 4, 'B')),
    ['....', '.B..', '....'],
  );
});

test('eraseFromGrid cuts cells and drops outline left touching nothing', () => {
  const rows = ['.oo..', 'oBBo.', '.oo..'];
  // Cut the right-hand B: its outline goes, and the cut edge gets outlined.
  assert.deepEqual(
    eraseFromGrid(rows, 'mid', (wx) => wx > 2),
    ['.o...', 'oBo..', '.o...'],
  );
});

test('stampGrid pastes a small grid, leaving its transparent cells alone', () => {
  assert.deepEqual(stampGrid(['BBB', 'BBB', 'BBB'], 1, 1, ['e.', 'ee']), ['BBB', 'BeB', 'Bee']);
});
