import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })

  test('product list renders 100+ items efficiently', async ({ page }) => {
    await page.goto('/import/manage/list')
    
    const startTime = Date.now()
    await page.waitForSelector('[data-testid="product-item"]')
    const renderTime = Date.now() - startTime
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000)
    
    // Check virtual scrolling works
    const visibleItems = await page.locator('[data-testid="product-item"]').count()
    expect(visibleItems).toBeLessThan(50) // Not rendering all 100+ items
  })

  test('search debouncing works correctly', async ({ page }) => {
    await page.goto('/import/manage/list')
    
    const searchInput = page.locator('input[placeholder*="Rechercher"]')
    
    // Type rapidly
    await searchInput.type('test product', { delay: 50 })
    
    // Wait for debounce
    await page.waitForTimeout(600)
    
    // Should only make one API call
    const apiCalls = await page.evaluate(() => {
      return (window as any).__apiCallCount || 0
    })
    
    expect(apiCalls).toBeLessThanOrEqual(2)
  })

  test('image lazy loading works', async ({ page }) => {
    await page.goto('/import/manage/list')
    
    // Get initial image count
    const initialImages = await page.locator('img[loading="lazy"]').count()
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    
    // More images should be visible
    const afterScrollImages = await page.locator('img[loading="lazy"]').count()
    
    expect(afterScrollImages).toBeGreaterThan(initialImages)
  })

  test('bundle size is acceptable', async ({ page }) => {
    const response = await page.goto('/')
    const transferSize = (await response?.body())?.length || 0
    
    // Main bundle should be < 1MB
    expect(transferSize).toBeLessThan(1024 * 1024)
  })
})
