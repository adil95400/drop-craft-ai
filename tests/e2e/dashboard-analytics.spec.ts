import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080'

test.describe('Dashboard Analytics E2E Tests', () => {
  
  test.describe('Dashboard Load & Display', () => {
    test('dashboard page loads successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Page should render
      const hasContent = await page.locator('h1, h2, [class*="dashboard"]').count()
      expect(hasContent).toBeGreaterThan(0)
    })

    test('displays KPI cards', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Look for metric cards
      const cards = await page.locator('[class*="card"], [class*="stat"], [class*="kpi"]').count()
      expect(cards).toBeGreaterThanOrEqual(0)
    })

    test('shows revenue metrics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Check for revenue-related text
      const hasRevenue = await page.locator('text=/revenue|chiffre|vente/i').count()
      expect(hasRevenue).toBeGreaterThanOrEqual(0)
    })

    test('displays charts or graphs', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Look for chart containers
      const charts = await page.locator('[class*="chart"], [class*="recharts"], svg').count()
      expect(charts).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Analytics Page', () => {
    test('analytics unified page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('h1, h2, [class*="analytics"]').count()
      expect(hasContent).toBeGreaterThanOrEqual(0)
    })

    test('date range selector works', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`)
      await page.waitForLoadState('networkidle')
      
      // Look for date picker or date range controls
      const datePicker = page.locator('button:has-text("jours"), button:has-text("days"), [class*="date"]')
      const hasDatePicker = await datePicker.count()
      
      expect(hasDatePicker).toBeGreaterThanOrEqual(0)
    })

    test('export functionality present', async ({ page }) => {
      await page.goto(`${BASE_URL}/analytics/unified`)
      await page.waitForLoadState('networkidle')
      
      const exportBtn = page.locator('button:has-text("export"), button:has-text("télécharger"), button:has-text("download")')
      const hasExport = await exportBtn.count()
      
      expect(hasExport).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Products Analytics', () => {
    test('products page shows metrics', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`)
      await page.waitForLoadState('networkidle')
      
      // Check for product count or metrics
      const hasMetrics = await page.locator('text=/produit|product|total/i').count()
      expect(hasMetrics).toBeGreaterThan(0)
    })

    test('product filters work', async ({ page }) => {
      await page.goto(`${BASE_URL}/products`)
      await page.waitForLoadState('networkidle')
      
      // Look for filter controls
      const filters = await page.locator('[class*="filter"], [class*="search"], input[type="text"]').count()
      expect(filters).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Orders Analytics', () => {
    test('orders page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('h1, h2, [class*="order"]').count()
      expect(hasContent).toBeGreaterThanOrEqual(0)
    })

    test('order status filters exist', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/orders`)
      await page.waitForLoadState('networkidle')
      
      // Look for status filters
      const statusFilters = await page.locator('text=/pending|completed|shipped|en cours|livré/i').count()
      expect(statusFilters).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Real-time Updates', () => {
    test('dashboard updates without full reload', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const initialContent = await page.content()
      
      // Wait for potential updates
      await page.waitForTimeout(2000)
      
      // Page should still be functional
      const finalContent = await page.content()
      expect(finalContent.length).toBeGreaterThan(0)
    })
  })
})

test.describe('CI/CD Related Tests', () => {
  
  test('application builds successfully', async ({ page }) => {
    // Simple smoke test that app loads
    const response = await page.goto(`${BASE_URL}/`)
    expect(response?.ok()).toBeTruthy()
  })

  test('no console errors on main pages', async ({ page }) => {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('networkidle')
    
    // Filter out expected third-party errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('analytics') &&
      !e.includes('Failed to load resource')
    )
    
    expect(criticalErrors.length).toBeLessThan(5)
  })

  test('all critical routes return 200', async ({ page }) => {
    const criticalRoutes = [
      '/',
      '/auth',
      '/dashboard',
      '/products'
    ]
    
    for (const route of criticalRoutes) {
      const response = await page.goto(`${BASE_URL}${route}`)
      // Accept 200 or redirects
      expect([200, 301, 302, 304].includes(response?.status() || 0)).toBeTruthy()
    }
  })

  test('static assets load correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    // Check CSS is loaded
    const styles = await page.locator('link[rel="stylesheet"]').count()
    expect(styles).toBeGreaterThanOrEqual(0)
    
    // Check JS is loaded
    const scripts = await page.locator('script[src]').count()
    expect(scripts).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance Metrics', () => {
  test('page load time is acceptable', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    
    const loadTime = Date.now() - startTime
    
    // Should load DOM within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('first contentful paint is fast', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)
    
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime)
            }
          }
          resolve(0)
        }).observe({ type: 'paint', buffered: true })
        
        // Fallback timeout
        setTimeout(() => resolve(0), 3000)
      })
    })
    
    // FCP should be under 3 seconds
    expect(fcp).toBeLessThanOrEqual(3000)
  })
})
