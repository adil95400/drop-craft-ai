/**
 * AI Product Research — Unified AI Client
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'
import { callOpenAI } from '../_shared/ai-client.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { query, niche, budget_range, target_market } = await req.json()
    if (!query && !niche) throw new Error('query ou niche requis')

    const [productsRes, ordersRes] = await Promise.all([
      supabase.from('products').select('category, price, profit_margin').limit(50),
      supabase.from('orders').select('total_amount, status').limit(30),
    ])

    const existingCategories = [...new Set((productsRes.data || []).map((p: any) => p.category).filter(Boolean))]
    const avgPrice = productsRes.data?.length ? (productsRes.data.reduce((s: number, p: any) => s + (p.price || 0), 0) / productsRes.data.length).toFixed(2) : 'N/A'

    const result = await callOpenAI(
      [
        { role: 'system', content: 'Tu es un expert en recherche de produits e-commerce et dropshipping.' },
        { role: 'user', content: `Recherche produits pour: "${query || niche}"\nMarché: ${target_market || 'France / Europe'}\nBudget: ${budget_range || '10-80€'}\nCatégories existantes: ${existingCategories.join(', ') || 'aucune'}\nPrix moyen: ${avgPrice}€\n\nTrouve 5 opportunités avec scores demande/potentiel (0-100). Marge > 30%, demande prouvée, concurrence modérée.` }
      ],
      {
        module: 'product',
        temperature: 0.5,
        maxTokens: 2500,
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
                marketing_angles: { type: 'array', items: { type: 'string' } },
                keywords: { type: 'array', items: { type: 'string' } }
              },
              required: ['niche_analysis', 'product_opportunities', 'marketing_angles', 'keywords']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'product_research_results' } },
      }
    )

    let research: any
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall) {
      research = JSON.parse(toolCall.function.arguments)
    } else {
      const content = result.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      research = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No structured result' }
    }

    await supabase.from('ai_generations').insert({
      user_id: userId, target_type: 'research', target_id: userId,
      task: 'product_research', provider: 'openai', model: 'gpt-4o-mini',
      input_json: { query, niche, budget_range, target_market },
      output_json: research, language: 'fr'
    }).catch(() => {})

    return successResponse({ research }, corsHeaders)
  } catch (err) {
    if (err instanceof Response) return err
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message, getSecureCorsHeaders(req.headers.get('origin')), (err as any).status || 500)
  }
})
