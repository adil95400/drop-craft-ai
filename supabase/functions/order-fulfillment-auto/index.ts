import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { orderId, userId, ruleId, action = 'process' } = await req.json()

    console.log('Order fulfillment auto:', { orderId, userId, ruleId, action })

    if (action === 'process') {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .single()

      if (!order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get fulfillment rule
      const { data: rule } = await supabase
        .from('order_fulfillment_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('user_id', userId)
        .single()

      if (!rule || !rule.is_active) {
        return new Response(
          JSON.stringify({ error: 'Invalid or inactive rule' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create fulfillment log
      const { data: log } = await supabase
        .from('order_fulfillment_logs')
        .insert({
          user_id: userId,
          order_id: orderId,
          rule_id: ruleId,
          status: 'processing',
          fulfillment_data: {
            order_number: order.order_number,
            total_amount: order.total_amount
          }
        })
        .select()
        .single()

      // Simulate placing order with supplier
      await new Promise(resolve => setTimeout(resolve, 2000))

      const supplierOrderId = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const trackingNumber = `TRK-${Date.now()}`

      // Update fulfillment log
      await supabase
        .from('order_fulfillment_logs')
        .update({
          status: 'completed',
          supplier_order_id: supplierOrderId,
          tracking_number: trackingNumber,
          completed_at: new Date().toISOString()
        })
        .eq('id', log.id)

      // Update order status
      await supabase
        .from('orders')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      // Update rule execution count
      await supabase
        .from('order_fulfillment_rules')
        .update({
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString()
        })
        .eq('id', ruleId)

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'order_auto_fulfilled',
          description: `Order ${order.order_number} automatically fulfilled`,
          metadata: {
            order_id: orderId,
            supplier_order_id: supplierOrderId,
            tracking_number: trackingNumber
          }
        })

      return new Response(
        JSON.stringify({
          success: true,
          supplier_order_id: supplierOrderId,
          tracking_number: trackingNumber,
          message: 'Order automatically placed with supplier'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check_rules') {
      // Check and execute applicable rules
      const { data: rules } = await supabase
        .from('order_fulfillment_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('auto_place_order', true)

      return new Response(
        JSON.stringify({
          success: true,
          active_rules: rules?.length || 0,
          rules: rules || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Order fulfillment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
