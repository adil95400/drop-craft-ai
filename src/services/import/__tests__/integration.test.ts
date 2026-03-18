/**
 * Tests d'intégration pour le système d'import complet
 * Note: ImportGateway delegates to Edge Functions, so we mock the response
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importGateway, getSupportedSources } from '../index'
import type { ImportRequest } from '../types'

// Mock Supabase with realistic edge function responses
const mockInvoke = vi.fn()

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-123' } } 
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-123' } } }
      })
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    functions: {
      invoke: mockInvoke
    }
  }
}))

vi.mock('@/utils/productionLogger', () => ({
  productionLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}))

describe('Import Gateway - Tests d\'intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: edge function returns empty success
    mockInvoke.mockResolvedValue({ data: { products: [], imported: 0 }, error: null })
  })

  describe('Import CSV complet', () => {
    it('importe un fichier CSV avec normalisation', async () => {
      // Mock edge function returning processed products
      mockInvoke.mockResolvedValueOnce({
        data: {
          products: [
            { title: 'Produit Test 1', price: 29.99, sku: 'TEST-001' },
            { title: 'Produit Test 2', price: 49.99, sku: 'TEST-002' }
          ],
          imported: 2
        },
        error: null
      })

      const request: ImportRequest = {
        source: 'csv',
        data: [
          { name: 'Produit Test 1', price: '29.99', sku: 'TEST-001' },
          { name: 'Produit Test 2', price: '49.99', sku: 'TEST-002' }
        ]
      }

      const result = await importGateway.import(request)

      expect(result.success).toBe(true)
      expect(result.products).toHaveLength(2)
      expect(result.products![0].title).toBe('Produit Test 1')
      expect(result.products![0].price).toBe(29.99)
      expect(result.metadata?.source).toBe('csv')
    })

    it('gère les produits avec données manquantes', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          products: [{ title: 'Produit Complet', price: 19.99 }],
          imported: 1, failed: 1
        },
        error: null
      })

      const request: ImportRequest = {
        source: 'csv',
        data: [
          { name: 'Produit Complet', price: '19.99' },
          { name: 'AB', price: '0' }
        ]
      }

      const result = await importGateway.import(request)

      expect(result.success).toBe(true)
      expect(result.products).toBeDefined()
      expect(result.products!.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Sources supportées', () => {
    it('retourne la liste complète des sources', () => {
      const sources = getSupportedSources()

      expect(sources).toContain('aliexpress')
      expect(sources).toContain('temu')
      expect(sources).toContain('amazon')
      expect(sources).toContain('ebay')
      expect(sources).toContain('shopify')
      expect(sources).toContain('csv')
      expect(sources).toContain('xml')
      expect(sources).toContain('json')
      expect(sources).toContain('api')
      expect(sources).toContain('extension')
    })
  })

  describe('Gestion des erreurs', () => {
    it('retourne une erreur pour edge function error', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { error: 'Source non supportée' },
        error: null
      })

      const request = {
        source: 'unknown-source' as any,
        url: 'https://unknown.com/product'
      }

      const result = await importGateway.import(request)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('retourne une erreur pour requête invalide', async () => {
      const request = {} as ImportRequest

      const result = await importGateway.import(request)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBeDefined()
    })
  })

  describe('Métadonnées de résultat', () => {
    it('inclut les métadonnées complètes', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { products: [{ title: 'Test' }], imported: 1 },
        error: null
      })

      const request: ImportRequest = {
        source: 'csv',
        data: [{ name: 'Test', price: '10' }]
      }

      const result = await importGateway.import(request)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.requestId).toBeDefined()
      expect(result.metadata?.source).toBe('csv')
      expect(result.metadata?.timestamp).toBeDefined()
      expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Score de complétude', () => {
    it('retourne les produits depuis edge function', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          products: [{ title: 'Produit Complet', price: 99.99, completenessScore: 85 }],
          imported: 1
        },
        error: null
      })

      const request: ImportRequest = {
        source: 'csv',
        data: [{ name: 'Produit Complet', price: '99.99' }]
      }

      const result = await importGateway.import(request)

      expect(result.products![0].completenessScore).toBe(85)
    })
  })
})

describe('Workflow d\'import bout-en-bout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('simule un import depuis extension Chrome', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        products: [{
          title: 'Produit importé via extension',
          price: 15.99,
          sourceUrl: 'https://www.aliexpress.com/item/1234567890.html',
          sourcePlatform: 'aliexpress'
        }],
        imported: 1
      },
      error: null
    })

    const extensionPayload: ImportRequest = {
      source: 'extension',
      url: 'https://www.aliexpress.com/item/1234567890.html',
      data: { productId: '1234567890' },
      options: { fromExtension: true }
    }

    const result = await importGateway.import(extensionPayload)

    expect(result.success).toBe(true)
    expect(result.products).toHaveLength(1)
    expect(result.products![0].sourceUrl).toContain('aliexpress.com')
    expect(result.products![0].sourcePlatform).toBe('aliexpress')
  })

  it('simule un import bulk CSV', async () => {
    const bulkProducts = Array.from({ length: 50 }, (_, i) => ({
      title: `Produit Bulk ${i + 1}`,
      price: 10 + i * 2
    }))

    mockInvoke.mockResolvedValueOnce({
      data: { products: bulkProducts, imported: 50 },
      error: null
    })

    const request: ImportRequest = {
      source: 'csv',
      data: Array.from({ length: 50 }, (_, i) => ({ name: `Produit Bulk ${i + 1}`, price: String(10 + i * 2) }))
    }

    const result = await importGateway.import(request)

    expect(result.success).toBe(true)
    expect(result.products?.length).toBe(50)
  })
})
