import { test, expect } from '@playwright/test';

/**
 * Smoke — Import critical paths
 * Validates the import page loads and core UI elements are present.
 * These tests run unauthenticated so they verify redirects or page structure.
 */
test.describe('Smoke — Import Critical Paths', () => {
  test('import route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    // Should redirect to auth or show login
    const url = page.url();
    const hasAuth = url.includes('/auth');
    const hasLoginForm = await page.locator('input[type="email"]').count();

    expect(hasAuth || hasLoginForm > 0).toBeTruthy();
  });

  test('import/csv route is protected', async ({ page }) => {
    await page.goto('/import/csv');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });
});
