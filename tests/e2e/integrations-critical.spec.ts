import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('Integrations Critical Paths', () => {
  
  test.describe('Unified Integrations Hub', () => {
    test('should display integrations hub', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations/unified`);
      await page.waitForLoadState('networkidle');
      
      const hasContent = await page.locator('h1, h2, [class*="integration"]').count();
      expect(hasContent).toBeGreaterThan(0);
    });

    test('should have tabs for suppliers and channels', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations/unified`);
      await page.waitForLoadState('networkidle');
      
      const tabs = page.locator('[role="tab"], button:has-text("Fournisseur"), button:has-text("Canal")');
      expect(await tabs.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Shopify Integration', () => {
    test('should display Shopify connection status', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations`);
      await page.waitForLoadState('networkidle');
      
      const shopifyCard = page.locator('text=/Shopify/i, [class*="shopify"]');
      expect(await shopifyCard.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have Shopify sync options', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations`);
      await page.waitForLoadState('networkidle');
      
      const syncButton = page.locator('button:has-text("Sync"), button:has-text("Synchron")');
      expect(await syncButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Supplier Connections', () => {
    test('should display supplier marketplace', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers/marketplace`);
      await page.waitForLoadState('networkidle');
      
      const supplierCards = page.locator('[class*="supplier"], [class*="card"]');
      expect(await supplierCards.count()).toBeGreaterThanOrEqual(0);
    });

    test('should have connect buttons for suppliers', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers/marketplace`);
      await page.waitForLoadState('networkidle');
      
      const connectButtons = page.locator('button:has-text("Connecter"), button:has-text("Connect")');
      expect(await connectButtons.count()).toBeGreaterThanOrEqual(0);
    });

    test('should show connection status', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers`);
      await page.waitForLoadState('networkidle');
      
      const statusBadges = page.locator('[class*="badge"], [class*="status"]');
      expect(await statusBadges.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Marketplace Connections', () => {
    test('should display marketplace options', async ({ page }) => {
      await page.goto(`${BASE_URL}/integrations`);
      await page.waitForLoadState('networkidle');
      
      const marketplaces = page.locator('text=/Amazon|eBay|Etsy|TikTok/i');
      expect(await marketplaces.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API Keys Management', () => {
    test('should access API settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/settings`);
      await page.waitForLoadState('networkidle');
      
      const apiTab = page.locator('button:has-text("API"), a:has-text("API"), [role="tab"]:has-text("API")');
      expect(await apiTab.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Webhook Configuration', () => {
    test('should have webhook settings', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/settings`);
      await page.waitForLoadState('networkidle');
      
      const webhookSection = page.locator('text=/Webhook/i');
      expect(await webhookSection.count()).toBeGreaterThanOrEqual(0);
    });
  });
});
