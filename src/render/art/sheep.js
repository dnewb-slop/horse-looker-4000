// @ts-check
// A sheep built on the horse, facing right. Sheep wear breed C's (Camarillo White) colors and
// copy the horse's shape: white wool over the horse's body and legs down to the knees. The tells
// are the dark face and lower legs, small wool bumps along the back, an ear sticking out sideways
// and a round tail puff in place of the tail.
//
// Far is the horse with two wool bumps on its back and a dark muzzle.
// Keys: o outline, B wool, b wool shade, w wool highlight, h face and lower legs, e eye.

import { HORSE } from './horse.js';
import { drawOnGrid, editGrid, eraseFromGrid } from './pen.js';

/** World y of the knees: the legs are white wool above, dark below. */
const KNEE_Y = 13;

/**
 * The parts that follow the head, standing and grazing: where the face is dark, the ear that
 * sticks out sideways, and how far along the back the wool bumps run before the neck.
 * @type {Record<'stand' | 'graze', {face: (wx: number, wy: number) => boolean, ear: [number, number][], bumps: number[]}>}
 */
const HEAD_PARTS = {
  stand: {
    face: (wx, wy) => wx > 19.4 && wy < 6.2,
    ear: [
      [19.4, 1.6],
      [17.4, 2.2],
      [17.8, 3],
      [19.6, 2.6],
    ],
    bumps: [5, 8, 11, 14],
  },
  graze: {
    face: (wx, wy) => wx > 19.6 && wy > 8.4,
    ear: [
      [20.4, 9.6],
      [18.6, 9.6],
      [18.8, 10.6],
      [20.4, 10.4],
    ],
    bumps: [5, 8, 11],
  },
};

/**
 * @param {'stand' | 'graze'} pose
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function sheepAt(pose, tier) {
  const parts = HEAD_PARTS[pose];
  let g = eraseFromGrid(
    pose === 'stand' ? HORSE[tier] : HORSE.graze[tier],
    tier,
    (wx, wy, k) => wx < 3.6 && wy > 5.5 && (k === 'M' || k === 'o'),
  ); // no tail
  g = editGrid(g, tier, (wx, wy, k) => {
    if (k === 'M') return 'B'; // the mane is wool too
    if (parts.face(wx, wy) && (k === 'B' || k === 'w')) return 'h'; // dark face
    if (wy > 11 && k === 'b') return wy < KNEE_Y ? 'B' : 'h';
    if (k === 'w') return 'B';
    return undefined;
  });
  return drawOnGrid(g, tier, (p) => {
    for (const x of parts.bumps) p.ellipse(x, 5, 1.8, 1.1, 'B'); // wool bumps on the back
    for (const x of [6.5, 9.5, 12.5]) p.ellipse(x, 5.6, 0.9, 0.5, 'w');
    p.ellipse(3.6, 6.2, 1.4, 1.4, 'B'); // tail puff
    p.polygon(parts.ear, 'h'); // ear sticking out sideways
  });
}

/** @type {import('../sprites.js').CreatureArt} */
export const SHEEP = {
  far: [
    '.........B..',
    '...B.B..MBB.',
    '..BBBBBBMBhh',
    '.MBBBBBBBB..',
    '.MBBBBBBB...',
    '.Mbb...bb...',
    '..bb...bb...',
    '..hh...hh...',
  ],
  mid: sheepAt('stand', 'mid'),
  near: sheepAt('stand', 'near'),
  headBox: HORSE.headBox,
  walk: HORSE.walk,
  graze: {
    mid: sheepAt('graze', 'mid'),
    near: sheepAt('graze', 'near'),
    headBox: HORSE.graze.headBox,
  },
};
