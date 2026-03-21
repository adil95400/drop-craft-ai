/**
 * Product Data Normalizer
 * Converts raw scrape data into NormalizedProduct format
 */
import type { NormalizedProduct, QualityScore, ReviewDistribution, ProductReview, Platform } from './types'

export function normalizeProduct(raw: any, platform: Platform, url: string): NormalizedProduct {
  return {
    title: sanitizeText(raw.title || raw.name || ''),
    description: sanitizeText(raw.description || ''),
    shortDescription: raw.shortDescription || raw.short_description || undefined,
    price: normalizePrice(raw.price),
    originalPrice: normalizePrice(raw.original_price || raw.originalPrice || raw.compare_at_price),
    currency: normalizeCurrency(raw.currency),
    images: normalizeImages(raw.images),
    videos: Array.isArray(raw.videos) ? raw.videos.filter(Boolean) : [],
    category: raw.category || raw.product_type || undefined,
    subCategory: raw.subcategory || raw.subCategory || undefined,
    breadcrumbs: Array.isArray(raw.breadcrumbs) ? raw.breadcrumbs : [],
    variants: normalizeVariants(raw.variants),
    rating: normalizeRating(raw.rating || raw.reviews?.rating),
    reviewsCount: parseInt(raw.reviewsCount || raw.reviews?.count || raw.reviews_count || '0', 10) || 0,
    reviews: normalizeReviews(raw.extracted_reviews || raw.reviews_list || []),
    reviewDistribution: raw.review_distribution || undefined,
    keywords: Array.isArray(raw.keywords || raw.tags) ? (raw.keywords || raw.tags) : [],
    supplier: raw.supplier || raw.vendor || raw.brand || undefined,
    brand: raw.brand || raw.vendor || undefined,
    sku: raw.sku || undefined,
    stock: typeof raw.stock_quantity === 'number' ? raw.stock_quantity : undefined,
    available: raw.available ?? (raw.stock_quantity > 0),
    specifications: raw.specifications || {},
    seo: raw.seo || undefined,
    shipping: raw.shipping || undefined,
    seller: raw.seller || undefined,
    url,
    platform,
    platformProductId: raw.platformProductId || raw.product_id || undefined,
    qualityScore: raw.quality_score || calculateQualityScore(raw, platform),
    extractedAt: new Date().toISOString(),
  }
}

function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function normalizePrice(val: any): number | undefined {
  if (typeof val === 'number' && val > 0) return Math.round(val * 100) / 100
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(n) || n <= 0 ? undefined : Math.round(n * 100) / 100
  }
  return undefined
}

function normalizeCurrency(val: any): string {
  if (!val) return 'EUR'
  const map: Record<string, string> = { '€': 'EUR', '$': 'USD', '£': 'GBP', '¥': 'JPY', '₹': 'INR' }
  return map[val] || String(val).toUpperCase().slice(0, 3) || 'EUR'
}

function normalizeImages(imgs: any): string[] {
  if (!Array.isArray(imgs)) return []
  return imgs
    .map((i: any) => (typeof i === 'string' ? i : i?.src || i?.url || ''))
    .filter((u: string) => u.startsWith('http'))
    .slice(0, 30)
}

function normalizeVariants(variants: any): any[] {
  if (!Array.isArray(variants)) return []
  return variants.map((v: any) => ({
    sku: v.sku || '',
    name: v.name || v.title || 'Variante',
    price: normalizePrice(v.price) || 0,
    compareAtPrice: normalizePrice(v.compare_at_price || v.compareAtPrice),
    stock: typeof v.stock === 'number' ? v.stock : (typeof v.inventory_quantity === 'number' ? v.inventory_quantity : undefined),
    available: v.available ?? true,
    image: v.image || v.featured_image?.src || undefined,
    attributes: v.attributes || v.options || {},
  }))
}

function normalizeRating(val: any): number | undefined {
  if (typeof val === 'number') return Math.min(5, Math.max(0, Math.round(val * 10) / 10))
  if (typeof val === 'string') {
    const n = parseFloat(val)
    return isNaN(n) ? undefined : Math.min(5, Math.max(0, Math.round(n * 10) / 10))
  }
  return undefined
}

function normalizeReviews(reviews: any[]): ProductReview[] {
  if (!Array.isArray(reviews)) return []
  return reviews.map((r) => ({
    author: r.author || r.reviewer || undefined,
    rating: normalizeRating(r.rating),
    title: r.title || undefined,
    content: sanitizeText(r.content || r.text || r.body || ''),
    date: r.date || r.created_at || undefined,
    verified: r.verified ?? r.verified_purchase ?? undefined,
    images: Array.isArray(r.images) ? r.images : [],
    videos: Array.isArray(r.videos) ? r.videos : [],
    variant: r.variant || undefined,
    helpfulCount: typeof r.helpfulCount === 'number' ? r.helpfulCount : (typeof r.helpful === 'number' ? r.helpful : undefined),
  })).filter((r) => r.content.length > 0)
}

