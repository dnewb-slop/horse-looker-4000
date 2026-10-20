// @ts-check
// A reverse centaur, facing right: a person standing upright under a horse's head and neck. The
// head, neck and blond mane are cut from the horse grid where they are, so they match breed B's
// (Haflinger) head pixel for pixel. The shirt is mustard, close to the coat but not quite. It's a
// joke rather than a challenge, so it shows from Far on.
// Keys: the horse's, plus S skin, T shirt, P trousers.

import { HORSE } from './horse.js';
import { drawOnGrid, editGrid, eraseFromGrid } from './pen.js';

/**
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function reverseCentaurAt(tier) {
  const head = editGrid(HORSE[tier], tier, (wx, wy) => (wx >= 14.6 && wy < 6.6 ? undefined : '.'));
  return drawOnGrid(head, tier, (p) => {
    for (const x of [15, 18]) {
      p.rect(x, 11, x + 1.6, 15.2, 'P'); // trouser legs
      p.rect(x, 15.2, x + 2.4, 16, 'h'); // shoes
    }
    p.rect(13.4, 6.8, 14.6, 11.6, 'S'); // arms
    p.rect(19.8, 6.8, 21, 11.6, 'S');
    p.rect(14.4, 6.4, 20, 11.4, 'T'); // shirt
  });
}

/**
 * Grazing: the horse head bends down on a short neck in front of the shirt, its muzzle in the
 * grass. The head is the grazing horse's own, cut from where it is.
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function grazingAt(tier) {
  const body = eraseFromGrid(reverseCentaurAt(tier), tier, (wx, wy) => wy < 6.4);
  const head = editGrid(HORSE.graze[tier], tier, (wx, wy) =>
    wx > 19.6 && wy > 7 ? undefined : '.',
  );
  const both = body.map((row, y) =>
    [...row].map((k, x) => (head[y][x] !== '.' ? head[y][x] : k)).join(''),
  );
  return drawOnGrid(both, tier, (p) => {
    p.polygon(
      [
        [14.6, 7],
        [17, 5.4],
        [20.6, 6.6],
        [23.4, 8.4],
        [21, 9.4],
        [17.6, 8.4],
      ],
      'B',
    ); // neck bending down
    p.polygon(
      [
        [15.2, 6.6],
        [17, 5.2],
        [20.6, 6.2],
        [22.8, 7.8],
        [21.8, 8.2],
        [17.2, 6.4],
      ],
      'M',
    ); // mane
  });
}

/** @type {import('../sprites.js').CreatureArt} */
export const REVERSE_CENTAUR = {
  far: [
    '.........B..',
    '........MBB.',
    '........MBBB',
    '.......STTS.',
    '.......STTS.',
    '........PP..',
    '........PP..',
    '........hh..',
  ],
  mid: reverseCentaurAt('mid'),
  near: reverseCentaurAt('near'),
  headBox: HORSE.headBox,
  // Two legs, scissoring.
  walk: {
    legTop: 11.4,
    groups: [
      { x0: 14.6, x1: 17.7, swing: -1 },
      { x0: 17.7, x1: 21, swing: 1 },
    ],
  },
  graze: { mid: grazingAt('mid'), near: grazingAt('near'), headBox: HORSE.graze.headBox },
};
