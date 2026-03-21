/**
 * Temporary migration helper — creates product_media table
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const results: string[] = []

  try {
    // Use the REST API to execute SQL via rpc
    // First, let's just try to insert into the table to check if it exists
    const { error: testError } = await supabase
      .from('product_media')
      .select('id')
      .limit(1)

    if (testError && testError.message.includes('does not exist')) {
      results.push('Table does not exist yet — needs migration')
    } else {
      results.push('Table product_media already exists')
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
