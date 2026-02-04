/**
 * Anti-Replay Middleware v1.0
 * 
 * Prevents replay attacks by ensuring each request_id is used only once.
 * Uses database-backed storage with automatic TTL cleanup.
 * 
 * Protection:
 * - Request ID must be a valid UUID
 * - Request ID must not have been seen in the last 30 days
 * - Failed replay attempts are logged for security auditing
 */

import { GatewayContext } from '../types.ts'
import { createLogger } from './structured-logger.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface AntiReplayResult {
  allowed: boolean
  error?: string
  details?: {
    request_id: string
    blocked_reason?: string
    first_seen_at?: string
  }
}

export interface AntiReplayOptions {
  /** TTL in days for request ID retention (default: 30) */
  ttlDays?: number
  /** Whether to log blocked attempts (default: true) */
  logBlockedAttempts?: boolean
  /** Whether to throw on replay (default: false) */
  throwOnReplay?: boolean
}

// =============================================================================
// ANTI-REPLAY CHECK
// =============================================================================

export async function checkAntiReplay(
  ctx: GatewayContext,
  requestId: string,
  action: string,
  options: AntiReplayOptions = {}
): Promise<AntiReplayResult> {
  const logger = createLogger(ctx, action)
  const { ttlDays = 30, logBlockedAttempts = true } = options

  // Validate request ID format
  if (!isValidUUID(requestId)) {
    logger.logSecurity('INVALID_REQUEST_ID_FORMAT', { request_id: requestId })
    return {
      allowed: false,
      error: 'Invalid request ID format - must be a valid UUID',
      details: {
        request_id: requestId,
        blocked_reason: 'INVALID_FORMAT',
      },
    }
  }

  try {
    // Check if request ID already exists
    const { data: existing, error: selectError } = await ctx.supabase
      .from('extension_requests')
      .select('id, created_at')
      .eq('request_id', requestId)
      .maybeSingle()

    if (selectError) {
      logger.error('Anti-replay check failed', selectError)
      // Fail open on database errors to prevent blocking legitimate requests
      return { allowed: true }
    }

    // If exists, block as replay
    if (existing) {
      logger.logAntiReplay(false, requestId)

      if (logBlockedAttempts) {
        await logSecurityEvent(ctx, 'REPLAY_ATTEMPT_BLOCKED', {
          request_id: requestId,
          original_created_at: existing.created_at,
          user_id: ctx.userId,
          extension_id: ctx.extensionId,
        })
      }

      return {
        allowed: false,
        error: 'Request ID has already been used',
        details: {
          request_id: requestId,
          blocked_reason: 'REPLAY_DETECTED',
          first_seen_at: existing.created_at,
        },
      }
    }

    // Insert new request ID
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
    const { error: insertError } = await ctx.supabase.from('extension_requests').insert({
      request_id: requestId,
      user_id: ctx.userId || '00000000-0000-0000-0000-000000000000',
      extension_id: ctx.extensionId,
      action: action,
      expires_at: expiresAt.toISOString(),
    })

    // Handle race condition
    if (insertError?.code === '23505') {
      // Unique constraint violation - another request beat us
      logger.logAntiReplay(false, requestId)
      return {
        allowed: false,
        error: 'Request ID collision detected',
        details: {
          request_id: requestId,
          blocked_reason: 'CONCURRENT_REPLAY',
        },
      }
    }

    if (insertError) {
      logger.error('Failed to record request ID', insertError)
      // Fail open on insert errors
      return { allowed: true }
    }

    logger.logAntiReplay(true, requestId)
    return { allowed: true }

  } catch (error) {
    logger.error('Anti-replay check exception', error)
    // Fail open on exceptions
    return { allowed: true }
  }
}

// =============================================================================
// MIDDLEWARE WRAPPER
// =============================================================================

export function withAntiReplay<T>(
  handler: (ctx: GatewayContext) => Promise<T>,
  action: string,
  options?: AntiReplayOptions
): (ctx: GatewayContext) => Promise<T | { success: false; error: { code: string; message: string } }> {
  return async (ctx: GatewayContext) => {
    const result = await checkAntiReplay(ctx, ctx.requestId, action, options)

    if (!result.allowed) {
      return {
        success: false,
        error: {
          code: 'REPLAY_DETECTED',
          message: result.error || 'Request replay detected',
          details: result.details,
        },
      }
    }

    return handler(ctx)
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

async function logSecurityEvent(
  ctx: GatewayContext,
  eventType: string,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await ctx.supabase.from('security_events').insert({
      user_id: ctx.userId,
      event_type: eventType,
      severity: 'medium',
      description: `Anti-replay: ${eventType}`,
      metadata: {
        ...metadata,
        gateway_request_id: ctx.requestId,
        extension_version: ctx.extensionVersion,
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Silently fail - security logging should not break the main flow
  }
}

// =============================================================================
// CLEANUP FUNCTION (for scheduled maintenance)
// =============================================================================

export async function cleanupExpiredRequests(supabase: any): Promise<{ deleted: number }> {
  const now = new Date().toISOString()

  const { count, error } = await supabase
    .from('extension_requests')
    .delete({ count: 'exact' })
    .lt('expires_at', now)

  if (error) {
    console.error('Failed to cleanup expired requests:', error)
    return { deleted: 0 }
  }

  return { deleted: count || 0 }
}

// =============================================================================
// RATE LIMITING HELPER (optional additional protection)
// =============================================================================

export async function checkRequestRate(
  ctx: GatewayContext,
  windowMinutes: number = 1,
  maxRequests: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - windowMinutes)

  const { count } = await ctx.supabase
    .from('extension_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', ctx.userId || '00000000-0000-0000-0000-000000000000')
    .gte('created_at', windowStart.toISOString())

  const currentCount = count || 0
  const remaining = Math.max(0, maxRequests - currentCount)

  return {
    allowed: currentCount < maxRequests,
    remaining,
  }
}
