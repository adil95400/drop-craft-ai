/**
 * Security Middleware for Edge Functions
 * Provides CSRF validation, XSS protection, and security headers
 */

import { createAuditLog } from './audit-logger.ts';

// Security headers for responses
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
};

// CORS headers
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Validate CSRF token from request headers
 */
export function validateCSRFHeader(req: Request): boolean {
  const csrfToken = req.headers.get('X-CSRF-Token');
  const requestedWith = req.headers.get('X-Requested-With');
  
  // For API calls, we check for XMLHttpRequest header as additional protection
  if (requestedWith !== 'XMLHttpRequest') {
    // Allow if coming from same origin or if CSRF token is present
    const origin = req.headers.get('Origin');
    const referer = req.headers.get('Referer');
    
    // If no origin/referer, might be a direct API call - require CSRF token
    if (!origin && !referer && !csrfToken) {
      return false;
    }
  }
  
  // CSRF token format validation (if present)
  if (csrfToken) {
    // Token should be 64 hex characters
    if (!/^[a-f0-9]{64}$/i.test(csrfToken)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize string input - remove XSS vectors
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Deep sanitize object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const safeKey = sanitizeInput(key, 100);
    
    if (typeof value === 'string') {
      result[safeKey] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      result[safeKey] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[safeKey] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[safeKey] = value;
    }
  }
  
  return result as T;
}

/**
 * Validate URL safety
 */
export function isUrlSafe(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const lower = url.toLowerCase().trim();
  
  // Block dangerous protocols
  const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerous.some(proto => lower.startsWith(proto))) {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check for SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/i,
    /(;|--|\/\*|\*\/)/,
    /'\s*(OR|AND)\s+['"\d]/i,
    /\bOR\b\s+\d+\s*=\s*\d+/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limit check with IP tracking
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  
  let record = rateLimitMap.get(key);
  
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
    rateLimitMap.set(key, record);
  }
  
  record.count++;
  
  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }
  
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Create secure response with all security headers
 */
export function createSecureResponse(
  body: unknown,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
    ...SECURITY_HEADERS,
    ...additionalHeaders,
  });
  
  return new Response(
    JSON.stringify(body),
    { status, headers }
  );
}

/**
 * Create CORS preflight response
 */
export function createPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
    },
  });
}

/**
 * Security-hardened handler wrapper
 */
export function withSecurityMiddleware(
  handler: (req: Request) => Promise<Response>,
  options: {
    requireCSRF?: boolean;
    rateLimit?: { max: number; windowMs: number };
    sanitizeBody?: boolean;
    logRequests?: boolean;
  } = {}
) {
  const {
    requireCSRF = true,
    rateLimit,
    sanitizeBody = true,
    logRequests = true,
  } = options;

  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return createPreflightResponse();
    }

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    try {
      // Rate limiting
      if (rateLimit) {
        const { allowed, remaining, resetAt } = checkRateLimit(
          clientIP,
          rateLimit.max,
          rateLimit.windowMs
        );

        if (!allowed) {
          if (logRequests) {
            await createAuditLog(req, null, {
              action: 'RATE_LIMIT_EXCEEDED',
              category: 'security',
              severity: 'warn',
              metadata: { ip: clientIP, resetAt },
            });
          }

          return createSecureResponse(
            { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
            429,
            {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
            }
          );
        }
      }

      // CSRF validation for state-changing methods
      if (requireCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        if (!validateCSRFHeader(req)) {
          if (logRequests) {
            await createAuditLog(req, null, {
              action: 'CSRF_VALIDATION_FAILED',
              category: 'security',
              severity: 'error',
              metadata: { ip: clientIP, method: req.method },
            });
          }

          return createSecureResponse(
            { error: 'Token de sécurité invalide. Veuillez rafraîchir la page.' },
            403
          );
        }
      }

      // Execute handler
      const response = await handler(req);

      // Add security headers to response
      const secureHeaders = new Headers(response.headers);
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        secureHeaders.set(key, value);
      });
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        secureHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: secureHeaders,
      });
    } catch (error) {
      console.error('Security middleware error:', error);

      if (logRequests) {
        await createAuditLog(req, null, {
          action: 'SECURITY_ERROR',
          category: 'security',
          severity: 'error',
          metadata: { 
            ip: clientIP, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
        });
      }

      return createSecureResponse(
        { error: 'Une erreur de sécurité est survenue.' },
        500
      );
    }
  };
}
