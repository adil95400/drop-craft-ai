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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { 
      orderId, 
      carrierId, 
      shippingAddress, 
      weight, 
      dimensions,
      autoGenerateLabel = true 
    } = await req.json()

    console.log(`[shipment-create] Creating shipment for order ${orderId}`)

    // Get carrier details
    const { data: carrier } = await supabase
      .from('fulfillment_carriers')
      .select('*')
      .eq('id', carrierId)
      .eq('user_id', user.id)
      .single()

    if (!carrier) {
      return new Response(JSON.stringify({ error: 'Transporteur non trouvé' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create shipment with carrier API
    const shipmentData = await createShipmentWithCarrier(
      carrier,
      {
        shippingAddress,
        weight,
        dimensions
      }
    )

    // Save shipment to database
    const { data: shipment } = await supabase
      .from('fulfillment_shipments')
      .insert({
        user_id: user.id,
        order_id: orderId,
        carrier_id: carrierId,
        tracking_number: shipmentData.trackingNumber,
        label_url: shipmentData.labelUrl,
        label_format: 'pdf',
        weight_kg: weight,
        dimensions,
        shipping_address: shippingAddress,
        status: 'created',
        shipping_cost: shipmentData.cost,
        total_cost: shipmentData.cost,
        estimated_delivery_date: shipmentData.estimatedDelivery
      })
      .select()
      .single()

    // Generate label if requested
    if (autoGenerateLabel && shipmentData.labelUrl) {
      await supabase
        .from('shipping_labels')
        .insert({
          user_id: user.id,
          shipment_id: shipment.id,
          label_url: shipmentData.labelUrl,
          label_format: 'pdf'
        })
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'processing',
        tracking_number: shipmentData.trackingNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log(`[shipment-create] Shipment created: ${shipment.id}`)

    return new Response(JSON.stringify({
      success: true,
      shipment,
      tracking_number: shipmentData.trackingNumber,
      label_url: shipmentData.labelUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[shipment-create] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createShipmentWithCarrier(carrier: any, shipmentInfo: any) {
  // Simulation de création d'expédition
  // En production, appeler l'API réelle du transporteur
  
  const trackingNumber = `${carrier.carrier_code.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Simulate label generation
  const labelUrl = `https://labels.example.com/${trackingNumber}.pdf`
  
  // Calculate estimated delivery (3-5 days)
  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3)
  
  // Calculate cost based on weight
  const baseCost = 5.0
  const weightCost = (shipmentInfo.weight || 1) * 2.5
  const cost = baseCost + weightCost
  
  console.log(`[createShipmentWithCarrier] Created shipment ${trackingNumber} with ${carrier.carrier_name}`)
  
  return {
    trackingNumber,
    labelUrl,
    cost,
    estimatedDelivery: estimatedDelivery.toISOString()
  }
}