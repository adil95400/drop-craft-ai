/**
 * Dynamic Pricing Optimizer — SECURED (JWT-first, RLS-enforced)
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { productIds, strategy = 'ai_optimal' } = await req.json()

    console.log(`Starting dynamic pricing optimization for user ${userId}`)

    let query = supabase
      .from('imported_products')
      .select('id, name, price, cost_price, category, supplier_price, sku, stock_quantity, sales_velocity')
      .eq('user_id', userId)
      .eq('status', 'published')

    if (productIds?.length) {
      query = query.in('id', productIds)
    }

    const { data: products, error } = await query.limit(50)
    if (error) throw error

    // Get market data
    const categories = [...new Set(products?.map((p: any) => p.category).filter(Boolean) || [])]
    const { data: catalogProducts } = categories.length > 0
      ? await supabase.from('catalog_products').select('name, price, category, competition_score').in('category', categories)
      : { data: [] }

    // Get order history for demand analysis
    const { data: orderHistory } = await supabase
      .from('orders')
      .select('items, total_amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())

    const optimizations = (products || []).map((product: any) => {
      const currentPrice = product.price
      const costPrice = product.cost_price || product.supplier_price || currentPrice * 0.6

      const competitors = (catalogProducts || []).filter((cp: any) =>
        cp.category === product.category &&
        cp.name?.toLowerCase().includes(product.name?.toLowerCase().split(' ')[0])
      )

      const avgCompetitorPrice = competitors.length > 0
        ? competitors.reduce((sum: number, c: any) => sum + c.price, 0) / competitors.length
        : currentPrice

      const competitionScore = competitors.length > 0
        ? competitors.reduce((sum: number, c: any) => sum + (c.competition_score || 50), 0) / competitors.length
        : 50

      const productOrders = (orderHistory || []).filter((order: any) =>
        JSON.stringify(order.items).includes(product.sku || product.name)
      )

      const demandScore = Math.min(100, productOrders.length * 10)
      const avgOrderValue = productOrders.length > 0
        ? productOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0) / productOrders.length
        : currentPrice

      let suggestedPrice = currentPrice
      let confidence = 50
      let reasoning = ''

      switch (strategy) {
        case 'competitive':
          suggestedPrice = avgCompetitorPrice * 0.97
          confidence = Math.min(95, 60 + competitors.length * 5)
          reasoning = `Competitive: ${competitors.length} competitors, avg ${avgCompetitorPrice.toFixed(2)}`
          break
        case 'margin': {
          const targetMargin = competitionScore > 70 ? 1.45 : 1.35
          suggestedPrice = Math.max(costPrice * targetMargin, currentPrice * 0.95)
          confidence = 85
          reasoning = `Margin: ${((suggestedPrice - costPrice) / costPrice * 100).toFixed(1)}%`
          break
        }
        case 'volume': {
          const demandAdj = demandScore > 50 ? 1.05 : 0.92
          suggestedPrice = currentPrice * demandAdj
          confidence = 70 + (demandScore / 10)
          reasoning = `Volume: demand ${demandScore} from ${productOrders.length} orders`
          break
        }
        default: {
          const marketPosition = avgCompetitorPrice / currentPrice
          const profitability = (currentPrice - costPrice) / costPrice
          const demandFactor = Math.max(0.85, Math.min(1.15, demandScore / 50))
          if (marketPosition > 1.1 && profitability > 0.3) {
            suggestedPrice = currentPrice * 1.08 * demandFactor
            reasoning = 'AI optimal: room to increase price'
          } else if (marketPosition < 0.9 && demandScore < 30) {
            suggestedPrice = currentPrice * 0.92
            reasoning = 'AI optimal: reduce price for demand'
          } else {
            suggestedPrice = (avgCompetitorPrice * 0.4 + currentPrice * 0.4 + avgOrderValue * 0.2) * demandFactor
            reasoning = 'AI optimal: balanced pricing'
          }
          confidence = Math.min(95, 75 + (competitors.length * 2) + (productOrders.length * 1))
        }
      }

      suggestedPrice = Math.max(suggestedPrice, costPrice * 1.15)
      const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100

      return {
        productId: product.id,
        productName: product.name,
        currentPrice,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        priceChange: Math.round(priceChange * 100) / 100,
        confidence: Math.round(confidence),
        expectedRevenue: Math.round(suggestedPrice * (product.stock_quantity || 10) * (demandScore / 100)),
        reasoning,
        market_data: {
          competitors_count: competitors.length,
          avg_competitor_price: Math.round(avgCompetitorPrice * 100) / 100,
          competition_score: Math.round(competitionScore),
          demand_score: demandScore,
          recent_orders: productOrders.length
        }
      }
    })

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'pricing_optimization',
      entity_type: 'pricing_analysis',
      entity_id: crypto.randomUUID(),
      description: `Dynamic pricing: ${strategy} strategy, ${optimizations.length} products`,
      metadata: { strategy, products_analyzed: optimizations.length }
    })

    return successResponse({
      success: true,
      optimizations,
      summary: {
        totalProducts: products?.length || 0,
        strategy,
        potentialRevenue: optimizations.reduce((s: number, o: any) => s + o.expectedRevenue, 0),
        avgConfidence: optimizations.length > 0
          ? Math.round(optimizations.reduce((s: number, o: any) => s + o.confidence, 0) / optimizations.length)
          : 0
      }
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[dynamic-pricing-optimizer] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
