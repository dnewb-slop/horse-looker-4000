// @ts-check
// A goat built on the horse, facing right. Goats wear breed B's (Haflinger) colors and copy the
// horse closely: the same body, blond mane and blond tail. The tells are the dark horns where the
// ears should be, a blond beard, and a tail cut short to an upturned stub.
//
// Far is the horse with two pixels changed: a horn for the ear and a beard under the chin.
// Keys: the horse's (o outline, B coat, b shade, w highlight, M mane, tail and beard, h horns and
// hooves, e eye).

import { HORSE } from './horse.js';
import { drawOnGrid, editGrid, eraseFromGrid } from './pen.js';

/**
 * Where the horn and beard go, standing and grazing: they follow the head.
 * @type {Record<'stand' | 'graze', {horn: [number, number][], beard: [number, number][]}>}
 */
const HEAD_PARTS = {
  stand: {
    horn: [
      [19.4, 1.4],
      [18.6, -0.2],
      [16.6, -0.4],
      [15.8, 0.8],
      [16.8, 0.6],
      [17.8, 1.6],
    ],
    beard: [
      [19.6, 5.6],
      [21.6, 5.4],
      [20.4, 8.6],
    ],
  },
  // Head down: the horn sweeps back from the poll and the beard hangs from the chin.
  graze: {
    horn: [
      [21.4, 8.2],
      [21, 6.4],
      [19.2, 5.2],
      [18.6, 5.8],
      [19.8, 6.8],
      [20.4, 8.4],
    ],
    beard: [
      [20.2, 12.6],
      [21, 12.8],
      [19.6, 15.4],
    ],
  },
};

/**
 * @param {'stand' | 'graze'} pose
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function goatAt(pose, tier) {
  const horse = pose === 'stand' ? HORSE[tier] : HORSE.graze[tier];
  // The mane stays blond down the back of the neck but not between the horns.
  let g = editGrid(horse, tier, (wx, wy, k) =>
    k === 'M' && wx > 12 && wy < 1.2 ? 'B' : undefined,
  );
  // The long tail goes, leaving a stub drawn below.
  g = eraseFromGrid(g, tier, (wx, wy, k) => wx < 4 && wy > 6.5 && (k === 'M' || k === 'o'));
  return drawOnGrid(g, tier, (p) => {
    p.polygon(
      [
        [3.2, 4.6],
        [1.6, 3.2],
        [2.6, 2.6],
        [4.8, 4.4],
      ],
      'M',
    ); // upturned tail stub
    p.polygon(HEAD_PARTS[pose].horn, 'h'); // horn, curving back from where the ear was
    p.polygon(HEAD_PARTS[pose].beard, 'M');
  });
}

/** @type {import('../sprites.js').CreatureArt} */
export const GOAT = {
  far: [
    '.........h..',
    '........MBB.',
    '..BBBBBBMBBB',
    '.MBBBBBBBBM.',
    '.MBBBBBBB...',
    '.Mbb...bb...',
    '..bb...bb...',
    '..hh...hh...',
  ],
  mid: goatAt('stand', 'mid'),
  near: goatAt('stand', 'near'),
  headBox: HORSE.headBox,
  walk: HORSE.walk,
  graze: {
    mid: goatAt('graze', 'mid'),
    near: goatAt('graze', 'near'),
    headBox: HORSE.graze.headBox,
  },
};
