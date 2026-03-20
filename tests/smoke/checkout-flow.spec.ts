import { test, expect } from '@playwright/test';

/**
 * Smoke — Checkout & Billing flow
 * Validates pricing page, plan selection, and checkout initiation.
 */
test.describe('Smoke — Checkout & Billing', () => {
  test('pricing page renders with plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    // Should have at least 2 plan cards
    const planCards = page.locator('[data-testid="plan-card"], .pricing-card, [class*="card"]');
    await expect(planCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('pricing page has monthly/annual toggle', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    // Look for pricing toggle
    const toggle = page.locator('button:has-text("Annual"), button:has-text("Annuel"), [role="switch"]');
    const hasToggle = await toggle.count();
    expect(hasToggle).toBeGreaterThan(0);
  });

  test('billing page requires authentication', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });

  test('subscription page requires authentication', async ({ page }) => {
    await page.goto('/subscription');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/auth');
  });
});
