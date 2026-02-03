/**
 * Shared Utilities for Extension Gateway
 * Helper functions used across all handlers
 */

import { ERROR_CODES, GATEWAY_VERSION, GatewayContext, MIN_EXTENSION_VERSION } from './types.ts'

// =============================================================================
// ORIGIN VALIDATION
// =============================================================================

const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
]

const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/
const CHROME_EXTENSION_PATTERN = /^chrome-extension:\/\/[a-z]{32}$/

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true
  if (CHROME_EXTENSION_PATTERN.test(origin)) return true
  return false
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version, x-extension-id, x-request-id, x-idempotency-key',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

// =============================================================================
// RESPONSE HELPERS
// =============================================================================

export function successResponse(
  data: any, 
  meta: Record<string, any>,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify({
    ok: true,
    data,
    meta: {
      ...meta,
      gatewayVersion: GATEWAY_VERSION,
      timestamp: new Date().toISOString(),
    }
  }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

export function errorResponse(
  errorConfig: { code: string; status: number; message: string },
  details: Record<string, any> = {},
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify({
    ok: false,
    code: errorConfig.code,
    message: errorConfig.message,
    details,
    meta: {
      gatewayVersion: GATEWAY_VERSION,
      timestamp: new Date().toISOString(),
    }
  }), {
    status: errorConfig.status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// =============================================================================
// VERSION UTILITIES
// =============================================================================

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((parts1[i] || 0) > (parts2[i] || 0)) return 1
    if ((parts1[i] || 0) < (parts2[i] || 0)) return -1
  }
  return 0
}

export function isVersionSupported(version: string): boolean {
  return compareVersions(version, MIN_EXTENSION_VERSION) >= 0
}

// =============================================================================
// TOKEN & VALIDATION UTILITIES
// =============================================================================

export function sanitizeToken(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null
  return sanitized
}

export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// =============================================================================
// ANTI-REPLAY PROTECTION
// =============================================================================

export async function checkAntiReplay(
  supabase: any,
  requestId: string,
  userId: string | null,
  extensionId: string,
  action: string
): Promise<{ allowed: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('extension_requests')
    .select('id')
    .eq('request_id', requestId)
    .maybeSingle()

  if (existing) {
    return { allowed: false, error: 'Request already processed' }
  }

  const { error } = await supabase.from('extension_requests').insert({
    request_id: requestId,
    user_id: userId || '00000000-0000-0000-0000-000000000000',
    extension_id: extensionId,
    action: action,
  })

  if (error?.code === '23505') {
    return { allowed: false, error: 'Request already processed' }
  }

  return { allowed: true }
}

// =============================================================================
// IDEMPOTENCY HANDLING
// =============================================================================

export async function checkIdempotency(
  supabase: any,
  idempotencyKey: string,
  userId: string,
  action: string
): Promise<{ 
  status: 'new' | 'started' | 'succeeded' | 'failed';
  cachedResponse?: any;
}> {
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('status, response_data')
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('idempotency_keys').insert({
      idempotency_key: idempotencyKey,
      user_id: userId,
      action: action,
      status: 'started',
    })
    return { status: 'new' }
  }

  return { 
    status: existing.status,
    cachedResponse: existing.response_data
  }
}

export async function updateIdempotency(
  supabase: any,
  idempotencyKey: string,
  userId: string,
  status: 'succeeded' | 'failed',
  responseData: any
): Promise<void> {
  await supabase
    .from('idempotency_keys')
    .update({
      status,
      response_data: responseData,
      updated_at: new Date().toISOString(),
    })
    .eq('idempotency_key', idempotencyKey)
    .eq('user_id', userId)
}

// =============================================================================
// RATE LIMITING
// =============================================================================

export async function checkRateLimit(
  supabase: any,
  userId: string | null,
  action: string,
  config: { maxRequests: number; windowMinutes: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

  try {
    const { count, error } = await supabase
      .from('extension_events')
      .select('*', { count: 'exact', head: true })
      .eq('action', action)
      .eq('user_id', userId || '00000000-0000-0000-0000-000000000000')
      .gte('created_at', windowStart.toISOString())

    if (error) {
      console.error('[Gateway] Rate limit check error:', error)
      return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
    }

    const currentCount = count || 0
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const allowed = currentCount < config.maxRequests

    return { allowed, remaining, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
  } catch (error) {
    console.error('[Gateway] Unexpected rate limit error:', error)
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
  }
}

// =============================================================================
// OBSERVABILITY LOGGING
// =============================================================================

export async function logEvent(
  supabase: any,
  ctx: GatewayContext,
  action: string,
  status: 'success' | 'error' | 'timeout' | 'cancelled',
  errorCode: string | null,
  errorMessage: string | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  const durationMs = Date.now() - ctx.startTime

  try {
    await supabase.from('extension_events').insert({
      user_id: ctx.userId || '00000000-0000-0000-0000-000000000000',
      action,
      platform: metadata.platform || null,
      status,
      error_code: errorCode,
      error_message: errorMessage,
      duration_ms: durationMs,
      request_id: ctx.requestId,
      extension_id: ctx.extensionId,
      extension_version: ctx.extensionVersion,
      metadata: {
        ...metadata,
        idempotency_key: ctx.idempotencyKey,
      },
    })
  } catch (e) {
    console.error('[Gateway] Log event error:', e)
  }
}

// =============================================================================
// TOKEN VALIDATION
// =============================================================================

export async function validateExtensionToken(supabase: any, token: string): Promise<{
  success: boolean
  user?: { id: string; email?: string; plan?: string }
  permissions?: string[]
  error?: string
}> {
  const { data, error } = await supabase.rpc('validate_extension_token', { p_token: token })
  
  if (error || !data?.success) {
    return { success: false, error: data?.error || 'Invalid token' }
  }

  return {
    success: true,
    user: data.user,
    permissions: data.permissions
  }
}
