/**
 * Client-side rate limiting utilities
 * Note: This is supplementary to server-side rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: number;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = window.setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request is allowed under rate limit
   * @param key Unique identifier for the rate limit (e.g., "user:123:action")
   * @param config Rate limit configuration
   * @returns Whether the request is allowed
   */
  checkLimit(key: string, config: RateLimitConfig): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous entry or window expired
    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return {
        allowed: true,
        resetTime: now + config.windowMs,
        remaining: config.maxRequests - 1,
      };
    }

    // Within window, check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: config.maxRequests - entry.count,
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param key Rate limit key to reset
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Destroy rate limiter and clear interval
   */
  destroy(): void {
    window.clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API calls
  API_CALL: { maxRequests: 60, windowMs: 60000 }, // 60 requests per minute
  
  // Heavy operations
  IMPORT: { maxRequests: 5, windowMs: 300000 }, // 5 imports per 5 minutes
  EXPORT: { maxRequests: 10, windowMs: 60000 }, // 10 exports per minute
  
  // AI operations
  AI_ANALYSIS: { maxRequests: 10, windowMs: 60000 }, // 10 AI calls per minute
  AI_GENERATION: { maxRequests: 20, windowMs: 60000 }, // 20 generations per minute
  
  // Search and filtering
  SEARCH: { maxRequests: 30, windowMs: 60000 }, // 30 searches per minute
  
  // Form submissions
  FORM_SUBMIT: { maxRequests: 5, windowMs: 60000 }, // 5 submissions per minute
} as const;

/**
 * Check if an action is rate limited
 * @param userId User ID
 * @param action Action name
 * @param config Rate limit configuration (defaults to API_CALL)
 * @returns Rate limit check result
 */
export function checkRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig = RATE_LIMITS.API_CALL
): { allowed: boolean; resetTime: number; remaining: number } {
  const key = `${userId}:${action}`;
  return rateLimiter.checkLimit(key, config);
}

/**
 * Reset rate limit for a user action
 * @param userId User ID
 * @param action Action name
 */
export function resetRateLimit(userId: string, action: string): void {
  const key = `${userId}:${action}`;
  rateLimiter.reset(key);
}

/**
 * Format remaining time for display
 * @param resetTime Timestamp when rate limit resets
 * @returns Human-readable time string
 */
export function formatResetTime(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;
  
  if (diff <= 0) return 'Now';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

export default rateLimiter;
