import { test, expect } from '@playwright/test'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

test.describe('Edge Functions Integration Tests', () => {
  test('shopify-store-import handles valid request', async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/functions/v1/shopify-store-import`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          storeUrl: 'test-store.myshopify.com',
          importVariants: true,
          importCategories: false
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('success')
  })

  test('shopify-store-import rejects invalid URL', async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/functions/v1/shopify-store-import`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          storeUrl: 'not-a-shopify-url.com',
          importVariants: false,
          importCategories: false
        }
      }
    )

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('URL Shopify invalide')
  })

  test('extension-download returns ZIP file', async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/functions/v1/extension-download`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data).toHaveProperty('zipData')
    expect(data.zipData).toBeTruthy()
  })

  test('API rate limiting works', async ({ request }) => {
    const requests = []
    
    // Send multiple requests rapidly
    for (let i = 0; i < 20; i++) {
      requests.push(
        request.get(`${SUPABASE_URL}/functions/v1/health`)
      )
    }

    const responses = await Promise.all(requests)
    
    // At least one should be rate limited
    const rateLimited = responses.some(r => r.status() === 429)
    expect(rateLimited).toBeTruthy()
  })
})

test.describe('Database Operations', () => {
  test('creates product in catalog_products', async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/rest/v1/catalog_products`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: {
          name: 'Integration Test Product',
          price: 99.99,
          description: 'Created by integration test',
          sku: `TEST-${Date.now()}`,
          stock_quantity: 100,
          availability_status: 'in_stock'
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data[0]).toHaveProperty('id')
    expect(data[0].name).toBe('Integration Test Product')
  })

  test('queries products with filters', async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/catalog_products?price=gte.50&price=lte.150&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
    
    // Verify all products match filter
    data.forEach((product: any) => {
      expect(product.price).toBeGreaterThanOrEqual(50)
      expect(product.price).toBeLessThanOrEqual(150)
    })
  })

  test('handles concurrent product updates', async ({ request }) => {
    // Create a test product first
    const createResponse = await request.post(
      `${SUPABASE_URL}/rest/v1/catalog_products`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        data: {
          name: 'Concurrent Test Product',
          price: 100,
          sku: `CONCURRENT-${Date.now()}`
        }
      }
    )

    const product = (await createResponse.json())[0]
    
    // Attempt concurrent updates
    const updates = []
    for (let i = 0; i < 5; i++) {
      updates.push(
        request.patch(
          `${SUPABASE_URL}/rest/v1/catalog_products?id=eq.${product.id}`,
          {
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            data: {
              price: 100 + i
            }
          }
        )
      )
    }

    const responses = await Promise.all(updates)
    
    // All should succeed
    responses.forEach(r => {
      expect(r.ok()).toBeTruthy()
    })
  })
})
