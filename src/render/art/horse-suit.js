// @ts-check
// Two people in a horse suit, facing right, in breed A's (Friesian) colors. Drawn after a real
// two-person costume: a body too short for a horse, hanging low and baggy over human legs; a stiff
// upright neck that holds the head too high; big black shoes; and legs lighter than the body,
// the reverse of a real horse. It's a joke rather than a challenge, so it shows from Far on.
// Looked at, the front man takes the horse head off to show his own head, then puts it back on.
// Keys: the horse's (o outline, B coat, b shade, w legs, M mane, tail, shoes and hair, e eye), plus
// S skin.

import { HORSE_HEIGHT, HORSE_WIDTH } from '../../game/config.js';
import { grazeFrame, grazeHeadBox } from './motion.js';
import { drawShapes, stampGrid } from './pen.js';

/**
 * @param {import('./pen.js').Pen} p
 * @param {boolean} [unmasked] the front man has lifted the horse head off, showing his own
 */
function drawSuit(p, unmasked = false) {
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
  if (unmasked) {
    drawUnmasked(p);
    return;
  }
  drawHorseHead(p, 0, 0);
}

/**
 * The suit's horse head, held high on the neck, moved by (dx, dy) world units.
 * @param {import('./pen.js').Pen} p
 * @param {number} dx
 * @param {number} dy
 */
function drawHorseHead(p, dx, dy) {
  /** @param {[number, number][]} points */
  const at = (points) => points.map(([x, y]) => /** @type {[number, number]} */ ([x + dx, y + dy]));
  p.polygon(
    at([
      [16, 1.6],
      [19.6, 1.2],
      [23.4, 3.2],
      [23.4, 5],
      [21, 5.2],
      [18.6, 4.6],
      [16.4, 4],
    ]),
    'B',
  ); // head held high
  p.polygon(
    at([
      [16.2, 2],
      [16.8, 0],
      [18, 1.6],
    ]),
    'B',
  ); // ears
  p.polygon(
    at([
      [18, 1.6],
      [19, 0],
      [19.6, 1.5],
    ]),
    'B',
  );
  p.rect(22.4 + dx, 4 + dy, 23.2 + dx, 4.6 + dy, 'o'); // nostril
}

/** How far the front man lifts the horse head off, in world units. */
const LIFT = 5;

/**
 * The front man has lifted the horse head straight up off his own, arms raised to hold it: his
 * head with short dark hair shows out of the neck opening.
 * @param {import('./pen.js').Pen} p
 */
function drawUnmasked(p) {
  p.ellipse(17.7, 2.2, 1.5, 1.9, 'S'); // head
  p.polygon(
    [
      [16.1, 1.4],
      [16.6, 0.4],
      [17.8, 0.1],
      [19.0, 0.5],
      [19.4, 1.2],
      [17.6, 0.9],
    ],
    'M',
  ); // short dark hair
  p.rect(15.2, -0.6, 16, 3.6, 'S'); // arms up, holding the horse head
  p.rect(19.5, -0.6, 20.3, 3.6, 'S');
  drawHorseHead(p, 0, -LIFT);
}

/** A one-pixel eye like the horse's, which a shape would round away at Mid. */
const EYE = { mid: { x: 20, y: 3 }, near: { x: 40, y: 6 } };

/** Unmasked, in the taller grid: the lifted horse head's eye, and the front man's own eye. */
const UNMASKED_EYES = {
  mid: [
    { x: 20, y: 3 },
    { x: 18, y: 2 + LIFT },
  ],
  near: [
    { x: 40, y: 6 },
    { x: 36, y: 4 + 2 * LIFT },
  ],
};

/**
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function suitAt(tier) {
  return stampGrid(drawShapes(drawSuit, tier), EYE[tier].x, EYE[tier].y, ['e']);
}

/**
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function unmaskedAt(tier) {
  return UNMASKED_EYES[tier].reduce(
    (rows, eye) => stampGrid(rows, eye.x, eye.y, ['e']),
    drawShapes((p) => drawSuit(p, true), tier, LIFT),
  );
}

/**
 * Grazing, the stiff costume neck tips forward and the head points at the grass.
 * @type {import('./motion.js').GrazeRig}
 */
const NOD = { head: (wx, wy) => wx >= 15 && wy < 7, pivot: [17, 7], shift: [0, 1] };

const HEAD_BOX = { x: 0.66, y: 0, w: 0.32, h: 0.33 };
const mid = suitAt('mid');
const near = suitAt('near');

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
  mid,
  near,
  headBox: HEAD_BOX,
  // Two pairs of human legs.
  walk: {
    legTop: 11.6,
    groups: [
      { x0: 4.4, x1: 11.2, swing: -1 },
      { x0: 12.8, x1: 20, swing: 1 },
    ],
  },
  graze: {
    mid: grazeFrame(mid, 'mid', NOD),
    near: grazeFrame(near, 'near', NOD),
    headBox: grazeHeadBox(HEAD_BOX, NOD, HORSE_WIDTH, HORSE_HEIGHT),
  },
  // Looked at: the front man takes the horse head off to show his own, then puts it back on.
  unmask: { mid: unmaskedAt('mid'), near: unmaskedAt('near') },
};
