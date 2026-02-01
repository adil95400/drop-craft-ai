/**
 * ShopOpti+ Extension Auth API - ENTERPRISE SECURED v3.0
 * P0.1 Fix: JWT authentication required for token generation
 * P0.4 Fix: Restricted CORS origins
 * P0.5 Fix: Strict action allowlist, no userId in body, rate limiting
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

const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true
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

// P0.5 FIX: Strict action allowlist
const ALLOWED_ACTIONS = new Set([
  'generate_token',
  'validate_token',
  'refresh_token',
  'revoke_token',
  'revoke_all',
  'list_tokens',
  'heartbeat',
])

// Allowed permissions for extension tokens
const ALLOWED_PERMISSIONS = new Set([
  'import',
  'sync',
  'logs',
  'bulk',
  'ai_optimize',
  'stock_monitor',
])

// Validation helpers
function sanitizeToken(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null
  return sanitized
}

function sanitizeDeviceInfo(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  const allowedFields = ['browser', 'platform', 'version', 'userAgent', 'os', 'screenWidth', 'screenHeight']
  const sanitized: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in (value as Record<string, unknown>)) {
      const fieldValue = (value as Record<string, unknown>)[key]
      if (typeof fieldValue === 'string' && fieldValue.length < 256) {
        sanitized[key] = fieldValue.substring(0, 255)
      } else if (typeof fieldValue === 'number') {
        sanitized[key] = fieldValue
      }
    }
  }
  return sanitized
}

function validatePermissions(perms: unknown): string[] {
  if (!Array.isArray(perms)) return ['import', 'sync']
  return perms
    .filter(p => typeof p === 'string' && ALLOWED_PERMISSIONS.has(p))
    .slice(0, 10)
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // CORS preflight
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
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Invalid JSON body')
    }

    const action = body.action
    const data = body.data || {}

    // Validate action against allowlist
    if (typeof action !== 'string' || !ALLOWED_ACTIONS.has(action)) {
      throw new ValidationError(`Invalid action. Allowed: ${Array.from(ALLOWED_ACTIONS).join(', ')}`)
    }

    // P0.5 CRITICAL: Reject any userId in body
    if ('userId' in body || 'userId' in data || 'user_id' in body || 'user_id' in data) {
      await supabase.from('security_events').insert({
        user_id: null,
        event_type: 'security_violation_attempt',
        severity: 'critical',
        description: 'Attempt to pass userId in extension-auth body',
        metadata: { action, blocked: true }
      })
      throw new ValidationError('Do not send userId in request body')
    }

    // ===== GENERATE TOKEN =====
    if (action === 'generate_token') {
      // CRITICAL: JWT auth required
      const { user } = await authenticateUser(req, supabase)
      const userId = user.id

      // Rate limit token generation (prevent spam)
      const rl = await checkRateLimit(supabase, userId, 'extension_auth_generate', {
        maxRequests: 10,
        windowMinutes: 60
      })
      if (!rl.allowed) {
        return createRateLimitResponse(rl, corsHeaders)
      }

      const deviceInfo = sanitizeDeviceInfo(data.deviceInfo)
      const permissions = validatePermissions(data.permissions)

      // Verify user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, subscription_plan, full_name, email, avatar_url')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        throw new ValidationError('User profile not found')
      }

      // Generate token via secure RPC
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_extension_token', {
          p_user_id: userId,
          p_permissions: permissions,
          p_device_info: deviceInfo
        })

      if (tokenError) {
        console.error('[extension-auth] Token generation error:', tokenError)
        throw new Error('Failed to generate token')
      }

      // Log secure token generation
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'extension_token_generated_secure',
        severity: 'info',
        description: 'Extension token generated via authenticated JWT',
        metadata: { device_info: deviceInfo, permissions }
      })

      return new Response(
        JSON.stringify({
          success: true,
          token: tokenResult.token,
          refreshToken: tokenResult.refresh_token,
          tokenId: tokenResult.token_id,
          expiresAt: tokenResult.expires_at,
          refreshExpiresAt: tokenResult.refresh_expires_at,
          permissions: tokenResult.permissions,
          user: {
            id: userId,
            email: profile.email,
            plan: profile.subscription_plan || 'free',
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== VALIDATE TOKEN =====
    if (action === 'validate_token') {
      const rawToken = req.headers.get('x-extension-token') || data.token
      const token = sanitizeToken(rawToken)

      if (!token) {
        throw new ValidationError('Valid token required')
      }

      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_extension_token', { p_token: token })

      if (validationError || !validationResult?.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: validationResult?.error || 'Invalid or expired token',
            code: 'TOKEN_INVALID'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: validationResult.user,
          permissions: validationResult.permissions,
          expiresAt: validationResult.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== REFRESH TOKEN =====
    if (action === 'refresh_token') {
      const refreshToken = sanitizeToken(data.refreshToken)

      if (!refreshToken) {
        throw new ValidationError('Refresh token required')
      }

      const { data: refreshResult, error: refreshError } = await supabase
        .rpc('refresh_extension_token', { p_refresh_token: refreshToken })

      if (refreshError || !refreshResult?.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error: refreshResult?.error || 'Invalid refresh token',
            code: 'REFRESH_FAILED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          token: refreshResult.token,
          expiresAt: refreshResult.expires_at,
          userId: refreshResult.user_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== REVOKE TOKEN =====
    if (action === 'revoke_token') {
      const { user } = await authenticateUser(req, supabase)
      const userId = user.id

      const token = sanitizeToken(data.token)
      const tokenPrefix = typeof data.tokenPrefix === 'string' ? data.tokenPrefix.slice(0, 12) : null

      if (!token && !tokenPrefix) {
        throw new ValidationError('Token or tokenPrefix required')
      }

      // Find token by full token or prefix
      let query = supabase
        .from('extension_auth_tokens')
        .select('id, user_id')

      if (token) {
        query = query.eq('token', token)
      } else if (tokenPrefix) {
        query = query.ilike('token', `${tokenPrefix}%`)
      }

      const { data: tokenData } = await query.single()

      if (!tokenData) {
        return new Response(
          JSON.stringify({ success: true, message: 'Token not found or already revoked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // P0.5: Verify token belongs to authenticated user
      if (tokenData.user_id !== userId) {
        await supabase.from('security_events').insert({
          user_id: userId,
          event_type: 'unauthorized_token_revoke_attempt',
          severity: 'critical',
          description: 'Attempted to revoke another user\'s token',
          metadata: { target_user_id: tokenData.user_id }
        })
        throw new AuthenticationError('Cannot revoke token belonging to another user')
      }

      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', tokenData.id)

      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'extension_token_revoked',
        severity: 'info',
        description: 'Extension token revoked by user',
        metadata: { token_id: tokenData.id }
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Token revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== REVOKE ALL TOKENS =====
    if (action === 'revoke_all') {
      const { user } = await authenticateUser(req, supabase)
      const userId = user.id

      const { count } = await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true)

      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'all_extension_tokens_revoked',
        severity: 'warning',
        description: `All ${count || 0} extension tokens revoked by user`,
        metadata: { revoked_count: count }
      })

      return new Response(
        JSON.stringify({ success: true, message: 'All tokens revoked', count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== LIST TOKENS =====
    if (action === 'list_tokens') {
      const { user } = await authenticateUser(req, supabase)
      const userId = user.id

      const { data: tokens, error } = await supabase
        .from('extension_auth_tokens')
        .select('id, name, created_at, last_used_at, usage_count, expires_at, is_active, device_info, permissions')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Mask tokens - only show prefix
      const maskedTokens = tokens?.map(t => ({
        ...t,
        tokenPrefix: t.id?.slice(0, 8) || 'unknown'
      })) || []

      return new Response(
        JSON.stringify({ success: true, tokens: maskedTokens }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== HEARTBEAT =====
    if (action === 'heartbeat') {
      const rawToken = req.headers.get('x-extension-token') || data.token
      const token = sanitizeToken(rawToken)

      if (!token) {
        throw new ValidationError('Token required for heartbeat')
      }

      const { data: tokenInfo } = await supabase
        .from('extension_auth_tokens')
        .select('id, user_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (!tokenInfo) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const heartbeatData = {
        user_id: tokenInfo.user_id,
        token_id: tokenInfo.id,
        extension_version: typeof data.version === 'string' ? data.version.slice(0, 20) : 'unknown',
        platform: typeof data.platform === 'string' ? data.platform.slice(0, 50) : null,
        browser: typeof data.browser === 'string' ? data.browser.slice(0, 50) : null,
        browser_version: typeof data.browserVersion === 'string' ? data.browserVersion.slice(0, 20) : null,
        os: typeof data.os === 'string' ? data.os.slice(0, 50) : null,
        last_seen_at: new Date().toISOString(),
        is_active: true
      }

      await supabase
        .from('extension_heartbeats')
        .upsert(heartbeatData, { onConflict: 'user_id,token_id' })

      const { data: settings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', tokenInfo.user_id)
        .single()

      return new Response(
        JSON.stringify({
          success: true,
          serverTime: new Date().toISOString(),
          settings: settings?.settings?.extension || {},
          latestVersion: '5.7.1'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new ValidationError('Unhandled action')

  } catch (error) {
    return handleError(error, corsHeaders)
  }
})
