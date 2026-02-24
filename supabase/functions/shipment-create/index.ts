import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { orderId, carrierId, shippingAddress, weight, dimensions, autoGenerateLabel = true } = await req.json()

    console.log(`[shipment-create] Creating shipment for order ${orderId}`)

    // RLS-scoped: only returns carriers owned by user
    const { data: carrier } = await supabase
      .from('fulfillment_carriers')
      .select('*')
      .eq('id', carrierId)
      .single()

    if (!carrier) {
      return errorResponse('Transporteur non trouvé', corsHeaders, 404)
    }

    const shipmentData = createShipmentWithCarrier(carrier, { shippingAddress, weight, dimensions })

    // RLS-scoped insert
    const { data: shipment } = await supabase
      .from('fulfillment_shipments')
      .insert({
        user_id: userId, order_id: orderId, carrier_id: carrierId,
        tracking_number: shipmentData.trackingNumber, label_url: shipmentData.labelUrl,
        label_format: 'pdf', weight_kg: weight, dimensions, shipping_address: shippingAddress,
        status: 'created', shipping_cost: shipmentData.cost, total_cost: shipmentData.cost,
        estimated_delivery_date: shipmentData.estimatedDelivery,
      })
      .select()
      .single()

    if (autoGenerateLabel && shipmentData.labelUrl) {
      await supabase.from('shipping_labels').insert({
        user_id: userId, shipment_id: shipment.id,
        label_url: shipmentData.labelUrl, label_format: 'pdf',
      })
    }

    // RLS-scoped update
    await supabase
      .from('orders')
      .update({ status: 'processing', tracking_number: shipmentData.trackingNumber, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    return successResponse({
      shipment, tracking_number: shipmentData.trackingNumber, label_url: shipmentData.labelUrl,
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[shipment-create] Error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 500)
  }
})

function createShipmentWithCarrier(carrier: any, info: any) {
  const trackingNumber = `${carrier.carrier_code.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const labelUrl = `https://labels.example.com/${trackingNumber}.pdf`
  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3)
  const cost = 5.0 + (info.weight || 1) * 2.5

  return { trackingNumber, labelUrl, cost, estimatedDelivery: estimatedDelivery.toISOString() }
}
