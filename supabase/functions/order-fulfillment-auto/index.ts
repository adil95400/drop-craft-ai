import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ACTIONS = new Set(['process', 'check_rules'])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Auth mandatory
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orderId, ruleId, action = 'process' } = body

    if (!ALLOWED_ACTIONS.has(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[order-fulfillment-auto] ${action} for user: ${userId.slice(0, 8)}`)

    if (action === 'process') {
      if (!orderId || !ruleId) {
        return new Response(
          JSON.stringify({ error: 'orderId and ruleId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get order - SCOPED TO USER
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (orderError || !order) {
        return new Response(
          JSON.stringify({ error: 'Order not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get fulfillment rule from `fulfilment_rules` table
      const { data: rule, error: ruleError } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('user_id', userId)
        .single()

      if (ruleError || !rule || !rule.is_active) {
        return new Response(
          JSON.stringify({ error: 'Rule not found, inactive, or access denied' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Execute the rule actions
      const ruleActions = (rule.actions || []) as any[]
      const results: any[] = []

      for (const ruleAction of ruleActions) {
        try {
          const result = await executeFulfillmentAction(ruleAction, order, supabase)
          results.push({ action: ruleAction.type, success: true, result })
        } catch (e: any) {
          results.push({ action: ruleAction.type, success: false, error: e.message })
        }
      }

      // Update order status to processing
      await supabase
        .from('orders')
        .update({ status: 'processing', fulfillment_status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', userId)

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'order_auto_fulfilled',
        entity_type: 'order',
        entity_id: orderId,
        description: `Order ${order.order_number} processed via rule "${rule.name}"`,
        details: { rule_id: ruleId, actions_results: results },
        source: 'order-fulfillment-auto'
      })

      return new Response(
        JSON.stringify({
          success: true,
          order_number: order.order_number,
          rule_name: rule.name,
          actions_executed: results.filter(r => r.success).length,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_rules') {
      const { data: rules, error: rulesError } = await supabase
        .from('fulfilment_rules')
        .select('id, name, is_active, priority')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (rulesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch rules' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, active_rules: rules?.length || 0, rules: rules || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Order fulfillment error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function executeFulfillmentAction(action: any, order: any, supabase: any): Promise<any> {
  const actionType = action.type || action.action_type

  switch (actionType) {
    case 'notify_supplier':
      await supabase.from('activity_logs').insert({
        user_id: order.user_id,
        action: 'supplier_notified',
        entity_type: 'order',
        entity_id: order.id,
        description: `Supplier notified for order ${order.order_number}`,
      })
      return { notification_sent: true }

    case 'update_status':
      const newStatus = action.config?.status || 'processing'
      await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', order.id)
      return { status_updated: newStatus }

    case 'decrement_stock':
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', order.id)

      let decremented = 0
      for (const item of (items || [])) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single()

          if (product) {
            await supabase
              .from('products')
              .update({
                stock_quantity: Math.max(0, (product.stock_quantity || 0) - (item.qty || 1)),
                updated_at: new Date().toISOString()
              })
              .eq('id', item.product_id)
            decremented++
          }
        }
      }
      return { stock_decremented: decremented }

    default:
      return { skipped: true, reason: `Unknown action: ${actionType}` }
  }
}
