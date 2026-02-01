/**
 * P3: Input Sanitization Utilities
 * Defense in depth - sanitize even after validation
 */

// ===========================================
// STRING SANITIZATION
// ===========================================

/**
 * Remove potentially dangerous characters from strings
 */
export function sanitizeString(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  allowNewlines?: boolean;
} = {}): string {
  const { maxLength = 10000, allowHtml = false, allowNewlines = true } = options;
  
  let result = input;
  
  // Trim and limit length
  result = result.trim().slice(0, maxLength);
  
  // Remove null bytes
  result = result.replace(/\0/g, '');
  
  // Handle newlines
  if (!allowNewlines) {
    result = result.replace(/[\r\n]+/g, ' ');
  }
  
  // Remove HTML if not allowed
  if (!allowHtml) {
    result = stripHtml(result);
  }
  
  return result;
}

/**
 * Strip all HTML tags from string
 */
export function stripHtml(input: string): string {
  // Remove script tags and content
  let result = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and content
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove all remaining tags
  result = result.replace(/<[^>]+>/g, '');
  
  // Decode common HTML entities
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return result;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===========================================
// SQL INJECTION PREVENTION
// ===========================================

/**
 * SQL reserved words and dangerous patterns
 */
const SQL_DANGEROUS_PATTERNS = [
  /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|GRANT|REVOKE)(\b)/gi,
  /--/g,
  /\/\*/g,
  /\*\//g,
  /;/g,
  /'/g,
  /"/g,
  /\\x00/g,
  /\\n/g,
  /\\r/g,
];

/**
 * Check if string contains potential SQL injection
 */
export function containsSqlInjection(input: string): boolean {
  const normalized = input.toUpperCase();
  
  // Check for dangerous patterns
  for (const pattern of SQL_DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      // Some patterns are only dangerous in specific contexts
      if (pattern.source.includes('SELECT') || pattern.source.includes('DROP')) {
        // Check if it's actually a SQL keyword usage
        if (/\b(SELECT|DROP|DELETE|INSERT|UPDATE)\s+/i.test(normalized)) {
          return true;
        }
      } else {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanitize string for safe SQL usage (use parameterized queries instead when possible)
 */
export function sanitizeForSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

// ===========================================
// XSS PREVENTION
// ===========================================

/**
 * Check for potential XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeForXss(input: string): string {
  return escapeHtml(stripHtml(input));
}

// ===========================================
// URL SANITIZATION
// ===========================================

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
    // Remove credentials from URL
    url.username = '';
    url.password = '';
    
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Check if URL is from an allowed domain
 */
export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// ===========================================
// JSON SANITIZATION
// ===========================================

/**
 * Deep sanitize an object's string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxDepth?: number;
    maxStringLength?: number;
    stripHtml?: boolean;
  } = {}
): T {
  const { maxDepth = 10, maxStringLength = 10000, stripHtml: shouldStripHtml = true } = options;
  
  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return null;
    }
    
    if (typeof value === 'string') {
      let result = value.slice(0, maxStringLength);
      if (shouldStripHtml) {
        result = stripHtml(result);
      }
      return result;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item, depth + 1));
    }
    
    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Sanitize keys too
        const sanitizedKey = sanitizeString(key, { maxLength: 100, allowHtml: false });
        result[sanitizedKey] = sanitizeValue(val, depth + 1);
      }
      return result;
    }
    
    return value;
  }
  
  return sanitizeValue(obj, 0) as T;
}

// ===========================================
// FILE SANITIZATION
// ===========================================

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let result = filename.replace(/\.\./g, '');
  
  // Remove path separators
  result = result.replace(/[/\\]/g, '');
  
  // Remove null bytes
  result = result.replace(/\0/g, '');
  
  // Only allow safe characters
  result = result.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  result = result.slice(0, 255);
  
  // Prevent empty filename
  if (!result || result === '.' || result === '..') {
    result = 'unnamed';
  }
  
  return result;
}

/**
 * Validate file extension
 */
export function isAllowedExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowedExtensions.includes(ext);
}

// ===========================================
// COMPREHENSIVE SANITIZER
// ===========================================

export interface SanitizeOptions {
  strings?: {
    maxLength?: number;
    stripHtml?: boolean;
  };
  urls?: {
    allowedDomains?: string[];
  };
  checkInjection?: boolean;
}

/**
 * Comprehensive input sanitizer
 */
export function sanitizeInput<T>(input: T, options: SanitizeOptions = {}): {
  sanitized: T;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { checkInjection = true } = options;
  
  function process(value: unknown, path: string): unknown {
    if (typeof value === 'string') {
      // Check for injection attempts
      if (checkInjection) {
        if (containsSqlInjection(value)) {
          warnings.push(`Potential SQL injection detected at ${path}`);
        }
        if (containsXss(value)) {
          warnings.push(`Potential XSS detected at ${path}`);
        }
      }
      
      // Sanitize
      return sanitizeString(value, {
        maxLength: options.strings?.maxLength,
        allowHtml: !options.strings?.stripHtml,
      });
    }
    
    if (Array.isArray(value)) {
      return value.map((item, index) => process(item, `${path}[${index}]`));
    }
    
    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = process(val, `${path}.${key}`);
      }
      return result;
    }
    
    return value;
  }
  
  return {
    sanitized: process(input, 'root') as T,
    warnings,
  };
}
