// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatZoom } from '../src/ui/hud.js';

test('zoom reads like a camera display', () => {
  assert.equal(formatZoom(1), '×1.0');
  assert.equal(formatZoom(4.54), '×4.5');
  assert.equal(formatZoom(9.96), '×10');
  assert.equal(formatZoom(24), '×24');
});
