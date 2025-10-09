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
      // Simulate syncing products from supplier network
      const { data: network } = await supabase
        .from('supplier_networks')
        .select('*')
        .eq('id', networkId)
        .eq('user_id', userId)
        .single()

      if (!network) {
        return new Response(
          JSON.stringify({ error: 'Network not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Simulate fetching products from external API
      await new Promise(resolve => setTimeout(resolve, 2000))

      const productsCount = Math.floor(Math.random() * 50) + 50

      // Update network sync status
      await supabase
        .from('supplier_networks')
        .update({
          last_sync_at: new Date().toISOString(),
          total_products: productsCount,
          connection_status: 'connected'
        })
        .eq('id', networkId)

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'supplier_catalog_sync',
          description: `Synced ${productsCount} products from ${network.network_name}`,
          metadata: {
            network_id: networkId,
            products_count: productsCount
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          products_synced: productsCount,
          network_name: network.network_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'connect') {
      const { credentials } = await req.json()

      // Validate credentials (simulation)
      await new Promise(resolve => setTimeout(resolve, 1000))

      await supabase
        .from('supplier_networks')
        .update({
          connection_status: 'connected',
          api_credentials: credentials,
          updated_at: new Date().toISOString()
        })
        .eq('id', networkId)

      return new Response(
        JSON.stringify({ success: true, message: 'Network connected successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Supplier catalog sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
