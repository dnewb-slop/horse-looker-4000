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

test('level 1 has scenery, 40 animals and an empty bottom strip', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/?seed=4000');
  const counts = await page.evaluate(() => {
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    return { scenery: play.scenery.length, animals: play.animals.length };
  });
  expect(counts).toEqual({ scenery: 10, animals: 40 });
  await expect(page.locator('#strip')).toContainText('Level 1 / 3');
  await expect(page.locator('#strip')).toContainText('Horses 0/10');
  await expect(page.locator('#strip')).toContainText('Imposters 0/5');
  await expect(page.locator('.chip')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screenshots/pasture.png' });
  expect(errors).toEqual([]);
});

/**
 * Pick an animal away from the pasture edges whose head isn't hidden behind scenery.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} horse
 */
const pickAnimal = (page, horse) =>
  page.evaluate(async (horse) => {
    // Served paths, imported in the browser; kept out of TypeScript's module resolution.
    const urls = ['/src/game/detect.js', '/src/render/sprites.js'];
    const [{ headVisible }, { HEAD_BOXES }] = await Promise.all(urls.map((u) => import(u)));
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    const a = play.animals.find(
      (/** @type {any} */ a) =>
        (a.kind === 'horse') === horse &&
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
async function zoomOnto(page, id) {
  for (let i = 0; i < 40 && !(await animalOnScreen(page, id)).lookedAt; i++) {
    const p = await animalOnScreen(page, id);
    await page.mouse.move(p.x, p.y);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(20);
  }
  await expect.poll(async () => (await animalOnScreen(page, id)).lookedAt).toBe(true);
}

test('zooming in on a horse looks at it', async ({ page }) => {
  await page.goto('/?seed=4000');
  await zoomOnto(page, await pickAnimal(page, true));

  await expect(page.locator('#strip')).toContainText('Horses 1/10');
  await expect(page.locator('.chip.horse')).toHaveCount(1);
  await expect(page.locator('.horse-meter .slot.filled')).toHaveCount(1);
  await page.screenshot({ path: 'e2e/screenshots/looked-horse.png' });
});

test('looking at a non-horse counts an imposter', async ({ page }) => {
  await page.goto('/?seed=4000&level=3');
  const count = await page.evaluate(
    () => /** @type {any} */ (globalThis).__horseLooker.play.animals.length,
  );
  expect(count).toBe(80);
  await zoomOnto(page, await pickAnimal(page, false));

  await expect(page.locator('#strip')).toContainText('Level 3 / 3');
  await expect(page.locator('#strip')).toContainText('Imposters 1/5');
  await expect(page.locator('.chip.non-horse')).toHaveCount(1);
  await expect(page.locator('.strike-meter .slot.filled')).toHaveCount(1);
  await page.screenshot({ path: 'e2e/screenshots/looked-imposter.png' });

  // Back off to the Mid tier: the red outline stays.
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 240);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/looked-imposter-mid.png' });
});
