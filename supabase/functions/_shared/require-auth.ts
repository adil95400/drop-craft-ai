/**
 * Authentication Wrapper for Edge Functions
 * P0.1/P0.2 Fix: Mandatory JWT verification before any sensitive operation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from './secure-cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export interface AuthenticatedUser {
  id: string
  email?: string
  role: 'user' | 'admin'
  plan?: string
}

export interface AuthContext {
  user: AuthenticatedUser
  userClient: ReturnType<typeof createClient>  // RLS-enabled client
  adminClient: ReturnType<typeof createClient> // Service role client
}

export interface AuthOptions {
  requireAdmin?: boolean
  allowExtensionToken?: boolean
}

/**
 * Extract and verify JWT from Authorization header
 * CRITICAL: Always verify the token, never trust client-provided userId
 */
export async function requireAuth(
  req: Request, 
  options: AuthOptions = {}
): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    throw new AuthError('Authorization header required', 401)
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (!token || token === authHeader || token.length < 20) {
    throw new AuthError('Invalid authorization format', 401)
  }
  
  // Create user-context client (respects RLS)
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  
  // CRITICAL: Verify the JWT token
  const { data: { user }, error: authError } = await userClient.auth.getUser(token)
  
  if (authError || !user) {
    throw new AuthError('Invalid or expired token', 401)
  }
  
  // Create admin client for privileged operations (after auth verification)
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Check admin role if required
  let role: 'user' | 'admin' = 'user'
  const { data: isAdmin } = await adminClient.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  })
  
  if (isAdmin) {
    role = 'admin'
  }
  
  if (options.requireAdmin && role !== 'admin') {
    throw new AuthError('Admin access required', 403)
  }
  
  // Get user's plan
  const { data: profile } = await adminClient
    .from('profiles')
    .select('subscription_plan')
    .eq('id', user.id)
    .single()
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role,
      plan: profile?.subscription_plan || 'free'
    },
    userClient,
    adminClient
  }
}

/**
 * Verify extension token (for Chrome extension endpoints)
 * Returns user context from valid extension token
 */
export async function requireExtensionToken(req: Request): Promise<AuthContext> {
  const extensionToken = req.headers.get('x-extension-token')
  
  if (!extensionToken) {
    throw new AuthError('Extension token required', 401)
  }
  
  // Sanitize token
  const sanitized = extensionToken.trim().replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) {
    throw new AuthError('Invalid extension token format', 401)
  }
  
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Validate token via database function
  const { data: validationResult, error } = await adminClient
    .rpc('validate_extension_token', { p_token: sanitized })
  
  if (error || !validationResult?.success) {
    throw new AuthError('Invalid or expired extension token', 401)
  }
  
  const userId = validationResult.user?.id
  if (!userId) {
    throw new AuthError('Token validation failed', 401)
  }
  
  // Create user-context client for RLS
  // Note: We can't create a true user client without JWT, so use admin with isolation
  const userClient = adminClient // Operations must manually filter by user_id
  
  return {
    user: {
      id: userId,
      email: validationResult.user?.email,
      role: 'user',
      plan: validationResult.user?.plan || 'free'
    },
    userClient,
    adminClient
  }
}

/**
 * Combined auth: tries JWT first, falls back to extension token
 */
export async function requireAnyAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  const extensionToken = req.headers.get('x-extension-token')
  
  if (authHeader) {
    return requireAuth(req)
  }
  
  if (extensionToken) {
    return requireExtensionToken(req)
  }
  
  throw new AuthError('Authentication required (JWT or extension token)', 401)
}

/**
 * Custom error class for auth failures
 */
export class AuthError extends Error {
  status: number
  
  constructor(message: string, status: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/**
 * Wrapper to create a secure edge function handler
 */
export function createSecureHandler(
  handler: (req: Request, ctx: AuthContext) => Promise<Response>,
  options: AuthOptions = {}
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const corsHeaders = getSecureCorsHeaders(req)
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return handleCorsPreflightSecure(req)
    }
    
    try {
      // Authenticate
      const ctx = options.allowExtensionToken 
        ? await requireAnyAuth(req)
        : await requireAuth(req, options)
      
      // Execute handler
      const response = await handler(req, ctx)
      
      // Add CORS headers to response
      const newHeaders = new Headers(response.headers)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value)
      })
      
      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      })
      
    } catch (error) {
      console.error('[secure-handler] Error:', error)
      
      const status = error instanceof AuthError ? error.status : 500
      const message = error instanceof AuthError ? error.message : 'Internal server error'
      
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { 
          status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  }
}
