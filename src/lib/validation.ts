import { z } from 'zod';

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

/**
 * Validate data against a schema and return typed result
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
 * Sanitize string input to prevent XSS
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize URL
 * @param url URL to validate
 * @returns Validated URL or null if invalid
 */
export function validateUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
