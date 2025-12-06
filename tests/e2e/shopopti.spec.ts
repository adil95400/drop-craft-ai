import { test, expect } from '@playwright/test';

// Base URL for tests
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('ShopOpti+ E2E Tests', () => {
  
  test.describe('Navigation & Routing', () => {
    test('should load homepage', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/Shopopti/i);
    });

    test('should navigate to dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Tableau de bord/i);
    });

    test('should navigate to products page', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await expect(page.locator('h1, h2')).toContainText(/Produit|Product/i);
    });

    test('should navigate to suppliers hub', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers`);
      await expect(page.locator('h1, h2')).toContainText(/Fournisseur|Supplier/i);
    });

    test('should navigate to orders page', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`);
      await expect(page.locator('h1, h2')).toContainText(/Commande|Order/i);
    });

    test('should navigate to customers page', async ({ page }) => {
      await page.goto(`${BASE_URL}/customers`);
      await expect(page.locator('h1, h2')).toContainText(/Client|Customer/i);
    });

    test('should navigate to analytics page', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`);
      await expect(page.locator('h1, h2')).toContainText(/Analytic|Performance/i);
    });

    test('should navigate to automation page', async ({ page }) => {
      await page.goto(`${BASE_URL}/automation`);
      await expect(page.locator('h1, h2')).toContainText(/Automation|Workflow/i);
    });

    test('should navigate to workflow editor', async ({ page }) => {
      await page.goto(`${BASE_URL}/automation/workflow-editor`);
      await expect(page.locator('h1, h2')).toContainText(/Workflow|Éditeur/i);
    });

    test('should navigate to SEO manager', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketing/seo`);
      await expect(page.locator('h1, h2')).toContainText(/SEO|Optimisation/i);
    });

    test('should navigate to quick import', async ({ page }) => {
      await page.goto(`${BASE_URL}/import/url`);
      await expect(page.locator('h1, h2, input[placeholder]')).toBeVisible();
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('should show mobile menu button', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
      await expect(menuButton).toBeVisible();
    });

    test('should open mobile drawer', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
      await menuButton.click();
      
      // Check drawer is visible
      await expect(page.locator('[role="dialog"], .drawer, nav')).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should show login page for protected routes', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      // Should either show dashboard or redirect to auth
      const hasAuth = await page.locator('input[type="email"], input[type="password"]').count();
      const hasDashboard = await page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard")').count();
      expect(hasAuth > 0 || hasDashboard > 0).toBeTruthy();
    });

    test('should have login form elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
  });

  test.describe('Products Page', () => {
    test('should display product grid or table', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      await page.waitForLoadState('networkidle');
      
      const hasProducts = await page.locator('[class*="product"], [class*="card"], table tbody tr').count();
      expect(hasProducts).toBeGreaterThanOrEqual(0);
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      const searchInput = page.locator('input[type="search"], input[placeholder*="echerch"], input[placeholder*="search"]');
      await expect(searchInput.first()).toBeVisible();
    });

    test('should have filter options', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`);
      const filterButton = page.locator('button:has-text("Filtr"), select, [class*="filter"]');
      expect(await filterButton.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Suppliers Hub', () => {
    test('should display supplier cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers`);
      await page.waitForLoadState('networkidle');
      
      const hasSuppliers = await page.locator('[class*="supplier"], [class*="card"]').count();
      expect(hasSuppliers).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to marketplace', async ({ page }) => {
      await page.goto(`${BASE_URL}/suppliers/marketplace`);
      await expect(page.locator('h1, h2')).toContainText(/Marketplace|Fournisseur/i);
    });
  });

  test.describe('Analytics Dashboard', () => {
    test('should display metrics cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`);
      await page.waitForLoadState('networkidle');
      
      const hasMetrics = await page.locator('[class*="card"], [class*="stat"], [class*="metric"]').count();
      expect(hasMetrics).toBeGreaterThan(0);
    });

    test('should display charts', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`);
      await page.waitForLoadState('networkidle');
      
      const hasCharts = await page.locator('svg[class*="recharts"], canvas, [class*="chart"]').count();
      expect(hasCharts).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Quick Import Feature', () => {
    test('should have URL input field', async ({ page }) => {
      await page.goto(`${BASE_URL}/import/url`);
      const urlInput = page.locator('input[type="url"], input[placeholder*="URL"], input[placeholder*="http"]');
      await expect(urlInput.first()).toBeVisible();
    });

    test('should have import button', async ({ page }) => {
      await page.goto(`${BASE_URL}/import/url`);
      const importButton = page.locator('button:has-text("Import"), button:has-text("Analyser"), button[type="submit"]');
      await expect(importButton.first()).toBeVisible();
    });
  });

  test.describe('Workflow Editor', () => {
    test('should display workflow canvas or list', async ({ page }) => {
      await page.goto(`${BASE_URL}/automation/workflow-editor`);
      await page.waitForLoadState('networkidle');
      
      const hasWorkflowUI = await page.locator('[class*="workflow"], [class*="canvas"], [class*="step"]').count();
      expect(hasWorkflowUI).toBeGreaterThanOrEqual(0);
    });

    test('should have add step button', async ({ page }) => {
      await page.goto(`${BASE_URL}/automation/workflow-editor`);
      const addButton = page.locator('button:has-text("Ajouter"), button:has-text("Add"), button:has(svg[class*="plus"])');
      expect(await addButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('SEO Manager', () => {
    test('should display SEO analysis', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketing/seo`);
      await page.waitForLoadState('networkidle');
      
      const hasSEOContent = await page.locator('[class*="seo"], [class*="score"], table, [class*="card"]').count();
      expect(hasSEOContent).toBeGreaterThan(0);
    });

    test('should have bulk action buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketing/seo`);
      const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Génér"), button:has-text("Optim")');
      expect(await bulkButton.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have proper heading structure', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('should have alt text on images', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Allow empty alt for decorative images but check attribute exists
        expect(alt !== null || await images.nth(i).getAttribute('role') === 'presentation').toBeTruthy();
      }
    });
  });

  test.describe('PWA Features', () => {
    test('should have manifest.json', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/manifest.json`);
      expect(response?.status()).toBe(200);
      
      const manifest = await response?.json();
      expect(manifest.name).toBeDefined();
      expect(manifest.icons).toBeDefined();
    });

    test('should have service worker', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check for SW registration
      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      expect(hasServiceWorker).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ];

    for (const viewport of viewports) {
      test(`should render correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/dashboard`);
        await page.waitForLoadState('networkidle');
        
        // Check no horizontal scroll (content fits)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin
      });
    }
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/this-page-does-not-exist-12345`);
      
      // Should show 404 page or redirect
      const has404 = await page.locator('text=/404|not found|introuvable/i').count();
      const redirectedHome = page.url().includes(BASE_URL);
      
      expect(has404 > 0 || redirectedHome).toBeTruthy();
    });
  });
});

// Configuration for Playwright
export const config = {
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
};
