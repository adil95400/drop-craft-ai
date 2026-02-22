/**
 * Auto-Sync Channels - Synchronisation automatique programmée pour tous les canaux
 * Exécuté par un cron ou manuellement pour maintenir les données à jour
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts'

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
      const { data, error } = await supabase.functions.invoke('shopify-complete-import', {
        body: { 
          integrationId: channel.id,
          includeVariants: true 
        }
      })
      
      if (error) throw error
      productsUpdated = data?.productsImported || 0
      
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
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightSecure(req)
  if (preflightResponse) return preflightResponse

  const origin = req.headers.get('origin')
  const headers = { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non authentifié')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Non authentifié')

    const body = await req.json().catch(() => ({}))
    const { action, channelId, userId, syncType = 'all', intervalMinutes } = body

    console.log('[Auto-Sync] Starting', { action, channelId, userId, syncType })

    // Handle schedule action
    if (action === 'schedule') {
      if (!channelId) throw new Error('channelId requis')

      // Verify ownership
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('id, sync_settings')
        .eq('id', channelId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (intError) throw intError
      if (!integration) throw new Error('Intégration introuvable')

      const currentSettings = (integration.sync_settings as Record<string, unknown>) || {}
      const updatedSettings = {
        ...currentSettings,
        auto_sync: true,
        interval_minutes: intervalMinutes || 60,
        scheduled_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('integrations')
        .update({ sync_settings: updatedSettings, updated_at: new Date().toISOString() })
        .eq('id', channelId)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({ success: true, message: 'Synchronisation planifiée', intervalMinutes }),
        { headers }
      )
    }

    // Build query for channels to sync
    let query = supabase
      .from('integrations')
      .select('*')
      .eq('is_active', true)

    if (channelId) {
      query = query.eq('id', channelId)
    } else if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data: channels, error: fetchError } = await query.limit(50)

    if (fetchError) throw fetchError
    if (!channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No channels to sync', summary: { totalProducts: 0 }, results: [] }),
        { headers }
      )
    }

    console.log(`[Auto-Sync] Found ${channels.length} channels to sync`)

    const results: SyncResult[] = []

    const batchSize = 5
    for (let i = 0; i < channels.length; i += batchSize) {
      const batch = channels.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (channel) => {
          await supabase
            .from('integrations')
            .update({ sync_in_progress: true })
            .eq('id', channel.id)

          const platform = channel.platform_type?.toLowerCase() || 'generic'
          const syncer = platformSyncers[platform] || platformSyncers.generic
          
          const result = await syncer(supabase, channel)

          await supabase
            .from('integrations')
            .update({
              sync_in_progress: false,
              last_sync_at: new Date().toISOString(),
            })
            .eq('id', channel.id)

          return result
        })
      )

      results.push(...batchResults)
    }

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
      JSON.stringify({ success: true, summary, results }),
      { headers }
    )

  } catch (error) {
    console.error('[Auto-Sync] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers }
    )
  }
})
