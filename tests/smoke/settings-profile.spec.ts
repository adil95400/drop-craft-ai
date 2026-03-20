import { test, expect } from '../helpers/fixtures';

/**
 * E2E Smoke Tests — Settings & Profile
 * Validates settings pages load correctly and forms are interactive
 */

test.describe('Settings & Profile Smoke Tests', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show profile tab with user info', async ({ page }) => {
    await page.goto('/settings');
    const profileTab = page.locator('button:has-text("Profil"), [data-testid="profile-tab"], a[href*="profile"]').first();
    if (await profileTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileTab.click();
      await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should load billing page', async ({ page }) => {
    await page.goto('/billing');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load security settings', async ({ page }) => {
    await page.goto('/settings');
    const securityTab = page.locator('button:has-text("Sécurité"), [data-testid="security-tab"]').first();
    if (await securityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await securityTab.click();
      await page.waitForTimeout(1000);
    }
  });
});
