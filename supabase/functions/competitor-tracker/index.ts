import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CompetitorTrackRequest {
  userId: string
  productId: string
  myPrice: number
  competitors: Array<{
    name: string
    url?: string
    price: number
    shippingCost?: number
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, productId, myPrice, competitors } = await req.json() as CompetitorTrackRequest

    console.log(`Tracking ${competitors.length} competitors for product ${productId}`)

    const results = []
    
    for (const competitor of competitors) {
      const totalPrice = competitor.price + (competitor.shippingCost || 0)
      const priceDifference = myPrice - totalPrice
      const priceDifferencePercent = totalPrice > 0 ? (priceDifference / totalPrice * 100) : 0

      const { data, error } = await supabase
        .from('competitor_prices')
        .insert({
          user_id: userId,
          product_id: productId,
          competitor_name: competitor.name,
          competitor_url: competitor.url,
          competitor_price: competitor.price,
          shipping_cost: competitor.shippingCost || 0,
          price_difference: priceDifference,
          price_difference_percent: priceDifferencePercent
        })
        .select()
        .single()

      if (error) {
        console.error(`Error tracking competitor ${competitor.name}:`, error)
      } else {
        results.push(data)
      }
    }

    // Analyse de positionnement
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length
    const minCompetitorPrice = Math.min(...competitors.map(c => c.price))
    const maxCompetitorPrice = Math.max(...competitors.map(c => c.price))

    const positioning = myPrice < minCompetitorPrice ? 'lowest' :
                       myPrice > maxCompetitorPrice ? 'highest' :
                       myPrice < avgCompetitorPrice ? 'below_average' :
                       myPrice > avgCompetitorPrice ? 'above_average' : 'average'

    // Recommandations stratégiques
    const recommendations = []
    
    if (positioning === 'highest') {
      recommendations.push({
        type: 'warning',
        message: `Votre prix (${myPrice}€) est le plus élevé. Considérez baisser pour rester compétitif.`,
        suggestedPrice: avgCompetitorPrice * 1.05
      })
    }
    
    if (positioning === 'lowest') {
      recommendations.push({
        type: 'opportunity',
        message: `Votre prix (${myPrice}€) est le plus bas. Vous pouvez augmenter tout en restant compétitif.`,
        suggestedPrice: avgCompetitorPrice * 0.95
      })
    }
    
    const priceGap = maxCompetitorPrice - minCompetitorPrice
    if (priceGap > avgCompetitorPrice * 0.3) {
      recommendations.push({
        type: 'insight',
        message: 'Grand écart de prix entre concurrents. Marché fragmenté, opportunité de positionnement.'
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracked: results.length,
        analysis: {
          your_price: myPrice,
          min_competitor_price: minCompetitorPrice,
          max_competitor_price: maxCompetitorPrice,
          avg_competitor_price: Math.round(avgCompetitorPrice * 100) / 100,
          positioning,
          price_gap: Math.round(priceGap * 100) / 100,
          market_position_percent: avgCompetitorPrice > 0 ? Math.round((myPrice / avgCompetitorPrice * 100) - 100) : 0
        },
        recommendations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Competitor tracking error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})