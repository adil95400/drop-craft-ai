/**
 * Import Orchestrator v3.1
 * 
 * Pipeline exact:
 * 1) Detect platform depuis URL
 * 2) Tenter API provider (AliExpress, Amazon, etc.)
 * 3) Tenter Headless Firecrawl (render + scroll + click variants + wait)
 * 4) Fallback: fetch HTML + parse (JSON-LD, regex)
 * 5) Merge + Normalise avec attribution de source
 * 6) Enregistrer produit en DB avec status "draft" puis "ready" ou "error_incomplete"
 *
 * Chaque champ a: { value, source, confidence }
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { 
  HeadlessScraper, 
  createHeadlessScraper, 
  ExtractedProduct as ScraperProduct,
  ExtractedField 
} from '../lib/headless-scraper.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const ImportProductPayload = z.object({
  source_url: z.string().url().max(2000),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'banggood', 'dhgate', 'other']).optional(),
  shop_id: z.string().uuid().optional(),
  options: z.object({
    include_reviews: z.boolean().optional().default(false),
    include_video: z.boolean().optional().default(false),
    include_variants: z.boolean().optional().default(true),
    include_shipping: z.boolean().optional().default(true),
    preferred_currency: z.string().length(3).optional().default('EUR'),
    target_language: z.string().length(2).optional().default('fr'),
    auto_translate: z.boolean().optional().default(false),
  }).optional().default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
  timestamp: z.number().int().positive(),
})

type ImportOptions = z.infer<typeof ImportProductPayload>['options']

// =============================================================================
// TYPES - Field with Source Attribution
// =============================================================================

type ExtractionSource = 'api' | 'headless' | 'html' | 'fallback'

interface FieldValue<T> {
  value: T
  source: ExtractionSource
  confidence: number // 0-100
}

interface ExtractedFields {
  title?: FieldValue<string>
  description?: FieldValue<string>
  price?: FieldValue<number>
  original_price?: FieldValue<number>
  currency?: FieldValue<string>
  images?: FieldValue<string[]>
  video_url?: FieldValue<string>
  sku?: FieldValue<string>
  stock_status?: FieldValue<'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'>
  stock_quantity?: FieldValue<number>
  category?: FieldValue<string>
  brand?: FieldValue<string>
  rating?: FieldValue<number>
  reviews_count?: FieldValue<number>
  seller_name?: FieldValue<string>
  variants?: FieldValue<ProductVariant[]>
  shipping_free?: FieldValue<boolean>
  shipping_cost?: FieldValue<number>
  shipping_days?: FieldValue<string>
}

interface ProductVariant {
  id: string
  title: string
  price: number
  sku?: string
  image_url?: string
  available: boolean
  options: Record<string, string>
}

interface ExtractionResult {
  success: boolean
  fields: ExtractedFields
  source: ExtractionSource
  rawData?: any
  error?: string
}

interface NormalizedProduct {
  source_url: string
  external_id: string | null
  platform: string
  title: string
  description: string | null
  price: number
  original_price: number | null
  currency: string
  images: string[]
  video_url: string | null
  sku: string | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  stock_quantity: number | null
  category: string | null
  brand: string | null
  rating: number | null
  reviews_count: number | null
  seller_name: string | null
  variants: ProductVariant[]
  shipping_free: boolean
  shipping_cost: number | null
  shipping_days: string | null
  extraction_method: 'api' | 'headless' | 'html' | 'hybrid'
  completeness_score: number
  missing_fields: string[]
  field_sources: Record<string, { source: ExtractionSource; confidence: number }>
  extracted_at: string
}

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  amazon: [/amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp|com\.au|in|com\.mx|com\.br|nl|pl|se|sg|ae|sa|eg|tr)/],
  aliexpress: [/aliexpress\.(com|ru|us)/, /a\.aliexpress\.com/, /s\.click\.aliexpress\.com/],
  temu: [/temu\.com/],
  shein: [/shein\.(com|fr|de|co\.uk|es|it)/],
  ebay: [/ebay\.(com|fr|de|co\.uk|es|it|ca|com\.au)/],
  wish: [/wish\.com/],
  alibaba: [/alibaba\.com/, /1688\.com/],
  banggood: [/banggood\.com/],
  dhgate: [/dhgate\.com/],
}

function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
      if (patterns.some(p => p.test(hostname))) {
        return platform
      }
    }
  } catch {}
  return 'other'
}

// =============================================================================
// STRATEGY 1: PLATFORM API
// =============================================================================

async function extractViaAPI(
  url: string, 
  platform: string, 
  ctx: GatewayContext
): Promise<ExtractionResult> {
  console.log(`[Orchestrator] Trying API extraction for ${platform}`)
  
  // Check for platform-specific API credentials
  const apiKeys: Record<string, string | undefined> = {
    aliexpress: Deno.env.get('ALIEXPRESS_API_KEY'),
    amazon: Deno.env.get('AMAZON_AFFILIATE_KEY'),
    ebay: Deno.env.get('EBAY_API_KEY'),
  }
  
  const apiKey = apiKeys[platform]
  
  if (!apiKey) {
    console.log(`[Orchestrator] No API key for ${platform}`)
    return { success: false, fields: {}, source: 'api', error: 'No API key configured' }
  }
  
  // TODO: Implement actual API calls when credentials available
  // For now, return failure to trigger next strategy
  return { success: false, fields: {}, source: 'api', error: 'API integration pending' }
}

// =============================================================================
// STRATEGY 2: HEADLESS (HeadlessScraper Module)
// =============================================================================

async function extractViaHeadless(
  url: string,
  platform: string,
  options: ImportOptions,
  ctx: GatewayContext
): Promise<ExtractionResult> {
  console.log(`[Orchestrator] Trying HeadlessScraper extraction for ${platform}`)
  
  const scraper = createHeadlessScraper(ctx)
  
  try {
    // Step 1: Render the page
    const renderResult = await scraper.render(url, {
      scrollToBottom: true,
      waitMs: platform === 'aliexpress' || platform === 'temu' ? 5000 : 3000,
      extractFormats: ['html', 'markdown', 'links'],
    })
    
    if (!renderResult.success) {
      console.log(`[Orchestrator] Render failed: ${renderResult.error}`)
      return { 
        success: false, 
        fields: {}, 
        source: 'headless', 
        error: renderResult.error || 'Render failed' 
      }
    }
    
    console.log(`[Orchestrator] Page rendered in ${renderResult.renderTimeMs}ms`)
    
    // Step 2: Extract all fields using HeadlessScraper
    const extracted = await scraper.extractAll()
    
    // Step 3: Convert HeadlessScraper output to orchestrator format
    const fields = convertScraperToFields(extracted, options)
    
    // Step 4: Check critical fields
    const hasCritical = fields.title?.value && fields.price?.value && fields.images?.value?.length
    
    if (!hasCritical) {
      console.log('[Orchestrator] HeadlessScraper missing critical fields')
      return { 
        success: false, 
        fields, 
        source: 'headless', 
        rawData: extracted,
        error: 'Missing critical fields (title, price, or images)' 
      }
    }
    
    // Log scraper stats
    const stats = scraper.getStats()
    console.log(`[Orchestrator] HeadlessScraper completed: ${stats.pageCount} pages, platform: ${stats.platform}`)
    
    return { 
      success: true, 
      fields, 
      source: 'headless', 
      rawData: extracted 
    }
    
  } catch (error) {
    console.error('[Orchestrator] HeadlessScraper error:', error)
    return { 
      success: false, 
      fields: {}, 
      source: 'headless', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Convert HeadlessScraper output to orchestrator ExtractedFields format
 */
