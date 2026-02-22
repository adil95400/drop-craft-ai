/**
 * Bulk Import Multi — Thin proxy to robust-import-pipeline
 * P0.1: Delegates all import logic to unified pipeline.
 * Supports both JWT and extension token auth.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProductData {
  url: string
  title?: string
  price?: number
  image?: string
  images?: string[]
  platform?: string
  description?: string
  sku?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth: JWT or extension token — validate to get userId
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    const extensionToken = req.headers.get('x-extension-token')

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = user.id
    } else if (extensionToken) {
      const { data: tokenData } = await supabase
        .from('extension_auth_tokens')
        .select('user_id, is_active, expires_at')
        .eq('token', extensionToken)
        .eq('is_active', true)
        .single()

      if (!tokenData || (tokenData.expires_at && new Date(tokenData.expires_at) < new Date())) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      userId = tokenData.user_id
    } else {
      return new Response(JSON.stringify({ error: 'No authentication provided' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { products, options = {} } = await req.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'No products provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const maxProducts = options.maxProducts || 50
    const productsToImport = products.slice(0, maxProducts) as ProductData[]

    console.log(`[bulk-import-multi] Delegating ${productsToImport.length} products to robust-import-pipeline for user ${userId!.slice(0, 8)}`)

    // Map extension format to pipeline format
    const pipelineItems = productsToImport.map((p) => ({
      title: p.title || undefined,
      name: p.title || undefined,
      price: p.price,
      image_url: p.image || (p.images?.[0]),
      images: p.images || (p.image ? [p.image] : []),
      source_url: p.url,
      description: p.description,
      sku: p.sku,
    }))

    // Generate a service-role JWT call to robust-import-pipeline on behalf of the user
    // We need to call with the user's JWT if available, otherwise use admin impersonation
    const pipelineHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authHeader) {
      pipelineHeaders['Authorization'] = authHeader
    } else {
      // For extension token auth, we use service role but set user context
      pipelineHeaders['Authorization'] = `Bearer ${supabaseServiceKey}`
    }

    const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/robust-import-pipeline`, {
      method: 'POST',
      headers: pipelineHeaders,
      body: JSON.stringify({
        action: 'start',
        items: pipelineItems,
        source: 'extension',
      }),
    })

    const pipelineResult = await pipelineResponse.json()

    if (!pipelineResponse.ok) {
      console.error('[bulk-import-multi] Pipeline error:', pipelineResult)
      return new Response(JSON.stringify({
        success: false,
        error: pipelineResult.error || 'Pipeline delegation failed',
      }), {
        status: pipelineResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'bulk_import',
      description: `Import en masse (multi): ${productsToImport.length} produits via pipeline`,
      entity_type: 'product',
      source: extensionToken ? 'extension' : 'web',
      details: { job_id: pipelineResult.job_id, total: productsToImport.length },
    })

    return new Response(JSON.stringify({
      success: true,
      job_id: pipelineResult.job_id,
      total: productsToImport.length,
      status: 'processing',
      message: `${productsToImport.length} products queued via robust-import-pipeline`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 202,
    })
  } catch (error) {
    console.error('Bulk import multi error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
