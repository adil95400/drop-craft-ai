import { test, expect } from '@playwright/test';

/**
 * Smoke tests — Navigation & Core UI
 * Verifies that key navigation elements render and critical interactions work.
 */

test.describe('Smoke — Navigation & Core UI', () => {
  test('landing page has visible CTA or login link', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const cta = page.locator(
      'a[href*="auth"], button:has-text("Commencer"), button:has-text("Connexion"), a:has-text("Connexion"), a:has-text("Essai")'
    );
    await expect(cta.first()).toBeVisible({ timeout: 10_000 });
  });

  test('page title is set (not default Vite title)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const title = await page.title();
    expect(title).not.toBe('Vite + React + TS');
    expect(title.length).toBeGreaterThan(0);
  });

  test('no broken images on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img[src]');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      // 0 means broken image
      expect(naturalWidth, `Image ${i} is broken`).toBeGreaterThan(0);
    }
  });

  test('favicon is present', async ({ page }) => {
    await page.goto('/');
    const favicon = page.locator('link[rel*="icon"]');
    expect(await favicon.count()).toBeGreaterThan(0);
  });
});
