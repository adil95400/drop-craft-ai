/**
 * Idempotency Wrapper v1.0
 * 
 * Ensures ALL write operations are idempotent.
 * Wraps handlers with automatic idempotency key management.
 * 
 * Flow:
 * 1. Check if idempotency key exists with 'succeeded' status → return cached
 * 2. Check if idempotency key exists with 'started' status → return IN_PROGRESS
 * 3. Create key with 'started' status
 * 4. Execute handler
 * 5. Update key to 'succeeded' or 'failed' with response
 */

import { GatewayContext, HandlerResult } from '../types.ts'
import { createLogger } from './structured-logger.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface IdempotencyRecord {
  idempotency_key: string
  user_id: string
  action: string
  status: 'started' | 'succeeded' | 'failed'
  response_data: unknown
  created_at: string
  updated_at: string
  expires_at: string
}

export interface IdempotencyCheckResult {
  status: 'new' | 'started' | 'succeeded' | 'failed'
  cachedResponse?: unknown
}

export interface WrapperOptions {
  /** TTL for idempotency records in seconds (default: 7 days) */
  ttlSeconds?: number
  /** Whether to throw on concurrent requests (default: false, returns IN_PROGRESS) */
  throwOnConcurrent?: boolean
}

// =============================================================================
// IDEMPOTENCY WRAPPER
// =============================================================================

export async function withIdempotency<T>(
  ctx: GatewayContext,
  action: string,
  handler: () => Promise<HandlerResult<T>>,
  options: WrapperOptions = {}
): Promise<HandlerResult<T>> {
  const logger = createLogger(ctx, action)
  const { ttlSeconds = 604800 } = options // 7 days default

  // If no idempotency key, just run the handler
  if (!ctx.idempotencyKey) {
    logger.warn('No idempotency key provided for write operation')
    return handler()
  }

  // Check existing idempotency record
  const checkResult = await checkIdempotencyKey(ctx, ctx.idempotencyKey, ctx.userId!, action)
  logger.logIdempotency(checkResult.status === 'new' ? 'new' : 
                         checkResult.status === 'succeeded' ? 'cached' : 'in_progress',
                         ctx.idempotencyKey)

  // Return cached response if succeeded
  if (checkResult.status === 'succeeded') {
    return {
      success: true,
      data: checkResult.cachedResponse as T,
    }
  }

  // Return error if already in progress
  if (checkResult.status === 'started') {
    return {
      success: false,
      error: {
        code: 'IN_PROGRESS',
        message: 'A request with this idempotency key is already being processed',
        details: { idempotency_key: ctx.idempotencyKey },
      },
    }
  }

  // Execute the handler
  try {
    logger.startSpan('handler_execution')
    const result = await handler()
    logger.endSpan('handler_execution')

    // Update idempotency record
    const status = result.success ? 'succeeded' : 'failed'
    await updateIdempotencyKey(ctx, ctx.idempotencyKey, ctx.userId!, status, result.data, ttlSeconds)

    return result
  } catch (error) {
    // Mark as failed on exception
    await updateIdempotencyKey(ctx, ctx.idempotencyKey, ctx.userId!, 'failed', null, ttlSeconds)
    logger.error('Handler execution failed', error)

    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error instanceof Error ? error.message : 'Handler execution failed',
      },
    }
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function checkIdempotencyKey(
  ctx: GatewayContext,
  idempotencyKey: string,
  userId: string,
  action: string
): Promise<IdempotencyCheckResult> {
  // Check for existing record
  const { data: existing } = await ctx.supabase
    .from('idempotency_keys')
    .select('status, response_data')
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return {
      status: existing.status,
      cachedResponse: existing.response_data,
    }
  }

  // Create new record with 'started' status
  const expiresAt = new Date(Date.now() + 604800000) // 7 days
  const { error } = await ctx.supabase.from('idempotency_keys').insert({
    idempotency_key: idempotencyKey,
    user_id: userId,
    action,
    status: 'started',
    expires_at: expiresAt.toISOString(),
  })

  // Handle race condition - another request may have created the record
  if (error?.code === '23505') {
    // Unique constraint violation - re-check status
    const { data: retryCheck } = await ctx.supabase
      .from('idempotency_keys')
      .select('status, response_data')
      .eq('idempotency_key', idempotencyKey)
      .eq('user_id', userId)
      .single()

    if (retryCheck) {
      return {
        status: retryCheck.status,
        cachedResponse: retryCheck.response_data,
      }
    }
  }

  return { status: 'new' }
}

async function updateIdempotencyKey(
  ctx: GatewayContext,
  idempotencyKey: string,
  userId: string,
  status: 'succeeded' | 'failed',
  responseData: unknown,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await ctx.supabase
    .from('idempotency_keys')
    .update({
      status,
      response_data: responseData,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId)
}

// =============================================================================
// DECORATOR-STYLE WRAPPER
// =============================================================================

/**
 * Creates an idempotent version of a handler function.
 * Use this to wrap handlers that perform write operations.
 */
export function makeIdempotent<P, T>(
  handler: (payload: P, ctx: GatewayContext) => Promise<HandlerResult<T>>,
  options?: WrapperOptions
): (payload: P, ctx: GatewayContext) => Promise<HandlerResult<T>> {
  return async (payload: P, ctx: GatewayContext) => {
    // Derive action name from handler if possible
    const action = handler.name || 'UNKNOWN_ACTION'
    return withIdempotency(ctx, action, () => handler(payload, ctx), options)
  }
}

// =============================================================================
// IDEMPOTENCY KEY GENERATION HELPERS
// =============================================================================

/**
 * Generates a deterministic idempotency key from input parameters.
 * Useful for deriving keys from request content.
 */
export function generateIdempotencyKey(
  action: string,
  userId: string,
  uniqueParams: Record<string, unknown>
): string {
  const paramsStr = Object.entries(uniqueParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join('|')

  // Simple hash function (not cryptographic, just for key generation)
  let hash = 0
  const str = `${action}|${userId}|${paramsStr}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  return `idem_${action}_${Math.abs(hash).toString(36)}`
}

/**
 * Validates an idempotency key format.
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  return key.length >= 10 && key.length <= 100 && /^[a-zA-Z0-9_-]+$/.test(key)
}
