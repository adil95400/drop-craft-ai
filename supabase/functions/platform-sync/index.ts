import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SyncRequest {
  userId: string
  platform: string
  syncType: 'inventory' | 'prices' | 'orders' | 'all'
  productIds?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, platform, syncType, productIds } = await req.json() as SyncRequest

    console.log(`Starting sync for user ${userId}, platform: ${platform}, type: ${syncType}`)

    const startTime = Date.now()
    let itemsSynced = 0
    let itemsFailed = 0
    const syncDetails: any = {}

    // Créer un log de sync
    const { data: logEntry } = await supabase
      .from('platform_sync_logs')
      .insert({
        user_id: userId,
        platform,
        sync_type: syncType,
        status: 'running'
      })
      .select()
      .single()

    try {
      // Récupérer les produits à synchroniser
      let query = supabase
        .from('imported_products')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'published')

      if (productIds?.length) {
        query = query.in('id', productIds)
      }

      const { data: products, error: productsError } = await query.limit(100)
      if (productsError) throw productsError

      if (!products?.length) {
        throw new Error('No products found to sync')
      }

      // Synchroniser selon le type
      if (syncType === 'inventory' || syncType === 'all') {
        console.log('Syncing inventory...')
        for (const product of products) {
          try {
            // TODO: Appeler l'API de la plateforme pour mettre à jour le stock
            // Simuler une synchronisation
            await new Promise(resolve => setTimeout(resolve, 100))
            itemsSynced++
            syncDetails.inventory = (syncDetails.inventory || 0) + 1
          } catch (error) {
            console.error(`Failed to sync inventory for ${product.id}:`, error)
            itemsFailed++
          }
        }
      }

      if (syncType === 'prices' || syncType === 'all') {
        console.log('Syncing prices...')
        for (const product of products) {
          try {
            // TODO: Appeler l'API de la plateforme pour mettre à jour le prix
            await new Promise(resolve => setTimeout(resolve, 100))
            itemsSynced++
            syncDetails.prices = (syncDetails.prices || 0) + 1
          } catch (error) {
            console.error(`Failed to sync price for ${product.id}:`, error)
            itemsFailed++
          }
        }
      }

      if (syncType === 'orders' || syncType === 'all') {
        console.log('Syncing orders...')
        // TODO: Récupérer les commandes depuis l'API de la plateforme
        // Pour l'instant, on simule
        const simulatedOrders = []
        for (let i = 0; i < 5; i++) {
          simulatedOrders.push({
            user_id: userId,
            platform,
            external_order_id: `ORD-${Date.now()}-${i}`,
            order_number: `#${1000 + i}`,
            customer_name: 'Test Customer',
            items: [{ sku: 'TEST', quantity: 1, price: 29.99 }],
            subtotal: 29.99,
            total_amount: 29.99,
            status: 'pending',
            order_date: new Date().toISOString()
          })
        }

        const { error: ordersError } = await supabase
          .from('marketplace_orders')
          .upsert(simulatedOrders, {
            onConflict: 'user_id,platform,external_order_id'
          })

        if (ordersError) throw ordersError
        itemsSynced += simulatedOrders.length
        syncDetails.orders = simulatedOrders.length
      }

      const duration = Date.now() - startTime

      // Mettre à jour le log
      await supabase
        .from('platform_sync_logs')
        .update({
          status: itemsFailed > 0 ? 'partial' : 'success',
          items_synced: itemsSynced,
          items_failed: itemsFailed,
          duration_ms: duration,
          sync_details: syncDetails,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry!.id)

      // Mettre à jour la config de sync
      await supabase
        .from('platform_sync_configs')
        .update({
          last_sync_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform)

      return new Response(
        JSON.stringify({
          success: true,
          itemsSynced,
          itemsFailed,
          duration,
          syncDetails
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Sync error:', error)
      
      // Mettre à jour le log avec l'erreur
      if (logEntry) {
        await supabase
          .from('platform_sync_logs')
          .update({
            status: 'failed',
            error_details: { message: error.message },
            completed_at: new Date().toISOString()
          })
          .eq('id', logEntry.id)
      }

      throw error
    }

  } catch (error) {
    console.error('Platform sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
