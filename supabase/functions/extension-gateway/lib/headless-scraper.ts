/**
 * HeadlessScraper Module v1.0
 * 
 * Provides headless browser capabilities via Firecrawl.
 * Implements multi-source extraction: JSON-LD + OpenGraph + DOM
 * 
 * Features:
 * - Render pages with JS execution
 * - Extract structured data from multiple sources
 * - Scroll simulation for lazy-loaded content
 * - Circuit breaker for reliability
 * - Strict timeouts and page limits
 */

import { GatewayContext } from '../types.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface RenderOptions {
  waitForSelector?: string
  scrollToBottom?: boolean
  waitMs?: number
  extractFormats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[]
  location?: { country?: string; languages?: string[] }
}

export interface RenderResult {
  success: boolean
  html?: string
  markdown?: string
  links?: string[]
  screenshot?: string
  metadata?: {
    title?: string
    description?: string
    sourceURL?: string
    statusCode?: number
  }
  error?: string
  renderTimeMs?: number
}

export interface ExtractedField<T> {
  value: T | null
  source: 'json-ld' | 'opengraph' | 'meta' | 'dom' | 'structured' | 'fallback'
  confidence: number
  raw?: string
}

export interface ExtractedProduct {
  title: ExtractedField<string>
  price: ExtractedField<number>
  originalPrice: ExtractedField<number>
  currency: ExtractedField<string>
  images: ExtractedField<string[]>
  description: ExtractedField<string>
  variants: ExtractedField<ProductVariant[]>
  videoUrls: ExtractedField<string[]>
  reviews: ExtractedField<ReviewData>
  brand: ExtractedField<string>
  sku: ExtractedField<string>
  availability: ExtractedField<string>
  rating: ExtractedField<number>
  reviewCount: ExtractedField<number>
  category: ExtractedField<string>
  seller: ExtractedField<string>
}

export interface ProductVariant {
  id: string
  name: string
  options: Record<string, string>
  price?: number
  image?: string
  available?: boolean
  sku?: string
}

export interface ReviewData {
  averageRating: number
  totalCount: number
  distribution?: Record<number, number>
  reviews?: Array<{
    author: string
    rating: number
    text: string
    date?: string
    verified?: boolean
  }>
}

export interface CircuitBreakerState {
  failures: number
  lastFailure: number
  isOpen: boolean
}

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_PAGES_PER_IMPORT = 3
const RENDER_TIMEOUT_MS = 30000
const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_RESET_MS = 60000

