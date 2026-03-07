/**
 * AI Campaign Generator — SECURED (JWT-first)
 * Generates complete marketing campaigns (email, social, ads) using Lovable AI
 */
import { requireAuth, handlePreflight, successResponse, errorResponse } from '../_shared/jwt-auth.ts'

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const { campaign_type, product_ids, goal, tone, platform, language } = await req.json()

    if (!campaign_type) throw new Error('campaign_type requis (email, social, ads, full)')

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('AI service not configured')

    // Get products context
    let products: any[] = []
    if (product_ids?.length) {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, category, image_urls, tags')
        .in('id', product_ids.slice(0, 5))
      products = data || []
    } else {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, category, image_urls, tags')
        .order('created_at', { ascending: false })
        .limit(3)
      products = data || []
    }

    if (!products.length) throw new Error('Aucun produit trouvé pour la campagne')

    const productContext = products.map((p: any) =>
      `- ${p.name} (${p.price}€) — ${p.category || 'Sans catégorie'} — ${p.description?.slice(0, 100) || 'Pas de description'}`
    ).join('\n')

    const aiResponse = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        tools: [{
          type: 'function',
          function: {
            name: 'generate_campaign',
            description: 'Generates a complete marketing campaign',
            parameters: {
              type: 'object',
              properties: {
                campaign_name: { type: 'string' },
                campaign_summary: { type: 'string' },
                email: {
                  type: 'object',
                  properties: {
                    subject_lines: { type: 'array', items: { type: 'string' } },
                    preview_text: { type: 'string' },
                    body_text: { type: 'string' },
                    cta_text: { type: 'string' },
                    send_timing: { type: 'string' }
                  }
                },
                social_posts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      platform: { type: 'string' },
                      text: { type: 'string' },
                      hashtags: { type: 'array', items: { type: 'string' } },
                      best_time: { type: 'string' },
                      content_type: { type: 'string' }
                    }
                  }
                },
                ad_creatives: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      platform: { type: 'string' },
                      headline: { type: 'string' },
                      primary_text: { type: 'string' },
                      description: { type: 'string' },
                      cta: { type: 'string' },
                      target_audience: { type: 'string' },
                      estimated_budget: { type: 'string' }
                    }
                  }
                },
                seo_keywords: { type: 'array', items: { type: 'string' } },
                timeline: { type: 'string' },
                estimated_reach: { type: 'string' },
                kpis: { type: 'array', items: { type: 'string' } }
              },
              required: ['campaign_name', 'campaign_summary']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_campaign' } },
        messages: [
          { role: 'system', content: `Tu es un expert en marketing digital e-commerce. Tu crées des campagnes marketing complètes, persuasives et optimisées pour la conversion. Langue: ${language || 'français'}. Ton: ${tone || 'professionnel et engageant'}.` },
          { role: 'user', content: `Crée une campagne marketing ${campaign_type === 'full' ? 'complète (email + social + ads)' : campaign_type}.

Objectif: ${goal || 'Augmenter les ventes'}
Plateforme prioritaire: ${platform || 'Multi-plateforme'}

Produits à promouvoir:
${productContext}

Génère du contenu prêt à utiliser avec des sujets accrocheurs, des CTA efficaces et des recommandations de ciblage.` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return errorResponse('Trop de requêtes IA', corsHeaders, 429)
      if (aiResponse.status === 402) return errorResponse('Crédits IA épuisés', corsHeaders, 402)
      throw new Error(`AI error: ${aiResponse.status}`)
    }

    const aiData = await aiResponse.json()
    
    let campaign: any
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall) {
      campaign = JSON.parse(toolCall.function.arguments)
    } else {
      const content = aiData.choices?.[0]?.message?.content || ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      campaign = jsonMatch ? JSON.parse(jsonMatch[0]) : { campaign_name: 'Campagne', campaign_summary: content }
    }

    // Log
    await supabase.from('ai_generations').insert({
      user_id: userId,
      target_type: 'campaign',
      target_id: userId,
      task: `generate_campaign_${campaign_type}`,
      provider: 'google',
      model: 'gemini-3-flash-preview',
      input_json: { campaign_type, goal, tone, product_ids },
      output_json: campaign,
      language: language || 'fr'
    }).catch(() => {})

    return successResponse({ campaign }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[ai-campaign-generator] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse((err as Error).message || 'Erreur interne', getSecureCorsHeaders(origin), 500)
  }
})
