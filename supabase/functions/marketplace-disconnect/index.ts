import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { integration_id } = await req.json()
    
    console.log(`[MARKETPLACE-DISCONNECT] Disconnecting integration ${integration_id}`)

    // Get integration
    const { data: integration, error: getError } = await supabaseClient
      .from('marketplace_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single()

    if (getError || !integration) {
      throw new Error('Integration not found')
    }

    // Deactivate integration
    const { error: updateError } = await supabaseClient
      .from('marketplace_integrations')
      .update({
        is_active: false,
        status: 'disconnected',
      })
      .eq('id', integration_id)

    if (updateError) {
      throw updateError
    }

    // Log event
    await supabaseClient.from('marketplace_event_logs').insert({
      integration_id: integration.id,
      user_id: user.id,
      event_type: 'integration_disconnected',
      event_source: 'api',
      severity: 'info',
      title: `${integration.platform} disconnected`,
      message: `Successfully disconnected from ${integration.platform}`,
      data: { platform: integration.platform },
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MARKETPLACE-DISCONNECT] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})