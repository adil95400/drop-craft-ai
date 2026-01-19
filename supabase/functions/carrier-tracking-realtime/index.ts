import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackingEvent {
  timestamp: string
  location: string
  status: string
  description: string
}

interface TrackingResult {
  trackingNumber: string
  carrier: string
  carrierCode: string
  status: 'pending' | 'info_received' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'expired'
  statusDescription: string
  events: TrackingEvent[]
  estimatedDelivery: string | null
  originCountry: string | null
  destinationCountry: string | null
  lastUpdate: string
}

/**
 * Real-time carrier tracking using 17Track API
 * Supports 2000+ carriers worldwide including:
 * - Colissimo, Chronopost, La Poste (France)
 * - UPS, DHL, FedEx, TNT (International)
 * - Mondial Relay, Colis Privé, GLS (Europe)
 * - China Post, Yanwen, SF Express (China)
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

    const { action, trackingNumbers, userId, orderId } = await req.json()

    console.log(`[carrier-tracking-realtime] Action: ${action}`)

    switch (action) {
      case 'track_single':
        return await handleSingleTracking(supabaseClient, trackingNumbers[0], userId)
      
      case 'track_batch':
        return await handleBatchTracking(supabaseClient, trackingNumbers, userId)
      
      case 'sync_all':
        return await handleSyncAll(supabaseClient, userId)
      
      case 'register_webhook':
        return await handleRegisterWebhook(supabaseClient, trackingNumbers, userId)
      
      case 'get_carrier':
        return await handleDetectCarrier(trackingNumbers[0])
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('[carrier-tracking-realtime] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function handleSingleTracking(supabase: any, trackingNumber: string, userId: string) {
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY')
  
  if (!apiKey) {
    throw new Error('17Track API key not configured')
  }

  console.log(`[17Track] Tracking: ${trackingNumber}`)

  // First, detect the carrier
  const detectResponse = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      { number: trackingNumber }
    ])
  })

  if (!detectResponse.ok) {
    throw new Error(`17Track API error: ${detectResponse.status}`)
  }

  const data = await detectResponse.json()
  console.log('[17Track] Response:', JSON.stringify(data))

  if (data.code !== 0) {
    throw new Error(`17Track error: ${data.message}`)
  }

  const trackInfo = data.data?.accepted?.[0] || data.data?.rejected?.[0]
  
  if (!trackInfo) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Tracking number not found or invalid',
        trackingNumber
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const result = parseTrackingResult(trackInfo)

  // Update orders table with tracking info
  if (userId) {
    await updateOrderTracking(supabase, trackingNumber, result, userId)
  }

  return new Response(
    JSON.stringify({
      success: true,
      tracking: result
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBatchTracking(supabase: any, trackingNumbers: string[], userId: string) {
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY')
  
  if (!apiKey) {
    throw new Error('17Track API key not configured')
  }

  console.log(`[17Track] Batch tracking: ${trackingNumbers.length} numbers`)

  // 17Track allows up to 40 tracking numbers per request
  const batches = []
  for (let i = 0; i < trackingNumbers.length; i += 40) {
    batches.push(trackingNumbers.slice(i, i + 40))
  }

  const results: TrackingResult[] = []
  const errors: any[] = []

  for (const batch of batches) {
    try {
      const response = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
        method: 'POST',
        headers: {
          '17token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch.map(number => ({ number })))
      })

      if (!response.ok) {
        throw new Error(`17Track API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.code === 0 && data.data?.accepted) {
        for (const trackInfo of data.data.accepted) {
          const result = parseTrackingResult(trackInfo)
          results.push(result)
          
          // Update database
          await updateOrderTracking(supabase, result.trackingNumber, result, userId)
        }
      }

      if (data.data?.rejected) {
        for (const rejected of data.data.rejected) {
          errors.push({
            trackingNumber: rejected.number,
            error: rejected.error?.message || 'Rejected'
          })
        }
      }

    } catch (error) {
      console.error(`[17Track] Batch error:`, error)
      batch.forEach(num => errors.push({ trackingNumber: num, error: error.message }))
    }

    // Rate limiting - wait 100ms between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return new Response(
    JSON.stringify({
      success: true,
      tracked: results.length,
      failed: errors.length,
      results,
      errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleSyncAll(supabase: any, userId: string) {
  // Get all orders with tracking numbers that need updating
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, tracking_number, carrier, delivery_status')
    .eq('user_id', userId)
    .not('tracking_number', 'is', null)
    .in('delivery_status', ['pending', 'in_transit', 'out_for_delivery', 'info_received'])
    .limit(100)

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  console.log(`[Sync] Found ${orders?.length || 0} orders to sync`)

  if (!orders || orders.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        synced: 0,
        message: 'No orders need syncing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const trackingNumbers = orders.map((o: any) => o.tracking_number)
  
  // Use batch tracking
  const batchResponse = await handleBatchTracking(supabase, trackingNumbers, userId)
  const batchData = await batchResponse.json()

  return new Response(
    JSON.stringify({
      success: true,
      synced: batchData.tracked,
      failed: batchData.failed,
      details: batchData
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleRegisterWebhook(supabase: any, trackingNumbers: string[], userId: string) {
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  
  if (!apiKey) {
    throw new Error('17Track API key not configured')
  }

  // Register for push notifications
  const webhookUrl = `${supabaseUrl}/functions/v1/carrier-tracking-webhook`
  
  console.log(`[17Track] Registering webhook for ${trackingNumbers.length} numbers`)

  const response = await fetch('https://api.17track.net/track/v2.2/register', {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(trackingNumbers.map(number => ({
      number,
      webhook_url: webhookUrl,
      auto_detection: true
    })))
  })

  if (!response.ok) {
    throw new Error(`17Track webhook registration error: ${response.status}`)
  }

  const data = await response.json()
  console.log('[17Track] Webhook registration response:', JSON.stringify(data))

  return new Response(
    JSON.stringify({
      success: true,
      registered: data.data?.accepted?.length || 0,
      failed: data.data?.rejected?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDetectCarrier(trackingNumber: string) {
  const apiKey = Deno.env.get('SEVENTEENTRACK_API_KEY')
  
  if (!apiKey) {
    throw new Error('17Track API key not configured')
  }

  const response = await fetch('https://api.17track.net/track/v2.2/getcarrier', {
    method: 'POST',
    headers: {
      '17token': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{ number: trackingNumber }])
  })

  if (!response.ok) {
    throw new Error(`17Track carrier detection error: ${response.status}`)
  }

  const data = await response.json()
  
  const carrier = data.data?.accepted?.[0]
  
  return new Response(
    JSON.stringify({
      success: true,
      trackingNumber,
      carrier: carrier ? {
        code: carrier.carrier,
        name: getCarrierName(carrier.carrier),
        country: carrier.country
      } : null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function parseTrackingResult(trackInfo: any): TrackingResult {
  const track = trackInfo.track || {}
  const lastEvent = track.z0?.z || []
  
  // Map 17Track status codes to our statuses
  const statusMap: Record<number, TrackingResult['status']> = {
    0: 'pending',
    10: 'info_received',
    20: 'in_transit',
    30: 'in_transit',
    35: 'in_transit',
    40: 'out_for_delivery',
    50: 'delivered',
    60: 'exception',
    70: 'expired'
  }

  const events: TrackingEvent[] = lastEvent.map((event: any) => ({
    timestamp: event.a || new Date().toISOString(),
    location: event.c || '',
    status: event.z || '',
    description: event.d || event.z || ''
  }))

  return {
    trackingNumber: trackInfo.number,
    carrier: getCarrierName(track.e),
    carrierCode: String(track.e || ''),
    status: statusMap[track.e] || 'pending',
    statusDescription: getStatusDescription(track.e),
    events: events.reverse(), // Most recent first
    estimatedDelivery: track.z2?.d || null,
    originCountry: track.z0?.a || null,
    destinationCountry: track.z0?.b || null,
    lastUpdate: events[0]?.timestamp || new Date().toISOString()
  }
}

function getCarrierName(carrierCode: number): string {
  const carriers: Record<number, string> = {
    3: 'La Poste / Colissimo',
    100010: 'Chronopost',
    100001: 'UPS',
    100002: 'FedEx',
    100003: 'DHL',
    100004: 'TNT',
    190005: 'Mondial Relay',
    21051: 'GLS France',
    190003: 'Colis Privé',
    17: 'China Post',
    1: 'USPS',
    100: 'Royal Mail',
    7: 'Post NL',
    4: 'Deutsche Post',
    6: 'Correos',
    10: 'Japan Post',
    // Add more as needed
  }
  
  return carriers[carrierCode] || `Carrier ${carrierCode}`
}

function getStatusDescription(statusCode: number): string {
  const descriptions: Record<number, string> = {
    0: 'En attente de prise en charge',
    10: 'Information reçue par le transporteur',
    20: 'En transit',
    30: 'En cours d\'acheminement',
    35: 'Au centre de tri',
    40: 'En cours de livraison',
    50: 'Livré',
    60: 'Exception / Problème',
    70: 'Expiré'
  }
  
  return descriptions[statusCode] || 'Statut inconnu'
}

async function updateOrderTracking(supabase: any, trackingNumber: string, result: TrackingResult, userId: string) {
  // Map our status to order delivery_status
  const deliveryStatusMap: Record<string, string> = {
    'pending': 'pending',
    'info_received': 'pending',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'exception': 'failed',
    'expired': 'failed'
  }

  const { error } = await supabase
    .from('orders')
    .update({
      delivery_status: deliveryStatusMap[result.status] || 'pending',
      carrier: result.carrier,
      tracking_events: result.events,
      estimated_delivery_date: result.estimatedDelivery,
      last_tracking_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('tracking_number', trackingNumber)
    .eq('user_id', userId)

  if (error) {
    console.error(`[updateOrderTracking] Error:`, error)
  } else {
    console.log(`[updateOrderTracking] Updated order with tracking ${trackingNumber}`)
  }

  // If status is delivered, update fulfillment_status
  if (result.status === 'delivered') {
    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('tracking_number', trackingNumber)
      .eq('user_id', userId)
  }
}
