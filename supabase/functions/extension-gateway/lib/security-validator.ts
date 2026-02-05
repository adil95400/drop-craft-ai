/**
 * Security Validator v1.0
 * 
 * Comprehensive input validation and sanitization for all gateway operations.
 * Prevents XSS, SQL injection, and other common attacks.
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// =============================================================================
// SANITIZATION UTILITIES
// =============================================================================

/**
 * Remove potentially dangerous HTML/script content
 */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .slice(0, maxLength)
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: URIs (potential XSS vector)
    .replace(/data:[^,]*base64[^"')}\s]*/gi, '[data-removed]')
    // Escape HTML entities
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
}

/**
 * Sanitize HTML content while preserving safe formatting
 */
export function sanitizeHtml(input: string, maxLength = 50000): string {
  if (typeof input !== 'string') return ''
  
  const allowedTags = ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div']
  
  return input
    .slice(0, maxLength)
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Keep only allowed tags (basic implementation)
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
      if (allowedTags.includes(tag.toLowerCase())) {
        // Remove attributes from allowed tags for safety
        return match.replace(/ [^>]*/g, '')
      }
      return ''
    })
    .trim()
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(input: string): { valid: boolean; url: string; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, url: '', error: 'URL must be a string' }
  }

  const trimmed = input.trim().slice(0, 2048)
  
  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase()
  if (lowerUrl.startsWith('javascript:') || lowerUrl.startsWith('data:') || lowerUrl.startsWith('vbscript:')) {
    return { valid: false, url: '', error: 'Invalid URL protocol' }
  }

  try {
    const url = new URL(trimmed)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, url: '', error: 'Only HTTP/HTTPS URLs allowed' }
    }
    
    // Block localhost and private IPs in production
    const hostname = url.hostname.toLowerCase()
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
      /^::1$/,
    ]
    
    if (blockedPatterns.some(p => p.test(hostname))) {
      return { valid: false, url: '', error: 'Local/private URLs not allowed' }
    }
    
    return { valid: true, url: url.toString() }
  } catch {
    return { valid: false, url: '', error: 'Invalid URL format' }
  }
}

