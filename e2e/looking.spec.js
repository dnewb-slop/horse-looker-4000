// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Screen position of an animal's body center, or null once it's looked at.
 * @param {import('@playwright/test').Page} page
 * @param {number} id
 */
const animalOnScreen = (page, id) =>
  page.evaluate((id) => {
    const hook = /** @type {any} */ (globalThis).__horseLooker;
    const cam = hook.camera;
    const a = hook.play.animals.find((/** @type {any} */ a) => a.id === id);
    return {
      x: (a.x - cam.x) * cam.zoom + cam.viewWidth / 2,
      y: (a.y - 8 - cam.y) * cam.zoom + cam.viewHeight / 2,
      lookedAt: a.lookedAt,
    };
  }, id);

test('the pasture has scenery, horses and an empty bottom strip', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/?seed=4000');
  const counts = await page.evaluate(() => {
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    return { scenery: play.scenery.length, animals: play.animals.length };
  });
  expect(counts).toEqual({ scenery: 10, animals: 30 });
  await expect(page.locator('#strip')).toContainText('Level 1 / 3');
  await expect(page.locator('#strip')).toContainText('Horses 0/10');
  await expect(page.locator('#strip')).toContainText('Strikes 0/5');
  await expect(page.locator('.chip')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screenshots/pasture.png' });
  expect(errors).toEqual([]);
});

test('zooming in on a horse looks at it', async ({ page }) => {
  await page.goto('/?seed=4000');
  // A horse away from the pasture edges whose head isn't hidden behind scenery.
  const id = await page.evaluate(async () => {
    // Served paths, imported in the browser; kept out of TypeScript's module resolution.
    const urls = ['/src/game/detect.js', '/src/render/art/horse.js'];
    const [{ headVisible }, { HORSE }] = await Promise.all(urls.map((u) => import(u)));
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    const a = play.animals.find(
      (/** @type {any} */ a) =>
        a.x > 300 &&
        a.x < 3700 &&
        a.y > 300 &&
        a.y < 2200 &&
        headVisible(a, HORSE.headBox, play.hills, play.scenery),
    );
    return a.id;
  });

  // Keep the cursor on the horse while zooming, since it may wander off.
  for (let i = 0; i < 40; i++) {
    const p = await animalOnScreen(page, id);
    await page.mouse.move(p.x, p.y);
    await page.mouse.wheel(0, -240);
  }
  await expect(page.locator('#zoom-readout')).toHaveText('×64');
  await expect.poll(async () => (await animalOnScreen(page, id)).lookedAt).toBe(true);

  await expect(page.locator('#strip')).toContainText('Horses 1/10');
  await expect(page.locator('.chip.horse')).toHaveCount(1);
  await expect(page.locator('.horse-meter .slot.filled')).toHaveCount(1);
  await page.screenshot({ path: 'e2e/screenshots/looked-near.png' });

  // Back off to the Mid tier: the outline stays.
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 240);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/looked-mid.png' });
});
