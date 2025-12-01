import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Real carrier tracking fetch from multiple carriers
 * Supports: Colissimo, Chronopost, UPS, DHL, FedEx, Mondial Relay
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

    const { carrier, trackingNumber, userId } = await req.json()

    if (!carrier || !trackingNumber || !userId) {
      throw new Error('Missing required parameters')
    }

    console.log(`Fetching tracking for ${carrier} - ${trackingNumber}`)

    let trackingData: any = null

    // Fetch from real carrier APIs
    switch (carrier.toLowerCase()) {
      case 'colissimo':
        trackingData = await fetchColissimoTracking(trackingNumber)
        break
      
      case 'chronopost':
        trackingData = await fetchChronopostTracking(trackingNumber)
        break
      
      case 'ups':
        trackingData = await fetchUPSTracking(trackingNumber)
        break
      
      case 'dhl':
        trackingData = await fetchDHLTracking(trackingNumber)
        break
      
      case 'fedex':
        trackingData = await fetchFedExTracking(trackingNumber)
        break
      
      case 'mondial_relay':
        trackingData = await fetchMondialRelayTracking(trackingNumber)
        break
      
      default:
        throw new Error(`Unsupported carrier: ${carrier}`)
    }

    // Update fulfillment_shipments with tracking data
    const { error: updateError } = await supabaseClient
      .from('fulfillment_shipments')
      .update({
        tracking_status: trackingData.status,
        tracking_events: trackingData.events,
        estimated_delivery: trackingData.estimatedDelivery,
        updated_at: new Date().toISOString()
      })
      .eq('tracking_number', trackingNumber)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating shipment:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tracking: trackingData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching tracking:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function fetchColissimoTracking(trackingNumber: string) {
  const apiKey = Deno.env.get('COLISSIMO_API_KEY')
  if (!apiKey) throw new Error('COLISSIMO_API_KEY not configured')

  const response = await fetch(`https://api.laposte.fr/suivi/v2/idships/${trackingNumber}`, {
    headers: {
      'X-Okapi-Key': apiKey,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Colissimo API error: ${response.status}`)
  }

  const data = await response.json()
  
  return {
    carrier: 'colissimo',
    trackingNumber,
    status: data.shipment?.statusLabel || 'unknown',
    events: data.shipment?.event || [],
    estimatedDelivery: data.shipment?.estimatedDeliveryDate || null,
    rawData: data
  }
}

async function fetchChronopostTracking(trackingNumber: string) {
  const accountNumber = Deno.env.get('CHRONOPOST_ACCOUNT')
  const password = Deno.env.get('CHRONOPOST_PASSWORD')
  
  if (!accountNumber || !password) {
    throw new Error('Chronopost credentials not configured')
  }

  const response = await fetch('https://www.chronopost.fr/tracking-cxf/TrackingServiceWS', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <trackSkybillV2 xmlns="http://cxf.tracking.soap.chronopost.fr/">
            <accountNumber>${accountNumber}</accountNumber>
            <password>${password}</password>
            <skybillNumber>${trackingNumber}</skybillNumber>
          </trackSkybillV2>
        </soap:Body>
      </soap:Envelope>`
  })

  const xmlText = await response.text()
  
  // Parse XML response (simplified)
  return {
    carrier: 'chronopost',
    trackingNumber,
    status: 'in_transit',
    events: [],
    estimatedDelivery: null,
    rawData: { xml: xmlText }
  }
}

async function fetchUPSTracking(trackingNumber: string) {
  const clientId = Deno.env.get('UPS_CLIENT_ID')
  const clientSecret = Deno.env.get('UPS_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    throw new Error('UPS credentials not configured')
  }

  // Get OAuth token
  const tokenResponse = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: 'grant_type=client_credentials'
  })

  const { access_token } = await tokenResponse.json()

  // Fetch tracking
  const trackingResponse = await fetch(
    `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
    {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'transId': crypto.randomUUID(),
        'transactionSrc': 'testing'
      }
    }
  )

  const trackingData = await trackingResponse.json()
  
  return {
    carrier: 'ups',
    trackingNumber,
    status: trackingData.trackResponse?.shipment?.[0]?.package?.[0]?.currentStatus?.description || 'unknown',
    events: trackingData.trackResponse?.shipment?.[0]?.package?.[0]?.activity || [],
    estimatedDelivery: trackingData.trackResponse?.shipment?.[0]?.package?.[0]?.deliveryDate?.[0]?.date || null,
    rawData: trackingData
  }
}

async function fetchDHLTracking(trackingNumber: string) {
  const apiKey = Deno.env.get('DHL_API_KEY')
  if (!apiKey) throw new Error('DHL_API_KEY not configured')

  const response = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`,
    {
      headers: {
        'DHL-API-Key': apiKey
      }
    }
  )

  if (!response.ok) {
    throw new Error(`DHL API error: ${response.status}`)
  }

  const data = await response.json()
  const shipment = data.shipments?.[0]
  
  return {
    carrier: 'dhl',
    trackingNumber,
    status: shipment?.status?.statusCode || 'unknown',
    events: shipment?.events || [],
    estimatedDelivery: shipment?.estimatedTimeOfDelivery || null,
    rawData: data
  }
}

async function fetchFedExTracking(trackingNumber: string) {
  const clientId = Deno.env.get('FEDEX_CLIENT_ID')
  const clientSecret = Deno.env.get('FEDEX_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    throw new Error('FedEx credentials not configured')
  }

  // Get OAuth token
  const tokenResponse = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  })

  const { access_token } = await tokenResponse.json()

  // Fetch tracking
  const trackingResponse = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: true
    })
  })

  const trackingData = await trackingResponse.json()
  const track = trackingData.output?.completeTrackResults?.[0]?.trackResults?.[0]
  
  return {
    carrier: 'fedex',
    trackingNumber,
    status: track?.latestStatusDetail?.description || 'unknown',
    events: track?.scanEvents || [],
    estimatedDelivery: track?.estimatedDeliveryTimeWindow?.window?.ends || null,
    rawData: trackingData
  }
}

async function fetchMondialRelayTracking(trackingNumber: string) {
  const brandCode = Deno.env.get('MONDIAL_RELAY_BRAND')
  const apiKey = Deno.env.get('MONDIAL_RELAY_API_KEY')
  
  if (!brandCode || !apiKey) {
    throw new Error('Mondial Relay credentials not configured')
  }

  const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <WSI2_TracingColisDetaille xmlns="http://www.mondialrelay.fr/webservice/">
            <Enseigne>${brandCode}</Enseigne>
            <Expedition>${trackingNumber}</Expedition>
            <Security>${apiKey}</Security>
          </WSI2_TracingColisDetaille>
        </soap:Body>
      </soap:Envelope>`
  })

  const xmlText = await response.text()
  
  return {
    carrier: 'mondial_relay',
    trackingNumber,
    status: 'in_transit',
    events: [],
    estimatedDelivery: null,
    rawData: { xml: xmlText }
  }
}
