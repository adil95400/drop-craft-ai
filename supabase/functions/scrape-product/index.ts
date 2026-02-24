/**
 * scrape-product — SECURED (P0)
 * 
 * Changes from legacy:
 * - JWT auth via getClaims() (no more userId from body)
 * - Supabase client uses ANON_KEY + JWT for RLS enforcement
 * - Rate limited: 30 scrapes/hour per user
 * - Secure CORS headers
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limiter.ts'
import { logConsumption } from '../_shared/consumption.ts'

Deno.serve(async (req) => {
  // CORS preflight
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    // 1. Authenticate via JWT
    const auth = await requireAuth(req)

    // 2. Rate limit: 30 scrapes/hour
    const rateCheck = await checkRateLimit(auth.userId, 'scrape-product', 30, 60)
    if (!rateCheck.allowed) {
      return rateLimitResponse(auth.corsHeaders, 'Limite de scraping atteinte (30/heure). Réessayez plus tard.')
    }

    // 3. Parse & validate input
    const { url } = await req.json()
    if (!url || typeof url !== 'string') {
      return errorResponse('URL is required', auth.corsHeaders)
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return errorResponse('Invalid URL format', auth.corsHeaders)
    }

    console.log(`[scrape-product] User ${auth.userId} scraping: ${url}`)

    // 4. Fetch the page
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })

    if (!response.ok) {
      return errorResponse(`Failed to fetch URL: ${response.status}`, auth.corsHeaders)
    }

    const html = await response.text()

    // 5. Extract product data
    const productData = extractProductData(html, url)

    // 6. Create job via RLS-scoped client (user_id auto-enforced)
    const { data: importJob, error: jobError } = await auth.supabase
      .from('jobs')
      .insert({
        user_id: auth.userId,
        job_type: 'scraping',
        job_subtype: 'url',
        status: 'running',
        name: `Scrape: ${url}`,
        started_at: new Date().toISOString(),
        input_data: { source_url: url },
        total_items: 1,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return errorResponse('Failed to create import job', auth.corsHeaders, 500)
    }

    // 7. Insert scraped product via RLS-scoped client
    const { data: product, error: productError } = await auth.supabase
      .from('imported_products')
      .insert({
        user_id: auth.userId,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: productData.currency,
        image_urls: productData.image_urls,
        source_url: productData.source_url,
        status: 'draft',
        ai_optimized: false,
      })
      .select()
      .single()

    if (productError) {
      await auth.supabase
        .from('jobs')
        .update({
          status: 'failed',
          failed_items: 1,
          error_message: productError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importJob.id)

      return errorResponse('Failed to save product', auth.corsHeaders, 500)
    }

    // 8. Mark job completed
    await auth.supabase
      .from('jobs')
      .update({
        status: 'completed',
        processed_items: 1,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJob.id)

    // 9. Track consumption (best-effort, non-blocking)
    logConsumption(auth.supabase, {
      userId: auth.userId,
      action: 'scraping',
      metadata: { job_id: importJob.id, source_url: url },
    }).catch((e: Error) => console.warn('Consumption log failed:', e.message))

    return successResponse({ product, jobId: importJob.id }, auth.corsHeaders)
  } catch (error) {
    // If error is already a Response (from requireAuth), return it directly
    if (error instanceof Response) return error

    console.error('scrape-product error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(
      error instanceof Error ? error.message : 'Internal error',
      getSecureCorsHeaders(origin),
      500
    )
  }
})

// ── Extraction helpers ──────────────────────────────────────

function extractProductData(html: string, url: string) {
  return {
    name: extractMetaTag(html, 'og:title') || extractTitle(html),
    description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '',
    price: extractPrice(html),
    currency: 'EUR',
    image_urls: extractImages(html),
    source_url: url,
    scraped_at: new Date().toISOString(),
  }
}

function extractMetaTag(content: string, property: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    'i'
  )
  const match = content.match(regex)
  return match ? match[1] : null
}

function extractTitle(content: string): string {
  const match = content.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim() : 'Produit sans titre'
}

function extractPrice(content: string): number {
  const patterns = [
    /€\s*(\d+[,.]?\d*)/,
    /(\d+[,.]?\d*)\s*€/,
    /\$\s*(\d+[.,]?\d*)/,
    /(\d+[.,]?\d*)\s*\$/,
    /"price"[^>]*>(\d+[.,]?\d*)/i,
  ]
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(price)) return price
    }
  }
  return 0
}

function extractImages(content: string): string[] {
  const images: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    const imgUrl = match[1]
    if (imgUrl.startsWith('http') && !imgUrl.includes('logo') && !imgUrl.includes('icon')) {
      images.push(imgUrl)
    }
  }
  return images.slice(0, 5)
}
