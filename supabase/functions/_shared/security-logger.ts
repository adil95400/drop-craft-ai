/**
 * Security event logging utilities
 * CRITICAL: All security events must be logged for audit trail
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

/**
 * Log security event to database
 */
export async function logSecurityEvent(
  supabase: SupabaseClient | any,
  userId: string | null,
  eventType: string,
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: eventType,
      severity,
      description: `Edge function event: ${eventType}`,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    })
  } catch (error) {
    // Never throw on logging failure
    console.error('Failed to log security event:', error)
  }
}

/**
 * Check rate limit using database function
 */
export async function checkRateLimit(
  supabase: SupabaseClient | any,
  userId: string,
  action: string,
  maxRequests: number = 100,
  windowMinutes: number = 5
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_security_rate_limit', {
      p_event_type: action,
      p_max_events: maxRequests,
      p_window_minutes: windowMinutes
    })

    if (error) {
      console.error('Rate limit check error:', error)
      return true // Fail open for rate limit errors
    }

    if (!data) {
      await logSecurityEvent(supabase, userId, 'rate_limit_exceeded', 'high', {
        action,
        max_requests: maxRequests,
        window_minutes: windowMinutes
      })
      throw new Error(`Rate limit exceeded: Too many ${action} requests`)
    }

    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      throw error
    }
    // Fail open on errors
    console.error('Rate limit error:', error)
    return true
  }
}

/**
 * Log database operation for audit trail
 */
export async function logDatabaseOperation(
  supabase: SupabaseClient | any,
  userId: string,
  operation: 'insert' | 'update' | 'delete' | 'select',
  table: string,
  recordCount: number
): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: `db_${operation}`,
      description: `${operation.toUpperCase()} operation on ${table}`,
      entity_type: table,
      metadata: {
        operation,
        record_count: recordCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to log database operation:', error)
  }
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown'
}

/**
 * Extract User-Agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown'
}

/**
 * Validate request origin
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean)

  if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed || ''))) {
    console.warn('Invalid origin:', origin)
    return false
  }

  return true
}
