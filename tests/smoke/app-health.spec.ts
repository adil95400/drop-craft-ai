import { test, expect } from '@playwright/test';

/**
 * Smoke tests — App health
 * Basic checks that the app boots, no JS crashes, and key assets load.
 */

test.describe('Smoke — App Health', () => {
  test('no uncaught JS errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known benign errors (e.g. ResizeObserver)
    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error')
    );
    expect(critical).toHaveLength(0);
  });

  test('landing page responds within 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('auth page responds within 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
