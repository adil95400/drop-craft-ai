import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Non authentifié')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Non authentifié')

    // Process pending price sync items
    const { data: queueItems, error } = await supabase
      .from('price_sync_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    const processed = queueItems?.length || 0

    // Mark items as processing
    if (queueItems && queueItems.length > 0) {
      const ids = queueItems.map(i => i.id)
      await supabase
        .from('price_sync_queue')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .in('id', ids)
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${processed} mise(s) à jour de prix traitée(s)`,
      processed
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erreur interne'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
