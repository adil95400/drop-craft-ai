/**
 * Anti-Replay Protection v1.0
 * 
 * Prevents duplicate request processing using unique request IDs.
 * Uses a 30-day TTL for request tracking.
 */

import { GatewayContext } from '../types.ts'
import { createLogger } from './structured-logger.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface AntiReplayRecord {
  request_id: string
  user_id: string
  action: string
  processed_at: string
  expires_at: string
  response_hash?: string
}

export interface AntiReplayResult {
  isReplay: boolean
  originalProcessedAt?: string
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const REPLAY_WINDOW_DAYS = 30
const CLEANUP_BATCH_SIZE = 1000

// =============================================================================
// ANTI-REPLAY CHECK
// =============================================================================

/**
 * Check if a request has already been processed.
 * Returns true if this is a duplicate request.
 */
export async function checkAntiReplay(
  ctx: GatewayContext,
  action: string
): Promise<AntiReplayResult> {
  const logger = createLogger(ctx, action)
  
  if (!ctx.requestId) {
    logger.warn('No request ID provided for anti-replay check')
    return { isReplay: false }
  }

  try {
    // Check for existing request
    const { data: existing, error: selectError } = await ctx.supabase
      .from('request_replay_log')
      .select('request_id, processed_at')
      .eq('request_id', ctx.requestId)
      .maybeSingle()

    if (selectError) {
      logger.error('Failed to check anti-replay', selectError)
      // On error, allow request to proceed (fail-open)
      return { isReplay: false }
    }

    if (existing) {
      logger.logAntiReplay(false, ctx.requestId)
      return {
        isReplay: true,
        originalProcessedAt: existing.processed_at,
      }
    }

    // Record this request
    const expiresAt = new Date(Date.now() + REPLAY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    
    const { error: insertError } = await ctx.supabase
      .from('request_replay_log')
      .insert({
        request_id: ctx.requestId,
        user_id: ctx.userId,
        action,
        processed_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      // Unique constraint violation = race condition, treat as replay
      if (insertError.code === '23505') {
        logger.logAntiReplay(false, ctx.requestId)
        return { isReplay: true }
      }
      
      logger.error('Failed to record request for anti-replay', insertError)
      // On other errors, allow request
      return { isReplay: false }
    }

    logger.logAntiReplay(true, ctx.requestId)
    return { isReplay: false }
  } catch (error) {
    logger.error('Anti-replay check exception', error)
    return { isReplay: false }
  }
}

/**
 * Validate request ID format.
 * Must be a valid UUID or similar unique identifier.
 */
export function isValidRequestId(requestId: string): boolean {
  if (!requestId || typeof requestId !== 'string') return false
  
  // Allow UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (uuidRegex.test(requestId)) return true
  
  // Allow custom format: prefix + timestamp + random
  const customRegex = /^req_[a-zA-Z0-9]{8,32}$/
  if (customRegex.test(requestId)) return true
  
  // Allow nanoid-style IDs
  const nanoidRegex = /^[a-zA-Z0-9_-]{21,36}$/
  return nanoidRegex.test(requestId)
}

/**
 * Generate a unique request ID if none provided.
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = crypto.randomUUID().split('-').join('').slice(0, 16)
  return `req_${timestamp}${random}`
}

// =============================================================================
// CLEANUP UTILITIES
// =============================================================================

/**
 * Clean up expired replay records.
 * Should be called periodically via a scheduled job.
 */
export async function cleanupExpiredReplayRecords(
  supabase: any
): Promise<{ deleted: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('request_replay_log')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('request_id')
      .limit(CLEANUP_BATCH_SIZE)

    if (error) {
      return { deleted: 0, error: error.message }
    }

    return { deleted: data?.length || 0 }
  } catch (error) {
    return {
      deleted: 0,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    }
  }
}

// =============================================================================
// MIDDLEWARE HELPER
// =============================================================================

/**
 * Anti-replay middleware for gateway handlers.
 * Wraps a handler to check for replay attacks before execution.
 */
export function withAntiReplay<T>(
  handler: (ctx: GatewayContext) => Promise<T>
): (ctx: GatewayContext) => Promise<T | { success: false; error: { code: string; message: string } }> {
  return async (ctx: GatewayContext) => {
    const replayResult = await checkAntiReplay(ctx, 'unknown')
    
    if (replayResult.isReplay) {
      return {
        success: false,
        error: {
          code: 'REPLAY_DETECTED',
          message: `Request ${ctx.requestId} was already processed at ${replayResult.originalProcessedAt}`,
        },
      }
    }
    
    return handler(ctx)
  }
}
