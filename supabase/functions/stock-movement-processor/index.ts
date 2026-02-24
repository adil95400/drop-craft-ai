import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { 
      product_id, 
      movement_type, 
      quantity, 
      reason, 
      trigger_automation,
    } = await req.json()

    if (!product_id || !movement_type || quantity == null) {
      return errorResponse('product_id, movement_type and quantity are required', corsHeaders)
    }

    // Get current product stock (RLS-scoped)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name, stock_quantity')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return errorResponse('Product not found or access denied', corsHeaders, 404)
    }

    let currentStock = product.stock_quantity || 0
    let newStock = currentStock

    switch (movement_type) {
      case 'in':
        newStock = currentStock + quantity
        break
      case 'out':
        newStock = Math.max(0, currentStock - quantity)
        break
      case 'adjustment':
        newStock = quantity
        break
      case 'reserved':
        break
      case 'returned':
        newStock = currentStock + quantity
        break
      default:
        return errorResponse('Invalid movement_type', corsHeaders)
    }

    // Update product stock if needed (RLS-scoped)
    if (movement_type !== 'reserved') {
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product_id)

      if (updateError) {
        return errorResponse('Failed to update stock: ' + updateError.message, corsHeaders, 500)
      }
    }

    // Log the stock movement (RLS-scoped)
    const { data: movement, error: movementError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'stock_movement',
        entity_type: 'product',
        entity_id: product_id,
        description: `Stock ${movement_type}: ${quantity} units - ${reason || 'N/A'}`,
        details: {
          movement_type,
          quantity,
          reason,
          previous_stock: currentStock,
          new_stock: newStock,
          product_name: product.name
        }
      })
      .select()
      .single()

    if (movementError) {
      console.error('Failed to log movement:', movementError.message)
    }

    // Check low stock alert
    if (trigger_automation && newStock <= 10) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'stock_alert',
          entity_type: 'product',
          entity_id: product_id,
          description: `Low stock alert: ${newStock} units remaining`,
          details: {
            current_stock: newStock,
            minimum_threshold: 10,
            urgency: newStock <= 3 ? 'critical' : 'high',
            product_name: product.name,
            recommended_order_quantity: Math.max(50, newStock * 5)
          }
        })
    }

    return successResponse({
      message: 'Stock movement processed successfully',
      movement_id: movement?.id,
      previous_stock: currentStock,
      new_stock: newStock,
      stock_alert_triggered: trigger_automation && newStock <= 10
    }, corsHeaders)

  } catch (error) {
    if (error instanceof Response) return error
    console.error('Stock movement processing error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