/**
 * Sanitize object keys and values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, depth = 0): T {
  if (depth > 10) return {} as T // Prevent infinite recursion
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    // Sanitize key
    const safeKey = key.replace(/[<>'"`&]/g, '').slice(0, 100)
    
    if (typeof value === 'string') {
      result[safeKey] = sanitizeString(value)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[safeKey] = value
    } else if (Array.isArray(value)) {
      result[safeKey] = value.map(item => {
        if (typeof item === 'string') return sanitizeString(item)
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>, depth + 1)
        }
        return item
      }).slice(0, 1000) // Limit array size
    } else if (typeof value === 'object' && value !== null) {
      result[safeKey] = sanitizeObject(value as Record<string, unknown>, depth + 1)
    }
  }
  
  return result as T
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

export const ProductImportSchema = z.object({
  url: z.string().url().max(2048),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(50000).optional(),
  price: z.number().min(0).max(999999999).optional(),
  compareAtPrice: z.number().min(0).max(999999999).optional(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional().default('EUR'),
  sku: z.string().max(100).optional(),
  variants: z.array(z.object({
    title: z.string().max(200),
    price: z.number().min(0).max(999999999).optional(),
    sku: z.string().max(100).optional(),
    stock: z.number().int().min(0).max(9999999).optional(),
    attributes: z.record(z.string().max(500)).optional(),
  })).max(500).optional(),
  images: z.array(z.string().url().max(2048)).max(100).optional(),
  videos: z.array(z.string().url().max(2048)).max(20).optional(),
  categories: z.array(z.string().max(200)).max(50).optional(),
  tags: z.array(z.string().max(100)).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const ReviewImportSchema = z.object({
  productId: z.string().uuid(),
  sourceUrl: z.string().url().max(2048).optional(),
  reviews: z.array(z.object({
    author: z.string().max(200),
    rating: z.number().min(1).max(5),
    title: z.string().max(500).optional(),
    content: z.string().max(10000).optional(),
    date: z.string().optional(),
    verified: z.boolean().optional(),
    images: z.array(z.string().url().max(2048)).max(10).optional(),
  })).max(1000),
  options: z.object({
    skipDuplicates: z.boolean().optional(),
    translateTo: z.string().max(10).optional(),
  }).optional(),
})

export const BulkImportSchema = z.object({
  urls: z.array(z.string().url().max(2048)).min(1).max(100),
  options: z.object({
    autoEnrichSeo: z.boolean().optional(),
    importReviews: z.boolean().optional(),
    importVideos: z.boolean().optional(),
    targetCategory: z.string().max(200).optional(),
    priceMultiplier: z.number().min(0.1).max(10).optional(),
  }).optional(),
})

export const AIOptimizeSchema = z.object({
  productId: z.string().uuid().optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(50000).optional(),
  category: z.string().max(200).optional(),
  targetMarket: z.string().max(100).optional(),
  language: z.string().max(10).optional().default('fr'),
  tone: z.enum(['professional', 'casual', 'luxury', 'friendly', 'technical']).optional().default('professional'),
})

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Array<{ path: string; message: string }>
}

export function validateProductImport(data: unknown): ValidationResult<z.infer<typeof ProductImportSchema>> {
  const result = ProductImportSchema.safeParse(data)
  
  if (result.success) {
    // Additional sanitization
    const sanitized = {
      ...result.data,
      title: result.data.title ? sanitizeString(result.data.title, 500) : undefined,
      description: result.data.description ? sanitizeHtml(result.data.description, 50000) : undefined,
    }
    return { success: true, data: sanitized }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }
}

export function validateReviewImport(data: unknown): ValidationResult<z.infer<typeof ReviewImportSchema>> {
  const result = ReviewImportSchema.safeParse(data)
  
  if (result.success) {
    // Sanitize review content
    const sanitized = {
      ...result.data,
      reviews: result.data.reviews.map(review => ({
        ...review,
        author: sanitizeString(review.author, 200),
        title: review.title ? sanitizeString(review.title, 500) : undefined,
        content: review.content ? sanitizeString(review.content, 10000) : undefined,
      })),
    }
    return { success: true, data: sanitized }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }
}

export function validateBulkImport(data: unknown): ValidationResult<z.infer<typeof BulkImportSchema>> {
  const result = BulkImportSchema.safeParse(data)
  
  if (result.success) {
    // Validate each URL
    const validUrls: string[] = []
    const invalidUrls: string[] = []
    
    for (const url of result.data.urls) {
      const urlResult = sanitizeUrl(url)
      if (urlResult.valid) {
        validUrls.push(urlResult.url)
      } else {
        invalidUrls.push(url)
      }
    }
    
    if (validUrls.length === 0) {
      return {
        success: false,
        errors: [{ path: 'urls', message: 'No valid URLs provided' }],
      }
    }
    
    return {
      success: true,
      data: {
        ...result.data,
        urls: validUrls,
      },
    }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }
}

export function validateAIOptimize(data: unknown): ValidationResult<z.infer<typeof AIOptimizeSchema>> {
  const result = AIOptimizeSchema.safeParse(data)
  
  if (result.success) {
    const sanitized = {
      ...result.data,
      title: result.data.title ? sanitizeString(result.data.title, 500) : undefined,
      description: result.data.description ? sanitizeHtml(result.data.description, 50000) : undefined,
    }
    return { success: true, data: sanitized }
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  }
}

// =============================================================================
// RATE LIMIT HELPERS
// =============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

export async function checkRateLimit(
  supabase: any,
  userId: string,
  action: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000)
  
  // Count requests in window
  const { count, error } = await supabase
    .from('gateway_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString())
  
  if (error) {
    // On error, allow request but log warning
    console.warn('Rate limit check failed:', error)
    return { allowed: true, remaining: config.maxRequests, resetAt: new Date(Date.now() + config.windowSeconds * 1000) }
  }
  
  const currentCount = count || 0
  const remaining = Math.max(0, config.maxRequests - currentCount)
  const allowed = remaining > 0
  
  return {
    allowed,
    remaining,
    resetAt: new Date(Date.now() + config.windowSeconds * 1000),
  }
}
