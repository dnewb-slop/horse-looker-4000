// @ts-check
// A robot horse, facing right: breed C's (Camarillo White) horse with metal legs. Mid and Near
// add knee joints and flat feet, an antenna with a red light, a red LED eye and a faint charging
// bolt on the rump, where a car's plug would go.
//
// Far is the horse with metal legs and dark feet: a small color shift on a white horse.
// Keys: the horse's, plus R robot metal, r robot joints, L LED.

import { HORSE } from './horse.js';
import { drawOnGrid, editGrid, stampGrid } from './pen.js';

/** The charging bolt in metal gray, and where its top-left cell sits at each tier. */
const CHARGE_BOLT = {
  mid: { x: 5, y: 6, art: ['.R', 'RR', 'R.'] },
  near: { x: 10, y: 12, art: ['..RR', '.RR.', 'RRRR', '.RR.', 'RR..'] },
};

/**
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function robotHorseAt(tier) {
  let g = editGrid(HORSE[tier], tier, (wx, wy, k) => {
    if (k === 'e') return 'L';
    if (wy < 10.5) return undefined;
    if (k === 'h') return 'r'; // flat feet
    if (k === 'b') return wy > 12 && wy < 13 ? 'r' : 'R'; // metal legs with knee joints
    return undefined;
  });
  const bolt = CHARGE_BOLT[tier];
  g = stampGrid(g, bolt.x, bolt.y, bolt.art);
  g = drawOnGrid(g, tier, (p) => p.rect(19.1, -1, 19.6, 1, 'r')); // antenna
  return editGrid(g, tier, (wx, wy, k) =>
    wy < 0.6 && Math.abs(wx - 19.35) < 0.6 && k !== '.' ? 'L' : undefined,
  ); // its light
}

/** @type {import('../sprites.js').CreatureArt} */
export const ROBOT_HORSE = {
  far: [
    '.........B..',
    '........MBB.',
    '..BBBBBBMBBB',
    '.MBBBBBBBB..',
    '.MBBBBBBB...',
    '.MRR...RR...',
    '..RR...RR...',
    '..rr...rr...',
  ],
  mid: robotHorseAt('mid'),
  near: robotHorseAt('near'),
  headBox: HORSE.headBox,
};
