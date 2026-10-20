// @ts-check
// A reverse centaur, facing right: a person standing upright under a horse's head and neck. The
// head, neck and blond mane are cut from the horse grid where they are, so they match breed B's
// (Haflinger) head pixel for pixel. The shirt is mustard, close to the coat but not quite. It's a
// joke rather than a challenge, so it shows from Far on.
// Keys: the horse's, plus S skin, T shirt, P trousers.

import { HORSE } from './horse.js';
import { drawOnGrid, editGrid } from './pen.js';

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
};
