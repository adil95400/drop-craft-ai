/**
 * XSS Protection Library
 * Comprehensive sanitization utilities to prevent Cross-Site Scripting attacks
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify with strict defaults
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  KEEP_CONTENT: true,
};

// Extended config for rich content (admin/trusted contexts)
const RICH_CONTENT_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'b', 'i', 'u', 'em', 'strong', 'mark', 'del', 'ins',
    'a', 'span', 'div',
    'blockquote', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'title', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORCE_BODY: true,
};

/**
 * Sanitize HTML content - basic (for user-generated content)
 */
export function sanitizeHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG) as string;
}

/**
 * Sanitize rich HTML content (for trusted/admin contexts)
 */
export function sanitizeRichHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, RICH_CONTENT_CONFIG) as string;
}

/**
 * Strip all HTML tags - returns plain text
 */
export function stripHTML(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize text input (no HTML allowed)
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Sanitize URL - prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(proto => trimmed.startsWith(proto))) {
    return '';
  }
  
  try {
    // Validate URL structure
    const parsed = new URL(url, window.location.origin);
    
    // Only allow http, https, mailto, tel
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      return '';
    }
    
    return url;
  } catch {
    // If relative URL, return as-is after basic sanitization
    if (url.startsWith('/') || url.startsWith('#')) {
      return url.replace(/[<>"']/g, '');
    }
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
  
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[^\d+\-().\s]/g, '').trim();
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\.+/g, '.') // Collapse multiple dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .slice(0, 255); // Max filename length
}

/**
 * Sanitize JSON string
 */
export function sanitizeJSON(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') return '{}';
  
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(sanitizeObject(parsed));
  } catch {
    return '{}';
  }
}

/**
 * Deep sanitize object values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const safeKey = sanitizeText(key, 100);
    
    if (typeof value === 'string') {
      result[safeKey] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      result[safeKey] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : 
        typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item
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
 * Encode HTML entities for safe display
 */
export function encodeHTMLEntities(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return str.replace(/[&<>"'`=\/]/g, char => entityMap[char] || char);
}

/**
 * Decode HTML entities
 */
export function decodeHTMLEntities(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  const textarea = document.createElement('textarea');
  textarea.innerHTML = str;
  return textarea.value;
}

/**
 * Check if string contains potential XSS vectors
 */
export function containsXSSVector(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:\s*text\/html/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\s*\(/i,
    /url\s*\(\s*['"]?\s*javascript/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Create a safe text node (never execute as HTML)
 */
export function createSafeTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Set text content safely (prevents XSS)
 */
export function setTextContentSafe(element: HTMLElement, text: string): void {
  element.textContent = sanitizeText(text);
}

/**
 * Set inner HTML safely with DOMPurify
 */
export function setInnerHTMLSafe(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeHTML(html);
}
