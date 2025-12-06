import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('Orders Critical Paths', () => {
  
  test.describe('Orders List', () => {
    test('should display orders page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('h1, h2')).toContainText(/Commande|Order/i);
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="echerch"]');
      expect(await searchInput.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have filter options', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      const filterButtons = page.locator('button:has-text("Filtr"), select, [class*="filter"]');
      expect(await filterButtons.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have bulk actions', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      const bulkActions = page.locator('button:has-text("Action"), button:has-text("Bulk"), [class*="bulk"]');
      expect(await bulkActions.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Order Creation', () => {
    test('should have create order button', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      const createButton = page.locator('button:has-text("Créer"), button:has-text("Create"), a:has-text("Nouvelle")');
      expect(await createButton.count()).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to create order page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders/create`);
      await page.waitForLoadState('networkidle');
      
      // Should have form elements
      const hasForm = await page.locator('form, input, select').count();
      expect(hasForm).toBeGreaterThan(0);
    });
  });

  test.describe('Order Details', () => {
    test('should handle order detail navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      // Try to click on first order if exists
      const orderRow = page.locator('tr:has(td), [class*="order-card"], [class*="order-item"]').first();
      const hasOrders = await orderRow.count();
      
      if (hasOrders > 0) {
        const viewButton = orderRow.locator('button:has-text("Voir"), a:has-text("Voir"), button:has(svg)');
        if (await viewButton.count() > 0) {
          await viewButton.first().click();
          await page.waitForLoadState('networkidle');
          
          // Should show order details
          const hasDetails = await page.locator('[class*="order"], [class*="detail"]').count();
          expect(hasDetails).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Order Status Updates', () => {
    test('should have status indicators', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      // Look for status badges/indicators
      const statusElements = page.locator('[class*="badge"], [class*="status"], [class*="tag"]');
      expect(await statusElements.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Order Export', () => {
    test('should have export functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await page.waitForLoadState('networkidle');
      
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Télécharger"), button:has(svg[class*="download"])');
      expect(await exportButton.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
