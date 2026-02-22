/**
 * Unified Import — DEPRECATED
 * This function is deprecated. All import operations should use `robust-import-pipeline`.
 * This stub redirects requests to robust-import-pipeline for backward compatibility.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map legacy payload to pipeline format
    const items = body.products || (body.data ? [body.data] : [])
    const source = body.endpoint || body.format || 'csv'

    console.log(`[unified-import] DEPRECATED — redirecting ${items.length} items to robust-import-pipeline`)

    const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/robust-import-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        action: 'start',
        items,
        source: ['csv', 'url', 'api', 'shopify', 'supplier', 'extension'].includes(source) ? source : 'csv',
      }),
    })

    const result = await pipelineResponse.json()

    return new Response(
      JSON.stringify({
        ...result,
        _deprecated: true,
        _message: 'unified-import is deprecated. Use robust-import-pipeline directly.',
      }),
      {
        status: pipelineResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message, _deprecated: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
