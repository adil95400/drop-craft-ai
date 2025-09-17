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
      updates, 
      user_id, 
      trigger_automation = true, 
      create_movements = true 
    } = await req.json()

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates array is required and must not be empty')
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each update
    for (const update of updates) {
      try {
        const { product_id, new_stock, reason } = update

        // Get current product stock
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('name, stock_quantity')
          .eq('id', product_id)
          .eq('user_id', user_id)
          .single()

        if (productError || !product) {
          throw new Error(`Product ${product_id} not found`)
        }

        const previousStock = product.stock_quantity || 0

        // Update product stock
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: new_stock })
          .eq('id', product_id)
          .eq('user_id', user_id)

        if (updateError) {
          throw new Error(`Failed to update stock for product ${product_id}`)
        }

        // Create stock movement record if requested
        if (create_movements) {
          const movementType = new_stock > previousStock ? 'in' : 
                              new_stock < previousStock ? 'out' : 'adjustment'
          const quantity = Math.abs(new_stock - previousStock)

          await supabase
            .from('activity_logs')
            .insert({
              user_id,
              action: 'stock_movement',
              entity_type: 'product',
              entity_id: product_id,
              description: `Bulk stock update: ${movementType} ${quantity} units - ${reason}`,
              metadata: {
                movement_type: movementType,
                quantity,
                reason,
                previous_stock: previousStock,
                new_stock,
                product_name: product.name,
                bulk_update: true
              }
            })
        }

        // Check for low stock and trigger automation if needed
        if (trigger_automation && new_stock <= 10) {
          await supabase
            .from('activity_logs')
            .insert({
              user_id,
              action: 'stock_alert',
              entity_type: 'product',
              entity_id: product_id,
              description: `Low stock alert: ${new_stock} units remaining`,
              metadata: {
                current_stock: new_stock,
                minimum_threshold: 10,
                urgency: new_stock <= 3 ? 'critical' : new_stock <= 5 ? 'high' : 'medium',
                product_name: product.name,
                recommended_order_quantity: Math.max(50, new_stock * 5),
                triggered_by: 'bulk_update'
              }
            })
        }

        results.push({
          product_id,
          product_name: product.name,
          success: true,
          previous_stock: previousStock,
          new_stock,
          stock_alert_triggered: trigger_automation && new_stock <= 10
        })

        successCount++
      } catch (error) {
        results.push({
          product_id: update.product_id,
          success: false,
          error: error.message
        })
        errorCount++
      }
    }

    // Log the bulk update operation
    await supabase
      .from('activity_logs')
      .insert({
        user_id,
        action: 'bulk_stock_update',
        entity_type: 'system',
        entity_id: crypto.randomUUID(),
        description: `Bulk stock update completed: ${successCount} successful, ${errorCount} failed`,
        metadata: {
          total_updates: updates.length,
          successful_updates: successCount,
          failed_updates: errorCount,
          trigger_automation,
          create_movements
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bulk stock update completed',
        total_updates: updates.length,
        successful_updates: successCount,
        failed_updates: errorCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Bulk stock update error:', error)
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