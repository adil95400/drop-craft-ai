import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Webhook handler for 17Track push notifications
 * Receives real-time updates when tracking status changes
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    
    console.log('[carrier-tracking-webhook] Received webhook:', JSON.stringify(payload))

    // 17Track webhook payload structure
    const { number, track, e: carrierCode } = payload

    if (!number) {
      throw new Error('Invalid webhook payload: missing tracking number')
    }

    // Parse the tracking events
    const events = (track?.z0?.z || []).map((event: any) => ({
      timestamp: event.a || new Date().toISOString(),
      location: event.c || '',
      status: event.z || '',
      description: event.d || event.z || ''
    }))

    // Map status
    const statusMap: Record<number, string> = {
      0: 'pending',
      10: 'pending',
      20: 'in_transit',
      30: 'in_transit',
      35: 'in_transit',
      40: 'out_for_delivery',
      50: 'delivered',
      60: 'failed',
      70: 'failed'
    }

    const newStatus = statusMap[track?.e] || 'pending'
    const isDelivered = newStatus === 'delivered'

    // Find and update the order
    const { data: orders, error: findError } = await supabaseClient
      .from('orders')
      .select('id, user_id, customer_email, delivery_status')
      .eq('tracking_number', number)

    if (findError) {
      console.error('[carrier-tracking-webhook] Find error:', findError)
      throw findError
    }

    if (!orders || orders.length === 0) {
      console.log(`[carrier-tracking-webhook] No order found for tracking: ${number}`)
      return new Response(
        JSON.stringify({ success: true, message: 'No matching order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update all matching orders
    for (const order of orders) {
      const previousStatus = order.delivery_status

      // Update order
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          delivery_status: newStatus,
          tracking_events: events,
          last_tracking_update: new Date().toISOString(),
          ...(isDelivered && { 
            delivered_at: new Date().toISOString(),
            fulfillment_status: 'delivered'
          })
        })
        .eq('id', order.id)

      if (updateError) {
        console.error(`[carrier-tracking-webhook] Update error for order ${order.id}:`, updateError)
        continue
      }

      console.log(`[carrier-tracking-webhook] Updated order ${order.id}: ${previousStatus} -> ${newStatus}`)

      // Create notification for status change
      if (previousStatus !== newStatus) {
        await createTrackingNotification(supabaseClient, order, newStatus, number, events[0])
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: orders.length,
        trackingNumber: number,
        newStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[carrier-tracking-webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function createTrackingNotification(
  supabase: any, 
  order: any, 
  status: string, 
  trackingNumber: string,
  lastEvent: any
) {
  const notificationMessages: Record<string, { title: string; message: string }> = {
    'pending': {
      title: '📦 Colis en préparation',
      message: `Votre commande #${order.id.slice(0, 8)} est en cours de préparation`
    },
    'in_transit': {
      title: '🚚 Colis en transit',
      message: `Votre commande #${order.id.slice(0, 8)} est en cours d'acheminement`
    },
    'out_for_delivery': {
      title: '🏃 Livraison en cours',
      message: `Votre commande #${order.id.slice(0, 8)} est en cours de livraison aujourd'hui!`
    },
    'delivered': {
      title: '✅ Colis livré',
      message: `Votre commande #${order.id.slice(0, 8)} a été livrée avec succès!`
    },
    'failed': {
      title: '⚠️ Problème de livraison',
      message: `Un problème est survenu avec votre commande #${order.id.slice(0, 8)}`
    }
  }

  const notification = notificationMessages[status] || {
    title: '📦 Mise à jour',
    message: `Statut mis à jour pour la commande #${order.id.slice(0, 8)}`
  }

  // Insert notification for the user
  await supabase
    .from('notifications')
    .insert({
      user_id: order.user_id,
      type: 'tracking_update',
      title: notification.title,
      message: notification.message,
      data: {
        order_id: order.id,
        tracking_number: trackingNumber,
        status,
        last_event: lastEvent
      },
      is_read: false
    })

  console.log(`[createTrackingNotification] Created notification for user ${order.user_id}`)

  // If customer email exists, queue email notification
  if (order.customer_email) {
    await supabase
      .from('email_queue')
      .insert({
        to_email: order.customer_email,
        template: 'tracking_update',
        subject: notification.title,
        data: {
          order_id: order.id,
          tracking_number: trackingNumber,
          status,
          message: notification.message,
          tracking_url: `https://t.17track.net/en#nums=${trackingNumber}`
        },
        status: 'pending'
      })

    console.log(`[createTrackingNotification] Queued email for ${order.customer_email}`)
  }
}
