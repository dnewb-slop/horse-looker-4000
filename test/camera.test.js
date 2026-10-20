// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDrag,
  applyWheel,
  createCamera,
  resizeView,
  screenToWorld,
  stepCamera,
  worldToScreen,
  zoomFactor,
} from '../src/game/camera.js';
import { MAX_ZOOM_FACTOR, TICK_HZ, WORLD_HEIGHT, WORLD_WIDTH } from '../src/game/config.js';

const DT = 1 / TICK_HZ;

/**
 * Step until the zoom settles.
 * @param {import('../src/game/camera.js').Camera} cam
 */
function settle(cam) {
  for (let i = 0; i < 600 && cam.zoom !== cam.targetZoom; i++) cam = stepCamera(cam, DT);
  return cam;
}

test('a new camera shows the whole pasture', () => {
  const cam = createCamera(1280, 800);
  assert.equal(zoomFactor(cam), 1);
  const topLeft = screenToWorld(cam, 0, 0);
  const bottomRight = screenToWorld(cam, 1280, 800);
  assert.ok(topLeft.x <= 0 && topLeft.y <= 0);
  assert.ok(bottomRight.x >= WORLD_WIDTH && bottomRight.y >= WORLD_HEIGHT);
});

test('wheel up zooms in, wheel down zooms out', () => {
  const cam = createCamera(1280, 800);
  assert.ok(applyWheel(cam, -100, 640, 400).targetZoom > cam.targetZoom);
  const zoomedIn = settle(applyWheel(cam, -500, 640, 400));
  assert.ok(applyWheel(zoomedIn, 100, 640, 400).targetZoom < zoomedIn.targetZoom);
});

test('zoom stays between the whole pasture and the maximum', () => {
  let cam = createCamera(1280, 800);
  cam = applyWheel(cam, 10_000, 640, 400);
  assert.equal(cam.targetZoom, cam.minZoom);
  for (let i = 0; i < 100; i++) cam = applyWheel(cam, -240, 640, 400);
  assert.equal(cam.targetZoom, cam.minZoom * MAX_ZOOM_FACTOR);
});

test('the world point under the cursor stays under the cursor while zooming', () => {
  let cam = createCamera(1280, 800);
  const [sx, sy] = [900, 300];
  const before = screenToWorld(cam, sx, sy);
  cam = applyWheel(cam, -400, sx, sy);
  for (let i = 0; i < 5; i++) {
    cam = stepCamera(cam, DT);
    const now = screenToWorld(cam, sx, sy);
    assert.ok(Math.abs(now.x - before.x) < 1e-6, `x drifted to ${now.x}`);
    assert.ok(Math.abs(now.y - before.y) < 1e-6, `y drifted to ${now.y}`);
  }
});

test('zoom eases smoothly and comes to rest at its target', () => {
  let cam = applyWheel(createCamera(1280, 800), -400, 640, 400);
  const first = stepCamera(cam, DT);
  assert.ok(first.zoom > cam.zoom && first.zoom < cam.targetZoom, 'moves partway in one tick');
  cam = settle(cam);
  assert.equal(cam.zoom, cam.targetZoom);
});

test('dragging pans the pasture with the pointer', () => {
  let cam = settle(applyWheel(createCamera(1280, 800), -800, 640, 400));
  const grabbed = screenToWorld(cam, 640, 400);
  cam = applyDrag(cam, 50, -30);
  const p = worldToScreen(cam, grabbed.x, grabbed.y);
  assert.ok(Math.abs(p.x - 690) < 1e-6 && Math.abs(p.y - 370) < 1e-6);
});

test('panning never shows past the pasture edges', () => {
  let cam = settle(applyWheel(createCamera(1280, 800), -800, 640, 400));
  cam = applyDrag(cam, 1e6, 1e6);
  const topLeft = screenToWorld(cam, 0, 0);
  assert.ok(Math.abs(topLeft.x) < 1e-6 && Math.abs(topLeft.y) < 1e-6);
  cam = applyDrag(cam, -1e7, -1e7);
  const bottomRight = screenToWorld(cam, 1280, 800);
  assert.ok(Math.abs(bottomRight.x - WORLD_WIDTH) < 1e-6);
  assert.ok(Math.abs(bottomRight.y - WORLD_HEIGHT) < 1e-6);
});

test('a fully zoomed-out camera keeps the pasture centered', () => {
  let cam = createCamera(1600, 800); // wider than the pasture's aspect
  cam = applyDrag(cam, 300, 0);
  assert.equal(cam.x, WORLD_WIDTH / 2);
});

test('resizing keeps the relative zoom', () => {
  const cam = settle(applyWheel(createCamera(1280, 800), -400, 640, 400));
  const resized = resizeView(cam, 640, 400);
  assert.ok(Math.abs(zoomFactor(resized) - zoomFactor(cam)) < 1e-9);
});
