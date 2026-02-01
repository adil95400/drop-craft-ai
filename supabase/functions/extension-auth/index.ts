/**
 * ShopOpti+ Extension Auth API v3.0 - SECURED
 * P0.1 Fix: JWT authentication required for token generation
 * P0.4 Fix: Restricted CORS origins
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from '../_shared/secure-cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Validation helpers
function validateUUID(value: unknown, fieldName: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`${fieldName} is required`)
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid ${fieldName} format`)
  }
  return value
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

function sanitizeToken(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null
  return sanitized
}

/**
 * CRITICAL: Verify JWT and get authenticated user
 * P0.1 Fix: Token generation now requires valid JWT
 */
async function verifyJwtAuth(req: Request): Promise<{ userId: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  if (!token || token === authHeader || token.length < 20) return null
  
  // Create client with user's auth context
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  
  // CRITICAL: Verify the JWT token
  const { data: { user }, error } = await userClient.auth.getUser(token)
  
  if (error || !user) {
    console.warn('[extension-auth] JWT verification failed:', error?.message)
    return null
  }
  
  return { userId: user.id, email: user.email }
}

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  // CORS preflight with origin check
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const { action, data } = body

    if (!action || typeof action !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Action required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== GENERATE TOKEN =====
    // P0.1 FIX: Requires JWT authentication - userId from JWT, not from body
    if (action === 'generate_token') {
      // CRITICAL: Verify JWT first
      const authResult = await verifyJwtAuth(req)
      
      if (!authResult) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required. Please sign in first.',
            code: 'AUTH_REQUIRED'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Use authenticated user's ID, NOT from request body
      const userId = authResult.userId
      const deviceInfo = sanitizeDeviceInfo(data?.deviceInfo)
      const permissions = data?.permissions || ['import', 'sync', 'logs', 'bulk']
      
      // Verify user exists and get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, subscription_plan, full_name, email, avatar_url')
        .eq('id', userId)
        .single()
      
      if (profileError || !profile) {
        console.error('[extension-auth] Profile not found for userId:', userId, profileError)
        return new Response(
          JSON.stringify({ success: false, error: 'User profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Generate tokens using DB function
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

      // Log successful token generation
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'extension_token_generated_secure',
        severity: 'info',
        description: 'Extension token generated via authenticated request',
        metadata: { device_info: deviceInfo }
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
      const rawToken = req.headers.get('x-extension-token') || data?.token
      const token = sanitizeToken(rawToken)
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Valid token required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
      const refreshToken = sanitizeToken(data?.refreshToken)
      
      if (!refreshToken) {
        return new Response(
          JSON.stringify({ success: false, error: 'Refresh token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
    // P0.1 FIX: Requires JWT to revoke tokens
    if (action === 'revoke_token') {
      const authResult = await verifyJwtAuth(req)
      if (!authResult) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const token = sanitizeToken(data?.token)
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Verify token belongs to authenticated user
      const { data: tokenData } = await supabase
        .from('extension_auth_tokens')
        .select('id, user_id')
        .eq('token', token)
        .single()

      if (tokenData && tokenData.user_id === authResult.userId) {
        await supabase
          .from('extension_auth_tokens')
          .update({ is_active: false, revoked_at: new Date().toISOString() })
          .eq('id', tokenData.id)

        await supabase.from('security_events').insert({
          user_id: tokenData.user_id,
          event_type: 'extension_token_revoked',
          severity: 'info',
          description: 'Extension token revoked',
          metadata: { token_id: tokenData.id }
        })
      } else if (tokenData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot revoke token belonging to another user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Token revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== HEARTBEAT =====
    if (action === 'heartbeat') {
      const rawToken = req.headers.get('x-extension-token') || data?.token
      const token = sanitizeToken(rawToken)
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
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
        extension_version: data?.version || 'unknown',
        platform: data?.platform,
        browser: data?.browser,
        browser_version: data?.browserVersion,
        os: data?.os,
        last_seen_at: new Date().toISOString(),
        is_active: true
      }

      await supabase
        .from('extension_heartbeats')
        .upsert(heartbeatData, { onConflict: 'user_id,token_id' })
        .select()

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

    // ===== LIST TOKENS =====
    // P0.1 FIX: Requires JWT - only list own tokens
    if (action === 'list_tokens') {
      const authResult = await verifyJwtAuth(req)
      if (!authResult) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Only list tokens for authenticated user
      const { data: tokens, error } = await supabase
        .from('extension_auth_tokens')
        .select('id, name, created_at, last_used_at, usage_count, expires_at, is_active, device_info, permissions')
        .eq('user_id', authResult.userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, tokens }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== REVOKE ALL TOKENS =====
    // P0.1 FIX: Requires JWT - only revoke own tokens
    if (action === 'revoke_all') {
      const authResult = await verifyJwtAuth(req)
      if (!authResult) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('user_id', authResult.userId)
        .eq('is_active', true)

      await supabase.from('security_events').insert({
        user_id: authResult.userId,
        event_type: 'all_extension_tokens_revoked',
        severity: 'warning',
        description: 'All extension tokens revoked by user',
        metadata: {}
      })

      return new Response(
        JSON.stringify({ success: true, message: 'All tokens revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[extension-auth] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
