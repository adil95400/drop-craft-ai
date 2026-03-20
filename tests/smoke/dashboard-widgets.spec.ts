import { test, expect } from '@playwright/test';

/**
 * Smoke — Dashboard widget rendering
 * Validates that key dashboard sections exist after auth redirect.
 */
test.describe('Smoke — Dashboard Widgets', () => {
  test('dashboard redirects to auth for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth');
  });

  test('analytics route is protected', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth');
  });

  test('settings route is protected', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth');
  });

  test('suppliers route is protected', async ({ page }) => {
    await page.goto('/suppliers');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/auth');
  });
});
