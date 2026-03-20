import { test, expect } from '../helpers/fixtures';

/**
 * E2E Smoke Tests — Marketing & Analytics
 * Validates marketing dashboard, analytics, and AI features load
 */

test.describe('Marketing & Analytics Smoke Tests', () => {
  test('should load marketing dashboard', async ({ page }) => {
    await page.goto('/marketing');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load AI optimization page', async ({ page }) => {
    await page.goto('/ai/optimization');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load suppliers page', async ({ page }) => {
    await page.goto('/suppliers');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load fulfillment page', async ({ page }) => {
    await page.goto('/automation/fulfillment-hub');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load CRM page', async ({ page }) => {
    await page.goto('/crm');
    await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible({ timeout: 10000 });
  });
});
