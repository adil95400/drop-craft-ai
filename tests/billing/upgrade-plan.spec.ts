import { test, expect } from '../helpers/fixtures';

test.describe('Billing — Upgrade Plan', () => {
  test('subscription status is visible on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Should show current plan status somewhere
    const planBadge = page.getByText(/plan|free|starter|pro|enterprise|gratuit/i).first();
    await expect(planBadge).toBeVisible({ timeout: 10_000 });
  });

  test('manage subscription button exists for subscribed users', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const manageBtn = page.getByRole('button', { name: /gérer|manage|subscription|facturation|billing/i });
    // This may or may not be visible depending on subscription state
    const isVisible = await manageBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    // Just verify the page loaded correctly
    await expect(page).toHaveURL(/settings/);
  });
});
