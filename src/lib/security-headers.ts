/**
 * Security Headers Configuration
 * Defines Content Security Policy and other security headers
 */

/**
 * Content Security Policy directives
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
  'img-src': ["'self'", "data:", "blob:", "https:", "http:"],
  'connect-src': [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
    "https://api.openai.com",
    "https://*.lovable.app",
  ],
  'frame-ancestors': ["'self'"],
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Build CSP header string from directives
 */
export function buildCSPHeader(directives: typeof CSP_DIRECTIVES = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers for responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Content-Security-Policy': buildCSPHeader(),
};

/**
 * Add security headers to a Response object
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a meta tag string for CSP (client-side fallback)
 */
export function createCSPMetaTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${buildCSPHeader()}">`;
}

/**
 * Validate that a URL matches allowed origins
 */
export function isAllowedOrigin(url: string, allowedOrigins: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedOrigins.some(origin => {
      if (origin.includes('*')) {
        const pattern = new RegExp('^' + origin.replace(/\*/g, '.*') + '$');
        return pattern.test(parsed.origin);
      }
      return parsed.origin === origin;
    });
  } catch {
    return false;
  }
}

/**
 * Get nonce for inline scripts (if using nonce-based CSP)
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}
