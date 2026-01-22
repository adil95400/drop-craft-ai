import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[EXTENSION-JOB-STATUS] ${step}${detailsStr}`)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Validate extension token
    const extensionToken = req.headers.get('x-extension-token')
    if (!extensionToken || !extensionToken.startsWith('ext_')) {
      return new Response(JSON.stringify({ error: 'Invalid extension token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    // Get user from token
    const { data: tokenData } = await supabaseClient
      .from('extension_tokens')
      .select('user_id, is_active')
      .eq('token', extensionToken)
      .eq('is_active', true)
      .single()

    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Token expired or invalid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    const userId = tokenData.user_id
    const url = new URL(req.url)
    const jobId = url.searchParams.get('job_id')

    logStep('Job status request', { userId, jobId })

    if (!jobId) {
      // Return recent jobs list
      const { data: jobs, error } = await supabaseClient
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      return new Response(JSON.stringify({
        success: true,
        jobs: jobs || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // Get specific job details
    const { data: job, error } = await supabaseClient
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single()

    if (error || !job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Calculate progress
    const processedItems = (job.processed_items || 0)
    const totalItems = (job.total_items || 1)
    const progress = Math.round((processedItems / totalItems) * 100)

    // Get associated products if completed
    let products: unknown[] = []
    if (job.status === 'completed' && job.result_product_ids) {
      const { data: productData } = await supabaseClient
        .from('imported_products')
        .select('id, title, source_url, images, price, created_at')
        .in('id', job.result_product_ids)

      products = productData || []
    }

    logStep('Job found', { jobId, status: job.status, progress })

    return new Response(JSON.stringify({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        job_type: job.job_type,
        progress,
        processed_items: processedItems,
        total_items: totalItems,
        error_log: job.error_log,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at
      },
      products
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    logStep('ERROR', { message: error.message })
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
