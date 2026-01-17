/**
 * Shared validation utilities for edge functions
 * Using Zod for runtime type safety
 */

// Note: We use a CDN version of Zod for Deno compatibility
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export { z };

// ============================================
// COMMON SCHEMAS
// ============================================

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const urlSchema = z
  .string()
  .trim()
  .url({ message: 'Invalid URL format' })
  .max(2048, { message: 'URL must be less than 2048 characters' });

export const stringSchema = (options: { min?: number; max?: number } = {}) =>
  z.string()
    .trim()
    .min(options.min ?? 0, { message: `Must be at least ${options.min ?? 0} characters` })
    .max(options.max ?? 10000, { message: `Must be at most ${options.max ?? 10000} characters` });

export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

// ============================================
// SUPPLIER SYNC SCHEMAS
// ============================================

export const supplierSyncInputSchema = z.object({
  connectorId: z.string().trim().min(1).max(100),
  jobType: z.enum(['products', 'inventory', 'orders']).default('products'),
  options: z.object({
    fullSync: z.boolean().optional(),
    category: z.string().max(100).optional(),
    limit: z.number().int().positive().max(1000).optional(),
    priority: z.number().int().min(1).max(10).optional()
  }).optional().default({})
});

export type SupplierSyncInput = z.infer<typeof supplierSyncInputSchema>;

// ============================================
// AI CONTENT GENERATOR SCHEMAS
// ============================================

export const aiContentInputSchema = z.object({
  // Legacy format fields
  type: z.enum(['product_description', 'blog_article', 'seo_content', 'ad_copy', 'email_marketing']).optional(),
  prompt: z.string().max(5000).optional(),
  keywords: z.array(z.string().max(100)).max(20).optional().default([]),
  language: z.enum(['fr', 'en', 'es', 'de', 'it']).optional().default('fr'),
  // New format fields
  action: z.enum(['generate', 'improve', 'expand', 'summarize', 'translate', 'ideas']).optional(),
  content: z.string().max(10000).optional(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'persuasive', 'informative', 'friendly']).optional().default('professional'),
  contentType: z.enum(['blog', 'description', 'social', 'email', 'seo']).optional()
});

export type AIContentInput = z.infer<typeof aiContentInputSchema>;

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
// VALIDATION HELPER
// ============================================

/**
 * Validate data against a schema
 * @param schema Zod schema
 * @param data Data to validate
 * @returns Validated data or throws error
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation error: ${message}`);
    }
    throw new Error('Validation failed');
  }
}

/**
 * Validate JSON body with size limit
 */
export async function validateJsonBody<T extends z.ZodType>(
  req: Request,
  schema: T,
  maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<z.infer<T>> {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new Error('Request body too large');
  }
  
  const body = await req.json();
  return validateInput(schema, body);
}
