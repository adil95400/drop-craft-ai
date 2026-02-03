/**
 * ShopOpti+ Extension Gateway - ENTERPRISE API v2.0
 * 
 * Single entry point for ALL extension operations with:
 * - Mandatory header validation (Authorization, X-Extension-Id, X-Extension-Version, X-Request-Id)
 * - Anti-replay protection (X-Request-Id unique per request)
 * - Idempotency for write operations (X-Idempotency-Key)
 * - Standardized JSON response format (ok/data/meta or ok=false/code/message)
 * - Action-based routing with Zod validation
 * - Rate limiting per action type
 * - Comprehensive observability logging
 * 
 * Architecture: Extension collects → Gateway routes → Backend decides
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { z } from 'https://esm.sh/zod@3.22.4'

// =============================================================================
// CONFIGURATION
// =============================================================================

const GATEWAY_VERSION = '2.0.0'
const MIN_EXTENSION_VERSION = '5.7.0'
const CURRENT_EXTENSION_VERSION = '5.8.1'

// Environment config
const ALLOWED_EXTENSION_IDS = (Deno.env.get('EXTENSION_ALLOWED_IDS') || 'shopopti-extension').split(',')
const EXTENSION_ALLOWED_VERSION = Deno.env.get('EXTENSION_ALLOWED_VERSION') || MIN_EXTENSION_VERSION

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
]

const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/
const CHROME_EXTENSION_PATTERN = /^chrome-extension:\/\/[a-z]{32}$/

// Write actions that require idempotency
const WRITE_ACTIONS = new Set([
  'IMPORT_PRODUCT',
  'IMPORT_BULK',
  'AI_OPTIMIZE_TITLE',
  'AI_OPTIMIZE_DESCRIPTION',
  'AI_OPTIMIZE_FULL',
  'AI_GENERATE_SEO',
  'AI_GENERATE_TAGS',
  'SYNC_STOCK',
  'SYNC_PRICE',
])

// Action configuration with rate limits and scopes
const ACTION_CONFIG: Record<string, { 
  rateLimit: { maxRequests: number; windowMinutes: number };
  requiresToken: boolean;
  requiredScope?: string;
  handler: string;
}> = {
  // Auth actions
  'AUTH_GENERATE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_VALIDATE_TOKEN': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_REFRESH_TOKEN': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_REVOKE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_HEARTBEAT': { rateLimit: { maxRequests: 60, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  
  // Product actions
  'IMPORT_PRODUCT': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'import' },
  'IMPORT_BULK': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:bulk', handler: 'import' },
  'SCRAPE_URL': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:read', handler: 'scrape' },
  
  // AI actions
  'AI_OPTIMIZE_TITLE': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_OPTIMIZE_DESCRIPTION': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_OPTIMIZE_FULL': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_GENERATE_SEO': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:seo', handler: 'ai' },
  'AI_GENERATE_TAGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  
  // Sync actions
  'SYNC_STOCK': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'sync:stock', handler: 'sync' },
  'SYNC_PRICE': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'sync:price', handler: 'sync' },
  
  // Utility actions
  'CHECK_VERSION': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: false, handler: 'utility' },
  'GET_SETTINGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ANALYTICS': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ACTION': { rateLimit: { maxRequests: 200, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'CHECK_QUOTA': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
}

// =============================================================================
// ERROR CODES (Standardized)
// =============================================================================

const ERROR_CODES = {
  // Auth errors (4xx)
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Authentication required' },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', status: 401, message: 'Invalid or expired token' },
  FORBIDDEN_SCOPE: { code: 'FORBIDDEN_SCOPE', status: 403, message: 'Insufficient permissions for this action' },
  
  // Request errors (4xx)
  INVALID_PAYLOAD: { code: 'INVALID_PAYLOAD', status: 400, message: 'Invalid request payload' },
  INVALID_HEADERS: { code: 'INVALID_HEADERS', status: 400, message: 'Missing or invalid required headers' },
  UNKNOWN_ACTION: { code: 'UNKNOWN_ACTION', status: 400, message: 'Unknown action type' },
  VERSION_OUTDATED: { code: 'VERSION_OUTDATED', status: 426, message: 'Extension update required' },
  INVALID_EXTENSION: { code: 'INVALID_EXTENSION', status: 403, message: 'Unknown extension ID' },
  
  // Replay/Idempotency errors (4xx)
  REPLAY_DETECTED: { code: 'REPLAY_DETECTED', status: 409, message: 'Request already processed' },
  IN_PROGRESS: { code: 'IN_PROGRESS', status: 409, message: 'Operation already in progress' },
  
  // Rate limiting (4xx)
  QUOTA_EXCEEDED: { code: 'QUOTA_EXCEEDED', status: 429, message: 'Rate limit exceeded' },
  
  // Server errors (5xx)
  INTERNAL: { code: 'INTERNAL', status: 500, message: 'Internal server error' },
  HANDLER_ERROR: { code: 'HANDLER_ERROR', status: 500, message: 'Action handler failed' },
}

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================

const GatewayRequestSchema = z.object({
  action: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  payload: z.record(z.unknown()).optional().default({}),
  metadata: z.object({
    platform: z.string().max(50).optional(),
    url: z.string().url().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
    timestamp: z.string().optional(),
  }).optional().default({}),
})

// Handler-specific payload schemas
const ImportPayloadSchema = z.object({
  product: z.object({
    title: z.string().min(1).max(500),
    url: z.string().url(),
    description: z.string().max(10000).optional(),
    price: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    currency: z.string().max(3).optional(),
    sku: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    images: z.array(z.string().url()).max(20).optional(),
    platform: z.string().max(50).optional(),
    variants: z.array(z.record(z.unknown())).max(100).optional(),
  }),
})

const AIPayloadSchema = z.object({
  product: z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(10000).optional(),
  }),
  language: z.string().max(5).optional().default('fr'),
})

type GatewayRequest = z.infer<typeof GatewayRequestSchema>

interface TokenValidation {
  success: boolean
  user?: { id: string; email?: string; plan?: string }
  permissions?: string[]
  error?: string
}

interface GatewayContext {
  requestId: string
  extensionId: string
  extensionVersion: string
  idempotencyKey: string | null
  userId: string | null
  permissions: string[]
  startTime: number
}

// =============================================================================
// STANDARDIZED RESPONSE HELPERS
// =============================================================================

function successResponse(
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

function errorResponse(
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-extension-version, x-extension-id, x-request-id, x-idempotency-key',
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

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// =============================================================================
// ANTI-REPLAY PROTECTION
// =============================================================================

async function checkAntiReplay(
  supabase: any,
  requestId: string,
  userId: string | null,
  extensionId: string,
  action: string
): Promise<{ allowed: boolean; error?: string }> {
  // Check if request_id already exists
  const { data: existing } = await supabase
    .from('extension_requests')
    .select('id')
    .eq('request_id', requestId)
    .maybeSingle()

  if (existing) {
    return { allowed: false, error: 'Request already processed' }
  }

  // Insert new request record
  const { error } = await supabase.from('extension_requests').insert({
    request_id: requestId,
    user_id: userId || '00000000-0000-0000-0000-000000000000',
    extension_id: extensionId,
    action: action,
  })

  if (error?.code === '23505') { // Unique violation
    return { allowed: false, error: 'Request already processed' }
  }

  return { allowed: true }
}

// =============================================================================
// IDEMPOTENCY HANDLING
// =============================================================================

async function checkIdempotency(
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
    // Create new idempotency record
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

async function updateIdempotency(
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
// OBSERVABILITY LOGGING
// =============================================================================

async function logEvent(
  supabase: any,
  ctx: GatewayContext,
  action: string,
  status: 'success' | 'error' | 'timeout' | 'cancelled',
  errorCode: string | null,
  errorMessage: string | null,
  metadata: Record<string, any> = {}
): Promise<void> {
  const durationMs = Date.now() - ctx.startTime

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
  }).catch(e => console.error('[Gateway] Log event error:', e))
}

// =============================================================================
// ACTION HANDLERS
// =============================================================================

async function handleAuthAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  token: string | null,
  req: Request,
  ctx: GatewayContext
): Promise<Response> {
  const corsHeaders = getCorsHeaders(req)

  if (action === 'AUTH_GENERATE_TOKEN') {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, { hint: 'JWT auth required for token generation' }, corsHeaders)
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, { hint: 'Invalid JWT' }, corsHeaders)
    }

    const { data: tokenResult, error: tokenError } = await supabase.rpc('generate_extension_token', {
      p_user_id: user.id,
      p_permissions: payload.permissions || ['import', 'sync'],
      p_device_info: payload.deviceInfo || {}
    })

    if (tokenError) {
      console.error('[Gateway] Token generation error:', tokenError)
      return errorResponse(ERROR_CODES.INTERNAL, { hint: 'Token generation failed' }, corsHeaders)
    }

    await logEvent(supabase, ctx, action, 'success', null, null, { userId: user.id })

    return successResponse({
      token: tokenResult.token,
      refreshToken: tokenResult.refresh_token,
      expiresAt: tokenResult.expires_at,
      permissions: tokenResult.permissions,
      user: { id: user.id, email: user.email }
    }, { requestId: ctx.requestId }, corsHeaders)
  }

  if (action === 'AUTH_VALIDATE_TOKEN') {
    if (!token) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, {}, corsHeaders)
    }
    const validation = await validateExtensionToken(supabase, token)
    if (!validation.success) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, { hint: validation.error }, corsHeaders)
    }
    return successResponse(validation, { requestId: ctx.requestId }, corsHeaders)
  }

  if (action === 'AUTH_REFRESH_TOKEN') {
    const refreshToken = sanitizeToken(payload.refreshToken)
    if (!refreshToken) {
      return errorResponse(ERROR_CODES.INVALID_PAYLOAD, { hint: 'Refresh token required' }, corsHeaders)
    }

    const { data, error } = await supabase.rpc('refresh_extension_token', { p_refresh_token: refreshToken })
    if (error || !data?.success) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, { hint: data?.error || 'Refresh failed' }, corsHeaders)
    }

    return successResponse({
      token: data.token,
      expiresAt: data.expires_at
    }, { requestId: ctx.requestId }, corsHeaders)
  }

  if (action === 'AUTH_HEARTBEAT') {
    if (!token) {
      return errorResponse(ERROR_CODES.UNAUTHORIZED, {}, corsHeaders)
    }

    const validation = await validateExtensionToken(supabase, token)
    if (!validation.success) {
      return errorResponse(ERROR_CODES.INVALID_TOKEN, { hint: validation.error }, corsHeaders)
    }

    await supabase.from('extension_heartbeats').upsert({
      user_id: validation.user!.id,
      extension_version: ctx.extensionVersion,
      platform: payload.platform,
      browser: payload.browser,
      last_seen_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'user_id' }).catch(() => {})

    return successResponse({
      serverTime: new Date().toISOString(),
      latestVersion: CURRENT_EXTENSION_VERSION
    }, { requestId: ctx.requestId }, corsHeaders)
  }

  return errorResponse(ERROR_CODES.UNKNOWN_ACTION, { action }, corsHeaders)
}

async function handleImportAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string }> {
  // Validate payload
  const validation = ImportPayloadSchema.safeParse(payload)
  if (!validation.success) {
    return { 
      success: false, 
      error: 'Invalid import payload', 
      errorCode: 'INVALID_PAYLOAD' 
    }
  }

  const { product } = validation.data

  const { data: importedProduct, error } = await supabase
    .from('imported_products')
    .insert({
      user_id: userId,
      name: product.title.substring(0, 500),
      description: (product.description || '').substring(0, 10000),
      price: product.price || 0,
      cost_price: product.costPrice || product.price || 0,
      currency: product.currency || 'EUR',
      sku: product.sku || '',
      category: product.category || null,
      image_urls: product.images || [],
      source_url: product.url,
      source_platform: product.platform || 'unknown',
      status: 'draft',
      sync_status: 'synced',
      metadata: {
        imported_via: 'extension_gateway_v2',
        imported_at: new Date().toISOString(),
        variants_count: product.variants?.length || 0,
      }
    })
    .select()
    .single()

  if (error) {
    console.error('[Gateway] Import error:', error)
    return { success: false, error: error.message, errorCode: 'HANDLER_ERROR' }
  }

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
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
  
  if (!LOVABLE_API_KEY) {
    return { success: false, error: 'AI service not configured', errorCode: 'INTERNAL' }
  }

  // Validate payload
  const validation = AIPayloadSchema.safeParse(payload)
  if (!validation.success) {
    return { success: false, error: 'Invalid AI payload', errorCode: 'INVALID_PAYLOAD' }
  }

  const { product, language } = validation.data

  const typeMap: Record<string, string> = {
    'AI_OPTIMIZE_TITLE': 'title',
    'AI_OPTIMIZE_DESCRIPTION': 'description',
    'AI_OPTIMIZE_FULL': 'full',
    'AI_GENERATE_SEO': 'seo',
    'AI_GENERATE_TAGS': 'tags',
  }

  const type = typeMap[action] || 'title'

  const prompts: Record<string, string> = {
    title: `Optimise ce titre produit pour le SEO e-commerce: "${product.title}". Réponds uniquement avec le titre optimisé.`,
    description: `Réécris cette description produit pour maximiser les ventes: "${product.description || product.title}". 150-300 mots, style engageant.`,
    full: `Optimise ce produit complet. Titre: "${product.title}". Description: "${product.description || ''}". Réponds en JSON: {"title":"..","description":"..","seo_title":"..","seo_description":"..","tags":[]}`,
    seo: `Génère les métadonnées SEO pour: "${product.title}". Réponds en JSON: {"seo_title":"max 60 chars","seo_description":"max 160 chars"}`,
    tags: `Génère 5-10 tags pertinents pour: "${product.title}". Réponds en JSON: ["tag1","tag2",...]`,
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
          { role: 'system', content: `Tu es un expert e-commerce SEO. Réponds en ${language}.` },
          { role: 'user', content: prompts[type] }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    if (!aiResponse.ok) {
      return { success: false, error: 'AI service error', errorCode: 'INTERNAL' }
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
      } catch {
        optimized = { raw: content }
      }
    }

    return { success: true, data: { optimized, type } }
  } catch (error) {
    console.error('[Gateway] AI error:', error)
    return { success: false, error: 'AI processing failed', errorCode: 'HANDLER_ERROR' }
  }
}

async function handleUtilityAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string | null,
  ctx: GatewayContext
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string }> {
  if (action === 'CHECK_VERSION') {
    return {
      success: true,
      data: {
        current: ctx.extensionVersion,
        latest: CURRENT_EXTENSION_VERSION,
        minimum: MIN_EXTENSION_VERSION,
        updateAvailable: compareVersions(CURRENT_EXTENSION_VERSION, ctx.extensionVersion) > 0,
        updateRequired: compareVersions(MIN_EXTENSION_VERSION, ctx.extensionVersion) > 0,
      }
    }
  }

  if (action === 'CHECK_QUOTA' && userId) {
    // Get user's plan and usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    const plan = profile?.plan || 'free'
    const limits: Record<string, { imports: number; ai: number }> = {
      free: { imports: 10, ai: 5 },
      pro: { imports: 100, ai: 50 },
      ultra_pro: { imports: 1000, ai: 500 },
    }

    // Count today's usage
    const today = new Date().toISOString().split('T')[0]
    const { count: importsCount } = await supabase
      .from('imported_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today)

    const { count: aiCount } = await supabase
      .from('extension_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('action', 'AI_%')
      .gte('created_at', today)

    return {
      success: true,
      data: {
        plan,
        limits: limits[plan] || limits.free,
        usage: {
          imports: importsCount || 0,
          ai: aiCount || 0,
        },
        remaining: {
          imports: Math.max(0, (limits[plan]?.imports || 10) - (importsCount || 0)),
          ai: Math.max(0, (limits[plan]?.ai || 5) - (aiCount || 0)),
        }
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

  if (action === 'LOG_ACTION' && userId) {
    const { error } = await supabase.from('extension_action_logs').insert({
      user_id: userId,
      action_type: (payload.action_type as string) || 'UNKNOWN',
      action_status: (payload.action_status as string) || 'success',
      platform: payload.platform || null,
      product_title: payload.product_title ? String(payload.product_title).substring(0, 500) : null,
      product_url: payload.product_url || null,
      product_id: payload.product_id || null,
      metadata: payload.metadata || {},
      extension_version: ctx.extensionVersion
    })

    if (error) {
      console.error('[Gateway] LOG_ACTION error:', error)
      return { success: false, error: 'Failed to log action', errorCode: 'HANDLER_ERROR' }
    }

    return { success: true }
  }

  return { success: false, error: 'Unknown utility action', errorCode: 'UNKNOWN_ACTION' }
}

async function handleSyncAction(
  supabase: any,
  action: string,
  payload: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string; errorCode?: string }> {
  const productIds = payload.productIds as string[]
  if (!productIds?.length) {
    return { success: false, error: 'Product IDs required', errorCode: 'INVALID_PAYLOAD' }
  }

  // Queue sync job
  const { data: job, error } = await supabase.from('sync_jobs').insert({
    user_id: userId,
    job_type: action === 'SYNC_STOCK' ? 'stock' : 'price',
    status: 'pending',
    product_ids: productIds,
    metadata: { source: 'extension_gateway_v2' }
  }).select().single()

  if (error) {
    return { success: false, error: 'Failed to queue sync job', errorCode: 'HANDLER_ERROR' }
  }

  return {
    success: true,
    data: {
      jobId: job.id,
      status: 'queued',
      productCount: productIds.length
    }
  }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const startTime = Date.now()

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
    return errorResponse(
      { code: 'METHOD_NOT_ALLOWED', status: 405, message: 'Only POST allowed' },
      {},
      corsHeaders
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // ==========================================================================
  // EXTRACT & VALIDATE HEADERS
  // ==========================================================================
  const requestId = req.headers.get('X-Request-Id') || ''
  const extensionId = req.headers.get('X-Extension-Id') || ''
  const extensionVersion = req.headers.get('X-Extension-Version') || '0.0.0'
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || null
  const token = sanitizeToken(req.headers.get('X-Extension-Token'))

  // Validate X-Request-Id (required for all requests)
  if (!requestId || !isValidUUID(requestId)) {
    return errorResponse(
      ERROR_CODES.INVALID_HEADERS,
      { hint: 'X-Request-Id header required (valid UUID)', received: requestId },
      corsHeaders
    )
  }

  // Validate X-Extension-Id
  if (!extensionId || !ALLOWED_EXTENSION_IDS.includes(extensionId)) {
    return errorResponse(
      ERROR_CODES.INVALID_EXTENSION,
      { hint: 'Unknown X-Extension-Id', received: extensionId },
      corsHeaders
    )
  }

  // Validate X-Extension-Version
  if (!extensionVersion.match(/^\d+\.\d+\.\d+$/)) {
    return errorResponse(
      ERROR_CODES.INVALID_HEADERS,
      { hint: 'X-Extension-Version required (semver format)' },
      corsHeaders
    )
  }

  // Create context
  const ctx: GatewayContext = {
    requestId,
    extensionId,
    extensionVersion,
    idempotencyKey,
    userId: null,
    permissions: [],
    startTime,
  }

  console.log(`[Gateway:${requestId}] Request from ${extensionId} v${extensionVersion}`)

  try {
    // =========================================================================
    // PARSE REQUEST BODY
    // =========================================================================
    const body = await req.json().catch(() => null)
    if (!body) {
      return errorResponse(ERROR_CODES.INVALID_PAYLOAD, { hint: 'Invalid JSON body' }, corsHeaders)
    }

    const parseResult = GatewayRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return errorResponse(
        ERROR_CODES.INVALID_PAYLOAD,
        { 
          hint: 'Schema validation failed',
          issues: parseResult.error.issues.slice(0, 3).map(i => ({ path: i.path.join('.'), message: i.message }))
        },
        corsHeaders
      )
    }

    const { action, version: bodyVersion, payload, metadata } = parseResult.data
    const effectiveVersion = extensionVersion || bodyVersion || '0.0.0'

    console.log(`[Gateway:${requestId}] Action: ${action}`)

    // =========================================================================
    // VERSION CHECK
    // =========================================================================
    if (compareVersions(MIN_EXTENSION_VERSION, effectiveVersion) > 0) {
      console.warn(`[Gateway:${requestId}] Rejected outdated version: ${effectiveVersion}`)
      
      await logEvent(supabase, ctx, action, 'error', 'VERSION_OUTDATED', 'Extension update required', metadata)

      return errorResponse(
        ERROR_CODES.VERSION_OUTDATED,
        {
          minimumVersion: MIN_EXTENSION_VERSION,
          currentVersion: CURRENT_EXTENSION_VERSION,
          downloadUrl: `${supabaseUrl}/functions/v1/extension-download`
        },
        corsHeaders
      )
    }

    // =========================================================================
    // ACTION VALIDATION
    // =========================================================================
    const actionConfig = ACTION_CONFIG[action]
    if (!actionConfig) {
      return errorResponse(
        ERROR_CODES.UNKNOWN_ACTION,
        { action, allowedActions: Object.keys(ACTION_CONFIG) },
        corsHeaders
      )
    }

    // =========================================================================
    // TOKEN VALIDATION
    // =========================================================================
    if (actionConfig.requiresToken) {
      if (!token) {
        return errorResponse(ERROR_CODES.UNAUTHORIZED, { hint: 'X-Extension-Token header required' }, corsHeaders)
      }

      const validation = await validateExtensionToken(supabase, token)
      if (!validation.success) {
        await logEvent(supabase, ctx, action, 'error', 'INVALID_TOKEN', validation.error || 'Token validation failed', metadata)
        return errorResponse(ERROR_CODES.INVALID_TOKEN, { hint: validation.error }, corsHeaders)
      }

      ctx.userId = validation.user!.id
      ctx.permissions = validation.permissions || []

      // Check scope permission
      if (actionConfig.requiredScope && !ctx.permissions.includes(actionConfig.requiredScope)) {
        await logEvent(supabase, ctx, action, 'error', 'FORBIDDEN_SCOPE', `Missing scope: ${actionConfig.requiredScope}`, metadata)
        return errorResponse(
          ERROR_CODES.FORBIDDEN_SCOPE,
          { required: actionConfig.requiredScope, granted: ctx.permissions },
          corsHeaders
        )
      }
    }

    // =========================================================================
    // ANTI-REPLAY CHECK
    // =========================================================================
    const replayCheck = await checkAntiReplay(supabase, requestId, ctx.userId, extensionId, action)
    if (!replayCheck.allowed) {
      await logEvent(supabase, ctx, action, 'error', 'REPLAY_DETECTED', 'Duplicate request', metadata)
      return errorResponse(ERROR_CODES.REPLAY_DETECTED, { requestId }, corsHeaders)
    }

    // =========================================================================
    // IDEMPOTENCY CHECK (for write actions)
    // =========================================================================
    if (WRITE_ACTIONS.has(action) && ctx.userId) {
      if (!idempotencyKey) {
        return errorResponse(
          ERROR_CODES.INVALID_HEADERS,
          { hint: 'X-Idempotency-Key required for write operations' },
          corsHeaders
        )
      }

      const idempotencyCheck = await checkIdempotency(supabase, idempotencyKey, ctx.userId, action)
      
      if (idempotencyCheck.status === 'succeeded') {
        console.log(`[Gateway:${requestId}] Returning cached response for idempotency key`)
        return successResponse(
          idempotencyCheck.cachedResponse || { cached: true },
          { requestId, cached: true },
          corsHeaders
        )
      }

      if (idempotencyCheck.status === 'started') {
        return errorResponse(ERROR_CODES.IN_PROGRESS, { idempotencyKey }, corsHeaders)
      }
    }

    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    const rateLimit = await checkRateLimit(supabase, ctx.userId, action, actionConfig.rateLimit)
    if (!rateLimit.allowed) {
      await logEvent(supabase, ctx, action, 'error', 'QUOTA_EXCEEDED', 'Rate limit exceeded', metadata)
      return errorResponse(
        ERROR_CODES.QUOTA_EXCEEDED,
        {
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
          remaining: rateLimit.remaining
        },
        {
          ...corsHeaders,
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
        }
      )
    }

    // =========================================================================
    // ROUTE TO HANDLER
    // =========================================================================
    let result: { success: boolean; data?: any; error?: string; errorCode?: string }

    switch (actionConfig.handler) {
      case 'auth':
        return await handleAuthAction(supabase, action, payload, token, req, ctx)

      case 'import':
        result = await handleImportAction(supabase, action, payload, ctx.userId!)
        break

      case 'ai':
        result = await handleAIAction(supabase, action, payload, ctx.userId!)
        break

      case 'sync':
        result = await handleSyncAction(supabase, action, payload, ctx.userId!)
        break

      case 'utility':
        result = await handleUtilityAction(supabase, action, payload, ctx.userId, ctx)
        break

      default:
        result = { success: false, error: 'Handler not found', errorCode: 'INTERNAL' }
    }

    // =========================================================================
    // UPDATE IDEMPOTENCY & LOG
    // =========================================================================
    if (WRITE_ACTIONS.has(action) && ctx.userId && idempotencyKey) {
      await updateIdempotency(
        supabase, 
        idempotencyKey, 
        ctx.userId, 
        result.success ? 'succeeded' : 'failed',
        result.data || null
      )
    }

    await logEvent(
      supabase,
      ctx,
      action,
      result.success ? 'success' : 'error',
      result.errorCode || null,
      result.error || null,
      { ...metadata, platform: (metadata as any)?.platform }
    )

    console.log(`[Gateway:${requestId}] ${action} → ${result.success ? 'SUCCESS' : 'FAILED'} (${Date.now() - startTime}ms)`)

    // =========================================================================
    // RETURN RESPONSE
    // =========================================================================
    if (result.success) {
      return successResponse(
        result.data,
        {
          requestId,
          rateLimit: { remaining: rateLimit.remaining },
          duration: Date.now() - startTime,
        },
        corsHeaders
      )
    } else {
      const errorConfig = ERROR_CODES[result.errorCode as keyof typeof ERROR_CODES] || ERROR_CODES.HANDLER_ERROR
      return errorResponse(
        { ...errorConfig, message: result.error || errorConfig.message },
        { requestId },
        corsHeaders
      )
    }

  } catch (error) {
    console.error(`[Gateway:${requestId}] Unhandled error:`, error)
    
    await logEvent(supabase, ctx, 'UNKNOWN', 'error', 'INTERNAL', (error as Error).message, {})

    return errorResponse(
      ERROR_CODES.INTERNAL,
      { requestId, hint: 'Contact support if this persists' },
      corsHeaders
    )
  }
})
