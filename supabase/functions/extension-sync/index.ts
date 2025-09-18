import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { extension_id, job_type, parameters } = await req.json()
    
    console.log(`🔄 Extension sync: ${job_type} for ${extension_id}`)

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const result = {
      success: true,
      job_type,
      extension_id,
      items_processed: Math.floor(Math.random() * 100) + 10,
      execution_time: 2000
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})