import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SyncRequest {
  user_id: string
  sync_types?: string[]
  platforms?: string[]
  force_full_sync?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { user_id, sync_types, platforms, force_full_sync } = await req.json() as SyncRequest

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔄 Unified Sync Orchestrator starting for user ${user_id}`)

    // Get all active sync configurations for this user
    let configQuery = supabase
      .from('sync_configurations')
      .select(`
        *,
        integrations:integration_id (
          id, platform, store_url, credentials_encrypted, is_active
        )
      `)
      .eq('user_id', user_id)
      .eq('is_active', true)

    const { data: configs, error: configError } = await configQuery
    if (configError) throw configError

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active sync configurations found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${configs.length} active sync configurations`)

    const results: any[] = []
    const allSyncTypes = sync_types || ['products', 'prices', 'stock', 'orders', 'customers', 'tracking']

    for (const config of configs) {
      const integration = config.integrations as any
      if (!integration?.is_active) continue

      const platform = integration.platform
      if (platforms && !platforms.includes(platform)) continue

      console.log(`Processing sync for ${platform} (${integration.id})`)

      const syncResult: any = {
        platform,
        integration_id: integration.id,
        syncs: {}
      }

      // Sync Products
      if (allSyncTypes.includes('products') && config.sync_products) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-products-to-channels', {
            body: { user_id, integration_id: integration.id, platform, direction: config.sync_direction }
          })
          syncResult.syncs.products = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.products = { success: false, error: e.message }
        }
      }

      // Sync Prices
      if (allSyncTypes.includes('prices') && config.sync_prices) {
        try {
          const { data, error } = await supabase.functions.invoke('process-price-sync-queue', {
            body: { user_id }
          })
          syncResult.syncs.prices = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.prices = { success: false, error: e.message }
        }
      }

      // Sync Stock
      if (allSyncTypes.includes('stock') && config.sync_stock) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-stock-to-channels', {
            body: { user_id, integration_id: integration.id, platform }
          })
          syncResult.syncs.stock = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.stock = { success: false, error: e.message }
        }
      }

      // Sync Orders
      if (allSyncTypes.includes('orders') && config.sync_orders) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-orders-to-channels', {
            body: { user_id, integration_id: integration.id, platform, direction: config.sync_direction }
          })
          syncResult.syncs.orders = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.orders = { success: false, error: e.message }
        }
      }

      // Sync Customers
      if (allSyncTypes.includes('customers') && config.sync_customers) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-customers-to-channels', {
            body: { user_id, integration_id: integration.id, platform, direction: config.sync_direction }
          })
          syncResult.syncs.customers = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.customers = { success: false, error: e.message }
        }
      }

      // Sync Tracking
      if (allSyncTypes.includes('tracking') && config.sync_tracking) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-tracking-to-channels', {
            body: { user_id, integration_id: integration.id, platform }
          })
          syncResult.syncs.tracking = { success: !error, data, error: error?.message }
        } catch (e) {
          syncResult.syncs.tracking = { success: false, error: e.message }
        }
      }

      // Update last full sync timestamp
      if (force_full_sync) {
        await supabase
          .from('sync_configurations')
          .update({ last_full_sync_at: new Date().toISOString() })
          .eq('id', config.id)
      }

      // Log the sync
      await supabase.from('unified_sync_logs').insert({
        user_id,
        sync_type: 'full',
        platform,
        entity_type: 'all',
        action: force_full_sync ? 'full_sync' : 'incremental_sync',
        status: Object.values(syncResult.syncs).every((s: any) => s.success) ? 'success' : 'partial',
        metadata: syncResult
      })

      results.push(syncResult)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronized ${results.length} integrations`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unified sync orchestrator error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
