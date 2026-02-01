/**
 * Quota Check API - SECURED
 * P0.2 Fix: JWT authentication required, userId from JWT only
 * P0.4 Fix: Restricted CORS origins
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from '../_shared/secure-cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Rate limiting in-memory store
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  entry.count++
  return true
}

/**
 * Verify JWT and get authenticated user
 */
async function verifyJwtAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  if (!token || token === authHeader || token.length < 20) return null
  
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  
  const { data: { user }, error } = await userClient.auth.getUser(token)
  
  if (error || !user) return null
  
  return { userId: user.id }
}

/**
 * Validate extension token as fallback auth
 */
async function verifyExtensionToken(req: Request): Promise<{ userId: string } | null> {
  const extensionToken = req.headers.get('x-extension-token')
  if (!extensionToken) return null
  
  const sanitized = extensionToken.trim().replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: result, error } = await supabase
    .rpc('validate_extension_token', { p_token: sanitized })
  
  if (error || !result?.success || !result?.user?.id) return null
  
  return { userId: result.user.id }
}

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  // Handle CORS preflight with origin check
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // P0.2 FIX: Authentication required
    let authResult = await verifyJwtAuth(req)
    
    // Fallback to extension token
    if (!authResult) {
      authResult = await verifyExtensionToken(req)
    }
    
    if (!authResult) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // P0.2 FIX: userId comes from authenticated token, NOT from request body
    const userId = authResult.userId
    
    const body = await req.json()
    const { quotaKey, incrementBy = 0 } = body
    
    // Validate quotaKey
    if (!quotaKey || typeof quotaKey !== 'string' || quotaKey.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid quota key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Validate incrementBy
    const safeIncrement = Math.min(Math.max(0, parseInt(String(incrementBy)) || 0), 100)
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`[check-quota] Checking quota for authenticated user ${userId}, quota: ${quotaKey}, increment: ${safeIncrement}`)

    // Use the database function to check quota
    const { data: canProceed, error: checkError } = await supabase.rpc('check_quota', {
      user_id_param: userId,
      quota_key_param: quotaKey
    })

    if (checkError) {
      console.error('[check-quota] Error checking quota:', checkError)
      throw new Error('Failed to check quota')
    }

    // If incrementBy is provided and quota check passes, increment the quota
    if (safeIncrement > 0 && canProceed) {
      const { error: incrementError } = await supabase.rpc('increment_quota', {
        user_id_param: userId,
        quota_key_param: quotaKey,
        increment_by: safeIncrement
      })

      if (incrementError) {
        console.error('[check-quota] Error incrementing quota:', incrementError)
        throw new Error('Failed to increment quota')
      }

      console.log(`[check-quota] Quota incremented successfully for ${quotaKey}`)
    }

    // Get current quota status
    const { data: quotaData, error: quotaError } = await supabase
      .from('user_quotas')
      .select('current_count, reset_date')
      .eq('user_id', userId)
      .eq('quota_key', quotaKey)
      .maybeSingle()

    if (quotaError) {
      console.error('[check-quota] Error fetching quota data:', quotaError)
    }

    // Get quota limit from plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single()

    let limit = null
    if (!profileError && profile) {
      const { data: limitData, error: limitError } = await supabase
        .from('plans_limits')
        .select('limit_value')
        .eq('plan', profile.subscription_plan || 'free')
        .eq('limit_key', quotaKey)
        .maybeSingle()

      if (!limitError && limitData) {
        limit = limitData.limit_value
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        canProceed,
        currentCount: quotaData?.current_count || 0,
        limit,
        resetDate: quotaData?.reset_date,
        quotaKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[check-quota] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
