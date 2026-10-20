// @ts-check
import { test, expect } from '@playwright/test';
import { pickAnimal, zoomOnto } from './helpers.js';

test('level 1 has scenery, 40 animals and an empty bottom strip', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/?seed=4000&intro=off');
  const counts = await page.evaluate(() => {
    const play = /** @type {any} */ (globalThis).__horseLooker.play;
    return { scenery: play.scenery.length, animals: play.animals.length };
  });
  expect(counts).toEqual({ scenery: 10, animals: 40 });
  await expect(page.locator('#strip')).toContainText('Level 1 / 3');
  await expect(page.locator('#strip')).toContainText('Horses 0/5');
  await expect(page.locator('#strip')).toContainText('Imposters 0/3');
  await expect(page.locator('.chip')).toHaveCount(0);
  await page.screenshot({ path: 'e2e/screenshots/pasture.png' });
  expect(errors).toEqual([]);
});

test('zooming in on a horse looks at it', async ({ page }) => {
  await page.goto('/?seed=4000&intro=off');
  await zoomOnto(page, await pickAnimal(page, true));

  await expect(page.locator('#strip')).toContainText('Horses 1/5');
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
  await expect(page.locator('#strip')).toContainText('Imposters 1/3');
  await expect(page.locator('.chip.non-horse')).toHaveCount(1);
  await expect(page.locator('.strike-meter .slot.filled')).toHaveCount(1);
  await page.screenshot({ path: 'e2e/screenshots/looked-imposter.png' });

  // Back off to the Mid tier: the red outline stays.
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 240);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/screenshots/looked-imposter-mid.png' });
});
