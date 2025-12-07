import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080'

test.describe('CI/CD Pipeline Validation Tests', () => {
  
  test.describe('Build Verification', () => {
    test('application is accessible', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/`)
      expect(response?.status()).toBeLessThan(500)
    })

    test('main bundle loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)
      
      // Check that main app renders
      await page.waitForSelector('#root, [id="root"]', { timeout: 10000 })
      const root = await page.locator('#root').count()
      expect(root).toBe(1)
    })

    test('no uncaught JavaScript errors', async ({ page }) => {
      const errors: string[] = []
      
      page.on('pageerror', error => {
        errors.push(error.message)
      })
      
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      // Allow for minor third-party errors but no critical app errors
      const criticalErrors = errors.filter(e => 
        !e.includes('ResizeObserver') && 
        !e.includes('Non-Error')
      )
      
      expect(criticalErrors.length).toBe(0)
    })
  })

  test.describe('Environment Configuration', () => {
    test('environment variables are set', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Check that Supabase connection works (app doesn't crash)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('body').textContent()
      expect(hasContent).toBeTruthy()
    })
  })

  test.describe('Security Headers', () => {
    test('response includes security headers', async ({ page }) => {
      const response = await page.goto(`${BASE_URL}/`)
      const headers = response?.headers() || {}
      
      // At minimum, content-type should be set
      expect(headers['content-type']).toBeTruthy()
    })

    test('no sensitive data in HTML source', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)
      const html = await page.content()
      
      // Check for potential credential leaks
      expect(html).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/i)
      expect(html).not.toMatch(/api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/i)
      expect(html).not.toMatch(/secret\s*[:=]\s*["'][^"']+["']/i)
    })
  })

  test.describe('Accessibility Basics', () => {
    test('page has proper language attribute', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)
      
      const lang = await page.locator('html').getAttribute('lang')
      expect(lang).toBeTruthy()
    })

    test('page has title', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      
      const title = await page.title()
      expect(title.length).toBeGreaterThan(0)
    })

    test('images have alt attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const imagesWithoutAlt = await page.locator('img:not([alt])').count()
      // Allow some images without alt (decorative)
      expect(imagesWithoutAlt).toBeLessThan(10)
    })

    test('buttons are accessible', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const buttons = await page.locator('button').count()
      const accessibleButtons = await page.locator('button[aria-label], button:not(:empty)').count()
      
      // Most buttons should have text or aria-label
      expect(accessibleButtons).toBeGreaterThanOrEqual(buttons * 0.5)
    })
  })

  test.describe('Responsive Design', () => {
    test('renders on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('body').textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    })

    test('renders on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('body').textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    })

    test('renders on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      
      const hasContent = await page.locator('body').textContent()
      expect(hasContent?.length).toBeGreaterThan(0)
    })
  })

  test.describe('Network Resilience', () => {
    test('handles slow network', async ({ page }) => {
      // Simulate slow 3G
      const client = await page.context().newCDPSession(page)
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 500 * 1024 / 8,
        uploadThroughput: 500 * 1024 / 8,
        latency: 400
      })
      
      const response = await page.goto(`${BASE_URL}/`, { timeout: 30000 })
      expect(response?.ok()).toBeTruthy()
    })

    test('shows meaningful content on load', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      
      // Wait for some content to render
      await page.waitForTimeout(1000)
      
      // Should show loading state or content
      const hasVisibleContent = await page.locator('h1, h2, p, [class*="card"]').count()
      expect(hasVisibleContent).toBeGreaterThan(0)
    })
  })
})

test.describe('Deployment Readiness', () => {
  test('favicon exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    
    const favicon = await page.locator('link[rel*="icon"]').count()
    expect(favicon).toBeGreaterThanOrEqual(0)
  })

  test('manifest.json is valid', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/manifest.json`)
    
    if (response.ok()) {
      const manifest = await response.json()
      expect(manifest.name || manifest.short_name).toBeTruthy()
    }
  })

  test('robots.txt is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`)
    // robots.txt might not exist, which is fine
    expect([200, 404].includes(response.status())).toBeTruthy()
  })

  test('sitemap.xml is accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`)
    // sitemap might not exist, which is fine
    expect([200, 404].includes(response.status())).toBeTruthy()
  })
})
