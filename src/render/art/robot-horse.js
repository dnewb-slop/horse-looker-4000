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
 * The antenna, standing and grazing: it sits where the ear was, lit red at the tip.
 * @type {Record<'stand' | 'graze', {x0: number, x1: number, top: number, bottom: number, light: number}>}
 */
const ANTENNA = {
  stand: { x0: 19.1, x1: 19.6, top: -1, bottom: 1, light: 0.6 },
  graze: { x0: 23, x1: 23.5, top: 5.4, bottom: 7.6, light: 6 },
};

/**
 * @param {'stand' | 'graze'} pose
 * @param {'mid' | 'near'} tier
 * @returns {string[]}
 */
function robotHorseAt(pose, tier) {
  const horse = pose === 'stand' ? HORSE[tier] : HORSE.graze[tier];
  let g = editGrid(horse, tier, (wx, wy, k) => {
    if (k === 'e') return 'L';
    if (wy < 10.5) return undefined;
    if (k === 'h') return 'r'; // flat feet
    if (k === 'b') return wy > 12 && wy < 13 ? 'r' : 'R'; // metal legs with knee joints
    return undefined;
  });
  const bolt = CHARGE_BOLT[tier];
  g = stampGrid(g, bolt.x, bolt.y, bolt.art);
  const a = ANTENNA[pose];
  g = drawOnGrid(g, tier, (p) => p.rect(a.x0, a.top, a.x1, a.bottom, 'r'));
  return editGrid(g, tier, (wx, wy, k) =>
    wy < a.light && wx > a.x0 - 0.35 && wx < a.x1 + 0.35 && k !== '.' ? 'L' : undefined,
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
  mid: robotHorseAt('stand', 'mid'),
  near: robotHorseAt('stand', 'near'),
  headBox: HORSE.headBox,
  walk: HORSE.walk,
  graze: {
    mid: robotHorseAt('graze', 'mid'),
    near: robotHorseAt('graze', 'near'),
    headBox: HORSE.graze.headBox,
  },
};
