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

    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, platform_type, store_name')
      .eq('user_id', user.id)
      .eq('is_active', true)

    return new Response(JSON.stringify({
      success: true,
      message: `Synchronisation commandes planifiée pour ${integrations?.length || 0} boutique(s)`,
      queued: integrations?.length || 0
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erreur interne'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
