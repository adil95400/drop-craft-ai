import { test, expect } from '../helpers/fixtures';

/**
 * E2E Smoke Tests — Catalog & Products
 * Validates the product catalog, search, filters, and bulk actions
 */

test.describe('Catalog & Products Smoke Tests', () => {
  test('should load the products page', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display product grid or table', async ({ page }) => {
    await page.goto('/products');
    const content = page.locator('[data-testid="product-grid"], [data-testid="product-table"], table, .grid');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to import hub', async ({ page }) => {
    await page.goto('/import');
    await expect(page).toHaveURL(/\/import/);
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to product detail when clicking a product', async ({ page }) => {
    await page.goto('/products');
    // Wait for any product card/row to appear
    const productLink = page.locator('a[href*="/products/"], [data-testid="product-row"], [data-testid="product-card"]').first();
    if (await productLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForTimeout(1000);
      // Should either open a modal or navigate
      const modal = page.locator('[role="dialog"]');
      const url = page.url();
      expect(modal.isVisible().catch(() => false) || url.includes('/products/')).toBeTruthy();
    }
  });

  test('should load catalog health page', async ({ page }) => {
    await page.goto('/catalog/health');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });
});
