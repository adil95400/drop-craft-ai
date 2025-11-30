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

    const authHeader = req.headers.get('Authorization')
    const { shipmentId, trackingNumber } = await req.json()

    console.log(`[tracking-sync] Syncing tracking for ${trackingNumber || shipmentId}`)

    let shipment
    if (shipmentId) {
      const { data } = await supabase
        .from('fulfillment_shipments')
        .select('*, carrier:fulfillment_carriers(*)')
        .eq('id', shipmentId)
        .single()
      shipment = data
    } else if (trackingNumber) {
      const { data } = await supabase
        .from('fulfillment_shipments')
        .select('*, carrier:fulfillment_carriers(*)')
        .eq('tracking_number', trackingNumber)
        .single()
      shipment = data
    }

    if (!shipment) {
      return new Response(JSON.stringify({ error: 'Expédition non trouvée' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch tracking updates from carrier API
    const trackingData = await fetchTrackingFromCarrier(
      shipment.carrier,
      shipment.tracking_number
    )

    // Update shipment with new tracking data
    const { data: updated } = await supabase
      .from('fulfillment_shipments')
      .update({
        status: trackingData.status,
        tracking_events: trackingData.events,
        actual_delivery_date: trackingData.deliveredAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipment.id)
      .select()
      .single()

    console.log(`[tracking-sync] Updated shipment ${shipment.id} with status ${trackingData.status}`)

    return new Response(JSON.stringify({
      success: true,
      shipment: updated,
      tracking: trackingData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[tracking-sync] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function fetchTrackingFromCarrier(carrier: any, trackingNumber: string) {
  // Simulation de récupération de tracking
  // En production, appeler l'API réelle du transporteur
  
  const statuses = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']
  const currentStatusIndex = Math.floor(Math.random() * statuses.length)
  const status = statuses[currentStatusIndex]
  
  const events = []
  for (let i = 0; i <= currentStatusIndex; i++) {
    const date = new Date()
    date.setHours(date.getHours() - (currentStatusIndex - i) * 12)
    
    events.push({
      timestamp: date.toISOString(),
      status: statuses[i],
      location: i === 0 ? 'Warehouse' : i === currentStatusIndex && status === 'delivered' ? 'Customer Address' : 'Transit Hub',
      description: getStatusDescription(statuses[i])
    })
  }
  
  const deliveredAt = status === 'delivered' ? new Date().toISOString() : null
  
  console.log(`[fetchTrackingFromCarrier] Fetched tracking for ${trackingNumber}: ${status}`)
  
  return {
    trackingNumber,
    status,
    events,
    deliveredAt,
    carrier: carrier.carrier_name
  }
}

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'created': 'Étiquette créée',
    'picked_up': 'Colis récupéré par le transporteur',
    'in_transit': 'En cours d\'acheminement',
    'out_for_delivery': 'En cours de livraison',
    'delivered': 'Livré au destinataire'
  }
  return descriptions[status] || status
}