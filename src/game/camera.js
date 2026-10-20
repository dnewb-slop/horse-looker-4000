// @ts-check
// The telephoto camera: where it looks, how far it's zoomed, and how wheel and drag input move it.
// Pure functions: each takes a camera and returns a new one.

import {
  MAX_WHEEL_DELTA,
  MAX_ZOOM_FACTOR,
  WHEEL_ZOOM_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ZOOM_EASE_RATE,
} from './config.js';

/**
 * @typedef {object} Camera
 * @property {number} x world x at the center of the view
 * @property {number} y world y at the center of the view
 * @property {number} zoom screen pixels per world unit
 * @property {number} targetZoom zoom the camera is easing toward
 * @property {number} anchorX screen x that stays fixed while zoom eases (the cursor)
 * @property {number} anchorY screen y that stays fixed while zoom eases
 * @property {number} viewWidth view size in screen pixels
 * @property {number} viewHeight
 * @property {number} minZoom zoom that fits the whole pasture
 * @property {number} maxZoom
 */

/**
 * A camera showing the whole pasture.
 * @param {number} viewWidth
 * @param {number} viewHeight
 * @returns {Camera}
 */
export function createCamera(viewWidth, viewHeight) {
  const minZoom = fitZoom(viewWidth, viewHeight);
  return {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    zoom: minZoom,
    targetZoom: minZoom,
    anchorX: viewWidth / 2,
    anchorY: viewHeight / 2,
    viewWidth,
    viewHeight,
    minZoom,
    maxZoom: minZoom * MAX_ZOOM_FACTOR,
  };
}

/**
 * The zoom at which the whole pasture fits in the view.
 * @param {number} viewWidth
 * @param {number} viewHeight
 */
export function fitZoom(viewWidth, viewHeight) {
  return Math.min(viewWidth / WORLD_WIDTH, viewHeight / WORLD_HEIGHT);
}

/**
 * Handle a window resize, keeping the same relative zoom.
 * @param {Camera} cam
 * @param {number} viewWidth
 * @param {number} viewHeight
 * @returns {Camera}
 */
export function resizeView(cam, viewWidth, viewHeight) {
  const minZoom = fitZoom(viewWidth, viewHeight);
  const scale = minZoom / cam.minZoom;
  return clampCenter({
    ...cam,
    viewWidth,
    viewHeight,
    minZoom,
    maxZoom: minZoom * MAX_ZOOM_FACTOR,
    zoom: cam.zoom * scale,
    targetZoom: cam.targetZoom * scale,
    anchorX: viewWidth / 2,
    anchorY: viewHeight / 2,
  });
}

/**
 * Apply a normalized wheel delta at a screen point. Negative deltas (wheel up) zoom in.
 * The zoom itself eases toward the new target in `stepCamera`.
 * @param {Camera} cam
 * @param {number} deltaY normalized wheel pixels
 * @param {number} screenX cursor position
 * @param {number} screenY
 * @returns {Camera}
 */
export function applyWheel(cam, deltaY, screenX, screenY) {
  const dy = Math.max(-MAX_WHEEL_DELTA, Math.min(MAX_WHEEL_DELTA, deltaY));
  const targetZoom = clamp(
    cam.targetZoom * Math.exp(-dy * WHEEL_ZOOM_SPEED),
    cam.minZoom,
    cam.maxZoom,
  );
  return { ...cam, targetZoom, anchorX: screenX, anchorY: screenY };
}

/**
 * Pan by a drag of (dx, dy) screen pixels: the pasture follows the pointer.
 * @param {Camera} cam
 * @param {number} dx
 * @param {number} dy
 * @returns {Camera}
 */
export function applyDrag(cam, dx, dy) {
  return clampCenter({ ...cam, x: cam.x - dx / cam.zoom, y: cam.y - dy / cam.zoom });
}

/**
 * Advance zoom easing by dt seconds, keeping the world point under the anchor fixed on screen.
 * Easing runs on log(zoom) so zooming feels equally smooth at every depth.
 * @param {Camera} cam
 * @param {number} dt
 * @returns {Camera}
 */
export function stepCamera(cam, dt) {
  if (cam.zoom === cam.targetZoom) return cam;
  const t = 1 - Math.exp(-dt * ZOOM_EASE_RATE);
  const logZoom = Math.log(cam.zoom) + (Math.log(cam.targetZoom) - Math.log(cam.zoom)) * t;
  let zoom = Math.exp(logZoom);
  // Snap when the remaining difference is invisible, so the camera comes to rest.
  if (Math.abs(zoom - cam.targetZoom) / cam.targetZoom < 1e-4) zoom = cam.targetZoom;

  const anchor = screenToWorld(cam, cam.anchorX, cam.anchorY);
  return clampCenter({
    ...cam,
    zoom,
    x: anchor.x - (cam.anchorX - cam.viewWidth / 2) / zoom,
    y: anchor.y - (cam.anchorY - cam.viewHeight / 2) / zoom,
  });
}

/**
 * @param {Camera} cam
 * @param {number} sx
 * @param {number} sy
 */
export function screenToWorld(cam, sx, sy) {
  return {
    x: cam.x + (sx - cam.viewWidth / 2) / cam.zoom,
    y: cam.y + (sy - cam.viewHeight / 2) / cam.zoom,
  };
}

/**
 * @param {Camera} cam
 * @param {number} wx
 * @param {number} wy
 */
export function worldToScreen(cam, wx, wy) {
  return {
    x: (wx - cam.x) * cam.zoom + cam.viewWidth / 2,
    y: (wy - cam.y) * cam.zoom + cam.viewHeight / 2,
  };
}

/**
 * Zoom relative to the whole-pasture view: 1 when fully zoomed out.
 * @param {Camera} cam
 */
export function zoomFactor(cam) {
  return cam.zoom / cam.minZoom;
}

/**
 * Keep the view over the pasture. On an axis where the view is wider than the pasture,
 * center the pasture instead.
 * @param {Camera} cam
 * @returns {Camera}
 */
export function clampCenter(cam) {
  return {
    ...cam,
    x: clampAxis(cam.x, cam.viewWidth / cam.zoom, WORLD_WIDTH),
    y: clampAxis(cam.y, cam.viewHeight / cam.zoom, WORLD_HEIGHT),
  };
}

/**
 * @param {number} center
 * @param {number} span visible world units on this axis
 * @param {number} size world size on this axis
 */
function clampAxis(center, span, size) {
  if (span >= size) return size / 2;
  return clamp(center, span / 2, size - span / 2);
}

/**
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
