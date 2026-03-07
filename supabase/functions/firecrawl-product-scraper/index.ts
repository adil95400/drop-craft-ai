/**
 * firecrawl-product-scraper — Scrapes product pages via Firecrawl
 * Extracts structured product data (title, price, images, description)
 * AI-enriches with tags, SEO description, and category via Lovable AI
 * Saves to supplier_products for the Discovery Hub
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limiter.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireAuth(req)

    // Rate limit: 20 scrapes/hour
    const rateCheck = await checkRateLimit(auth.userId, 'firecrawl-scraper', 20, 60)
    if (!rateCheck.allowed) {
      return rateLimitResponse(auth.corsHeaders, 'Limite de scraping atteinte (20/heure).')
    }

    const { url, enrich = true } = await req.json()
    if (!url || typeof url !== 'string') {
      return errorResponse('URL requise', auth.corsHeaders)
    }

    try { new URL(url) } catch {
      return errorResponse('Format d\'URL invalide', auth.corsHeaders)
    }

    // Try Firecrawl first, fallback to basic fetch
    const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('FIRECRAWL_API_KEY_1')
    let productData: any

    if (FIRECRAWL_KEY) {
      console.log('[firecrawl-scraper] Using Firecrawl for:', url)
      productData = await scrapeWithFirecrawl(url, FIRECRAWL_KEY)
    } else {
      console.log('[firecrawl-scraper] Firecrawl not configured, using basic fetch for:', url)
      productData = await scrapeBasic(url)
    }

    if (!productData.title) {
      return errorResponse('Impossible d\'extraire les données produit de cette URL', auth.corsHeaders, 422)
    }

    // Detect platform from URL
    const platform = detectPlatform(url)

    // AI Enrichment (tags, SEO description, category)
    let aiEnrichment: any = {}
    if (enrich) {
      aiEnrichment = await enrichWithAI(productData, platform)
    }

    // Calculate winning product score
    const winningScore = calculateWinningScore(productData, aiEnrichment)

    // Save to supplier_products
    const { data: saved, error: saveErr } = await auth.supabase
      .from('supplier_products')
      .insert({
        user_id: auth.userId,
        title: productData.title,
        description: aiEnrichment.seo_description || productData.description || '',
        price: productData.price || 0,
        selling_price: productData.price ? Math.round(productData.price * 2.5 * 100) / 100 : 0,
        supplier_price: productData.price || 0,
        image_url: productData.images?.[0] || null,
        image_urls: productData.images || [],
        source: platform,
        source_platform: platform,
        source_url: url,
        category: aiEnrichment.category || productData.category || null,
        supplier_name: platform,
        stock_quantity: productData.stock ?? 100,
        rating: productData.rating || null,
        status: 'active',
        tags: aiEnrichment.tags || [],
        metadata: {
          original_description: productData.description,
          ai_enriched: enrich,
          winning_score: winningScore,
          ai_tags: aiEnrichment.tags || [],
          ai_category: aiEnrichment.category || null,
          seo_title: aiEnrichment.seo_title || null,
          profit_estimate: productData.price ? {
            cost: productData.price,
            suggested_sell: Math.round(productData.price * 2.5 * 100) / 100,
            margin_pct: 60,
          } : null,
        },
      })
      .select()
      .single()

    if (saveErr) {
      console.error('Save error:', saveErr)
      return errorResponse('Erreur lors de la sauvegarde: ' + saveErr.message, auth.corsHeaders, 500)
    }

    return successResponse({
      product: saved,
      extracted: productData,
      ai_enrichment: aiEnrichment,
      winning_score: winningScore,
      source: FIRECRAWL_KEY ? 'firecrawl' : 'basic',
    }, auth.corsHeaders)

  } catch (error) {
    if (error instanceof Response) return error
    console.error('firecrawl-scraper error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(
      error instanceof Error ? error.message : 'Erreur interne',
      getSecureCorsHeaders(origin),
      500
    )
  }
})

// ── AI Enrichment via Lovable AI ────────────────────────────

async function enrichWithAI(productData: any, platform: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  if (!LOVABLE_API_KEY) {
    console.warn('[firecrawl-scraper] LOVABLE_API_KEY not configured, skipping AI enrichment')
    return {}
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a product data enrichment AI for an e-commerce platform. Return structured data only via the provided tool.'
          },
          {
            role: 'user',
            content: `Enrich this product from ${platform}:\nTitle: ${productData.title}\nDescription: ${(productData.description || '').slice(0, 500)}\nPrice: ${productData.price} ${productData.currency}\nCategory: ${productData.category || 'unknown'}`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'enrich_product',
            description: 'Return enriched product metadata',
            parameters: {
              type: 'object',
              properties: {
                tags: { type: 'array', items: { type: 'string' }, description: '5-8 relevant product tags in French for SEO and categorization' },
                category: { type: 'string', description: 'Best matching category in French (e.g. Électronique, Mode, Maison)' },
                seo_title: { type: 'string', description: 'Optimized SEO title in French, max 60 chars' },
                seo_description: { type: 'string', description: 'Compelling product description in French for e-commerce, max 160 chars' },
                target_audience: { type: 'string', description: 'Primary target audience in French' },
                seasonality: { type: 'string', enum: ['evergreen', 'seasonal_summer', 'seasonal_winter', 'seasonal_spring', 'trending', 'holiday'], description: 'Product seasonality' },
              },
              required: ['tags', 'category', 'seo_title', 'seo_description'],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'enrich_product' } },
      }),
    })

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        console.warn(`[firecrawl-scraper] AI enrichment rate limited (${response.status})`)
        return {}
      }
      console.error('[firecrawl-scraper] AI enrichment error:', response.status)
      return {}
    }

    const data = await response.json()
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments)
    }
    return {}
  } catch (error) {
    console.error('[firecrawl-scraper] AI enrichment failed:', error)
    return {}
  }
}

// ── Winning Product Score ───────────────────────────────────

function calculateWinningScore(productData: any, aiData: any): number {
  let score = 0

  // Price sweet spot (10-80€ = best for dropshipping)
  const price = productData.price || 0
  if (price >= 10 && price <= 80) score += 25
  else if (price > 80 && price <= 150) score += 15
  else if (price > 0) score += 5

  // Has images
  score += Math.min(20, (productData.images?.length || 0) * 5)

  // Has good rating
  if (productData.rating && productData.rating >= 4) score += 15
  else if (productData.rating && productData.rating >= 3) score += 8

  // Has description
  if (productData.description && productData.description.length > 50) score += 10

  // AI enrichment succeeded (product is categorizable)
  if (aiData.category) score += 10
  if (aiData.tags?.length >= 5) score += 5

  // Evergreen products score higher
  if (aiData.seasonality === 'evergreen') score += 10
  else if (aiData.seasonality === 'trending') score += 15

  return Math.min(100, score)
}

// ── Firecrawl extraction ────────────────────────────────────

async function scrapeWithFirecrawl(url: string, apiKey: string) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: [
        'markdown',
        { type: 'json', prompt: 'Extract the product information: title, description, price (number), currency, category, rating (number 0-5), stock/availability, and all product image URLs. Return as JSON with keys: title, description, price, currency, category, rating, stock, images (array of URLs).' }
      ],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 402) {
      console.error('Firecrawl: insufficient credits')
      throw new Error('Crédits Firecrawl insuffisants. Veuillez recharger votre compte Firecrawl.')
    }
    console.error('Firecrawl API error:', data)
    throw new Error(data.error || `Firecrawl error: ${response.status}`)
  }

  // Extract from JSON response
  const jsonData = data.data?.json || data.json || {}
  const metadata = data.data?.metadata || data.metadata || {}

  return {
    title: jsonData.title || metadata.title || '',
    description: jsonData.description || metadata.description || '',
    price: parseFloat(jsonData.price) || 0,
    currency: jsonData.currency || 'EUR',
    category: jsonData.category || null,
    rating: parseFloat(jsonData.rating) || null,
    stock: typeof jsonData.stock === 'number' ? jsonData.stock : (jsonData.stock === false ? 0 : 100),
    images: (jsonData.images || []).filter((u: string) => u && u.startsWith('http')).slice(0, 8),
  }
}

// ── Basic fetch fallback ────────────────────────────────────

async function scrapeBasic(url: string) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  })
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  const html = await response.text()

  return {
    title: extractMeta(html, 'og:title') || extractTitle(html),
    description: extractMeta(html, 'og:description') || extractMeta(html, 'description') || '',
    price: extractPrice(html),
    currency: 'EUR',
    category: null,
    rating: null,
    stock: 100,
    images: extractImages(html),
  }
}

function extractMeta(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
  return m?.[1] || null
}

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
}

function extractPrice(html: string): number {
  for (const p of [/€\s*(\d+[,.]?\d*)/, /(\d+[,.]?\d*)\s*€/, /\$\s*(\d+[.,]?\d*)/, /(\d+[.,]?\d*)\s*\$/]) {
    const m = html.match(p)
    if (m) { const v = parseFloat(m[1].replace(',', '.')); if (!isNaN(v)) return v }
  }
  return 0
}

function extractImages(html: string): string[] {
  const imgs: string[] = []
  let m; const re = /<img[^>]+src=["']([^"']+)["']/gi
  while ((m = re.exec(html)) !== null) {
    if (m[1].startsWith('http') && !m[1].includes('logo') && !m[1].includes('icon')) imgs.push(m[1])
  }
  return imgs.slice(0, 5)
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('aliexpress')) return 'AliExpress'
  if (u.includes('amazon')) return 'Amazon'
  if (u.includes('ebay')) return 'eBay'
  if (u.includes('temu')) return 'Temu'
  if (u.includes('alibaba') || u.includes('1688')) return 'Alibaba'
  if (u.includes('cjdropshipping')) return 'CJ Dropshipping'
  if (u.includes('shopify') || u.includes('myshopify')) return 'Shopify'
  if (u.includes('etsy')) return 'Etsy'
  return 'Web'
}
