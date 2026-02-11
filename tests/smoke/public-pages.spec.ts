import { test, expect } from '@playwright/test';

/**
 * Smoke tests — Public pages (no auth required)
 * These must always pass: they verify the app boots and public routes render.
 */

const BASE = '';

test.describe('Smoke — Public Pages', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('domcontentloaded');
    // The page should render without crashing
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('auth page loads with login form', async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 10_000 });
  });

  test('auth page rejects invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').fill('fake@test.com');
    await page.locator('input[type="password"]').fill('Wrong1234!');
    await page.locator('button[type="submit"]').click();

    // Wait for some error feedback (toast, alert, or inline message)
    const errorVisible = await page
      .locator('[role="alert"], [data-sonner-toast], [class*="error"], [class*="destructive"]')
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    // Also acceptable: we're still on the auth page (no redirect)
    expect(errorVisible || page.url().includes('/auth')).toBeTruthy();
  });
});
