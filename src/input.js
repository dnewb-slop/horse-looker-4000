// @ts-check
// Collects wheel and drag input from the canvas between logic ticks.

import { WHEEL_LINE_PX, WHEEL_PAGE_PX } from './game/config.js';

/**
 * @typedef {object} InputFrame
 * @property {{deltaY: number, x: number, y: number}[]} wheels normalized wheel events, oldest first
 * @property {number} dragX screen pixels dragged since the last frame
 * @property {number} dragY
 */

/**
 * Mice report wheel deltas in lines or pages, trackpads in pixels. Convert everything to pixels.
 * @param {WheelEvent} e
 */
export function normalizeWheel(e) {
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return e.deltaY * WHEEL_LINE_PX;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return e.deltaY * WHEEL_PAGE_PX;
  return e.deltaY;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ drain: () => InputFrame }}
 */
export function createInput(canvas) {
  /** @type {InputFrame} */
  let frame = { wheels: [], dragX: 0, dragY: 0 };
  /** @type {{id: number, x: number, y: number} | null} */
  let drag = null;

  canvas.addEventListener(
    'wheel',
    (e) => {
      // Also stops the browser's page zoom on trackpad pinch (ctrl + wheel).
      e.preventDefault();
      frame.wheels.push({ deltaY: normalizeWheel(e), x: e.offsetX, y: e.offsetY });
    },
    { passive: false },
  );

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || drag) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    frame.dragX += e.clientX - drag.x;
    frame.dragY += e.clientY - drag.y;
    drag.x = e.clientX;
    drag.y = e.clientY;
  });

  /** @param {PointerEvent} e */
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return {
    drain() {
      const out = frame;
      frame = { wheels: [], dragX: 0, dragY: 0 };
      return out;
    },
  };
}
