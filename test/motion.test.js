// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grazeFrame, grazeHeadBox, walkFrame } from '../src/render/art/motion.js';

test('walkFrame leans each leg group its way, more toward the hooves', () => {
  // At Mid one cell is one world unit; the legs start at y = 1.
  const rows = ['BBBBBB', '.B..B.', '.B..B.', '.B..B.'];
  const rig = {
    legTop: 1,
    groups: /** @type {const} */ ([
      { x0: 0, x1: 3, swing: -1 },
      { x0: 3, x1: 6, swing: 1 },
    ]),
  };
  assert.deepEqual(walkFrame(rows, 'mid', { ...rig, groups: [...rig.groups] }), [
    'BBBBBB',
    '.B..B.',
    'B....B',
    'B....B',
  ]);
});

test('grazeFrame turns the head a quarter turn clockwise about the pivot', () => {
  // A two-cell "head" pointing right from (2, 0) turns to point down from the pivot (2, 1).
  const rows = ['..BB', '....', '....', '....'];
  const turned = grazeFrame(rows, 'mid', {
    head: (wx, wy) => wy < 1,
    pivot: [2, 1],
    shift: [0, 0],
  });
  assert.deepEqual(
    turned.map((r) => r.replace(/o/g, '.')),
    ['....', '..B.', '..B.', '....'],
  );
});

test('grazeHeadBox moves the head box the same way', () => {
  // A box over the top-right quarter of a 4 × 4 box, turned about (2, 2), lands bottom right.
  const box = grazeHeadBox(
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { head: () => true, pivot: [2, 2], shift: [0, 0] },
    4,
    4,
  );
  assert.deepEqual(box, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 });
});
