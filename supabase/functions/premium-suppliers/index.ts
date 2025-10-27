import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { action, supplier_id, filters } = await req.json()

    switch (action) {
      case 'browse': {
        // Get all active premium suppliers with filtering
        let query = supabaseClient
          .from('premium_suppliers')
          .select('*')
          .eq('is_active', true)
          .order('featured', { ascending: false })
          .order('quality_score', { ascending: false })

        if (filters?.tier) {
          query = query.eq('tier', filters.tier)
        }
        if (filters?.country) {
          query = query.eq('country', filters.country)
        }
        if (filters?.category) {
          query = query.contains('categories', [filters.category])
        }

        const { data: suppliers, error } = await query

        if (error) throw error

        // Get user's connections
        const { data: connections } = await supabaseClient
          .from('premium_supplier_connections')
          .select('supplier_id, status')
          .eq('user_id', user.id)

        const connectionMap = new Map(
          connections?.map(c => [c.supplier_id, c.status]) || []
        )

        const enrichedSuppliers = suppliers?.map(supplier => ({
          ...supplier,
          connection_status: connectionMap.get(supplier.id) || 'not_connected'
        }))

        return new Response(
          JSON.stringify({ success: true, suppliers: enrichedSuppliers }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_products': {
        // Get products from a specific premium supplier
        const { data: products, error } = await supabaseClient
          .from('premium_products')
          .select(`
            *,
            supplier:premium_suppliers(name, display_name, tier, avg_delivery_days)
          `)
          .eq('supplier_id', supplier_id)
          .eq('is_active', true)
          .order('is_trending', { ascending: false })
          .order('rating', { ascending: false })
          .limit(100)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, products }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'connect': {
        // Connect user to premium supplier
        const { markup_percentage = 30 } = await req.json()

        // Check if connection already exists
        const { data: existing } = await supabaseClient
          .from('premium_supplier_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('supplier_id', supplier_id)
          .single()

        if (existing) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Already connected to this supplier' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if supplier requires approval
        const { data: supplier } = await supabaseClient
          .from('premium_suppliers')
          .select('requires_approval')
          .eq('id', supplier_id)
          .single()

        const status = supplier?.requires_approval ? 'pending' : 'active'

        const { data: connection, error } = await supabaseClient
          .from('premium_supplier_connections')
          .insert({
            user_id: user.id,
            supplier_id,
            status,
            markup_percentage,
            approved_at: status === 'active' ? new Date().toISOString() : null
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ 
            success: true, 
            connection,
            message: status === 'pending' 
              ? 'Connection request sent for approval' 
              : 'Successfully connected to premium supplier'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'disconnect': {
        const { error } = await supabaseClient
          .from('premium_supplier_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('supplier_id', supplier_id)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, message: 'Disconnected successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync': {
        // Trigger product sync from premium supplier
        const { data: connection } = await supabaseClient
          .from('premium_supplier_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('supplier_id', supplier_id)
          .eq('status', 'active')
          .single()

        if (!connection) {
          throw new Error('No active connection found')
        }

        // Create sync log
        const { data: syncLog, error } = await supabaseClient
          .from('premium_sync_logs')
          .insert({
            connection_id: connection.id,
            user_id: user.id,
            supplier_id,
            sync_type: 'products',
            status: 'running'
          })
          .select()
          .single()

        if (error) throw error

        // Simulate sync (in production, this would call the actual supplier API)
        const { data: products } = await supabaseClient
          .from('premium_products')
          .select('*')
          .eq('supplier_id', supplier_id)
          .limit(50)

        // Update sync log
        await supabaseClient
          .from('premium_sync_logs')
          .update({
            status: 'completed',
            total_items: products?.length || 0,
            processed_items: products?.length || 0,
            success_count: products?.length || 0,
            completed_at: new Date().toISOString(),
            duration_seconds: 3
          })
          .eq('id', syncLog.id)

        // Update connection
        await supabaseClient
          .from('premium_supplier_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            products_synced: products?.length || 0
          })
          .eq('id', connection.id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            sync_log: { ...syncLog, products_count: products?.length },
            message: `Synced ${products?.length} products successfully`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'my_connections': {
        // Get user's premium supplier connections
        const { data: connections, error } = await supabaseClient
          .from('premium_supplier_connections')
          .select(`
            *,
            supplier:premium_suppliers(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, connections }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in premium-suppliers function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})