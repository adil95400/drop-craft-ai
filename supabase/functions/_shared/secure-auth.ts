/**
 * Secure Authentication Handler for Edge Functions
 * CRITICAL SECURITY: All Edge Functions must use this for authentication
 * Provides robust authentication with rate limiting and security logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { AuthenticationError } from './error-handler.ts'
import { logSecurityEvent } from './security-logger.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

export interface AuthContext {
  user: {
    id: string
    email?: string
    role: string
  }
  supabase: ReturnType<typeof createClient>
}

/**
 * Authenticate user from request with security logging
 */
export async function authenticateUser(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    await logSecurityEvent(supabase, null, 'auth_missing_header', 'critical')
    throw new AuthenticationError('Authorization header required')
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (!token || token === authHeader || token.length < 20) {
    await logSecurityEvent(supabase, null, 'auth_invalid_token', 'critical')
    throw new AuthenticationError('Invalid authorization format')
  }

  // Verify JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    await logSecurityEvent(supabase, null, 'auth_failed', 'critical', { error: authError?.message })
    throw new AuthenticationError('Invalid or expired token')
  }

  // Check if user is admin using has_role function
  const { data: isAdmin } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  })

  // Log successful authentication
  await logSecurityEvent(supabase, user.id, 'auth_success', 'info', { is_admin: isAdmin })

  return {
    user: {
      id: user.id,
      email: user.email,
      role: isAdmin ? 'admin' : 'user'
    },
    isAdmin: Boolean(isAdmin),
    supabase
  }
}

/**
 * Legacy verifyAuth for backward compatibility
 */
export async function verifyAuth(req: Request): Promise<AuthContext> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const result = await authenticateUser(req, supabase)
  return {
    user: result.user,
    supabase: result.supabase
  }
}

/**
 * Verify admin role
 */
export async function verifyAdmin(req: Request): Promise<AuthContext> {
  const context = await verifyAuth(req)

  if (context.user.role !== 'admin') {
    throw new AuthenticationError('Admin access required')
  }

  return context
}

/**
 * Create rate-limited auth checker
 */
export function createRateLimitedAuth(maxAttempts = 10, windowMs = 60000) {
  const attempts = new Map<string, number[]>()

  return async (req: Request): Promise<AuthContext> => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    // Clean old attempts
    const userAttempts = (attempts.get(ip) || []).filter(time => now - time < windowMs)
    
    if (userAttempts.length >= maxAttempts) {
      throw new AuthenticationError('Too many authentication attempts. Please try again later.')
    }
    
    try {
      const context = await verifyAuth(req)
      // Clear attempts on success
      attempts.delete(ip)
      return context
    } catch (error) {
      // Record failed attempt
      userAttempts.push(now)
      attempts.set(ip, userAttempts)
      throw error
    }
  }
}

/**
 * Verify tenant isolation (user_id match)
 */
export function verifyTenantAccess(userId: string, resourceUserId: string): void {
  if (userId !== resourceUserId) {
    throw new AuthenticationError('Access denied: resource belongs to another user')
  }
}
