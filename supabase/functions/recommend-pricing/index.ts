import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { productId, userId, strategy = 'balanced' } = await req.json()

    if (!productId || !userId) {
      throw new Error('productId and userId are required')
    }

    console.log(`Calculating pricing recommendation for product ${productId} with strategy: ${strategy}`)

    // Fetch product
    const [productsResult, importedResult] = await Promise.all([
      supabase.from('products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle(),
      supabase.from('imported_products').select('*').eq('id', productId).eq('user_id', userId).maybeSingle()
    ])

    const product = productsResult.data || importedResult.data

    if (!product) {
      throw new Error('Product not found')
    }

    // Get competitor prices (from same category)
    const { data: competitors } = await supabase
      .from('products')
      .select('price')
      .eq('category', product.category)
      .neq('id', productId)
      .gt('price', 0)
      .limit(100)

    const competitorPrices = competitors?.map(c => c.price) || []

    // Calculate recommendation based on strategy
    const recommendation = calculatePricingRecommendation(
      product,
      competitorPrices,
      strategy
    )

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: product.id,
          name: product.name,
          currentPrice: product.price,
          costPrice: product.cost_price
        },
        recommendation,
        analysis: analyzeCurrentPricing(product, competitorPrices)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in recommend-pricing:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function calculatePricingRecommendation(
  product: any,
  competitorPrices: number[],
  strategy: string
): any {
  const costPrice = product.cost_price || 0
  const currentPrice = product.price || 0

  if (costPrice === 0) {
    return {
      recommendedPrice: currentPrice,
      reason: 'Cannot calculate without cost price',
      minPrice: currentPrice * 0.9,
      maxPrice: currentPrice * 1.1,
      confidence: 0
    }
  }

  let recommendedPrice: number
  let minMargin: number
  let targetMargin: number

  switch (strategy) {
    case 'aggressive':
      // Low price, high volume strategy (25-35% margin)
      minMargin = 1.25
      targetMargin = 1.35
      recommendedPrice = costPrice * targetMargin
      break

    case 'premium':
      // High price, high margin strategy (50-70% margin)
      minMargin = 1.50
      targetMargin = 1.70
      recommendedPrice = costPrice * targetMargin
      break

    case 'competitive':
      // Match market average
      if (competitorPrices.length > 0) {
        const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
        recommendedPrice = avgCompetitorPrice * 0.98 // Slightly below average
      } else {
        recommendedPrice = costPrice * 1.40
      }
      minMargin = 1.30
      targetMargin = 1.45
      break

    case 'balanced':
    default:
      // Balanced approach (35-50% margin)
      minMargin = 1.35
      targetMargin = 1.50
      recommendedPrice = costPrice * targetMargin

      // Adjust based on competition
      if (competitorPrices.length > 5) {
        const sortedPrices = [...competitorPrices].sort((a, b) => a - b)
        const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)]
        
        // If our calculated price is too far from median, adjust
        if (recommendedPrice > medianPrice * 1.2) {
          recommendedPrice = medianPrice * 1.05
        } else if (recommendedPrice < medianPrice * 0.8) {
          recommendedPrice = medianPrice * 0.95
        }
      }
      break
  }

  // Ensure minimum margin
  recommendedPrice = Math.max(recommendedPrice, costPrice * minMargin)

  // Apply psychological pricing
  recommendedPrice = applyPsychologicalPricing(recommendedPrice)

  // Calculate price range
  const minPrice = Math.max(costPrice * minMargin, recommendedPrice * 0.90)
  const maxPrice = recommendedPrice * 1.15

  // Calculate confidence score
  const confidence = calculateConfidence(product, competitorPrices, recommendedPrice)

  return {
    recommendedPrice: roundPrice(recommendedPrice),
    minPrice: roundPrice(minPrice),
    maxPrice: roundPrice(maxPrice),
    strategy,
    margin: ((recommendedPrice - costPrice) / recommendedPrice * 100).toFixed(1),
    reason: generateRecommendationReason(strategy, product, competitorPrices),
    confidence,
    priceChange: currentPrice > 0 ? ((recommendedPrice - currentPrice) / currentPrice * 100).toFixed(1) : 0
  }
}

