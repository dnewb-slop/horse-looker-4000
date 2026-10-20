// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRaster, inEllipse, inPolygon } from '../src/render/raster.js';

test('fillRect clips to the grid and outline wraps filled cells', () => {
  const r = createRaster(5, 4);
  r.fillRect(1, 1, 9, 3, 'X');
  r.outline('o');
  assert.deepEqual(r.rows(), ['.oooo', 'oXXXX', 'oXXXX', '.oooo']);
});

test('shape tests', () => {
  const square = /** @type {[number, number][]} */ ([
    [0, 0],
    [4, 0],
    [4, 4],
    [0, 4],
  ]);
  assert.ok(inPolygon(2, 2, square));
  assert.ok(!inPolygon(5, 2, square));
  assert.ok(inEllipse(1, 0, 0, 0, 2, 1));
  assert.ok(!inEllipse(0, 1.5, 0, 0, 2, 1));
});
