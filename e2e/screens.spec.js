// @ts-check
import { test, expect } from '@playwright/test';
import { pickAnimal, zoomOnto } from './helpers.js';

/** @param {import('@playwright/test').Page} page */
const phase = (page) =>
  page.evaluate(() => /** @type {any} */ (globalThis).__horseLooker.play.phase);

test('the game opens with the intro, and clicks skip through it', async ({ page }) => {
  await page.goto('/?seed=4000');
  await expect(page.locator('#screen')).toContainText('The year is 4000.');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'e2e/screenshots/intro.png' });
  expect(await phase(page)).toBe('intro');

  await page.mouse.click(640, 400);
  await expect(page.locator('#screen')).toContainText('The American Cowboy is dead.');
  await page.mouse.click(640, 400);
  await expect(page.locator('#screen')).toContainText("It's you. The Horse Looker.");
  await page.mouse.click(640, 400);
  await expect.poll(() => phase(page)).toBe('playing');
  await expect(page.locator('#screen')).not.toHaveClass(/shown/);
});

test('three imposters lose the game, and "Horse again" starts over at level 1', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/?seed=4000&level=2');
  // Zooming in can catch neighbors too, so keep going until the game is lost.
  for (let i = 0; i < 3 && (await phase(page)) === 'playing'; i++) {
    await zoomOnto(page, await pickAnimal(page, false));
    // Back off to the whole pasture before the next one.
    for (let j = 0; j < 30; j++) await page.mouse.wheel(0, 240);
  }
  await expect.poll(() => phase(page)).toBe('lost');
  const screen = page.locator('#screen');
  await expect(screen).toContainText("Sorry kid, but you don't have what it takes");
  await expect(screen).toContainText('Non-horses looked at');
  // Two can finish in the same instant, so it's at least three.
  expect(await screen.locator('.chip.non-horse').count()).toBeGreaterThanOrEqual(3);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'e2e/screenshots/lose.png' });

  await screen.getByRole('button', { name: 'Horse again' }).click();
  await expect.poll(() => phase(page)).toBe('playing');
  await expect(page.locator('#strip')).toContainText('Level 1 / 3');
  await expect(page.locator('#strip')).toContainText('Imposters 0/3');
  await expect(page.locator('#zoom-readout')).toHaveText('×1.0');
});

test('?screen=win and ?screen=lose open straight on the end screens', async ({ page }) => {
  await page.goto('/?seed=4000&screen=win');
  await expect(page.locator('#screen')).toContainText("That's some damn fine horse looking!");
  await page.goto('/?seed=4000&screen=lose');
  await expect(page.locator('#screen')).toContainText('Sorry kid');
  await expect(page.locator('#screen .chip')).toHaveCount(6);
  await page.getByRole('button', { name: 'Horse again' }).click();
  await expect.poll(() => phase(page)).toBe('playing');
});
