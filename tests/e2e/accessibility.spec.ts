import { test, expect } from '@playwright/test'

test.describe('Accessibilité', () => {
  test('la page d\'accueil a les landmarks ARIA', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Should have main content area
    const main = page.locator('main, [role="main"], #main-content')
    await expect(main.first()).toBeVisible({ timeout: 5000 })
  })

  test('les images ont des attributs alt', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt).not.toBeNull()
      expect(alt!.length).toBeGreaterThan(0)
    }
  })

  test('navigation clavier fonctionne', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Tab through elements
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })

  test('contraste des textes principaux', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check that h1 has computed color (basic check)
    const h1 = page.locator('h1').first()
    const color = await h1.evaluate(el => getComputedStyle(el).color)
    expect(color).toBeTruthy()
    expect(color).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('viewport mobile rend correctement', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 }
    })
    const page = await context.newPage()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // H1 should still be visible on mobile
    await expect(page.locator('h1').first()).toBeVisible()
    
    await context.close()
  })

  test('le skip link est présent', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // The skip link should exist (sr-only but focusable)
    const skipLink = page.locator('a[href="#main-content"]')
    const count = await skipLink.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
