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

  const startTotal = Date.now()

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Run all checks in parallel
    const [database, jobs, edgeFunctions] = await Promise.allSettled([
      checkDatabase(supabaseClient),
      checkJobsSystem(supabaseClient),
      checkEdgeFunctions(),
    ])

    const checks = {
      database: database.status === 'fulfilled' ? database.value : { status: 'unhealthy', message: (database as PromiseRejectedResult).reason?.message },
      jobs_system: jobs.status === 'fulfilled' ? jobs.value : { status: 'unhealthy', message: (jobs as PromiseRejectedResult).reason?.message },
      edge_functions: edgeFunctions.status === 'fulfilled' ? edgeFunctions.value : { status: 'unhealthy', message: (edgeFunctions as PromiseRejectedResult).reason?.message },
    }

    const overallHealth = Object.values(checks).every((c: any) => c.status === 'healthy')
    const totalMs = Date.now() - startTotal

    return new Response(
      JSON.stringify({
        status: overallHealth ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        total_response_ms: totalMs,
        checks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: overallHealth ? 200 : 503,
      }
    )
  } catch (error) {
    console.error('Health check error:', error)
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function checkDatabase(client: any) {
  const start = Date.now()
  // Use a lightweight RPC or direct table ping
  const { data, error } = await client
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  return {
    status: error ? 'unhealthy' : 'healthy',
    response_ms: Date.now() - start,
    message: error ? error.message : 'OK',
  }
}

async function checkJobsSystem(client: any) {
  const start = Date.now()
  // Check if jobs table is accessible and count recent stuck jobs
  const { data, error } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'running')
    .lt('started_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // running > 30min = stuck

  return {
    status: error ? 'unhealthy' : 'healthy',
    response_ms: Date.now() - start,
    stuck_jobs: data?.length ?? 0,
    message: error ? error.message : 'OK',
  }
}

async function checkEdgeFunctions() {
  const start = Date.now()
  // Simple self-check — if we're running, edge functions work
  return {
    status: 'healthy',
    response_ms: Date.now() - start,
    message: 'OK',
  }
}
