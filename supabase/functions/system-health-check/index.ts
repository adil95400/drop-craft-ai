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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Check various system components
    const healthChecks = {
      database: await checkDatabase(supabaseClient),
      storage: await checkStorage(supabaseClient),
      api: await checkAPI(supabaseClient),
      auth: await checkAuth(supabaseClient)
    }

    const overallHealth = Object.values(healthChecks).every(check => check.status === 'healthy')

    return new Response(
      JSON.stringify({
        status: overallHealth ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        checks: healthChecks,
        uptime: Deno.metrics().ops.op_void_sync_with_result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: overallHealth ? 200 : 503
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function checkDatabase(client: any) {
  try {
    const start = Date.now()
    const { error } = await client.from('profiles').select('count').limit(1)
    const duration = Date.now() - start
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      response_time: duration,
      message: error ? error.message : 'OK'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: 0,
      message: error.message
    }
  }
}

async function checkStorage(client: any) {
  try {
    const start = Date.now()
    const { data, error } = await client.storage.listBuckets()
    const duration = Date.now() - start
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      response_time: duration,
      buckets_count: data?.length || 0,
      message: error ? error.message : 'OK'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: 0,
      message: error.message
    }
  }
}

async function checkAPI(client: any) {
  try {
    const start = Date.now()
    const { error } = await client.from('products').select('count').limit(1)
    const duration = Date.now() - start
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      response_time: duration,
      message: error ? error.message : 'OK'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: 0,
      message: error.message
    }
  }
}

async function checkAuth(client: any) {
  try {
    const start = Date.now()
    const { data, error } = await client.auth.getSession()
    const duration = Date.now() - start
    
    return {
      status: 'healthy',
      response_time: duration,
      message: 'OK'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      response_time: 0,
      message: error.message
    }
  }
}
