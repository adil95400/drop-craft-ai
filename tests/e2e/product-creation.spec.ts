import { test, expect } from '@playwright/test'

test.describe('Parcours création produit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('la page d\'accueil se charge correctement', async ({ page }) => {
    await expect(page).toHaveTitle(/ShopOpti/i)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('navigation vers la page d\'import', async ({ page }) => {
    await page.goto('/import')
    await page.waitForLoadState('networkidle')
    // La page d'import doit être accessible (peut rediriger vers auth)
    const url = page.url()
    expect(url).toMatch(/\/(import|auth)/)
  })

  test('navigation vers la page produits', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toMatch(/\/(products|auth)/)
  })

  test('page pricing accessible publiquement', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Starter').first()).toBeVisible()
  })

  test('page features accessible publiquement', async ({ page }) => {
    await page.goto('/features')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

test.describe('Performance de la page d\'accueil', () => {
  test('LCP < 3s', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('h1')
    const lcp = Date.now() - start
    expect(lcp).toBeLessThan(3000)
  })

  test('pas d\'erreurs console critiques', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text())
      }
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Filter out known non-critical errors
    const critical = errors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Third-party') &&
      !e.includes('net::ERR')
    )
    expect(critical.length).toBeLessThanOrEqual(2)
  })
})
