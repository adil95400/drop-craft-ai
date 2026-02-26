/**
 * firecrawl-product-scraper — Scrapes product pages via Firecrawl
 * Extracts structured product data (title, price, images, description)
 * and saves to supplier_products for the Discovery Hub
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

    const { url } = await req.json()
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

    // Save to supplier_products
    const { data: saved, error: saveErr } = await auth.supabase
      .from('supplier_products')
      .insert({
        user_id: auth.userId,
        title: productData.title,
        description: productData.description || '',
        price: productData.price || 0,
        selling_price: productData.price ? Math.round(productData.price * 2.5 * 100) / 100 : 0,
        supplier_price: productData.price || 0,
        image_url: productData.images?.[0] || null,
        image_urls: productData.images || [],
        source: platform,
        source_platform: platform,
        source_url: url,
        category: productData.category || null,
        supplier_name: platform,
        stock_quantity: productData.stock ?? 100,
        rating: productData.rating || null,
        status: 'active',
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
