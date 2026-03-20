/**
 * AI Product Research — SECURED (JWT-first)
 * Automated market research: analyzes a niche/keyword and returns actionable product opportunities
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

const AI_GATEWAY_URL = 'https://api.openai.com/v1/chat/completions'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { query, niche, budget_range, target_market } = await req.json()

    if (!query && !niche) throw new Error('query ou niche requis')

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY_PRODUCT') || Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) throw new Error('AI service not configured')

    // Get user context
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('category, price, profit_margin').limit(50),
      supabase.from('orders').select('total_amount, status').limit(30),
    ])

    const existingCategories = [...new Set((productsRes.data || []).map((p: any) => p.category).filter(Boolean))]
    const avgPrice = productsRes.data?.length 
      ? (productsRes.data.reduce((s: number, p: any) => s + (p.price || 0), 0) / productsRes.data.length).toFixed(2) 
      : 'N/A'

    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{
          type: 'function',
          function: {
            name: 'product_research_results',
            description: 'Returns structured product research results',
            parameters: {
              type: 'object',
              properties: {
                niche_analysis: {
                  type: 'object',
                  properties: {
                    niche_name: { type: 'string' },
                    market_size: { type: 'string', enum: ['small', 'medium', 'large', 'massive'] },
                    competition_level: { type: 'string', enum: ['low', 'medium', 'high', 'saturated'] },
                    growth_trend: { type: 'string', enum: ['declining', 'stable', 'growing', 'exploding'] },
                    entry_difficulty: { type: 'string', enum: ['easy', 'moderate', 'hard'] },
                    summary: { type: 'string' }
                  },
                  required: ['niche_name', 'market_size', 'competition_level', 'growth_trend', 'entry_difficulty', 'summary']
                },
                product_opportunities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      category: { type: 'string' },
                      estimated_price_range: { type: 'string' },
                      estimated_margin: { type: 'string' },
                      demand_score: { type: 'number' },
                      competition_score: { type: 'number' },
                      winning_score: { type: 'number' },
                      target_audience: { type: 'string' },
                      selling_points: { type: 'array', items: { type: 'string' } },
                      risks: { type: 'array', items: { type: 'string' } },
                      recommended_platforms: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['name', 'category', 'estimated_price_range', 'demand_score', 'winning_score', 'selling_points']
                  }
                },
                marketing_angles: {
                  type: 'array',
                  items: { type: 'string' }
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['niche_analysis', 'product_opportunities', 'marketing_angles', 'keywords']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'product_research_results' } },
        messages: [
          { role: 'system', content: `Tu es un expert en recherche de produits e-commerce et dropshipping. Tu analyses les tendances du marché pour identifier les meilleures opportunités de produits avec un fort potentiel de vente.` },
          { role: 'user', content: `Recherche de produits pour: "${query || niche}"
Marché cible: ${target_market || 'France / Europe'}
Budget: ${budget_range || '10-80€ par produit'}
Catégories existantes du vendeur: ${existingCategories.join(', ') || 'aucune'}
Prix moyen actuel: ${avgPrice}€

Trouve 5 opportunités de produits avec des scores de demande et de potentiel (0-100).
Favorise les produits avec une marge > 30%, une demande prouvée et une concurrence modérée.` }
        ],
        temperature: 0.5,
        max_tokens: 2500,
      }),
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return errorResponse('Trop de requêtes IA', corsHeaders, 429)
      if (aiResponse.status === 402) return errorResponse('Crédits IA épuisés', corsHeaders, 402)
      throw new Error(`AI error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    
    let result: any
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments)
    } else {
      const content = aiData.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No structured result' }
    }

    // Log research
    await supabase.from('ai_generations').insert({
      user_id: userId,
      target_type: 'research',
      target_id: userId,
      task: 'product_research',
      provider: 'openai',
      model: 'gpt-5-nano',
      input_json: { query, niche, budget_range, target_market },
      output_json: result,
      language: 'fr'
    }).catch(() => {})

    return successResponse({ research: result }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[ai-product-research] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message || 'Erreur interne', getSecureCorsHeaders(origin), 500)
  }
})
