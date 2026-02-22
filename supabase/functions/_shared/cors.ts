/**
 * Secure CORS Headers for Edge Functions
 * CRITICAL: Replaced wildcard '*' with restrictive allowlist (P0.4 fix)
 */

// Allowed origins for production
const ALLOWED_ORIGINS = [
  // Production domains
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
  
  // Lovable preview domains (dynamic matching)
  // Will be validated with regex below
  
  // Chrome Extension
  'chrome-extension://bnkpofnjnagfjhdpljecdddkgnmkmdbk',
];

// Pattern for Lovable preview URLs
const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/;
const LOVABLE_PROJECT_PATTERN = /^https:\/\/[a-f0-9-]+\.lovableproject\.com$/;

// Development origins (only in dev mode)
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
  
  // Check Lovable preview pattern
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true;
  if (LOVABLE_PROJECT_PATTERN.test(origin)) return true;
  
  // In development, allow local origins
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  if (isDev && DEV_ORIGINS.includes(origin)) return true;
  
  return false;
}

/**
 * Get CORS headers with proper origin validation
 */
export function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightSecure(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new Response(null, { 
      status: 204,
      headers: getSecureCorsHeaders(origin) 
    });
  }
  return null;
}

/**
 * Legacy corsHeaders - NOW SECURE
 * Kept for backward compatibility but uses first allowed origin
 * New code should use getSecureCorsHeaders(origin)
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://shopopti.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Create response with secure CORS headers
 */
export function createSecureCorsResponse(
  body: any, 
  origin: string | null, 
  status = 200
): Response {
  return new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {
      status,
      headers: {
        ...getSecureCorsHeaders(origin),
        'Content-Type': 'application/json',
      },
    }
  );
}
