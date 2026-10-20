// @ts-check
import { test, expect } from '@playwright/test';

/**
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{x: number, y: number, zoom: number, targetZoom: number, minZoom: number}>}
 */
const camera = (page) =>
  page.evaluate(() => {
    const c = /** @type {any} */ (globalThis).__horseLooker.camera;
    return { x: c.x, y: c.y, zoom: c.zoom, targetZoom: c.targetZoom, minZoom: c.minZoom };
  });

/** @param {import('@playwright/test').Page} page */
async function waitForZoomToSettle(page) {
  await expect
    .poll(async () => {
      const c = await camera(page);
      return c.zoom === c.targetZoom;
    })
    .toBe(true);
}

test('wheel zooms toward the cursor and the readout follows', async ({ page }) => {
  await page.goto('/?seed=4000&intro=off');
  await page.mouse.move(900, 300);
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, -200);
  await waitForZoomToSettle(page);

  const c = await camera(page);
  const factor = c.zoom / c.minZoom;
  expect(factor).toBeGreaterThan(3);
  // The camera moved toward the cursor, which was right of and above center.
  expect(c.x).toBeGreaterThan(2000);
  expect(c.y).toBeLessThan(1250);
  await expect(page.locator('#zoom-readout')).not.toHaveText('×1.0');
  await page.screenshot({ path: 'e2e/screenshots/zoom-mid.png' });

  for (let i = 0; i < 20; i++) await page.mouse.wheel(0, -240);
  await waitForZoomToSettle(page);
  await expect(page.locator('#zoom-readout')).toHaveText('×64');
  await page.screenshot({ path: 'e2e/screenshots/zoom-max.png' });

  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 240);
  await waitForZoomToSettle(page);
  await expect(page.locator('#zoom-readout')).toHaveText('×1.0');
});

test('dragging pans the view', async ({ page }) => {
  await page.goto('/?seed=4000&intro=off');
  await page.mouse.move(640, 400);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -200);
  await waitForZoomToSettle(page);
  const before = await camera(page);

  await page.mouse.down();
  await page.mouse.move(540, 350, { steps: 5 });
  await page.mouse.up();
  await expect.poll(async () => (await camera(page)).x).toBeGreaterThan(before.x);
  const after = await camera(page);
  // Dragging left by 100 px moves the view right by 100 px worth of world.
  expect(after.x - before.x).toBeCloseTo(100 / before.zoom, 3);
  expect(after.y - before.y).toBeCloseTo(50 / before.zoom, 3);
});
