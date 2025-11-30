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
      destinationCountry, 
      weight, 
      dimensions,
      criteria = 'cheapest' // 'cheapest', 'fastest', 'preferred'
    } = await req.json()

    console.log(`[carrier-select-auto] Selecting carrier for ${destinationCountry} using criteria: ${criteria}`)

    // Get active carriers for user
    const { data: carriers } = await supabase
      .from('fulfillment_carriers')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('connection_status', 'connected')

    if (!carriers || carriers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Aucun transporteur connecté',
        suggestion: 'Veuillez connecter au moins un transporteur'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Filter carriers supporting destination country
    const supportedCarriers = carriers.filter(carrier => 
      carrier.supported_countries.includes(destinationCountry) || 
      carrier.supported_countries.includes('*')
    )

    if (supportedCarriers.length === 0) {
      return new Response(JSON.stringify({ 
        error: `Aucun transporteur ne livre vers ${destinationCountry}`,
        available_carriers: carriers.map(c => c.carrier_name)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate pricing for each carrier
    const carrierQuotes = await Promise.all(
      supportedCarriers.map(carrier => 
        calculateCarrierQuote(carrier, destinationCountry, weight, dimensions)
      )
    )

    // Select best carrier based on criteria
    let selectedCarrier
    switch (criteria) {
      case 'cheapest':
        selectedCarrier = carrierQuotes.sort((a, b) => a.cost - b.cost)[0]
        break
      case 'fastest':
        selectedCarrier = carrierQuotes.sort((a, b) => a.deliveryDays - b.deliveryDays)[0]
        break
      case 'preferred':
        selectedCarrier = carrierQuotes.find(q => q.carrier.is_default) || carrierQuotes[0]
        break
      default:
        selectedCarrier = carrierQuotes[0]
    }

    console.log(`[carrier-select-auto] Selected ${selectedCarrier.carrier.carrier_name} (${criteria})`)

    return new Response(JSON.stringify({
      success: true,
      selected_carrier: selectedCarrier,
      all_quotes: carrierQuotes,
      criteria_used: criteria
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[carrier-select-auto] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function calculateCarrierQuote(
  carrier: any, 
  destinationCountry: string, 
  weight: number, 
  dimensions: any
) {
  // Simulation de calcul de tarif
  // En production, appeler l'API tarifaire du transporteur
  
  const baseCost = getBaseCostByCarrier(carrier.carrier_code)
  const weightCost = weight * 2.5
  const countryMultiplier = destinationCountry === 'FR' ? 1 : 1.5
  const cost = (baseCost + weightCost) * countryMultiplier
  
  const deliveryDays = getDeliveryDaysByCarrier(carrier.carrier_code, destinationCountry)
  
  return {
    carrier: {
      id: carrier.id,
      carrier_name: carrier.carrier_name,
      carrier_code: carrier.carrier_code,
      is_default: carrier.is_default
    },
    cost: Math.round(cost * 100) / 100,
    deliveryDays,
    currency: 'EUR'
  }
}

function getBaseCostByCarrier(code: string): number {
  const baseCosts: Record<string, number> = {
    'colissimo': 5.5,
    'chronopost': 8.0,
    'ups': 10.0,
    'dhl': 12.0,
    'fedex': 11.0,
    'mondial_relay': 4.0
  }
  return baseCosts[code] || 7.0
}

function getDeliveryDaysByCarrier(code: string, country: string): number {
  const isInternational = country !== 'FR'
  
  const deliveryDays: Record<string, { domestic: number, international: number }> = {
    'colissimo': { domestic: 2, international: 5 },
    'chronopost': { domestic: 1, international: 3 },
    'ups': { domestic: 2, international: 4 },
    'dhl': { domestic: 2, international: 3 },
    'fedex': { domestic: 2, international: 4 },
    'mondial_relay': { domestic: 3, international: 6 }
  }
  
  const carrier = deliveryDays[code] || { domestic: 3, international: 7 }
  return isInternational ? carrier.international : carrier.domestic
}