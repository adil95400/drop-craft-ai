/**
 * Secure CORS Configuration for ShopOpti+ Edge Functions
 * P0.4 Fix: Restricted origins instead of wildcard '*'
 */

// Allowed origins for production
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
  // Lovable preview URLs pattern
  /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/,
  // Lovable project preview URLs
  /^https:\/\/[\w-]+\.lovableproject\.com$/,
  // Chrome extension pattern
  /^chrome-extension:\/\/[a-z]{32}$/,
];

// Development origins (only in non-production)
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Check if origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Check regex patterns
  for (const pattern of ALLOWED_ORIGINS) {
    if (pattern instanceof RegExp && pattern.test(origin)) {
      return true;
    }
  }
  
  // Allow dev origins in development (check for non-production indicators)
  const isDev = Deno.env.get('ENVIRONMENT') === 'development' || 
                Deno.env.get('SUPABASE_URL')?.includes('localhost');
  if (isDev && DEV_ORIGINS.includes(origin)) {
    return true;
  }
  
  return false;
}

/**
 * Get CORS headers for a request
 * Returns restrictive headers if origin is not allowed
 */
export function getSecureCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  
  const baseHeaders = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-request-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Max-Age': '86400',
  };
  
  if (origin && isAllowedOrigin(origin)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  
  // For unknown origins, don't set Access-Control-Allow-Origin
  // This effectively blocks CORS requests from unauthorized origins
  return baseHeaders;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightSecure(req: Request): Response {
  const headers = getSecureCorsHeaders(req);
  const origin = req.headers.get('Origin');
  
  if (!origin || !isAllowedOrigin(origin)) {
    return new Response(null, { 
      status: 403, 
      headers: { 'Content-Type': 'text/plain' } 
    });
  }
  
  return new Response(null, { headers });
}

/**
 * Legacy compatibility - use for non-sensitive endpoints only
 * @deprecated Use getSecureCorsHeaders instead for new functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
};

/**
 * Sensitive function CORS headers - no wildcard allowed
 */
export function getSensitiveCorsHeaders(req: Request): Record<string, string> {
  return getSecureCorsHeaders(req);
}
