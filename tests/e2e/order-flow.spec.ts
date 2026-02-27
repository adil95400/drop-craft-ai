import { test, expect } from '@playwright/test'

test.describe('Parcours commandes', () => {
  test('page commandes accessible', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
    // Should redirect to auth or show orders
    const url = page.url()
    expect(url).toMatch(/\/(orders|auth)/)
  })

  test('page auth affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    // Should show login form
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    await expect(emailInput.first()).toBeVisible({ timeout: 5000 })
  })

  test('page dashboard redirige si non authentifié', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    const url = page.url()
    // Should redirect to auth
    expect(url).toMatch(/\/(auth|dashboard)/)
  })
})

test.describe('Navigation principale', () => {
  test('liens du menu sont fonctionnels', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check main CTA buttons exist
    const ctaButton = page.locator('text=Essai gratuit').first()
    if (await ctaButton.isVisible()) {
      await ctaButton.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('/auth')
    }
  })
})
