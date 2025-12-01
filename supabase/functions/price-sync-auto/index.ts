import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PriceSyncConfig {
  strategy: 'lowest' | 'highest' | 'average' | 'margin_based'
  margin_percent?: number
  round_to?: number
}

/**
 * Automatically synchronize prices across marketplaces based on strategy
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

    const { productIds, config } = await req.json() as {
      productIds?: string[]
      config: PriceSyncConfig
    }

    console.log('Starting price sync for user:', user.id, 'config:', config)

    // Get products to sync (all or specific ones)
    let query = supabase
      .from('products')
      .select('id, name, sku, price, cost_price')
      .eq('user_id', user.id)

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds)
    }

    const { data: products, error: productsError } = await query
    if (productsError) throw productsError

    const syncResults = []

    for (const product of products || []) {
      try {
        // Get all marketplace prices for this product
        const { data: marketplacePrices } = await supabase
          .from('marketplace_products')
          .select('marketplace, price, sync_status')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('sync_status', 'active')

        if (!marketplacePrices || marketplacePrices.length === 0) {
          continue
        }

        let newPrice: number

        switch (config.strategy) {
          case 'lowest':
            newPrice = Math.min(...marketplacePrices.map(p => p.price))
            break
          case 'highest':
            newPrice = Math.max(...marketplacePrices.map(p => p.price))
            break
          case 'average':
            newPrice = marketplacePrices.reduce((sum, p) => sum + p.price, 0) / marketplacePrices.length
            break
          case 'margin_based':
            if (product.cost_price && config.margin_percent) {
              newPrice = product.cost_price * (1 + config.margin_percent / 100)
            } else {
              newPrice = product.price
            }
            break
          default:
            newPrice = product.price
        }

        // Apply rounding
        if (config.round_to) {
          newPrice = Math.round(newPrice / config.round_to) * config.round_to
        }

        // Only update if price changed
        if (Math.abs(newPrice - product.price) > 0.01) {
          // Update product price
          await supabase
            .from('products')
            .update({ price: newPrice, updated_at: new Date().toISOString() })
            .eq('id', product.id)

          // Update all marketplace prices
          for (const marketplace of marketplacePrices) {
            await supabase
              .from('marketplace_products')
              .update({ 
                price: newPrice, 
                last_synced_at: new Date().toISOString() 
              })
              .eq('user_id', user.id)
              .eq('product_id', product.id)
              .eq('marketplace', marketplace.marketplace)
          }

          // Log price change
          await supabase
            .from('price_history')
            .insert({
              product_id: product.id,
              old_price: product.price,
              new_price: newPrice,
              change_reason: `Auto-sync (${config.strategy})`,
              changed_by: user.id
            })

          syncResults.push({
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            old_price: product.price,
            new_price: newPrice,
            marketplaces_updated: marketplacePrices.length
          })
        }
      } catch (error) {
        console.error(`Error syncing product ${product.id}:`, error)
        syncResults.push({
          product_id: product.id,
          sku: product.sku,
          error: error.message
        })
      }
    }

    // Log sync event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'price_auto_sync',
        entity_type: 'product',
        description: `Auto-synced prices for ${syncResults.length} products using ${config.strategy} strategy`,
        metadata: { 
          strategy: config.strategy,
          products_synced: syncResults.length,
          config 
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        products_synced: syncResults.filter(r => !r.error).length,
        errors: syncResults.filter(r => r.error).length,
        results: syncResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Price sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
