/**
 * Pipeline Router v1.0
 * 
 * Routes import requests between legacy and new (v3) pipelines based on:
 * - Feature flag: import.pipeline.v3
 * - Platform A/B test: amazon, temu => new pipeline
 * - Rollout percentage for gradual deployment
 * 
 * Provides comprehensive logging for monitoring and debugging.
 */

import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface RoutingDecision {
  useNewPipeline: boolean
  reason: string
  platform: string
  supportedPlatforms: string[]
  rolloutPercentage: number
  logId?: string
}

export interface PipelineLogEntry {
  userId: string
  requestId: string
  platform: string
  sourceUrl: string
  pipelineUsed: 'legacy' | 'v3_orchestrator'
  routingReason: string
  metadata?: Record<string, unknown>
}

export interface PipelineCompletionData {
  status: 'success' | 'partial' | 'error' | 'fallback'
  productId?: string
  jobId?: string
  completenessScore?: number
  extractionMethod?: string
  errorCode?: string
  errorMessage?: string
  fallbackTriggered?: boolean
  fallbackSuccess?: boolean
}

// =============================================================================
// SUPPORTED PLATFORMS FOR NEW PIPELINE
// =============================================================================

const NEW_PIPELINE_PLATFORMS = ['amazon', 'temu']

// =============================================================================
// ROUTING DECISION
// =============================================================================

/**
 * Determine which pipeline to use based on feature flag and platform
 */
export async function getRoutingDecision(
  platform: string,
  userId: string,
  ctx: GatewayContext
): Promise<RoutingDecision> {
  try {
    // Call the database function to get routing decision
    const { data, error } = await ctx.supabase
      .rpc('should_use_new_import_pipeline', {
        p_user_id: userId,
        p_platform: platform.toLowerCase(),
        p_feature_flag_key: 'import.pipeline.v3'
      })

    if (error) {
      console.error('[PipelineRouter] Error fetching routing decision:', error)
      // Default to legacy on error
      return {
        useNewPipeline: false,
        reason: 'error_fetching_flag',
        platform,
        supportedPlatforms: NEW_PIPELINE_PLATFORMS,
        rolloutPercentage: 0
      }
    }

    const result = data as {
      use_new_pipeline: boolean
      reason: string
      platform: string
      supported_platforms: string[]
      rollout_percentage: number
    }

    return {
      useNewPipeline: result.use_new_pipeline,
      reason: result.reason,
      platform: result.platform,
      supportedPlatforms: result.supported_platforms || NEW_PIPELINE_PLATFORMS,
      rolloutPercentage: result.rollout_percentage || 100
    }
  } catch (error) {
    console.error('[PipelineRouter] Exception in routing decision:', error)
    return {
      useNewPipeline: false,
      reason: 'exception',
      platform,
      supportedPlatforms: NEW_PIPELINE_PLATFORMS,
      rolloutPercentage: 0
    }
  }
}

/**
 * Quick sync check without database call (for fast-path decisions)
 */
