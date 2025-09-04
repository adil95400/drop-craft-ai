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

    // Récupérer les produits
    let query = supabase
      .from('imported_products')
      .select('id, name, price, cost_price, category, supplier_price')
      .eq('user_id', userId)
      .eq('status', 'published')

    if (productIds?.length) {
      query = query.in('id', productIds)
    }

    const { data: products, error } = await query.limit(50)
    if (error) throw error

    // Générer optimisations
    const optimizations = products?.map(product => {
      const currentPrice = product.price
      const costPrice = product.cost_price || product.supplier_price || currentPrice * 0.6
      
      // Simuler prix optimal basé sur la stratégie
      let suggestedPrice = currentPrice
      switch (strategy) {
        case 'competitive':
          suggestedPrice = currentPrice * 0.95
          break
        case 'margin':
          suggestedPrice = Math.max(costPrice * 1.35, currentPrice * 0.9)
          break
        case 'volume':
          suggestedPrice = currentPrice * 0.85
          break
        default: // ai_optimal
          const demandFactor = 0.8 + Math.random() * 0.4
          suggestedPrice = currentPrice * demandFactor
      }

      const priceChange = ((suggestedPrice - currentPrice) / currentPrice) * 100
      
      return {
        productId: product.id,
        productName: product.name,
        currentPrice,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        priceChange: Math.round(priceChange * 100) / 100,
        confidence: 75 + Math.random() * 20,
        expectedRevenue: Math.round(suggestedPrice * (10 + Math.random() * 15)),
        reasoning: `${strategy} strategy: ${priceChange > 0 ? 'increase' : 'decrease'} for optimization`
      }
    }) || []

    console.log(`Generated ${optimizations.length} pricing optimizations`)

    return new Response(
      JSON.stringify({
        success: true,
        optimizations,
        summary: {
          totalProducts: products?.length || 0,
          strategy,
          potentialRevenue: optimizations.reduce((sum, opt) => sum + opt.expectedRevenue, 0)
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