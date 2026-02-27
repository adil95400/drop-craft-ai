/**
 * analyze-supplier — SECURED (P0)
 * 
 * Fixes:
 * - JWT auth via getClaims() (no more userId from body)
 * - ANON_KEY + JWT for RLS enforcement
 * - Secure CORS headers
 * - Rate limited: 20 analyses/hour
 * - URL validation
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limiter.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    // 1. JWT Auth
    const auth = await requireAuth(req)

    // 2. Rate limit
    const rateCheck = await checkRateLimit(auth.userId, 'analyze-supplier', 20, 60)
    if (!rateCheck.allowed) {
      return rateLimitResponse(auth.corsHeaders, 'Limite atteinte (20 analyses/heure).')
    }

    // 3. Parse & validate input
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid JSON body', auth.corsHeaders)
    }

    const { url } = body
    if (!url || typeof url !== 'string') {
      return errorResponse('URL is required', auth.corsHeaders)
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return errorResponse('Invalid URL format', auth.corsHeaders)
    }

    console.log(`[analyze-supplier] User ${auth.userId} analyzing: ${parsedUrl.hostname}`)

    // 4. Fetch supplier page
    const pageResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })

    if (!pageResponse.ok) {
      return errorResponse(`Failed to fetch supplier page: ${pageResponse.status}`, auth.corsHeaders)
    }

    const html = await pageResponse.text()

    // 5. AI analysis via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return errorResponse('AI service not configured', auth.corsHeaders, 500)
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: `You are a supplier analysis expert. Analyze the HTML content and extract supplier information.
Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "name": "supplier name",
  "country": "country code or name",
  "website": "website url",
  "description": "brief description",
  "product_categories": ["category1", "category2"],
  "estimated_products": number,
  "contact_email": "email if found or null",
  "contact_phone": "phone if found or null",
  "reliability_score": number between 0-5,
  "has_api": boolean,
  "shipping_countries": ["country1", "country2"]
}`,
          },
          {
            role: 'user',
            content: `Analyze this supplier website:\n\nURL: ${url}\n\nHTML excerpt (first 5000 chars):\n${html.substring(0, 5000)}`,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!aiResponse.ok) {
      const status = aiResponse.status
      await aiResponse.text() // consume body
      if (status === 429) return errorResponse('AI rate limit exceeded', auth.corsHeaders, 429)
      if (status === 402) return errorResponse('AI credits required', auth.corsHeaders, 402)
      return errorResponse(`AI analysis failed: ${status}`, auth.corsHeaders, 500)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0]?.message?.content || '{}'

    let supplierData: any
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim()
      supplierData = JSON.parse(cleanContent)
    } catch {
      return errorResponse('Failed to parse AI response', auth.corsHeaders, 500)
    }

    // 6. Insert via RLS-scoped client
    const { data: supplier, error: dbError } = await auth.supabase
      .from('suppliers')
      .insert({
        user_id: auth.userId,
        name: supplierData.name || 'Unknown Supplier',
        website: supplierData.website || url,
        country: supplierData.country,
        description: supplierData.description,
        status: 'active',
        rating: supplierData.reliability_score || 0,
        api_endpoint: supplierData.has_api ? url : null,
        contact_email: supplierData.contact_email,
        contact_phone: supplierData.contact_phone,
        product_count: supplierData.estimated_products || 0,
        tags: supplierData.product_categories || [],
        supplier_type: supplierData.has_api ? 'api' : 'manual',
        sector: supplierData.product_categories?.[0] || 'General',
      })
      .select()
      .single()

    if (dbError) {
      console.error('[analyze-supplier] DB error:', dbError)
      return errorResponse('Failed to save supplier', auth.corsHeaders, 500)
    }

    // 7. Log activity (best-effort)
    auth.supabase
      .from('activity_logs')
      .insert({
        user_id: auth.userId,
        action: 'supplier_analyzed',
        entity_type: 'supplier',
        entity_id: supplier.id,
        description: `Analyzed supplier: ${supplierData.name}`,
        source: 'edge_function',
      })
      .then(() => {})
      .catch((e: Error) => console.warn('Activity log failed:', e.message))

    return successResponse(
      {
        supplier,
        analysis: {
          name: supplierData.name,
          categories: supplierData.product_categories,
          estimated_products: supplierData.estimated_products,
          reliability_score: supplierData.reliability_score,
          has_api: supplierData.has_api,
        },
      },
      auth.corsHeaders
    )
  } catch (error) {
    if (error instanceof Response) return error
    console.error('[analyze-supplier] Error:', error)
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(
      error instanceof Error ? error.message : 'Internal error',
      getSecureCorsHeaders(req.headers.get('origin')),
      500
    )
  }
})
