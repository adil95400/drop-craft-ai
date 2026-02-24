import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { 
      order_id, 
      refund_reason, 
      refund_amount, 
      auto_approve = true, 
      notify_customer = true 
    } = await req.json()

    if (!order_id || !refund_reason) {
      return errorResponse('Order ID and refund reason are required', corsHeaders)
    }

    // RLS-scoped: only returns user's orders
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found', corsHeaders, 404)
    }

    const finalRefundAmount = refund_amount || order.total_amount
    if (finalRefundAmount > order.total_amount) {
      return errorResponse('Refund amount cannot exceed order total', corsHeaders)
    }

    const refundEligibility = assessRefundEligibility(order, refund_reason)
    const shouldAutoApprove = auto_approve && refundEligibility.eligible && refundEligibility.confidence_score > 0.7

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

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'refund_processed',
      entity_type: 'order',
      entity_id: order_id,
      description: `Refund ${refundStatus}: $${finalRefundAmount} for order ${order.order_number}`,
      metadata: refundData
    })

    const newOrderStatus = shouldAutoApprove ? 'refunded' : 'refund_pending'
    await supabase
      .from('orders')
      .update({ status: newOrderStatus, updated_at: new Date().toISOString() })
      .eq('id', order_id)

    if (notify_customer) {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'customer_notification_sent',
        entity_type: 'order',
        entity_id: order_id,
        description: 'Refund notification sent to customer',
        metadata: { notification_type: 'refund_confirmation', refund_status: refundStatus, refund_amount: finalRefundAmount }
      })
    }

    if (!shouldAutoApprove) {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'refund_review_task_created',
        entity_type: 'task',
        entity_id: crypto.randomUUID(),
        description: `Manual refund review required for order ${order.order_number}`,
        metadata: { task_type: 'refund_review', priority: 'medium', order_id, refund_data: refundData }
      })
    }

    return successResponse({
      message: `Refund ${refundStatus} successfully`,
      refund_id: refundId,
      order_id,
      refund_amount: finalRefundAmount,
      status: refundStatus,
      auto_approved: shouldAutoApprove,
      estimated_processing_time: refundData.estimated_processing_time,
      eligibility_assessment: refundEligibility
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('Refund automation processing error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

function assessRefundEligibility(order: any, reason: string) {
  const orderDate = new Date(order.created_at)
  const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  
  let eligibilityScore = 1.0
  const eligibilityFactors: string[] = []

  if (daysSinceOrder <= 30) {
    eligibilityFactors.push('Within 30-day return window')
  } else if (daysSinceOrder <= 60) {
    eligibilityScore *= 0.7
    eligibilityFactors.push('Beyond standard return window but within extended period')
  } else {
    eligibilityScore *= 0.3
    eligibilityFactors.push('Beyond extended return window')
  }

  const reasonScores: Record<string, number> = {
    'defective_product': 1.0, 'wrong_item_sent': 1.0, 'not_as_described': 0.9,
    'damaged_in_shipping': 1.0, 'customer_changed_mind': 0.7, 'found_better_price': 0.5, 'no_longer_needed': 0.6
  }

  const reasonScore = reasonScores[reason] || 0.8
  eligibilityScore *= reasonScore
  eligibilityFactors.push(`Reason: ${reason} (${reasonScore} factor)`)

  if (order.total_amount > 500) {
    eligibilityScore *= 0.9
    eligibilityFactors.push('High-value order - requires additional verification')
  }

  return {
    eligible: eligibilityScore > 0.5,
    confidence_score: Math.min(eligibilityScore, 1.0),
    days_since_order: daysSinceOrder,
    eligibility_factors: eligibilityFactors,
    recommendation: eligibilityScore > 0.8 ? 'auto_approve' : eligibilityScore > 0.5 ? 'manual_review' : 'decline'
  }
}
