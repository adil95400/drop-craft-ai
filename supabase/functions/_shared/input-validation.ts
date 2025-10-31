import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { ValidationError } from "./error-handler.ts";

/**
 * Validates input against a Zod schema and throws ValidationError if invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Common validation schemas for reuse across functions
 */

// UUID validation
export const uuidSchema = z.string().uuid();

// Email validation
export const emailSchema = z.string().email().max(255);

// URL validation
export const urlSchema = z.string().url().max(2048);

// Pagination params
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// Product ID
export const productIdSchema = z.object({
  productId: uuidSchema
});

// User input with length limits
export const sanitizedStringSchema = (maxLength: number = 1000) => 
  z.string()
    .trim()
    .max(maxLength)
    .refine(
      val => !/<script|javascript:|on\w+=/i.test(val),
      { message: 'Invalid characters detected' }
    );

// Price validation
export const priceSchema = z.number().nonnegative().max(1000000);

// Profit calculator request schema
export const profitCalculatorSchema = z.object({
  userId: uuidSchema,
  productId: uuidSchema,
  sellingPrice: priceSchema,
  costPrice: priceSchema,
  additionalCosts: z.object({
    shipping: priceSchema.optional(),
    marketing: priceSchema.optional(),
    platform_fees: priceSchema.optional(),
    packaging: priceSchema.optional(),
    other: priceSchema.optional()
  }).optional()
});

// Import request schema
export const importRequestSchema = z.object({
  userId: uuidSchema,
  source: z.enum(['xml', 'json', 'csv', 'ftp', 'url']),
  data: z.union([
    z.string().max(10485760), // 10MB max for string data
    z.object({}).passthrough() // Allow object data
  ]),
  options: z.object({
    overwrite: z.boolean().optional(),
    validateOnly: z.boolean().optional()
  }).optional()
});

// Competitor analysis schema
export const competitorAnalysisSchema = z.object({
  competitorName: sanitizedStringSchema(200).optional(),
  productId: uuidSchema.optional(),
  analysisType: z.enum(['price', 'features', 'market', 'comprehensive']).default('comprehensive')
});

// AI content generation schema
export const aiContentSchema = z.object({
  prompt: sanitizedStringSchema(2000),
  type: z.enum(['product_description', 'blog_article', 'ad_copy', 'seo_content']),
  language: z.string().length(2).default('fr'),
  keywords: z.array(sanitizedStringSchema(50)).max(10).optional(),
  tone: z.enum(['professional', 'casual', 'persuasive', 'informative']).optional()
});
