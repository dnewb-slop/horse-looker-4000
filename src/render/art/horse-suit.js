// @ts-check
// Two people in a horse suit, facing right, in breed A's (Friesian) colors. Drawn after a real
// two-person costume: a body too short for a horse, hanging low and baggy over human legs; a stiff
// upright neck that holds the head too high; big black shoes; and legs lighter than the body,
// the reverse of a real horse. It's a joke rather than a challenge, so it shows from Far on.
// Keys: the horse's (o outline, B coat, b shade, w legs, M mane, tail and shoes, e eye).

import { drawShapes, stampGrid } from './pen.js';

/** @param {import('./pen.js').Pen} p */
function drawSuit(p) {
  for (const [x, lean] of [
    [5.4, -0.6],
    [8.4, 0.4],
    [13.8, -0.4],
    [16.8, 0.6],
  ]) {
    // Human legs in suit fabric, a little splayed, with big black shoes pointing forward.
    p.polygon(
      [
        [x, 10.6],
        [x + 1.7, 10.6],
        [x + 1.7 + lean, 15],
        [x + lean, 15],
      ],
      'w',
    );
    p.ellipse(x + lean + 1.3, 15.3, 1.4, 0.75, 'M');
  }
  p.polygon(
    [
      [5.4, 7.8],
      [3.4, 8.6],
      [3.2, 11.4],
      [4.4, 11.6],
      [5.4, 9.4],
    ],
    'M',
  ); // tail
  const hem = /** @type {[number, number][]} */ ([
    [19.8, 11.6],
    [17.4, 11.1],
    [14.6, 11.7],
    [11.6, 11.2],
    [8.6, 11.7],
    [5.4, 11.3],
  ]);
  p.polygon([[5, 7.6], [15, 6.8], [19.6, 7.2], ...hem], 'B'); // short baggy body, sloping up to the neck, with a wavy hem
  p.polygon([[5.4, 10.3], [19.7, 10.5], ...hem], 'b');
  p.polygon(
    [
      [15.6, 8],
      [16, 2.8],
      [19.2, 2.6],
      [19.6, 8],
    ],
    'B',
  ); // stiff upright neck, long above the low back
  p.polygon(
    [
      [15, 8.2],
      [15.3, 2.2],
      [16.6, 2],
      [16.4, 8.2],
    ],
    'M',
  ); // mane down the back
  p.polygon(
    [
      [16, 1.6],
      [19.6, 1.2],
      [23.4, 3.2],
      [23.4, 5],
      [21, 5.2],
      [18.6, 4.6],
      [16.4, 4],
    ],
    'B',
  ); // head held high
  p.polygon(
    [
      [16.2, 2],
      [16.8, 0],
      [18, 1.6],
    ],
    'B',
  ); // ears
  p.polygon(
    [
      [18, 1.6],
      [19, 0],
      [19.6, 1.5],
    ],
    'B',
  );
  p.rect(22.4, 4, 23.2, 4.6, 'o'); // nostril
}

/** A one-pixel eye like the horse's, which a shape would round away at Mid. */
const EYE = { mid: { x: 20, y: 3 }, near: { x: 40, y: 6 } };

/**
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function suitAt(tier) {
  return stampGrid(drawShapes(drawSuit, tier), EYE[tier].x, EYE[tier].y, ['e']);
}

/** @type {import('../sprites.js').CreatureArt} */
export const HORSE_SUIT = {
  far: [
    '.........BB.',
    '........MBBB',
    '........MB..',
    '........MB..',
    '..MBBBBBBB..',
    '..MbbbbbbB..',
    '...ww..ww...',
    '...MM..MM...',
  ],
  mid: suitAt('mid'),
  near: suitAt('near'),
  headBox: { x: 0.66, y: 0, w: 0.32, h: 0.33 },
};
