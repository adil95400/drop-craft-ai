/**
 * Tests unitaires pour les adaptateurs d'import
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AliExpressAdapter } from '../adapters/AliExpressAdapter'
import { AmazonAdapter } from '../adapters/AmazonAdapter'
import { ShopifyAdapter } from '../adapters/ShopifyAdapter'
import { CSVAdapter } from '../adapters/CSVAdapter'
import { GenericURLAdapter } from '../adapters/GenericURLAdapter'
import { getAdapter, getSupportedSources, isSourceSupported } from '../adapters'
import type { ImportRequest, NormalizedProduct } from '../types'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null })
    }
  }
}))

describe('Adapter Registry', () => {
  describe('getAdapter', () => {
    it('retourne AliExpressAdapter pour aliexpress', () => {
      const adapter = getAdapter('aliexpress')
      expect(adapter).toBeInstanceOf(AliExpressAdapter)
    })

    it('retourne AliExpressAdapter pour temu', () => {
      const adapter = getAdapter('temu')
      expect(adapter).toBeInstanceOf(AliExpressAdapter)
    })

    it('retourne AmazonAdapter pour amazon', () => {
      const adapter = getAdapter('amazon')
      expect(adapter).toBeInstanceOf(AmazonAdapter)
    })

    it('retourne AmazonAdapter pour ebay', () => {
      const adapter = getAdapter('ebay')
      expect(adapter).toBeInstanceOf(AmazonAdapter)
    })

    it('retourne ShopifyAdapter pour shopify', () => {
      const adapter = getAdapter('shopify')
      expect(adapter).toBeInstanceOf(ShopifyAdapter)
    })

    it('retourne CSVAdapter pour csv', () => {
      const adapter = getAdapter('csv')
      expect(adapter).toBeInstanceOf(CSVAdapter)
    })

    it('retourne CSVAdapter pour xml et json', () => {
      expect(getAdapter('xml')).toBeInstanceOf(CSVAdapter)
      expect(getAdapter('json')).toBeInstanceOf(CSVAdapter)
    })

    it('retourne GenericURLAdapter pour feed', () => {
      const adapter = getAdapter('feed')
      expect(adapter).toBeInstanceOf(GenericURLAdapter)
    })

    it('throw pour source non supportée', () => {
      // @ts-ignore
      expect(() => getAdapter('unsupported')).toThrow()
    })
  })

  describe('getSupportedSources', () => {
    it('retourne toutes les sources supportées', () => {
      const sources = getSupportedSources()
      
      expect(sources).toContain('aliexpress')
      expect(sources).toContain('amazon')
      expect(sources).toContain('shopify')
      expect(sources).toContain('csv')
      expect(sources).toContain('extension')
    })
  })

  describe('isSourceSupported', () => {
    it('retourne true pour les sources supportées', () => {
      expect(isSourceSupported('aliexpress')).toBe(true)
      expect(isSourceSupported('amazon')).toBe(true)
      expect(isSourceSupported('csv')).toBe(true)
    })

    it('retourne false pour les sources non supportées', () => {
      // @ts-ignore
      expect(isSourceSupported('fake-source')).toBe(false)
    })
  })
})

describe('AliExpressAdapter', () => {
  let adapter: AliExpressAdapter

  beforeEach(() => {
    adapter = new AliExpressAdapter()
  })

  describe('normalize', () => {
    it('normalise un produit AliExpress brut', () => {
      const raw = {
        productId: '1234567890',
        title: { displayTitle: 'Test Product AliExpress' },
        prices: { 
          salePrice: { minPrice: 19.99 },
          originalPrice: { minPrice: 29.99 }
        },
        images: { imagePathList: ['//img.aliexpress.com/test1.jpg', '//img.aliexpress.com/test2.jpg'] },
        description: { html: '<p>Description du produit</p>' },
        specs: [{ attrName: 'Material', attrValue: 'Plastic' }]
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('Test Product AliExpress')
      expect(normalized.price).toBe(19.99)
      expect(normalized.compareAtPrice).toBe(29.99)
      expect(normalized.images).toHaveLength(2)
      expect(normalized.images[0]).toMatch(/^https:/)
      expect(normalized.sourceId).toBe('1234567890')
      expect(normalized.sourcePlatform).toBe('aliexpress')
    })

    it('gère les données manquantes', () => {
      const raw = {
        title: { displayTitle: 'Minimal Product' }
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('Minimal Product')
      expect(normalized.price).toBe(0)
      expect(normalized.images).toEqual([])
      expect(normalized.status).toBe('error_incomplete')
    })

    it('extrait les variantes si présentes', () => {
      const raw = {
        title: { displayTitle: 'Product with Variants' },
        prices: { salePrice: { minPrice: 10 } },
        images: { imagePathList: ['//test.jpg'] },
        skuInfo: {
          skuList: [
            { 
              skuId: 'sku1', 
              skuAttr: 'Size:M;Color:Red',
              skuPrice: 10,
              availQuantity: 50
            },
            {
              skuId: 'sku2',
              skuAttr: 'Size:L;Color:Blue',
              skuPrice: 12,
              availQuantity: 30
            }
          ]
        }
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.variants).toHaveLength(2)
      expect(normalized.variants![0].options).toHaveProperty('Size')
      expect(normalized.variants![0].options).toHaveProperty('Color')
    })
  })

  describe('normalize validation', () => {
    it('produit normalisé a les champs requis', () => {
      const raw = {
        productId: '1234567890',
        title: { displayTitle: 'Test Product AliExpress' },
        prices: { 
          salePrice: { minPrice: 19.99 }
        },
        images: { imagePathList: ['//img.aliexpress.com/test1.jpg'] },
        description: { html: '<p>Description du produit</p>' }
      }

      const normalized = adapter.normalize(raw)
      
      // Vérifie les champs requis
      expect(normalized.title).toBeDefined()
      expect(normalized.price).toBeDefined()
      expect(normalized.images).toBeDefined()
      expect(normalized.completenessScore).toBeDefined()
      expect(normalized.sourceAttribution).toBeDefined()
    })
  })
})

describe('AmazonAdapter', () => {
  let adapter: AmazonAdapter

  beforeEach(() => {
    adapter = new AmazonAdapter()
  })

  describe('normalize', () => {
    it('normalise un produit Amazon brut', () => {
      const raw = {
        asin: 'B08XYZ123',
        title: 'Amazon Test Product',
        price: { value: 49.99, currency: 'EUR' },
        images: [
          { url: 'https://images-na.ssl-images-amazon.com/test.jpg' }
        ],
        description: 'Product description from Amazon',
        brand: 'TestBrand',
        rating: { value: 4.5, count: 1234 }
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('Amazon Test Product')
      expect(normalized.price).toBe(49.99)
      expect(normalized.brand).toBe('TestBrand')
      expect(normalized.sourceId).toBe('B08XYZ123')
      expect(normalized.sourcePlatform).toBe('amazon')
      expect(normalized.rating).toBe(4.5)
      expect(normalized.reviewCount).toBe(1234)
    })

    it('extrait les variantes Amazon', () => {
      const raw = {
        asin: 'B08XYZ123',
        title: 'Product with Options',
        price: { value: 30 },
        images: [{ url: 'https://test.jpg' }],
        variants: [
          { asin: 'B08V1', title: 'Size S', price: 30 },
          { asin: 'B08V2', title: 'Size M', price: 32 }
        ]
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.variants).toBeDefined()
    })
  })
})

describe('ShopifyAdapter', () => {
  let adapter: ShopifyAdapter

  beforeEach(() => {
    adapter = new ShopifyAdapter()
  })

  describe('normalize', () => {
    it('normalise un produit Shopify brut', () => {
      const raw = {
        id: 123456789,
        title: 'Shopify Product',
        body_html: '<p>Product description</p>',
        vendor: 'Test Vendor',
        product_type: 'Clothing',
        handle: 'shopify-product',
        images: [
          { src: 'https://cdn.shopify.com/test.jpg', alt: 'Main image' }
        ],
        variants: [
          {
            id: 1,
            title: 'Default',
            price: '39.99',
            compare_at_price: '49.99',
            sku: 'SHOP-001',
            inventory_quantity: 100,
            option1: 'M',
            option2: 'Blue'
          }
        ],
        options: [
          { name: 'Size', values: ['S', 'M', 'L'] },
          { name: 'Color', values: ['Blue', 'Red'] }
        ],
        tags: 'clothing, fashion, sale'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('Shopify Product')
      expect(normalized.price).toBe(39.99)
      expect(normalized.compareAtPrice).toBe(49.99)
      expect(normalized.brand).toBe('Test Vendor')
      expect(normalized.category).toBe('Clothing')
      expect(normalized.variants).toHaveLength(1)
      expect(normalized.variants![0].sku).toBe('SHOP-001')
      expect(normalized.options).toHaveLength(2)
      expect(normalized.tags).toContain('clothing')
    })

    it('gère les produits sans variantes', () => {
      const raw = {
        id: 123,
        title: 'Simple Product',
        body_html: 'Description',
        images: [{ src: 'https://test.jpg' }],
        variants: [
          { id: 1, title: 'Default Title', price: '25.00' }
        ]
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.variants).toHaveLength(1)
      expect(normalized.price).toBe(25)
    })
  })
})

describe('CSVAdapter', () => {
  let adapter: CSVAdapter

  beforeEach(() => {
    adapter = new CSVAdapter()
  })

  describe('normalize', () => {
    it('normalise une ligne CSV', () => {
      const raw = {
        name: 'CSV Product',
        title: '', // name prend priorité
        description: 'Product from CSV import',
        price: '29.99',
        sku: 'CSV-001',
        stock_quantity: '50',
        category: 'Electronics',
        brand: 'CSVBrand',
        image_url: 'https://example.com/image.jpg',
        tags: 'electronics, gadget'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('CSV Product')
      expect(normalized.price).toBe(29.99)
      expect(normalized.sku).toBe('CSV-001')
      expect(normalized.stock).toBe(50)
      expect(normalized.category).toBe('Electronics')
      expect(normalized.brand).toBe('CSVBrand')
      expect(normalized.images).toContain('https://example.com/image.jpg')
    })

    it('gère les images multiples séparées par |', () => {
      const raw = {
        title: 'Multi Image Product',
        price: '10',
        images: 'https://img1.jpg|https://img2.jpg|https://img3.jpg'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.images).toHaveLength(3)
    })

    it('gère les prix avec virgule', () => {
      const raw = {
        title: 'European Price',
        price: '29,99'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.price).toBe(29.99)
    })
  })

  describe('extract', () => {
    it('extrait les données depuis un tableau', async () => {
      const request: ImportRequest = {
        source: 'csv',
        data: [
          { title: 'Product 1', price: 10 },
          { title: 'Product 2', price: 20 }
        ]
      }

      const extracted = await adapter.extract(request)

      expect(extracted).toHaveLength(2)
    })
  })
})

describe('GenericURLAdapter', () => {
  let adapter: GenericURLAdapter

  beforeEach(() => {
    adapter = new GenericURLAdapter()
  })

  describe('normalize', () => {
    it('normalise des métadonnées OpenGraph', () => {
      const raw = {
        og: {
          title: 'OG Title',
          description: 'OG Description',
          image: 'https://example.com/og-image.jpg',
          price: { amount: '39.99', currency: 'EUR' }
        },
        url: 'https://example.com/product'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('OG Title')
      expect(normalized.description).toBe('OG Description')
      expect(normalized.images).toContain('https://example.com/og-image.jpg')
      expect(normalized.sourceUrl).toBe('https://example.com/product')
    })

    it('utilise JSON-LD si disponible', () => {
      const raw = {
        jsonLd: {
          '@type': 'Product',
          name: 'JSON-LD Product',
          description: 'From structured data',
          offers: {
            price: 59.99,
            priceCurrency: 'EUR'
          },
          image: ['https://example.com/ld-image.jpg']
        },
        url: 'https://example.com/product'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('JSON-LD Product')
      expect(normalized.price).toBe(59.99)
    })

    it('fallback sur meta tags', () => {
      const raw = {
        meta: {
          title: 'Meta Title',
          description: 'Meta Description'
        },
        url: 'https://example.com/product'
      }

      const normalized = adapter.normalize(raw)

      expect(normalized.title).toBe('Meta Title')
      expect(normalized.description).toBe('Meta Description')
    })
  })
})
