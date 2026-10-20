// @ts-check
// A sheep seen from the side, facing right: a round woolly body, dark face and thin dark legs.
// Sheep wear breed C's (Camarillo White) colors, and their round body shows from Far on.
// Keys: o outline, B wool, w wool highlight, h face and legs.

import { drawShapes } from './pen.js';

/** @param {import('./pen.js').Pen} p */
function drawSheep(p) {
  for (const x of [6, 9, 13.5, 16]) p.rect(x, 12, x + 1.5, 16, 'h');
  p.ellipse(11.5, 9, 8, 4.5, 'B');
  p.ellipse(10, 7.5, 5, 2.2, 'w');
  p.ellipse(20.5, 8, 2.6, 2, 'h'); // dark face
  p.rect(18, 6, 19.5, 7.5, 'h'); // ear
}

/** @type {import('../sprites.js').CreatureArt} */
export const SHEEP = {
  far: drawShapes(drawSheep, 'far'),
  mid: drawShapes(drawSheep, 'mid'),
  near: drawShapes(drawSheep, 'near'),
  headBox: { x: 0.72, y: 0.35, w: 0.25, h: 0.3 },
};
