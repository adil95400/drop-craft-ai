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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { supplier_id, api_key, settings } = await req.json()

    console.log('Connecting supplier:', { supplier_id, user_id: user.id })

    // Créer la connexion fournisseur
    const { data: connection, error: connectionError } = await supabase
      .from('supplier_connections')
      .insert({
        user_id: user.id,
        supplier_id,
        api_key: api_key || null,
        settings: settings || {},
        status: 'active',
        last_sync_at: new Date().toISOString()
      })
      .select()
      .single()

    if (connectionError) {
      throw connectionError
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'supplier_connected',
      description: `Fournisseur ${supplier_id} connecté`,
      entity_type: 'supplier',
      entity_id: connection.id,
      metadata: { supplier_id }
    })

    return new Response(
      JSON.stringify({ success: true, connection }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
