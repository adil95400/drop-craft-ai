import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PricingRequest {
  userId: string
  productIds?: string[]
  strategy?: 'competitive' | 'margin' | 'volume' | 'ai_optimal'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, productIds, strategy = 'ai_optimal' } = await req.json() as PricingRequest

    console.log(`Starting dynamic pricing optimization for user ${userId}`)

    // Get products with their history and performance
    let query = supabase
      .from('imported_products')
      .select(`
        id, name, price, cost_price, category, supplier_price,
        sku, stock_quantity, sales_velocity
      `)
      .eq('user_id', userId)
      .eq('status', 'published')

    if (productIds?.length) {
      query = query.in('id', productIds)
    }

    const { data: products, error } = await query.limit(50)
    if (error) throw error

    // Get market data and competitors
    const { data: catalogProducts } = await supabase
      .from('catalog_products')
      .select('name, price, category, competition_score')
      .in('category', [...new Set(products?.map(p => p.category) || [])])

    // Get historical order data for demand analysis
    const { data: orderHistory } = await supabase
      .from('orders')
      .select('items, total_amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate optimizations with real data
    const optimizations = products?.map(product => {
      const currentPrice = product.price
      const costPrice = product.cost_price || product.supplier_price || currentPrice * 0.6
      
      // Find similar products in catalog for competition analysis
      const competitors = catalogProducts?.filter(cp => 
        cp.category === product.category && 
        cp.name.toLowerCase().includes(product.name.toLowerCase().split(' ')[0])
      ) || []

      const avgCompetitorPrice = competitors.length > 0
        ? competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length
        : currentPrice

      const competitionScore = competitors.length > 0
        ? competitors.reduce((sum, c) => sum + (c.competition_score || 50), 0) / competitors.length
        : 50

      // Analyze demand from order history
      const productOrders = orderHistory?.filter(order => 
        JSON.stringify(order.items).includes(product.sku || product.name)
      ) || []

      const demandScore = Math.min(100, productOrders.length * 10)
      const avgOrderValue = productOrders.length > 0
        ? productOrders.reduce((sum, o) => sum + o.total_amount, 0) / productOrders.length
        : currentPrice

      // Calculate optimal price based on strategy
      let suggestedPrice = currentPrice
      let confidence = 50
      let reasoning = ''

      switch (strategy) {
        case 'competitive':
          suggestedPrice = avgCompetitorPrice * 0.97 // Slightly undercut
          confidence = Math.min(95, 60 + competitors.length * 5)
          reasoning = `Competitive pricing: ${competitors.length} competitors found with avg price ${avgCompetitorPrice.toFixed(2)}`
          break

        case 'margin':
          const targetMargin = competitionScore > 70 ? 1.45 : 1.35
          suggestedPrice = Math.max(costPrice * targetMargin, currentPrice * 0.95)
          confidence = 85
          reasoning = `Margin-focused: ${((suggestedPrice - costPrice) / costPrice * 100).toFixed(1)}% margin`
          break

        case 'volume':
          // Lower price if low demand, increase if high demand
          const demandAdjustment = demandScore > 50 ? 1.05 : 0.92
          suggestedPrice = currentPrice * demandAdjustment
          confidence = 70 + (demandScore / 10)
          reasoning = `Volume strategy: ${demandScore} demand score from ${productOrders.length} orders`
          break

        default: // ai_optimal
          // Balanced approach considering all factors
          const marketPosition = avgCompetitorPrice / currentPrice
          const profitability = (currentPrice - costPrice) / costPrice
          const demandFactor = Math.max(0.85, Math.min(1.15, demandScore / 50))
          
          if (marketPosition > 1.1 && profitability > 0.3) {
            // We're cheaper and profitable - increase price
            suggestedPrice = currentPrice * 1.08 * demandFactor
            reasoning = 'AI optimal: room to increase price while maintaining competitiveness'
          } else if (marketPosition < 0.9 && demandScore < 30) {
            // We're expensive and low demand - decrease price
            suggestedPrice = currentPrice * 0.92
            reasoning = 'AI optimal: reduce price to increase demand'
          } else {
            // Fine-tune based on multiple factors
            suggestedPrice = (avgCompetitorPrice * 0.4 + currentPrice * 0.4 + avgOrderValue * 0.2) * demandFactor
            reasoning = 'AI optimal: balanced pricing based on market, demand, and performance'
          }
          
          confidence = Math.min(95, 75 + (competitors.length * 2) + (productOrders.length * 1))
      }

      // Ensure minimum profitability
      suggestedPrice = Math.max(suggestedPrice, costPrice * 1.15)

      const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100
      const expectedRevenue = suggestedPrice * (product.stock_quantity || 10) * (demandScore / 100)
      
      return {
        productId: product.id,
        productName: product.name,
        currentPrice,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        priceChange: Math.round(priceChange * 100) / 100,
        confidence: Math.round(confidence),
        expectedRevenue: Math.round(expectedRevenue),
        reasoning,
        market_data: {
          competitors_count: competitors.length,
          avg_competitor_price: Math.round(avgCompetitorPrice * 100) / 100,
          competition_score: Math.round(competitionScore),
          demand_score: demandScore,
          recent_orders: productOrders.length
        }
      }
    }) || []

    console.log(`Generated ${optimizations.length} pricing optimizations using ${strategy} strategy`)

    // Log the optimization
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'pricing_optimization',
        entity_type: 'pricing_analysis',
        entity_id: crypto.randomUUID(),
        description: `Dynamic pricing optimization completed using ${strategy} strategy`,
        metadata: {
          strategy,
          products_analyzed: optimizations.length,
          total_potential_revenue: optimizations.reduce((sum, opt) => sum + opt.expectedRevenue, 0)
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        optimizations,
        summary: {
          totalProducts: products?.length || 0,
          strategy,
          potentialRevenue: optimizations.reduce((sum, opt) => sum + opt.expectedRevenue, 0),
          avgConfidence: Math.round(optimizations.reduce((sum, opt) => sum + opt.confidence, 0) / optimizations.length)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Dynamic pricing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
