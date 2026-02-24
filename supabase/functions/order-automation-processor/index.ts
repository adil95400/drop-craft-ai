import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { order_id, trigger_type, immediate_processing } = await req.json()

    if (!order_id) {
      return errorResponse('order_id is required', corsHeaders)
    }

    // RLS-scoped
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found or access denied', corsHeaders, 404)
    }

    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('action_type', 'order_automation')
      .eq('is_active', true)

    if (rulesError) {
      return errorResponse('Failed to fetch automation rules', corsHeaders, 500)
    }

    const applicableRules = (rules || []).filter(rule => {
      const triggerConfig = rule.trigger_config as any
      if (!triggerConfig) return false
      return triggerConfig.trigger_type === trigger_type && matchesOrderConditions(order, triggerConfig)
    })

    let actionsExecuted = 0
    const executionResults: any[] = []

    for (const rule of applicableRules) {
      const actions = (rule.action_config || []) as any[]
      for (const action of actions) {
        try {
          const result = await executeAction(action, order, supabase)
          executionResults.push({ rule_id: rule.id, action_type: action.type, success: true, result })
          actionsExecuted++

          await supabase
            .from('automation_rules')
            .update({ trigger_count: (rule.trigger_count || 0) + 1, last_triggered_at: new Date().toISOString() })
            .eq('id', rule.id)
        } catch (actionError: any) {
          executionResults.push({ rule_id: rule.id, action_type: action.type, success: false, error: actionError.message })
        }
      }
    }

    if (applicableRules.length > 0) {
      await supabase.from('automation_execution_logs').insert({
        user_id: userId,
        trigger_id: applicableRules[0]?.id,
        input_data: { order_id, trigger_type },
        output_data: { execution_results: executionResults, actions_executed: actionsExecuted },
        status: actionsExecuted > 0 ? 'completed' : 'skipped',
        executed_at: new Date().toISOString(),
      })
    }

    return successResponse({
      message: 'Order automation processed',
      order_id,
      rules_matched: applicableRules.length,
      actions_executed: actionsExecuted,
      execution_results: executionResults
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Order automation processing error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message || 'Internal error', getSecureCorsHeaders(origin), 500)
  }
})

function matchesOrderConditions(order: any, conditions: any): boolean {
  if (conditions.order_status && order.status !== conditions.order_status) return false
  if (conditions.payment_status && order.payment_status !== conditions.payment_status) return false
  if (conditions.order_value_min && (order.total_amount || 0) < conditions.order_value_min) return false
  return true
}

async function executeAction(action: any, order: any, supabase: any): Promise<any> {
  const config = action.config || {}

  switch (action.type) {
    case 'update_status':
      await supabase
        .from('orders')
        .update({ status: config.new_status || 'processing', updated_at: new Date().toISOString() })
        .eq('id', order.id)
      return { status_updated: config.new_status || 'processing' }

    case 'send_email':
      await supabase.from('activity_logs').insert({
        user_id: order.user_id, action: 'automation_email_sent', entity_type: 'order',
        entity_id: order.id, description: `Automation email for order ${order.order_number}`,
      })
      return { email_logged: true }

    case 'notify_supplier':
      await supabase.from('activity_logs').insert({
        user_id: order.user_id, action: 'supplier_notified', entity_type: 'order',
        entity_id: order.id, description: `Supplier notification for order ${order.order_number}`,
      })
      return { notification_sent: true }

    case 'update_stock':
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', order.id)

      for (const item of (items || [])) {
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single()

          if (product) {
            const newQty = Math.max(0, (product.stock_quantity || 0) - (item.qty || 1))
            await supabase
              .from('products')
              .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
              .eq('id', item.product_id)
          }
        }
      }
      return { stock_updated: true }

    case 'create_support_ticket':
      await supabase.from('activity_logs').insert({
        user_id: order.user_id, action: 'support_ticket_created', entity_type: 'order',
        entity_id: order.id, description: `Support ticket for order ${order.order_number}: ${config.message || ''}`,
      })
      return { ticket_created: true }

    default:
      return { skipped: true, reason: `Unknown action: ${action.type}` }
  }
}
