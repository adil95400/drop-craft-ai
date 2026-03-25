/**
 * @deprecated — Use `unified-ai/optimize-product` instead.
 * Backward-compatible proxy that forwards to the unified AI hub.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const body = await req.json()
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')!}/functions/v1/unified-ai/optimize-product`, {
      method: 'POST',
      headers: { 'Authorization': req.headers.get('Authorization') || '', 'Content-Type': 'application/json', 'apikey': req.headers.get('apikey') || Deno.env.get('SUPABASE_ANON_KEY') || '' },
      body: JSON.stringify(body),
    })
    const data = await response.text()
    return new Response(data, { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Deprecated': 'Use unified-ai/optimize-product' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Proxy error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