function convertScraperToFields(
  scraperOutput: ScraperProduct, 
  options: ImportOptions
): ExtractedFields {
  const fields: ExtractedFields = {}
  
  // Map scraper source to orchestrator source
  const mapSource = (src: string): ExtractionSource => {
    if (src === 'json-ld' || src === 'structured') return 'html'
    if (src === 'opengraph' || src === 'meta') return 'html'
    if (src === 'dom') return 'headless'
    return 'fallback'
  }
  
  // Title
  if (scraperOutput.title.value) {
    fields.title = {
      value: scraperOutput.title.value,
      source: mapSource(scraperOutput.title.source),
      confidence: scraperOutput.title.confidence
    }
  }
  
  // Price
  if (scraperOutput.price.value !== null) {
    fields.price = {
      value: scraperOutput.price.value,
      source: mapSource(scraperOutput.price.source),
      confidence: scraperOutput.price.confidence
    }
  }
  
  // Original price
  if (scraperOutput.originalPrice.value !== null) {
    fields.original_price = {
      value: scraperOutput.originalPrice.value,
      source: mapSource(scraperOutput.originalPrice.source),
      confidence: scraperOutput.originalPrice.confidence
    }
  }
  
  // Currency
  if (scraperOutput.currency.value) {
    fields.currency = {
      value: scraperOutput.currency.value,
      source: mapSource(scraperOutput.currency.source),
      confidence: scraperOutput.currency.confidence
    }
  }
  
  // Images (high-res)
  if (scraperOutput.images.value && scraperOutput.images.value.length > 0) {
    fields.images = {
      value: scraperOutput.images.value,
      source: mapSource(scraperOutput.images.source),
      confidence: scraperOutput.images.confidence
    }
  }
  
  // Description (cleaned)
  if (scraperOutput.description.value) {
    fields.description = {
      value: scraperOutput.description.value,
      source: mapSource(scraperOutput.description.source),
      confidence: scraperOutput.description.confidence
    }
  }
  
  // Variants (if requested)
  if (options.include_variants && scraperOutput.variants.value && scraperOutput.variants.value.length > 0) {
    fields.variants = {
      value: scraperOutput.variants.value.map(v => ({
        id: v.id,
        title: v.name,
        price: v.price || 0,
        sku: v.sku,
        image_url: v.imageUrl,
        available: v.available,
        options: v.options
      })),
      source: mapSource(scraperOutput.variants.source),
      confidence: scraperOutput.variants.confidence
    }
  }
  
  // Video (if requested)
  if (options.include_video && scraperOutput.videoUrls.value && scraperOutput.videoUrls.value.length > 0) {
    fields.video_url = {
      value: scraperOutput.videoUrls.value[0],
      source: mapSource(scraperOutput.videoUrls.source),
      confidence: scraperOutput.videoUrls.confidence
    }
  }
  
  // Brand
  if (scraperOutput.brand.value) {
    fields.brand = {
      value: scraperOutput.brand.value,
      source: mapSource(scraperOutput.brand.source),
      confidence: scraperOutput.brand.confidence
    }
  }
  
  // SKU
  if (scraperOutput.sku.value) {
    fields.sku = {
      value: scraperOutput.sku.value,
      source: mapSource(scraperOutput.sku.source),
      confidence: scraperOutput.sku.confidence
    }
  }
  
  // Rating
  if (scraperOutput.rating.value !== null) {
    fields.rating = {
      value: scraperOutput.rating.value,
      source: mapSource(scraperOutput.rating.source),
      confidence: scraperOutput.rating.confidence
    }
  }
  
  // Review count
  if (scraperOutput.reviewCount.value !== null) {
    fields.reviews_count = {
      value: scraperOutput.reviewCount.value,
      source: mapSource(scraperOutput.reviewCount.source),
      confidence: scraperOutput.reviewCount.confidence
    }
  }
  
  // Seller
  if (scraperOutput.seller.value) {
    fields.seller_name = {
      value: scraperOutput.seller.value,
      source: mapSource(scraperOutput.seller.source),
      confidence: scraperOutput.seller.confidence
    }
  }
  
  // Category
  if (scraperOutput.category.value) {
    fields.category = {
      value: scraperOutput.category.value,
      source: mapSource(scraperOutput.category.source),
      confidence: scraperOutput.category.confidence
    }
  }
  
  // Availability
  if (scraperOutput.availability.value) {
    const statusMap: Record<string, 'in_stock' | 'out_of_stock' | 'unknown'> = {
      'in_stock': 'in_stock',
      'out_of_stock': 'out_of_stock',
      'unknown': 'unknown'
    }
    fields.stock_status = {
      value: statusMap[scraperOutput.availability.value] || 'unknown',
      source: mapSource(scraperOutput.availability.source),
      confidence: scraperOutput.availability.confidence
    }
  }
  
  // Reviews data (if extracted)
  if (scraperOutput.reviews.value) {
    if (scraperOutput.reviews.value.averageRating > 0) {
      fields.rating = {
        value: scraperOutput.reviews.value.averageRating,
        source: mapSource(scraperOutput.reviews.source),
        confidence: scraperOutput.reviews.confidence
      }
    }
    if (scraperOutput.reviews.value.totalCount > 0) {
      fields.reviews_count = {
        value: scraperOutput.reviews.value.totalCount,
        source: mapSource(scraperOutput.reviews.source),
        confidence: scraperOutput.reviews.confidence
      }
    }
  }
  
  return fields
}

