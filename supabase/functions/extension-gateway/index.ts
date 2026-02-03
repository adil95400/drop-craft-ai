/**
 * ShopOpti+ Extension Gateway - UNIFIED API ENDPOINT v1.0
 * 
 * Single entry point for ALL extension operations with:
 * - Action-based routing
 * - Version enforcement (rejects outdated extensions)
 * - Centralized authentication (token-based)
 * - Rate limiting per action type
 * - Comprehensive audit logging
 * 
 * Architecture: Extension collects → Gateway routes → Backend decides
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { z } from 'https://esm.sh/zod@3.22.4'

// =============================================================================
// CONFIGURATION
// =============================================================================

const GATEWAY_VERSION = '1.1.0'
const MIN_EXTENSION_VERSION = '5.7.0'
const CURRENT_EXTENSION_VERSION = '5.8.1'

// Allowed origins (Chrome extension + web app)
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
]

const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/
const CHROME_EXTENSION_PATTERN = /^chrome-extension:\/\/[a-z]{32}$/

// Action allowlist with rate limits
const ACTION_CONFIG: Record<string, { 
  rateLimit: { maxRequests: number; windowMinutes: number };
  requiresToken: boolean;
  handler: string;
}> = {
  // Auth actions
  'AUTH_GENERATE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_VALIDATE_TOKEN': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_REFRESH_TOKEN': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_REVOKE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_HEARTBEAT': { rateLimit: { maxRequests: 60, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  
  // Product actions
  'IMPORT_PRODUCT': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, handler: 'import' },
  'IMPORT_BULK': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, handler: 'import' },
  'SCRAPE_URL': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'scrape' },
  
  // AI actions
  'AI_OPTIMIZE_TITLE': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'ai' },
  'AI_OPTIMIZE_DESCRIPTION': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'ai' },
  'AI_OPTIMIZE_FULL': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, handler: 'ai' },
  'AI_GENERATE_SEO': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'ai' },
  'AI_GENERATE_TAGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'ai' },
  
  // Sync actions
  'SYNC_STOCK': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, handler: 'sync' },
  'SYNC_PRICE': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, handler: 'sync' },
  
  // Utility actions
  'CHECK_VERSION': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: false, handler: 'utility' },
  'GET_SETTINGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ANALYTICS': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ACTION': { rateLimit: { maxRequests: 200, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
}

// =============================================================================
// TYPES
// =============================================================================

const GatewayRequestSchema = z.object({
  action: z.string().max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  payload: z.record(z.unknown()).optional(),
  metadata: z.object({
    platform: z.string().max(50).optional(),
    url: z.string().url().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
  }).optional(),
})

type GatewayRequest = z.infer<typeof GatewayRequestSchema>

interface TokenValidation {
  success: boolean
  user?: {
    id: string
    email?: string
    plan?: string
  }
  permissions?: string[]
  error?: string
}

// =============================================================================
// UTILITIES
// =============================================================================

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true
  if (CHROME_EXTENSION_PATTERN.test(origin)) return true
  return false
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((parts1[i] || 0) > (parts2[i] || 0)) return 1
    if ((parts1[i] || 0) < (parts2[i] || 0)) return -1
  }
  return 0
}

function sanitizeToken(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const sanitized = trimmed.replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) return null
  return sanitized
}

// =============================================================================
// RATE LIMITING
// =============================================================================

async function checkRateLimit(
  supabase: any,
  userId: string | null,
  action: string,
  config: { maxRequests: number; windowMinutes: number }
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const identifier = userId || 'anonymous'
  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

  try {
    const { count, error } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>rate_limit_key', `gateway:${action}:${identifier}`)
      .gte('created_at', windowStart.toISOString())

    if (error) {
      console.error('[Gateway] Rate limit check error:', error)
      return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
    }

    const currentCount = count || 0
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const allowed = currentCount < config.maxRequests

    if (allowed) {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'gateway_rate_limit',
        severity: 'info',
        description: `Gateway action: ${action}`,
        metadata: {
          rate_limit_key: `gateway:${action}:${identifier}`,
          current_count: currentCount + 1,
          max_requests: config.maxRequests,
        }
      }).catch(() => {})
    }

    return { allowed, remaining, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
  } catch (error) {
    console.error('[Gateway] Unexpected rate limit error:', error)
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowMinutes * 60000) }
  }
}

// =============================================================================
// TOKEN VALIDATION
// =============================================================================

async function validateExtensionToken(supabase: any, token: string): Promise<TokenValidation> {
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

// =============================================================================
// ACTION HANDLERS
// =============================================================================

async function handleAuthAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  token: string | null,
  req: Request
): Promise<Response> {
  const corsHeaders = getCorsHeaders(req)

  if (action === 'AUTH_GENERATE_TOKEN') {
    // Requires JWT auth (from main app)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'JWT auth required for token generation' }, 401, corsHeaders)
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return jsonResponse({ success: false, error: 'Invalid JWT' }, 401, corsHeaders)
    }

    const { data: tokenResult, error: tokenError } = await supabase.rpc('generate_extension_token', {
      p_user_id: user.id,
      p_permissions: payload.permissions || ['import', 'sync'],
      p_device_info: payload.deviceInfo || {}
    })

    if (tokenError) {
      console.error('[Gateway] Token generation error:', tokenError)
      return jsonResponse({ success: false, error: 'Failed to generate token' }, 500, corsHeaders)
    }

    return jsonResponse({
      success: true,
      token: tokenResult.token,
      refreshToken: tokenResult.refresh_token,
      expiresAt: tokenResult.expires_at,
      permissions: tokenResult.permissions,
      user: { id: user.id, email: user.email }
    }, 200, corsHeaders)
  }

  if (action === 'AUTH_VALIDATE_TOKEN') {
    if (!token) {
      return jsonResponse({ success: false, error: 'Token required' }, 401, corsHeaders)
    }
    const validation = await validateExtensionToken(supabase, token)
    return jsonResponse(validation, validation.success ? 200 : 401, corsHeaders)
  }

  if (action === 'AUTH_REFRESH_TOKEN') {
    const refreshToken = sanitizeToken(payload.refreshToken)
    if (!refreshToken) {
      return jsonResponse({ success: false, error: 'Refresh token required' }, 400, corsHeaders)
    }

    const { data, error } = await supabase.rpc('refresh_extension_token', { p_refresh_token: refreshToken })
    if (error || !data?.success) {
      return jsonResponse({ success: false, error: data?.error || 'Refresh failed' }, 401, corsHeaders)
    }

    return jsonResponse({
      success: true,
      token: data.token,
      expiresAt: data.expires_at
    }, 200, corsHeaders)
  }

  if (action === 'AUTH_HEARTBEAT') {
    if (!token) {
      return jsonResponse({ success: false, error: 'Token required' }, 401, corsHeaders)
    }

    const validation = await validateExtensionToken(supabase, token)
    if (!validation.success) {
      return jsonResponse(validation, 401, corsHeaders)
    }

    await supabase.from('extension_heartbeats').upsert({
      user_id: validation.user!.id,
      extension_version: payload.version || 'unknown',
      platform: payload.platform,
      browser: payload.browser,
      last_seen_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'user_id' }).catch(() => {})

    return jsonResponse({
      success: true,
      serverTime: new Date().toISOString(),
      latestVersion: CURRENT_EXTENSION_VERSION
    }, 200, corsHeaders)
  }

  return jsonResponse({ success: false, error: 'Unknown auth action' }, 400, corsHeaders)
}

async function handleImportAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Delegate to existing import logic
  const product = payload.product as Record<string, unknown>
  
  if (!product?.title || !product?.url) {
    return { success: false, error: 'Product title and URL required' }
  }

  // Insert imported product
  const { data: importedProduct, error } = await supabase
    .from('imported_products')
    .insert({
      user_id: userId,
      name: (product.title as string).substring(0, 500),
      description: ((product.description as string) || '').substring(0, 10000),
      price: product.price || 0,
      cost_price: product.costPrice || product.price || 0,
      currency: product.currency || 'EUR',
      sku: product.sku || '',
      category: product.category || null,
      image_urls: (product.images as string[]) || [],
      source_url: product.url,
      source_platform: product.platform || 'unknown',
      status: 'draft',
      sync_status: 'synced',
      metadata: {
        imported_via: 'extension_gateway',
        imported_at: new Date().toISOString(),
        original_data: product
      }
    })
    .select()
    .single()

  if (error) {
    console.error('[Gateway] Import error:', error)
    return { success: false, error: error.message }
  }

  // Log analytics
  await supabase.from('extension_analytics').insert({
    user_id: userId,
    event_type: 'product_import',
    event_data: {
      product_id: importedProduct.id,
      title: (product.title as string).substring(0, 100),
      platform: product.platform
    }
  }).catch(() => {})

  return {
    success: true,
    data: {
      id: importedProduct.id,
      name: importedProduct.name,
      price: importedProduct.price,
      status: importedProduct.status
    }
  }
}

async function handleAIAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    return { success: false, error: 'AI service not configured' }
  }

  const product = payload.product as Record<string, unknown>
  if (!product?.title) {
    return { success: false, error: 'Product title required' }
  }

  const typeMap: Record<string, string> = {
    'AI_OPTIMIZE_TITLE': 'title',
    'AI_OPTIMIZE_DESCRIPTION': 'description',
    'AI_OPTIMIZE_FULL': 'full',
    'AI_GENERATE_SEO': 'seo',
    'AI_GENERATE_TAGS': 'tags',
  }

  const type = typeMap[action] || 'title'
  const language = (payload.language as string) || 'fr'

  // Build prompt based on type
  const prompts: Record<string, string> = {
    title: `Optimise ce titre produit pour le SEO: "${product.title}". Réponds uniquement avec le titre optimisé.`,
    description: `Réécris cette description produit pour maximiser les ventes: "${product.description || product.title}". 150-300 mots.`,
    full: `Optimise ce produit complet. Titre: "${product.title}". Réponds en JSON: {"title":"..","description":"..","seo_title":"..","seo_description":"..","tags":[]}`,
    seo: `Génère les métadonnées SEO pour: "${product.title}". Réponds en JSON: {"seo_title":"max 60 chars","seo_description":"max 160 chars"}`,
    tags: `Génère 5-10 tags pour: "${product.title}". Réponds en JSON: ["tag1","tag2",...]`,
  }

  try {
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Tu es un expert e-commerce SEO. Réponds de manière concise.' },
          { role: 'user', content: prompts[type] }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!aiResponse.ok) {
      return { success: false, error: 'AI service error' }
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content || ''

    let optimized: any = {}
    if (type === 'title') {
      optimized = { title: content.trim().replace(/^["']|["']$/g, '') }
    } else if (type === 'description') {
      optimized = { description: content.trim() }
    } else {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
          optimized = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        optimized = { raw: content }
      }
    }

    // Log usage
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: 'ai_optimization',
      event_data: { type, product_title: (product.title as string).substring(0, 50) }
    }).catch(() => {})

    return { success: true, data: { optimized } }
  } catch (error) {
    console.error('[Gateway] AI error:', error)
    return { success: false, error: 'AI processing failed' }
  }
}

async function handleUtilityAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string | null,
  extensionVersion: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (action === 'CHECK_VERSION') {
    return {
      success: true,
      data: {
        current: extensionVersion,
        latest: CURRENT_EXTENSION_VERSION,
        minimum: MIN_EXTENSION_VERSION,
        updateAvailable: compareVersions(CURRENT_EXTENSION_VERSION, extensionVersion) > 0,
        updateRequired: compareVersions(MIN_EXTENSION_VERSION, extensionVersion) > 0,
        gatewayVersion: GATEWAY_VERSION
      }
    }
  }

  if (action === 'GET_SETTINGS' && userId) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single()

    return {
      success: true,
      data: { settings: settings?.settings?.extension || {} }
    }
  }

  if (action === 'LOG_ANALYTICS' && userId) {
    const eventType = (payload.eventType as string) || 'unknown'
    const eventData = payload.eventData || {}

    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      source_url: payload.url
    }).catch(() => {})

    return { success: true }
  }

  // LOG_ACTION - Log extension action to SaaS for visibility
  if (action === 'LOG_ACTION' && userId) {
    const actionType = (payload.action_type as string) || 'UNKNOWN'
    const actionStatus = (payload.action_status as string) || 'success'

    const { error } = await supabase.from('extension_action_logs').insert({
      user_id: userId,
      action_type: actionType,
      action_status: actionStatus,
      platform: payload.platform || null,
      product_title: payload.product_title ? String(payload.product_title).substring(0, 500) : null,
      product_url: payload.product_url || null,
      product_id: payload.product_id || null,
      metadata: payload.metadata || {},
      extension_version: extensionVersion
    })

    if (error) {
      console.error('[Gateway] LOG_ACTION error:', error)
      return { success: false, error: 'Failed to log action' }
    }

    return { success: true }
  }

  return { success: false, error: 'Unknown utility action' }
}

// =============================================================================
// HELPERS
// =============================================================================

function jsonResponse(data: any, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  })
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const requestId = crypto.randomUUID().slice(0, 8)

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
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Parse request
    const body = await req.json().catch(() => null)
    if (!body) {
      return jsonResponse({ success: false, error: 'Invalid JSON' }, 400, corsHeaders)
    }

    const parseResult = GatewayRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return jsonResponse({
        success: false,
        error: 'Invalid request format',
        details: parseResult.error.issues.slice(0, 3).map(i => i.message)
      }, 400, corsHeaders)
    }

    const { action, version: extensionVersion = '0.0.0', payload = {}, metadata = {} } = parseResult.data

    console.log(`[Gateway:${requestId}] Action: ${action}, Version: ${extensionVersion}`)

    // =========================================================================
    // VERSION CHECK - Reject outdated extensions
    // =========================================================================
    if (compareVersions(MIN_EXTENSION_VERSION, extensionVersion) > 0) {
      console.warn(`[Gateway:${requestId}] Rejected outdated version: ${extensionVersion}`)
      
      await supabase.from('security_events').insert({
        event_type: 'gateway_version_rejected',
        severity: 'warning',
        description: `Extension version ${extensionVersion} rejected (min: ${MIN_EXTENSION_VERSION})`,
        metadata: { action, version: extensionVersion }
      }).catch(() => {})

      return jsonResponse({
        success: false,
        error: 'Extension update required',
        code: 'VERSION_OUTDATED',
        minimumVersion: MIN_EXTENSION_VERSION,
        currentVersion: CURRENT_EXTENSION_VERSION,
        downloadUrl: `${supabaseUrl}/functions/v1/extension-download`
      }, 426, corsHeaders) // 426 Upgrade Required
    }

    // =========================================================================
    // ACTION VALIDATION
    // =========================================================================
    const actionConfig = ACTION_CONFIG[action]
    if (!actionConfig) {
      return jsonResponse({
        success: false,
        error: 'Unknown action',
        allowedActions: Object.keys(ACTION_CONFIG)
      }, 400, corsHeaders)
    }

    // =========================================================================
    // TOKEN VALIDATION (if required)
    // =========================================================================
    let userId: string | null = null
    let userPermissions: string[] = []

    const token = sanitizeToken(req.headers.get('x-extension-token'))

    if (actionConfig.requiresToken) {
      if (!token) {
        return jsonResponse({ success: false, error: 'Extension token required' }, 401, corsHeaders)
      }

      const validation = await validateExtensionToken(supabase, token)
      if (!validation.success) {
        return jsonResponse({
          success: false,
          error: validation.error || 'Invalid token',
          code: 'TOKEN_INVALID'
        }, 401, corsHeaders)
      }

      userId = validation.user!.id
      userPermissions = validation.permissions || []
    }

    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    const rateLimit = await checkRateLimit(supabase, userId, action, actionConfig.rateLimit)
    if (!rateLimit.allowed) {
      return jsonResponse({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        remaining: rateLimit.remaining
      }, 429, {
        ...corsHeaders,
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
      })
    }

    // =========================================================================
    // ROUTE TO HANDLER
    // =========================================================================
    let result: { success: boolean; data?: any; error?: string }

    switch (actionConfig.handler) {
      case 'auth':
        return await handleAuthAction(supabase, action, payload as Record<string, unknown>, token, req)

      case 'import':
        result = await handleImportAction(supabase, action, payload as Record<string, unknown>, userId!)
        break

      case 'ai':
        result = await handleAIAction(supabase, action, payload as Record<string, unknown>, userId!)
        break

      case 'utility':
        result = await handleUtilityAction(supabase, action, payload as Record<string, unknown>, userId, extensionVersion)
        break

      case 'scrape':
      case 'sync':
        // TODO: Implement or delegate to existing functions
        result = { success: false, error: 'Action not yet implemented in gateway' }
        break

      default:
        result = { success: false, error: 'Handler not found' }
    }

    // =========================================================================
    // AUDIT LOG
    // =========================================================================
    await supabase.from('extension_analytics').insert({
      user_id: userId,
      event_type: `gateway:${action}`,
      event_data: {
        success: result.success,
        version: extensionVersion,
        platform: metadata.platform,
        request_id: requestId
      },
      source_url: metadata.url
    }).catch(() => {})

    console.log(`[Gateway:${requestId}] ${action} → ${result.success ? 'SUCCESS' : 'FAILED'}`)

    return jsonResponse({
      success: result.success,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      _meta: {
        requestId,
        gatewayVersion: GATEWAY_VERSION,
        rateLimit: { remaining: rateLimit.remaining }
      }
    }, result.success ? 200 : 400, corsHeaders)

  } catch (error) {
    console.error(`[Gateway:${requestId}] Unhandled error:`, error)
    
    await supabase.from('security_events').insert({
      event_type: 'gateway_error',
      severity: 'error',
      description: `Gateway error: ${(error as Error).message}`,
      metadata: { request_id: requestId }
    }).catch(() => {})

    return jsonResponse({
      success: false,
      error: 'Internal server error',
      requestId
    }, 500, corsHeaders)
  }
})
