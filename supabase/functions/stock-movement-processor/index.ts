import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      product_id, 
      movement_type, 
      quantity, 
      reason, 
      user_id,
      trigger_automation,
      update_reorder_points
    } = await req.json()

    // Get current product stock
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('name, stock_quantity')
      .eq('id', product_id)
      .eq('user_id', user_id)
      .single()

    let currentStock = products?.stock_quantity || 0
    let newStock = currentStock

    // Calculate new stock based on movement type
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
        // Reserved stock doesn't change actual quantity but tracks reservations
        break
      case 'returned':
        newStock = currentStock + quantity
        break
    }

    // Update product stock if needed
    if (movement_type !== 'reserved') {
      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product_id)
        .eq('user_id', user_id)
    }

    // Log the stock movement
    const { data: movement, error: movementError } = await supabase
      .from('activity_logs')
      .insert({
        user_id,
        action: 'stock_movement',
        entity_type: 'product',
        entity_id: product_id,
        description: `Stock ${movement_type}: ${quantity} units - ${reason}`,
        metadata: {
          movement_type,
          quantity,
          reason,
          previous_stock: currentStock,
          new_stock: newStock,
          product_name: products?.name
        }
      })
      .select()
      .single()

    // Check if stock is low and trigger automation if needed
    if (trigger_automation && newStock <= 10) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id,
          action: 'stock_alert',
          entity_type: 'product',
          entity_id: product_id,
          description: `Low stock alert: ${newStock} units remaining`,
          metadata: {
            current_stock: newStock,
            minimum_threshold: 10,
            urgency: newStock <= 3 ? 'critical' : 'high',
            product_name: products?.name,
            recommended_order_quantity: Math.max(50, newStock * 5)
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stock movement processed successfully',
        movement_id: movement.id,
        previous_stock: currentStock,
        new_stock: newStock,
        stock_alert_triggered: trigger_automation && newStock <= 10
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stock movement processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})