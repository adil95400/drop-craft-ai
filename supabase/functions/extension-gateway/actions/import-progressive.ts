/**
 * Progressive Import Handler v1.0
 * 
 * Returns job_id immediately and processes asynchronously.
 * SaaS can poll /jobs/{id} or subscribe to realtime updates.
 * 
 * Flow:
 * 1. Create job with status "received"
 * 2. Return job_id immediately 
 * 3. Process in background (scraping → enriching → ready/error)
 * 4. Update job status via realtime
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { handleImportOrchestrator } from './import-orchestrator.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const ProgressiveImportPayload = z.object({
  source_url: z.string().url().max(2000),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'banggood', 'dhgate', 'other']).optional(),
  shop_id: z.string().uuid().optional(),
  options: z.object({
    include_reviews: z.boolean().optional().default(false),
    include_video: z.boolean().optional().default(false),
    include_variants: z.boolean().optional().default(true),
    include_shipping: z.boolean().optional().default(true),
    preferred_currency: z.string().length(3).optional().default('EUR'),
    target_language: z.string().length(2).optional().default('fr'),
    auto_translate: z.boolean().optional().default(false),
  }).optional().default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
  timestamp: z.number().int().positive(),
  // Progressive mode options
  async_mode: z.boolean().optional().default(true),
  webhook_url: z.string().url().optional(),
})

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
  amazon: [/amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp|com\.au|in|com\.mx|com\.br|nl|pl|se|sg|ae|sa|eg|tr)/],
  aliexpress: [/aliexpress\.(com|ru|us)/, /a\.aliexpress\.com/, /s\.click\.aliexpress\.com/],
  temu: [/temu\.com/],
  shein: [/shein\.(com|fr|de|co\.uk|es|it)/],
  ebay: [/ebay\.(com|fr|de|co\.uk|es|it|ca|com\.au)/],
  wish: [/wish\.com/],
  alibaba: [/alibaba\.com/, /1688\.com/],
  banggood: [/banggood\.com/],
  dhgate: [/dhgate\.com/],
}

function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
      if (patterns.some(p => p.test(hostname))) {
        return platform
      }
    }
  } catch {}
  return 'other'
}

// =============================================================================
// PROGRESSIVE IMPORT HANDLER
// =============================================================================

export async function handleProgressiveImport(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  // 1. Validate payload
  const parsed = ProgressiveImportPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid progressive import payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { source_url, options, request_id, idempotency_key, async_mode, webhook_url } = parsed.data
  const platform = parsed.data.platform || detectPlatform(source_url)

  console.log(`[ProgressiveImport] Starting for ${platform}: ${source_url} (async=${async_mode})`)

  // 2. Create job in product_import_jobs with status "received"
  const { data: job, error: jobError } = await ctx.supabase
    .from('product_import_jobs')
    .insert({
      user_id: ctx.userId,
      source_url,
      platform,
      status: 'received',
      progress_percent: 0,
      metadata: {
        options,
        request_id,
        idempotency_key,
        webhook_url,
        extension_id: ctx.extensionId,
        extension_version: ctx.extensionVersion,
      },
    })
    .select('id, status, created_at')
    .single()

  if (jobError || !job) {
    console.error('[ProgressiveImport] Failed to create job:', jobError)
    return {
      success: false,
      error: {
        code: 'JOB_CREATE_FAILED',
        message: 'Failed to create import job',
        details: { error: jobError?.message }
      }
    }
  }

  console.log(`[ProgressiveImport] Job created: ${job.id}`)

  // 3. If sync mode, process immediately
  if (!async_mode) {
    return processImportSync(job.id, source_url, platform, options, ctx)
  }

  // 4. For async mode, trigger background processing via edge function call
  // Update job to "scraping" and process in parallel
  processImportAsync(job.id, source_url, platform, options, webhook_url, ctx)
    .catch(err => console.error('[ProgressiveImport] Async processing error:', err))

  // 5. Return job_id immediately
  return {
    success: true,
    data: {
      job_id: job.id,
      status: 'received',
      message: 'Import job queued. Poll /jobs/{id} or subscribe to realtime for updates.',
      poll_url: `/extension-gateway?action=JOB_STATUS&job_id=${job.id}`,
      realtime_table: 'product_import_jobs',
      estimated_duration_seconds: getEstimatedDuration(platform),
    }
  }
}

// =============================================================================
// SYNC PROCESSING
// =============================================================================

async function processImportSync(
  jobId: string,
  sourceUrl: string,
  platform: string,
  options: any,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const startTime = Date.now()

  try {
    // Update to scraping
    await updateJobStatus(ctx, jobId, 'scraping', 10)

    // Run orchestrator
    const result = await handleImportOrchestrator({
      source_url: sourceUrl,
      platform,
      options,
      request_id: ctx.requestId,
      idempotency_key: ctx.idempotencyKey || `sync-${jobId}`,
      timestamp: Date.now(),
    }, ctx)

    if (result.success && result.data) {
      // Update job to ready
      await ctx.supabase
        .from('product_import_jobs')
        .update({
          status: 'ready',
          progress_percent: 100,
          extraction_method: result.data.extraction?.method,
          completed_at: new Date().toISOString(),
          metadata: ctx.supabase.rpc ? undefined : {
            product_id: result.data.product?.id,
            completeness_score: result.data.extraction?.completeness_score,
            duration_ms: Date.now() - startTime,
          }
        })
        .eq('id', jobId)

      // Link product to job
      if (result.data.product?.id) {
        await ctx.supabase
          .from('imported_products')
          .update({
            job_id: jobId,
            completeness_score: result.data.extraction?.completeness_score,
            sources_json: result.data.extraction?.field_sources,
          })
          .eq('id', result.data.product.id)
      }

      return {
        success: true,
        data: {
          job_id: jobId,
          status: 'ready',
          product: result.data.product,
          extraction: result.data.extraction,
          duration_ms: Date.now() - startTime,
        }
      }
    } else {
      // Update job to error
      const missingFields = result.error?.details?.missing_critical || []
      const status = missingFields.length > 0 ? 'error_incomplete' : 'error'

      await ctx.supabase
        .from('product_import_jobs')
        .update({
          status,
          missing_fields: missingFields,
          error_code: result.error?.code,
          error_message: result.error?.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        success: false,
        error: {
          code: result.error?.code || 'IMPORT_FAILED',
          message: result.error?.message || 'Import failed',
          details: {
            job_id: jobId,
            status,
            missing_fields: missingFields,
            duration_ms: Date.now() - startTime,
          }
        }
      }
    }
  } catch (error) {
    await ctx.supabase
      .from('product_import_jobs')
      .update({
        status: 'error',
        error_code: 'SYNC_PROCESS_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return {
      success: false,
      error: {
        code: 'SYNC_PROCESS_ERROR',
        message: error instanceof Error ? error.message : 'Sync processing failed',
        details: { job_id: jobId }
      }
    }
  }
}

// =============================================================================
// ASYNC PROCESSING
// =============================================================================

async function processImportAsync(
  jobId: string,
  sourceUrl: string,
  platform: string,
  options: any,
  webhookUrl: string | undefined,
  ctx: GatewayContext
): Promise<void> {
  const startTime = Date.now()

  try {
    // 1. Update to scraping
    await updateJobStatus(ctx, jobId, 'scraping', 20)

    // 2. Run the orchestrator
    const result = await handleImportOrchestrator({
      source_url: sourceUrl,
      platform,
      options,
      request_id: ctx.requestId,
      idempotency_key: ctx.idempotencyKey || `async-${jobId}`,
      timestamp: Date.now(),
    }, ctx)

    // 3. Update to enriching (if successful)
    if (result.success) {
      await updateJobStatus(ctx, jobId, 'enriching', 80)
    }

    // 4. Final status
    if (result.success && result.data) {
      // Save to imported_products with job reference
      const productData = result.data.product
      const extraction = result.data.extraction

      // Update or create imported_products entry
      const { data: importedProduct, error: insertError } = await ctx.supabase
        .from('imported_products')
        .upsert({
          id: productData?.id,
          user_id: ctx.userId,
          job_id: jobId,
          name: productData?.name,
          source_url: sourceUrl,
          source_platform: platform,
          price: productData?.price,
          image_url: productData?.images?.[0],
          image_urls: productData?.images,
          description_html: result.data.product?.description,
          videos: [],
          variants_json: result.data.product?.variants || [],
          category: result.data.product?.category,
          completeness_score: extraction?.completeness_score || 0,
          sources_json: extraction?.field_sources || {},
          extraction_metadata: {
            method: extraction?.method,
            attempts: extraction?.attempts,
            missing_fields: extraction?.missing_fields,
          },
          status: 'published',
        }, { onConflict: 'id' })
        .select('id')
        .single()

      // Update job to ready
      await ctx.supabase
        .from('product_import_jobs')
        .update({
          status: 'ready',
          progress_percent: 100,
          extraction_method: extraction?.method,
          completed_at: new Date().toISOString(),
          metadata: {
            product_id: importedProduct?.id || productData?.id,
            completeness_score: extraction?.completeness_score,
            duration_ms: Date.now() - startTime,
          }
        })
        .eq('id', jobId)

      // 5. Send webhook if configured
      if (webhookUrl) {
        await sendWebhook(webhookUrl, {
          event: 'import.completed',
          job_id: jobId,
          status: 'ready',
          product_id: importedProduct?.id || productData?.id,
          duration_ms: Date.now() - startTime,
        })
      }

    } else {
      // Mark as error
      const missingFields = result.error?.details?.missing_critical || []
      const status = missingFields.length > 0 ? 'error_incomplete' : 'error'

      await ctx.supabase
        .from('product_import_jobs')
        .update({
          status,
          progress_percent: status === 'error_incomplete' ? 60 : 0,
          missing_fields: missingFields,
          error_code: result.error?.code,
          error_message: result.error?.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      // Send failure webhook
      if (webhookUrl) {
        await sendWebhook(webhookUrl, {
          event: 'import.failed',
          job_id: jobId,
          status,
          error: result.error,
          duration_ms: Date.now() - startTime,
        })
      }
    }

  } catch (error) {
    console.error('[ProgressiveImport] Async error:', error)

    await ctx.supabase
      .from('product_import_jobs')
      .update({
        status: 'error',
        error_code: 'ASYNC_PROCESS_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    // Send error webhook
    if (webhookUrl) {
      await sendWebhook(webhookUrl, {
        event: 'import.error',
        job_id: jobId,
        status: 'error',
        error: { code: 'ASYNC_PROCESS_ERROR', message: String(error) },
      }).catch(() => {})
    }
  }
}

// =============================================================================
// JOB STATUS HANDLER
// =============================================================================

const JobStatusPayload = z.object({
  job_id: z.string().uuid(),
})

export async function handleJobStatus(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = JobStatusPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'job_id (UUID) required',
      }
    }
  }

  const { job_id } = parsed.data

  // Fetch job with user isolation
  const { data: job, error } = await ctx.supabase
    .from('product_import_jobs')
    .select('*')
    .eq('id', job_id)
    .eq('user_id', ctx.userId)
    .single()

  if (error || !job) {
    return {
      success: false,
      error: {
        code: 'JOB_NOT_FOUND',
        message: 'Import job not found',
        details: { job_id }
      }
    }
  }

  // Fetch associated product if ready
  let product = null
  if (job.status === 'ready' && job.metadata?.product_id) {
    const { data: productData } = await ctx.supabase
      .from('imported_products')
      .select('id, name, price, image_url, image_urls, completeness_score, created_at')
      .eq('id', job.metadata.product_id)
      .single()
    
    product = productData
  }

  return {
    success: true,
    data: {
      job: {
        id: job.id,
        status: job.status,
        platform: job.platform,
        source_url: job.source_url,
        progress_percent: job.progress_percent,
        extraction_method: job.extraction_method,
        missing_fields: job.missing_fields,
        error_code: job.error_code,
        error_message: job.error_message,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
      },
      product,
      is_complete: ['ready', 'error', 'error_incomplete'].includes(job.status),
      can_retry: job.status === 'error' && (job.retry_count || 0) < (job.max_retries || 3),
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

async function updateJobStatus(
  ctx: GatewayContext,
  jobId: string,
  status: string,
  progress: number
): Promise<void> {
  const updates: Record<string, any> = {
    status,
    progress_percent: progress,
  }

  if (status === 'scraping') {
    updates.started_at = new Date().toISOString()
  }

  await ctx.supabase
    .from('product_import_jobs')
    .update(updates)
    .eq('id', jobId)
}

async function sendWebhook(url: string, payload: Record<string, any>): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.error('[Webhook] Failed to send:', error)
  }
}

function getEstimatedDuration(platform: string): number {
  const estimates: Record<string, number> = {
    aliexpress: 15,
    amazon: 10,
    temu: 12,
    shein: 10,
    ebay: 8,
    other: 20,
  }
  return estimates[platform] || 15
}
