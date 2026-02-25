import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Validation schemas for API requests and forms
 * Using Zod for type-safe runtime validation
 */

// ============================================
// COMMON SCHEMAS
// ============================================

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

export const urlSchema = z
  .string()
  .trim()
  .url({ message: 'Invalid URL format' })
  .max(2048, { message: 'URL must be less than 2048 characters' });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  .optional();

// ============================================
// COMPETITIVE ANALYSIS SCHEMAS
// ============================================

export const competitiveAnalysisInputSchema = z.object({
  competitorName: z
    .string()
    .trim()
    .max(200, { message: 'Competitor name must be less than 200 characters' })
    .optional(),
  productId: uuidSchema.optional(),
  analysisType: z
    .enum(['competitive_positioning', 'price_analysis', 'market_gaps', 'full_analysis'])
    .default('competitive_positioning'),
});

export type CompetitiveAnalysisInput = z.infer<typeof competitiveAnalysisInputSchema>;

// ============================================
// COMPETITOR ANALYSIS SCHEMAS  
// ============================================

export const analyzeCompetitorInputSchema = z.object({
  url: urlSchema,
  userId: uuidSchema,
  competitorName: z
    .string()
    .trim()
    .min(1, { message: 'Competitor name is required' })
    .max(200, { message: 'Competitor name must be less than 200 characters' }),
});

export type AnalyzeCompetitorInput = z.infer<typeof analyzeCompetitorInputSchema>;

// ============================================
// IMPORT SCHEMAS
// ============================================

export const importJobSchema = z.object({
  source_type: z.enum(['csv', 'url', 'api', 'file']),
  source_url: urlSchema.optional(),
  file_name: z.string().trim().max(255).optional(),
  options: z.record(z.any()).optional(),
  scheduled_at: z.string().datetime().optional(),
});

export type ImportJobInput = z.infer<typeof importJobSchema>;

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Product name is required' })
    .max(500, { message: 'Product name must be less than 500 characters' }),
  description: z
    .string()
    .trim()
    .max(5000, { message: 'Description must be less than 5000 characters' })
    .optional(),
  price: z
    .number()
    .positive({ message: 'Price must be positive' })
    .max(1000000, { message: 'Price is too high' }),
  sku: z
    .string()
    .trim()
    .max(100, { message: 'SKU must be less than 100 characters' })
    .optional(),
  stock: z
    .number()
    .int({ message: 'Stock must be an integer' })
    .min(0, { message: 'Stock cannot be negative' })
    .optional(),
  category: z
    .string()
    .trim()
    .max(100, { message: 'Category must be less than 100 characters' })
    .optional(),
  images: z.array(urlSchema).max(10, { message: 'Maximum 10 images allowed' }).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(200, { message: 'Name must be less than 200 characters' }),
  email: emailSchema,
  phone: phoneSchema,
  company: z
    .string()
    .trim()
    .max(200, { message: 'Company name must be less than 200 characters' })
    .optional(),
  address: z
    .object({
      street: z.string().trim().max(200).optional(),
      city: z.string().trim().max(100).optional(),
      postal_code: z.string().trim().max(20).optional(),
      country: z.string().trim().max(100).optional(),
    })
    .optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

// ============================================
// CONTACT FORM SCHEMA
// ============================================

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: emailSchema,
  subject: z
    .string()
    .trim()
    .min(1, { message: 'Subject is required' })
    .max(200, { message: 'Subject must be less than 200 characters' }),
  message: z
    .string()
    .trim()
    .min(10, { message: 'Message must be at least 10 characters' })
    .max(2000, { message: 'Message must be less than 2000 characters' }),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

// ============================================
// HELPER FUNCTIONS
// ============================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError['errors'] };

/**
 * Validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Use 'in' check for TypeScript narrowing
  if ('error' in result) {
    return { success: false, errors: result.error.errors };
  }
  
  return { success: false, errors: [] };
}

/**
 * Validate data against a schema and return typed result (legacy)
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const parsedData = schema.parse(data);
    return { success: true, data: parsedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Get first error message for a field
 */
export function getFieldError(
  errors: z.ZodError['errors'],
  field: string
): string | undefined {
  const error = errors.find(e => e.path.join('.') === field);
  return error?.message;
}

/**
 * Convert Zod errors to a simple object
 */
export function errorsToObject(errors: z.ZodError['errors']): Record<string, string> {
  const result: Record<string, string> = {};
  for (const error of errors) {
    const key = error.path.join('.');
    if (!result[key]) {
      result[key] = error.message;
    }
  }
  return result;
}

/**
 * Sanitize string input to prevent XSS (basic)
 */
export function sanitizeString(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Sanitize HTML — allow safe formatting tags only
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
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

/**
 * Check for potential XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ];
  return xssPatterns.some(pattern => pattern.test(input));
}