export function shouldUseNewPipelineSync(platform: string): boolean {
  return NEW_PIPELINE_PLATFORMS.includes(platform.toLowerCase())
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Log the start of a pipeline execution
 */
export async function logPipelineStart(
  entry: PipelineLogEntry,
  ctx: GatewayContext
): Promise<string | null> {
  try {
    const { data, error } = await ctx.supabase
      .rpc('log_import_pipeline', {
        p_user_id: entry.userId,
        p_request_id: entry.requestId,
        p_platform: entry.platform,
        p_source_url: entry.sourceUrl,
        p_pipeline_used: entry.pipelineUsed,
        p_routing_reason: entry.routingReason,
        p_status: 'started',
        p_metadata: entry.metadata || {}
      })

    if (error) {
      console.error('[PipelineRouter] Failed to log pipeline start:', error)
      return null
    }

    console.log(`[PipelineRouter] Logged start: ${data} | ${entry.pipelineUsed} | ${entry.platform}`)
    return data as string
  } catch (error) {
    console.error('[PipelineRouter] Exception logging pipeline start:', error)
    return null
  }
}

/**
 * Log the completion of a pipeline execution
 */
export async function logPipelineComplete(
  logId: string,
  completion: PipelineCompletionData,
  ctx: GatewayContext
): Promise<void> {
  try {
    const { error } = await ctx.supabase
      .rpc('complete_import_pipeline_log', {
        p_log_id: logId,
        p_status: completion.status,
        p_product_id: completion.productId || null,
        p_job_id: completion.jobId || null,
        p_completeness_score: completion.completenessScore || null,
        p_extraction_method: completion.extractionMethod || null,
        p_error_code: completion.errorCode || null,
        p_error_message: completion.errorMessage || null,
        p_fallback_triggered: completion.fallbackTriggered || false,
        p_fallback_success: completion.fallbackSuccess || null
      })

    if (error) {
      console.error('[PipelineRouter] Failed to log pipeline completion:', error)
    } else {
      console.log(`[PipelineRouter] Logged completion: ${logId} | ${completion.status}`)
    }
  } catch (error) {
    console.error('[PipelineRouter] Exception logging completion:', error)
  }
}

/**
 * Direct insert to pipeline logs (fallback when RPC not available)
 */
export async function logPipelineDirect(
  entry: PipelineLogEntry,
  ctx: GatewayContext
): Promise<string | null> {
  try {
    const { data, error } = await ctx.supabase
      .from('import_pipeline_logs')
      .insert({
        user_id: entry.userId,
        request_id: entry.requestId,
        platform: entry.platform,
        source_url: entry.sourceUrl,
        pipeline_used: entry.pipelineUsed,
        routing_reason: entry.routingReason,
        status: 'started',
        metadata: entry.metadata || {},
        extension_version: (entry.metadata as any)?.extension_version
      })
      .select('id')
      .single()

    if (error) {
      console.error('[PipelineRouter] Direct log insert failed:', error)
      return null
    }

    return data?.id || null
  } catch (error) {
    console.error('[PipelineRouter] Exception in direct log:', error)
    return null
  }
}

// =============================================================================
// PIPELINE EXECUTION WRAPPER
// =============================================================================

export interface PipelineExecutionOptions {
  userId: string
  requestId: string
  platform: string
  sourceUrl: string
  extensionVersion?: string
  legacyHandler: () => Promise<HandlerResult>
  newPipelineHandler: () => Promise<HandlerResult>
  fallbackToLegacy?: boolean
}

/**
 * Execute the appropriate pipeline with automatic routing, logging, and fallback
 */
export async function executePipeline(
  options: PipelineExecutionOptions,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const {
    userId,
    requestId,
    platform,
    sourceUrl,
    extensionVersion,
    legacyHandler,
    newPipelineHandler,
    fallbackToLegacy = true
  } = options

  // Step 1: Get routing decision
  const decision = await getRoutingDecision(platform, userId, ctx)
  
  console.log(`[PipelineRouter] Routing decision for ${platform}:`, {
    useNew: decision.useNewPipeline,
    reason: decision.reason,
    rollout: decision.rolloutPercentage
  })

  // Step 2: Log pipeline start
  const logId = await logPipelineStart({
    userId,
    requestId,
    platform,
    sourceUrl,
    pipelineUsed: decision.useNewPipeline ? 'v3_orchestrator' : 'legacy',
    routingReason: decision.reason,
    metadata: { extensionVersion, decision }
  }, ctx)

  // Step 3: Execute appropriate pipeline
  let result: HandlerResult
  let fallbackTriggered = false
  let fallbackSuccess = false

  try {
    if (decision.useNewPipeline) {
      // Execute new pipeline
      console.log(`[PipelineRouter] Executing v3_orchestrator for ${platform}`)
      result = await newPipelineHandler()
      
      // Check if we need to fallback
      if (!result.success && fallbackToLegacy) {
        console.log(`[PipelineRouter] New pipeline failed, falling back to legacy`)
        fallbackTriggered = true
        
        try {
          result = await legacyHandler()
          fallbackSuccess = result.success
          console.log(`[PipelineRouter] Fallback result: ${fallbackSuccess ? 'success' : 'failed'}`)
        } catch (fallbackError) {
          console.error('[PipelineRouter] Fallback also failed:', fallbackError)
          fallbackSuccess = false
        }
      }
    } else {
      // Execute legacy pipeline
      console.log(`[PipelineRouter] Executing legacy for ${platform}`)
      result = await legacyHandler()
    }
  } catch (error) {
    console.error('[PipelineRouter] Pipeline execution error:', error)
    result = {
      success: false,
      error: {
        code: 'PIPELINE_ERROR',
        message: error instanceof Error ? error.message : 'Pipeline execution failed'
      }
    }
  }

  // Step 4: Log completion
  if (logId) {
    await logPipelineComplete(logId, {
      status: result.success ? 'success' : (fallbackTriggered && fallbackSuccess ? 'fallback' : 'error'),
      productId: result.data?.product?.id || result.data?.product_id,
      jobId: result.data?.job_id,
      completenessScore: result.data?.completeness_score,
      extractionMethod: result.data?.extraction_method,
      errorCode: result.error?.code,
      errorMessage: result.error?.message,
      fallbackTriggered,
      fallbackSuccess: fallbackTriggered ? fallbackSuccess : undefined
    }, ctx)
  }

  // Add routing metadata to response
  if (result.data) {
    result.data._routing = {
      pipeline: decision.useNewPipeline ? 'v3_orchestrator' : 'legacy',
      reason: decision.reason,
      fallback_triggered: fallbackTriggered,
      fallback_success: fallbackSuccess,
      log_id: logId
    }
  }

  return result
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extract platform from URL
 */
export function detectPlatformFromUrl(url: string): string {
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

/**
 * Check if platform is supported by new pipeline
 */
export function isNewPipelineSupported(platform: string): boolean {
  return NEW_PIPELINE_PLATFORMS.includes(platform.toLowerCase())
}

/**
 * Get list of platforms supported by new pipeline
 */
export function getNewPipelinePlatforms(): string[] {
  return [...NEW_PIPELINE_PLATFORMS]
}
