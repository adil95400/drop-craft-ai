/**
 * Tests d'intégration pour le système d'import complet
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importGateway, getSupportedSources } from '../index'
import type { ImportRequest } from '../types'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-123' } } 
      })
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    })),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}))

describe('Import Gateway - Tests d\'intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Import CSV complet', () => {
    it('importe un fichier CSV avec normalisation', async () => {
      const csvData = [
        {
          name: 'Produit Test 1',
          description: 'Description complète du premier produit avec suffisamment de texte pour la validation.',
          price: '29.99',
          sku: 'TEST-001',
          stock_quantity: '100',
          category: 'Electronics',
          image_url: 'https://example.com/img1.jpg'
        },
        {
          name: 'Produit Test 2',
          description: 'Description complète du deuxième produit avec suffisamment de texte pour la validation.',
          price: '49.99',
          sku: 'TEST-002',
          stock_quantity: '50',
          category: 'Electronics',
          image_url: 'https://example.com/img2.jpg'
        }
      ]

      const request: ImportRequest = {
        source: 'csv',
        data: csvData
      }

      const result = await importGateway.import(request)

      expect(result.success).toBe(true)
      expect(result.products).toHaveLength(2)
      expect(result.products![0].title).toBe('Produit Test 1')
      expect(result.products![0].price).toBe(29.99)
      expect(result.products![0].sku).toBe('TEST-001')
      expect(result.metadata?.source).toBe('csv')
    })

    it('gère les produits avec données manquantes', async () => {
      const csvData = [
        { name: 'Produit Complet', price: '19.99', image_url: 'https://test.jpg', description: 'Une description suffisamment longue pour passer' },
        { name: 'AB', price: '0' } // Données incomplètes
      ]

      const request: ImportRequest = {
        source: 'csv',
        data: csvData
      }

      const result = await importGateway.import(request)

      expect(result.success).toBe(true)
      expect(result.products).toBeDefined()
      
      // Le premier produit devrait être valide
      const validProducts = result.products!.filter(p => p.status !== 'error_incomplete')
      expect(validProducts.length).toBeGreaterThanOrEqual(1)
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
    it('retourne une erreur pour source non supportée', async () => {
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
      const request: ImportRequest = {
        source: 'csv',
        data: [{ name: 'Test', price: '10', image_url: 'https://t.jpg', description: 'Desc suffisante pour passer la validation' }]
      }

      const result = await importGateway.import(request)

      expect(result.metadata).toBeDefined()
      expect(result.metadata?.requestId).toMatch(/^req_/)
      expect(result.metadata?.source).toBe('csv')
      expect(result.metadata?.timestamp).toBeDefined()
      expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Score de complétude', () => {
    it('calcule le score pour chaque produit', async () => {
      const request: ImportRequest = {
        source: 'csv',
        data: [{
          name: 'Produit Complet avec Titre Long',
          description: 'Une description très complète avec beaucoup de détails sur le produit, ses caractéristiques et ses avantages.',
          price: '99.99',
          sku: 'COMP-001',
          category: 'electronics',
          brand: 'TestBrand',
          image_url: 'https://img1.jpg|https://img2.jpg|https://img3.jpg'
        }]
      }

      const result = await importGateway.import(request)

      expect(result.products![0].completenessScore).toBeGreaterThan(50)
    })
  })
})

describe('Workflow d\'import bout-en-bout', () => {
  it('simule un import depuis extension Chrome', async () => {
    const extensionPayload: ImportRequest = {
      source: 'extension',
      url: 'https://www.aliexpress.com/item/1234567890.html',
      data: {
        productId: '1234567890',
        title: { displayTitle: 'Produit importé via extension' },
        prices: { salePrice: { minPrice: 15.99 } },
        images: { imagePathList: ['//img.aliexpress.com/product.jpg'] },
        description: { html: '<p>Description complète du produit</p>' }
      },
      options: {
        fromExtension: true,
        includeVariants: true
      }
    }

    const result = await importGateway.import(extensionPayload)

    expect(result.success).toBe(true)
    expect(result.products).toHaveLength(1)
    expect(result.products![0].sourceUrl).toContain('aliexpress.com')
    expect(result.products![0].sourcePlatform).toBe('aliexpress')
  })

  it('simule un import bulk CSV', async () => {
    // Génère 50 produits
    const bulkData = Array.from({ length: 50 }, (_, i) => ({
      name: `Produit Bulk ${i + 1}`,
      description: `Description du produit numéro ${i + 1} avec suffisamment de contenu`,
      price: String((10 + i * 2).toFixed(2)),
      sku: `BULK-${String(i + 1).padStart(3, '0')}`,
      stock_quantity: String(100 - i),
      category: i % 2 === 0 ? 'Electronics' : 'Clothing',
      image_url: `https://example.com/bulk-img-${i + 1}.jpg`
    }))

    const request: ImportRequest = {
      source: 'csv',
      data: bulkData,
      options: {
        maxProducts: 50
      }
    }

    const result = await importGateway.import(request)

    expect(result.success).toBe(true)
    expect(result.products?.length).toBe(50)
    expect(result.metadata?.totalExtracted).toBe(50)
  })
})
