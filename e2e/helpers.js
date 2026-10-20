// @ts-check
// Shared browser-test helpers that drive the game through real wheel input.
import { expect } from '@playwright/test';

/**
 * Screen position of an animal's body center, or null once it's looked at.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
export const animalOnScreen = (page, id) =>
  page.evaluate((id) => {
    const hook = /** @type {any} */ (globalThis).__horseLooker;
    const cam = hook.camera;
    const a = hook.play.animals.find((/** @type {any} */ a) => a.id === id);
    return {
      x: (a.x - cam.x) * cam.zoom + cam.viewWidth / 2,
      y: (a.y - 8 - cam.y) * cam.zoom + cam.viewHeight / 2,
      // Done once it's looked at, or once the game stops counting looks (e.g. it was lost).
      lookedAt: a.lookedAt || hook.play.phase !== 'playing',
    };
  }, id);

/**
 * Pick an animal away from the pasture edges whose head isn't hidden behind scenery or a crest
 * and that hasn't been looked at yet.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} horse
 */
export const pickAnimal = (page, horse) =>
  page.evaluate(async (horse) => {
    // Served paths, imported in the browser; kept out of TypeScript's module resolution.
    const urls = ['/src/game/detect.js', '/src/render/sprites.js'];
    const [{ headVisible }, { HEAD_BOXES }] = await Promise.all(urls.map((u) => import(u)));
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    // Prefer one that will stand still for a while, so it can't wander over a ridge mid-zoom.
    const candidates = [...play.animals].sort(
      (/** @type {any} */ p, /** @type {any} */ q) =>
        Number(q.mode === 'idle' && q.idleTime > 3) - Number(p.mode === 'idle' && p.idleTime > 3),
    );
    const a = candidates.find(
      (/** @type {any} */ a) =>
        (a.kind === 'horse') === horse &&
        !a.lookedAt &&
        a.x > 300 &&
        a.x < 3700 &&
        a.y > 300 &&
        a.y < 2200 &&
        headVisible(a, HEAD_BOXES[a.kind], play.hills, play.scenery),
    );
    return a.id;
  }, horse);

/**
 * Zoom in on an animal, keeping the cursor on it since it may wander, until it's looked at.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
export async function zoomOnto(page, id) {
  for (let i = 0; i < 40 && !(await animalOnScreen(page, id)).lookedAt; i++) {
    const p = await animalOnScreen(page, id);
    await page.mouse.move(p.x, p.y);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(20);
  }
  await expect.poll(async () => (await animalOnScreen(page, id)).lookedAt).toBe(true);
}
