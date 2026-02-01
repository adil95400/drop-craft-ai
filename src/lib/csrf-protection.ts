/**
 * CSRF Protection Library
 * Generates and validates CSRF tokens for form submissions
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const TOKEN_VALIDITY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new CSRF token with timestamp
 */
export function generateCSRFToken(): string {
  const token = generateSecureToken(32);
  const expiry = Date.now() + TOKEN_VALIDITY_MS;
  
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
    sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, expiry.toString());
  } catch (e) {
    console.warn('Unable to store CSRF token in sessionStorage');
  }
  
  return token;
}

/**
 * Get current CSRF token, generating new one if expired or missing
 */
export function getCSRFToken(): string {
  try {
    const token = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }
  } catch (e) {
    // sessionStorage not available
  }
  
  return generateCSRFToken();
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  try {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    
    if (!storedToken || !expiry) {
      return false;
    }
    
    // Check expiry
    if (Date.now() > parseInt(expiry, 10)) {
      clearCSRFToken();
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return constantTimeCompare(token, storedToken);
  } catch (e) {
    return false;
  }
}

/**
 * Clear stored CSRF token
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
  } catch (e) {
    // Ignore
  }
}

/**
 * Rotate CSRF token after successful form submission
 */
export function rotateCSRFToken(): string {
  clearCSRFToken();
  return generateCSRFToken();
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Create headers with CSRF token for fetch requests
 */
export function createSecureHeaders(additionalHeaders?: Record<string, string>): Headers {
  const headers = new Headers(additionalHeaders);
  headers.set('X-CSRF-Token', getCSRFToken());
  headers.set('X-Requested-With', 'XMLHttpRequest');
  return headers;
}

/**
 * Wrap fetch with CSRF protection
 */
export async function secureFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF token for state-changing methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const headers = new Headers(options.headers);
    headers.set('X-CSRF-Token', getCSRFToken());
    headers.set('X-Requested-With', 'XMLHttpRequest');
    
    options.headers = headers;
  }
  
  return fetch(url, options);
}
