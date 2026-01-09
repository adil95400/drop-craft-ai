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

    const { extension_id, config } = await req.json()

    console.log('Installing extension:', { extension_id, user_id: user.id })

    // Vérifier si l'extension est déjà installée
    const { data: existing } = await supabase
      .from('installed_extensions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('extension_id', extension_id)
      .maybeSingle()

    let installation

    if (existing) {
      // L'extension existe déjà, on la réactive si inactive
      if (existing.status === 'inactive') {
        const { data: updated, error: updateError } = await supabase
          .from('installed_extensions')
          .update({ status: 'active', config: config || {} })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) throw updateError
        installation = updated
        console.log('Extension reactivated:', existing.id)
      } else {
        // Déjà active, retourner l'existante
        installation = existing
        console.log('Extension already installed:', existing.id)
      }
    } else {
      // Nouvelle installation
      const { data: newInstall, error: installError } = await supabase
        .from('installed_extensions')
        .insert({
          user_id: user.id,
          extension_id,
          config: config || {},
          status: 'active',
          installed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (installError) throw installError
      installation = newInstall
    }

    // Logger l'activité
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'extension_installed',
      description: `Extension ${extension_id} installée`,
      entity_type: 'extension',
      entity_id: installation.id,
      metadata: { extension_id }
    })

    return new Response(
      JSON.stringify({ success: true, installation }),
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
