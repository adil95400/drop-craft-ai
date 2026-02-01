/**
 * P3: API Security Middleware
 * Comprehensive security layer for all edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { 
  parseAndValidate, 
  parseQueryParams,
  formatValidationErrors 
} from './validation-schemas.ts';
import { sanitizeInput, SanitizeOptions } from './input-sanitizer.ts';

// ===========================================
// CORS HEADERS
// ===========================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-extension-token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// ===========================================
// SECURITY HEADERS
// ===========================================

export const securityHeaders = {
  ...corsHeaders,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'none'",
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

// ===========================================
// RATE LIMITING
// ===========================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${config.keyPrefix || 'rate'}:${identifier}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }
  
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// ===========================================
// REQUEST VALIDATION
// ===========================================

export interface SecurityConfig {
  // Authentication
  requireAuth?: boolean;
  allowAnonymous?: boolean;
  requiredScopes?: string[];
  
  // Rate limiting
  rateLimit?: RateLimitConfig;
  
  // Input validation
  bodySchema?: z.ZodSchema;
  querySchema?: z.ZodSchema;
  
  // Sanitization
  sanitizeOptions?: SanitizeOptions;
  
  // Request limits
  maxBodySize?: number; // bytes
  
  // Allowed methods
  allowedMethods?: string[];
  
  // Custom validation
  customValidation?: (req: Request, ctx: SecurityContext) => Promise<ValidationResult>;
}

export interface SecurityContext {
  userId: string | null;
  claims: Record<string, unknown> | null;
  requestId: string;
  ip: string;
  userAgent: string;
}

type ValidationResult = { valid: true } | { valid: false; error: string; status: number };

/**
 * Create a secure API handler with all protections
 */
export function createSecureHandler<TBody = unknown, TQuery = unknown>(
  config: SecurityConfig,
  handler: (
    req: Request,
    ctx: SecurityContext & { 
      body?: TBody;
      query?: TQuery;
      supabase: ReturnType<typeof createClient>;
    }
  ) => Promise<Response>
): (req: Request) => Promise<Response> {
  
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // CORS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      // Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(req.method)) {
        return errorResponse('Method not allowed', 405, requestId);
      }
      
      // Extract context
      const ctx: SecurityContext = {
        userId: null,
        claims: null,
        requestId,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
            req.headers.get('cf-connecting-ip') || 
            'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      };
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      
      const authHeader = req.headers.get('Authorization');
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
      });
      
      // Authentication
      if (config.requireAuth) {
        if (!authHeader?.startsWith('Bearer ')) {
          return errorResponse('Authorization required', 401, requestId);
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        
        if (claimsError || !claimsData?.claims) {
          return errorResponse('Invalid or expired token', 401, requestId);
        }
        
        ctx.userId = claimsData.claims.sub as string;
        ctx.claims = claimsData.claims as Record<string, unknown>;
      }
      
      // Rate limiting
      if (config.rateLimit) {
        const identifier = ctx.userId || ctx.ip;
        const rateResult = checkRateLimit(identifier, config.rateLimit);
        
        if (!rateResult.allowed) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateResult.resetAt - Date.now()) / 1000),
            }),
            {
              status: 429,
              headers: {
                ...securityHeaders,
                'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateResult.resetAt),
                'X-Request-Id': requestId,
              },
            }
          );
        }
      }
      
      // Body size check
      const contentLength = req.headers.get('content-length');
      if (config.maxBodySize && contentLength) {
        if (parseInt(contentLength) > config.maxBodySize) {
          return errorResponse('Request body too large', 413, requestId);
        }
      }
      
      // Parse and validate body
      let body: TBody | undefined;
      if (config.bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyResult = await parseAndValidate(req, config.bodySchema);
        if ('error' in bodyResult) {
          return new Response(JSON.stringify(bodyResult.error), {
            status: bodyResult.status,
            headers: { ...securityHeaders, 'X-Request-Id': requestId },
          });
        }
        
        // Sanitize body
        if (config.sanitizeOptions) {
          const { sanitized, warnings } = sanitizeInput(bodyResult.data, config.sanitizeOptions);
          body = sanitized as TBody;
          
          // Log warnings but don't block
          if (warnings.length > 0) {
            console.warn(`[${requestId}] Sanitization warnings:`, warnings);
          }
        } else {
          body = bodyResult.data as TBody;
        }
      }
      
      // Parse and validate query params
      let query: TQuery | undefined;
      if (config.querySchema) {
        const url = new URL(req.url);
        const queryResult = parseQueryParams(url, config.querySchema);
        if ('error' in queryResult) {
          return new Response(JSON.stringify(queryResult.error), {
            status: queryResult.status,
            headers: { ...securityHeaders, 'X-Request-Id': requestId },
          });
        }
        query = queryResult.data as TQuery;
      }
      
      // Custom validation
      if (config.customValidation) {
        const customResult = await config.customValidation(req, ctx);
        if (!customResult.valid) {
          return errorResponse(customResult.error, customResult.status, requestId);
        }
      }
      
      // Execute handler
      const response = await handler(req, { ...ctx, body, query, supabase });
      
      // Add security headers to response
      const headers = new Headers(response.headers);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });
      headers.set('X-Request-Id', requestId);
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      
      return new Response(response.body, {
        status: response.status,
        headers,
      });
      
    } catch (error) {
      console.error(`[${requestId}] Unhandled error:`, error);
      
      return errorResponse(
        'Internal server error',
        500,
        requestId
      );
    }
  };
}

// ===========================================
// RESPONSE HELPERS
// ===========================================

function errorResponse(message: string, status: number, requestId: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
    }
  );
}

export function successResponse<T>(data: T, requestId: string, status = 200): Response {
  return new Response(
    JSON.stringify({ data, requestId }),
    {
      status,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
    }
  );
}

export function paginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number },
  requestId: string
): Response {
  return new Response(
    JSON.stringify({
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasMore: pagination.page * pagination.limit < pagination.total,
      },
      requestId,
    }),
    {
      status: 200,
      headers: {
        ...securityHeaders,
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
    }
  );
}
