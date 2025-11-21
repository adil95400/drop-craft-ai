/**
 * Secure Authentication Handler for Edge Functions
 * Provides robust authentication with proper error handling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { AuthenticationError } from './error-handler.ts'

export interface AuthContext {
  user: {
    id: string
    email?: string
    role: string
  }
  supabase: ReturnType<typeof createClient>
}

/**
 * Verify and extract authentication from request
 */
export async function verifyAuth(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header required')
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (!token || token === authHeader) {
    throw new AuthenticationError('Invalid authorization format')
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Verify JWT token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw new AuthenticationError('Invalid or expired token')
  }

  // Get user role with proper search_path
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching user profile:', profileError)
    throw new AuthenticationError('Unable to verify user permissions')
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    },
    supabase
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
