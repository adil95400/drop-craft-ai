/**
 * P1.1 + P1.3 - Unified Edge Function Wrapper
 * MANDATORY for all client-facing functions
 * 
 * Features:
 * - Auth (JWT or extension token)
 * - Scope-based authorization (P1.3)
 * - Input validation (Zod)
 * - Rate limiting (global + per-scope)
 * - Secure CORS
 * - Error handling with structured logging
 * - Correlation ID for observability
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from './secure-cors.ts'
import { validateTokenScopes, logScopeUsage, checkScopeRateLimit, type ScopeConfig } from './scope-middleware.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ============= Types =============

export interface AuthenticatedUser {
  id: string
  email?: string
  role: 'user' | 'admin'
  plan: string
  tokenId?: string        // P1.3: Token ID for scope tracking
  scopes?: string[]       // P1.3: Granted scopes
}

export interface EdgeContext<T = unknown> {
  user: AuthenticatedUser
  userClient: ReturnType<typeof createClient>
  adminClient: ReturnType<typeof createClient>
  input: T
  correlationId: string
  req: Request
  hasScope: (scope: string) => boolean  // P1.3: Helper to check scopes
}

export interface EdgeFunctionConfig<TInput = unknown> {
  // Auth
  requireAuth?: boolean           // Default: true
  requireAdmin?: boolean          // Default: false
  allowExtensionToken?: boolean   // Default: false
  allowAnonymous?: boolean        // Default: false (for webhooks)
  
  // P1.3: Scope requirements for extension tokens
  requiredScopes?: string[]       // Scopes required for this endpoint
  requireAllScopes?: boolean      // If true, all scopes required. Default: true
  logScopeUsage?: boolean         // Log scope access for audit. Default: true
  
  // Validation
  inputSchema?: z.ZodSchema<TInput>
  
  // Rate limiting
  rateLimit?: {
    maxRequests: number
    windowMinutes: number
    action: string
  }
  
  // Webhook verification (for Stripe, Shopify, etc.)
  webhookSecret?: string
  webhookHeader?: string
}

// ============= Rate Limiting =============

const rateLimitCache = new Map<string, number[]>()

async function checkRateLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  config: { maxRequests: number; windowMinutes: number; action: string }
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${userId}:${config.action}`
  const now = Date.now()
  const windowMs = config.windowMinutes * 60 * 1000
  
  // Get recent attempts
  let attempts = rateLimitCache.get(key) || []
  attempts = attempts.filter(time => now - time < windowMs)
  
  if (attempts.length >= config.maxRequests) {
    // Log rate limit exceeded
    await adminClient.from('security_events').insert({
      user_id: userId,
      event_type: 'rate_limit_exceeded',
      severity: 'warn',
      description: `Rate limit exceeded for ${config.action}`,
      metadata: { action: config.action, attempts: attempts.length, limit: config.maxRequests }
    })
    
    return { allowed: false, remaining: 0 }
  }
  
  attempts.push(now)
  rateLimitCache.set(key, attempts)
  
  return { allowed: true, remaining: config.maxRequests - attempts.length }
}

// ============= Authentication =============

class AuthError extends Error {
  status: number
  code?: string
  constructor(message: string, status = 401, code?: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

class ValidationError extends Error {
  status = 400
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class RateLimitError extends Error {
  status = 429
  remaining: number
  constructor(message: string, remaining: number) {
    super(message)
    this.name = 'RateLimitError'
    this.remaining = remaining
  }
}

// P1.3: Scope authorization error
class ScopeError extends Error {
  status = 403
  code = 'INSUFFICIENT_SCOPES'
  missingScopes: string[]
  grantedScopes: string[]
  
  constructor(message: string, missingScopes: string[], grantedScopes: string[]) {
    super(message)
    this.name = 'ScopeError'
    this.missingScopes = missingScopes
    this.grantedScopes = grantedScopes
  }
}

async function authenticateJWT(req: Request): Promise<{
  user: AuthenticatedUser
  userClient: ReturnType<typeof createClient>
  adminClient: ReturnType<typeof createClient>
}> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Authorization header required')
  }
  
  const token = authHeader.replace('Bearer ', '')
  if (!token || token.length < 20) {
    throw new AuthError('Invalid token format')
  }
  
  // User client for RLS
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  
  // Verify JWT
  const { data, error } = await userClient.auth.getClaims(token)
  
  if (error || !data?.claims?.sub) {
    throw new AuthError('Invalid or expired token')
  }
  
  const userId = data.claims.sub as string
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Get role and plan
  const [{ data: isAdmin }, { data: profile }] = await Promise.all([
    adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' }),
    adminClient.from('profiles').select('subscription_plan').eq('id', userId).single()
  ])
  
  return {
    user: {
      id: userId,
      email: data.claims.email as string | undefined,
      role: isAdmin ? 'admin' : 'user',
      plan: profile?.subscription_plan || 'free'
    },
    userClient,
    adminClient
  }
}

// P1.3: Enhanced extension token auth with scope validation
async function authenticateExtensionToken(
  req: Request,
  requiredScopes?: string[],
  requireAllScopes = true
): Promise<{
  user: AuthenticatedUser
  userClient: ReturnType<typeof createClient>
  adminClient: ReturnType<typeof createClient>
}> {
  const extensionToken = req.headers.get('x-extension-token')
  
  if (!extensionToken) {
    throw new AuthError('Extension token required')
  }
  
  // Sanitize token - allow base64 characters including + / =
  const sanitized = extensionToken.trim().replace(/[^a-zA-Z0-9\-_+=/]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) {
    throw new AuthError('Invalid extension token format')
  }
  
  // P1.3: Use scope-aware validation
  const scopeResult = await validateTokenScopes(sanitized, {
    requiredScopes: requiredScopes || [],
    requireAll: requireAllScopes,
    logUsage: true
  })
  
  if (!scopeResult.valid) {
    if (scopeResult.code === 'INSUFFICIENT_SCOPES') {
      throw new ScopeError(
        scopeResult.error || 'Insufficient scopes',
        scopeResult.missingScopes,
        scopeResult.grantedScopes
      )
    }
    throw new AuthError(scopeResult.error || 'Invalid extension token', 401, scopeResult.code)
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  return {
    user: {
      id: scopeResult.userId!,
      email: scopeResult.userEmail,
      role: 'user',
      plan: scopeResult.userPlan || 'free',
      tokenId: scopeResult.tokenId,
      scopes: scopeResult.grantedScopes
    },
    userClient: adminClient, // Extension tokens use admin client with manual isolation
    adminClient
  }
}

// ============= Main Wrapper =============

export function createEdgeFunction<TInput = unknown>(
  config: EdgeFunctionConfig<TInput>,
  handler: (ctx: EdgeContext<TInput>) => Promise<Response>
): (req: Request) => Promise<Response> {
  
  return async (req: Request): Promise<Response> => {
    const correlationId = crypto.randomUUID()
    const corsHeaders = getSecureCorsHeaders(req)
    const startTime = Date.now()
    
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return handleCorsPreflightSecure(req)
    }
    
    try {
      let user: AuthenticatedUser | null = null
      let userClient: ReturnType<typeof createClient>
      let adminClient: ReturnType<typeof createClient> = createClient(supabaseUrl, supabaseServiceKey)
      
      // ===== Authentication =====
      const requireAuth = config.requireAuth !== false && !config.allowAnonymous
      
      if (requireAuth) {
        const authHeader = req.headers.get('Authorization')
        const extensionToken = req.headers.get('x-extension-token')
        
        if (authHeader) {
          const auth = await authenticateJWT(req)
          user = auth.user
          userClient = auth.userClient
          adminClient = auth.adminClient
        } else if (extensionToken && config.allowExtensionToken) {
          // P1.3: Pass required scopes to extension token auth
          const auth = await authenticateExtensionToken(
            req,
            config.requiredScopes,
            config.requireAllScopes !== false
          )
          user = auth.user
          userClient = auth.userClient
          adminClient = auth.adminClient
          
          // P1.3: Log scope usage if enabled
          if (config.logScopeUsage !== false && user.tokenId && config.requiredScopes?.length) {
            const primaryScope = config.requiredScopes[0]
            const action = req.url.split('/').pop() || 'unknown'
            await logScopeUsage(
              user.tokenId,
              user.id,
              primaryScope,
              action,
              true,
              undefined,
              { correlationId, method: req.method },
              req.headers.get('x-forwarded-for') || undefined
            )
          }
        } else {
          throw new AuthError('Authentication required')
        }
        
        // Admin check
        if (config.requireAdmin && user.role !== 'admin') {
          throw new AuthError('Admin access required', 403)
        }
      } else {
        // Anonymous access
        userClient = createClient(supabaseUrl, supabaseAnonKey)
        user = { id: 'anonymous', role: 'user', plan: 'free', scopes: [] }
      }
      
      // ===== Rate Limiting =====
      if (config.rateLimit && user && user.id !== 'anonymous') {
        const rateLimitResult = await checkRateLimit(adminClient, user.id, config.rateLimit)
        if (!rateLimitResult.allowed) {
          throw new RateLimitError(
            `Rate limit exceeded for ${config.rateLimit.action}. Try again later.`,
            rateLimitResult.remaining
          )
        }
      }
      
      // ===== Input Validation =====
      let input: TInput = {} as TInput
      
      if (config.inputSchema && req.method !== 'GET') {
        try {
          const body = await req.json()
          input = config.inputSchema.parse(body)
        } catch (e) {
          if (e instanceof z.ZodError) {
            const messages = e.errors.map(err => `${err.path.join('.')}: ${err.message}`)
            throw new ValidationError(`Validation failed: ${messages.join(', ')}`)
          }
          throw new ValidationError('Invalid JSON body')
        }
      }
      
      // ===== Execute Handler =====
      // ===== Execute Handler =====
      // P1.3: Add hasScope helper for runtime scope checks
      const hasScope = (scope: string): boolean => {
        if (!user?.scopes) return false
        return user.scopes.includes(scope)
      }
      
      const ctx: EdgeContext<TInput> = {
        user: user!,
        userClient: userClient!,
        adminClient,
        input,
        correlationId,
        req,
        hasScope  // P1.3: Runtime scope checker
      }
      
      const response = await handler(ctx)
      
      // Add headers
      const headers = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v))
      headers.set('X-Correlation-ID', correlationId)
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      
      return new Response(response.body, { status: response.status, headers })
      
    } catch (error) {
      console.error(`[${correlationId}] Error:`, error)
      
      let status = 500
      let message = 'Internal server error'
      let extra: Record<string, unknown> = {}
      const headers: Record<string, string> = {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId
      }
      
      if (error instanceof AuthError) {
        status = error.status
        message = error.message
      } else if (error instanceof ScopeError) {
        status = 403
        message = error.message
        extra = {
          code: 'INSUFFICIENT_SCOPES',
          missing_scopes: error.missingScopes,
          granted_scopes: error.grantedScopes
        }
      } else if (error instanceof ValidationError) {
        status = 400
        message = error.message
      } else if (error instanceof RateLimitError) {
        status = 429
        message = error.message
        headers['Retry-After'] = '60'
      }
      
      return new Response(
        JSON.stringify({ success: false, error: message, correlationId, ...extra }),
        { status, headers }
      )
    }
  }
}

// ============= Webhook Helper =============

export function createWebhookHandler(
  secretEnvVar: string,
  signatureHeader: string,
  handler: (req: Request, body: unknown, adminClient: ReturnType<typeof createClient>) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const correlationId = crypto.randomUUID()
    
    try {
      const secret = Deno.env.get(secretEnvVar)
      if (!secret) {
        console.error(`[${correlationId}] Webhook secret ${secretEnvVar} not configured`)
        return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500 })
      }
      
      const signature = req.headers.get(signatureHeader)
      if (!signature) {
        return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 })
      }
      
      const body = await req.text()
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      
      // Signature verification should be done in the handler (Stripe, Shopify have different methods)
      const parsedBody = JSON.parse(body)
      
      return await handler(req, parsedBody, adminClient)
      
    } catch (error) {
      console.error(`[${correlationId}] Webhook error:`, error)
      return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500 })
    }
  }
}

// ============= Export schemas and utilities =============
export { z }

// Re-export scope utilities for convenience
export { SCOPE_PRESETS, type ScopeConfig } from './scope-middleware.ts'
