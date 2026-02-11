import { test, expect } from '../helpers/fixtures';

test.describe('Core — Product Edit', () => {
  test('navigates to products list', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/products/);
  });

  test('product detail page loads', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    // Click first product if available
    const productLink = page.locator('a[href*="/products/"], tr[data-testid="product-row"], [class*="product-card"]').first();
    if (await productLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForLoadState('networkidle');
      // Should show product detail or edit form
      await expect(page.getByText(/titre|title|description|prix|price/i).first()).toBeVisible();
    }
  });
});
