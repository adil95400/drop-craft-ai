import { test, expect } from '@playwright/test';

/**
 * Smoke — Orders critical paths
 * Validates the orders page is protected and accessible structure.
 */
test.describe('Smoke — Orders Critical Paths', () => {
  test('orders route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard/orders');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });

  test('order creation route is protected', async ({ page }) => {
    await page.goto('/dashboard/orders/create');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });
});
