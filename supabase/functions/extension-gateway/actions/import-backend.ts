/**
 * Backend-First Import Handler v3.0
 * 
 * Architecture "niveau AutoDS":
 * - L'extension envoie uniquement URL + metadata
 * - Le backend devient source de vérité via: API → Firecrawl → HTML fallback
 * - Import progressif avec job tracking
 * - Normalisation stricte des données
 * - Logs de complétude détaillés
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'

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

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  amazon: [/amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp|com\.au|in|com\.mx|com\.br|nl|pl|se|sg|ae|sa|eg|tr)/],
  aliexpress: [/aliexpress\.(com|ru|us)/, /a\.]aliexpress\.com/, /s\.click\.aliexpress\.com/],
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
// DATA NORMALIZATION - Unified Product Schema
// =============================================================================

interface NormalizedProduct {
  // Core Identity
  source_url: string
  external_id: string | null
  platform: string
  
  // Basic Info
  title: string
  description: string | null
  short_description: string | null
  
  // Pricing
  price: number
  original_price: number | null
  currency: string
  discount_percentage: number | null
  
  // Media
  images: string[]
  video_url: string | null
  thumbnail_url: string | null
  
  // Inventory
  sku: string | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  stock_quantity: number | null
  
  // Classification
  category: string | null
  subcategory: string | null
  brand: string | null
  tags: string[]
  
  // Variants
  has_variants: boolean
  variants: ProductVariant[]
  options: ProductOption[]
  
  // Reviews
  rating: number | null
  reviews_count: number | null
  reviews: ProductReview[]
  
  // Shipping
  shipping_info: ShippingInfo | null
  
  // Seller
  seller_name: string | null
  seller_rating: number | null
  seller_url: string | null
  
  // Metadata
  extraction_method: 'api' | 'firecrawl' | 'html_fallback' | 'hybrid'
  completeness_score: number
  missing_fields: string[]
  extracted_at: string
}

interface ProductVariant {
  id: string
  title: string
  price: number
  original_price: number | null
  sku: string | null
  image_url: string | null
  stock_quantity: number | null
  options: Record<string, string>
  available: boolean
}

interface ProductOption {
  name: string
  values: string[]
}

interface ProductReview {
  author: string
  rating: number
  content: string
  date: string | null
  helpful_count: number | null
  images: string[]
}

interface ShippingInfo {
  free_shipping: boolean
  shipping_cost: number | null
  shipping_currency: string | null
  estimated_days_min: number | null
  estimated_days_max: number | null
  ships_from: string | null
  ships_to: string[]
}

// =============================================================================
// EXTRACTION STRATEGIES
// =============================================================================

/**
 * Strategy 1: Platform API (when available)
 * Currently stub - would integrate with platform APIs
 */
async function extractViaAPI(
  url: string, 
  platform: string, 
  ctx: GatewayContext
): Promise<NormalizedProduct | null> {
  // TODO: Implement platform-specific API integrations
  // Amazon Product Advertising API, AliExpress Affiliate API, etc.
  console.log(`[Import] API extraction not available for ${platform}`)
  return null
}

/**
 * Strategy 2: Firecrawl (primary backend scraping)
 */
