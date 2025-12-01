import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ReturnRequest {
  orderId: string
  reason: string
  items: Array<{
    productId: string
    quantity: number
    reason: string
  }>
  marketplace?: string
}

interface DisputeRequest {
  orderId: string
  type: 'chargeback' | 'refund_request' | 'quality_issue' | 'delivery_issue'
  description: string
  marketplace: string
}

/**
 * Manage returns and disputes across marketplaces
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...payload } = await req.json()

    console.log('Returns/disputes action:', action, 'user:', user.id)

    switch (action) {
      case 'create_return': {
        const returnReq = payload as ReturnRequest
        
        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', returnReq.orderId)
          .eq('user_id', user.id)
          .single()

        if (!order) throw new Error('Order not found')

        // Create return record
        const { data: returnRecord, error: returnError } = await supabase
          .from('returns')
          .insert({
            user_id: user.id,
            order_id: returnReq.orderId,
            reason: returnReq.reason,
            items: returnReq.items,
            status: 'pending',
            marketplace: returnReq.marketplace || order.marketplace || 'shopify',
            return_date: new Date().toISOString(),
          })
          .select()
          .single()

        if (returnError) throw returnError

        // Update order status
        await supabase
          .from('orders')
          .update({ 
            status: 'return_requested',
            updated_at: new Date().toISOString() 
          })
          .eq('id', returnReq.orderId)

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'return_created',
            title: 'Demande de retour créée',
            message: `Retour créé pour la commande ${order.order_number}`,
            priority: 'medium',
            metadata: { return_id: returnRecord.id, order_id: returnReq.orderId }
          })

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'return_created',
            entity_type: 'return',
            entity_id: returnRecord.id,
            description: `Demande de retour créée pour commande ${order.order_number}`,
            metadata: { order_id: returnReq.orderId, reason: returnReq.reason }
          })

        return new Response(
          JSON.stringify({ success: true, return: returnRecord }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_dispute': {
        const disputeReq = payload as DisputeRequest
        
        // Get order details
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('id', disputeReq.orderId)
          .eq('user_id', user.id)
          .single()

        if (!order) throw new Error('Order not found')

        // Create dispute record
        const { data: disputeRecord, error: disputeError } = await supabase
          .from('disputes')
          .insert({
            user_id: user.id,
            order_id: disputeReq.orderId,
            type: disputeReq.type,
            description: disputeReq.description,
            status: 'open',
            marketplace: disputeReq.marketplace,
            opened_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (disputeError) throw disputeError

        // Update order status
        await supabase
          .from('orders')
          .update({ 
            status: 'disputed',
            updated_at: new Date().toISOString() 
          })
          .eq('id', disputeReq.orderId)

        // Create high-priority notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'dispute_created',
            title: 'Litige ouvert',
            message: `Litige ouvert pour la commande ${order.order_number} - ${disputeReq.type}`,
            priority: 'high',
            metadata: { dispute_id: disputeRecord.id, order_id: disputeReq.orderId }
          })

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: user.id,
            action: 'dispute_created',
            entity_type: 'dispute',
            entity_id: disputeRecord.id,
            description: `Litige créé pour commande ${order.order_number}`,
            metadata: { order_id: disputeReq.orderId, type: disputeReq.type }
          })

        return new Response(
          JSON.stringify({ success: true, dispute: disputeRecord }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list_returns': {
        const { data: returns, error } = await supabase
          .from('returns')
          .select(`
            *,
            orders:order_id (order_number, customer_name, total_amount, marketplace)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, returns }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'list_disputes': {
        const { data: disputes, error } = await supabase
          .from('disputes')
          .select(`
            *,
            orders:order_id (order_number, customer_name, total_amount, marketplace)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, disputes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_return_status': {
        const { returnId, status, notes } = payload

        const { data: returnRecord, error } = await supabase
          .from('returns')
          .update({ 
            status, 
            notes,
            updated_at: new Date().toISOString(),
            ...(status === 'approved' && { approved_at: new Date().toISOString() }),
            ...(status === 'completed' && { completed_at: new Date().toISOString() })
          })
          .eq('id', returnId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) throw error

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'return_updated',
            title: 'Statut de retour mis à jour',
            message: `Le retour a été ${status}`,
            priority: 'medium',
            metadata: { return_id: returnId, status }
          })

        return new Response(
          JSON.stringify({ success: true, return: returnRecord }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Returns/disputes error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
