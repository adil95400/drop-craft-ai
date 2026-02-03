/**
 * Import Product Handler
 * Handles IMPORT_PRODUCT and IMPORT_BULK actions
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// SCHEMAS
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
    case 'IMPORT_BULK':
      return handleImportBulk(payload, ctx)
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