async function extractViaFirecrawl(
  url: string,
  platform: string,
  options: z.infer<typeof ImportProductPayload>['options'],
  ctx: GatewayContext
): Promise<NormalizedProduct | null> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  if (!firecrawlKey) {
    console.log('[Import] Firecrawl API key not configured')
    return null
  }

  try {
    // Use Firecrawl scrape endpoint
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Product title' },
              description: { type: 'string', description: 'Full product description' },
              price: { type: 'number', description: 'Current price as number' },
              original_price: { type: 'number', description: 'Original price before discount' },
              currency: { type: 'string', description: 'Currency code (USD, EUR, etc)' },
              images: { type: 'array', items: { type: 'string' }, description: 'Product image URLs' },
              rating: { type: 'number', description: 'Average rating (0-5)' },
              reviews_count: { type: 'number', description: 'Number of reviews' },
              seller_name: { type: 'string', description: 'Seller or store name' },
              category: { type: 'string', description: 'Product category' },
              brand: { type: 'string', description: 'Product brand' },
              sku: { type: 'string', description: 'SKU or product ID' },
              in_stock: { type: 'boolean', description: 'Is product in stock' },
              variants: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    price: { type: 'number' },
                    sku: { type: 'string' },
                    available: { type: 'boolean' }
                  }
                },
                description: 'Product variants (size, color, etc)'
              },
              shipping_info: {
                type: 'object',
                properties: {
                  free_shipping: { type: 'boolean' },
                  shipping_cost: { type: 'number' },
                  estimated_days: { type: 'string' }
                }
              }
            },
            required: ['title']
          }
        },
        actions: [
          { type: 'wait', milliseconds: 2000 },
          { type: 'scroll', direction: 'down', amount: 500 }
        ],
        timeout: 30000,
      }),
    })

    if (!response.ok) {
      console.error(`[Import] Firecrawl error: ${response.status}`)
      return null
    }

    const result = await response.json()
    
    if (!result.success || !result.data?.extract) {
      console.log('[Import] Firecrawl extraction failed or empty')
      return null
    }

    const extracted = result.data.extract
    const markdown = result.data.markdown || ''

    // Normalize the Firecrawl response
    return normalizeProduct({
      source_url: url,
      platform,
      raw_data: extracted,
      markdown,
      extraction_method: 'firecrawl',
    })
  } catch (error) {
    console.error('[Import] Firecrawl error:', error)
    return null
  }
}

/**
 * Strategy 3: HTML Fallback with regex patterns
 */
async function extractViaHTMLFallback(
  url: string,
  platform: string,
  ctx: GatewayContext
): Promise<NormalizedProduct | null> {
  try {
    // Fetch raw HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      console.log(`[Import] HTML fetch failed: ${response.status}`)
      return null
    }

    const html = await response.text()

    // Extract JSON-LD structured data if available
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)
    let structuredData: any = null
    
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '')
          const parsed = JSON.parse(jsonStr)
          if (parsed['@type'] === 'Product' || (Array.isArray(parsed['@graph']) && parsed['@graph'].some((g: any) => g['@type'] === 'Product'))) {
            structuredData = parsed['@type'] === 'Product' ? parsed : parsed['@graph'].find((g: any) => g['@type'] === 'Product')
            break
          }
        } catch {}
      }
    }

    // Platform-specific extraction patterns
    const extracted = extractWithPatterns(html, platform, structuredData)
    
    if (!extracted.title) {
      console.log('[Import] HTML fallback: No title found')
      return null
    }

    return normalizeProduct({
      source_url: url,
      platform,
      raw_data: extracted,
      extraction_method: 'html_fallback',
    })
  } catch (error) {
    console.error('[Import] HTML fallback error:', error)
    return null
  }
}

function extractWithPatterns(html: string, platform: string, jsonLd: any): Record<string, any> {
  const result: Record<string, any> = {}

  // Use JSON-LD if available
  if (jsonLd) {
    result.title = jsonLd.name
    result.description = jsonLd.description
    result.brand = jsonLd.brand?.name
    result.sku = jsonLd.sku
    result.images = jsonLd.image ? (Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image]) : []
    
    if (jsonLd.offers) {
      const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers
      result.price = parseFloat(offer.price)
      result.currency = offer.priceCurrency
      result.in_stock = offer.availability?.includes('InStock')
    }
    
    if (jsonLd.aggregateRating) {
      result.rating = parseFloat(jsonLd.aggregateRating.ratingValue)
      result.reviews_count = parseInt(jsonLd.aggregateRating.reviewCount)
    }
  }

  // Platform-specific fallback patterns
  const patterns = getPlatformPatterns(platform)
  
  for (const [field, pattern] of Object.entries(patterns)) {
    if (!result[field]) {
      const match = html.match(pattern)
      if (match && match[1]) {
        result[field] = match[1].trim()
      }
    }
  }

  // Extract meta tags
  if (!result.title) {
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)
    result.title = ogTitle?.[1]
  }
  
  if (!result.images || result.images.length === 0) {
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)
    if (ogImage?.[1]) {
      result.images = [ogImage[1]]
    }
  }

  return result
}