function getPlatformActions(platform: string, options: ImportOptions): any[] {
  const baseActions = [
    { type: 'wait', milliseconds: 2000 },
    { type: 'scroll', direction: 'down', amount: 500 },
  ]
  
  const platformActions: Record<string, any[]> = {
    aliexpress: [
      ...baseActions,
      { type: 'scroll', direction: 'down', amount: 1000 },
      // Wait for lazy-loaded images
      { type: 'wait', milliseconds: 1500 },
    ],
    amazon: [
      ...baseActions,
      // Click to expand description if collapsed
      { type: 'wait', milliseconds: 1000 },
    ],
    temu: [
      ...baseActions,
      { type: 'scroll', direction: 'down', amount: 800 },
      { type: 'wait', milliseconds: 2000 },
    ],
    shein: [
      ...baseActions,
      { type: 'scroll', direction: 'down', amount: 600 },
    ],
  }
  
  return platformActions[platform] || baseActions
}

function getExtractionSchema(platform: string, options: ImportOptions): any {
  const baseSchema = {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Product title/name' },
      description: { type: 'string', description: 'Full product description' },
      price: { type: 'number', description: 'Current price as number' },
      original_price: { type: 'number', description: 'Original price before discount' },
      currency: { type: 'string', description: 'Currency code (USD, EUR, etc)' },
      images: { type: 'array', items: { type: 'string' }, description: 'All product image URLs' },
      rating: { type: 'number', description: 'Average rating (0-5)' },
      reviews_count: { type: 'number', description: 'Number of reviews' },
      seller_name: { type: 'string', description: 'Seller or store name' },
      category: { type: 'string', description: 'Product category' },
      brand: { type: 'string', description: 'Product brand' },
      sku: { type: 'string', description: 'SKU or product ID' },
      in_stock: { type: 'boolean', description: 'Is product in stock' },
      stock_quantity: { type: 'number', description: 'Available quantity' },
    },
    required: ['title', 'price'],
  }
  
  if (options.include_variants) {
    baseSchema.properties['variants'] = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          price: { type: 'number' },
          sku: { type: 'string' },
          image: { type: 'string' },
          available: { type: 'boolean' },
        },
      },
      description: 'Product variants (size, color, etc)',
    }
  }
  
  if (options.include_video) {
    baseSchema.properties['video_url'] = { type: 'string', description: 'Product video URL' }
  }
  
  if (options.include_shipping) {
    baseSchema.properties['shipping'] = {
      type: 'object',
      properties: {
        free: { type: 'boolean' },
        cost: { type: 'number' },
        days: { type: 'string' },
      },
    }
  }
  
  return baseSchema
}

