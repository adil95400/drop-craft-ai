/**
 * winning-products-aggregator — Fetches and enriches winning products
 * Secured with JWT auth, uses RLS-scoped queries
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireAuth(req)
    const { action, filters = {}, limit = 50, sort_by = 'ai_score' } = await req.json()

    console.log('[WINNING-PRODUCTS-AGGREGATOR] Request:', { action, filters, limit, sort_by })

    if (action === 'get_top_winners') {
      // Fetch from winner_products table (public table with product data)
      let query = auth.supabase
        .from('winner_products')
        .select('*')

      // Apply filters
      if (filters.category) {
        query = query.ilike('product_name', `%${filters.category}%`)
      }
      if (filters.minScore) {
        query = query.gte('virality_score', filters.minScore)
      }
      if (filters.maxRisk) {
        const riskLevels: Record<string, string[]> = {
          'low': ['low'],
          'medium': ['low', 'medium'],
          'high': ['low', 'medium', 'high']
        }
        query = query.in('competition_level', riskLevels[filters.maxRisk] || ['low', 'medium', 'high'])
      }
      if (filters.priceRange) {
        if (filters.priceRange.min) query = query.gte('price', filters.priceRange.min)
        if (filters.priceRange.max) query = query.lte('price', filters.priceRange.max)
      }
      if (filters.socialTrending) {
        query = query.gte('trending_score', 70)
      }

      // Apply sorting
      const sortColumn = sort_by === 'ai_score' ? 'virality_score' : sort_by
      query = query.order(sortColumn, { ascending: false }).limit(limit)

      const { data: products, error } = await query

      if (error) {
        console.error('[WINNING-PRODUCTS-AGGREGATOR] Query error:', error)
        throw error
      }

      // Enrich with computed intelligence fields
      const enrichedProducts = (products || []).map(product => ({
        ...product,
        product_id: product.id,
        name: product.product_name,
        ai_score: product.virality_score || 0,
        profit_potential: product.estimated_profit_margin || 0,
        risk_level: product.competition_level || 'medium',
        market_demand: product.trending_score || 0,
        competition_level: product.competition_level || 'medium',
        saturation_score: product.competition_level === 'high' ? 80 : product.competition_level === 'medium' ? 50 : 20,
        trend_momentum: product.trending_score || 0,
        social_proof: product.social_proof || {},
        projected_roi: (product.estimated_profit_margin || 0) * 2,
        estimated_daily_sales: Math.floor((product.orders_count || 0) / 30),
        break_even_point: product.price ? Math.ceil(100 / (product.price * ((product.estimated_profit_margin || 30) / 100))) : 0,
        market_opportunity_size: product.engagement_count || 0,
        competitor_count: product.competitor_analysis?.competitor_count || 0,
        price_positioning: (product.price || 0) < 30 ? 'budget' : (product.price || 0) < 80 ? 'mid' : 'premium',
        differentiation_score: product.virality_score || 0,
        recommended_actions: product.detection_signals || [],
        optimal_launch_timing: product.trending_score >= 80 ? 'immediate' : 'within_week',
        suggested_pricing: {
          min: (product.price || 0) * 1.8,
          optimal: (product.price || 0) * 2.5,
          max: (product.price || 0) * 3.5
        },
        last_analyzed: product.detected_at || new Date().toISOString(),
        data_sources: [product.source_platform].filter(Boolean),
        confidence_level: product.virality_score ? Math.min(95, product.virality_score + 10) : 50,
      }))

      console.log('[WINNING-PRODUCTS-AGGREGATOR] Success:', enrichedProducts.length, 'products')

      return successResponse({
        success: true,
        products: enrichedProducts,
        meta: {
          total: enrichedProducts.length,
          filters_applied: filters,
          sort_by,
          timestamp: new Date().toISOString()
        }
      }, auth.corsHeaders)
    }

    return errorResponse('Unknown action: ' + action, auth.corsHeaders, 400)

  } catch (error) {
    if (error instanceof Response) return error
    console.error('[WINNING-PRODUCTS-AGGREGATOR] Error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(
      error instanceof Error ? error.message : 'Erreur interne',
      getSecureCorsHeaders(origin),
      500
    )
  }
})
