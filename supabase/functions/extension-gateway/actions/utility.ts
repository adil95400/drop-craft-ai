/**
 * Utility Handler
 * Handles CHECK_VERSION, GET_SETTINGS, LOG_*, CHECK_QUOTA actions
 */

import { z } from "zod"
import { GatewayContext, HandlerResult, CURRENT_EXTENSION_VERSION, MIN_EXTENSION_VERSION, GATEWAY_VERSION } from '../types.ts'
import { compareVersions } from '../utils.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const LogActionPayload = z.object({
  action_type: z.string().min(1).max(50),
  action_status: z.enum(['success', 'error', 'pending']).optional().default('success'),
  platform: z.string().max(50).optional(),
  product_title: z.string().max(200).optional(),
  product_url: z.string().url().max(2000).optional(),
  product_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
})

const LogAnalyticsPayload = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional().default({}),
})

// =============================================================================
// HANDLERS
// =============================================================================

async function handleCheckVersion(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const clientVersion = ctx.extensionVersion
  const updateAvailable = compareVersions(CURRENT_EXTENSION_VERSION, clientVersion) > 0
  const updateRequired = compareVersions(MIN_EXTENSION_VERSION, clientVersion) > 0

  return {
    success: true,
    data: {
      currentVersion: clientVersion,
      latestVersion: CURRENT_EXTENSION_VERSION,
      minVersion: MIN_EXTENSION_VERSION,
      gatewayVersion: GATEWAY_VERSION,
      updateAvailable,
      updateRequired,
      changelog: updateAvailable ? [
        'Improved performance and stability',
        'Enhanced security features',
        'Bug fixes and optimizations',
      ] : [],
    }
  }
}

