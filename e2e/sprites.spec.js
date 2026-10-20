// @ts-check
import { test, expect } from '@playwright/test';

test('the sprite review page renders every sprite without errors', async ({ page }) => {
  /** @type {string[]} */
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto('/tools/sprites.html');
  await expect
    .poll(() => page.evaluate(() => /** @type {any} */ (globalThis).__spritesReady))
    .toBe(true);
  // 3 breeds × 4 tiers, 6 look-alikes × 4 tiers, 3 scenery objects × 3 tiers, 4 scenes.
  await expect(page.locator('canvas')).toHaveCount(12 + 24 + 9 + 4);
  await page.screenshot({ path: 'e2e/screenshots/sprites.png', fullPage: true });
  expect(errors).toEqual([]);
});
