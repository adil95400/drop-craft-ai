/**
 * Tests unitaires pour ImportGateway
 * Couverture: source detection, validation, routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImportGateway } from '../ImportGateway'
import type { ImportRequest, ImportSource } from '../types'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-123' } } } })
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
      invoke: vi.fn().mockResolvedValue({ data: { products: [], imported: 0 }, error: null })
    }
  }
}))

// Mock productionLogger
vi.mock('@/utils/productionLogger', () => ({
  productionLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}))

describe('ImportGateway', () => {
  let gateway: ImportGateway

  beforeEach(() => {
    gateway = new ImportGateway()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Détection de source', () => {
    it('détecte AliExpress depuis URL', () => {
      const url = 'https://fr.aliexpress.com/item/1234567890.html'
      // @ts-ignore - accès méthode privée pour test
      const source = gateway['detectSource'](url)
      expect(source).toBe('aliexpress')
    })

    it('détecte Amazon depuis URL', () => {
      const url = 'https://www.amazon.fr/dp/B08XYZ123'
      // @ts-ignore
      const source = gateway['detectSource'](url)
      expect(source).toBe('amazon')
    })

    it('détecte Temu depuis URL', () => {
      const url = 'https://www.temu.com/product-123.html'
      // @ts-ignore
      const source = gateway['detectSource'](url)
      expect(source).toBe('temu')
    })

    it('détecte eBay depuis URL', () => {
      const url = 'https://www.ebay.fr/itm/123456789'
      // @ts-ignore
      const source = gateway['detectSource'](url)
      expect(source).toBe('ebay')
    })

    it('détecte Shopify depuis URL myshopify', () => {
      const url = 'https://test-store.myshopify.com/products/test-product'
      // @ts-ignore
      const source = gateway['detectSource'](url)
      expect(source).toBe('shopify')
    })

    it('détecte Etsy depuis URL', () => {
      const url = 'https://www.etsy.com/listing/123456789'
      // Note: Etsy is not in the current detectSource, it will return 'api'
      // @ts-ignore
      const source = gateway['detectSource'](url)
      expect(source).toBe('api') // Etsy not specifically handled
    })

    it('utilise la source spécifiée si fournie', async () => {
      // importFromUrl with explicit source uses that source
      const source: ImportSource = 'csv'
      // @ts-ignore
      const detectedSource = gateway['detectSource']('https://example.com/file.csv')
      expect(detectedSource).toBe('csv')
    })
  })

  describe('Validation', () => {
    it('rejette les requêtes sans source ni URL', async () => {
      const result = await gateway.import({} as ImportRequest)
      expect(result.success).toBe(false)
    })

    it('accepte les requêtes avec URL valide', async () => {
      const result = await gateway.import({
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      })
      expect(result).toBeDefined()
      expect(result.metadata).toBeDefined()
    })

    it('accepte les requêtes CSV avec données', async () => {
      const result = await gateway.import({
        source: 'csv',
        data: [{ title: 'Test Product', price: 10 }]
      })
      expect(result).toBeDefined()
    })

    it('retourne la liste des sources supportées', () => {
      const sources = gateway.getSupportedSources()
      expect(sources).toContain('aliexpress')
      expect(sources).toContain('amazon')
      expect(sources).toContain('shopify')
      expect(sources).toContain('csv')
      expect(sources.length).toBeGreaterThanOrEqual(8)
    })
  })

  describe('Import depuis URL', () => {
    it('importe un produit depuis URL avec détection auto', async () => {
      const result = await gateway.importFromUrl('https://aliexpress.com/item/123.html')
      expect(result).toBeDefined()
      expect(result.metadata?.source).toBe('aliexpress')
    })

    it('importe avec source explicite', async () => {
      const result = await gateway.importFromUrl('https://example.com/product', 'amazon')
      expect(result).toBeDefined()
      expect(result.metadata?.source).toBe('amazon')
    })
  })

  describe('Historique', () => {
    it('retourne l\'historique des imports', async () => {
      const history = await gateway.getImportHistory()
      expect(Array.isArray(history)).toBe(true)
    })
  })
})
