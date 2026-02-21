/**
 * Robust Import Pipeline - P5
 * Unified import with per-item error tracking, granular retry, and real-time progress
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schemas
const ImportItemSchema = z.object({
  title: z.string().max(500).optional(),
  name: z.string().max(500).optional(),
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
  tags: z.array(z.string()).max(30).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  source_url: z.string().optional(),
  url: z.string().optional(),
}).passthrough()

const PipelineRequestSchema = z.object({
  action: z.enum(['start', 'retry_items', 'get_status', 'get_items']),
  job_id: z.string().uuid().optional(),
  // For 'start'
  items: z.array(ImportItemSchema).min(1).max(5000).optional(),
  source: z.enum(['csv', 'url', 'api', 'shopify', 'supplier', 'extension']).optional(),
  // For 'retry_items'
  item_ids: z.array(z.string().uuid()).optional(),
  retry_all_failed: z.boolean().optional(),
  // For 'get_items' pagination
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
  status_filter: z.enum(['all', 'pending', 'success', 'failed', 'retrying']).optional(),
})

interface ItemResult {
  line_number: number
  status: 'success' | 'failed' | 'pending' | 'retrying'
  product_id?: string
  error_message?: string
  error_code?: string
  raw_data: any
  retry_count: number
}

// ── Auth helper ─────────────────────────────────────────────────────────────
async function authenticateRequest(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) throw new Error('Authorization required')
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('Invalid token')
  return user
}

// ── Validate single item ─────────────────────────────────────────────────────
function validateItem(item: any, lineNumber: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const title = item.title || item.name
  if (!title || title.trim().length === 0) {
    errors.push('Titre/nom manquant')
  }
  
  const price = parseFloat(String(item.price || '0'))
  if (isNaN(price) || price < 0) {
    errors.push(`Prix invalide: "${item.price}"`)
  }
  
  if (price > 999999.99) {
    errors.push(`Prix trop élevé: ${price}`)
  }

  const stock = parseInt(String(item.stock_quantity || '0'))
  if (isNaN(stock) || stock < 0) {
    errors.push(`Stock invalide: "${item.stock_quantity}"`)
  }

  if (item.image_url && item.image_url.length > 0) {
    try { new URL(item.image_url) } catch { errors.push(`URL image invalide: "${item.image_url}"`) }
  }
  
  if (item.source_url || item.url) {
    const u = item.source_url || item.url
    try { new URL(u) } catch { errors.push(`URL source invalide: "${u}"`) }
  }

  return { valid: errors.length === 0, errors }
}

// ── Map item to product row ──────────────────────────────────────────────────
function mapToProduct(item: any, userId: string, source: string) {
  const price = Math.min(parseFloat(String(item.price || '0')) || 0, 999999.99)
  const costPrice = Math.min(parseFloat(String(item.cost_price || '0')) || price * 0.6, 999999.99)
  
  return {
    user_id: userId,
    title: (item.title || item.name || 'Sans titre').substring(0, 500),
    description: (item.description || '').substring(0, 5000),
    price,
    cost_price: costPrice,
    sku: (item.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`).substring(0, 100),
    category: (item.category || 'Imported').substring(0, 100),
    brand: (item.brand || '').substring(0, 200),
    image_url: item.image_url || (Array.isArray(item.images) ? item.images[0] : null),
    images: Array.isArray(item.images) ? item.images.slice(0, 10) : [],
    stock_quantity: Math.min(parseInt(String(item.stock_quantity || '0')) || 0, 999999),
    status: 'draft',
    tags: Array.isArray(item.tags) ? item.tags.slice(0, 20) : [],
    supplier: item.supplier || source,
    weight: Math.min(parseFloat(String(item.weight || '0')) || 0, 9999),
    source_url: item.source_url || item.url || null,
  }
}

// ── Start import ─────────────────────────────────────────────────────────────
async function startImport(supabase: any, userId: string, items: any[], source: string) {
  // Create job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      job_type: 'import',
      job_subtype: source,
      status: 'processing',
      total_items: items.length,
      processed_items: 0,
      failed_items: 0,
      metadata: { source, pipeline_version: 'v2-robust' },
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (jobError) throw new Error(`Job creation failed: ${jobError.message}`)
  const jobId = job.id

  // Create job_items for each line
  const jobItems = items.map((item, idx) => ({
    job_id: jobId,
    user_id: userId,
    line_number: idx + 1,
    status: 'pending',
    raw_data: item,
    retry_count: 0,
    error_message: null,
    error_code: null,
    product_id: null,
  }))

  // Insert in batches of 100
  for (let i = 0; i < jobItems.length; i += 100) {
    const batch = jobItems.slice(i, i + 100)
    const { error } = await supabase.from('job_items').insert(batch)
    if (error) console.error(`job_items batch insert error:`, error)
  }

  // Process in background
  processItemsInBackground(supabase, userId, jobId).catch(err => 
    console.error(`Background processing failed for job ${jobId}:`, err)
  )

  return { job_id: jobId, status: 'processing', total: items.length }
}

// ── Background processor ─────────────────────────────────────────────────────
async function processItemsInBackground(supabase: any, userId: string, jobId: string) {
  let succeeded = 0
  let failed = 0
  let processed = 0

  // Get pending items
  const { data: pendingItems, error: fetchErr } = await supabase
    .from('job_items')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .in('status', ['pending', 'retrying'])
    .order('line_number', { ascending: true })

  if (fetchErr || !pendingItems) {
    await supabase.from('jobs').update({ status: 'failed', metadata: { error: fetchErr?.message } })
      .eq('id', jobId).eq('user_id', userId)
    return
  }

  // Get job metadata for source
  const { data: jobData } = await supabase
    .from('jobs')
    .select('job_subtype, metadata')
    .eq('id', jobId)
    .single()
  
  const source = jobData?.job_subtype || 'csv'
  const totalForJob = pendingItems.length

  // Process individually for granular tracking
  for (const item of pendingItems) {
    processed++
    
    // Validate
    const validation = validateItem(item.raw_data, item.line_number)
    
    if (!validation.valid) {
      failed++
      await supabase.from('job_items').update({
        status: 'failed',
        error_message: validation.errors.join('; '),
        error_code: 'VALIDATION_ERROR',
        processed_at: new Date().toISOString(),
      }).eq('id', item.id).eq('user_id', userId)
      
      await updateJobProgress(supabase, jobId, userId, processed, succeeded, failed, totalForJob)
      continue
    }

    // Map and insert product
    try {
      const productData = mapToProduct(item.raw_data, userId, source)
      
      const { data: product, error: insertError } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single()
      
      if (insertError) {
        failed++
        await supabase.from('job_items').update({
          status: 'failed',
          error_message: insertError.message,
          error_code: 'INSERT_ERROR',
          processed_at: new Date().toISOString(),
        }).eq('id', item.id).eq('user_id', userId)
      } else {
        succeeded++
        await supabase.from('job_items').update({
          status: 'success',
          product_id: product.id,
          processed_at: new Date().toISOString(),
        }).eq('id', item.id).eq('user_id', userId)
      }
    } catch (err: any) {
      failed++
      await supabase.from('job_items').update({
        status: 'failed',
        error_message: err.message || 'Unknown error',
        error_code: 'PROCESSING_ERROR',
        processed_at: new Date().toISOString(),
      }).eq('id', item.id).eq('user_id', userId)
    }

    // Update progress every 5 items or at the end
    if (processed % 5 === 0 || processed === totalForJob) {
      await updateJobProgress(supabase, jobId, userId, processed, succeeded, failed, totalForJob)
    }
  }

  // Finalize
  const finalStatus = failed > 0 && succeeded === 0 ? 'failed' : 'completed'
  await supabase.from('jobs').update({
    status: finalStatus,
    processed_items: processed,
    failed_items: failed,
    completed_at: new Date().toISOString(),
    metadata: { source, pipeline_version: 'v2-robust', succeeded, failed, processed },
  }).eq('id', jobId).eq('user_id', userId)
}

async function updateJobProgress(supabase: any, jobId: string, userId: string, processed: number, succeeded: number, failed: number, total: number) {
  await supabase.from('jobs').update({
    processed_items: processed,
    failed_items: failed,
    metadata: { succeeded, failed, processed, total, progress_percent: Math.round((processed / total) * 100) },
  }).eq('id', jobId).eq('user_id', userId)
}

// ── Retry failed items ───────────────────────────────────────────────────────
async function retryItems(supabase: any, userId: string, jobId: string, itemIds?: string[], retryAllFailed?: boolean) {
  let query = supabase.from('job_items')
    .update({ status: 'retrying', retry_count: supabase.raw ? undefined : undefined, error_message: null })
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .eq('status', 'failed')

  if (itemIds && itemIds.length > 0 && !retryAllFailed) {
    query = query.in('id', itemIds)
  }

  // Manual increment retry_count - update each individually
  const { data: failedItems } = await supabase
    .from('job_items')
    .select('id, retry_count')
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .eq('status', 'failed')
    .then((res: any) => {
      if (itemIds && itemIds.length > 0 && !retryAllFailed) {
        return { data: res.data?.filter((i: any) => itemIds.includes(i.id)) }
      }
      return res
    })

  if (!failedItems || failedItems.length === 0) {
    return { retried: 0 }
  }

  // Mark as retrying
  for (const item of failedItems) {
    await supabase.from('job_items').update({
      status: 'retrying',
      retry_count: (item.retry_count || 0) + 1,
      error_message: null,
      error_code: null,
    }).eq('id', item.id).eq('user_id', userId)
  }

  // Set job back to processing
  await supabase.from('jobs').update({ status: 'processing' }).eq('id', jobId).eq('user_id', userId)

  // Process in background
  processItemsInBackground(supabase, userId, jobId).catch(err =>
    console.error(`Retry processing failed for job ${jobId}:`, err)
  )

  return { retried: failedItems.length, job_id: jobId }
}

// ── Get status ───────────────────────────────────────────────────────────────
async function getStatus(supabase: any, userId: string, jobId: string) {
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (!job) throw new Error('Job not found')

  // Get item stats
  const { data: itemStats } = await supabase
    .from('job_items')
    .select('status')
    .eq('job_id', jobId)
    .eq('user_id', userId)

  const stats = {
    total: itemStats?.length || 0,
    pending: itemStats?.filter((i: any) => i.status === 'pending').length || 0,
    success: itemStats?.filter((i: any) => i.status === 'success').length || 0,
    failed: itemStats?.filter((i: any) => i.status === 'failed').length || 0,
    retrying: itemStats?.filter((i: any) => i.status === 'retrying').length || 0,
  }

  return {
    job_id: job.id,
    status: job.status,
    created_at: job.created_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    progress_percent: stats.total > 0 ? Math.round(((stats.success + stats.failed) / stats.total) * 100) : 0,
    stats,
    metadata: job.metadata,
  }
}

// ── Get items with pagination ────────────────────────────────────────────────
async function getItems(supabase: any, userId: string, jobId: string, page: number, perPage: number, statusFilter?: string) {
  let query = supabase
    .from('job_items')
    .select('id, line_number, status, product_id, error_message, error_code, retry_count, raw_data, processed_at', { count: 'exact' })
    .eq('job_id', jobId)
    .eq('user_id', userId)
    .order('line_number', { ascending: true })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, count, error } = await query
  if (error) throw error

  return {
    items: data || [],
    meta: { page, per_page: perPage, total: count || 0 },
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const user = await authenticateRequest(req, supabase)
    const userId = user.id

    const body = await req.json()
    const parsed = PipelineRequestSchema.safeParse(body)
    
    if (!parsed.success) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request', details: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, job_id, items, source, item_ids, retry_all_failed, page, per_page, status_filter } = parsed.data
    let result: any

    switch (action) {
      case 'start':
        if (!items || !source) throw new Error('items and source required for start')
        result = await startImport(supabase, userId, items, source)
        break
      case 'retry_items':
        if (!job_id) throw new Error('job_id required for retry')
        result = await retryItems(supabase, userId, job_id, item_ids, retry_all_failed)
        break
      case 'get_status':
        if (!job_id) throw new Error('job_id required for get_status')
        result = await getStatus(supabase, userId, job_id)
        break
      case 'get_items':
        if (!job_id) throw new Error('job_id required for get_items')
        result = await getItems(supabase, userId, job_id, page || 1, per_page || 50, status_filter)
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: action === 'start' ? 202 : 200,
    })

  } catch (error: any) {
    console.error('Pipeline error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: error.message?.includes('Authorization') ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
