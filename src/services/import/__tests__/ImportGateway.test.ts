/**
 * Tests unitaires pour ImportGateway
 * Couverture: idempotence, anti-replay, routing, erreurs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ImportGateway } from '../ImportGateway'
import type { ImportRequest, ImportSource } from '../types'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } })
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }))
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
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('aliexpress')
    })

    it('détecte Amazon depuis URL', () => {
      const url = 'https://www.amazon.fr/dp/B08XYZ123'
      // @ts-ignore
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('amazon')
    })

    it('détecte Temu depuis URL', () => {
      const url = 'https://www.temu.com/product-123.html'
      // @ts-ignore
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('temu')
    })

    it('détecte eBay depuis URL', () => {
      const url = 'https://www.ebay.fr/itm/123456789'
      // @ts-ignore
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('ebay')
    })

    it('détecte Shopify depuis URL myshopify', () => {
      const url = 'https://test-store.myshopify.com/products/test-product'
      // @ts-ignore
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('shopify')
    })

    it('détecte Etsy depuis URL', () => {
      const url = 'https://www.etsy.com/listing/123456789'
      // @ts-ignore
      const source = gateway['detectSource']({ url } as ImportRequest)
      expect(source).toBe('etsy')
    })

    it('utilise la source spécifiée si fournie', () => {
      const request: ImportRequest = {
        source: 'csv',
        data: []
      }
      // @ts-ignore
      const source = gateway['detectSource'](request)
      expect(source).toBe('csv')
    })
  })

  describe('Génération d\'identifiants', () => {
    it('génère un requestId unique', () => {
      // @ts-ignore
      const id1 = gateway['generateRequestId']()
      // @ts-ignore
      const id2 = gateway['generateRequestId']()
      
      expect(id1).toMatch(/^req_/)
      expect(id2).toMatch(/^req_/)
      expect(id1).not.toBe(id2)
    })

    it('génère un idempotencyKey basé sur le contenu', () => {
      const request: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      }
      
      // @ts-ignore
      const key1 = gateway['generateIdempotencyKey'](request)
      // @ts-ignore
      const key2 = gateway['generateIdempotencyKey'](request)
      
      expect(key1).toBe(key2) // Même contenu = même clé
    })

    it('génère des clés différentes pour des requêtes différentes', () => {
      const request1: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      }
      const request2: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/456.html'
      }
      
      // @ts-ignore
      const key1 = gateway['generateIdempotencyKey'](request1)
      // @ts-ignore
      const key2 = gateway['generateIdempotencyKey'](request2)
      
      expect(key1).not.toBe(key2)
    })
  })

  describe('Anti-replay', () => {
    it('détecte les requêtes dupliquées', async () => {
      const request: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      }

      // Première requête
      // @ts-ignore
      const key = gateway['generateIdempotencyKey'](request)
      // @ts-ignore
      gateway['processedRequests'].set(key, {
        requestId: 'req_123',
        timestamp: Date.now(),
        result: { success: true, products: [] }
      })

      // Deuxième requête (dupliquée)
      // @ts-ignore
      const isDuplicate = gateway['checkDuplicate'](key)
      expect(isDuplicate).toBe(true)
    })

    it('ne bloque pas les requêtes expirées', async () => {
      const request: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      }

      // @ts-ignore
      const key = gateway['generateIdempotencyKey'](request)
      // Ajouter une entrée expirée (plus de 30 jours)
      // @ts-ignore
      gateway['processedRequests'].set(key, {
        requestId: 'req_old',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 jours
        result: { success: true, products: [] }
      })

      // @ts-ignore
      gateway['cleanupExpiredRequests']()
      
      // @ts-ignore
      const isDuplicate = gateway['checkDuplicate'](key)
      expect(isDuplicate).toBe(false)
    })
  })

  describe('Validation des requêtes', () => {
    it('rejette les requêtes sans source ni URL', () => {
      const request = {} as ImportRequest
      
      // validateRequest throws on invalid request
      expect(() => {
        // @ts-ignore
        gateway['validateRequest'](request)
      }).toThrow()
    })

    it('accepte les requêtes avec URL valide', () => {
      const request: ImportRequest = {
        source: 'aliexpress',
        url: 'https://aliexpress.com/item/123.html'
      }
      
      // Should not throw
      expect(() => {
        // @ts-ignore
        gateway['validateRequest'](request)
      }).not.toThrow()
    })

    it('accepte les requêtes CSV avec données', () => {
      const request: ImportRequest = {
        source: 'csv',
        data: [{ title: 'Test', price: 10 }]
      }
      
      // Should not throw
      expect(() => {
        // @ts-ignore
        gateway['validateRequest'](request)
      }).not.toThrow()
    })
  })

  describe('Sources supportées', () => {
    it('retourne la liste des sources supportées', () => {
      const sources = gateway.getSupportedSources()
      
      expect(sources).toContain('aliexpress')
      expect(sources).toContain('amazon')
      expect(sources).toContain('shopify')
      expect(sources).toContain('csv')
      expect(sources.length).toBeGreaterThan(5)
    })
  })
})
