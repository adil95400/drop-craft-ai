/**
 * Sync Handler
 * Handles SYNC_STOCK and SYNC_PRICE actions
 */

import { z } from 'https://esm.sh/zod@3.22.4'
import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const SyncStockPayload = z.object({
  productId: z.string().uuid().optional(),
  products: z.array(z.object({
    id: z.string().uuid(),
    stock: z.number().int().min(0),
    sku: z.string().optional(),
  })).optional(),
})

const SyncPricePayload = z.object({
  productId: z.string().uuid().optional(),
  products: z.array(z.object({
    id: z.string().uuid(),
    price: z.number().min(0),
    costPrice: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
  })).optional(),
})

// =============================================================================
// HANDLERS
// =============================================================================

async function handleSyncStock(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = SyncStockPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid sync stock payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const products = parsed.data.products || []
  const results: { success: number; failed: number } = { success: 0, failed: 0 }

  try {
    for (const product of products) {
      const { error } = await ctx.supabase
        .from('products')
        .update({
          stock_quantity: product.stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('user_id', ctx.userId)

      if (error) {
        results.failed++
      } else {
        results.success++
      }
    }

    // Log action
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'SYNC_STOCK',
      action_status: results.failed === 0 ? 'success' : 'partial',
      metadata: {
        syncType: 'stock',
        productCount: products.length,
        successCount: results.success,
        failedCount: results.failed,
      },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: results
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleSyncPrice(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = SyncPricePayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid sync price payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const products = parsed.data.products || []
  const results: { success: number; failed: number } = { success: 0, failed: 0 }

  try {
    for (const product of products) {
      const updateData: Record<string, any> = {
        price: product.price,
        updated_at: new Date().toISOString(),
      }
      
      if (product.costPrice !== undefined) {
        updateData.cost_price = product.costPrice
      }
      
      if (product.compareAtPrice !== undefined) {
        updateData.compare_at_price = product.compareAtPrice
      }

      const { error } = await ctx.supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .eq('user_id', ctx.userId)

      if (error) {
        results.failed++
      } else {
        results.success++
      }
    }

    // Log action
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'SYNC_PRICE',
      action_status: results.failed === 0 ? 'success' : 'partial',
      metadata: {
        syncType: 'price',
        productCount: products.length,
        successCount: results.success,
        failedCount: results.failed,
      },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    return {
      success: true,
      data: results
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleSyncAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'SYNC_STOCK':
      return handleSyncStock(payload, ctx)
    case 'SYNC_PRICE':
      return handleSyncPrice(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown sync action: ${action}` }
      }
  }
}