// =============================================================================
// STRATEGY 3: HTML FALLBACK (fetch + parse)
// =============================================================================

async function extractViaHTML(
  url: string,
  platform: string,
  ctx: GatewayContext
): Promise<ExtractionResult> {
  console.log(`[Orchestrator] Trying HTML fallback for ${platform}`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      return { success: false, fields: {}, source: 'html', error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    
    // Try JSON-LD first (highest confidence for HTML)
    const jsonLdData = extractJsonLd(html)
    
    // Then try platform patterns
    const patternData = extractWithPatterns(html, platform)
    
    // Then try meta tags
    const metaData = extractMetaTags(html)
    
    // Merge all sources with priority: JSON-LD > Patterns > Meta
    const fields = mergeHTMLExtractions(jsonLdData, patternData, metaData)
    
    if (!fields.title?.value) {
      return { success: false, fields, source: 'html', error: 'No title found' }
    }

    return { success: true, fields, source: 'html' }
  } catch (error) {
    console.error('[Orchestrator] HTML fallback error:', error)
    return { success: false, fields: {}, source: 'html', error: error.message }
  }
}

function extractJsonLd(html: string): ExtractedFields {
  const fields: ExtractedFields = {}
  
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)
  if (!jsonLdMatch) return fields
  
  for (const match of jsonLdMatch) {
    try {
      const jsonStr = match.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '')
      const parsed = JSON.parse(jsonStr)
      
      // Find Product type
      let product: any = null
      if (parsed['@type'] === 'Product') {
        product = parsed
      } else if (Array.isArray(parsed['@graph'])) {
        product = parsed['@graph'].find((g: any) => g['@type'] === 'Product')
      }
      
      if (!product) continue
      
      if (product.name) {
        fields.title = { value: product.name, source: 'html', confidence: 95 }
      }
      if (product.description) {
        fields.description = { value: product.description, source: 'html', confidence: 90 }
      }
      if (product.brand?.name) {
        fields.brand = { value: product.brand.name, source: 'html', confidence: 90 }
      }
      if (product.sku) {
        fields.sku = { value: product.sku, source: 'html', confidence: 95 }
      }
      if (product.image) {
        const images = Array.isArray(product.image) ? product.image : [product.image]
        fields.images = { value: images.filter((i: string) => typeof i === 'string'), source: 'html', confidence: 90 }
      }
      
      if (product.offers) {
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
        if (offer.price) {
          fields.price = { value: parseFloat(offer.price), source: 'html', confidence: 95 }
        }
        if (offer.priceCurrency) {
          fields.currency = { value: offer.priceCurrency, source: 'html', confidence: 95 }
        }
        if (offer.availability) {
          const inStock = offer.availability.includes('InStock')
          fields.stock_status = { value: inStock ? 'in_stock' : 'out_of_stock', source: 'html', confidence: 90 }
        }
      }
      
      if (product.aggregateRating) {
        if (product.aggregateRating.ratingValue) {
          fields.rating = { value: parseFloat(product.aggregateRating.ratingValue), source: 'html', confidence: 90 }
        }
        if (product.aggregateRating.reviewCount) {
          fields.reviews_count = { value: parseInt(product.aggregateRating.reviewCount), source: 'html', confidence: 90 }
        }
      }
      
      break // Use first valid product
    } catch {}
  }
  
  return fields
}

