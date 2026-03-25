import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization required')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { connectorId } = await req.json()
    console.log(`[SYNC-MARKETPLACE] Syncing connector ${connectorId} for user ${user.id}`)

    // Get connector config
    const { data: connector, error: connError } = await supabase
      .from('import_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single()

    if (connError || !connector) {
      throw new Error('Connector not found')
    }

    const platform = connector.platform || connector.connector_type
    const config = connector.config || {}

    console.log(`[SYNC-MARKETPLACE] Platform: ${platform}`)

    // Delegate to platform-specific edge functions
    let syncResult = { productCount: 0, orderCount: 0, errors: [] as string[] }

    switch (platform) {
      case 'shopify': {
        const { data, error } = await supabase.functions.invoke('shopify-sync', {
          body: { 
            action: 'sync_products',
            shop_domain: config.shop_domain,
            access_token: config.access_token,
          }
        })
        if (error) throw error
        syncResult.productCount = data?.synced || 0
        break
      }

      case 'woocommerce': {
        const { data, error } = await supabase.functions.invoke('woocommerce-connector', {
          body: {
            action: 'sync_inventory',
            store_url: config.store_url || config.site_url,
            consumer_key: config.consumer_key,
            consumer_secret: config.consumer_secret,
          }
        })
        if (error) throw error
        syncResult.productCount = data?.synced || 0
        break
      }

      case 'ebay': {
        const { data, error } = await supabase.functions.invoke('ebay-connector', {
          body: {
            action: 'sync_products',
            credentials: config,
          }
        })
        if (error) throw error
        syncResult.productCount = data?.synced || 0
        break
      }

      case 'amazon': {
        const { data, error } = await supabase.functions.invoke('amazon-connector', {
          body: {
            action: 'sync_products',
            credentials: config,
          }
        })
        if (error) throw error
        syncResult.productCount = data?.synced || 0
        break
      }

      case 'tiktok': {
        const { data: integrations } = await supabase
          .from('marketplace_integrations')
          .select('id')
          .eq('user_id', user.id)
          .eq('platform', 'tiktok_shop')
          .eq('status', 'connected')
          .limit(1)
          .single()

        if (integrations) {
          const { data, error } = await supabase.functions.invoke('tiktok-shop-integration', {
            body: {
              action: 'sync_products',
              integration_id: integrations.id,
            }
          })
          if (error) throw error
          syncResult.productCount = data?.synced_count || 0
        }
        break
      }

      case 'alibaba':
      case 'printify':
      case 'printful': {
        // These platforms use catalog-based import
        const { data, error } = await supabase.functions.invoke('supplier-catalog-sync', {
          body: {
            networkId: connectorId,
            userId: user.id,
            action: 'sync',
            platform,
          }
        })
        if (error) throw error
        syncResult.productCount = data?.imported || 0
        break
      }

      default: {
        // Generic sync via supplier-sync
        const { data, error } = await supabase.functions.invoke('supplier-sync', {
          body: {
            supplierId: connectorId,
            userId: user.id,
            action: 'sync',
          }
        })
        if (error) throw error
        syncResult.productCount = data?.imported || 0
        break
      }
    }

    // Update connector last_sync_at
    await supabase
      .from('import_connectors')
      .update({
        last_sync_at: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', connectorId)

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'marketplace_sync',
      entity_type: 'connector',
      entity_id: connectorId,
      description: `Synced ${syncResult.productCount} products from ${platform}`,
      details: { platform, ...syncResult },
    })

    console.log(`[SYNC-MARKETPLACE] Done: ${syncResult.productCount} products synced`)

    return new Response(JSON.stringify({
      success: true,
      productCount: syncResult.productCount,
      orderCount: syncResult.orderCount,
      errors: syncResult.errors,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[SYNC-MARKETPLACE] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
