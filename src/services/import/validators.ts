/**
 * Validateurs pour le système d'import
 * Validation stricte des données produit
 */

import DOMPurify from 'dompurify'
import { NormalizedProduct, ProductVariant } from './types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sanitized?: NormalizedProduct
}

/**
 * Champs requis pour un produit valide
 */
const REQUIRED_FIELDS = ['title', 'price', 'images'] as const

/**
 * Valide un produit normalisé
 */
export function validateProduct(product: NormalizedProduct): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Validation des champs requis
  if (!product.title || product.title.trim().length < 3) {
    errors.push('Titre requis (minimum 3 caractères)')
  }

  if (typeof product.price !== 'number' || product.price <= 0) {
    errors.push('Prix requis (doit être supérieur à 0)')
  }

  if (!product.images || product.images.length === 0) {
    errors.push('Au moins une image requise')
  }

  // 2. Validation de la description
  if (!product.description || product.description.length < 20) {
    warnings.push('Description courte ou manquante (recommandé: 50+ caractères)')
  }

  // 3. Validation des URLs d'images
  if (product.images) {
    const invalidImages = product.images.filter(url => !isValidUrl(url))
    if (invalidImages.length > 0) {
      errors.push(`${invalidImages.length} URL(s) d'image invalide(s)`)
    }
  }

  // 4. Validation du prix de revient
  if (product.costPrice !== undefined && product.costPrice >= product.price) {
    warnings.push('Prix de revient supérieur ou égal au prix de vente')
  }

  // 5. Validation des variantes
  if (product.variants && product.variants.length > 0) {
    const variantErrors = validateVariants(product.variants)
    errors.push(...variantErrors.errors)
    warnings.push(...variantErrors.warnings)
  }

  // 6. Validation du SKU
  if (product.sku && !isValidSku(product.sku)) {
    warnings.push('SKU contient des caractères non recommandés')
  }

  // 7. Validation du score de complétude
  if (product.completenessScore < 50) {
    warnings.push(`Score de complétude faible: ${product.completenessScore}%`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: errors.length === 0 ? sanitizeProduct(product) : undefined
  }
}

/**
 * Valide les variantes d'un produit
 */
function validateVariants(variants: ProductVariant[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const skus = new Set<string>()

  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]

    if (!variant.title) {
      errors.push(`Variante ${i + 1}: titre manquant`)
    }

    if (typeof variant.price !== 'number' || variant.price <= 0) {
      errors.push(`Variante ${i + 1}: prix invalide`)
    }

    if (variant.sku) {
      if (skus.has(variant.sku)) {
        errors.push(`Variante ${i + 1}: SKU dupliqué "${variant.sku}"`)
      }
      skus.add(variant.sku)
    }

    if (!variant.options || Object.keys(variant.options).length === 0) {
      warnings.push(`Variante ${i + 1}: options manquantes`)
    }
  }

  return { errors, warnings }
}

/**
 * Nettoie et sanitize un produit
 */
export function sanitizeProduct(product: NormalizedProduct): NormalizedProduct {
  return {
    ...product,
    title: sanitizeText(product.title, 200),
    description: sanitizeHtml(product.description),
    seoTitle: product.seoTitle ? sanitizeText(product.seoTitle, 60) : undefined,
    seoDescription: product.seoDescription ? sanitizeText(product.seoDescription, 160) : undefined,
    images: product.images.filter(url => isValidUrl(url)),
    videos: product.videos?.filter(url => isValidUrl(url)),
    tags: product.tags?.map(t => sanitizeText(t, 50)),
    attributes: product.attributes 
      ? Object.fromEntries(
          Object.entries(product.attributes)
            .map(([k, v]) => [sanitizeText(k, 50), sanitizeText(v, 200)])
        )
      : undefined,
    variants: product.variants?.map(v => ({
      ...v,
      title: sanitizeText(v.title, 100),
      sku: v.sku ? sanitizeSku(v.sku) : undefined
    }))
  }
}

/**
 * Sanitize du texte brut
 */
function sanitizeText(text: string, maxLength?: number): string {
  let cleaned = text
    .replace(/<[^>]*>/g, '') // Supprimer HTML
    .replace(/[\x00-\x1F\x7F]/g, '') // Supprimer caractères de contrôle
    .trim()

  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength - 3) + '...'
  }

  return cleaned
}

/**
 * Sanitize du HTML
 */
function sanitizeHtml(html: string): string {
  if (!html) return ''
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: []
  })
}

/**
 * Vérifie si une URL est valide
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Vérifie si un SKU est valide
 */
function isValidSku(sku: string): boolean {
  // SKU alphanumérique avec tirets et underscores
  return /^[a-zA-Z0-9\-_]+$/.test(sku)
}

/**
 * Sanitize un SKU
 */
function sanitizeSku(sku: string): string {
  return sku
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64)
}

/**
 * Calcule le score de complétude d'un produit
 */
export function calculateCompletenessScore(product: Partial<NormalizedProduct>): number {
  let score = 0
  const weights = {
    title: 15,
    description: 15,
    price: 10,
    images: 15,
    category: 8,
    sku: 5,
    brand: 5,
    variants: 10,
    seoTitle: 5,
    seoDescription: 5,
    weight: 3,
    attributes: 4
  }

  // Titre (15 points)
  if (product.title && product.title.length >= 10) score += weights.title
  else if (product.title && product.title.length >= 3) score += weights.title * 0.5

  // Description (15 points)
  if (product.description && product.description.length >= 100) score += weights.description
  else if (product.description && product.description.length >= 50) score += weights.description * 0.7
  else if (product.description && product.description.length >= 20) score += weights.description * 0.4

  // Prix (10 points)
  if (typeof product.price === 'number' && product.price > 0) score += weights.price

  // Images (15 points)
  if (product.images && product.images.length >= 3) score += weights.images
  else if (product.images && product.images.length >= 1) score += weights.images * 0.6

  // Catégorie (8 points)
  if (product.category && product.category !== 'uncategorized') score += weights.category

  // SKU (5 points)
  if (product.sku) score += weights.sku

  // Marque (5 points)
  if (product.brand) score += weights.brand

  // Variantes (10 points)
  if (product.variants && product.variants.length > 0) score += weights.variants

  // SEO Title (5 points)
  if (product.seoTitle && product.seoTitle.length >= 10) score += weights.seoTitle

  // SEO Description (5 points)
  if (product.seoDescription && product.seoDescription.length >= 50) score += weights.seoDescription

  // Poids (3 points)
  if (product.weight && product.weight > 0) score += weights.weight

  // Attributs (4 points)
  if (product.attributes && Object.keys(product.attributes).length >= 2) score += weights.attributes

  return Math.min(100, Math.round(score))
}

/**
 * Détermine le statut d'un produit basé sur son score
 */
export function determineProductStatus(
  score: number
): 'draft' | 'ready' | 'error_incomplete' {
  if (score >= 70) return 'ready'
  if (score >= 40) return 'draft'
  return 'error_incomplete'
}
