/**
 * Rate limiting utilities for edge functions
 * Uses Supabase database to track request counts
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// Predefined rate limits for different operations
export const RATE_LIMITS = {
  COMPETITIVE_ANALYSIS: { maxRequests: 10, windowMinutes: 60 },
  ANALYZE_COMPETITOR: { maxRequests: 20, windowMinutes: 60 },
  IMPORT: { maxRequests: 5, windowMinutes: 60 },
  SYNC: { maxRequests: 10, windowMinutes: 60 },
  API_GENERAL: { maxRequests: 60, windowMinutes: 60 },
} as const;

/**
 * Check if a user's request is within rate limits
 * @param supabase Supabase client
 * @param userId User ID
 * @param action Action identifier
 * @param config Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  config: RateLimitConfig = RATE_LIMITS.API_GENERAL
): Promise<RateLimitResult> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  try {
    // Count recent requests
    const { count, error } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event_type', `rate_limit:${action}`)
      .gte('created_at', windowStart.toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request on error
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
      };
    }

    const currentCount = count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const allowed = currentCount < config.maxRequests;

    // Log this request if allowed
    if (allowed) {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: `rate_limit:${action}`,
        severity: 'info',
        description: `Rate limit check for ${action}`,
        metadata: {
          current_count: currentCount + 1,
          max_requests: config.maxRequests,
          window_minutes: config.windowMinutes,
        },
      });
    }

    return {
      allowed,
      remaining,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
    };
  } catch (error) {
    console.error('Unexpected rate limit error:', error);
    // Fail open
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMinutes * 60 * 1000),
    };
  }
}

/**
 * Create a rate limit error response
 * @param result Rate limit result
 * @returns HTTP Response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${Math.ceil((result.resetAt.getTime() - Date.now()) / 1000 / 60)} minutes.`,
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to a response
 * @param response Original response
 * @param result Rate limit result
 * @returns Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
