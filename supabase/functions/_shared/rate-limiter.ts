/**
 * Rate Limiter - Simplified utility for edge functions
 * Uses in-memory tracking with fallback to Supabase
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// In-memory cache for rate limiting (per Deno isolate)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple rate limit check
 * @param userId User ID
 * @param action Action identifier
 * @param maxRequests Maximum requests allowed
 * @param windowMinutes Time window in minutes
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 60,
  windowMinutes: number = 60
): Promise<RateLimitResult> {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  // Get or create cache entry
  let entry = rateLimitCache.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = {
      count: 0,
      resetAt: now + windowMs
    };
  }
  
  entry.count++;
  rateLimitCache.set(key, entry);
  
  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);
  
  // Also log to database for persistence across isolates
  if (!allowed) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('security_events').insert({
          user_id: userId,
          event_type: 'rate_limit_exceeded',
          severity: 'warning',
          description: `Rate limit exceeded for action: ${action}`,
          metadata: {
            action,
            max_requests: maxRequests,
            window_minutes: windowMinutes,
            current_count: entry.count
          }
        });
      }
    } catch (e) {
      // Ignore logging errors
      console.warn('Rate limit logging failed:', e);
    }
  }
  
  return {
    allowed,
    remaining,
    resetAt: new Date(entry.resetAt)
  };
}

/**
 * Clean up expired cache entries (call periodically)
 */
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (entry.resetAt < now) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(
  corsHeaders: Record<string, string>,
  message: string = 'Rate limit exceeded. Please try again later.'
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  );
}