// Platform-specific configurations
const PLATFORM_CONFIGS: Record<string, {
  waitMs: number
  scrollToBottom: boolean
  location?: { country: string; languages: string[] }
}> = {
  amazon: { waitMs: 3000, scrollToBottom: true, location: { country: 'US', languages: ['en'] } },
  aliexpress: { waitMs: 5000, scrollToBottom: true, location: { country: 'US', languages: ['en'] } },
  temu: { waitMs: 5000, scrollToBottom: true, location: { country: 'US', languages: ['en'] } },
  shein: { waitMs: 4000, scrollToBottom: true, location: { country: 'US', languages: ['en'] } },
  ebay: { waitMs: 2000, scrollToBottom: true },
  other: { waitMs: 3000, scrollToBottom: true }
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

const circuitBreaker: Map<string, CircuitBreakerState> = new Map()

function getCircuitState(key: string): CircuitBreakerState {
  const state = circuitBreaker.get(key) || { failures: 0, lastFailure: 0, isOpen: false }
  
  // Reset if enough time has passed
  if (state.isOpen && Date.now() - state.lastFailure > CIRCUIT_BREAKER_RESET_MS) {
    state.isOpen = false
    state.failures = 0
  }
  
  return state
}

function recordSuccess(key: string): void {
  circuitBreaker.set(key, { failures: 0, lastFailure: 0, isOpen: false })
}

function recordFailure(key: string): void {
  const state = getCircuitState(key)
  state.failures++
  state.lastFailure = Date.now()
  state.isOpen = state.failures >= CIRCUIT_BREAKER_THRESHOLD
  circuitBreaker.set(key, state)
}

// =============================================================================
// HEADLESS SCRAPER CLASS
// =============================================================================

export class HeadlessScraper {
  private ctx: GatewayContext
  private pageCount: number = 0
  private cachedRender: Map<string, RenderResult> = new Map()
  private currentHtml: string = ''
  private currentUrl: string = ''
  private platform: string = 'other'

  constructor(ctx: GatewayContext) {
    this.ctx = ctx
  }

  /**
   * Render a page using Firecrawl headless browser
   */
  async render(url: string, options: RenderOptions = {}): Promise<RenderResult> {
    const startTime = Date.now()
    
    // Check page limit
    if (this.pageCount >= MAX_PAGES_PER_IMPORT) {
      return {
        success: false,
        error: `Page limit exceeded (max ${MAX_PAGES_PER_IMPORT} pages per import)`,
        renderTimeMs: 0
      }
    }

    // Check circuit breaker
    const circuitKey = new URL(url).hostname
    const circuitState = getCircuitState(circuitKey)
    if (circuitState.isOpen) {
      return {
        success: false,
        error: `Circuit breaker open for ${circuitKey} - too many failures`,
        renderTimeMs: 0
      }
    }

    // Check cache
    const cacheKey = `${url}:${JSON.stringify(options)}`
    if (this.cachedRender.has(cacheKey)) {
      return this.cachedRender.get(cacheKey)!
    }

    // Detect platform
    this.platform = this.detectPlatform(url)
    this.currentUrl = url
    const platformConfig = PLATFORM_CONFIGS[this.platform] || PLATFORM_CONFIGS.other

    // Get Firecrawl API key
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!apiKey) {
      console.warn('[HeadlessScraper] FIRECRAWL_API_KEY not configured, using HTML fallback')
      return this.fallbackFetch(url, startTime)
    }

    try {
      // Build Firecrawl request
      const formats = options.extractFormats || ['html', 'markdown', 'links']
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS)

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats,
          onlyMainContent: false,
          waitFor: options.waitMs || platformConfig.waitMs,
          location: options.location || platformConfig.location,
          actions: platformConfig.scrollToBottom ? [
            { type: 'scroll', direction: 'down' },
            { type: 'wait', milliseconds: 1000 },
            { type: 'scroll', direction: 'down' },
            { type: 'wait', milliseconds: 500 }
          ] : undefined
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Firecrawl error: ${response.status}`)
      }

      const data = await response.json()
      this.pageCount++

      const result: RenderResult = {
        success: true,
        html: data.data?.html || data.html,
        markdown: data.data?.markdown || data.markdown,
        links: data.data?.links || data.links || [],
        screenshot: data.data?.screenshot || data.screenshot,
        metadata: data.data?.metadata || data.metadata,
        renderTimeMs: Date.now() - startTime
      }

      this.currentHtml = result.html || ''
      this.cachedRender.set(cacheKey, result)
      recordSuccess(circuitKey)

      console.log(`[HeadlessScraper] Rendered ${url} in ${result.renderTimeMs}ms`)
      return result

    } catch (error) {
      recordFailure(circuitKey)
      console.error('[HeadlessScraper] Render error:', error)
      
      // Fallback to direct fetch
      return this.fallbackFetch(url, startTime)
    }
  }

  /**
   * Fallback: Direct HTML fetch without JS rendering
   */
  private async fallbackFetch(url: string, startTime: number): Promise<RenderResult> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const html = await response.text()
      this.currentHtml = html
      this.currentUrl = url
      this.pageCount++

      return {
        success: true,
        html,
        renderTimeMs: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        error: `Fallback fetch failed: ${error instanceof Error ? error.message : 'Unknown'}`,
        renderTimeMs: Date.now() - startTime
      }
    }
  }

  /**
   * Detect platform from URL
   */
  private detectPlatform(url: string): string {
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

  // ===========================================================================
  // EXTRACTION METHODS
  // ===========================================================================

  /**
   * Extract product title from multiple sources
   */
  extractTitle(): ExtractedField<string> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    // Priority 1: JSON-LD (highest confidence)
    const jsonLdTitle = this.extractFromJsonLd('name')
    if (jsonLdTitle) {
      return { value: jsonLdTitle, source: 'json-ld', confidence: 98 }
    }

    // Priority 2: OpenGraph
    const ogTitle = this.extractMetaContent('og:title')
    if (ogTitle) {
      return { value: this.cleanText(ogTitle), source: 'opengraph', confidence: 90 }
    }

    // Priority 3: Meta title
    const metaTitle = this.extractMetaContent('title') || this.extractTagContent('title')
    if (metaTitle) {
      return { value: this.cleanText(metaTitle), source: 'meta', confidence: 80 }
    }

    // Priority 4: DOM selectors (platform-specific)
    const domTitle = this.extractTitleFromDOM()
    if (domTitle) {
      return { value: domTitle, source: 'dom', confidence: 70 }
    }

    // Priority 5: H1
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    if (h1Match) {
      return { value: this.cleanText(h1Match[1]), source: 'dom', confidence: 60 }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Extract price from multiple sources
   */
  extractPrice(): ExtractedField<number> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    // Priority 1: JSON-LD
    const jsonLdPrice = this.extractFromJsonLd('offers.price') || 
                        this.extractFromJsonLd('offers.lowPrice')
    if (jsonLdPrice) {
      const price = parseFloat(jsonLdPrice)
      if (!isNaN(price)) {
        return { value: price, source: 'json-ld', confidence: 98, raw: jsonLdPrice }
      }
    }

    // Priority 2: Structured data (meta itemprop)
    const metaPrice = this.extractMetaContent('product:price:amount')
    if (metaPrice) {
      const price = parseFloat(metaPrice)
      if (!isNaN(price)) {
        return { value: price, source: 'structured', confidence: 90, raw: metaPrice }
      }
    }

    // Priority 3: Platform-specific DOM extraction
    const domPrice = this.extractPriceFromDOM()
    if (domPrice !== null) {
      return { value: domPrice.price, source: 'dom', confidence: 75, raw: domPrice.raw }
    }

    // Priority 4: Generic price patterns
    const genericPrice = this.extractGenericPrice()
    if (genericPrice !== null) {
      return { value: genericPrice.price, source: 'fallback', confidence: 50, raw: genericPrice.raw }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Extract currency
   */
  extractCurrency(): ExtractedField<string> {
    const html = this.currentHtml
    if (!html) return { value: 'USD', source: 'fallback', confidence: 50 }

    // JSON-LD
    const jsonLdCurrency = this.extractFromJsonLd('offers.priceCurrency')
    if (jsonLdCurrency) {
      return { value: jsonLdCurrency, source: 'json-ld', confidence: 98 }
    }

    // Meta
    const metaCurrency = this.extractMetaContent('product:price:currency')
    if (metaCurrency) {
      return { value: metaCurrency, source: 'meta', confidence: 90 }
    }

    // Detect from symbols in HTML
    if (html.includes('€')) return { value: 'EUR', source: 'dom', confidence: 70 }
    if (html.includes('£')) return { value: 'GBP', source: 'dom', confidence: 70 }
    if (html.includes('¥')) return { value: 'CNY', source: 'dom', confidence: 60 }
    
    return { value: 'USD', source: 'fallback', confidence: 50 }
  }

  /**
   * Extract images with high resolution preference
   */
  extractImages(highRes: boolean = true): ExtractedField<string[]> {
    const html = this.currentHtml
    if (!html) return { value: [], source: 'fallback', confidence: 0 }

    const images: string[] = []
    const seen = new Set<string>()

    // Priority 1: JSON-LD images
    const jsonLdImage = this.extractFromJsonLd('image')
    if (jsonLdImage) {
      const imgs = Array.isArray(jsonLdImage) ? jsonLdImage : [jsonLdImage]
      for (const img of imgs) {
        const url = typeof img === 'string' ? img : img?.url
        if (url && !seen.has(url)) {
          images.push(highRes ? this.upgradeToHighRes(url) : url)
          seen.add(url)
        }
      }
    }

    // Priority 2: OpenGraph images
    const ogImages = this.extractAllMetaContent('og:image')
    for (const img of ogImages) {
      if (!seen.has(img)) {
        images.push(highRes ? this.upgradeToHighRes(img) : img)
        seen.add(img)
      }
    }

    // Priority 3: Platform-specific image extraction
    const platformImages = this.extractPlatformImages()
    for (const img of platformImages) {
      if (!seen.has(img)) {
        images.push(highRes ? this.upgradeToHighRes(img) : img)
        seen.add(img)
      }
    }

    // Priority 4: Generic product images from DOM
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
    for (const match of imgMatches) {
      const src = match[1]
      if (this.isProductImage(src) && !seen.has(src)) {
        images.push(highRes ? this.upgradeToHighRes(src) : src)
        seen.add(src)
        if (images.length >= 20) break // Limit
      }
    }

    const confidence = images.length > 0 
      ? (jsonLdImage ? 95 : (ogImages.length > 0 ? 85 : 70))
      : 0

    return { 
      value: images.slice(0, 20), 
      source: jsonLdImage ? 'json-ld' : (ogImages.length > 0 ? 'opengraph' : 'dom'),
      confidence 
    }
  }

  /**
   * Extract description (cleaned HTML)
   */
  extractDescription(): ExtractedField<string> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    // Priority 1: JSON-LD
    const jsonLdDesc = this.extractFromJsonLd('description')
    if (jsonLdDesc) {
      return { value: this.cleanHtml(jsonLdDesc), source: 'json-ld', confidence: 95 }
    }

    // Priority 2: OpenGraph
    const ogDesc = this.extractMetaContent('og:description')
    if (ogDesc) {
      return { value: this.cleanHtml(ogDesc), source: 'opengraph', confidence: 85 }
    }

    // Priority 3: Meta description
    const metaDesc = this.extractMetaContent('description')
    if (metaDesc) {
      return { value: this.cleanHtml(metaDesc), source: 'meta', confidence: 75 }
    }

    // Priority 4: Platform-specific description extraction
    const platformDesc = this.extractDescriptionFromDOM()
    if (platformDesc) {
      return { value: platformDesc, source: 'dom', confidence: 65 }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Extract variants (requires clicking variant combos in real headless)
   * In Firecrawl mode, we extract from structured data
   */
  extractVariants(): ExtractedField<ProductVariant[]> {
    const html = this.currentHtml
    if (!html) return { value: [], source: 'fallback', confidence: 0 }

    const variants: ProductVariant[] = []

    // Extract from JSON-LD offers
    const jsonLdData = this.parseJsonLd()
    if (jsonLdData?.offers) {
      const offers = Array.isArray(jsonLdData.offers) ? jsonLdData.offers : [jsonLdData.offers]
      for (const offer of offers) {
        if (offer.sku || offer.name) {
          variants.push({
            id: offer.sku || `variant-${variants.length}`,
            name: offer.name || `Variant ${variants.length + 1}`,
            options: {},
            price: parseFloat(offer.price) || undefined,
            available: offer.availability?.includes('InStock') ?? true,
            sku: offer.sku
          })
        }
      }
    }

    // Platform-specific variant extraction
    const platformVariants = this.extractPlatformVariants()
    for (const v of platformVariants) {
      if (!variants.find(existing => existing.id === v.id)) {
        variants.push(v)
      }
    }

    const confidence = variants.length > 0 ? (jsonLdData?.offers ? 85 : 60) : 0
    return { value: variants, source: jsonLdData?.offers ? 'json-ld' : 'dom', confidence }
  }

  /**
   * Extract video URLs
   */
  extractVideoUrls(): ExtractedField<string[]> {
    const html = this.currentHtml
    if (!html) return { value: [], source: 'fallback', confidence: 0 }

    const videos: string[] = []
    const seen = new Set<string>()

    // OpenGraph video
    const ogVideo = this.extractMetaContent('og:video')
    if (ogVideo && !seen.has(ogVideo)) {
      videos.push(ogVideo)
      seen.add(ogVideo)
    }

    // Video tags
    const videoMatches = html.matchAll(/<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi)
    for (const match of videoMatches) {
      if (!seen.has(match[1])) {
        videos.push(match[1])
        seen.add(match[1])
      }
    }

    // Platform video patterns
    const platformPatterns: Record<string, RegExp[]> = {
      amazon: [
        /data-video-url=["']([^"']+)["']/gi,
        /"videoUrl"\s*:\s*"([^"]+)"/gi
      ],
      aliexpress: [
        /"videoUrl"\s*:\s*"([^"]+)"/gi,
        /data-video=["']([^"']+)["']/gi
      ],
      temu: [
        /"video"\s*:\s*"([^"]+)"/gi,
        /"videoUrl"\s*:\s*"([^"]+)"/gi
      ]
    }

    const patterns = platformPatterns[this.platform] || []
    for (const pattern of patterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const url = match[1]
        if (url && !seen.has(url) && (url.includes('mp4') || url.includes('video'))) {
          videos.push(url)
          seen.add(url)
        }
      }
    }

    return { 
      value: videos.slice(0, 5), 
      source: ogVideo ? 'opengraph' : 'dom',
      confidence: videos.length > 0 ? 75 : 0 
    }
  }

  /**
   * Extract reviews if accessible
   */
  extractReviews(): ExtractedField<ReviewData> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    const reviewData: ReviewData = {
      averageRating: 0,
      totalCount: 0
    }

    // JSON-LD aggregate rating
    const jsonLdData = this.parseJsonLd()
    if (jsonLdData?.aggregateRating) {
      const agg = jsonLdData.aggregateRating
      reviewData.averageRating = parseFloat(agg.ratingValue) || 0
      reviewData.totalCount = parseInt(agg.reviewCount || agg.ratingCount) || 0
      
      if (reviewData.averageRating > 0) {
        return { value: reviewData, source: 'json-ld', confidence: 95 }
      }
    }

    // Platform-specific extraction
    const platformReviews = this.extractPlatformReviews()
    if (platformReviews.averageRating > 0) {
      return { value: platformReviews, source: 'dom', confidence: 70 }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Extract brand
   */
  extractBrand(): ExtractedField<string> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    // JSON-LD
    const jsonLdBrand = this.extractFromJsonLd('brand.name') || this.extractFromJsonLd('brand')
    if (jsonLdBrand && typeof jsonLdBrand === 'string') {
      return { value: jsonLdBrand, source: 'json-ld', confidence: 95 }
    }

    // Meta
    const metaBrand = this.extractMetaContent('product:brand')
    if (metaBrand) {
      return { value: metaBrand, source: 'meta', confidence: 85 }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Extract SKU
   */
  extractSku(): ExtractedField<string> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }

    // JSON-LD
    const jsonLdSku = this.extractFromJsonLd('sku') || this.extractFromJsonLd('mpn')
    if (jsonLdSku) {
      return { value: jsonLdSku, source: 'json-ld', confidence: 95 }
    }

    // Platform-specific
    const patterns: Record<string, RegExp> = {
      amazon: /(?:ASIN|asin)["\s:]+["']?([A-Z0-9]{10})["']?/,
      aliexpress: /(?:productId|product_id)["\s:]+["']?(\d+)["']?/,
      ebay: /(?:itemId|item)["\s:]+["']?(\d+)["']?/
    }

    const pattern = patterns[this.platform]
    if (pattern) {
      const match = html.match(pattern)
      if (match) {
        return { value: match[1], source: 'dom', confidence: 80 }
      }
    }

    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Get full extraction result
   */
  async extractAll(): Promise<ExtractedProduct> {
    return {
      title: this.extractTitle(),
      price: this.extractPrice(),
      originalPrice: this.extractOriginalPrice(),
      currency: this.extractCurrency(),
      images: this.extractImages(true),
      description: this.extractDescription(),
      variants: this.extractVariants(),
      videoUrls: this.extractVideoUrls(),
      reviews: this.extractReviews(),
      brand: this.extractBrand(),
      sku: this.extractSku(),
      availability: this.extractAvailability(),
      rating: this.extractRating(),
      reviewCount: this.extractReviewCount(),
      category: this.extractCategory(),
      seller: this.extractSeller()
    }
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  private parseJsonLd(): any {
    const html = this.currentHtml
    const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    
    for (const match of matches) {
      try {
        const data = JSON.parse(match[1])
        
        // Handle array of schemas
        if (Array.isArray(data)) {
          const product = data.find(item => 
            item['@type'] === 'Product' || 
            item['@type']?.includes?.('Product')
          )
          if (product) return product
        }
        
        // Direct product
        if (data['@type'] === 'Product' || data['@type']?.includes?.('Product')) {
          return data
        }
        
        // Nested in @graph
        if (data['@graph']) {
          const product = data['@graph'].find((item: any) => 
            item['@type'] === 'Product' || 
            item['@type']?.includes?.('Product')
          )
          if (product) return product
        }
      } catch {
        // Continue to next script
      }
    }
    
    return null
  }

  private extractFromJsonLd(path: string): any {
    const data = this.parseJsonLd()
    if (!data) return null
    
    const parts = path.split('.')
    let current = data
    
    for (const part of parts) {
      if (current === null || current === undefined) return null
      current = current[part]
    }
    
    return current
  }

  private extractMetaContent(name: string): string | null {
    const html = this.currentHtml
    
    // Try property first
    const propertyMatch = html.match(
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i')
    )
    if (propertyMatch) return propertyMatch[1]
    
    // Try name
    const nameMatch = html.match(
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')
    ) || html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')
    )
    if (nameMatch) return nameMatch[1]
    
    return null
  }

  private extractAllMetaContent(property: string): string[] {
    const html = this.currentHtml
    const results: string[] = []
    
    const matches = html.matchAll(
      new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'gi')
    )
    
    for (const match of matches) {
      results.push(match[1])
    }
    
    return results
  }

  private extractTagContent(tag: string): string | null {
    const html = this.currentHtml
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
    return match ? match[1] : null
  }

  private cleanText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  private upgradeToHighRes(url: string): string {
    // Amazon high-res
    if (url.includes('amazon') || url.includes('ssl-images-amazon')) {
      return url.replace(/\._[A-Z]+\d+_\./, '._SL1500_.')
    }
    
    // AliExpress high-res
    if (url.includes('alicdn') || url.includes('aliexpress')) {
      return url.replace(/_\d+x\d+/, '').replace(/\.jpg_\d+x\d+/, '.jpg')
    }
    
    // Generic: remove size indicators
    return url
      .replace(/[?&]w=\d+/, '')
      .replace(/[?&]h=\d+/, '')
      .replace(/[?&]size=\w+/, '')
  }

  private isProductImage(src: string): boolean {
    const lowerSrc = src.toLowerCase()
    
    // Skip common non-product images
    const skipPatterns = [
      'sprite', 'icon', 'logo', 'avatar', 'banner', 'ad', 'advertisement',
      'pixel', 'tracking', '1x1', 'blank', 'spacer', 'loader', 'spinner',
      '.svg', '.gif', 'data:', 'base64'
    ]
    
    if (skipPatterns.some(p => lowerSrc.includes(p))) {
      return false
    }
    
    // Must be a valid URL
    if (!src.startsWith('http') && !src.startsWith('//')) {
      return false
    }
    
    // Prefer product-like patterns
    return lowerSrc.includes('product') || 
           lowerSrc.includes('images') ||
           lowerSrc.includes('cdn') ||
           lowerSrc.includes('media') ||
           lowerSrc.endsWith('.jpg') ||
           lowerSrc.endsWith('.png') ||
           lowerSrc.endsWith('.webp')
  }

  // Platform-specific extraction methods
  private extractTitleFromDOM(): string | null {
    const html = this.currentHtml
    
    const selectors: Record<string, RegExp> = {
      amazon: /id=["']productTitle["'][^>]*>([^<]+)</i,
      aliexpress: /class=["'][^"']*product-title[^"']*["'][^>]*>([^<]+)</i,
      temu: /class=["'][^"']*goods-name[^"']*["'][^>]*>([^<]+)</i,
      ebay: /class=["'][^"']*x-item-title[^"']*["'][^>]*>([^<]+)</i
    }
    
    const pattern = selectors[this.platform]
    if (pattern) {
      const match = html.match(pattern)
      if (match) return this.cleanText(match[1])
    }
    
    return null
  }

  private extractPriceFromDOM(): { price: number; raw: string } | null {
    const html = this.currentHtml
    
    // Platform-specific patterns
    const patterns: Record<string, RegExp[]> = {
      amazon: [
        /class=["'][^"']*a-price-whole["'][^>]*>([0-9,]+)/i,
        /"priceAmount"\s*:\s*([\d.]+)/i
      ],
      aliexpress: [
        /class=["'][^"']*product-price-value["'][^>]*>[^\d]*([\d.,]+)/i,
        /"discountPrice":\s*{\s*"minPrice":\s*([\d.]+)/i
      ],
      temu: [
        /class=["'][^"']*goods-price["'][^>]*>[^\d]*([\d.,]+)/i,
        /"salePrice":\s*([\d.]+)/i
      ]
    }
    
    const platformPatterns = patterns[this.platform] || []
    
    for (const pattern of platformPatterns) {
      const match = html.match(pattern)
      if (match) {
        const raw = match[1]
        const price = parseFloat(raw.replace(/,/g, ''))
        if (!isNaN(price) && price > 0) {
          return { price, raw }
        }
      }
    }
    
    return null
  }

  private extractGenericPrice(): { price: number; raw: string } | null {
    const html = this.currentHtml
    
    // Generic price patterns
    const patterns = [
      /\$\s*([\d,]+\.?\d*)/,
      /€\s*([\d,]+\.?\d*)/,
      /£\s*([\d,]+\.?\d*)/,
      /["']price["']\s*:\s*["']?([\d.]+)["']?/i
    ]
    
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const raw = match[1]
        const price = parseFloat(raw.replace(/,/g, ''))
        if (!isNaN(price) && price > 0 && price < 1000000) {
          return { price, raw }
        }
      }
    }
    
    return null
  }

  private extractPlatformImages(): string[] {
    const html = this.currentHtml
    const images: string[] = []
    
    const patterns: Record<string, RegExp[]> = {
      amazon: [
        /"hiRes"\s*:\s*"([^"]+)"/g,
        /"large"\s*:\s*"([^"]+)"/g
      ],
      aliexpress: [
        /"imagePathList"\s*:\s*\[([^\]]+)\]/,
        /data-src=["']([^"']+(?:jpg|png|webp)[^"']*)["']/g
      ],
      temu: [
        /"origin"\s*:\s*"([^"]+)"/g,
        /"image"\s*:\s*"([^"]+)"/g
      ]
    }
    
    const platformPatterns = patterns[this.platform] || []
    
    for (const pattern of platformPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        if (match[1].startsWith('http')) {
          images.push(match[1])
        }
      }
    }
    
    return images
  }

  private extractDescriptionFromDOM(): string | null {
    const html = this.currentHtml
    
    const patterns: Record<string, RegExp> = {
      amazon: /id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i,
      aliexpress: /class=["'][^"']*product-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      temu: /class=["'][^"']*goods-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    }
    
    const pattern = patterns[this.platform]
    if (pattern) {
      const match = html.match(pattern)
      if (match) {
        return this.cleanHtml(match[1]).slice(0, 5000)
      }
    }
    
    return null
  }

  private extractPlatformVariants(): ProductVariant[] {
    const html = this.currentHtml
    const variants: ProductVariant[] = []
    
    // Try to find variant data in JS state
    const statePatterns = [
      /"variations"\s*:\s*(\[[\s\S]*?\])/,
      /"skuList"\s*:\s*(\[[\s\S]*?\])/,
      /"variants"\s*:\s*(\[[\s\S]*?\])/
    ]
    
    for (const pattern of statePatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          const data = JSON.parse(match[1])
          if (Array.isArray(data)) {
            for (const item of data.slice(0, 50)) {
              variants.push({
                id: item.id || item.skuId || `var-${variants.length}`,
                name: item.name || item.skuName || `Variant ${variants.length + 1}`,
                options: item.options || {},
                price: parseFloat(item.price) || undefined,
                available: item.available !== false,
                sku: item.sku
              })
            }
          }
        } catch {
          // Continue
        }
      }
    }
    
    return variants
  }

  private extractPlatformReviews(): ReviewData {
    const html = this.currentHtml
    const data: ReviewData = { averageRating: 0, totalCount: 0 }
    
    const patterns: Record<string, { rating: RegExp; count: RegExp }> = {
      amazon: {
        rating: /(?:data-a-popover|id)=["']acrPopover["'][^>]*>[\s\S]*?([\d.]+)\s*out of/i,
        count: /([\d,]+)\s*(?:global\s+)?ratings/i
      },
      aliexpress: {
        rating: /(?:star-view|rating)[^>]*>[\s\S]*?([\d.]+)/i,
        count: /([\d,]+)\s*(?:reviews|评价)/i
      }
    }
    
    const config = patterns[this.platform]
    if (config) {
      const ratingMatch = html.match(config.rating)
      const countMatch = html.match(config.count)
      
      if (ratingMatch) {
        data.averageRating = parseFloat(ratingMatch[1]) || 0
      }
      if (countMatch) {
        data.totalCount = parseInt(countMatch[1].replace(/,/g, '')) || 0
      }
    }
    
    return data
  }

  private extractOriginalPrice(): ExtractedField<number> {
    const html = this.currentHtml
    if (!html) return { value: null, source: 'fallback', confidence: 0 }
    
    const patterns = [
      /(?:was|original|list)\s*(?:price)?[:\s]*[$€£]?\s*([\d,.]+)/i,
      /class=["'][^"']*(?:was-price|original-price|list-price)[^"']*["'][^>]*>[$€£]?\s*([\d,.]+)/i,
      /"listPrice"[:\s]*([\d.]+)/i
    ]
    
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match) {
        const price = parseFloat(match[1].replace(/,/g, ''))
        if (!isNaN(price) && price > 0) {
          return { value: price, source: 'dom', confidence: 70, raw: match[1] }
        }
      }
    }
    
    return { value: null, source: 'fallback', confidence: 0 }
  }

  private extractAvailability(): ExtractedField<string> {
    const jsonLd = this.extractFromJsonLd('offers.availability')
    if (jsonLd) {
      const status = jsonLd.includes('InStock') ? 'in_stock' : 
                     jsonLd.includes('OutOfStock') ? 'out_of_stock' : 'unknown'
      return { value: status, source: 'json-ld', confidence: 95 }
    }
    return { value: 'unknown', source: 'fallback', confidence: 0 }
  }

  private extractRating(): ExtractedField<number> {
    const jsonLd = this.extractFromJsonLd('aggregateRating.ratingValue')
    if (jsonLd) {
      const rating = parseFloat(jsonLd)
      if (!isNaN(rating)) {
        return { value: rating, source: 'json-ld', confidence: 95 }
      }
    }
    return { value: null, source: 'fallback', confidence: 0 }
  }

  private extractReviewCount(): ExtractedField<number> {
    const jsonLd = this.extractFromJsonLd('aggregateRating.reviewCount') ||
                   this.extractFromJsonLd('aggregateRating.ratingCount')
    if (jsonLd) {
      const count = parseInt(jsonLd)
      if (!isNaN(count)) {
        return { value: count, source: 'json-ld', confidence: 95 }
      }
    }
    return { value: null, source: 'fallback', confidence: 0 }
  }

  private extractCategory(): ExtractedField<string> {
    const jsonLd = this.extractFromJsonLd('category')
    if (jsonLd) {
      return { value: typeof jsonLd === 'string' ? jsonLd : jsonLd[0], source: 'json-ld', confidence: 90 }
    }
    
    const metaCat = this.extractMetaContent('product:category')
    if (metaCat) {
      return { value: metaCat, source: 'meta', confidence: 80 }
    }
    
    return { value: null, source: 'fallback', confidence: 0 }
  }

  private extractSeller(): ExtractedField<string> {
    const jsonLd = this.extractFromJsonLd('offers.seller.name')
    if (jsonLd) {
      return { value: jsonLd, source: 'json-ld', confidence: 90 }
    }
    return { value: null, source: 'fallback', confidence: 0 }
  }

  /**
   * Get scraper stats
   */
  getStats(): { pageCount: number; platform: string; url: string } {
    return {
      pageCount: this.pageCount,
      platform: this.platform,
      url: this.currentUrl
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createHeadlessScraper(ctx: GatewayContext): HeadlessScraper {
  return new HeadlessScraper(ctx)
}