function extractWithPatterns(html: string, platform: string): ExtractedFields {
  const fields: ExtractedFields = {}
  
  const patterns: Record<string, Record<string, { regex: RegExp; confidence: number }>> = {
    aliexpress: {
      title: { regex: /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</i, confidence: 80 },
      price: { regex: /"skuAmount":\s*\{"value":([0-9.]+)/, confidence: 85 },
      seller_name: { regex: /"sellerName":\s*"([^"]+)"/, confidence: 85 },
    },
    amazon: {
      title: { regex: /<span id="productTitle"[^>]*>([^<]+)</i, confidence: 85 },
      price: { regex: /<span class="[^"]*a-price-whole[^"]*">([0-9,]+)/, confidence: 80 },
      brand: { regex: /<a id="bylineInfo"[^>]*>([^<]+)</i, confidence: 80 },
    },
    temu: {
      title: { regex: /<h1[^>]*>([^<]+)</i, confidence: 75 },
      price: { regex: /"salePrice":\s*([0-9.]+)/, confidence: 80 },
    },
    shein: {
      title: { regex: /<h1[^>]*class="[^"]*product-intro__head-name[^"]*"[^>]*>([^<]+)</i, confidence: 80 },
      price: { regex: /"salePrice":\s*\{"amount":([0-9.]+)/, confidence: 80 },
    },
  }
  
  const platformPatterns = patterns[platform] || {}
  
  for (const [field, { regex, confidence }] of Object.entries(platformPatterns)) {
    const match = html.match(regex)
    if (match?.[1]) {
      const value = match[1].trim()
      if (field === 'price') {
        fields.price = { value: parseFloat(value.replace(',', '')), source: 'html', confidence }
      } else if (field === 'title') {
        fields.title = { value, source: 'html', confidence }
      } else if (field === 'seller_name') {
        fields.seller_name = { value, source: 'html', confidence }
      } else if (field === 'brand') {
        fields.brand = { value, source: 'html', confidence }
      }
    }
  }
  
  return fields
}

function extractMetaTags(html: string): ExtractedFields {
  const fields: ExtractedFields = {}
  
  // OG Title
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)
  if (ogTitle?.[1]) {
    fields.title = { value: ogTitle[1], source: 'fallback', confidence: 60 }
  }
  
  // OG Description
  const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i)
  if (ogDesc?.[1]) {
    fields.description = { value: ogDesc[1], source: 'fallback', confidence: 55 }
  }
  
  // OG Image
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)
  if (ogImage?.[1]) {
    fields.images = { value: [ogImage[1]], source: 'fallback', confidence: 60 }
  }
  
  // Price amount meta
  const priceAmount = html.match(/<meta property="product:price:amount" content="([^"]+)"/i)
  if (priceAmount?.[1]) {
    fields.price = { value: parseFloat(priceAmount[1]), source: 'fallback', confidence: 70 }
  }
  
  // Price currency meta
  const priceCurrency = html.match(/<meta property="product:price:currency" content="([^"]+)"/i)
  if (priceCurrency?.[1]) {
    fields.currency = { value: priceCurrency[1], source: 'fallback', confidence: 70 }
  }
  
  return fields
}

function mergeHTMLExtractions(
  jsonLd: ExtractedFields, 
  patterns: ExtractedFields, 
  meta: ExtractedFields
): ExtractedFields {
  const merged: ExtractedFields = {}
  const allFields = ['title', 'description', 'price', 'currency', 'images', 'brand', 'sku', 
                     'rating', 'reviews_count', 'stock_status', 'seller_name'] as const
  
  for (const field of allFields) {
    // Priority: JSON-LD > Patterns > Meta (by confidence)
    const candidates = [jsonLd[field], patterns[field], meta[field]].filter(Boolean)
    if (candidates.length > 0) {
      // Pick highest confidence
      candidates.sort((a, b) => (b?.confidence || 0) - (a?.confidence || 0))
      merged[field] = candidates[0] as any
    }
  }
  
  return merged
}

// =============================================================================
// FIELD NORMALIZATION
// =============================================================================

