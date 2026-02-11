import { test, expect } from '../helpers/fixtures';

test.describe('Onboarding — Connect Store', () => {
  test('navigates to integrations page', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/intégrations|integrations|marketplace/i).first()).toBeVisible();
  });

  test('shows available marketplace connectors', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForLoadState('networkidle');
    // Should display at least one marketplace option
    const connectors = page.locator('[data-testid="marketplace-card"], .marketplace-card, [class*="integration"]');
    await expect(connectors.first()).toBeVisible({ timeout: 10_000 });
  });

  test('TikTok Shop connector shows connect dialog', async ({ page }) => {
    await page.goto('/integrations/tiktok-shop');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/tiktok/i).first()).toBeVisible();
  });
});
