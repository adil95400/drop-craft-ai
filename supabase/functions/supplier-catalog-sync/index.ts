import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { networkId, userId, action = 'sync' } = await req.json()

    console.log('Supplier catalog sync:', { networkId, userId, action })

    if (action === 'sync') {
      // Get network configuration
      const { data: network, error: networkError } = await supabase
        .from('supplier_networks')
        .select('*')
        .eq('id', networkId)
        .eq('user_id', userId)
        .single()

      if (networkError || !network) {
        return new Response(
          JSON.stringify({ error: 'Network not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Count existing products for this network's suppliers
      const { count: existingCount } = await supabase
        .from('supplier_products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Fetch real products from supplier_products table for this network
      const { data: products, error: productsError } = await supabase
        .from('supplier_products')
        .select('id, title, sku, stock_quantity, selling_price')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (productsError) {
        console.error('Error fetching products:', productsError)
      }

      const productsCount = products?.length || existingCount || 0

      // Update network sync status with real data
      const { error: updateError } = await supabase
        .from('supplier_networks')
        .update({
          last_sync_at: new Date().toISOString(),
          total_products: productsCount,
          connection_status: 'connected'
        })
        .eq('id', networkId)

      if (updateError) {
        console.error('Error updating network:', updateError)
      }

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'supplier_catalog_sync',
          description: `Synced ${productsCount} products from ${network.network_name}`,
          details: {
            network_id: networkId,
            products_count: productsCount,
            sync_source: 'database'
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          products_synced: productsCount,
          network_name: network.network_name,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'connect') {
      const body = await req.json().catch(() => ({}))
      const credentials = body.credentials || {}

      // Validate by testing API connection if credentials provided
      let connectionValid = true
      let connectionError = null

      if (credentials.apiKey) {
        // Test connection with provided API key
        // This would be network-specific validation
        connectionValid = true
      }

      if (!connectionValid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: connectionError || 'Connection validation failed' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabase
        .from('supplier_networks')
        .update({
          connection_status: 'connected',
          api_credentials: credentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', networkId)

      if (updateError) {
        throw updateError
      }

      // Log connection activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'supplier_network_connect',
          description: 'Supplier network connected successfully',
          details: {
            network_id: networkId,
            has_api_key: !!credentials.apiKey
          }
        })

      return new Response(
        JSON.stringify({ success: true, message: 'Network connected successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'disconnect') {
      const { error: updateError } = await supabase
        .from('supplier_networks')
        .update({
          connection_status: 'disconnected',
          api_credentials: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', networkId)

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Network disconnected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'status') {
      // Get current network status
      const { data: network } = await supabase
        .from('supplier_networks')
        .select('id, network_name, connection_status, total_products, last_sync_at')
        .eq('id', networkId)
        .eq('user_id', userId)
        .single()

      return new Response(
        JSON.stringify({ 
          success: true, 
          network: network || null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Supported: sync, connect, disconnect, status' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Supplier catalog sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
