import { test, expect } from '@playwright/test'

test.describe('Flux de synchronisation complet', () => {
  test('Workflow complet: Import -> Brouillons -> Publication -> Webhook/Sync', async ({ page }) => {
    // Mock API responses
    await page.route('**/functions/v1/advanced-sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          processed: 1,
          succeeded: 1,
          failed: 0,
          data: { shopify_product_id: '12345' }
        })
      })
    })

    await page.route('**/functions/v1/webhook-handler*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, processed: true })
      })
    })

    // Navigation vers la page de synchronisation
    await page.goto('/sync')
    
    // 1. Créer un produit avec variantes
    await page.getByRole('tab', { name: 'Produits & Variantes' }).click()
    await page.getByPlaceholder('Nom du produit').fill('T-shirt Test')
    await page.getByPlaceholder('Description du produit').fill('Description test')
    
    // Ajouter une variante
    await page.getByRole('button', { name: 'Ajouter Variante' }).click()
    await page.getByPlaceholder('SKU-VAR-001').fill('TSHIRT-M-ROUGE')
    
    // Sélectionner taille et couleur
    await page.locator('select').first().selectOption('M')
    await page.locator('select').nth(1).selectOption('Rouge')
    
    // Prix et stock
    await page.getByRole('spinbutton').first().fill('29.99')
    await page.getByRole('spinbutton').nth(1).fill('100')
    
    // 2. Créer le produit
    await page.getByRole('button', { name: 'Créer Produit avec Variantes' }).click()
    
    // Vérifier le succès
    await expect(page.getByText('Produit créé avec succès')).toBeVisible()
    
    // 3. Vérifier la planification
    await page.getByRole('tab', { name: 'Planification' }).click()
    await expect(page.getByText('Planifications actives')).toBeVisible()
    
    // 4. Vérifier l'historique
    await page.getByRole('tab', { name: 'Historique' }).click()
    await expect(page.getByText('Historique de Synchronisation')).toBeVisible()
  })

  test('Configuration des webhooks Shopify/WooCommerce', async ({ page }) => {
    // Mock des appels webhook
    await page.route('**/webhook-handler*', async route => {
      const request = route.request()
      const postData = request.postData()
      
      // Simuler réponse webhook
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          event_id: 'webhook-123',
          processed: true
        })
      })
    })

    await page.goto('/integrations')
    
    // Vérifier que les intégrations sont configurées pour les webhooks
    await expect(page.getByText('Shopify')).toBeVisible()
    await expect(page.getByText('WooCommerce')).toBeVisible()
  })
})