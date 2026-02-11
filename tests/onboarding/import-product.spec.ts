import { test, expect } from '../helpers/fixtures';

test.describe('Onboarding — Import Product', () => {
  test('navigates to products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/produits|products/i).first()).toBeVisible();
  });

  test('shows import button or empty state', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const importBtn = page.getByRole('button', { name: /importer|import|ajouter|add/i });
    const emptyState = page.getByText(/aucun produit|no products|commencer/i);
    const hasImport = await importBtn.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasImport || hasEmpty).toBeTruthy();
  });

  test('opens import dialog when clicking import', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const importBtn = page.getByRole('button', { name: /importer|import|ajouter|add/i }).first();
    if (await importBtn.isVisible().catch(() => false)) {
      await importBtn.click();
      // Should show a dialog or navigate to import page
      const dialog = page.getByRole('dialog');
      const importPage = page.locator('[class*="import"], [data-testid="import"]');
      const hasDialog = await dialog.isVisible({ timeout: 5_000 }).catch(() => false);
      const hasImportPage = await importPage.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(hasDialog || hasImportPage).toBeTruthy();
    }
  });
});
