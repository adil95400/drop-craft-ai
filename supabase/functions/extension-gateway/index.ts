/**
 * ShopOpti+ Extension Gateway - ENTERPRISE API v2.1
 * 
 * Single entry point for ALL extension operations with modular action handlers.
 */

import { createClient } from "@supabase/supabase-js"

// Import shared modules
import { 
  GATEWAY_VERSION, 
  MIN_EXTENSION_VERSION,
  ACTION_CONFIG, 
  WRITE_ACTIONS,
  GatewayRequestSchema,
  GatewayContext,
  ERROR_CODES,
} from './types.ts'

import {
  getCorsHeaders,
  isVersionSupported,
  isValidUUID,
  sanitizeToken,
  checkAntiReplay,
  checkIdempotency,
  updateIdempotency,
  checkRateLimit,
  logEvent,
  validateExtensionToken,
  successResponse,
  errorResponse,
} from './utils.ts'

// Import action handlers
import { handleAuthAction } from './actions/auth.ts'
import { handleImportAction } from './actions/import-product.ts'
import { handleAIAction } from './actions/ai-optimize.ts'
import { handleSyncAction } from './actions/sync.ts'
import { handleUtilityAction } from './actions/utility.ts'
import { handleScrapeAction } from './actions/scrape.ts'
import { handleAnalyzeAction } from './actions/analyze.ts'
import { handleProgressiveImport, handleJobStatus } from './actions/import-progressive.ts'

// =============================================================================
// CONFIGURATION
// =============================================================================

const ALLOWED_EXTENSION_IDS = (Deno.env.get('EXTENSION_ALLOWED_IDS') || 'shopopti-extension').split(',')

