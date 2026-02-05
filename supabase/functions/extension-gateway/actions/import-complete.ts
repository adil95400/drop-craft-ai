/**
 * Complete Product Import Handler v1.0
 * 
 * Enhanced import pipeline with:
 * - Full field extraction (title, description, price, variants, images, videos, reviews)
 * - Automatic SEO optimization via AI
 * - Quality scoring and validation
 * - Multi-source extraction cascade
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { HeadlessScraper, createHeadlessScraper, ExtractedProduct } from '../lib/headless-scraper.ts'
import { NormalizationEngine, ProductNormalized } from '../lib/normalization-engine.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const CompleteImportPayload = z.object({
  source_url: z.string().url().max(2000),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'other']).optional(),
  shop_id: z.string().uuid().optional(),
  options: z.object({
    include_reviews: z.boolean().default(true),
    include_videos: z.boolean().default(true),
    include_variants: z.boolean().default(true),
    include_shipping: z.boolean().default(true),
    auto_seo: z.boolean().default(true),
    auto_translate: z.boolean().default(false),
    target_language: z.string().length(2).default('fr'),
    preferred_currency: z.string().length(3).default('EUR'),
    max_reviews: z.number().int().min(0).max(100).default(20),
    max_images: z.number().int().min(1).max(30).default(10),
  }).default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
})

type CompleteImportOptions = z.infer<typeof CompleteImportPayload>['options']

// =============================================================================
// TYPES
// =============================================================================

interface ImportStats {
  extractionTimeMs: number
  normalizationTimeMs: number
  seoTimeMs: number
  totalTimeMs: number
  fieldsExtracted: number
  fieldsEnriched: number
  qualityScore: number
  warnings: string[]
}

interface CompleteProductData {
  // Core fields
  title: string
  description: string
  shortDescription: string
  price: number
  originalPrice: number | null
  currency: string
  
  // Media
  images: string[]
  videoUrls: string[]
  mainImage: string
  
  // Variants
  variants: ProductVariant[]
  hasVariants: boolean
  variantOptions: VariantOption[]
  
  // Reviews
  reviews: ProductReview[]
  reviewStats: ReviewStats
  
  // SEO (auto-generated)
  seo: SEOData
  
  // Metadata
  sku: string | null
  brand: string | null
  category: string
  tags: string[]
  attributes: Record<string, string[]>
  
  // Stock & Shipping
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  stockQuantity: number | null
  shippingInfo: ShippingInfo | null
  
  // Source tracking
  sourceUrl: string
  platform: string
  externalId: string | null
  seller: string | null
  
  // Quality
  completenessScore: number
  status: 'ready' | 'draft' | 'error_incomplete'
  fieldSources: Record<string, { source: string; confidence: number }>
}

interface ProductVariant {
  id: string
  title: string
  sku: string | null
  price: number
  compareAtPrice: number | null
  imageUrl: string | null
  available: boolean
  options: Record<string, string>
  stockQuantity: number | null
}

interface VariantOption {
  name: string
  values: string[]
  type: 'size' | 'color' | 'material' | 'style' | 'other'
}

interface ProductReview {
  id: string
  author: string
  rating: number
  title: string
  content: string
  date: string
  verified: boolean
  helpful: number
  images: string[]
  country: string | null
}

interface ReviewStats {
  averageRating: number
  totalCount: number
  distribution: Record<number, number>
  verifiedCount: number
  withImagesCount: number
}

interface SEOData {
  title: string
  metaDescription: string
  focusKeyword: string
  secondaryKeywords: string[]
  ogTitle: string
  ogDescription: string
  bulletPoints: string[]
}

interface ShippingInfo {
  free: boolean
  cost: number | null
  estimatedDays: string | null
  origin: string | null
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function handleCompleteImport(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const startTime = Date.now()
  
  // Validate payload
  const parsed = CompleteImportPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid import payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { source_url, options } = parsed.data
  const platform = parsed.data.platform || detectPlatform(source_url)
  const stats: ImportStats = {
    extractionTimeMs: 0,
    normalizationTimeMs: 0,
    seoTimeMs: 0,
    totalTimeMs: 0,
    fieldsExtracted: 0,
    fieldsEnriched: 0,
    qualityScore: 0,
    warnings: []
  }

  try {
    // Step 1: Create import job
    const { data: job, error: jobError } = await ctx.supabase
      .from('product_import_jobs')
      .insert({
        user_id: ctx.userId,
        source_url,
        platform,
        status: 'scraping',
        progress_percent: 5,
        options: options,
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('[CompleteImport] Job creation failed:', jobError)
      return {
        success: false,
        error: { code: 'JOB_CREATE_FAILED', message: 'Failed to create import job' }
      }
    }

    // Step 2: Extract all data
    const extractionStart = Date.now()
    await updateJobProgress(ctx, job.id, 10, 'Extraction en cours...')
    
    const extractedData = await extractCompleteProduct(source_url, platform, options, ctx)
    stats.extractionTimeMs = Date.now() - extractionStart
    stats.fieldsExtracted = countExtractedFields(extractedData)

    if (!extractedData.success) {
      await updateJobError(ctx, job.id, 'SCRAPE_FAILED', extractedData.error || 'Extraction failed')
      return {
        success: false,
        error: { code: 'SCRAPE_FAILED', message: extractedData.error || 'Product extraction failed' }
      }
    }

    await updateJobProgress(ctx, job.id, 40, 'Normalisation des données...')

    // Step 3: Normalize data
    const normalizationStart = Date.now()
    const normalizedProduct = normalizeCompleteProduct(extractedData.data!, platform, source_url)
    stats.normalizationTimeMs = Date.now() - normalizationStart

    await updateJobProgress(ctx, job.id, 60, 'Optimisation SEO...')

    // Step 4: Auto SEO (if enabled)
    let seoData: SEOData | null = null
    if (options.auto_seo) {
      const seoStart = Date.now()
      seoData = await generateAutoSEO(normalizedProduct, options.target_language, ctx)
      stats.seoTimeMs = Date.now() - seoStart
      stats.fieldsEnriched += seoData ? 7 : 0
    }

    await updateJobProgress(ctx, job.id, 80, 'Sauvegarde du produit...')

    // Step 5: Calculate quality score
    stats.qualityScore = calculateQualityScore(normalizedProduct, seoData)

    // Step 6: Build final product
    const finalProduct: CompleteProductData = {
      ...normalizedProduct,
      seo: seoData || getDefaultSEO(normalizedProduct),
      completenessScore: stats.qualityScore,
      status: stats.qualityScore >= 70 ? 'ready' : (stats.qualityScore >= 40 ? 'draft' : 'error_incomplete'),
    }

    // Step 7: Store product
    const { data: storedProduct, error: storeError } = await storeProduct(ctx, finalProduct, job.id)
    
    if (storeError) {
      await updateJobError(ctx, job.id, 'STORE_FAILED', storeError)
      return {
        success: false,
        error: { code: 'STORE_FAILED', message: storeError }
      }
    }

    // Step 8: Complete job
    stats.totalTimeMs = Date.now() - startTime
    await ctx.supabase
      .from('product_import_jobs')
      .update({
        status: 'completed',
        progress_percent: 100,
        product_id: storedProduct.id,
        extraction_stats: stats,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return {
      success: true,
      data: {
        job_id: job.id,
        product_id: storedProduct.id,
        product: finalProduct,
        stats,
        message: `Produit importé avec succès (score: ${stats.qualityScore}%)`
      }
    }

  } catch (error) {
    console.error('[CompleteImport] Unexpected error:', error)
    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// =============================================================================
// EXTRACTION
// =============================================================================

async function extractCompleteProduct(
  url: string,
  platform: string,
  options: CompleteImportOptions,
  ctx: GatewayContext
): Promise<{ success: boolean; data?: ExtractedProduct; error?: string }> {
  const scraper = createHeadlessScraper(ctx)
  
  // Render page
  const renderResult = await scraper.render(url, {
    scrollToBottom: true,
    waitMs: getPlatformWaitTime(platform),
    extractFormats: ['html', 'markdown', 'links']
  })

  if (!renderResult.success) {
    return { success: false, error: renderResult.error }
  }

  // Extract all fields
  const extracted = await scraper.extractAll()
  
  // Validate critical fields
  if (!extracted.title.value || extracted.price.value === null) {
    return { 
      success: false, 
      error: 'Missing critical fields (title or price)' 
    }
  }

  return { success: true, data: extracted }
}

function getPlatformWaitTime(platform: string): number {
  const waitTimes: Record<string, number> = {
    amazon: 3000,
    aliexpress: 5000,
    temu: 5000,
    shein: 4000,
    ebay: 2500,
    wish: 3000,
    alibaba: 4000,
    other: 3000
  }
  return waitTimes[platform] || 3000
}

// =============================================================================
// NORMALIZATION
// =============================================================================

function normalizeCompleteProduct(
  extracted: ExtractedProduct,
  platform: string,
  sourceUrl: string
): Omit<CompleteProductData, 'seo' | 'completenessScore' | 'status'> {
  const images = extracted.images.value || []
  const variants = (extracted.variants.value || []).map((v, i) => ({
    id: v.id || `variant-${i}`,
    title: v.name,
    sku: v.sku || null,
    price: v.price || extracted.price.value || 0,
    compareAtPrice: null,
    imageUrl: v.image || null,
    available: v.available ?? true,
    options: v.options,
    stockQuantity: null
  }))

  // Extract variant options
  const variantOptions = extractVariantOptions(variants)

  // Build review stats
  const reviewData = extracted.reviews.value
  const reviewStats: ReviewStats = {
    averageRating: reviewData?.averageRating || extracted.rating.value || 0,
    totalCount: reviewData?.totalCount || extracted.reviewCount.value || 0,
    distribution: reviewData?.distribution || {},
    verifiedCount: 0,
    withImagesCount: 0
  }

  // Map reviews
  const reviews: ProductReview[] = (reviewData?.reviews || []).slice(0, 20).map((r, i) => ({
    id: `review-${i}`,
    author: r.author || 'Anonymous',
    rating: r.rating,
    title: '',
    content: r.text,
    date: r.date || new Date().toISOString(),
    verified: r.verified || false,
    helpful: 0,
    images: [],
    country: null
  }))

  return {
    title: extracted.title.value || 'Untitled Product',
    description: cleanDescription(extracted.description.value || ''),
    shortDescription: generateShortDescription(extracted.description.value || ''),
    price: extracted.price.value || 0,
    originalPrice: extracted.originalPrice.value,
    currency: extracted.currency.value || 'EUR',
    
    images: images.slice(0, 10),
    videoUrls: (extracted.videoUrls.value || []).slice(0, 5),
    mainImage: images[0] || '',
    
    variants,
    hasVariants: variants.length > 0,
    variantOptions,
    
    reviews,
    reviewStats,
    
    sku: extracted.sku.value,
    brand: extracted.brand.value,
    category: extracted.category.value || 'Uncategorized',
    tags: generateBasicTags(extracted),
    attributes: {},
    
    availability: mapAvailability(extracted.availability.value),
    stockQuantity: null,
    shippingInfo: null,
    
    sourceUrl,
    platform,
    externalId: extracted.sku.value,
    seller: extracted.seller.value,
    
    fieldSources: buildFieldSources(extracted)
  }
}

function extractVariantOptions(variants: ProductVariant[]): VariantOption[] {
  const optionMap = new Map<string, Set<string>>()
  
  for (const variant of variants) {
    for (const [name, value] of Object.entries(variant.options)) {
      if (!optionMap.has(name)) {
        optionMap.set(name, new Set())
      }
      optionMap.get(name)!.add(value)
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({
    name: normalizeOptionName(name),
    values: Array.from(values),
    type: detectOptionType(name)
  }))
}

function normalizeOptionName(name: string): string {
  const nameMap: Record<string, string> = {
    'size': 'Taille',
    'color': 'Couleur',
    'colour': 'Couleur',
    'material': 'Matériau',
    'style': 'Style',
    'quantity': 'Quantité',
    'pack': 'Pack'
  }
  return nameMap[name.toLowerCase()] || name
}

function detectOptionType(name: string): 'size' | 'color' | 'material' | 'style' | 'other' {
  const lower = name.toLowerCase()
  if (['size', 'taille', 'dimension'].some(k => lower.includes(k))) return 'size'
  if (['color', 'colour', 'couleur'].some(k => lower.includes(k))) return 'color'
  if (['material', 'matériau', 'fabric'].some(k => lower.includes(k))) return 'material'
  if (['style', 'type', 'design'].some(k => lower.includes(k))) return 'style'
  return 'other'
}

function mapAvailability(value: string | null): 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' {
  if (!value) return 'unknown'
  const lower = value.toLowerCase()
  if (lower.includes('in_stock') || lower.includes('instock')) return 'in_stock'
  if (lower.includes('low') || lower.includes('limited')) return 'low_stock'
  if (lower.includes('out') || lower.includes('unavailable')) return 'out_of_stock'
  return 'unknown'
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000)
}

function generateShortDescription(desc: string): string {
  const cleaned = cleanDescription(desc)
  if (cleaned.length <= 200) return cleaned
  return cleaned.substring(0, 197).replace(/\s+\S*$/, '') + '...'
}

function generateBasicTags(extracted: ExtractedProduct): string[] {
  const tags: string[] = []
  
  if (extracted.brand.value) tags.push(extracted.brand.value)
  if (extracted.category.value) tags.push(extracted.category.value)
  
  // Extract keywords from title
  const title = extracted.title.value || ''
  const words = title.split(/\s+/).filter(w => w.length > 3)
  tags.push(...words.slice(0, 5))
  
  return [...new Set(tags)].slice(0, 10)
}

function buildFieldSources(extracted: ExtractedProduct): Record<string, { source: string; confidence: number }> {
  const sources: Record<string, { source: string; confidence: number }> = {}
  
  for (const [key, field] of Object.entries(extracted)) {
    if (field && typeof field === 'object' && 'source' in field && 'confidence' in field) {
      sources[key] = { source: field.source, confidence: field.confidence }
    }
  }
  
  return sources
}

function countExtractedFields(result: { success: boolean; data?: ExtractedProduct }): number {
  if (!result.success || !result.data) return 0
  
  let count = 0
  const data = result.data
  
  if (data.title.value) count++
  if (data.price.value !== null) count++
  if (data.description.value) count++
  if (data.images.value?.length) count++
  if (data.variants.value?.length) count++
  if (data.videoUrls.value?.length) count++
  if (data.reviews.value) count++
  if (data.brand.value) count++
  if (data.sku.value) count++
  if (data.category.value) count++
  
  return count
}

// =============================================================================
// AUTO SEO
// =============================================================================

async function generateAutoSEO(
  product: Omit<CompleteProductData, 'seo' | 'completenessScore' | 'status'>,
  language: string,
  ctx: GatewayContext
): Promise<SEOData | null> {
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) {
      console.warn('[AutoSEO] LOVABLE_API_KEY not configured')
      return null
    }

    const prompt = `
Génère des métadonnées SEO optimisées pour ce produit e-commerce.

Produit: "${product.title}"
Description: "${product.shortDescription}"
Catégorie: "${product.category}"
Marque: "${product.brand || 'N/A'}"

Retourne un JSON avec:
{
  "title": "Titre SEO (<60 chars)",
  "metaDescription": "Meta description (<160 chars)",
  "focusKeyword": "Mot-clé principal",
  "secondaryKeywords": ["5 mots-clés secondaires"],
  "ogTitle": "Titre Open Graph",
  "ogDescription": "Description Open Graph",
  "bulletPoints": ["5 points clés du produit"]
}

Langue: ${language}
Retourne UNIQUEMENT le JSON, pas de texte avant ou après.
`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('[AutoSEO] AI request failed:', response.status)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      title: parsed.title || product.title.substring(0, 60),
      metaDescription: parsed.metaDescription || product.shortDescription.substring(0, 160),
      focusKeyword: parsed.focusKeyword || '',
      secondaryKeywords: parsed.secondaryKeywords || [],
      ogTitle: parsed.ogTitle || product.title,
      ogDescription: parsed.ogDescription || product.shortDescription,
      bulletPoints: parsed.bulletPoints || []
    }

  } catch (error) {
    console.error('[AutoSEO] Error:', error)
    return null
  }
}

function getDefaultSEO(product: Omit<CompleteProductData, 'seo' | 'completenessScore' | 'status'>): SEOData {
  return {
    title: product.title.substring(0, 60),
    metaDescription: product.shortDescription.substring(0, 160),
    focusKeyword: product.title.split(' ').slice(0, 3).join(' '),
    secondaryKeywords: product.tags.slice(0, 5),
    ogTitle: product.title,
    ogDescription: product.shortDescription,
    bulletPoints: []
  }
}

// =============================================================================
// QUALITY SCORING
// =============================================================================

function calculateQualityScore(
  product: Omit<CompleteProductData, 'seo' | 'completenessScore' | 'status'>,
  seo: SEOData | null
): number {
  let score = 0
  const weights = {
    title: 15,
    description: 15,
    price: 10,
    images: 15,
    variants: 10,
    reviews: 10,
    seo: 10,
    brand: 5,
    category: 5,
    videos: 5
  }

  // Title (0-15)
  if (product.title && product.title.length > 10) score += weights.title
  else if (product.title) score += weights.title * 0.5

  // Description (0-15)
  if (product.description.length > 200) score += weights.description
  else if (product.description.length > 50) score += weights.description * 0.7
  else if (product.description) score += weights.description * 0.3

  // Price (0-10)
  if (product.price > 0) score += weights.price

  // Images (0-15)
  if (product.images.length >= 5) score += weights.images
  else if (product.images.length >= 3) score += weights.images * 0.7
  else if (product.images.length >= 1) score += weights.images * 0.4

  // Variants (0-10)
  if (product.hasVariants) score += weights.variants

  // Reviews (0-10)
  if (product.reviewStats.totalCount >= 10) score += weights.reviews
  else if (product.reviewStats.totalCount > 0) score += weights.reviews * 0.5

  // SEO (0-10)
  if (seo && seo.focusKeyword) score += weights.seo
  else score += weights.seo * 0.3 // Default SEO

  // Brand (0-5)
  if (product.brand) score += weights.brand

  // Category (0-5)
  if (product.category && product.category !== 'Uncategorized') score += weights.category

  // Videos (0-5)
  if (product.videoUrls.length > 0) score += weights.videos

  return Math.round(score)
}

// =============================================================================
// STORAGE
// =============================================================================

async function storeProduct(
  ctx: GatewayContext,
  product: CompleteProductData,
  jobId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const { data, error } = await ctx.supabase
      .from('products')
      .insert({
        user_id: ctx.userId,
        title: product.title,
        description: product.description,
        price: product.price,
        compare_at_price: product.originalPrice,
        currency: product.currency,
        images: product.images,
        main_image: product.mainImage,
        video_url: product.videoUrls[0] || null,
        sku: product.sku,
        brand: product.brand,
        category: product.category,
        tags: product.tags,
        rating: product.reviewStats.averageRating,
        reviews_count: product.reviewStats.totalCount,
        stock_status: product.availability,
        source_url: product.sourceUrl,
        source_platform: product.platform,
        external_id: product.externalId,
        seller_name: product.seller,
        variants: product.variants,
        seo_title: product.seo.title,
        seo_description: product.seo.metaDescription,
        seo_keywords: product.seo.secondaryKeywords,
        completeness_score: product.completenessScore,
        status: product.status,
        import_job_id: jobId,
        field_sources: product.fieldSources,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[StoreProduct] Error:', error)
      return { data: null, error: error.message }
    }

    // Store reviews separately if any
    if (product.reviews.length > 0) {
      await ctx.supabase.from('product_reviews').insert(
        product.reviews.map(r => ({
          user_id: ctx.userId,
          product_id: data.id,
          author: r.author,
          rating: r.rating,
          text: r.content,
          review_date: r.date,
          verified_purchase: r.verified,
          source_platform: product.platform,
        }))
      ).catch(err => console.error('[StoreReviews] Error:', err))
    }

    return { data, error: null }

  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function detectPlatform(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()
  
  if (hostname.includes('amazon')) return 'amazon'
  if (hostname.includes('aliexpress')) return 'aliexpress'
  if (hostname.includes('temu')) return 'temu'
  if (hostname.includes('shein')) return 'shein'
  if (hostname.includes('ebay')) return 'ebay'
  if (hostname.includes('wish')) return 'wish'
  if (hostname.includes('alibaba') || hostname.includes('1688')) return 'alibaba'
  
  return 'other'
}

async function updateJobProgress(
  ctx: GatewayContext,
  jobId: string,
  percent: number,
  message: string
): Promise<void> {
  await ctx.supabase
    .from('product_import_jobs')
    .update({ 
      progress_percent: percent,
      progress_message: message 
    })
    .eq('id', jobId)
}

async function updateJobError(
  ctx: GatewayContext,
  jobId: string,
  code: string,
  message: string
): Promise<void> {
  await ctx.supabase
    .from('product_import_jobs')
    .update({
      status: 'error',
      error_code: code,
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

// Export for use in gateway router
export { CompleteImportPayload }
