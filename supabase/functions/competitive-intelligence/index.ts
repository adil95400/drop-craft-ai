import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured')

    const { action, product_url, category, competitor_urls } = await req.json()

    const aiCall = async (systemPrompt: string, userPrompt: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      })

      if (!response.ok) {
        if (response.status === 429) throw new Error('Limite de requêtes atteinte, réessayez dans quelques instants')
        if (response.status === 402) throw new Error('Crédits IA épuisés, veuillez recharger')
        throw new Error(`AI error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    }

    const systemPrompt = 'Tu es un expert en intelligence concurrentielle e-commerce et dropshipping. Réponds UNIQUEMENT en JSON valide.'

    switch (action) {
      case 'analyze_product': {
        const result = await aiCall(systemPrompt, `Analyse concurrentielle approfondie du produit à cette URL: ${product_url}

Retourne ce JSON EXACT:
{
  "product_url": "${product_url}",
  "estimated_monthly_sales": 2500,
  "estimated_revenue": 75000,
  "market_saturation_score": 0.55,
  "competition_level": "medium",
  "price_position": "competitive",
  "trend_direction": "growing",
  "predicted_growth": "+15% next 30 days",
  "competitors_count": 35,
  "avg_competitor_price": 42.50,
  "social_mentions": 5200,
  "ad_activity": { "facebook_ads": 12, "google_ads": 8, "tiktok_ads": 25 }
}

Fournis des estimations réalistes.`)

        return new Response(
          JSON.stringify({ success: true, analysis: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'estimate_sales': {
        const result = await aiCall(systemPrompt, `Estime les ventes pour le produit: ${product_url}

Retourne ce JSON:
{
  "daily_estimate": 80,
  "weekly_estimate": 560,
  "monthly_estimate": 2400,
  "confidence_level": 0.78,
  "factors": { "search_volume": "high", "social_engagement": "medium", "competitor_pricing": "competitive", "seasonality": "favorable" },
  "prediction_model": "AI-based estimation"
}`)

        return new Response(
          JSON.stringify({ success: true, sales_data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'saturation_analysis': {
        const result = await aiCall(systemPrompt, `Analyse la saturation du marché pour la catégorie "${category}".

Retourne ce JSON:
{
  "category": "${category}",
  "saturation_score": 0.55,
  "market_size": "large",
  "barrier_to_entry": "medium",
  "top_players": 8,
  "new_entrants_last_30_days": 25,
  "recommendation": "Recommandation stratégique détaillée",
  "niches_available": ["Segment premium", "Variante éco-responsable", "Alternative budget"]
}`)

        return new Response(
          JSON.stringify({ success: true, saturation: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'price_intelligence': {
        const urls = competitor_urls || []
        const result = await aiCall(systemPrompt, `Analyse les prix concurrentiels pour ces URLs: ${JSON.stringify(urls)}

Retourne ce JSON:
{
  "competitor_prices": [${urls.map((_: string, i: number) => `{"url": "${urls[i] || ''}", "current_price": 39.99, "lowest_price_30d": 29.99, "highest_price_30d": 54.99, "price_changes_count": 5}`).join(',')}],
  "market_avg_price": 42.50,
  "recommended_price": 38.99,
  "price_positioning": "competitive"
}`)

        return new Response(
          JSON.stringify({ success: true, price_data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in competitive-intelligence:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
