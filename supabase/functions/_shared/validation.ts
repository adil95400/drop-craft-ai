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
