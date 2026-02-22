import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts'

serve(async (req) => {
  const preflight = handleCorsPreflightSecure(req);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const corsHeaders = getSecureCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non authentifié')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Non authentifié')

    const body = await req.json()
    const { sync_type, direction, integration_id } = body

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_type, store_name, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Aucune boutique connectée',
        synced: 0,
        results: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const targets = integration_id
      ? integrations.filter(i => i.id === integration_id)
      : integrations

    const queueItems = targets.map(integration => ({
      user_id: user.id,
      sync_type: sync_type || 'products',
      entity_type: sync_type || 'products',
      entity_id: integration.id,
      action: direction || 'bidirectional',
      status: 'pending',
      priority: 5,
      channels: JSON.stringify([{ integration_id: integration.id, platform: integration.platform_type }]),
      payload: { store_name: integration.store_name, platform: integration.platform_type }
    }))

    if (queueItems.length > 0) {
      await supabase.from('unified_sync_queue').insert(queueItems)
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Synchronisation ${sync_type || 'products'} planifiée pour ${targets.length} boutique(s)`,
      queued: targets.length,
      stores: targets.map(i => i.store_name)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erreur interne'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
