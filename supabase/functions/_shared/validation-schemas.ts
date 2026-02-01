/**
 * P3: Centralized Validation Schemas
 * Zod schemas for all API inputs - single source of truth
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// ===========================================
// COMMON PRIMITIVES
// ===========================================

export const uuid = z.string().uuid('Invalid UUID format');
export const email = z.string().email('Invalid email format').max(255).toLowerCase().trim();
export const url = z.string().url('Invalid URL format').max(2048);
export const safeString = z.string().trim().max(10000);
export const shortString = z.string().trim().min(1).max(255);
export const longText = z.string().trim().max(50000);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  { message: 'startDate must be before endDate' }
);

// ===========================================
// PRODUCT SCHEMAS
// ===========================================

export const productIdSchema = z.object({
  productId: uuid,
});

export const productCreateSchema = z.object({
  title: shortString.min(3, 'Title must be at least 3 characters'),
  description: longText.optional(),
  price: z.number().min(0).max(1000000),
  compareAtPrice: z.number().min(0).max(1000000).optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  quantity: z.number().int().min(0).max(999999).default(0),
  category: shortString.optional(),
  tags: z.array(shortString).max(50).optional(),
  images: z.array(url).max(20).optional(),
  variants: z.array(z.object({
    title: shortString,
    price: z.number().min(0),
    sku: z.string().max(100).optional(),
    quantity: z.number().int().min(0).default(0),
    options: z.record(z.string()).optional(),
  })).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  productId: uuid,
});

export const productBulkSchema = z.object({
  products: z.array(productCreateSchema).min(1).max(500),
  options: z.object({
    skipDuplicates: z.boolean().default(false),
    updateExisting: z.boolean().default(false),
    dryRun: z.boolean().default(false),
  }).optional(),
});

export const productSearchSchema = z.object({
  query: z.string().trim().max(500).optional(),
  category: shortString.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['title', 'price', 'created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).merge(paginationSchema);

// ===========================================
// IMPORT SCHEMAS
// ===========================================

export const importSourceSchema = z.enum([
  'aliexpress',
  'alibaba', 
  'amazon',
  'shopify',
  'woocommerce',
  'csv',
  'api',
  'manual'
]);

export const importRequestSchema = z.object({
  sourceUrl: url.optional(),
  sourceType: importSourceSchema,
  productData: z.unknown().optional(),
  options: z.object({
    importImages: z.boolean().default(true),
    importVariants: z.boolean().default(true),
    importReviews: z.boolean().default(false),
    optimizeContent: z.boolean().default(false),
    targetStoreId: uuid.optional(),
  }).optional(),
});

export const bulkImportRequestSchema = z.object({
  imports: z.array(importRequestSchema).min(1).max(100),
  batchName: shortString.optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// ===========================================
// ORDER SCHEMAS
// ===========================================

export const addressSchema = z.object({
  firstName: shortString,
  lastName: shortString,
  company: shortString.optional(),
  address1: shortString,
  address2: shortString.optional(),
  city: shortString,
  state: shortString.optional(),
  postalCode: z.string().max(20),
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code'),
  phone: z.string().max(30).optional(),
});

export const orderItemSchema = z.object({
  productId: uuid,
  variantId: uuid.optional(),
  quantity: z.number().int().min(1).max(9999),
  price: z.number().min(0),
});

export const orderCreateSchema = z.object({
  customerId: uuid.optional(),
  customerEmail: email,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  items: z.array(orderItemSchema).min(1).max(500),
  notes: longText.optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ===========================================
// AI CONTENT SCHEMAS
// ===========================================

export const aiContentTypeSchema = z.enum([
  'title',
  'description',
  'seo_title',
  'seo_description',
  'ad_copy',
  'email',
  'social_post'
]);

export const aiGenerateSchema = z.object({
  productId: uuid.optional(),
  contentType: aiContentTypeSchema,
  context: z.object({
    productTitle: shortString.optional(),
    productDescription: longText.optional(),
    targetAudience: shortString.optional(),
    tone: z.enum(['professional', 'casual', 'luxury', 'friendly', 'urgent']).optional(),
    keywords: z.array(shortString).max(20).optional(),
  }).optional(),
  language: z.string().length(2).default('fr'),
  maxLength: z.number().int().min(10).max(5000).optional(),
});

// ===========================================
// INTEGRATION SCHEMAS
// ===========================================

export const integrationTypeSchema = z.enum([
  'shopify',
  'woocommerce',
  'amazon',
  'ebay',
  'etsy',
  'prestashop',
  'magento'
]);

export const integrationConnectSchema = z.object({
  type: integrationTypeSchema,
  credentials: z.object({
    apiKey: z.string().max(500).optional(),
    apiSecret: z.string().max(500).optional(),
    accessToken: z.string().max(2000).optional(),
    shopUrl: url.optional(),
    storeId: z.string().max(100).optional(),
  }),
  settings: z.record(z.unknown()).optional(),
});

export const syncRequestSchema = z.object({
  integrationId: uuid,
  syncType: z.enum(['full', 'incremental', 'products', 'orders', 'inventory']),
  options: z.object({
    since: z.string().datetime().optional(),
    productIds: z.array(uuid).max(1000).optional(),
    forceUpdate: z.boolean().default(false),
  }).optional(),
});

// ===========================================
// WEBHOOK SCHEMAS
// ===========================================

export const webhookPayloadSchema = z.object({
  event: z.string().max(100),
  timestamp: z.string().datetime().optional(),
  data: z.unknown(),
  signature: z.string().max(500).optional(),
});

// ===========================================
// EXTENSION SCHEMAS
// ===========================================

export const extensionAuthSchema = z.object({
  token: z.string().min(20).max(500),
  deviceId: z.string().max(100).optional(),
  version: z.string().max(20).optional(),
});

export const extensionActionSchema = z.object({
  action: z.enum([
    'import_product',
    'get_product_info', 
    'check_price',
    'sync_inventory',
    'get_settings'
  ]),
  payload: z.unknown(),
});

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError['errors'] };

/**
 * Validate data against a schema with detailed error messages
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.errors };
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: z.ZodError['errors']): object {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Input validation failed',
    details: errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

/**
 * Parse and validate request body
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: object; status: number }> {
  try {
    const body = await request.json();
    const result = validateSchema(schema, body);
    
    if (!result.success) {
      return {
        error: formatValidationErrors(result.errors),
        status: 400,
      };
    }
    
    return { data: result.data };
  } catch {
    return {
      error: {
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON',
      },
      status: 400,
    };
  }
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): { data: T } | { error: object; status: number } {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  const result = validateSchema(schema, params);
  
  if (!result.success) {
    return {
      error: formatValidationErrors(result.errors),
      status: 400,
    };
  }
  
  return { data: result.data };
}
