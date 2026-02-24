/**
 * Winners Real Data — SECURED (JWT-first, RLS-enforced)
 * No more Math.random() mocks — uses real DB data only
 */
import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { category, limit = 20, forceRefresh = false } = await req.json()

    // Check cache (RLS-scoped via api_cache if it has user_id, otherwise shared)
    const cacheKey = `winners_real_${userId}_${category || 'all'}_${limit}`

    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('api_cache')
        .select('data, created_at')
        .eq('cache_key', cacheKey)
        .single()

      if (cached && new Date(cached.created_at).getTime() > Date.now() - 15 * 60 * 1000) {
        return successResponse(cached.data, corsHeaders)
      }
    }

    // RLS-scoped: get winner_products
    let winnerQuery = supabase
      .from('winner_products')
      .select('*')
      .order('virality_score', { ascending: false })
      .limit(50)

    if (category) {
      winnerQuery = winnerQuery.ilike('category', `%${category}%`)
    }

    const { data: winnerProducts } = await winnerQuery

    // RLS-scoped: get user's own products for scoring
    let productQuery = supabase
      .from('products')
      .select('id, title, name, category, price, cost_price, stock_quantity, rating, image_url, created_at, tags')
      .order('created_at', { ascending: false })
      .limit(100)

    if (category) {
      productQuery = productQuery.eq('category', category)
    }

    const { data: existingProducts } = await productQuery

    // Combine real data sources — NO random values
    const allWinners = [
      ...(winnerProducts || []).map(wp => ({
        id: wp.id,
        name: wp.product_name || 'Unknown',
        category: wp.category || 'General',
        score: wp.virality_score || 0,
        trend: wp.trending_score ? `+${Math.round(wp.trending_score)}%` : 'N/A',
        avgPrice: wp.price || 0,
        profit: wp.profit_margin || 0,
        competition: wp.competition_level || 'unknown',
        orders: wp.orders_count || 0,
        rating: wp.rating || 0,
        image: wp.image_url || '',
        source: wp.source_platform || 'unknown',
        socialProof: wp.social_proof || {},
        detectedAt: wp.detected_at || wp.created_at,
      })),
      ...(existingProducts || []).slice(0, 20).map(p => {
        let score = 50
        if ((p.stock_quantity || 0) > 0) score += 10
        if ((p.rating || 0) > 4) score += 15
        if ((p.price || 0) > 20 && (p.price || 0) < 100) score += 10
        if (p.tags?.length) score += 5

        return {
          id: p.id,
          name: p.title || p.name || 'Product',
          category: p.category || 'General',
          score,
          trend: 'N/A',
          avgPrice: p.price || 0,
          profit: p.cost_price ? (p.price || 0) - p.cost_price : 0,
          competition: 'unknown' as const,
          orders: 0,
          rating: p.rating || 0,
          image: p.image_url || '',
          source: 'catalog',
          socialProof: {},
          detectedAt: p.created_at,
        }
      }),
    ]

    const winners = allWinners
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const metrics = {
      totalWinners: winners.length,
      avgScore: winners.length > 0 ? Math.round(winners.reduce((acc, p) => acc + p.score, 0) / winners.length * 10) / 10 : 0,
      sources: {
        tiktok: winners.filter(w => w.source === 'tiktok').length,
        instagram: winners.filter(w => w.source === 'instagram').length,
        amazon: winners.filter(w => w.source === 'amazon').length,
        catalog: winners.filter(w => w.source === 'catalog').length,
      },
      categories: [...new Set(winners.map(w => w.category))],
      lastUpdated: new Date().toISOString(),
    }

    const response = { success: true, products: winners, metrics }

    // Cache result
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })

    return successResponse(response, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[winners-real-data] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error', products: [], metrics: null }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
