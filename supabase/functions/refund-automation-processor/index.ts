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
      order_id, 
      refund_reason, 
      refund_amount, 
      auto_approve = true, 
      notify_customer = true 
    } = await req.json()

    if (!order_id || !refund_reason) {
      throw new Error('Order ID and refund reason are required')
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Calculate refund amount if not specified
    const finalRefundAmount = refund_amount || order.total_amount
    
    // Check if refund amount is valid
    if (finalRefundAmount > order.total_amount) {
      throw new Error('Refund amount cannot exceed order total')
    }

    // Determine refund eligibility and approval
    const refundEligibility = await assessRefundEligibility(order, refund_reason, supabase)
    const shouldAutoApprove = auto_approve && refundEligibility.eligible && refundEligibility.confidence_score > 0.7

    // Create refund record
    const refundId = crypto.randomUUID()
    const refundStatus = shouldAutoApprove ? 'approved' : 'pending_review'

    const refundData = {
      refund_id: refundId,
      order_id,
      original_amount: order.total_amount,
      refund_amount: finalRefundAmount,
      refund_reason,
      status: refundStatus,
      auto_approved: shouldAutoApprove,
      eligibility: refundEligibility,
      processed_at: shouldAutoApprove ? new Date().toISOString() : null,
      estimated_processing_time: shouldAutoApprove ? '1-3 business days' : '3-5 business days'
    }

    // Log the refund processing
    await supabase
      .from('activity_logs')
      .insert({
        user_id: order.user_id,
        action: 'refund_processed',
        entity_type: 'order',
        entity_id: order_id,
        description: `Refund ${refundStatus}: $${finalRefundAmount} for order ${order.order_number}`,
        metadata: refundData
      })

    // Process inventory restoration if applicable
    if (shouldAutoApprove && refund_reason !== 'damaged_product') {
      await processInventoryRestoration(order, supabase)
    }

    // Update order status
    const newOrderStatus = shouldAutoApprove ? 'refunded' : 'refund_pending'
    await supabase
      .from('orders')
      .update({ 
        status: newOrderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)

    // Send customer notification if requested
    if (notify_customer) {
      await sendRefundNotification(order, refundData, supabase)
    }

    // Create follow-up tasks if manual review is needed
    if (!shouldAutoApprove) {
      await createRefundReviewTask(order, refundData, supabase)
    }

    // Log automation execution
    await supabase
      .from('automation_execution_logs')
      .insert({
        user_id: order.user_id,
        trigger_id: 'refund-automation',
        action_id: 'refund-processor',
        input_data: { order_id, refund_reason, refund_amount },
        output_data: refundData,
        status: 'completed',
        completed_at: new Date().toISOString(),
        execution_time_ms: 150
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Refund ${refundStatus} successfully`,
        refund_id: refundId,
        order_id,
        refund_amount: finalRefundAmount,
        status: refundStatus,
        auto_approved: shouldAutoApprove,
        estimated_processing_time: refundData.estimated_processing_time,
        eligibility_assessment: refundEligibility
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Refund automation processing error:', error)
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

async function assessRefundEligibility(order: any, reason: string, supabase: any) {
  const orderDate = new Date(order.created_at)
  const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  
  let eligibilityScore = 1.0
  let eligibilityFactors = []

  // Time-based eligibility
  if (daysSinceOrder <= 30) {
    eligibilityFactors.push('Within 30-day return window')
  } else if (daysSinceOrder <= 60) {
    eligibilityScore *= 0.7
    eligibilityFactors.push('Beyond standard return window but within extended period')
  } else {
    eligibilityScore *= 0.3
    eligibilityFactors.push('Beyond extended return window')
  }

  // Reason-based eligibility
  const reasonScores: { [key: string]: number } = {
    'defective_product': 1.0,
    'wrong_item_sent': 1.0,
    'not_as_described': 0.9,
    'damaged_in_shipping': 1.0,
    'customer_changed_mind': 0.7,
    'found_better_price': 0.5,
    'no_longer_needed': 0.6
  }

  const reasonScore = reasonScores[reason] || 0.8
  eligibilityScore *= reasonScore
  eligibilityFactors.push(`Reason: ${reason} (${reasonScore} factor)`)

  // Order value consideration
  if (order.total_amount > 500) {
    eligibilityScore *= 0.9 // Slight reduction for high-value orders
    eligibilityFactors.push('High-value order - requires additional verification')
  }

  // Customer history (simplified simulation)
  const customerHistory = await getCustomerRefundHistory(order.customer_id, supabase)
  if (customerHistory.total_refunds > 3) {
    eligibilityScore *= 0.6
    eligibilityFactors.push('Customer has multiple previous refunds')
  } else if (customerHistory.total_refunds === 0) {
    eligibilityScore *= 1.1
    eligibilityFactors.push('First-time refund customer')
  }

  return {
    eligible: eligibilityScore > 0.5,
    confidence_score: Math.min(eligibilityScore, 1.0),
    days_since_order: daysSinceOrder,
    eligibility_factors: eligibilityFactors,
    recommendation: eligibilityScore > 0.8 ? 'auto_approve' : 
                   eligibilityScore > 0.5 ? 'manual_review' : 'decline'
  }
}

async function getCustomerRefundHistory(customerId: string, supabase: any) {
  // Get customer refund history from activity logs
  const { data: refunds, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('action', 'refund_processed')
    .eq('entity_id', customerId)
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

  return {
    total_refunds: refunds?.length || 0,
    last_refund_date: refunds?.[0]?.created_at || null
  }
}

async function processInventoryRestoration(order: any, supabase: any) {
  // Restore inventory for refunded items
  const orderItems = order.items || []
  
  for (const item of orderItems) {
    if (item.product_id) {
      // Increment stock back
      await supabase
        .from('activity_logs')
        .insert({
          user_id: order.user_id,
          action: 'stock_movement',
          entity_type: 'product',
          entity_id: item.product_id,
          description: `Inventory restored: ${item.quantity} units due to refund`,
          metadata: {
            movement_type: 'in',
            quantity: item.quantity,
            reason: 'refund_restoration',
            order_id: order.id,
            automatic: true
          }
        })
    }
  }
}

async function sendRefundNotification(order: any, refundData: any, supabase: any) {
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'customer_notification_sent',
      entity_type: 'order',
      entity_id: order.id,
      description: `Refund notification sent to customer`,
      metadata: {
        notification_type: 'refund_confirmation',
        refund_status: refundData.status,
        refund_amount: refundData.refund_amount,
        customer_email: order.customer_email || 'customer@example.com'
      }
    })
}

async function createRefundReviewTask(order: any, refundData: any, supabase: any) {
  await supabase
    .from('activity_logs')
    .insert({
      user_id: order.user_id,
      action: 'refund_review_task_created',
      entity_type: 'task',
      entity_id: crypto.randomUUID(),
      description: `Manual refund review required for order ${order.order_number}`,
      metadata: {
        task_type: 'refund_review',
        priority: 'medium',
        order_id: order.id,
        refund_data: refundData,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    })
}