// =============================================================================
// MAIN HANDLER
// =============================================================================

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return errorResponse(
      { code: 'METHOD_NOT_ALLOWED', status: 405, message: 'Only POST allowed' },
      {},
      corsHeaders
    )
  }

  const startTime = Date.now()

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // ==========================================================================
  // 1. VALIDATE REQUIRED HEADERS
  // ==========================================================================

  const requestId = req.headers.get('X-Request-Id')
  const extensionId = req.headers.get('X-Extension-Id')
  const extensionVersion = req.headers.get('X-Extension-Version')
  const idempotencyKey = req.headers.get('X-Idempotency-Key')

  // Validate X-Request-Id (required, must be UUID)
  if (!requestId || !isValidUUID(requestId)) {
    return errorResponse(
      ERROR_CODES.INVALID_HEADERS,
      { missing: 'X-Request-Id', hint: 'Must be a valid UUID' },
      corsHeaders
    )
  }

  // Validate X-Extension-Id (required)
  if (!extensionId || !ALLOWED_EXTENSION_IDS.includes(extensionId)) {
    return errorResponse(
      ERROR_CODES.INVALID_EXTENSION,
      { provided: extensionId, hint: 'Unknown extension ID' },
      corsHeaders
    )
  }

  // Validate X-Extension-Version (required, must meet minimum)
  if (!extensionVersion) {
    return errorResponse(
      ERROR_CODES.INVALID_HEADERS,
      { missing: 'X-Extension-Version' },
      corsHeaders
    )
  }

  if (!isVersionSupported(extensionVersion)) {
    return errorResponse(
      ERROR_CODES.VERSION_OUTDATED,
      { 
        current: extensionVersion, 
        minimum: MIN_EXTENSION_VERSION,
        updateUrl: 'https://shopopti.io/extension/update',
      },
      corsHeaders
    )
  }

  // ==========================================================================
  // 2. PARSE AND VALIDATE BODY
  // ==========================================================================

  let body: any
  try {
    body = await req.json()
  } catch {
    return errorResponse(
      ERROR_CODES.INVALID_PAYLOAD,
      { hint: 'Invalid JSON body' },
      corsHeaders
    )
  }

  const parseResult = GatewayRequestSchema.safeParse(body)
  if (!parseResult.success) {
    return errorResponse(
      ERROR_CODES.INVALID_PAYLOAD,
      { issues: parseResult.error.issues },
      corsHeaders
    )
  }

  const { action, payload, metadata } = parseResult.data

  // ==========================================================================
  // 3. VALIDATE ACTION
  // ==========================================================================

  const actionConfig = ACTION_CONFIG[action]
  if (!actionConfig) {
    return errorResponse(
      ERROR_CODES.UNKNOWN_ACTION,
      { action, supportedActions: Object.keys(ACTION_CONFIG) },
      corsHeaders
    )
  }

  // ==========================================================================
  // 4. AUTHENTICATE (if required)
  // ==========================================================================

  let userId: string | null = null
  let userEmail: string | undefined
  let userPlan: string | undefined
  let permissions: string[] = []

  if (actionConfig.requiresToken) {
    const token = req.headers.get('X-Extension-Token') || sanitizeToken(req.headers.get('Authorization')?.replace('Bearer ', ''))
    
    if (!token) {
      return errorResponse(
        ERROR_CODES.UNAUTHORIZED,
        { hint: 'X-Extension-Token header required' },
        corsHeaders
      )
    }

    const validation = await validateExtensionToken(supabase, token)
    if (!validation.success) {
      return errorResponse(
        ERROR_CODES.INVALID_TOKEN,
        { error: validation.error },
        corsHeaders
      )
    }

    userId = validation.user!.id
    userEmail = validation.user!.email
    userPlan = validation.user!.plan
    permissions = validation.permissions || []

    // Check required scope
    if (actionConfig.requiredScope && !permissions.includes(actionConfig.requiredScope)) {
      return errorResponse(
        ERROR_CODES.FORBIDDEN_SCOPE,
        { required: actionConfig.requiredScope, granted: permissions },
        corsHeaders
      )
    }
  }

  // ==========================================================================
  // 5. ANTI-REPLAY CHECK
  // ==========================================================================

  const replayCheck = await checkAntiReplay(supabase, requestId, userId, extensionId, action)
  if (!replayCheck.allowed) {
    return errorResponse(
      ERROR_CODES.REPLAY_DETECTED,
      { requestId },
      corsHeaders
    )
  }

  // ==========================================================================
  // 6. IDEMPOTENCY CHECK (for write actions)
  // ==========================================================================

  const isWriteAction = WRITE_ACTIONS.has(action)
  
  if (isWriteAction && userId) {
    if (!idempotencyKey) {
      return errorResponse(
        ERROR_CODES.INVALID_HEADERS,
        { missing: 'X-Idempotency-Key', hint: 'Required for write operations' },
        corsHeaders
      )
    }

    const idempotencyCheck = await checkIdempotency(supabase, idempotencyKey, userId, action)

    if (idempotencyCheck.status === 'succeeded') {
      // Return cached response
      return successResponse(
        idempotencyCheck.cachedResponse,
        { cached: true, action, requestId },
        corsHeaders
      )
    }

    if (idempotencyCheck.status === 'started') {
      return errorResponse(
        ERROR_CODES.IN_PROGRESS,
        { idempotencyKey, hint: 'Previous request still processing' },
        corsHeaders
      )
    }
  }

  // ==========================================================================
  // 7. RATE LIMITING
  // ==========================================================================

  const rateLimit = await checkRateLimit(supabase, userId, action, actionConfig.rateLimit)
  if (!rateLimit.allowed) {
    return errorResponse(
      ERROR_CODES.QUOTA_EXCEEDED,
      { 
        action,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt.toISOString(),
        retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
      },
      { 
        ...corsHeaders, 
        'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString()
      }
    )
  }

  // ==========================================================================
  // 8. BUILD CONTEXT AND ROUTE TO HANDLER
  // ==========================================================================

  const ctx: GatewayContext = {
    requestId,
    extensionId,
    extensionVersion,
    idempotencyKey,
    userId,
    userEmail,
    userPlan,
    permissions,
    startTime,
    supabase,
  }

  let result: any

  try {
    switch (actionConfig.handler) {
      case 'auth':
        result = await handleAuthAction(action, payload, ctx, req)
        break
      case 'import':
        result = await handleImportAction(action, payload, ctx)
        break
      case 'ai':
        result = await handleAIAction(action, payload, ctx)
        break
      case 'sync':
        result = await handleSyncAction(action, payload, ctx)
        break
      case 'utility':
        result = await handleUtilityAction(action, payload, ctx)
        break
      case 'scrape':
        result = await handleScrapeAction(action, payload, ctx)
        break
      case 'analyze':
        result = await handleAnalyzeAction(action, payload, ctx)
        break
      case 'progressive':
        if (action === 'IMPORT_PROGRESSIVE') {
          result = await handleProgressiveImport(payload, ctx)
        } else if (action === 'JOB_STATUS') {
          result = await handleJobStatus(payload, ctx)
        } else {
          result = { success: false, error: { code: 'UNKNOWN_PROGRESSIVE_ACTION', message: 'Unknown progressive action' } }
        }
        break
      default:
        result = { success: false, error: { code: 'UNKNOWN_HANDLER', message: 'Handler not found' } }
    }
  } catch (error) {
    console.error(`[Gateway] Handler error for ${action}:`, error)
    result = { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }

  // ==========================================================================
  // 9. UPDATE IDEMPOTENCY STATUS
  // ==========================================================================

  if (isWriteAction && userId && idempotencyKey) {
    const status = result.success ? 'succeeded' : 'failed'
    await updateIdempotency(supabase, idempotencyKey, userId, status, result.data)
  }

  // ==========================================================================
  // 10. LOG EVENT
  // ==========================================================================

  await logEvent(
    supabase,
    ctx,
    action,
    result.success ? 'success' : 'error',
    result.error?.code || null,
    result.error?.message || null,
    metadata
  )

  // ==========================================================================
  // 11. RETURN RESPONSE
  // ==========================================================================

  if (result.success) {
    return successResponse(
      result.data,
      { 
        action, 
        requestId,
        durationMs: Date.now() - startTime,
        rateLimit: {
          remaining: rateLimit.remaining - 1,
          resetAt: rateLimit.resetAt.toISOString(),
        }
      },
      corsHeaders
    )
  } else {
    const errorConfig = ERROR_CODES[result.error?.code as keyof typeof ERROR_CODES] || ERROR_CODES.HANDLER_ERROR
    return errorResponse(
      { ...errorConfig, message: result.error?.message || errorConfig.message },
      result.error?.details || {},
      corsHeaders
    )
  }
})
