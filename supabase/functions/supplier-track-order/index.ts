import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    const { orderId, supplierId } = await req.json()
    
    console.log('Tracking order:', orderId, 'from supplier:', supplierId)
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('supplier_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      throw new Error('Order not found')
    }
    
    // Get supplier credentials
    const { data: credentials, error: credError } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .single()
    
    if (credError || !credentials) {
      throw new Error('Supplier not connected')
    }
    
    let trackingInfo: any = {
      orderId: order.supplier_order_id,
      status: order.order_status,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      estimatedDelivery: order.estimated_delivery
    }
    
    // Fetch tracking info from supplier API
    const connectorId = credentials.oauth_data?.connectorId || supplierId
    
    switch (connectorId) {
      case 'bigbuy': {
        try {
          const apiKey = credentials.oauth_data?.apiKey || credentials.api_key_encrypted
          const response = await fetch(
            `https://api.bigbuy.eu/rest/tracking/${order.supplier_order_id}.json`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            trackingInfo = {
              ...trackingInfo,
              status: data.status,
              trackingNumber: data.tracking,
              carrier: data.carrier,
              trackingUrl: data.trackingUrl,
              events: data.events
            }
          }
        } catch (error) {
          console.error('BigBuy tracking failed:', error)
        }
        break
      }
      
      case 'btswholesaler': {
        try {
          const apiKey = credentials.oauth_data?.apiKey
          const response = await fetch(
            `https://api.btswholesaler.com/v1/api/getTrackings?order_number[0]=${order.supplier_order_id}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              }
            }
          )
          
          if (response.ok) {
            const trackings = await response.json()
            if (trackings.length > 0) {
              trackingInfo = {
                ...trackingInfo,
                trackingNumber: trackings[0].tracking,
                carrier: trackings[0].carrier,
                status: trackings[0].status
              }
            }
          }
        } catch (error) {
          console.error('BTSWholesaler tracking failed:', error)
        }
        break
      }
      
      default: {
        // Generic tracking simulation
        trackingInfo.events = [
          {
            date: new Date().toISOString(),
            status: 'Order Placed',
            location: 'Warehouse'
          }
        ]
      }
    }
    
    // Update order with tracking info
    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update({
        tracking_number: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier,
        tracking_url: trackingInfo.trackingUrl,
        tracking_events: trackingInfo.events,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Error updating order tracking:', updateError)
    }
    
    // Log tracking event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'order_tracking_updated',
        entity_type: 'order',
        entity_id: orderId,
        description: `Tracking updated for order ${order.supplier_order_id}`,
        metadata: trackingInfo
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        trackingInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Order tracking error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
