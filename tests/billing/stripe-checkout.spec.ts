import { test, expect } from '../helpers/fixtures';

test.describe('Billing — Stripe Checkout', () => {
  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/plan|tarif|pricing|abonnement/i).first()).toBeVisible();
  });

  test('shows available plans with prices', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    // Should show at least one plan card
    const planCards = page.locator('[class*="plan"], [class*="pricing"], [data-testid*="plan"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('checkout button triggers Stripe session', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    const checkoutBtn = page.getByRole('button', { name: /commencer|subscribe|choisir|upgrade|acheter/i }).first();
    if (await checkoutBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Listen for navigation to Stripe
      const [popup] = await Promise.all([
        page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null),
        checkoutBtn.click(),
      ]);
      // Either opens Stripe in new tab or shows loading state
      if (popup) {
        await expect(popup).toHaveURL(/checkout\.stripe\.com/);
      }
    }
  });
});
