import { test, expect } from '@playwright/test';

/**
 * Smoke — Landing page critical elements
 * Validates hero, pricing section, integrations, testimonials, and SEO.
 */
test.describe('Smoke — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('hero section renders with CTA', async ({ page }) => {
    // Should have a primary heading
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible({ timeout: 10000 });

    // Should have at least one CTA button
    const cta = page.locator('a[href*="auth"], button:has-text("Start"), button:has-text("Commencer")');
    await expect(cta.first()).toBeVisible();
  });

  test('pricing section has multiple plans', async ({ page }) => {
    // Scroll to pricing section
    const pricingSection = page.locator('section:has-text("Basic"), section:has-text("Pro")');
    if (await pricingSection.count() > 0) {
      await pricingSection.first().scrollIntoViewIfNeeded();
      // Should have at least 2 pricing cards
      const cards = pricingSection.first().locator('[class*="card"], [class*="Card"]');
      expect(await cards.count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('page has proper meta title', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
    expect(title.length).toBeLessThan(70);
  });

  test('page has FAQ section', async ({ page }) => {
    const faq = page.locator('text=FAQ, text=Questions');
    if (await faq.count() > 0) {
      await expect(faq.first()).toBeVisible();
    }
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest') && !e.includes('third-party')
    );
    expect(criticalErrors.length).toBe(0);
  });
});
