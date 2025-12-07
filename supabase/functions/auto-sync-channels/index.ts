/**
 * Auto-Sync Channels - Synchronisation automatique programmée pour tous les canaux
 * Exécuté par un cron ou manuellement pour maintenir les données à jour
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface SyncResult {
  channelId: string
  platform: string
  success: boolean
  productsUpdated: number
  ordersUpdated: number
  inventoryUpdated: number
  error?: string
  duration: number
}

// Platform-specific sync implementations
const platformSyncers: Record<string, (supabase: any, channel: any) => Promise<SyncResult>> = {
  shopify: async (supabase, channel) => {
    const startTime = Date.now()
    let productsUpdated = 0
    let ordersUpdated = 0
    
    try {
      // Call shopify-complete-import for product sync
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: { 
          integrationId: channel.id,
          includeVariants: true 
        }
      })
      
      if (error) throw error
      productsUpdated = data?.productsImported || 0
      
      // Get order count
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('source', 'shopify')
      ordersUpdated = count || 0
      
      return {
        channelId: channel.id,
        platform: 'shopify',
        success: true,
        productsUpdated,
        ordersUpdated,
        inventoryUpdated: productsUpdated,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        channelId: channel.id,
        platform: 'shopify',
        success: false,
        productsUpdated: 0,
        ordersUpdated: 0,
        inventoryUpdated: 0,
        error: error.message,
        duration: Date.now() - startTime
      }
    }
  },
  
  woocommerce: async (supabase, channel) => {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('woocommerce-sync', {
        body: { integrationId: channel.id }
      })
      
      if (error) throw error
      
      return {
        channelId: channel.id,
        platform: 'woocommerce',
        success: true,
        productsUpdated: data?.productsCount || 0,
        ordersUpdated: data?.ordersCount || 0,
        inventoryUpdated: data?.inventoryCount || 0,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        channelId: channel.id,
        platform: 'woocommerce',
        success: false,
        productsUpdated: 0,
        ordersUpdated: 0,
        inventoryUpdated: 0,
        error: error.message,
        duration: Date.now() - startTime
      }
    }
  },
  
  prestashop: async (supabase, channel) => {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('prestashop-sync-products', {
        body: { integrationId: channel.id }
      })
      
      if (error) throw error
      
      return {
        channelId: channel.id,
        platform: 'prestashop',
        success: true,
        productsUpdated: data?.count || 0,
        ordersUpdated: 0,
        inventoryUpdated: 0,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        channelId: channel.id,
        platform: 'prestashop',
        success: false,
        productsUpdated: 0,
        ordersUpdated: 0,
        inventoryUpdated: 0,
        error: error.message,
        duration: Date.now() - startTime
      }
    }
  },
  
  // Generic syncer for other platforms
  generic: async (supabase, channel) => {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.functions.invoke('channel-sync-bidirectional', {
        body: { 
          integrationId: channel.id,
          platform: channel.platform_type,
          syncType: 'full'
        }
      })
      
      if (error) throw error
      
      return {
        channelId: channel.id,
        platform: channel.platform_type,
        success: true,
        productsUpdated: data?.products_synced || 0,
        ordersUpdated: data?.orders_synced || 0,
        inventoryUpdated: data?.inventory_synced || 0,
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        channelId: channel.id,
        platform: channel.platform_type,
        success: false,
        productsUpdated: 0,
        ordersUpdated: 0,
        inventoryUpdated: 0,
        error: error.message,
        duration: Date.now() - startTime
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { channelId, userId, syncType = 'all' } = body

    console.log('[Auto-Sync] Starting sync', { channelId, userId, syncType })

    // Build query for channels to sync
    let query = supabase
      .from('integrations')
      .select('*')
      .eq('is_active', true)
      .eq('connection_status', 'connected')

    if (channelId) {
      query = query.eq('id', channelId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    // Only sync channels that haven't synced recently (within 5 minutes)
    if (syncType === 'scheduled') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      query = query.or(`last_sync_at.is.null,last_sync_at.lt.${fiveMinutesAgo}`)
    }

    const { data: channels, error: fetchError } = await query.limit(50)

    if (fetchError) throw fetchError
    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No channels to sync', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Auto-Sync] Found ${channels.length} channels to sync`)

    const results: SyncResult[] = []

    // Process channels in parallel (max 5 at a time)
    const batchSize = 5
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (channel) => {
          // Update status to syncing
          await supabase
            .from('integrations')
            .update({ 
              connection_status: 'connecting',
              sync_in_progress: true
            })
            .eq('id', channel.id)

          // Get platform-specific syncer
          const platform = channel.platform_type?.toLowerCase() || 'generic'
          const syncer = platformSyncers[platform] || platformSyncers.generic
          
          const result = await syncer(supabase, channel)

          // Update channel with results
          await supabase
            .from('integrations')
            .update({
              connection_status: result.success ? 'connected' : 'error',
              sync_in_progress: false,
              last_sync_at: new Date().toISOString(),
              last_sync_error: result.error || null,
              products_synced: result.productsUpdated,
              orders_synced: result.ordersUpdated,
              sync_duration_ms: result.duration
            })
            .eq('id', channel.id)

          // Log sync activity
          if (channel.user_id) {
            await supabase
              .from('activity_logs')
              .insert({
                user_id: channel.user_id,
                action: result.success ? 'sync_completed' : 'sync_failed',
                entity_type: 'channel',
                entity_id: channel.id,
                description: result.success 
                  ? `${platform} sync: ${result.productsUpdated} produits, ${result.ordersUpdated} commandes`
                  : `${platform} sync failed: ${result.error}`,
                metadata: result
              })
          }

          return result
        })
      )

      results.push(...batchResults)
    }

    // Summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalProducts: results.reduce((sum, r) => sum + r.productsUpdated, 0),
      totalOrders: results.reduce((sum, r) => sum + r.ordersUpdated, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    }

    console.log('[Auto-Sync] Completed', summary)

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Auto-Sync] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
