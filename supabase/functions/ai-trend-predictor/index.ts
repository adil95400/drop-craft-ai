/**
 * AI Trend Predictor — Unified AI Client
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'
import { callOpenAI } from '../_shared/ai-client.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { product_name, hashtags = [], category } = await req.json()
    if (!product_name) throw new Error('product_name requis')

    const [trendRes, viralRes, ordersRes] = await Promise.all([
      supabase.from('social_trends').select('*').in('hashtag', hashtags.length ? hashtags : ['_none_']).order('created_at', { ascending: false }).limit(30),
      supabase.from('viral_products').select('*').order('viral_score', { ascending: false }).limit(20),
      supabase.from('orders').select('total_amount, created_at').order('created_at', { ascending: false }).limit(50),
    ])

    const trends = trendRes.data || []
    const viralProducts = viralRes.data || []
    const orders = ordersRes.data || []
    const avgTrendScore = trends.length > 0 ? trends.reduce((s: number, t: any) => s + (t.trend_score || 0), 0) / trends.length : 50
    const recentRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0)

    const result = await callOpenAI(
      [
        { role: 'system', content: 'Tu es un analyste de tendances e-commerce expert. Réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: `Analyse la tendance pour "${product_name}".
Catégorie: ${category || 'N/A'}
Hashtags: ${hashtags.join(', ') || 'aucun'}
Score tendance moyen: ${avgTrendScore.toFixed(1)}/100
Produits viraux similaires: ${viralProducts.length}
Revenue récent: ${recentRevenue.toFixed(2)}€ sur ${orders.length} commandes
Date: ${new Date().toISOString().slice(0, 10)}

Retourne JSON: {current_trend_score, predicted_30d, predicted_60d, predicted_90d, trend_direction, momentum, seasonality, confidence, demand_level, saturation_risk, best_timing, recommendations, risk_factors}` }
      ],
      { module: 'marketing', temperature: 0.3, maxTokens: 1200, enableCache: true }
    )

    const content = result.choices?.[0]?.message?.content || ''
    let prediction: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { prediction = null }

    if (!prediction) {
      prediction = {
        current_trend_score: Math.round(avgTrendScore),
        predicted_30d: Math.min(100, Math.round(avgTrendScore * 1.1)),
        trend_direction: avgTrendScore > 60 ? 'rising' : 'stable',
        momentum: 'moderate', confidence: 0.6,
        demand_level: avgTrendScore > 70 ? 'high' : 'medium',
        recommendations: ['Analyser la concurrence', 'Préparer du contenu créatif'],
        risk_factors: ['Données insuffisantes']
      }
    }
    prediction.product_name = product_name

    return successResponse({ prediction }, corsHeaders)
  } catch (err) {
    if (err instanceof Response) return err
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message, getSecureCorsHeaders(req.headers.get('origin')), (err as any).status || 500)
  }
})
