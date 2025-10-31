import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AutomationRequest {
  userId: string
  action: 'update_rules' | 'process_orders' | 'sync_inventory' | 'optimize_prices'
  rules?: {
    autoImport: boolean
    autoFulfill: boolean
    priceOptimization: boolean
    targetMargin: number
    syncFrequency: string
  }
  filters?: {
    minPrice?: number
    maxPrice?: number
    minRating?: number
    maxShippingDays?: number
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, action, rules, filters } = await req.json() as AutomationRequest

    console.log(`⚙️ Automation action: ${action} for user ${userId}`)

    switch (action) {
      case 'update_rules': {
        const { error } = await supabase
          .from('dropshipping_configs')
          .upsert({
            user_id: userId,
            auto_import: rules?.autoImport || false,
            auto_fulfill: rules?.autoFulfill || false,
            price_optimization: rules?.priceOptimization || true,
            target_margin: rules?.targetMargin || 30,
            sync_frequency: rules?.syncFrequency || '1hour',
            filter_settings: filters || {},
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (error) throw error

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Automation rules updated',
            rules
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'process_orders': {
        // Récupérer les commandes en attente
        const { data: orders, error: ordersError } = await supabase
          .from('marketplace_orders')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(50)

        if (ordersError) throw ordersError

        let processed = 0
        let failed = 0

        // Traiter chaque commande
        for (const order of orders || []) {
          try {
            // En production: passer la commande chez le fournisseur via API
            // Simuler le traitement
            await supabase
              .from('marketplace_orders')
              .update({
                status: 'processing',
                fulfillment_status: 'ordered',
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id)

            processed++
          } catch (error) {
            console.error(`Failed to process order ${order.id}:`, error)
            failed++
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Orders processed',
            stats: {
              total: orders?.length || 0,
              processed,
              failed
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_inventory': {
        // Récupérer les produits actifs
        const { data: products, error: productsError } = await supabase
          .from('imported_products')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(100)

        if (productsError) throw productsError

        let synced = 0
        let outOfStock = 0

        // Simuler la synchronisation du stock
        for (const product of products || []) {
          // En production: vérifier le stock chez le fournisseur
          const newStock = Math.floor(Math.random() * 200)
          const status = newStock > 0 ? 'active' : 'out_of_stock'

          await supabase
            .from('imported_products')
            .update({
              stock_quantity: newStock,
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id)

          synced++
          if (newStock === 0) outOfStock++
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Inventory synchronized',
            stats: {
              total: products?.length || 0,
              synced,
              out_of_stock: outOfStock
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'optimize_prices': {
        // Récupérer la config
        const { data: config } = await supabase
          .from('dropshipping_configs')
          .select('*')
          .eq('user_id', userId)
          .single()

        const targetMargin = config?.target_margin || 30

        // Récupérer les produits
        const { data: products, error: productsError } = await supabase
          .from('imported_products')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(100)

        if (productsError) throw productsError

        let optimized = 0

        for (const product of products || []) {
          if (product.cost_price) {
            const newPrice = product.cost_price * (1 + targetMargin / 100)
            const roundedPrice = Math.round(newPrice * 100) / 100

            await supabase
              .from('imported_products')
              .update({
                price: roundedPrice,
                profit_margin: targetMargin,
                updated_at: new Date().toISOString()
              })
              .eq('id', product.id)

            optimized++
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Prices optimized',
            stats: {
              total: products?.length || 0,
              optimized,
              target_margin: targetMargin
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Automation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})
