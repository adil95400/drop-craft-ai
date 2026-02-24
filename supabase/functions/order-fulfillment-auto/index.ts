import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

const ALLOWED_ACTIONS = new Set(['process', 'check_rules'])

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid JSON body', corsHeaders)
    }

    const { orderId, ruleId, action = 'process' } = body

    if (!ALLOWED_ACTIONS.has(action)) {
      return errorResponse('Invalid action', corsHeaders)
    }

    console.log(`[order-fulfillment-auto] ${action} for user: ${userId.slice(0, 8)}`)

    if (action === 'process') {
      if (!orderId || !ruleId) {
        return errorResponse('orderId and ruleId are required', corsHeaders)
      }

      // RLS-scoped: only returns user's orders
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        return errorResponse('Order not found or access denied', corsHeaders, 404)
      }

      const { data: rule, error: ruleError } = await supabase
        .from('fulfilment_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (ruleError || !rule || !rule.is_active) {
        return errorResponse('Rule not found, inactive, or access denied', corsHeaders)
      }

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

      await supabase
        .from('orders')
        .update({ status: 'processing', fulfillment_status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'order_auto_fulfilled',
        entity_type: 'order',
        entity_id: orderId,
        description: `Order ${order.order_number} processed via rule "${rule.name}"`,
        details: { rule_id: ruleId, actions_results: results },
        source: 'order-fulfillment-auto'
      })

      return successResponse({
        order_number: order.order_number,
        rule_name: rule.name,
        actions_executed: results.filter(r => r.success).length,
        results
      }, corsHeaders)
    }

    if (action === 'check_rules') {
      const { data: rules, error: rulesError } = await supabase
        .from('fulfilment_rules')
        .select('id, name, is_active, priority')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (rulesError) {
        return errorResponse('Failed to fetch rules', corsHeaders, 500)
      }

      return successResponse({ active_rules: rules?.length || 0, rules: rules || [] }, corsHeaders)
    }

    return errorResponse('Invalid action', corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Order fulfillment error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
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
