/**
 * Ad Spy Scanner — SECURED (JWT-first, RLS-enforced)
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const {
      action, keyword, platform = 'all',
      category = '', min_days_running = 0,
      sort_by = 'engagement', limit = 20
    } = await req.json()

    console.log('Ad spy action:', action, { keyword, platform, category })

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured')

    // Check cache
    const cacheKey = `adspy_${action}_${keyword}_${platform}_${category}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 30 * 60 * 1000) {
      return successResponse(cached.data, corsHeaders)
    }

    let result: any
    switch (action) {
      case 'search_ads':
        result = await searchAds(keyword, platform, category, limit, lovableApiKey); break
      case 'trending_ads':
        result = await getTrendingAds(platform, category, limit, lovableApiKey); break
      case 'analyze_competitor':
        result = await analyzeCompetitor(keyword, lovableApiKey); break
      case 'spy_product':
        result = await spyProduct(keyword, lovableApiKey); break
      default:
        throw new Error('Unknown action')
    }

    // Cache result (RLS-scoped via user's client)
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })

    return successResponse(result, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[ad-spy-scanner] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 400, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

async function aiCall(apiKey: string, system: string, prompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-5-mini',
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      temperature: 0.8,
    }),
  })
  if (!response.ok) throw new Error('AI API error')
  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
}

async function searchAds(keyword: string, platform: string, category: string, limit: number, apiKey: string) {
  const platformFilter = platform !== 'all' ? ` sur ${platform}` : ' sur Facebook, Instagram et TikTok'
  const prompt = `Tu es un expert ad spy. Génère ${limit} résultats de publicités réalistes pour "${keyword}"${category ? ` catégorie ${category}` : ''}${platformFilter}. Retourne JSON: { "ads": [...] } avec advertiser_name, product_name, platform, ad_copy, cta_type, first_seen, days_running, likes, comments, shares, engagement_rate, estimated_daily_spend, target_countries, winning_score, saturation_level, profit_potential.`

  const parsed = await aiCall(apiKey, "Tu es un outil d'ad spy professionnel.", prompt)

  const ads = (parsed.ads || []).map((ad: any, i: number) => ({
    id: `ad_${Date.now()}_${i}`, platform: ad.platform || 'Facebook',
    advertiser_name: ad.advertiser_name || 'Unknown', product_name: ad.product_name || `Product ${i + 1}`,
    product_image: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    ad_creative: ad.ad_copy || '', landing_page: `https://shop.example.com/products/${i}`,
    first_seen: ad.first_seen || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    last_seen: new Date().toISOString().split('T')[0],
    days_running: ad.days_running || 30, likes: ad.likes || 1000, comments: ad.comments || 100,
    shares: ad.shares || 50, engagement_rate: ad.engagement_rate || 5,
    estimated_daily_spend: ad.estimated_daily_spend || 500, target_countries: ad.target_countries || ['FR'],
    target_demographics: ad.target_demographics || '25-54', ad_copy: ad.ad_copy || '',
    cta_type: ad.cta_type || 'Shop Now', winning_score: ad.winning_score || 75,
    saturation_level: ad.saturation_level || 'medium', profit_potential: ad.profit_potential || 50
  }))
  ads.sort((a: any, b: any) => b.winning_score - a.winning_score)

  return { ads, meta: { total: ads.length, keyword, platform, category, timestamp: new Date().toISOString() } }
}

async function getTrendingAds(platform: string, category: string, limit: number, apiKey: string) {
  const prompt = `Génère ${limit} publicités tendance${platform !== 'all' ? ` sur ${platform}` : ''}${category ? ` catégorie ${category}` : ''}. Retourne JSON: { "trending_ads": [...] }`
  const parsed = await aiCall(apiKey, 'Expert en veille publicitaire.', prompt)
  return {
    ads: (parsed.trending_ads || []).map((ad: any, i: number) => ({ ...ad, id: `trend_${Date.now()}_${i}` })),
    meta: { total: parsed.trending_ads?.length || 0, platform, category, type: 'trending' }
  }
}

async function analyzeCompetitor(name: string, apiKey: string) {
  const prompt = `Analyse le profil publicitaire de "${name}". Retourne JSON avec "competitor_analysis".`
  return await aiCall(apiKey, 'Analyste compétitif expert.', prompt)
}

async function spyProduct(name: string, apiKey: string) {
  const prompt = `Analyse complète du produit "${name}" pour le dropshipping. Retourne JSON avec "product_spy".`
  return await aiCall(apiKey, 'Expert analyse produits dropshipping.', prompt)
}
