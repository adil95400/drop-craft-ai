/**
 * Import Product Handler
 * Handles IMPORT_PRODUCT, IMPORT_PRODUCT_BACKEND, IMPORT_BULK, and IMPORT_BULK_BACKEND actions
 * 
 * v3.0: Backend-First Architecture
 * - Extension sends only URL + metadata
 * - Backend extracts via API → Firecrawl → HTML fallback
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { handleBackendImport } from './import-backend.ts'

// =============================================================================
// SCHEMAS (Legacy - for backward compatibility)
// =============================================================================

const ProductSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  description: z.string().max(10000).optional(),
  price: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  currency: z.string().max(3).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(20).optional(),
  platform: z.string().max(50).optional(),
  variants: z.array(z.record(z.unknown())).max(100).optional(),
})

const ImportProductPayload = z.object({
  product: ProductSchema,
})

const ImportBulkPayload = z.object({
  products: z.array(ProductSchema).min(1).max(50),
})

// Backend-first payload schema
const BackendImportPayload = z.object({
  source_url: z.string().url().max(2000),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'banggood', 'dhgate', 'other']).optional(),
  shop_id: z.string().uuid().optional(),
  options: z.object({
    include_reviews: z.boolean().optional().default(false),
    include_video: z.boolean().optional().default(false),
    include_variants: z.boolean().optional().default(true),
    include_shipping: z.boolean().optional().default(true),
    preferred_currency: z.string().length(3).optional().default('EUR'),
    target_language: z.string().length(2).optional().default('fr'),
    auto_translate: z.boolean().optional().default(false),
  }).optional().default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
  timestamp: z.number().int().positive(),
})

// =============================================================================
// HANDLERS
// =============================================================================

export async function handleImportProduct(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  // Validate payload
  const parsed = ImportProductPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid product data',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { product } = parsed.data

  try {
    // Check if product already exists for this user (by URL)
    const { data: existing } = await ctx.supabase
      .from('products')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('source_url', product.url)
      .maybeSingle()

    if (existing) {
      // Update existing product
      const { data, error } = await ctx.supabase
        .from('products')
        .update({
          title: product.title,
          description: product.description,
          price: product.price,
          cost_price: product.costPrice,
          currency: product.currency || 'EUR',
          sku: product.sku,
          category: product.category,
          images: product.images || [],
          platform: product.platform,
          variants: product.variants || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          action: 'updated',
          product: data,
        }
      }
    }

    // Create new product
    const { data, error } = await ctx.supabase
      .from('products')
      .insert({
        user_id: ctx.userId,
        title: product.title,
        description: product.description,
        price: product.price,
        cost_price: product.costPrice,
        currency: product.currency || 'EUR',
        sku: product.sku,
        category: product.category,
        images: product.images || [],
        source_url: product.url,
        platform: product.platform,
        variants: product.variants || [],
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    // Log the action
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'IMPORT_PRODUCT',
      action_status: 'success',
      platform: product.platform,
      product_title: product.title?.substring(0, 200),
      product_url: product.url,
      product_id: data.id,
      metadata: {
        variantsCount: product.variants?.length || 0,
        imagesCount: product.images?.length || 0,
      },
      extension_version: ctx.extensionVersion,
    }).catch(e => console.error('[Import] Log action error:', e))

    return {
      success: true,
      data: {
        action: 'created',
        product: data,
      }
    }
  } catch (error) {
    console.error('[Import] Error:', error)
    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Import failed',
      }
    }
  }
}

export async function handleImportBulk(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  // Validate payload
  const parsed = ImportBulkPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid bulk import data',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { products } = parsed.data
  const results: { success: number; failed: number; products: any[] } = {
    success: 0,
    failed: 0,
    products: []
  }

  for (const product of products) {
    try {
      const result = await handleImportProduct({ product }, ctx)
      if (result.success) {
        results.success++
        results.products.push(result.data?.product)
      } else {
        results.failed++
      }
    } catch {
      results.failed++
    }
  }

  // Log bulk action
  await ctx.supabase.from('extension_action_logs').insert({
    user_id: ctx.userId,
    action_type: 'IMPORT_BULK',
    action_status: results.failed === 0 ? 'success' : (results.success > 0 ? 'partial' : 'error'),
    metadata: {
      totalProducts: products.length,
      successCount: results.success,
      errorCount: results.failed,
      platforms: [...new Set(products.map(p => p.platform).filter(Boolean))],
    },
    extension_version: ctx.extensionVersion,
  }).catch(e => console.error('[Import] Log bulk action error:', e))

  return {
    success: true,
    data: results
  }
}

// =============================================================================
// BULK BACKEND IMPORT
// =============================================================================

const BulkBackendImportPayload = z.object({
  urls: z.array(z.string().url().max(2000)).min(1).max(20),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'banggood', 'dhgate', 'other']).optional(),
  shop_id: z.string().uuid().optional(),
  options: z.object({
    include_reviews: z.boolean().optional().default(false),
    include_video: z.boolean().optional().default(false),
    include_variants: z.boolean().optional().default(true),
  }).optional().default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
  timestamp: z.number().int().positive(),
})

export async function handleBulkBackendImport(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = BulkBackendImportPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid bulk import payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { urls, options, request_id, idempotency_key, timestamp } = parsed.data

  // Create master job for tracking
  const { data: masterJob } = await ctx.supabase
    .from('background_jobs')
    .insert({
      user_id: ctx.userId,
      job_type: 'bulk_product_import',
      name: `Bulk import (${urls.length} URLs)`,
      status: 'processing',
      input_data: { urls, options },
      items_total: urls.length,
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0,
      progress_percent: 0,
      progress_message: 'Starting bulk import...',
      metadata: { idempotency_key, extension_version: ctx.extensionVersion },
    })
    .select('id')
    .single()

  const jobId = masterJob?.id

  const results = {
    job_id: jobId,
    total: urls.length,
    succeeded: 0,
    failed: 0,
    products: [] as any[],
    errors: [] as any[],
  }

  // Process each URL
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    
    try {
      // Update progress
      if (jobId) {
        await ctx.supabase.from('background_jobs').update({
          items_processed: i + 1,
          progress_percent: Math.round(((i + 1) / urls.length) * 100),
          progress_message: `Importing ${i + 1}/${urls.length}...`,
        }).eq('id', jobId)
      }

      // Import single product
      const result = await handleBackendImport({
        source_url: url,
        platform: parsed.data.platform,
        shop_id: parsed.data.shop_id,
        options,
        request_id: `${request_id}-${i}`,
        idempotency_key: `${idempotency_key}-${i}`,
        timestamp,
      }, ctx)

      if (result.success) {
        results.succeeded++
        results.products.push(result.data?.product)
        
        if (jobId) {
          await ctx.supabase.from('background_jobs').update({
            items_succeeded: results.succeeded,
          }).eq('id', jobId)
        }
      } else {
        results.failed++
        results.errors.push({ url, error: result.error })
        
        if (jobId) {
          await ctx.supabase.from('background_jobs').update({
            items_failed: results.failed,
          }).eq('id', jobId)
        }
      }
    } catch (error) {
      results.failed++
      results.errors.push({ url, error: { code: 'HANDLER_ERROR', message: error.message } })
    }
  }

  // Complete master job
  if (jobId) {
    await ctx.supabase.from('background_jobs').update({
      status: results.failed === urls.length ? 'failed' : 'completed',
      progress_percent: 100,
      progress_message: `Completed: ${results.succeeded} succeeded, ${results.failed} failed`,
      output_data: { products: results.products.map(p => p?.id) },
      completed_at: new Date().toISOString(),
    }).eq('id', jobId)
  }

  return {
    success: true,
    data: results
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleImportAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'IMPORT_PRODUCT':
      return handleImportProduct(payload, ctx)
    case 'IMPORT_PRODUCT_BACKEND':
      return handleBackendImport(payload, ctx)
    case 'IMPORT_BULK':
      return handleImportBulk(payload, ctx)
    case 'IMPORT_BULK_BACKEND':
      return handleBulkBackendImport(payload, ctx)
    default:
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ACTION',
          message: `Unknown import action: ${action}`
        }
      }
  }
}