async function handleGetSettings(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Get user settings
    const { data: settings } = await ctx.supabase
      .from('extension_settings')
      .select('*')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    // Get user profile for plan info
    const { data: profile } = await ctx.supabase
      .from('user_profiles')
      .select('plan, subscription_status')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    return {
      success: true,
      data: {
        settings: settings || {
          autoImport: false,
          defaultMargin: 30,
          roundPrices: true,
          defaultLanguage: 'fr',
        },
        user: {
          plan: profile?.plan || 'free',
          subscriptionStatus: profile?.subscription_status || 'inactive',
        },
        features: {
          aiOptimization: true,
          bulkImport: profile?.plan !== 'free',
          priceMonitoring: profile?.plan === 'ultrapro',
          reviewScraping: true,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleLogAction(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = LogActionPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid log action payload' }
    }
  }

  try {
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: parsed.data.action_type,
      action_status: parsed.data.action_status,
      platform: parsed.data.platform,
      product_title: parsed.data.product_title,
      product_url: parsed.data.product_url,
      product_id: parsed.data.product_id,
      metadata: parsed.data.metadata,
      extension_version: ctx.extensionVersion,
    })

    return {
      success: true,
      data: { logged: true }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleLogAnalytics(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = LogAnalyticsPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid analytics payload' }
    }
  }

  try {
    await ctx.supabase.from('extension_analytics').insert({
      user_id: ctx.userId,
      event_name: parsed.data.event,
      event_properties: parsed.data.properties,
      extension_version: ctx.extensionVersion,
    })

    return {
      success: true,
      data: { logged: true }
    }
  } catch (error) {
    // Analytics logging should not fail the request
    return {
      success: true,
      data: { logged: false }
    }
  }
}

async function handleCheckQuota(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Get user profile for plan info
    const { data: profile } = await ctx.supabase
      .from('user_profiles')
      .select('plan')
      .eq('user_id', ctx.userId)
      .maybeSingle()

    const plan = profile?.plan || 'free'

    // Define quotas by plan
    const quotas: Record<string, any> = {
      free: {
        dailyImports: 10,
        dailyAiOptimizations: 5,
        monthlyProducts: 50,
      },
      pro: {
        dailyImports: 100,
        dailyAiOptimizations: 50,
        monthlyProducts: 500,
      },
      ultrapro: {
        dailyImports: -1, // unlimited
        dailyAiOptimizations: -1,
        monthlyProducts: -1,
      },
    }

    const userQuota = quotas[plan] || quotas.free

    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: importsToday } = await ctx.supabase
      .from('extension_action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .in('action_type', ['IMPORT_PRODUCT', 'IMPORT_BULK'])
      .gte('created_at', today.toISOString())

    const { count: aiToday } = await ctx.supabase
      .from('extension_action_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .like('action_type', 'AI_%')
      .gte('created_at', today.toISOString())

    // Get monthly product count
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count: productsThisMonth } = await ctx.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', ctx.userId)
      .gte('created_at', monthStart.toISOString())

    return {
      success: true,
      data: {
        plan,
        quotas: userQuota,
        usage: {
          importsToday: importsToday || 0,
          aiOptimizationsToday: aiToday || 0,
          productsThisMonth: productsThisMonth || 0,
        },
        remaining: {
          dailyImports: userQuota.dailyImports === -1 ? -1 : Math.max(0, userQuota.dailyImports - (importsToday || 0)),
          dailyAiOptimizations: userQuota.dailyAiOptimizations === -1 ? -1 : Math.max(0, userQuota.dailyAiOptimizations - (aiToday || 0)),
          monthlyProducts: userQuota.monthlyProducts === -1 ? -1 : Math.max(0, userQuota.monthlyProducts - (productsThisMonth || 0)),
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// GET IMPORT JOB STATUS
// =============================================================================

const GetImportJobPayload = z.object({
  job_id: z.string().uuid(),
})

async function handleGetImportJob(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = GetImportJobPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Job ID required' }
    }
  }

  try {
    const { data: job, error } = await ctx.supabase
      .from('background_jobs')
      .select('*')
      .eq('id', parsed.data.job_id)
      .eq('user_id', ctx.userId) // Security: only own jobs
      .single()

    if (error || !job) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' }
      }
    }

    return {
      success: true,
      data: {
        job_id: job.id,
        job_type: job.job_type,
        status: job.status,
        progress: {
          percent: job.progress_percent,
          message: job.progress_message,
        },
        result: job.status === 'completed' ? job.output_data : null,
        error: job.status === 'failed' ? {
          message: job.error_message,
          details: job.error_details,
        } : null,
        timing: {
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
          duration_ms: job.duration_ms,
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// GET PRODUCT IMPORT JOB (new tables)
// =============================================================================

const GetProductImportJobPayload = z.object({
  job_id: z.string().uuid(),
})

async function handleGetProductImportJob(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = GetProductImportJobPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Job ID required' }
    }
  }

  try {
    // Get job from product_import_jobs table
    const { data: job, error: jobError } = await ctx.supabase
      .from('product_import_jobs')
      .select('*')
      .eq('id', parsed.data.job_id)
      .eq('user_id', ctx.userId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Import job not found' }
      }
    }

    // Get associated product if ready
    let product = null
    if (job.status === 'ready' || job.status === 'error_incomplete') {
      const { data: productData } = await ctx.supabase
        .from('imported_products')
        .select('*')
        .eq('job_id', job.id)
        .maybeSingle()
      
      product = productData
    }

    // Calculate progress percentage
    const statusProgress: Record<string, number> = {
      'received': 10,
      'scraping': 40,
      'enriching': 70,
      'ready': 100,
      'error_incomplete': 100,
      'error': 100,
    }

    return {
      success: true,
      data: {
        job: {
          id: job.id,
          status: job.status,
          source_url: job.source_url,
          platform: job.platform,
          missing_fields: job.missing_fields,
          field_sources: job.field_sources,
          error_code: job.error_code,
          error_message: job.error_message,
          progress: statusProgress[job.status] || 0,
          created_at: job.created_at,
          started_at: job.started_at,
          completed_at: job.completed_at,
        },
        product: product ? {
          id: product.id,
          title: product.title || product.name,
          price: product.price,
          currency: product.currency,
          images: product.images || product.image_urls || [],
          completeness_score: product.completeness_score,
          status: product.status,
          field_sources: product.field_sources,
        } : null,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// HEALTHCHECK
// =============================================================================

async function handleHealthcheck(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {}
  
  // Check database connectivity
  const dbStart = Date.now()
  try {
    await ctx.supabase.from('extension_requests').select('id', { count: 'exact', head: true }).limit(1)
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error) {
    checks.database = { status: 'error', error: error.message, latencyMs: Date.now() - dbStart }
  }

  // Check Firecrawl API (if configured)
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  if (firecrawlKey) {
    const fcStart = Date.now()
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/health', {
        headers: { 'Authorization': `Bearer ${firecrawlKey}` },
        signal: AbortSignal.timeout(5000),
      })
      checks.firecrawl = { 
        status: response.ok ? 'ok' : 'error', 
        latencyMs: Date.now() - fcStart,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      }
    } catch (error) {
      checks.firecrawl = { status: 'error', error: error.message, latencyMs: Date.now() - fcStart }
    }
  } else {
    checks.firecrawl = { status: 'ok', latencyMs: 0 } // Skip if not configured
  }

  // Overall status
  const allOk = Object.values(checks).every(c => c.status === 'ok')

  return {
    success: true,
    data: {
      status: allOk ? 'healthy' : 'degraded',
      version: GATEWAY_VERSION,
      timestamp: new Date().toISOString(),
      checks,
      uptime: {
        gatewayVersion: GATEWAY_VERSION,
        minExtensionVersion: MIN_EXTENSION_VERSION,
        currentExtensionVersion: CURRENT_EXTENSION_VERSION,
      }
    }
  }
}

// =============================================================================
// GET PIPELINE STATUS (for monitoring)
// =============================================================================

async function handleGetPipelineStatus(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Get recent pipeline logs
    const { data: recentLogs, error } = await ctx.supabase
      .from('import_pipeline_logs')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    // Calculate stats
    const stats = {
      total: recentLogs?.length || 0,
      v3_orchestrator: 0,
      legacy: 0,
      success: 0,
      error: 0,
      avg_duration_ms: 0,
      avg_completeness: 0,
    }

    let totalDuration = 0
    let totalCompleteness = 0

    for (const log of recentLogs || []) {
      if (log.pipeline_used === 'v3_orchestrator') stats.v3_orchestrator++
      else stats.legacy++

      if (log.status === 'success') stats.success++
      else if (log.status === 'error') stats.error++

      if (log.duration_ms) totalDuration += log.duration_ms
      if (log.completeness_score) totalCompleteness += log.completeness_score
    }

    if (stats.total > 0) {
      stats.avg_duration_ms = Math.round(totalDuration / stats.total)
      stats.avg_completeness = Math.round(totalCompleteness / stats.total)
    }

    return {
      success: true,
      data: {
        stats,
        recent_logs: recentLogs?.slice(0, 10).map(l => ({
          id: l.id,
          platform: l.platform,
          pipeline: l.pipeline_used,
          status: l.status,
          duration_ms: l.duration_ms,
          completeness: l.completeness_score,
          created_at: l.created_at,
        })),
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleUtilityAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'CHECK_VERSION':
      return handleCheckVersion(payload, ctx)
    case 'GET_SETTINGS':
      return handleGetSettings(payload, ctx)
    case 'LOG_ACTION':
      return handleLogAction(payload, ctx)
    case 'LOG_ANALYTICS':
      return handleLogAnalytics(payload, ctx)
    case 'CHECK_QUOTA':
      return handleCheckQuota(payload, ctx)
    case 'GET_IMPORT_JOB':
      return handleGetImportJob(payload, ctx)
    case 'GET_PRODUCT_IMPORT_JOB':
      return handleGetProductImportJob(payload, ctx)
    case 'HEALTHCHECK':
      return handleHealthcheck(payload, ctx)
    case 'GET_PIPELINE_STATUS':
      return handleGetPipelineStatus(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown utility action: ${action}` }
      }
  }
}
