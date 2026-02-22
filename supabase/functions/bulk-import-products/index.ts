/**
 * Bulk Import Products — Thin proxy to robust-import-pipeline
 * P0.1: All import logic delegates to the unified pipeline.
 * Auth is validated here, then forwarded via service call.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ProductSchema = z.object({
  name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  price: z.union([z.string(), z.number()]).optional(),
  cost_price: z.union([z.string(), z.number()]).optional(),
  sku: z.string().max(100).optional(),
  image_url: z.string().optional(),
  images: z.array(z.string()).max(20).optional(),
  category: z.string().max(200).optional(),
  brand: z.string().max(200).optional(),
  stock_quantity: z.union([z.string(), z.number()]).optional(),
  supplier: z.string().max(200).optional(),
  supplier_name: z.string().max(200).optional(),
  tags: z.array(z.string()).max(30).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  source_url: z.string().optional(),
  url: z.string().optional(),
}).passthrough()

const BulkImportSchema = z.object({
  products: z.array(ProductSchema).min(1).max(5000),
  source: z.enum(['supplier', 'csv', 'url', 'shopify', 'api', 'extension']),
  options: z.object({
    auto_optimize: z.boolean().optional(),
    auto_publish: z.boolean().optional(),
    target_store: z.string().optional(),
  }).optional(),
})

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Auth obligatoire
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // 2. Rate limiting: max 5 bulk imports per hour
    const rateCheck = await checkRateLimit(supabase, userId, 'bulk_import', 5, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 5 bulk imports per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Parse and validate input
    const body = await req.json()
    const parseResult = BulkImportSchema.safeParse(body)

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request', details: parseResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { products, source } = parseResult.data

    console.log(`[bulk-import-products] Delegating ${products.length} products to robust-import-pipeline for user ${userId.slice(0, 8)}`)

    // 4. Delegate to robust-import-pipeline
    const authHeader = req.headers.get('Authorization')!
    const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/robust-import-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        action: 'start',
        items: products,
        source: source === 'supplier' ? 'api' : source === 'shopify' ? 'shopify' : source,
      }),
    })

    const pipelineResult = await pipelineResponse.json()

    if (!pipelineResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: pipelineResult.error || 'Pipeline error' }),
        { status: pipelineResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log security event
    await logSecurityEvent(supabase, userId, 'bulk_import_delegated', 'info', {
      job_id: pipelineResult.job_id,
      source,
      total: products.length,
    })

    return new Response(
      JSON.stringify({
        success: true,
        job_id: pipelineResult.job_id,
        status: 'processing',
        total: products.length,
        message: `Import job queued with ${products.length} products (via robust-import-pipeline)`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 }
    )
  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
