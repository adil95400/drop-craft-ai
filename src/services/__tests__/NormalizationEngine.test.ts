import { describe, it, expect } from 'vitest'
import { NormalizationEngine, type RawProductInput } from '../NormalizationEngine'

describe('NormalizationEngine', () => {
  const engine = new NormalizationEngine('import')

  describe('normalize', () => {
    it('normalizes a complete product', () => {
      const raw: RawProductInput = {
        title: 'Test Product',
        description: 'A great product for testing',
        category: 'Electronics',
        price: 29.99,
        sku: 'SKU-001',
        images: ['https://example.com/img.jpg'],
        tags: ['test', 'electronics'],
        seo_title: 'Buy Test Product',
        seo_description: 'Best test product for developers',
      }
      const result = engine.normalize(raw)
      expect(result.title).toBe('Test Product')
      expect(result.price).toBe(29.99)
      expect(result.category).toBe('Electronics')
      expect(result.sku).toBe('SKU-001')
      expect(result.status).toBe('active')
      expect(result.completeness_score).toBeGreaterThan(70)
      expect(result.content_hash).toBeTruthy()
    })

    it('handles minimal product with defaults', () => {
      const raw: RawProductInput = { title: 'Minimal' }
      const result = engine.normalize(raw)
      expect(result.title).toBe('Minimal')
      expect(result.price).toBe(0)
      expect(result.currency).toBe('EUR')
      expect(result.description).toBe('')
      expect(result.category).toBe('Non catégorisé')
      expect(result.status).toBe('error_incomplete')
    })

    it('extracts title from alternative field names', () => {
      expect(engine.normalize({ name: 'Via Name' }).title).toBe('Via Name')
      expect(engine.normalize({ product_name: 'Via ProductName' }).title).toBe('Via ProductName')
    })

    it('sanitizes HTML in descriptions', () => {
      const raw: RawProductInput = {
        title: 'XSS Test',
        description: '<p>Safe</p><script>alert("xss")</script>',
      }
      const result = engine.normalize(raw)
      expect(result.description).not.toContain('<script>')
      expect(result.description).toContain('Safe')
    })

    it('extracts price from alternative fields', () => {
      expect(engine.normalize({ title: 'P', sale_price: 19.5 }).price).toBe(19.5)
      expect(engine.normalize({ title: 'P', unit_price: '12.99' }).price).toBe(12.99)
    })

    it('truncates long fields', () => {
      const longTitle = 'A'.repeat(1000)
      const result = engine.normalize({ title: longTitle })
      expect(result.title.length).toBeLessThanOrEqual(500)
    })

    it('limits images to 20', () => {
      const images = Array.from({ length: 30 }, (_, i) => `https://example.com/img${i}.jpg`)
      const result = engine.normalize({ title: 'P', images })
      expect(result.images.length).toBeLessThanOrEqual(20)
    })

    it('throws on null input', () => {
      expect(() => engine.normalize(null as any)).toThrow('Input must be a non-null object')
    })

    it('generates deterministic content hash', () => {
      const raw: RawProductInput = { title: 'Hash Test', price: 10, sku: 'H1' }
      const a = engine.normalize(raw)
      const b = engine.normalize(raw)
      expect(a.content_hash).toBe(b.content_hash)
    })

    it('sets correct status based on completeness', () => {
      // Complete product → active
      const complete = engine.normalize({
        title: 'Full Product',
        description: 'A very detailed description of the product for testing purposes',
        category: 'Tools',
        price: 49.99,
        images: ['https://img.com/1.jpg'],
        tags: ['tool'],
        seo_title: 'Buy Full Product',
        seo_description: 'Best full product available',
        sku: 'FULL-001',
      })
      expect(complete.status).toBe('active')

      // Minimal → error_incomplete
      const minimal = engine.normalize({ title: 'Bare' })
      expect(minimal.status).toBe('error_incomplete')
    })
  })

  describe('normalizeBatch', () => {
    it('processes valid and invalid products', () => {
      const batch: RawProductInput[] = [
        { title: 'Good Product', price: 10 },
        null as any, // invalid
        { title: 'Another Good', price: 20 },
      ]
      const result = engine.normalizeBatch(batch)
      expect(result.products.length).toBe(2)
      expect(result.errors.length).toBe(1)
      expect(result.stats.success).toBe(2)
      expect(result.stats.failed).toBe(1)
    })

    it('detects duplicates within batch', () => {
      const batch: RawProductInput[] = [
        { title: 'Same Product', price: 10, sku: 'DUP' },
        { title: 'Same Product', price: 10, sku: 'DUP' },
      ]
      const result = engine.normalizeBatch(batch)
      expect(result.duplicates.length).toBe(1)
      expect(result.stats.duplicates).toBe(1)
    })

    it('returns timing stats', () => {
      const batch: RawProductInput[] = [{ title: 'P1', price: 5 }]
      const result = engine.normalizeBatch(batch)
      expect(result.stats.duration_ms).toBeGreaterThanOrEqual(0)
      expect(result.stats.total).toBe(1)
    })

    it('handles empty batch', () => {
      const result = engine.normalizeBatch([])
      expect(result.products).toEqual([])
      expect(result.errors).toEqual([])
      expect(result.stats.total).toBe(0)
    })
  })

  describe('custom weights', () => {
    it('uses custom completeness weights', () => {
      const heavyTitleEngine = new NormalizationEngine('import', { title: 80 })
      const result = heavyTitleEngine.normalize({ title: 'Weighted', price: 0 })
      // Title alone accounts for more with heavy weight
      expect(result.completeness_score).toBeGreaterThan(0)
    })
  })
})
