import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface IncomingReview {
  author?: string
  customer_name?: string
  name?: string
  rating: number | null
  body?: string
  comment?: string
  text?: string
  title?: string
  date?: string
  review_date?: string
  images?: string[]
  country?: string
  verified_purchase?: boolean
  verified?: boolean
  helpful_count?: number
  external_id?: string
}

interface ImportRequest {
  source: 'extension' | 'url' | 'csv' | 'json' | 'amazon' | 'aliexpress' | 'trustpilot' | 'tiktok'
  platform?: string
  product_id?: string
  reviews?: IncomingReview[]
  data?: IncomingReview[]
  apiUrl?: string
}

// ── URL-based review extraction ──────────────────────────────────────

function extractAmazonReviews(html: string): IncomingReview[] {
  const reviews: IncomingReview[] = []
  const reviewPattern = /<div[^>]*data-hook="review"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi
  for (const match of html.matchAll(reviewPattern)) {
    const block = match[1]
    const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*(?:out of|sur)\s*5/i)
    const titleMatch = block.match(/data-hook="review-title"[^>]*>([^<]+)/i)
    const commentMatch = block.match(/data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/i)
    const authorMatch = block.match(/class="a-profile-name"[^>]*>([^<]+)/i)
    const comment = commentMatch ? commentMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    if (comment || titleMatch) {
      reviews.push({
        author: authorMatch?.[1]?.trim() || 'Client Amazon',
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 5,
        title: titleMatch?.[1]?.trim() || '',
        body: comment,
        verified: block.toLowerCase().includes('verified purchase') || block.toLowerCase().includes('achat vérifié'),
        images: Array.from(block.matchAll(/src="([^"]+(?:jpg|jpeg|png|webp)[^"]*)"/gi)).map(m => m[1]).slice(0, 5),
      })
    }
  }
  return reviews
}

function extractAliExpressReviews(html: string): IncomingReview[] {
  const reviews: IncomingReview[] = []
  const jsonMatch = html.match(/window\.__INIT_DATA__\s*=\s*({[\s\S]*?});/)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      const feedbacks = data?.feedbackModule?.feedbackList || []
      for (const fb of feedbacks) {
        reviews.push({
          author: fb.buyerName || 'Client AliExpress',
          rating: fb.buyerEval || 5,
          body: fb.buyerFeedback || '',
          date: fb.evalDate || null,
          images: fb.images || [],
          verified: true,
        })
      }
    } catch { /* ignore */ }
  }
  return reviews
}

function extractGenericReviews(html: string): IncomingReview[] {
  const reviews: IncomingReview[] = []
  const patterns = [
    /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
  ]
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const ratingMatch = match[1].match(/(\d+(?:\.\d+)?)\s*(?:\/\s*5|out of 5|stars?|étoiles?)/i)
      if (text.length > 30) {
        reviews.push({ author: 'Client', rating: ratingMatch ? Math.min(5, parseFloat(ratingMatch[1])) : 5, body: text.substring(0, 1000) })
      }
    }
    if (reviews.length > 0) break
  }
  return reviews
}

async function fetchAndExtractReviews(url: string): Promise<IncomingReview[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  })
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  const html = await response.text()
  if (url.includes('amazon')) return extractAmazonReviews(html)
  if (url.includes('aliexpress')) return extractAliExpressReviews(html)
  return extractGenericReviews(html)
}

// ── Normalize reviews ────────────────────────────────────────────────

function normalizeReview(r: IncomingReview, platform: string, userId: string, productId?: string | null) {
  return {
    user_id: userId,
    product_id: productId || null,
    rating: Math.min(5, Math.max(1, r.rating ?? 5)),
    text: (r.body || r.comment || r.text || '').substring(0, 5000),
    author: (r.author || r.customer_name || r.name || 'Client').substring(0, 200),
    review_date: r.review_date || r.date || new Date().toISOString().split('T')[0],
    country: r.country?.substring(0, 50) || null,
    helpful_count: r.helpful_count ?? 0,
    verified_purchase: r.verified_purchase ?? r.verified ?? false,
    images: (r.images || []).filter((u: string) => typeof u === 'string' && u.startsWith('http')).slice(0, 10),
    source_url: null,
    source_platform: platform || 'unknown',
    external_id: r.external_id || null,
  }
}

// ── Main handler ─────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('authorization')
    const extensionToken = req.headers.get('x-extension-token')

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    })

    let userId: string | null = null

    // JWT auth
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    // Extension token auth
    if (!userId && extensionToken) {
      const { data: tokenData } = await supabase.rpc('validate_extension_token', { p_token: extensionToken })
      if (tokenData?.success) userId = tokenData.user?.id
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: ImportRequest = await req.json()
    const platform = body.platform || body.source || 'unknown'

    // URL extraction mode — return reviews for preview
    if (body.source === 'url' && body.apiUrl) {
      const extracted = await fetchAndExtractReviews(body.apiUrl)
      return new Response(
        JSON.stringify({ success: true, reviews: extracted, count: extracted.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Direct reviews import
    const rawReviews = body.reviews || body.data || []
    if (!Array.isArray(rawReviews) || rawReviews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun avis fourni' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const rows = rawReviews.slice(0, 200).map(r => normalizeReview(r, platform, userId!, body.product_id))

    console.log(`Importing ${rows.length} reviews from ${body.source}/${platform} for user ${userId}`)

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data, error } = await adminClient
      .from('product_reviews')
      .insert(rows)
      .select('id')

    if (error) {
      console.error('Insert error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log activity
    await adminClient.from('activity_logs').insert({
      user_id: userId,
      action: 'extension_review_import',
      description: `Import de ${data?.length || 0} avis via ${body.source}`,
      details: { source: body.source, platform, count: data?.length || 0 },
      source: 'extension',
    })

    return new Response(
      JSON.stringify({ success: true, imported: data?.length || 0, total_submitted: rawReviews.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
