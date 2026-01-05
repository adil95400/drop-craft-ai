import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const BodySchema = z.object({
  storeId: z.string().uuid('storeId invalide')
})

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    // This endpoint exists primarily to prevent client sync failures.
    // Stock sync is handled by the main store sync pipeline.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { storeId } = await parseJsonValidated(req, BodySchema)

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('id, platform_type')
      .eq('id', storeId)
      .maybeSingle()

    if (error) throw error
    if (!integration) throw new ValidationError('Boutique introuvable')

    if (integration.platform_type !== 'shopify') {
      throw new ValidationError('Cette boutique n\'est pas une boutique Shopify')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Stock: synchronisation planifiée', storeId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }, corsHeaders)
)
