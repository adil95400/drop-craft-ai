import DOMPurify from 'dompurify'
import { z } from 'zod'

/**
 * Input sanitization utilities using DOMPurify
 * CRITICAL SECURITY: All user inputs must be sanitized before storage or display
 */

// Configure DOMPurify with strict settings
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

/**
 * Sanitize HTML content - removes dangerous tags and scripts
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, purifyConfig)
}

/**
 * Sanitize plain text - removes HTML tags completely
 */
export const sanitizeText = (text: string): string => {
  if (!text) return ''
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize URL - ensures URL is safe
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return ''
  
  try {
    const parsed = new URL(url)
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return url
  } catch {
    return ''
  }
}

/**
 * Sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return ''
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const cleaned = email.trim().toLowerCase()
  
  return emailRegex.test(cleaned) ? cleaned : ''
}

/**
 * Sanitize phone number - removes non-numeric characters except +
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return ''
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Sanitize SKU - alphanumeric and hyphens only
 */
export const sanitizeSku = (sku: string): string => {
  if (!sku) return ''
  return sku.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
}

/**
 * Sanitize price/number - ensures valid number
 */
export const sanitizeNumber = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? 0 : Math.max(0, num)
}

/**
 * Sanitize product data object
 */
export const sanitizeProductData = (data: any) => {
  return {
    name: sanitizeText(data.name),
    description: sanitizeHtml(data.description),
    short_description: sanitizeText(data.short_description),
    sku: sanitizeSku(data.sku),
    price: sanitizeNumber(data.price),
    cost_price: sanitizeNumber(data.cost_price),
    category: sanitizeText(data.category),
    brand: sanitizeText(data.brand),
    image_url: data.image_url ? sanitizeUrl(data.image_url) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(sanitizeText).filter(Boolean) : [],
    status: ['draft', 'active', 'archived'].includes(data.status) ? data.status : 'draft'
  }
}

/**
 * Sanitize customer data object
 */
export const sanitizeCustomerData = (data: any) => {
  return {
    name: sanitizeText(data.name),
    email: sanitizeEmail(data.email),
    phone: sanitizePhone(data.phone),
    company: data.company ? sanitizeText(data.company) : null,
    notes: data.notes ? sanitizeHtml(data.notes) : null,
    address: data.address ? {
      street: sanitizeText(data.address.street),
      city: sanitizeText(data.address.city),
      postal_code: sanitizeText(data.address.postal_code),
      country: sanitizeText(data.address.country)
    } : null
  }
}

/**
 * Sanitize order data object
 */
export const sanitizeOrderData = (data: any) => {
  return {
    order_number: sanitizeText(data.order_number),
    notes: data.notes ? sanitizeHtml(data.notes) : null,
    total_amount: sanitizeNumber(data.total_amount),
    status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(data.status) 
      ? data.status 
      : 'pending'
  }
}

/**
 * Validate and sanitize CSV import data
 */
export const sanitizeCsvRow = (row: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'string') {
      // Remove potential XSS vectors from CSV data
      sanitized[key] = sanitizeText(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Zod schema with sanitization for product form
 */
export const productFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200).transform(sanitizeText),
  description: z.string().optional().transform(val => val ? sanitizeHtml(val) : ''),
  sku: z.string().min(1, 'Le SKU est requis').max(100).transform(sanitizeSku),
  price: z.number().min(0, 'Le prix doit être positif'),
  cost_price: z.number().min(0).optional(),
  category: z.string().optional().transform(val => val ? sanitizeText(val) : ''),
  brand: z.string().optional().transform(val => val ? sanitizeText(val) : ''),
  image_url: z.string().url().optional().transform(val => val ? sanitizeUrl(val) : undefined),
  tags: z.array(z.string()).optional().transform(val => val ? val.map(sanitizeText).filter(Boolean) : [])
})

/**
 * Zod schema with sanitization for customer form
 */
export const customerFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200).transform(sanitizeText),
  email: z.string().email('Email invalide').transform(sanitizeEmail),
  phone: z.string().optional().transform(val => val ? sanitizePhone(val) : ''),
  company: z.string().optional().transform(val => val ? sanitizeText(val) : ''),
  notes: z.string().optional().transform(val => val ? sanitizeHtml(val) : '')
})
