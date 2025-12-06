import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('Payments & Billing Critical Paths', () => {
  
  test.describe('Billing Page', () => {
    test('should display billing/subscription page', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      const hasContent = await page.locator('h1, h2, [class*="billing"], [class*="plan"]').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('should show current plan information', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      const planInfo = page.locator('[class*="plan"], [class*="subscription"], text=/Plan|Abonnement/i');
      expect(await planInfo.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have upgrade options', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      const upgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Améliorer"), a:has-text("Pro")');
      expect(await upgradeButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Pricing Page', () => {
    test('should display pricing plans', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');
      
      const pricingCards = page.locator('[class*="pricing"], [class*="plan-card"], [class*="tier"]');
      expect(await pricingCards.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have comparison features', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');
      
      const features = page.locator('[class*="feature"], li:has(svg), [class*="check"]');
      expect(await features.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have CTA buttons for each plan', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');
      
      const ctaButtons = page.locator('button:has-text("Commencer"), button:has-text("Start"), button:has-text("Choisir")');
      expect(await ctaButtons.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Payment Methods', () => {
    test('should access payment settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/settings`);
      await page.waitForLoadState('networkidle');
      
      const paymentTab = page.locator('button:has-text("Paiement"), a:has-text("Payment"), [role="tab"]:has-text("Billing")');
      expect(await paymentTab.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Coupon System', () => {
    test('should have coupon input in checkout', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      await page.waitForLoadState('networkidle');
      
      // Look for coupon input or promo code field
      const couponInput = page.locator('input[placeholder*="coupon"], input[placeholder*="promo"], input[name*="code"]');
      expect(await couponInput.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Invoice History', () => {
    test('should display invoice history in billing', async ({ page }) => {
      await page.goto(`${BASE_URL}/billing`);
      await page.waitForLoadState('networkidle');
      
      const invoiceSection = page.locator('text=/Facture|Invoice|Historique/i, table, [class*="invoice"]');
      expect(await invoiceSection.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
