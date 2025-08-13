import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, tracking_number, carrier } = await req.json()

    switch (action) {
      case 'track_package':
        return await trackPackage(tracking_number, carrier, supabaseClient)
      
      case 'get_carriers':
        return await getCarriers()
      
      case 'bulk_track':
        return await bulkTrack(req.json(), supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erreur tracking integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function trackPackage(trackingNumber: string, carrier: string, supabase: any) {
  try {
    const API_KEY = Deno.env.get('TRACK17_API_KEY')
    
    if (!API_KEY) {
      console.log('17Track API key not found, using mock data')
      return new Response(
        JSON.stringify({ 
          success: true, 
          tracking: generateMockTracking(trackingNumber),
          message: 'Suivi de colis (données de test)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Making real 17Track API call with key:', API_KEY.substring(0, 8) + '...')

    // Real 17track API call
    const response = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
      method: 'POST',
      headers: {
        '17token': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        number: trackingNumber,
        carrier: carrier || 'auto'
      }])
    })

    if (!response.ok) {
      throw new Error(`17Track API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.code === 0 && data.data?.accepted?.length > 0) {
      const trackingInfo = data.data.accepted[0].track
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          tracking: {
            number: trackingNumber,
            carrier: carrier,
            status: mapTrackingStatus(trackingInfo.latest_status),
            events: trackingInfo.z0?.map((event: any) => ({
              date: event.a,
              status: event.z,
              location: event.c
            })) || [],
            estimated_delivery: trackingInfo.z1?.z1a,
            location: trackingInfo.latest_event?.location || 'En transit'
          },
          message: 'Suivi de colis mis à jour'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (data.data?.rejected?.length > 0) {
      const rejection = data.data.rejected[0]
      throw new Error(`Erreur de suivi: ${rejection.error?.message || 'Numéro de suivi invalide'}`)
    } else {
      // Fallback to mock data for unknown tracking numbers
      return new Response(
        JSON.stringify({ 
          success: true, 
          tracking: generateMockTracking(trackingNumber),
          message: 'Numéro de suivi non trouvé dans l\'API, données simulées'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Tracking error:', error)
    // Fallback to mock data on API error
    return new Response(
      JSON.stringify({ 
        success: true, 
        tracking: generateMockTracking(trackingNumber),
        message: `Erreur API (${error.message}), données simulées`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getCarriers() {
  const carriers = [
    { code: 'china-post', name: 'China Post' },
    { code: 'china-ems', name: 'China EMS' },
    { code: 'yanwen', name: 'Yanwen' },
    { code: 'china-post-reg', name: 'China Post Registered' },
    { code: 'cainiao', name: 'Cainiao' },
    { code: 'dhl', name: 'DHL' },
    { code: 'fedex', name: 'FedEx' },
    { code: 'ups', name: 'UPS' },
    { code: 'usps', name: 'USPS' },
    { code: 'dpd', name: 'DPD' },
    { code: 'la-poste', name: 'La Poste' },
    { code: 'colissimo', name: 'Colissimo' },
    { code: 'chronopost', name: 'Chronopost' }
  ]

  return new Response(
    JSON.stringify({ success: true, carriers }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function bulkTrack(requestData: any, supabase: any) {
  try {
    const { tracking_numbers } = requestData
    const results = []

    for (const trackingInfo of tracking_numbers) {
      try {
        const result = await trackPackage(trackingInfo.number, trackingInfo.carrier, supabase)
        const data = await result.json()
        results.push({
          tracking_number: trackingInfo.number,
          success: data.success,
          tracking: data.tracking,
          error: data.error
        })
      } catch (error) {
        results.push({
          tracking_number: trackingInfo.number,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        total: tracking_numbers.length,
        successful: results.filter(r => r.success).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

function generateMockTracking(trackingNumber: string) {
  const statuses = ['pending', 'transit', 'out_for_delivery', 'delivered', 'exception']
  const events = [
    {
      date: '2024-01-10T10:00:00Z',
      status: 'Colis pris en charge',
      location: 'Centre de tri - France'
    },
    {
      date: '2024-01-11T14:30:00Z',
      status: 'En transit',
      location: 'Hub logistique - Paris'
    },
    {
      date: '2024-01-12T09:15:00Z',
      status: 'En cours de livraison',
      location: 'Bureau de poste local'
    }
  ]

  return {
    number: trackingNumber,
    carrier: 'la-poste',
    status: 'transit',
    events: events,
    estimated_delivery: '2024-01-13',
    location: 'En transit vers le destinataire'
  }
}

function mapTrackingStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    '10': 'pending',
    '20': 'transit', 
    '30': 'transit',
    '35': 'out_for_delivery',
    '40': 'delivered',
    '50': 'exception'
  }
  
  return statusMap[status] || 'unknown'
}