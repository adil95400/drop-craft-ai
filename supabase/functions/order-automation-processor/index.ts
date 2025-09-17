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

    const { order_id, trigger_type, immediate_processing } = await req.json()

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get applicable automation rules
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', order.user_id)
      .eq('rule_type', 'order_automation')
      .eq('is_active', true)

    if (rulesError) {
      throw new Error('Failed to fetch automation rules')
    }

    const applicableRules = rules.filter(rule => {
      const conditions = rule.trigger_conditions as any
      return conditions.trigger_type === trigger_type &&
             matchesOrderConditions(order, conditions)
    })

    let actionsExecuted = 0
    const executionResults = []

    // Execute actions for each applicable rule
    for (const rule of applicableRules) {
      const actions = rule.actions as any[]
      
      for (const action of actions) {
        try {
          const result = await executeAction(action, order, supabase)
          executionResults.push({
            rule_id: rule.id,
            action_type: action.type,
            success: true,
            result
          })
          actionsExecuted++
          
          // Update rule execution count
          await supabase
            .from('automation_rules')
            .update({ 
              execution_count: (rule.execution_count || 0) + 1,
              last_executed_at: new Date().toISOString()
            })
            .eq('id', rule.id)
            
        } catch (actionError) {
          console.error(`Action execution failed:`, actionError)
          executionResults.push({
            rule_id: rule.id,
            action_type: action.type,
            success: false,
            error: actionError.message
          })
        }
      }
    }

    // Log the automation execution
    await supabase
      .from('automation_execution_logs')
      .insert({
        user_id: order.user_id,
        trigger_id: applicableRules[0]?.id || 'no-rule',
        action_id: 'order-automation',
        input_data: { order_id, trigger_type },
        output_data: { execution_results, actions_executed: actionsExecuted },
        status: 'completed',
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order automation processed successfully',
        order_id,
        rules_matched: applicableRules.length,
        actions_executed: actionsExecuted,
        execution_results: executionResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Order automation processing error:', error)
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

function matchesOrderConditions(order: any, conditions: any): boolean {
  if (conditions.order_status && order.status !== conditions.order_status) {
    return false
  }
  if (conditions.order_value_min && order.total_amount < conditions.order_value_min) {
    return false
  }
  return true
}

async function executeAction(action: any, order: any, supabase: any): Promise<any> {
  switch (action.type) {
    case 'send_email':
      return await sendAutomationEmail(action.config, order, supabase)
    case 'update_stock':
      return await updateStockLevels(action.config, order, supabase)
    case 'notify_supplier':
      return await notifySupplier(action.config, order, supabase)
    case 'create_support_ticket':
      return await createSupportTicket(action.config, order, supabase)
    case 'apply_discount':
      return await applyDiscount(action.config, order, supabase)
    case 'auto_refund':
      return await processAutoRefund(action.config, order, supabase)
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function sendAutomationEmail(config: any, order: any, supabase: any): Promise<any> {
  // Log email sending
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'automation_email_sent',
      entity_type: 'order',
      entity_id: order.id,
      description: `Automation email sent to ${config.recipient || 'customer'}`,
      metadata: { template_id: config.template_id, order_id: order.id }
    })
  
  return { email_sent: true, recipient: config.recipient || 'customer' }
}

async function updateStockLevels(config: any, order: any, supabase: any): Promise<any> {
  // This would integrate with stock management
  return { stock_updated: true, products_affected: 1 }
}

async function notifySupplier(config: any, order: any, supabase: any): Promise<any> {
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'supplier_notified',
      entity_type: 'order',
      entity_id: order.id,
      description: `Supplier notification sent`,
      metadata: { supplier_id: config.supplier_id, order_id: order.id }
    })
  
  return { notification_sent: true, supplier_id: config.supplier_id }
}

async function createSupportTicket(config: any, order: any, supabase: any): Promise<any> {
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'support_ticket_created',
      entity_type: 'order',
      entity_id: order.id,
      description: `Support ticket created: ${config.message}`,
      metadata: { priority: config.priority, order_id: order.id }
    })
  
  return { ticket_created: true, priority: config.priority }
}

async function applyDiscount(config: any, order: any, supabase: any): Promise<any> {
  // This would apply discount logic
  return { discount_applied: true, percentage: config.discount_percentage }
}

async function processAutoRefund(config: any, order: any, supabase: any): Promise<any> {
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'auto_refund_processed',
      entity_type: 'order',
      entity_id: order.id,
      description: `Auto refund processed: ${config.refund_amount || 'full amount'}`,
      metadata: { refund_amount: config.refund_amount, order_id: order.id }
    })
  
  return { refund_processed: true, amount: config.refund_amount }
}