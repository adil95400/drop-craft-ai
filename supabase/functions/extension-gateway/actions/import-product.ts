/**
 * Import Product Handler v3.1
 * Handles all import-related actions with Backend-First architecture
 * 
 * Actions:
 * - IMPORT_PRODUCT (legacy)
 * - IMPORT_PRODUCT_BACKEND (v3.0 - API → Headless → HTML cascade)
 * - IMPORT_BULK / IMPORT_BULK_BACKEND
 * - IMPORT_REVIEWS (with idempotency)
 * - UPSERT_PRODUCT (with idempotency)
 * - PUBLISH_TO_STORE (with idempotency)
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { handleImportOrchestrator } from './import-orchestrator.ts'

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
// IMPORT REVIEWS (with idempotency)
// =============================================================================

const ImportReviewsPayload = z.object({
  product_id: z.string().uuid(),
  source_url: z.string().url(),
  reviews: z.array(z.object({
    author: z.string().max(200),
    rating: z.number().min(0).max(5),
    content: z.string().max(5000),
    date: z.string().optional(),
    helpful_count: z.number().optional(),
    images: z.array(z.string().url()).max(10).optional(),
  })).max(100),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
})

async function handleImportReviews(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = ImportReviewsPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid reviews payload', details: { issues: parsed.error.issues } }
    }
  }

  const { product_id, source_url, reviews } = parsed.data

  try {
    // Verify product ownership
    const { data: product } = await ctx.supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('user_id', ctx.userId)
      .single()

    if (!product) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found or not owned by user' } }
    }

    // Upsert reviews
    const reviewsToInsert = reviews.map((r, idx) => ({
      product_id,
      user_id: ctx.userId,
      author: r.author,
      rating: r.rating,
      content: r.content,
      review_date: r.date,
      helpful_count: r.helpful_count || 0,
      images: r.images || [],
      source_url,
      external_id: `${product_id}-review-${idx}`,
    }))

    const { data, error } = await ctx.supabase
      .from('product_reviews')
      .upsert(reviewsToInsert, { onConflict: 'external_id' })
      .select('id')

    if (error) throw error

    // Update product reviews count
    await ctx.supabase
      .from('products')
      .update({ 
        reviews_count: reviews.length,
        rating: reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id)

    return {
      success: true,
      data: { imported_count: data?.length || 0, product_id }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

// =============================================================================
// UPSERT PRODUCT (with idempotency)
// =============================================================================

const UpsertProductPayload = z.object({
  product: z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(500),
    description: z.string().max(10000).optional(),
    price: z.number().min(0),
    cost_price: z.number().min(0).optional(),
    currency: z.string().max(3).optional().default('EUR'),
    sku: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    brand: z.string().max(100).optional(),
    images: z.array(z.string().url()).max(20).optional(),
    source_url: z.string().url().optional(),
    platform: z.string().max(50).optional(),
    variants: z.array(z.record(z.unknown())).max(100).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
  }),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
})

async function handleUpsertProduct(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = UpsertProductPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid product payload', details: { issues: parsed.error.issues } }
    }
  }

  const { product } = parsed.data

  try {
    if (product.id) {
      // Update existing - verify ownership
      const { data: existing } = await ctx.supabase
        .from('products')
        .select('id')
        .eq('id', product.id)
        .eq('user_id', ctx.userId)
        .single()

      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found or not owned by user' } }
      }

      const { data, error } = await ctx.supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          currency: product.currency,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          images: product.images || [],
          source_url: product.source_url,
          platform: product.platform,
          variants: product.variants || [],
          status: product.status || 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: { action: 'updated', product: data } }
    } else {
      // Create new
      const { data, error } = await ctx.supabase
        .from('products')
        .insert({
          user_id: ctx.userId,
          name: product.name,
          description: product.description,
          price: product.price,
          cost_price: product.cost_price,
          currency: product.currency,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          images: product.images || [],
          source_url: product.source_url,
          platform: product.platform,
          variants: product.variants || [],
          status: product.status || 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, data: { action: 'created', product: data } }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
  }
}

// =============================================================================
// PUBLISH TO STORE (with idempotency)
// =============================================================================

const PublishToStorePayload = z.object({
  product_id: z.string().uuid(),
  store_id: z.string().uuid(),
  store_type: z.enum(['shopify', 'woocommerce', 'prestashop', 'ebay', 'amazon']),
  publish_options: z.object({
    set_active: z.boolean().optional().default(true),
    update_inventory: z.boolean().optional().default(true),
    include_variants: z.boolean().optional().default(true),
  }).optional().default({}),
  request_id: z.string().uuid(),
  idempotency_key: z.string().min(10).max(100),
})

async function handlePublishToStore(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = PublishToStorePayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Invalid publish payload', details: { issues: parsed.error.issues } }
    }
  }

  const { product_id, store_id, store_type, publish_options } = parsed.data

  try {
    // Verify product ownership
    const { data: product } = await ctx.supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('user_id', ctx.userId)
      .single()

    if (!product) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } }
    }

    // Verify store ownership
    const { data: store } = await ctx.supabase
      .from('store_integrations')
      .select('id, platform, credentials_encrypted')
      .eq('id', store_id)
      .eq('user_id', ctx.userId)
      .single()

    if (!store) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Store not found' } }
    }

    // Create publish job (async processing)
    const { data: job, error: jobError } = await ctx.supabase
      .from('background_jobs')
      .insert({
        user_id: ctx.userId,
        job_type: 'publish_to_store',
        job_subtype: store_type,
        name: `Publish "${product.name}" to ${store_type}`,
        status: 'pending',
        input_data: {
          product_id,
          store_id,
          store_type,
          publish_options,
        },
        metadata: { extension_version: ctx.extensionVersion },
      })
      .select('id')
      .single()

    if (jobError) throw jobError

    // Update product status
    await ctx.supabase
      .from('products')
      .update({ 
        status: publish_options.set_active ? 'active' : 'draft',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id)

    return {
      success: true,
      data: {
        job_id: job.id,
        product_id,
        store_id,
        store_type,
        status: 'queued',
        message: 'Product publish job created. Check job status for progress.'
      }
    }
  } catch (error) {
    return { success: false, error: { code: 'HANDLER_ERROR', message: error.message } }
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
    // Legacy import (extension sends product data)
    case 'IMPORT_PRODUCT':
      return handleImportProduct(payload, ctx)
    
    // Backend-first import (extension sends URL only)
    case 'IMPORT_PRODUCT_BACKEND':
      return handleImportOrchestrator(payload, ctx)
    
    // Bulk imports
    case 'IMPORT_BULK':
      return handleImportBulk(payload, ctx)
    case 'IMPORT_BULK_BACKEND':
      return handleBulkBackendImport(payload, ctx)
    
    // Idempotent write actions
    case 'IMPORT_REVIEWS':
      return handleImportReviews(payload, ctx)
    case 'UPSERT_PRODUCT':
      return handleUpsertProduct(payload, ctx)
    case 'PUBLISH_TO_STORE':
      return handlePublishToStore(payload, ctx)
    
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