function getPlatformPatterns(platform: string): Record<string, RegExp> {
  const patterns: Record<string, Record<string, RegExp>> = {
    aliexpress: {
      title: /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</i,
      price: /"skuAmount":\s*{"value":([0-9.]+)/,
      original_price: /"skuActivityAmount":\s*{"value":([0-9.]+)/,
      seller_name: /"sellerName":\s*"([^"]+)"/,
    },
    amazon: {
      title: /<span id="productTitle"[^>]*>([^<]+)</i,
      price: /<span class="[^"]*a-price-whole[^"]*">([0-9,]+)</i,
      rating: /<span class="[^"]*a-icon-alt[^"]*">([0-9.]+) sur 5/i,
      brand: /<a id="bylineInfo"[^>]*>([^<]+)</i,
    },
    temu: {
      title: /<h1[^>]*>([^<]+)</i,
      price: /"salePrice":\s*([0-9.]+)/,
    },
    shein: {
      title: /<h1[^>]*class="[^"]*product-intro__head-name[^"]*"[^>]*>([^<]+)</i,
      price: /"salePrice":\s*{"amount":([0-9.]+)/,
    },
  }

  return patterns[platform] || {}
}

// =============================================================================
// NORMALIZATION
// =============================================================================

function normalizeProduct(data: {
  source_url: string
  platform: string
  raw_data: Record<string, any>
  markdown?: string
  extraction_method: 'api' | 'firecrawl' | 'html_fallback' | 'hybrid'
}): NormalizedProduct {
  const raw = data.raw_data
  const missing: string[] = []

  // Calculate completeness
  const requiredFields = ['title', 'price', 'images']
  const optionalFields = ['description', 'brand', 'category', 'sku', 'rating', 'reviews_count', 'seller_name', 'variants']

  // Extract images array
  let images: string[] = []
  if (Array.isArray(raw.images)) {
    images = raw.images.filter((img: string) => typeof img === 'string' && img.startsWith('http'))
  } else if (typeof raw.image === 'string') {
    images = [raw.image]
  }

  // Normalize variants
  let variants: ProductVariant[] = []
  let options: ProductOption[] = []
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, idx: number) => ({
      id: v.sku || v.id || `variant-${idx}`,
      title: v.title || v.name || `Variant ${idx + 1}`,
      price: parseFloat(v.price) || raw.price || 0,
      original_price: v.original_price ? parseFloat(v.original_price) : null,
      sku: v.sku || null,
      image_url: v.image || v.image_url || null,
      stock_quantity: v.quantity || v.stock || null,
      options: v.options || {},
      available: v.available !== false,
    }))

    // Extract option names from variants
    const optionNames = new Set<string>()
    variants.forEach(v => Object.keys(v.options).forEach(k => optionNames.add(k)))
    options = Array.from(optionNames).map(name => ({
      name,
      values: [...new Set(variants.map(v => v.options[name]).filter(Boolean))],
    }))
  }

  // Check missing required fields
  if (!raw.title) missing.push('title')
  if (raw.price === undefined && raw.price === null) missing.push('price')
  if (images.length === 0) missing.push('images')

  // Check optional fields
  optionalFields.forEach(field => {
    if (raw[field] === undefined || raw[field] === null) {
      missing.push(field)
    }
  })

  // Calculate completeness score (0-100)
  const totalFields = requiredFields.length + optionalFields.length
  const presentFields = totalFields - missing.length
  const completenessScore = Math.round((presentFields / totalFields) * 100)

  // Determine stock status
  let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' = 'unknown'
  if (raw.in_stock === true || raw.stock_status === 'in_stock') {
    stockStatus = 'in_stock'
  } else if (raw.in_stock === false || raw.stock_status === 'out_of_stock') {
    stockStatus = 'out_of_stock'
  }

  // Parse shipping info
  let shippingInfo: ShippingInfo | null = null
  if (raw.shipping_info) {
    shippingInfo = {
      free_shipping: raw.shipping_info.free_shipping === true,
      shipping_cost: raw.shipping_info.shipping_cost || null,
      shipping_currency: raw.shipping_info.currency || 'EUR',
      estimated_days_min: raw.shipping_info.min_days || null,
      estimated_days_max: raw.shipping_info.max_days || null,
      ships_from: raw.shipping_info.ships_from || null,
      ships_to: raw.shipping_info.ships_to || [],
    }
  }

  return {
    source_url: data.source_url,
    external_id: raw.product_id || raw.sku || null,
    platform: data.platform,
    
    title: raw.title || 'Unknown Product',
    description: raw.description || null,
    short_description: raw.short_description || (raw.description?.substring(0, 200) || null),
    
    price: parseFloat(raw.price) || 0,
    original_price: raw.original_price ? parseFloat(raw.original_price) : null,
    currency: raw.currency || 'EUR',
    discount_percentage: raw.original_price && raw.price 
      ? Math.round((1 - parseFloat(raw.price) / parseFloat(raw.original_price)) * 100)
      : null,
    
    images,
    video_url: raw.video_url || raw.video || null,
    thumbnail_url: images[0] || null,
    
    sku: raw.sku || null,
    stock_status: stockStatus,
    stock_quantity: raw.stock_quantity || raw.quantity || null,
    
    category: raw.category || null,
    subcategory: raw.subcategory || null,
    brand: raw.brand || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    
    has_variants: variants.length > 0,
    variants,
    options,
    
    rating: raw.rating ? parseFloat(raw.rating) : null,
    reviews_count: raw.reviews_count ? parseInt(raw.reviews_count) : null,
    reviews: [], // Reviews are fetched separately if requested
    
    shipping_info: shippingInfo,
    
    seller_name: raw.seller_name || null,
    seller_rating: raw.seller_rating ? parseFloat(raw.seller_rating) : null,
    seller_url: raw.seller_url || null,
    
    extraction_method: data.extraction_method,
    completeness_score: completenessScore,
    missing_fields: missing,
    extracted_at: new Date().toISOString(),
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function handleBackendImport(
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

  const { source_url, options, request_id, idempotency_key, timestamp } = parsed.data
  const platform = parsed.data.platform || detectPlatform(source_url)

  // 2. Create import job for tracking
  const { data: job, error: jobError } = await ctx.supabase
    .from('background_jobs')
    .insert({
      user_id: ctx.userId,
      job_type: 'product_import',
      job_subtype: platform,
      name: `Import from ${platform}`,
      status: 'processing',
      input_data: {
        source_url,
        platform,
        options,
        request_id,
      },
      progress_percent: 0,
      progress_message: 'Starting extraction...',
      metadata: {
        idempotency_key,
        extension_version: ctx.extensionVersion,
        started_at: new Date().toISOString(),
      }
    })
    .select('id')
    .single()

  if (jobError) {
    console.error('[Import] Failed to create job:', jobError)
  }

  const jobId = job?.id

  try {
    // 3. Progressive extraction with cascade
    let product: NormalizedProduct | null = null
    let extractionAttempts: { method: string; success: boolean; error?: string }[] = []

    // Update progress
    if (jobId) {
      await updateJobProgress(ctx.supabase, jobId, 10, 'Trying API extraction...')
    }

    // Strategy 1: Try API (fastest, most reliable when available)
    product = await extractViaAPI(source_url, platform, ctx)
    extractionAttempts.push({ method: 'api', success: !!product })

    if (!product) {
      // Update progress
      if (jobId) {
        await updateJobProgress(ctx.supabase, jobId, 30, 'API unavailable, trying Firecrawl...')
      }

      // Strategy 2: Try Firecrawl (AI-powered extraction)
      product = await extractViaFirecrawl(source_url, platform, options, ctx)
      extractionAttempts.push({ method: 'firecrawl', success: !!product })
    }

    if (!product) {
      // Update progress
      if (jobId) {
        await updateJobProgress(ctx.supabase, jobId, 60, 'Firecrawl failed, trying HTML fallback...')
      }

      // Strategy 3: HTML fallback with patterns
      product = await extractViaHTMLFallback(source_url, platform, ctx)
      extractionAttempts.push({ method: 'html_fallback', success: !!product })
    }

    if (!product) {
      // All strategies failed
      if (jobId) {
        await ctx.supabase.from('background_jobs').update({
          status: 'failed',
          progress_percent: 100,
          progress_message: 'All extraction methods failed',
          error_message: 'Could not extract product data from URL',
          completed_at: new Date().toISOString(),
        }).eq('id', jobId)
      }

      // Log failure
      await logImportAction(ctx, {
        source_url,
        platform,
        status: 'error',
        error_code: 'EXTRACTION_FAILED',
        extraction_attempts: extractionAttempts,
      })

      return {
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: 'Unable to extract product data from the provided URL',
          details: { 
            platform,
            attempts: extractionAttempts,
            hint: 'The page may be protected, the product may not exist, or the platform may not be supported.'
          }
        }
      }
    }

    // 4. Update progress
    if (jobId) {
      await updateJobProgress(ctx.supabase, jobId, 80, 'Saving product...')
    }

    // 5. Check if product already exists for this user (by URL)
    const { data: existing } = await ctx.supabase
      .from('products')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('source_url', source_url)
      .maybeSingle()

    let savedProduct: any
    let action: 'created' | 'updated'

    if (existing) {
      // Update existing product
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
          image_url: product.thumbnail_url,
          images: product.images,
          stock_quantity: product.stock_quantity,
          platform: platform,
          variants: product.variants,
          rating: product.rating,
          reviews_count: product.reviews_count,
          seller_name: product.seller_name,
          import_metadata: {
            extraction_method: product.extraction_method,
            completeness_score: product.completeness_score,
            missing_fields: product.missing_fields,
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
      // Create new product
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
          image_url: product.thumbnail_url,
          images: product.images,
          source_url: source_url,
          platform: platform,
          stock_quantity: product.stock_quantity,
          variants: product.variants,
          rating: product.rating,
          reviews_count: product.reviews_count,
          seller_name: product.seller_name,
          status: 'draft',
          import_metadata: {
            extraction_method: product.extraction_method,
            completeness_score: product.completeness_score,
            missing_fields: product.missing_fields,
            imported_at: product.extracted_at,
          },
        })
        .select()
        .single()

      if (error) throw error
      savedProduct = data
      action = 'created'
    }

    // 6. Complete job
    if (jobId) {
      await ctx.supabase.from('background_jobs').update({
        status: 'completed',
        progress_percent: 100,
        progress_message: `Product ${action} successfully`,
        output_data: { 
          product_id: savedProduct.id,
          completeness_score: product.completeness_score,
        },
        completed_at: new Date().toISOString(),
      }).eq('id', jobId)
    }

    // 7. Log success
    await logImportAction(ctx, {
      source_url,
      platform,
      status: 'success',
      product_id: savedProduct.id,
      product_title: product.title,
      extraction_method: product.extraction_method,
      completeness_score: product.completeness_score,
      extraction_attempts: extractionAttempts,
    })

    // 8. Return response
    return {
      success: true,
      data: {
        action,
        job_id: jobId,
        product: savedProduct,
        extraction: {
          method: product.extraction_method,
          completeness_score: product.completeness_score,
          missing_fields: product.missing_fields,
          attempts: extractionAttempts,
        }
      }
    }

  } catch (error) {
    console.error('[Import] Error:', error)

    // Update job with error
    if (jobId) {
      await ctx.supabase.from('background_jobs').update({
        status: 'failed',
        progress_percent: 100,
        error_message: error.message,
        completed_at: new Date().toISOString(),
      }).eq('id', jobId)
    }

    // Log error
    await logImportAction(ctx, {
      source_url,
      platform,
      status: 'error',
      error_code: 'HANDLER_ERROR',
      error_message: error.message,
    })

    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Import failed',
      }
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function updateJobProgress(
  supabase: any, 
  jobId: string, 
  percent: number, 
  message: string
): Promise<void> {
  await supabase.from('background_jobs').update({
    progress_percent: percent,
    progress_message: message,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId).catch(() => {})
}

async function logImportAction(
  ctx: GatewayContext,
  data: Record<string, any>
): Promise<void> {
  await ctx.supabase.from('extension_action_logs').insert({
    user_id: ctx.userId,
    action_type: 'IMPORT_PRODUCT_BACKEND',
    action_status: data.status,
    platform: data.platform,
    product_url: data.source_url,
    product_id: data.product_id,
    product_title: data.product_title,
    metadata: {
      extraction_method: data.extraction_method,
      completeness_score: data.completeness_score,
      extraction_attempts: data.extraction_attempts,
      error_code: data.error_code,
      error_message: data.error_message,
    },
    extension_version: ctx.extensionVersion,
  }).catch(e => console.error('[Import] Log action error:', e))
}
