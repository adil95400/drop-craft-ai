import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PriceChange {
  productId: string
  sku: string
  name: string
  oldPrice: number
  newPrice: number
  changePercent: number
  changeType: 'increase' | 'decrease'
}

/**
 * Monitor price changes across suppliers and generate alerts
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { supplierId, thresholdPercent = 5 } = await req.json()

    console.log(`Monitoring price changes for supplier: ${supplierId}`)

    // Get current products with prices
    const { data: currentProducts, error: productsError } = await supabase
      .from('supplier_products')
      .select('id, external_product_id, name, sku, price, supplier_id')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)

    if (productsError) throw productsError

    const priceChanges: PriceChange[] = []
    const significantChanges: PriceChange[] = []

    // Fetch latest prices from supplier API and compare
    for (const product of currentProducts || []) {
      // Get price history
      const { data: priceHistory } = await supabase
        .from('price_history')
        .select('price, created_at')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(2)

      if (priceHistory && priceHistory.length >= 2) {
        const currentPrice = priceHistory[0].price
        const previousPrice = priceHistory[1].price

        if (currentPrice !== previousPrice) {
          const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100
          const changeType = currentPrice > previousPrice ? 'increase' : 'decrease'

          const change: PriceChange = {
            productId: product.id,
            sku: product.sku || '',
            name: product.name,
            oldPrice: previousPrice,
            newPrice: currentPrice,
            changePercent: Math.abs(changePercent),
            changeType
          }

          priceChanges.push(change)

          // Check if change is significant
          if (Math.abs(changePercent) >= thresholdPercent) {
            significantChanges.push(change)

            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                type: 'price_change',
                title: `Changement de prix: ${product.name}`,
                message: `Prix ${changeType === 'increase' ? 'augmenté' : 'diminué'} de ${Math.abs(changePercent).toFixed(1)}% (${previousPrice}€ → ${currentPrice}€)`,
                severity: Math.abs(changePercent) >= 10 ? 'high' : 'medium',
                metadata: { change }
              })
          }
        }
      }
    }

    const summary = {
      totalProducts: currentProducts?.length || 0,
      priceChanges: priceChanges.length,
      significantChanges: significantChanges.length,
      averageChange: priceChanges.length > 0
        ? priceChanges.reduce((sum, c) => sum + c.changePercent, 0) / priceChanges.length
        : 0
    }

    console.log('Price monitoring completed:', summary)

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        priceChanges,
        significantChanges
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Price monitoring error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
