/**
 * Tests unitaires pour les validateurs d'import
 */

import { describe, it, expect } from 'vitest'
import { 
  validateProduct, 
  sanitizeProduct, 
  calculateCompletenessScore,
  determineProductStatus 
} from '../validators'
import type { NormalizedProduct } from '../types'

// Helper pour créer un produit de test valide
function createValidProduct(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
  return {
    title: 'Produit de test avec un titre suffisamment long',
    description: 'Description complète du produit avec assez de caractères pour passer la validation minimum requise.',
    price: 29.99,
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    completenessScore: 75,
    sourceAttribution: {
      title: { source: 'api', confidence: 95, extractedAt: new Date().toISOString() },
      description: { source: 'api', confidence: 90, extractedAt: new Date().toISOString() },
      price: { source: 'api', confidence: 100, extractedAt: new Date().toISOString() },
      images: { source: 'api', confidence: 95, extractedAt: new Date().toISOString() }
    },
    status: 'ready',
    ...overrides
  }
}

describe('validateProduct', () => {
  describe('Champs requis', () => {
    it('valide un produit complet', () => {
      const product = createValidProduct()
      const result = validateProduct(product)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejette un produit sans titre', () => {
      const product = createValidProduct({ title: '' })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Titre requis (minimum 3 caractères)')
    })

    it('rejette un titre trop court', () => {
      const product = createValidProduct({ title: 'AB' })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Titre'))).toBe(true)
    })

    it('rejette un produit sans prix', () => {
      const product = createValidProduct({ price: 0 })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Prix'))).toBe(true)
    })

    it('rejette un prix négatif', () => {
      const product = createValidProduct({ price: -10 })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Prix'))).toBe(true)
    })

    it('rejette un produit sans images', () => {
      const product = createValidProduct({ images: [] })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('image'))).toBe(true)
    })
  })

  describe('Avertissements', () => {
    it('avertit si la description est courte', () => {
      const product = createValidProduct({ description: 'Court' })
      const result = validateProduct(product)
      
      expect(result.warnings.some(w => w.includes('Description'))).toBe(true)
    })

    it('avertit si le prix de revient >= prix de vente', () => {
      const product = createValidProduct({ 
        price: 50, 
        costPrice: 60 
      })
      const result = validateProduct(product)
      
      expect(result.warnings.some(w => w.includes('Prix de revient'))).toBe(true)
    })

    it('avertit si le score de complétude est faible', () => {
      const product = createValidProduct({ completenessScore: 30 })
      const result = validateProduct(product)
      
      expect(result.warnings.some(w => w.includes('complétude'))).toBe(true)
    })
  })

  describe('Validation des URLs d\'images', () => {
    it('rejette les URLs invalides', () => {
      const product = createValidProduct({ 
        images: ['not-a-url', 'https://valid.com/image.jpg'] 
      })
      const result = validateProduct(product)
      
      expect(result.errors.some(e => e.includes('invalide'))).toBe(true)
    })

    it('accepte les URLs HTTP et HTTPS', () => {
      const product = createValidProduct({ 
        images: [
          'https://example.com/image1.jpg',
          'http://example.com/image2.jpg'
        ] 
      })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('Validation des variantes', () => {
    it('valide les variantes correctes', () => {
      const product = createValidProduct({
        variants: [
          {
            title: 'Variante 1',
            price: 29.99,
            options: { size: 'M', color: 'Rouge' }
          }
        ]
      })
      const result = validateProduct(product)
      
      expect(result.valid).toBe(true)
    })

    it('rejette les variantes sans titre', () => {
      const product = createValidProduct({
        variants: [
          {
            title: '',
            price: 29.99,
            options: { size: 'M' }
          }
        ]
      })
      const result = validateProduct(product)
      
      expect(result.errors.some(e => e.includes('Variante') && e.includes('titre'))).toBe(true)
    })

    it('rejette les variantes avec prix invalide', () => {
      const product = createValidProduct({
        variants: [
          {
            title: 'Variante',
            price: -5,
            options: { size: 'M' }
          }
        ]
      })
      const result = validateProduct(product)
      
      expect(result.errors.some(e => e.includes('Variante') && e.includes('prix'))).toBe(true)
    })

    it('détecte les SKUs dupliqués', () => {
      const product = createValidProduct({
        variants: [
          { title: 'Var 1', price: 10, sku: 'SKU-001', options: {} },
          { title: 'Var 2', price: 15, sku: 'SKU-001', options: {} }
        ]
      })
      const result = validateProduct(product)
      
      expect(result.errors.some(e => e.includes('dupliqué'))).toBe(true)
    })
  })
})

describe('sanitizeProduct', () => {
  it('nettoie le HTML du titre', () => {
    const product = createValidProduct({
      title: '<script>alert("xss")</script>Titre normal'
    })
    const sanitized = sanitizeProduct(product)
    
    expect(sanitized.title).not.toContain('<script>')
    expect(sanitized.title).toContain('Titre normal')
  })

  it('tronque les titres trop longs', () => {
    const longTitle = 'A'.repeat(300)
    const product = createValidProduct({ title: longTitle })
    const sanitized = sanitizeProduct(product)
    
    expect(sanitized.title.length).toBeLessThanOrEqual(203) // 200 + "..."
  })

  it('sanitize la description HTML', () => {
    const product = createValidProduct({
      description: '<p>Texte</p><script>bad()</script><div onclick="x">Test</div>'
    })
    const sanitized = sanitizeProduct(product)
    
    expect(sanitized.description).toContain('<p>Texte</p>')
    expect(sanitized.description).not.toContain('<script>')
    expect(sanitized.description).not.toContain('onclick')
  })

  it('filtre les URLs d\'images invalides', () => {
    const product = createValidProduct({
      images: [
        'https://valid.com/image.jpg',
        'invalid-url',
        'ftp://not-http.com/image.jpg'
      ]
    })
    const sanitized = sanitizeProduct(product)
    
    expect(sanitized.images).toHaveLength(1)
    expect(sanitized.images[0]).toBe('https://valid.com/image.jpg')
  })

  it('nettoie les SKUs des variantes', () => {
    const product = createValidProduct({
      variants: [
        {
          title: 'Variante',
          price: 10,
          sku: 'SKU@#$%123',
          options: {}
        }
      ]
    })
    const sanitized = sanitizeProduct(product)
    
    expect(sanitized.variants![0].sku).toMatch(/^[a-zA-Z0-9\-_]+$/)
  })
})

describe('calculateCompletenessScore', () => {
  it('retourne 0 pour un produit vide', () => {
    const score = calculateCompletenessScore({})
    expect(score).toBe(0)
  })

  it('ajoute des points pour le titre', () => {
    const scoreShort = calculateCompletenessScore({ title: 'ABC' })
    const scoreLong = calculateCompletenessScore({ title: 'Titre suffisamment long' })
    
    expect(scoreLong).toBeGreaterThan(scoreShort)
  })

  it('ajoute des points pour la description', () => {
    const scores = [
      calculateCompletenessScore({ description: 'Court' }),
      calculateCompletenessScore({ description: 'Description de taille moyenne environ' }),
      calculateCompletenessScore({ description: 'Description très longue avec beaucoup de détails sur le produit, ses caractéristiques, ses avantages et tout ce qui pourrait intéresser l\'acheteur potentiel.' })
    ]
    
    expect(scores[2]).toBeGreaterThan(scores[1])
    expect(scores[1]).toBeGreaterThan(scores[0])
  })

  it('ajoute des points pour les images', () => {
    const score1 = calculateCompletenessScore({ images: ['img1.jpg'] })
    const score3 = calculateCompletenessScore({ images: ['img1.jpg', 'img2.jpg', 'img3.jpg'] })
    
    expect(score3).toBeGreaterThan(score1)
  })

  it('ajoute des points pour les variantes', () => {
    const withoutVariants = calculateCompletenessScore({ title: 'Test', price: 10 })
    const withVariants = calculateCompletenessScore({ 
      title: 'Test', 
      price: 10,
      variants: [{ title: 'V1', price: 10, options: {} }]
    })
    
    expect(withVariants).toBeGreaterThan(withoutVariants)
  })

  it('ne dépasse jamais 100', () => {
    const maxProduct = {
      title: 'Titre très complet',
      description: 'Description très longue avec beaucoup de détails sur le produit, ses caractéristiques, ses avantages et tout ce qui pourrait intéresser l\'acheteur potentiel.',
      price: 99.99,
      images: ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'],
      category: 'electronics',
      sku: 'SKU-123',
      brand: 'TestBrand',
      variants: [{ title: 'V1', price: 10, options: {} }],
      seoTitle: 'SEO Title complet',
      seoDescription: 'SEO Description suffisamment longue pour avoir tous les points',
      weight: 1.5,
      attributes: { material: 'plastic', color: 'blue', size: 'medium' }
    }
    
    const score = calculateCompletenessScore(maxProduct)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('determineProductStatus', () => {
  it('retourne ready pour score >= 70', () => {
    expect(determineProductStatus(70)).toBe('ready')
    expect(determineProductStatus(85)).toBe('ready')
    expect(determineProductStatus(100)).toBe('ready')
  })

  it('retourne draft pour score >= 40 et < 70', () => {
    expect(determineProductStatus(40)).toBe('draft')
    expect(determineProductStatus(55)).toBe('draft')
    expect(determineProductStatus(69)).toBe('draft')
  })

  it('retourne error_incomplete pour score < 40', () => {
    expect(determineProductStatus(0)).toBe('error_incomplete')
    expect(determineProductStatus(20)).toBe('error_incomplete')
    expect(determineProductStatus(39)).toBe('error_incomplete')
  })
})
