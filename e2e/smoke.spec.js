// @ts-check
import { test, expect } from '@playwright/test';

test('the game loads with a full-window canvas and no errors', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto('/?seed=4000');
  await expect(page).toHaveTitle('Horse Looker 4000');

  const canvas = page.locator('#pasture');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width).toBe(1280);
  expect(box?.height).toBe(800);
  await expect(page.locator('#zoom-readout')).toHaveText('×1.0');

  // Screenshots let Claude look at the build; they are not compared against a baseline.
  await page.screenshot({ path: 'e2e/screenshots/smoke.png' });
  expect(errors).toEqual([]);
});