function normalizeExtractedFields(raw: any, source: ExtractionSource): ExtractedFields {
  const fields: ExtractedFields = {}
  const confidence = source === 'api' ? 98 : source === 'headless' ? 85 : 70
  
  if (raw.title) {
    fields.title = { value: String(raw.title).trim(), source, confidence }
  }
  if (raw.description) {
    fields.description = { value: String(raw.description), source, confidence: confidence - 5 }
  }
  if (raw.price !== undefined && raw.price !== null) {
    fields.price = { value: parseFloat(raw.price), source, confidence }
  }
  if (raw.original_price) {
    fields.original_price = { value: parseFloat(raw.original_price), source, confidence }
  }
  if (raw.currency) {
    fields.currency = { value: String(raw.currency).toUpperCase(), source, confidence }
  }
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    fields.images = { 
      value: raw.images.filter((i: any) => typeof i === 'string' && i.startsWith('http')), 
      source, 
      confidence 
    }
  }
  if (raw.video_url) {
    fields.video_url = { value: String(raw.video_url), source, confidence: confidence - 10 }
  }
  if (raw.sku) {
    fields.sku = { value: String(raw.sku), source, confidence }
  }
  if (raw.in_stock !== undefined) {
    fields.stock_status = { value: raw.in_stock ? 'in_stock' : 'out_of_stock', source, confidence }
  }
  if (raw.stock_quantity !== undefined) {
    fields.stock_quantity = { value: parseInt(raw.stock_quantity), source, confidence }
  }
  if (raw.category) {
    fields.category = { value: String(raw.category), source, confidence: confidence - 5 }
  }
  if (raw.brand) {
    fields.brand = { value: String(raw.brand), source, confidence: confidence - 5 }
  }
  if (raw.rating !== undefined) {
    fields.rating = { value: parseFloat(raw.rating), source, confidence }
  }
  if (raw.reviews_count !== undefined) {
    fields.reviews_count = { value: parseInt(raw.reviews_count), source, confidence }
  }
  if (raw.seller_name) {
    fields.seller_name = { value: String(raw.seller_name), source, confidence: confidence - 5 }
  }
  if (Array.isArray(raw.variants)) {
    fields.variants = {
      value: raw.variants.map((v: any, idx: number) => ({
        id: v.sku || `v-${idx}`,
        title: v.title || `Variant ${idx + 1}`,
        price: parseFloat(v.price) || fields.price?.value || 0,
        sku: v.sku,
        image_url: v.image,
        available: v.available !== false,
        options: v.options || {},
      })),
      source,
      confidence: confidence - 10,
    }
  }
  if (raw.shipping) {
    fields.shipping_free = { value: raw.shipping.free === true, source, confidence: confidence - 10 }
    if (raw.shipping.cost) {
      fields.shipping_cost = { value: parseFloat(raw.shipping.cost), source, confidence: confidence - 10 }
    }
    if (raw.shipping.days) {
      fields.shipping_days = { value: String(raw.shipping.days), source, confidence: confidence - 15 }
    }
  }
  
  return fields
}

// =============================================================================
// MERGE STRATEGIES
// =============================================================================

function mergeExtractionResults(results: ExtractionResult[]): {
  fields: ExtractedFields
  method: 'api' | 'headless' | 'html' | 'hybrid'
} {
  const merged: ExtractedFields = {}
  const successfulResults = results.filter(r => r.success || Object.keys(r.fields).length > 0)
  
  if (successfulResults.length === 0) {
    return { fields: {}, method: 'html' }
  }
  
  // Merge fields, taking highest confidence for each
  const allFieldNames = new Set<keyof ExtractedFields>()
  successfulResults.forEach(r => Object.keys(r.fields).forEach(k => allFieldNames.add(k as keyof ExtractedFields)))
  
  for (const fieldName of allFieldNames) {
    const candidates = successfulResults
      .map(r => r.fields[fieldName])
      .filter((f): f is FieldValue<any> => f !== undefined && f.value !== undefined && f.value !== null)
    
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.confidence - a.confidence)
      merged[fieldName] = candidates[0] as any
    }
  }
  
  // Determine extraction method
  const sources = successfulResults.map(r => r.source)
  let method: 'api' | 'headless' | 'html' | 'hybrid'
  
  if (sources.includes('api')) {
    method = sources.length > 1 ? 'hybrid' : 'api'
  } else if (sources.includes('headless')) {
    method = sources.length > 1 ? 'hybrid' : 'headless'
  } else {
    method = 'html'
  }
  
  return { fields: merged, method }
}

// =============================================================================
// PRODUCT NORMALIZATION
// =============================================================================

function buildNormalizedProduct(
  url: string,
  platform: string,
  fields: ExtractedFields,
  method: 'api' | 'headless' | 'html' | 'hybrid'
): NormalizedProduct {
  const requiredFields = ['title', 'price', 'images'] as const
  const allFields = ['title', 'description', 'price', 'original_price', 'currency', 'images', 
                     'video_url', 'sku', 'stock_status', 'stock_quantity', 'category', 'brand',
                     'rating', 'reviews_count', 'seller_name', 'variants', 'shipping_free',
                     'shipping_cost', 'shipping_days'] as const
  
  const missingFields: string[] = []
  const fieldSources: Record<string, { source: ExtractionSource; confidence: number }> = {}
  
  for (const field of allFields) {
    if (fields[field]?.value !== undefined) {
      fieldSources[field] = { source: fields[field]!.source, confidence: fields[field]!.confidence }
    } else {
      missingFields.push(field)
    }
  }
  
  // Calculate completeness (required fields weighted more)
  const requiredPresent = requiredFields.filter(f => fields[f]?.value !== undefined).length
  const optionalPresent = allFields.filter(f => !requiredFields.includes(f as any) && fields[f]?.value !== undefined).length
  const requiredWeight = 60
  const optionalWeight = 40
  
  const requiredScore = (requiredPresent / requiredFields.length) * requiredWeight
  const optionalScore = (optionalPresent / (allFields.length - requiredFields.length)) * optionalWeight
  const completenessScore = Math.round(requiredScore + optionalScore)
  
  return {
    source_url: url,
    external_id: fields.sku?.value || null,
    platform,
    title: fields.title?.value || 'Unknown Product',
    description: fields.description?.value || null,
    price: fields.price?.value || 0,
    original_price: fields.original_price?.value || null,
    currency: fields.currency?.value || 'EUR',
    images: fields.images?.value || [],
    video_url: fields.video_url?.value || null,
    sku: fields.sku?.value || null,
    stock_status: fields.stock_status?.value || 'unknown',
    stock_quantity: fields.stock_quantity?.value || null,
    category: fields.category?.value || null,
    brand: fields.brand?.value || null,
    rating: fields.rating?.value || null,
    reviews_count: fields.reviews_count?.value || null,
    seller_name: fields.seller_name?.value || null,
    variants: fields.variants?.value || [],
    shipping_free: fields.shipping_free?.value || false,
    shipping_cost: fields.shipping_cost?.value || null,
    shipping_days: fields.shipping_days?.value || null,
    extraction_method: method,
    completeness_score: completenessScore,
    missing_fields: missingFields,
    field_sources: fieldSources,
    extracted_at: new Date().toISOString(),
  }
}

