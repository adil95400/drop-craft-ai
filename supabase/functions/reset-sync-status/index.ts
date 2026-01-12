import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { corsHeaders } from '../_shared/cors.ts'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const BodySchema = z.object({
  integration_id: z.string().uuid('integration_id must be a valid UUID')
})

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { integration_id } = await parseJsonValidated(req, BodySchema)

    console.log(`🔄 Resetting sync status for: ${integration_id}`)

    // Get current integration
    const { data: integration, error: fetchError } = await supabaseClient
      .from('integrations')
      .select('store_config')
      .eq('id', integration_id)
      .single()

    if (fetchError) {
      throw new ValidationError('Integration not found')
    }

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

    if (error) {
      throw new ValidationError('Failed to reset sync status')
    }

    console.log('✅ Sync status reset successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Statut de synchronisation réinitialisé',
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }, corsHeaders)
)
