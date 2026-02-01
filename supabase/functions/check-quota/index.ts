/**
 * Quota Check API - ENTERPRISE SECURED v2.0
 * P0.2 Fix: JWT authentication required, userId from JWT only
 * P0.4 Fix: Restricted CORS origins
 * P0.5 Fix: quotaKey strict allowlist, rate limiting, no userId in body
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { handleError, ValidationError, AuthenticationError } from '../_shared/error-handler.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Strict CORS allowlist
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
]

// Lovable preview URL pattern
const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true
  // Extension origin from env
  const extensionOrigin = Deno.env.get('EXTENSION_ORIGIN')
  if (extensionOrigin && origin === extensionOrigin) return true
  return false
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

// P0.5 FIX: Strict allowlist of quota keys
const ALLOWED_QUOTA_KEYS = new Set([
  'import_url',
  'import_bulk',
  'import_product',
  'import_reviews',
  'ai_optimize',
  'ai_description',
  'ai_seo',
  'ai_translation',
  'competitor_analyze',
  'supplier_sync',
  'stock_sync',
  'order_automation',
  'pdf_export',
  'api_calls',
])

/**
 * Validate extension token as fallback auth
 */
async function verifyExtensionToken(req: Request, supabase: any): Promise<{ userId: string } | null> {
  const extensionToken = req.headers.get('x-extension-token')
  if (!extensionToken) return null

  const sanitized = extensionToken.trim().replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null

  const { data: result, error } = await supabase
    .rpc('validate_extension_token', { p_token: sanitized })

  if (error || !result?.success || !result?.user?.id) return null

  return { userId: result.user.id }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { headers: corsHeaders })
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 1) Authentication: Try JWT first, then extension token
    let userId: string | null = null

    try {
      const authResult = await authenticateUser(req, supabase)
      userId = authResult.user.id
    } catch {
      // Try extension token fallback
      const extAuth = await verifyExtensionToken(req, supabase)
      if (extAuth) {
        userId = extAuth.userId
      }
    }

    if (!userId) {
      throw new AuthenticationError('Authentication required')
    }

    // 2) Rate limiting
    const rateLimitResult = await checkRateLimit(
      supabase,
      userId,
      'check_quota',
      RATE_LIMITS.API_GENERAL
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    // 3) Parse and validate input
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Invalid JSON body')
    }

    // P0.5 CRITICAL: Reject any userId in body
    if ('userId' in body || 'user_id' in body) {
      // Log security event
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'security_violation_attempt',
        severity: 'critical',
        description: 'Attempt to pass userId in check-quota body',
        metadata: { blocked: true }
      })
      throw new ValidationError('Do not send userId in request body')
    }

    const quotaKey = body.quotaKey
    const incrementBy = body.incrementBy ?? 0
    const consume = body.consume ?? false

    // Validate quotaKey against strict allowlist
    if (typeof quotaKey !== 'string' || !ALLOWED_QUOTA_KEYS.has(quotaKey)) {
      throw new ValidationError(`Invalid quotaKey. Allowed: ${Array.from(ALLOWED_QUOTA_KEYS).join(', ')}`)
    }

    // Validate incrementBy
    if (typeof incrementBy !== 'number' || !Number.isFinite(incrementBy) || incrementBy < 0 || incrementBy > 1000) {
      throw new ValidationError('incrementBy must be a number between 0 and 1000')
    }

    // Validate consume flag
    if (typeof consume !== 'boolean') {
      throw new ValidationError('consume must be a boolean')
    }

    console.log(`[check-quota] Checking quota for user ${userId}, key: ${quotaKey}, increment: ${incrementBy}`)

    // 4) Check quota using RPC (safer than direct query)
    const { data: canProceed, error: checkError } = await supabase.rpc('check_quota', {
      user_id_param: userId,
      quota_key_param: quotaKey
    })

    if (checkError) {
      console.error('[check-quota] RPC error:', checkError)
      throw new Error('Failed to check quota')
    }

    // 5) Get current quota status
    const { data: quotaData } = await supabase
      .from('user_quotas')
      .select('current_count, reset_date')
      .eq('user_id', userId)
      .eq('quota_key', quotaKey)
      .maybeSingle()

    const currentCount = quotaData?.current_count ?? 0

    // 6) Get quota limit from plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single()

    let limit = null
    if (profile) {
      const { data: limitData } = await supabase
        .from('plans_limits')
        .select('limit_value')
        .eq('plan', profile.subscription_plan || 'free')
        .eq('limit_key', quotaKey)
        .maybeSingle()

      if (limitData) {
        limit = limitData.limit_value
      }
    }

    // 7) Consume quota if requested and allowed
    if (consume && incrementBy > 0) {
      const newCount = currentCount + incrementBy

      // Check if would exceed limit
      if (limit !== null && limit > 0 && newCount > limit) {
        return new Response(
          JSON.stringify({
            success: true,
            canProceed: false,
            allowed: false,
            currentCount,
            limit,
            quotaKey,
            reason: 'Quota would be exceeded'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Increment quota atomically
      const { error: incrementError } = await supabase.rpc('increment_quota', {
        user_id_param: userId,
        quota_key_param: quotaKey,
        increment_by: incrementBy
      })

      if (incrementError) {
        console.error('[check-quota] Increment error:', incrementError)
        throw new Error('Failed to increment quota')
      }

      console.log(`[check-quota] Quota consumed: ${quotaKey} +${incrementBy}`)

      return new Response(
        JSON.stringify({
          success: true,
          canProceed: true,
          allowed: true,
          currentCount: newCount,
          limit,
          quotaKey,
          consumed: incrementBy,
          resetDate: quotaData?.reset_date
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check-only mode
    const allowed = limit === null || limit === 0 || currentCount + incrementBy <= limit

    return new Response(
      JSON.stringify({
        success: true,
        canProceed,
        allowed,
        currentCount,
        limit,
        quotaKey,
        resetDate: quotaData?.reset_date
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return handleError(error, corsHeaders)
  }
})
