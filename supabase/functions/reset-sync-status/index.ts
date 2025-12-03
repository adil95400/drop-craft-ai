import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { integration_id } = await req.json()

    if (!integration_id) {
      throw new Error('Integration ID required')
    }

    console.log(`🔄 Resetting sync status for: ${integration_id}`)

    // Get current integration
    const { data: integration, error: fetchError } = await supabaseClient
      .from('integrations')
      .select('store_config')
      .eq('id', integration_id)
      .single()

    if (fetchError) throw fetchError

    // Reset sync status
    const { data, error } = await supabaseClient
      .from('integrations')
      .update({
        connection_status: 'connected',
        store_config: {
          ...(integration.store_config || {}),
          sync_in_progress: false,
          sync_error: null
        }
      })
      .eq('id', integration_id)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Sync status reset successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Statut de synchronisation réinitialisé',
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
