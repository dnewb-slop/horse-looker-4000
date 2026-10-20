// @ts-check
// A centaur, facing right: the horse's body with a bare-chested human torso rising from the
// withers, long black hair down the back and arms at the sides. Centaurs wear breed A's
// (Friesian) colors.
//
// Far is the plain horse grid: DESIGN.md says the upright torso first shows at Mid. Mid and Near
// slim the horse's barrel so the torso has room above the back.
// Keys: the horse's, plus S skin.

import { HORSE } from './horse.js';
import { drawOnHorseBody } from './pen.js';

/** World units the back is lowered to make room for the torso. */
const DROP = 2;

/** @param {import('./pen.js').Pen} p */
function drawRider(p) {
  p.rect(15.1, 3.4, 15.9, 7.4, 'S'); // back arm
  p.rect(18.9, 3.4, 19.7, 7.4, 'S'); // front arm
  p.rect(15.9, 3, 18.9, 7.8, 'S'); // torso
  p.ellipse(17.4, 1.6, 1.3, 1.4, 'S'); // head
  p.polygon(
    [
      [15.9, 0.4],
      [18.6, 0.1],
      [18.6, 0.9],
      [16.9, 1.1],
      [16.7, 4.6],
      [15.6, 4.2],
    ],
    'M',
  ); // long hair
  p.rect(18, 1.3, 18.6, 1.9, 'e');
}

/** @type {import('../sprites.js').CreatureArt} */
export const CENTAUR = {
  far: HORSE.far,
  mid: drawOnHorseBody(drawRider, 'mid', DROP),
  near: drawOnHorseBody(drawRider, 'near', DROP),
  headBox: { x: 0.66, y: 0, w: 0.13, h: 0.2 },
};
