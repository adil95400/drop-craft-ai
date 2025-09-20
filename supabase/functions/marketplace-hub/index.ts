import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectorConfig {
  platform: string
  credentials: Record<string, any>
  sync_settings: {
    frequency: string
    auto_sync: boolean
    sync_categories: string[]
  }
}

interface SyncRequest {
  connector_id: string
  sync_type: 'products' | 'orders' | 'inventory' | 'full'
  options?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { pathname } = new URL(req.url)
    const method = req.method

    console.log(`MarketplaceHub API - ${method} ${pathname} - User: ${user.id}`)

    // GET /marketplace-hub - Get user's marketplace connections
    if (method === 'GET' && pathname === '/marketplace-hub') {
      const { data: connections, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching connections:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch connections' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ connections }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /marketplace-hub/connect - Create new marketplace connection
    if (method === 'POST' && pathname === '/marketplace-hub/connect') {
      const body: ConnectorConfig = await req.json()

      const { data: connection, error } = await supabase
        .from('marketplace_connections')
        .insert({
          user_id: user.id,
          platform: body.platform,
          credentials: body.credentials,
          sync_settings: body.sync_settings,
          status: 'connected',
          last_sync_at: null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating connection:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Connection created:', connection.id)
      return new Response(
        JSON.stringify({ connection }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /marketplace-hub/sync - Trigger marketplace sync
    if (method === 'POST' && pathname === '/marketplace-hub/sync') {
      const body: SyncRequest = await req.json()

      // Verify connection ownership
      const { data: connection, error: connError } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', body.connector_id)
        .eq('user_id', user.id)
        .single()

      if (connError || !connection) {
        return new Response(
          JSON.stringify({ error: 'Connection not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Simulate sync process (replace with actual connector logic)
      const syncResult = {
        sync_id: crypto.randomUUID(),
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date(Date.now() + 5000).toISOString(), // 5 seconds later
        stats: {
          products_synced: Math.floor(Math.random() * 100) + 10,
          orders_synced: Math.floor(Math.random() * 50) + 5,
          errors: 0
        }
      }

      // Update connection last sync
      await supabase
        .from('marketplace_connections')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_stats: syncResult.stats
        })
        .eq('id', connection.id)

      // Log sync activity
      await supabase
        .from('marketplace_sync_logs')
        .insert({
          user_id: user.id,
          connection_id: connection.id,
          sync_type: body.sync_type,
          status: syncResult.status,
          stats: syncResult.stats,
          started_at: syncResult.started_at,
          completed_at: syncResult.completed_at
        })

      console.log('Sync completed:', syncResult.sync_id)
      return new Response(
        JSON.stringify({ sync_result: syncResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /marketplace-hub/analytics - Get marketplace analytics
    if (method === 'GET' && pathname === '/marketplace-hub/analytics') {
      const { data: analytics, error } = await supabase
        .rpc('get_marketplace_analytics', { user_id_param: user.id })

      if (error) {
        console.error('Error fetching analytics:', error)
        return new Response(
          JSON.stringify({ 
            analytics: {
              total_connections: 0,
              active_syncs: 0,
              products_synced: 0,
              revenue_by_platform: [],
              sync_performance: {}
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ analytics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('MarketplaceHub API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})