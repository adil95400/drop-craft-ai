/**
 * Response Formatter v1.0
 * 
 * Standardizes ALL gateway responses to a consistent format:
 * { ok: boolean, code: string, message: string, data?: T, meta: ResponseMeta }
 * 
 * Ensures no response ever leaves the gateway without proper structure.
 */

import { GATEWAY_VERSION, GatewayContext, ERROR_CODES } from '../types.ts'

// =============================================================================
// TYPES
// =============================================================================

export interface ResponseMeta {
  gateway_version: string
  timestamp: string
  request_id: string
  action?: string
  duration_ms?: number
  rate_limit?: {
    remaining: number
    reset_at: string
  }
  cached?: boolean
}

export interface StandardResponse<T = unknown> {
  ok: boolean
  code: string
  message: string
  data?: T
  meta: ResponseMeta
}

export interface ErrorDetails {
  [key: string]: unknown
}

// =============================================================================
// SUCCESS RESPONSE BUILDER
// =============================================================================

export function buildSuccessResponse<T>(
  ctx: GatewayContext,
  action: string,
  data: T,
  options: {
    message?: string
    cached?: boolean
    rateLimit?: { remaining: number; resetAt: Date }
  } = {}
): StandardResponse<T> {
  const durationMs = Date.now() - ctx.startTime

  return {
    ok: true,
    code: 'SUCCESS',
    message: options.message || 'Operation completed successfully',
    data,
    meta: {
      gateway_version: GATEWAY_VERSION,
      timestamp: new Date().toISOString(),
      request_id: ctx.requestId,
      action,
      duration_ms: durationMs,
      ...(options.cached && { cached: true }),
      ...(options.rateLimit && {
        rate_limit: {
          remaining: options.rateLimit.remaining,
          reset_at: options.rateLimit.resetAt.toISOString(),
        },
      }),
    },
  }
}

// =============================================================================
// ERROR RESPONSE BUILDER
// =============================================================================

export function buildErrorResponse(
  ctx: GatewayContext | null,
  code: string,
  message: string,
  details?: ErrorDetails
): StandardResponse<ErrorDetails | undefined> {
  const durationMs = ctx ? Date.now() - ctx.startTime : 0

  return {
    ok: false,
    code,
    message,
    data: details,
    meta: {
      gateway_version: GATEWAY_VERSION,
      timestamp: new Date().toISOString(),
      request_id: ctx?.requestId || 'unknown',
      duration_ms: durationMs,
    },
  }
}

// =============================================================================
// HTTP RESPONSE HELPERS
// =============================================================================

export function successHttpResponse<T>(
  ctx: GatewayContext,
  action: string,
  data: T,
  corsHeaders: Record<string, string>,
  options: {
    message?: string
    cached?: boolean
    rateLimit?: { remaining: number; resetAt: Date }
  } = {}
): Response {
  const body = buildSuccessResponse(ctx, action, data, options)

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorHttpResponse(
  ctx: GatewayContext | null,
  errorConfig: { code: string; status: number; message: string },
  corsHeaders: Record<string, string>,
  details?: ErrorDetails
): Response {
  const body = buildErrorResponse(ctx, errorConfig.code, errorConfig.message, details)

  return new Response(JSON.stringify(body), {
    status: errorConfig.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// =============================================================================
// HANDLER RESULT TO RESPONSE
// =============================================================================

export interface HandlerResult<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export function handlerResultToResponse<T>(
  ctx: GatewayContext,
  action: string,
  result: HandlerResult<T>,
  corsHeaders: Record<string, string>,
  rateLimit?: { remaining: number; resetAt: Date }
): Response {
  if (result.success) {
    return successHttpResponse(ctx, action, result.data, corsHeaders, {
      rateLimit,
    })
  }

  const errorCode = result.error?.code || 'HANDLER_ERROR'
  const errorConfig = ERROR_CODES[errorCode as keyof typeof ERROR_CODES] || {
    code: errorCode,
    status: 500,
    message: result.error?.message || 'An error occurred',
  }

  return errorHttpResponse(ctx, errorConfig, corsHeaders, result.error?.details)
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateResponseShape<T>(response: unknown): response is StandardResponse<T> {
  if (!response || typeof response !== 'object') return false

  const r = response as Record<string, unknown>
  return (
    typeof r.ok === 'boolean' &&
    typeof r.code === 'string' &&
    typeof r.message === 'string' &&
    r.meta !== undefined &&
    typeof r.meta === 'object'
  )
}

// =============================================================================
// ERROR CODE TO HTTP STATUS
// =============================================================================

export function getHttpStatusForCode(code: string): number {
  const errorConfig = ERROR_CODES[code as keyof typeof ERROR_CODES]
  if (errorConfig) return errorConfig.status

  // Default mappings
  if (code.startsWith('AUTH_') || code === 'UNAUTHORIZED') return 401
  if (code.startsWith('FORBIDDEN_') || code === 'FORBIDDEN') return 403
  if (code.startsWith('NOT_FOUND_') || code === 'NOT_FOUND') return 404
  if (code.startsWith('VALIDATION_') || code === 'INVALID_PAYLOAD') return 400
  if (code.startsWith('RATE_') || code === 'QUOTA_EXCEEDED') return 429
  if (code === 'REPLAY_DETECTED' || code === 'IN_PROGRESS') return 409

  return 500
}

// =============================================================================
// COMMON ERROR RESPONSES
// =============================================================================

export const CommonErrors = {
  unauthorized: (ctx: GatewayContext | null, corsHeaders: Record<string, string>) =>
    errorHttpResponse(ctx, ERROR_CODES.UNAUTHORIZED, corsHeaders),

  invalidToken: (ctx: GatewayContext | null, corsHeaders: Record<string, string>) =>
    errorHttpResponse(ctx, ERROR_CODES.INVALID_TOKEN, corsHeaders),

  invalidPayload: (ctx: GatewayContext | null, corsHeaders: Record<string, string>, issues?: unknown) =>
    errorHttpResponse(ctx, ERROR_CODES.INVALID_PAYLOAD, corsHeaders, { issues }),

  quotaExceeded: (ctx: GatewayContext | null, corsHeaders: Record<string, string>, details?: ErrorDetails) =>
    errorHttpResponse(ctx, ERROR_CODES.QUOTA_EXCEEDED, corsHeaders, details),

  replayDetected: (ctx: GatewayContext | null, corsHeaders: Record<string, string>) =>
    errorHttpResponse(ctx, ERROR_CODES.REPLAY_DETECTED, corsHeaders),

  inProgress: (ctx: GatewayContext | null, corsHeaders: Record<string, string>) =>
    errorHttpResponse(ctx, ERROR_CODES.IN_PROGRESS, corsHeaders),

  internalError: (ctx: GatewayContext | null, corsHeaders: Record<string, string>, message?: string) =>
    errorHttpResponse(ctx, { ...ERROR_CODES.INTERNAL, message: message || ERROR_CODES.INTERNAL.message }, corsHeaders),
}