function analyzeCurrentPricing(product: any, competitorPrices: number[]): any {
  const currentPrice = product.price || 0
  const costPrice = product.cost_price || 0

  if (currentPrice === 0 || costPrice === 0) {
    return { status: 'insufficient_data' }
  }

  const currentMargin = ((currentPrice - costPrice) / currentPrice) * 100

  let status: string
  let issues: string[] = []
  let opportunities: string[] = []

  // Analyze margin
  if (currentMargin < 20) {
    status = 'too_low'
    issues.push('Margin is too low (< 20%)')
    opportunities.push('Increase price to improve profitability')
  } else if (currentMargin > 70) {
    status = 'too_high'
    issues.push('Margin may be too high (> 70%)')
    opportunities.push('Consider lowering price to increase sales volume')
  } else if (currentMargin >= 35 && currentMargin <= 50) {
    status = 'optimal'
  } else {
    status = 'acceptable'
  }

  // Compare with competitors
  if (competitorPrices.length > 0) {
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
    const pricePosition = (currentPrice / avgCompetitorPrice - 1) * 100

    if (pricePosition > 20) {
      issues.push('Price is significantly higher than competitors (+' + pricePosition.toFixed(0) + '%)')
      opportunities.push('Consider price reduction to stay competitive')
    } else if (pricePosition < -20) {
      opportunities.push('Price is much lower than competitors - could increase margin')
    }
  }

  return {
    status,
    currentMargin: currentMargin.toFixed(1),
    issues,
    opportunities,
    competitorCount: competitorPrices.length
  }
}

function applyPsychologicalPricing(price: number): number {
  const rounded = Math.round(price)

  if (rounded < 10) {
    // For very low prices, use .99
    return rounded - 0.01
  } else if (rounded < 100) {
    // For mid-range prices, use .99
    return rounded - 0.01
  } else if (rounded < 500) {
    // For higher prices, use .95
    const tens = Math.round(rounded / 10) * 10
    return tens - 0.05
  } else {
    // For very high prices, round to nearest 10
    return Math.round(rounded / 10) * 10
  }
}

function calculateConfidence(product: any, competitorPrices: number[], recommendedPrice: number): number {
  let confidence = 50 // Base confidence

  // More competitor data increases confidence
  if (competitorPrices.length >= 10) confidence += 20
  else if (competitorPrices.length >= 5) confidence += 10

  // Product has good data increases confidence
  if (product.description?.length > 100) confidence += 10
  if (product.view_count > 50) confidence += 10
  if (product.conversion_rate > 2) confidence += 10

  // Reasonable margin increases confidence
  const costPrice = product.cost_price || 0
  if (costPrice > 0) {
    const margin = ((recommendedPrice - costPrice) / recommendedPrice) * 100
    if (margin >= 30 && margin <= 60) confidence += 10
  }

  return Math.min(confidence, 100)
}

function generateRecommendationReason(strategy: string, product: any, competitorPrices: number[]): string {
  const reasons: string[] = []

  switch (strategy) {
    case 'aggressive':
      reasons.push('Maximiser le volume de ventes avec un prix compétitif')
      break
    case 'premium':
      reasons.push('Positionner le produit comme haut de gamme')
      break
    case 'competitive':
      reasons.push('Aligner sur les prix du marché')
      break
    case 'balanced':
      reasons.push('Équilibrer marge et compétitivité')
      break
  }

  if (competitorPrices.length > 0) {
    reasons.push(`Basé sur ${competitorPrices.length} concurrents`)
  }

  const costPrice = product.cost_price || 0
  if (costPrice > 0) {
    reasons.push(`Coût de revient: ${costPrice.toFixed(2)}€`)
  }

  return reasons.join('. ')
}

function roundPrice(price: number): number {
  return Math.round(price * 100) / 100
}