export function calculateQualityScore(product: any, _platform: Platform): QualityScore {
  const b: QualityScore['breakdown'] = {
    title: { score: 0, max: 15, label: 'Titre' },
    description: { score: 0, max: 15, label: 'Description' },
    images: { score: 0, max: 20, label: 'Images' },
    price: { score: 0, max: 10, label: 'Prix' },
    variants: { score: 0, max: 10, label: 'Variantes' },
    reviews: { score: 0, max: 10, label: 'Avis' },
    specs: { score: 0, max: 5, label: 'Caractéristiques' },
    category: { score: 0, max: 5, label: 'Catégorie' },
    brand: { score: 0, max: 5, label: 'Marque' },
    seo: { score: 0, max: 5, label: 'SEO' },
  }

  const tLen = (product.title || '').length
  if (tLen > 10) b.title.score = 10
  if (tLen > 30) b.title.score = 15

  const dLen = (product.description || '').length
  if (dLen > 20) b.description.score = 8
  if (dLen > 100) b.description.score = 15

  const imgCount = (product.images || []).length
  if (imgCount >= 1) b.images.score = 5
  if (imgCount >= 3) b.images.score = 10
  if (imgCount >= 5) b.images.score = 15
  if (imgCount >= 8) b.images.score = 20

  if ((product.price || 0) > 0) b.price.score = 10

  const vCount = (product.variants || []).length
  if (vCount >= 1) b.variants.score = 5
  if (vCount >= 3) b.variants.score = 10

  const rCount = (product.extracted_reviews || product.reviews_list || []).length
  if (rCount >= 1) b.reviews.score = 3
  if (rCount >= 5) b.reviews.score = 6
  if (rCount >= 10) b.reviews.score = 10

  const specCount = Object.keys(product.specifications || {}).length
  if (specCount >= 1) b.specs.score = 2
  if (specCount >= 3) b.specs.score = 5

  if (product.category) b.category.score = 3
  if (product.subcategory || product.subCategory) b.category.score = 5

  if (product.brand || product.vendor) b.brand.score = 5

  if (product.seo?.metaTitle) b.seo.score += 2
  if (product.seo?.metaDescription) b.seo.score += 3

  const total = Object.values(b).reduce((s, v) => s + v.score, 0)
  const max = Object.values(b).reduce((s, v) => s + v.max, 0)
  return { score: Math.round((total / max) * 100), breakdown: b }
}

export function calculateReviewDistribution(reviews: ProductReview[]): ReviewDistribution {
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (!reviews.length) return { distribution: dist, averageRating: 0, totalReviews: 0 }

  let total = 0
  const sentiments = { positive: 0, neutral: 0, negative: 0 }

  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating || 3)))
    dist[rating]++
    total += rating
    if (r.sentiment) sentiments[r.sentiment]++
    else if (rating >= 4) sentiments.positive++
    else if (rating === 3) sentiments.neutral++
    else sentiments.negative++
  }

  return {
    distribution: dist,
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
    sentimentBreakdown: sentiments,
  }
}

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase()
  const positiveWords = ['excellent', 'great', 'love', 'perfect', 'amazing', 'good', 'best', 'fantastic', 'super', 'génial', 'parfait', 'top', 'magnifique', 'adore']
  const negativeWords = ['terrible', 'awful', 'bad', 'worst', 'broken', 'defective', 'poor', 'waste', 'horrible', 'nul', 'mauvais', 'cassé', 'décevant']

  const posCount = positiveWords.filter((w) => lower.includes(w)).length
  const negCount = negativeWords.filter((w) => lower.includes(w)).length

  if (posCount > negCount) return 'positive'
  if (negCount > posCount) return 'negative'
  return 'neutral'
}

export function extractTopKeywords(reviews: ProductReview[]): Array<{ word: string; count: number; sentiment: string }> {
  const freq: Record<string, { count: number; sentiments: Record<string, number> }> = {}
  const stopWords = new Set(['the', 'and', 'is', 'it', 'to', 'of', 'a', 'in', 'for', 'with', 'on', 'this', 'that', 'was', 'but', 'are', 'not', 'have', 'has', 'very', 'le', 'la', 'les', 'de', 'du', 'un', 'une', 'et', 'est', 'en', 'ce', 'que', 'qui', 'ne', 'pas', 'très', 'bien', 'plus'])

  for (const r of reviews) {
    const words = (r.content || '').toLowerCase().replace(/[^a-zàâäéèêëïîôùûüç\s]/g, '').split(/\s+/).filter((w) => w.length > 3 && !stopWords.has(w))
    const sentiment = r.sentiment || analyzeSentiment(r.content)
    const seen = new Set<string>()
    for (const w of words) {
      if (seen.has(w)) continue
      seen.add(w)
      if (!freq[w]) freq[w] = { count: 0, sentiments: {} }
      freq[w].count++
      freq[w].sentiments[sentiment] = (freq[w].sentiments[sentiment] || 0) + 1
    }
  }

  return Object.entries(freq)
    .filter(([, v]) => v.count >= 2)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 20)
    .map(([word, v]) => ({
      word,
      count: v.count,
      sentiment: Object.entries(v.sentiments).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral',
    }))
}
