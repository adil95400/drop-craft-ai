/**
 * P1.2 - Secure Cron/Webhook Function Wrapper
 * For internal scheduled jobs (pg_cron) and server-to-server webhooks
 * 
 * NEVER exposed to client-facing CORS - no wildcard origins
 * Requires secret header verification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ============= Types =============

export interface CronContext {
  adminClient: ReturnType<typeof createClient>
  correlationId: string
  req: Request
  cronType: string
}

export interface CronFunctionConfig {
  // Name of the cron job (for logging)
  name: string
  
  // Secret verification
  requireSecret?: boolean      // Default: true
  secretEnvVar?: string        // Default: 'CRON_SECRET'
  secretHeader?: string        // Default: 'x-cron-secret'
  
  // Alternative: allow Supabase service role authorization
  allowServiceRoleAuth?: boolean  // Default: true (for pg_cron calls)
  
  // Rate limiting (optional, for extra protection)
  maxExecutionsPerHour?: number
}

// ============= Execution tracking =============

const executionCache = new Map<string, number[]>()

function checkExecutionLimit(cronName: string, maxPerHour: number): boolean {
  const now = Date.now()
  const hourMs = 60 * 60 * 1000
  
  let executions = executionCache.get(cronName) || []
  executions = executions.filter(time => now - time < hourMs)
  
  if (executions.length >= maxPerHour) {
    return false
  }
  
  executions.push(now)
  executionCache.set(cronName, executions)
  return true
}

// ============= Verification =============

function verifySecret(req: Request, config: CronFunctionConfig): boolean {
  const secretEnvVar = config.secretEnvVar || 'CRON_SECRET'
  const secretHeader = config.secretHeader || 'x-cron-secret'
  
  const expectedSecret = Deno.env.get(secretEnvVar)
  if (!expectedSecret) {
    console.warn(`[CRON] Secret ${secretEnvVar} not configured - blocking request`)
    return false
  }
  
  const providedSecret = req.headers.get(secretHeader)
  if (!providedSecret) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== expectedSecret.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < providedSecret.length; i++) {
    result |= providedSecret.charCodeAt(i) ^ expectedSecret.charCodeAt(i)
  }
  
  return result === 0
}

function verifyServiceRoleAuth(req: Request): boolean {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.replace('Bearer ', '')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  // Allow both anon key (from pg_cron with net.http_post) and service role
  return token === anonKey || token === serviceKey
}

// ============= Main Wrapper =============

export function createCronFunction(
  config: CronFunctionConfig,
  handler: (ctx: CronContext) => Promise<Response>
): (req: Request) => Promise<Response> {
  
  return async (req: Request): Promise<Response> => {
    const correlationId = crypto.randomUUID()
    const startTime = Date.now()
    
    // NO CORS for cron functions - they should never be called from browsers
    // Return 403 for any OPTIONS request
    if (req.method === 'OPTIONS') {
      console.warn(`[CRON:${config.name}] Blocked OPTIONS request - cron functions don't support CORS`)
      return new Response(null, { status: 403 })
    }
    
    try {
      console.log(`[CRON:${config.name}:${correlationId}] Starting execution`)
      
      // ===== Authentication/Authorization =====
      const requireSecret = config.requireSecret !== false
      const allowServiceRole = config.allowServiceRoleAuth !== false
      
      let authorized = false
      
      // Check secret header
      if (requireSecret && verifySecret(req, config)) {
        authorized = true
        console.log(`[CRON:${config.name}:${correlationId}] Authorized via secret header`)
      }
      
      // Check service role auth (for pg_cron)
      if (!authorized && allowServiceRole && verifyServiceRoleAuth(req)) {
        authorized = true
        console.log(`[CRON:${config.name}:${correlationId}] Authorized via service role`)
      }
      
      if (!authorized) {
        console.warn(`[CRON:${config.name}:${correlationId}] Unauthorized request blocked`)
        return new Response(
          JSON.stringify({ error: 'Unauthorized', correlationId }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // ===== Execution limit =====
      if (config.maxExecutionsPerHour) {
        if (!checkExecutionLimit(config.name, config.maxExecutionsPerHour)) {
          console.warn(`[CRON:${config.name}:${correlationId}] Execution limit exceeded`)
          return new Response(
            JSON.stringify({ error: 'Execution limit exceeded', correlationId }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
      
      // ===== Execute Handler =====
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      
      const ctx: CronContext = {
        adminClient,
        correlationId,
        req,
        cronType: config.name
      }
      
      const response = await handler(ctx)
      
      const duration = Date.now() - startTime
      console.log(`[CRON:${config.name}:${correlationId}] Completed in ${duration}ms`)
      
      // Add metadata headers
      const headers = new Headers(response.headers)
      headers.set('X-Correlation-ID', correlationId)
      headers.set('X-Execution-Time', `${duration}ms`)
      
      return new Response(response.body, { status: response.status, headers })
      
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[CRON:${config.name}:${correlationId}] Error after ${duration}ms:`, error)
      
      // Log to database
      try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)
        await adminClient.from('cron_execution_logs').insert({
          cron_name: config.name,
          correlation_id: correlationId,
          status: 'error',
          error_message: error instanceof Error ? error.message : String(error),
          duration_ms: duration,
          executed_at: new Date().toISOString()
        })
      } catch (logError) {
        console.error(`[CRON:${config.name}] Failed to log error:`, logError)
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Cron execution failed', 
          correlationId,
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// ============= Webhook Handler (external services like Stripe, Shopify) =============

export interface WebhookConfig {
  name: string
  
  // Signature verification
  signatureHeader: string       // e.g., 'stripe-signature', 'x-shopify-hmac-sha256'
  secretEnvVar: string          // e.g., 'STRIPE_WEBHOOK_SECRET'
  
  // Custom signature verifier (for Stripe, Shopify, etc.)
  verifySignature?: (payload: string, signature: string, secret: string) => Promise<boolean>
}

export interface WebhookContext {
  adminClient: ReturnType<typeof createClient>
  correlationId: string
  req: Request
  rawBody: string
  parsedBody: unknown
  signature: string
}

export function createWebhookFunction(
  config: WebhookConfig,
  handler: (ctx: WebhookContext) => Promise<Response>
): (req: Request) => Promise<Response> {
  
  return async (req: Request): Promise<Response> => {
    const correlationId = crypto.randomUUID()
    const startTime = Date.now()
    
    // NO CORS for webhooks
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 403 })
    }
    
    try {
      console.log(`[WEBHOOK:${config.name}:${correlationId}] Received webhook`)
      
      // Get signature
      const signature = req.headers.get(config.signatureHeader)
      if (!signature) {
        console.warn(`[WEBHOOK:${config.name}:${correlationId}] Missing signature header`)
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Get secret
      const secret = Deno.env.get(config.secretEnvVar)
      if (!secret) {
        console.error(`[WEBHOOK:${config.name}:${correlationId}] Secret not configured`)
        return new Response(
          JSON.stringify({ error: 'Webhook not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      // Get raw body for signature verification
      const rawBody = await req.text()
      
      // Verify signature if custom verifier provided
      if (config.verifySignature) {
        const isValid = await config.verifySignature(rawBody, signature, secret)
        if (!isValid) {
          console.warn(`[WEBHOOK:${config.name}:${correlationId}] Invalid signature`)
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
      
      // Parse body
      let parsedBody: unknown
      try {
        parsedBody = JSON.parse(rawBody)
      } catch {
        parsedBody = rawBody
      }
      
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      
      const ctx: WebhookContext = {
        adminClient,
        correlationId,
        req,
        rawBody,
        parsedBody,
        signature
      }
      
      const response = await handler(ctx)
      
      const duration = Date.now() - startTime
      console.log(`[WEBHOOK:${config.name}:${correlationId}] Processed in ${duration}ms`)
      
      return response
      
    } catch (error) {
      console.error(`[WEBHOOK:${config.name}:${correlationId}] Error:`, error)
      return new Response(
        JSON.stringify({ error: 'Webhook processing failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
