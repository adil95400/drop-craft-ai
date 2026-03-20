/**
 * AI Trend Predictor — SECURED (JWT-first)
 * Uses Lovable AI for real trend analysis and demand prediction
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

const AI_GATEWAY_URL = 'https://api.openai.com/v1/chat/completions'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { product_name, hashtags = [], category } = await req.json()

    if (!product_name) throw new Error('product_name requis')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('AI service not configured')

    // Fetch real data for context
    const [trendRes, viralRes, ordersRes] = await Promise.all([
      supabase.from('social_trends').select('*').in('hashtag', hashtags.length ? hashtags : ['_none_']).order('created_at', { ascending: false }).limit(30),
      supabase.from('viral_products').select('*').order('viral_score', { ascending: false }).limit(20),
      supabase.from('orders').select('total_amount, created_at').order('created_at', { ascending: false }).limit(50),
    ])

    const trends = trendRes.data || []
    const viralProducts = viralRes.data || []
    const orders = ordersRes.data || []

    // Deterministic signals
    const avgTrendScore = trends.length > 0 
      ? trends.reduce((s: number, t: any) => s + (t.trend_score || 0), 0) / trends.length 
      : 50
    const recentRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0)

    // Call AI for deep analysis
    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `Tu es un analyste de tendances e-commerce expert. Analyse les signaux de marché et prédit la trajectoire d'un produit. Réponds UNIQUEMENT en JSON valide.` },
          { role: 'user', content: `Analyse la tendance pour le produit "${product_name}".
Catégorie: ${category || 'N/A'}
Hashtags associés: ${hashtags.join(', ') || 'aucun'}

Données contextuelles:
- Score tendance moyen: ${avgTrendScore.toFixed(1)}/100
- Produits viraux similaires trouvés: ${viralProducts.length}
- Revenue récent vendeur: ${recentRevenue.toFixed(2)}€ sur ${orders.length} commandes
- Date actuelle: ${new Date().toISOString().slice(0, 10)}

Retourne ce JSON:
{
  "current_trend_score": <0-100>,
  "predicted_30d": <0-100>,
  "predicted_60d": <0-100>,
  "predicted_90d": <0-100>,
  "trend_direction": "rising"|"peak"|"declining"|"stable",
  "momentum": "slow"|"moderate"|"fast"|"viral",
  "seasonality": "<string ou null>",
  "confidence": <0.0-1.0>,
  "demand_level": "low"|"medium"|"high"|"explosive",
  "saturation_risk": "low"|"medium"|"high",
  "best_timing": "<string>",
  "recommendations": ["<5 recommandations actionnables>"],
  "risk_factors": ["<facteurs de risque>"]
}` }
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return errorResponse('Trop de requêtes IA', corsHeaders, 429)
      if (aiResponse.status === 402) return errorResponse('Crédits IA épuisés', corsHeaders, 402)
      throw new Error(`AI error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content || ''

    let prediction: any
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch { prediction = null }

    if (!prediction) {
      // Fallback deterministic
      prediction = {
        current_trend_score: Math.round(avgTrendScore),
        predicted_30d: Math.min(100, Math.round(avgTrendScore * 1.1)),
        predicted_60d: Math.min(100, Math.round(avgTrendScore * 1.15)),
        predicted_90d: Math.min(100, Math.round(avgTrendScore * 1.1)),
        trend_direction: avgTrendScore > 60 ? 'rising' : 'stable',
        momentum: 'moderate',
        seasonality: null,
        confidence: 0.6,
        demand_level: avgTrendScore > 70 ? 'high' : 'medium',
        saturation_risk: 'medium',
        best_timing: 'Dans les 2 prochaines semaines',
        recommendations: ['Analyser la concurrence avant de lancer', 'Préparer du contenu créatif'],
        risk_factors: ['Données insuffisantes pour une prédiction précise']
      }
    }

    prediction.product_name = product_name

    return successResponse({ prediction }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[ai-trend-predictor] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message || 'Erreur interne', getSecureCorsHeaders(origin), 500)
  }
})
