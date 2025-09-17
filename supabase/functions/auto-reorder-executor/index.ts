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
      user_id, 
      force_reorder, 
      use_backup_suppliers, 
      notify_user 
    } = await req.json()

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('user_id', user_id)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Get auto-reorder rules for this product
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', user_id)
      .eq('rule_type', 'stock_management')
      .eq('is_active', true)

    const applicableRule = rules?.find(rule => {
      const conditions = rule.trigger_conditions as any
      return conditions.product_id === product_id
    })

    if (!applicableRule && !force_reorder) {
      throw new Error('No auto-reorder rule found for this product')
    }

    const ruleConditions = applicableRule?.trigger_conditions as any
    const reorderQuantity = ruleConditions?.reorder_quantity || Math.max(50, product.stock_quantity * 3)
    const preferredSupplierId = ruleConditions?.preferred_supplier_id

    // Get preferred supplier
    let selectedSupplier = null
    if (preferredSupplierId) {
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', preferredSupplierId)
        .eq('user_id', user_id)
        .single()
      
      selectedSupplier = supplier
    }

    // If no preferred supplier or backup needed, find alternatives
    if (!selectedSupplier && use_backup_suppliers) {
      const { data: backupSuppliers } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user_id)
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .limit(3)

      selectedSupplier = backupSuppliers?.[0]
    }

    if (!selectedSupplier) {
      throw new Error('No available supplier found for auto-reorder')
    }

    // Calculate estimated cost
    const estimatedUnitCost = product.cost_price || product.price * 0.6
    const totalCost = estimatedUnitCost * reorderQuantity
    const estimatedDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Create reorder record in activity logs
    const { data: reorderLog, error: reorderError } = await supabase
      .from('activity_logs')
      .insert({
        user_id,
        action: 'auto_reorder_executed',
        entity_type: 'product',
        entity_id: product_id,
        description: `Auto-reorder executed: ${reorderQuantity} units from ${selectedSupplier.name}`,
        metadata: {
          product_name: product.name,
          supplier_id: selectedSupplier.id,
          supplier_name: selectedSupplier.name,
          quantity: reorderQuantity,
          estimated_cost: totalCost,
          estimated_delivery_date: estimatedDeliveryDate.toISOString(),
          reorder_reason: force_reorder ? 'Manual trigger' : 'Automatic threshold reached',
          current_stock: product.stock_quantity
        }
      })
      .select()
      .single()

    // Update rule execution stats
    if (applicableRule) {
      await supabase
        .from('automation_rules')
        .update({
          execution_count: (applicableRule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', applicableRule.id)
    }

    // Send notification if requested
    if (notify_user) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id,
          action: 'reorder_notification',
          entity_type: 'notification',
          entity_id: crypto.randomUUID(),
          description: `Reorder notification: ${product.name}`,
          metadata: {
            type: 'auto_reorder',
            product_name: product.name,
            quantity: reorderQuantity,
            supplier_name: selectedSupplier.name,
            estimated_cost: totalCost
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto-reorder executed successfully',
        reorder_id: reorderLog.id,
        product_name: product.name,
        supplier_name: selectedSupplier.name,
        quantity: reorderQuantity,
        estimated_cost: totalCost,
        estimated_delivery_date: estimatedDeliveryDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auto-reorder execution error:', error)
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