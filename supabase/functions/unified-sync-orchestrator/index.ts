/**
 * Unified Sync Orchestrator - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * P0.5 FIX: userId derived from JWT, not from body
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SyncRequest {
  sync_types?: string[]
  platforms?: string[]
  force_full_sync?: boolean
}

Deno.serve(async (req) => {
  // Handle CORS preflight with secure headers
  const preflightResponse = handleCorsPreflightSecure(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getSecureCorsHeaders(origin);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // SECURITY: Get user from JWT, NOT from body
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const user_id = claimsData.claims.sub
    const { sync_types, platforms, force_full_sync } = await req.json() as SyncRequest

    console.log(`🔄 Unified Sync Orchestrator starting for user ${user_id.slice(0, 8)}...`)

    // Get all active sync configurations for this user
    const { data: configs, error: configError } = await supabase
      .from('sync_configurations')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (configError) throw configError

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active sync configurations found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get integration IDs from configs
    const integrationIds = configs.map(c => c.integration_id).filter(Boolean)
    
    // Fetch integrations separately
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('id, platform, store_url, credentials_encrypted, is_active')
      .eq('user_id', user_id) // SECURITY: Only user's own integrations
      .in('id', integrationIds.length > 0 ? integrationIds : ['00000000-0000-0000-0000-000000000000'])
    
    if (intError) {
      console.error('Error fetching integrations:', intError)
    }
    
    // Create a map for quick lookup
    const integrationMap = new Map((integrations || []).map(i => [i.id, i]))

    console.log(`Found ${configs.length} active sync configurations`)

    const results: any[] = []
    const allSyncTypes = sync_types || ['products', 'prices', 'stock', 'orders', 'customers', 'tracking']

    for (const config of configs) {
      const integration = integrationMap.get(config.integration_id)
      if (!integration?.is_active) continue

      const platform = integration.platform
      if (platforms && !platforms.includes(platform)) continue

      console.log(`Processing sync for ${platform}`)

      const syncResult: any = {
        platform,
        integration_id: integration.id,
        syncs: {}
      }

      // Sync Products
      if (allSyncTypes.includes('products') && config.sync_products) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-products-to-channels', {
            body: { integration_id: integration.id, platform, direction: config.sync_direction },
            headers: { Authorization: authHeader }
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
            body: {},
            headers: { Authorization: authHeader }
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
            body: { integration_id: integration.id, platform },
            headers: { Authorization: authHeader }
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
            body: { integration_id: integration.id, platform, direction: config.sync_direction },
            headers: { Authorization: authHeader }
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
            body: { integration_id: integration.id, platform, direction: config.sync_direction },
            headers: { Authorization: authHeader }
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
            body: { integration_id: integration.id, platform },
            headers: { Authorization: authHeader }
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
          .eq('user_id', user_id) // SECURITY: Only user's own config
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
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
