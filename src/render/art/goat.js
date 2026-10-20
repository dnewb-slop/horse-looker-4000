// @ts-check
// A mountain goat seen from the side, facing right: lean, long legs, head held high, short
// curved horns and a long beard. Goats wear breed B's (Haflinger) colors.
//
// Far is hand-drawn to match the horse's Far grid in weight and outline, so at a distance the
// only tells are the horn tip, beard and raised head. Mid and Near are drawn from shapes.
// Keys: o outline, B coat, b shade, M beard, h horns and hooves, e eye.

import { drawShapes } from './pen.js';

/** Horns scaled toward their base, so they read as goat without towering over the head. */
const HORN_SCALE = 0.6;
const HORN_BASE = [17.2, 3.2];
/** @type {[number, number][]} */
const HORN = /** @type {[number, number][]} */ (
  [
    [17.6, 3],
    [16.6, 0.4],
    [13.4, 0.6],
    [12.4, 2.4],
    [13.4, 2.4],
    [14.4, 1.4],
    [15.9, 1.6],
    [16.8, 3.4],
  ].map(([x, y]) => [
    HORN_BASE[0] + (x - HORN_BASE[0]) * HORN_SCALE,
    HORN_BASE[1] + (y - HORN_BASE[1]) * HORN_SCALE,
  ])
);

/** @param {import('./pen.js').Pen} p */
function drawGoat(p) {
  p.polygon(
    [
      [5.5, 8],
      [4.5, 6.4],
      [5.7, 6.2],
      [6.8, 7.8],
    ],
    'b',
  ); // tail
  for (const x of [5.6, 8.4, 13, 15.8]) {
    p.rect(x, 10.8, x + 1.4, 15.2, 'b');
    p.rect(x, 15.2, x + 1.4, 16, 'h');
  }
  p.polygon(
    [
      [5, 7.6],
      [15.5, 7],
      [17, 11.6],
      [5.6, 12],
    ],
    'B',
  ); // body
  p.polygon(
    [
      [5.6, 10.6],
      [16.6, 10.3],
      [17, 11.6],
      [5.6, 12],
    ],
    'b',
  ); // belly
  p.polygon(
    [
      [14.6, 8.4],
      [16.8, 3.6],
      [19, 3.6],
      [17.6, 9.4],
    ],
    'B',
  ); // neck
  p.polygon(
    [
      [17.2, 2.6],
      [21, 3.6],
      [22.2, 5.2],
      [18, 5.6],
    ],
    'B',
  ); // head
  p.polygon(HORN, 'h');
  p.polygon(
    [
      [19.6, 5.2],
      [21, 5.2],
      [20.3, 9],
    ],
    'M',
  ); // beard
  p.rect(18.6, 3.4, 19.4, 4.2, 'e');
}

/** @type {import('../sprites.js').CreatureArt} */
export const GOAT = {
  far: [
    '.......h....',
    '.......BB...',
    '.......BBBB.',
    '.bBBBBBBBM..',
    '..BBBBBBB...',
    '..bb...bb...',
    '..bb...bb...',
    '..hh...hh...',
  ],
  mid: drawShapes(drawGoat, 'mid'),
  near: drawShapes(drawGoat, 'near'),
  headBox: { x: 0.68, y: 0.1, w: 0.27, h: 0.28 },
};