// =============================================================================
// MAIN ORCHESTRATOR
// =============================================================================

export async function handleImportOrchestrator(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  // 1. Validate payload
  const parsed = ImportProductPayload.safeParse(payload)
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

  const { source_url, options, request_id, idempotency_key } = parsed.data
  const platform = parsed.data.platform || detectPlatform(source_url)

  console.log(`[Orchestrator] Starting import for ${platform}: ${source_url}`)

  // 2. Create import job with status "draft"
  const { data: job, error: jobError } = await ctx.supabase
    .from('import_jobs')
    .insert({
      user_id: ctx.userId,
      job_type: 'product_import',
      status: 'pending',
      source_url,
      platform,
      extraction_method: null,
      field_sources: {},
    })
    .select('id')
    .single()

  if (jobError) {
    console.error('[Orchestrator] Failed to create job:', jobError)
  }

  const jobId = job?.id
  const extractionAttempts: { method: string; success: boolean; error?: string; duration_ms: number }[] = []

  try {
    // 3. Update job to processing
    if (jobId) {
      await ctx.supabase.from('import_jobs').update({
        status: 'processing',
        started_at: new Date().toISOString(),
      }).eq('id', jobId)
    }

    // 4. PIPELINE: API → Headless → HTML fallback
    const results: ExtractionResult[] = []
    
    // Step 1: Try API
    const startApi = Date.now()
    const apiResult = await extractViaAPI(source_url, platform, ctx)
    extractionAttempts.push({ 
      method: 'api', 
      success: apiResult.success, 
      error: apiResult.error,
      duration_ms: Date.now() - startApi 
    })
    if (apiResult.success) results.push(apiResult)

    // Step 2: Try Headless (even if API succeeded, for supplementary data)
    const startHeadless = Date.now()
    const headlessResult = await extractViaHeadless(source_url, platform, options, ctx)
    extractionAttempts.push({ 
      method: 'headless', 
      success: headlessResult.success, 
      error: headlessResult.error,
      duration_ms: Date.now() - startHeadless 
    })
    if (headlessResult.success || Object.keys(headlessResult.fields).length > 0) {
      results.push(headlessResult)
    }

    // Step 3: Try HTML fallback if needed
    if (!results.some(r => r.fields.title?.value && r.fields.price?.value)) {
      const startHtml = Date.now()
      const htmlResult = await extractViaHTML(source_url, platform, ctx)
      extractionAttempts.push({ 
        method: 'html', 
        success: htmlResult.success, 
        error: htmlResult.error,
        duration_ms: Date.now() - startHtml 
      })
      if (htmlResult.success || Object.keys(htmlResult.fields).length > 0) {
        results.push(htmlResult)
      }
    }

    // 5. Merge results
    const { fields, method } = mergeExtractionResults(results)

    // 6. Check critical fields
    const hasCriticalFields = fields.title?.value && fields.price?.value && fields.images?.value?.length > 0
    
    if (!hasCriticalFields) {
      // Mark as error_incomplete
      if (jobId) {
        await ctx.supabase.from('import_jobs').update({
          status: 'error_incomplete',
          error_code: 'MISSING_CRITICAL_FIELDS',
          error_log: extractionAttempts,
          missing_fields: ['title', 'price', 'images'].filter(f => !fields[f as keyof ExtractedFields]?.value),
          completed_at: new Date().toISOString(),
        }).eq('id', jobId)
      }

      return {
        success: false,
        error: {
          code: 'INCOMPLETE_EXTRACTION',
          message: 'Critical fields missing: title, price, or images',
          details: {
            job_id: jobId,
            platform,
            attempts: extractionAttempts,
            partial_fields: Object.keys(fields),
            missing_critical: ['title', 'price', 'images'].filter(f => !fields[f as keyof ExtractedFields]?.value),
          }
        }
      }
    }

    // 7. Build normalized product
    const product = buildNormalizedProduct(source_url, platform, fields, method)

    // 8. Check existing product
    const { data: existing } = await ctx.supabase
      .from('products')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('source_url', source_url)
      .maybeSingle()

    let savedProduct: any
    let action: 'created' | 'updated'

    if (existing) {
      // Update existing
      const { data, error } = await ctx.supabase
        .from('products')
        .update({
          name: product.title,
          description: product.description,
          price: product.price,
          cost_price: product.original_price,
          currency: product.currency,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          image_url: product.images[0] || null,
          images: product.images,
          video_url: product.video_url,
          stock_quantity: product.stock_quantity,
          platform: platform,
          variants: product.variants,
          rating: product.rating,
          reviews_count: product.reviews_count,
          seller_name: product.seller_name,
          status: 'active', // Mark as ready
          import_metadata: {
            extraction_method: product.extraction_method,
            completeness_score: product.completeness_score,
            missing_fields: product.missing_fields,
            field_sources: product.field_sources,
            last_synced_at: product.extracted_at,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      savedProduct = data
      action = 'updated'
    } else {
      // Create new with status "draft" then update to "active"
      const { data, error } = await ctx.supabase
        .from('products')
        .insert({
          user_id: ctx.userId,
          name: product.title,
          description: product.description,
          price: product.price,
          cost_price: product.original_price,
          currency: product.currency,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          image_url: product.images[0] || null,
          images: product.images,
          video_url: product.video_url,
          source_url: source_url,
          platform: platform,
          stock_quantity: product.stock_quantity,
          variants: product.variants,
          rating: product.rating,
          reviews_count: product.reviews_count,
          seller_name: product.seller_name,
          status: 'active', // Ready after successful extraction
          import_metadata: {
            extraction_method: product.extraction_method,
            completeness_score: product.completeness_score,
            missing_fields: product.missing_fields,
            field_sources: product.field_sources,
            imported_at: product.extracted_at,
          },
        })
        .select()
        .single()

      if (error) throw error
      savedProduct = data
      action = 'created'
    }

    // 9. Update job to completed
    if (jobId) {
      await ctx.supabase.from('import_jobs').update({
        status: 'completed',
        result_product_ids: [savedProduct.id],
        extraction_method: method,
        completeness_score: product.completeness_score,
        missing_fields: product.missing_fields,
        field_sources: product.field_sources,
        error_log: extractionAttempts,
        completed_at: new Date().toISOString(),
      }).eq('id', jobId)
    }

    // 10. Log success
    await logImportEvent(ctx, {
      source_url,
      platform,
      status: 'success',
      product_id: savedProduct.id,
      extraction_method: method,
      completeness_score: product.completeness_score,
      attempts: extractionAttempts,
    })

    // 11. Return response
    return {
      success: true,
      data: {
        action,
        job_id: jobId,
        product: {
          id: savedProduct.id,
          name: savedProduct.name,
          price: savedProduct.price,
          images: savedProduct.images,
          status: savedProduct.status,
        },
        extraction: {
          method: product.extraction_method,
          completeness_score: product.completeness_score,
          missing_fields: product.missing_fields,
          field_sources: product.field_sources,
          attempts: extractionAttempts,
        }
      }
    }

  } catch (error) {
    console.error('[Orchestrator] Error:', error)

    if (jobId) {
      await ctx.supabase.from('import_jobs').update({
        status: 'failed',
        error_code: 'HANDLER_ERROR',
        error_log: [...extractionAttempts, { method: 'save', success: false, error: error.message, duration_ms: 0 }],
        completed_at: new Date().toISOString(),
      }).eq('id', jobId)
    }

    await logImportEvent(ctx, {
      source_url,
      platform,
      status: 'error',
      error_code: 'HANDLER_ERROR',
      error_message: error.message,
      attempts: extractionAttempts,
    })

    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Import failed',
        details: { job_id: jobId, attempts: extractionAttempts }
      }
    }
  }
}

// =============================================================================
// LOGGING
// =============================================================================

async function logImportEvent(ctx: GatewayContext, data: Record<string, any>): Promise<void> {
  await ctx.supabase.from('extension_events').insert({
    user_id: ctx.userId,
    action: 'IMPORT_PRODUCT_BACKEND',
    platform: data.platform,
    status: data.status,
    error_code: data.error_code,
    error_message: data.error_message,
    metadata: {
      source_url: data.source_url,
      product_id: data.product_id,
      extraction_method: data.extraction_method,
      completeness_score: data.completeness_score,
      attempts: data.attempts,
    },
    request_id: ctx.requestId,
    extension_id: ctx.extensionId,
    extension_version: ctx.extensionVersion,
  }).catch(e => console.error('[Orchestrator] Log error:', e))
}
