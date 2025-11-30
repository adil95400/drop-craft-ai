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

    const { carrierCode, credentials, isDefault } = await req.json()

    console.log(`[carrier-connect] Connecting ${carrierCode} for user ${user.id}`)

    // Validate credentials based on carrier
    const validated = await validateCarrierCredentials(carrierCode, credentials)
    
    if (!validated.success) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validated.error 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create or update carrier connection
    const { data: existing } = await supabase
      .from('fulfillment_carriers')
      .select('*')
      .eq('user_id', user.id)
      .eq('carrier_code', carrierCode)
      .single()

    let carrier
    if (existing) {
      const { data } = await supabase
        .from('fulfillment_carriers')
        .update({
          credentials,
          is_active: true,
          connection_status: 'connected',
          last_sync_at: new Date().toISOString(),
          is_default: isDefault || false
        })
        .eq('id', existing.id)
        .select()
        .single()
      carrier = data
    } else {
      const { data } = await supabase
        .from('fulfillment_carriers')
        .insert({
          user_id: user.id,
          carrier_name: getCarrierName(carrierCode),
          carrier_code: carrierCode,
          credentials,
          api_endpoint: getCarrierApiEndpoint(carrierCode),
          connection_status: 'connected',
          is_active: true,
          is_default: isDefault || false,
          supported_countries: getSupportedCountries(carrierCode),
          last_sync_at: new Date().toISOString()
        })
        .select()
        .single()
      carrier = data
    }

    console.log(`[carrier-connect] Successfully connected ${carrierCode}`)

    return new Response(JSON.stringify({
      success: true,
      carrier,
      message: `${getCarrierName(carrierCode)} connecté avec succès`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[carrier-connect] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function validateCarrierCredentials(carrierCode: string, credentials: any) {
  try {
    switch (carrierCode) {
      case 'colissimo':
        if (!credentials.accountNumber || !credentials.password) {
          return { success: false, error: 'Numéro de compte et mot de passe requis' }
        }
        // Test API Colissimo
        break
      
      case 'chronopost':
        if (!credentials.accountNumber || !credentials.password) {
          return { success: false, error: 'Numéro de compte et mot de passe requis' }
        }
        break
      
      case 'ups':
        if (!credentials.accessKey || !credentials.username || !credentials.password) {
          return { success: false, error: 'Access key, username et password requis' }
        }
        break
      
      case 'dhl':
        if (!credentials.apiKey || !credentials.apiSecret) {
          return { success: false, error: 'API key et secret requis' }
        }
        break
      
      case 'fedex':
        if (!credentials.apiKey || !credentials.secretKey) {
          return { success: false, error: 'API key et secret requis' }
        }
        break
      
      case 'mondial_relay':
        if (!credentials.apiKey) {
          return { success: false, error: 'API key requis' }
        }
        break
      
      default:
        return { success: false, error: 'Transporteur non supporté' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function getCarrierName(code: string): string {
  const names: Record<string, string> = {
    'colissimo': 'Colissimo',
    'chronopost': 'Chronopost',
    'ups': 'UPS',
    'dhl': 'DHL',
    'fedex': 'FedEx',
    'mondial_relay': 'Mondial Relay'
  }
  return names[code] || code
}

function getCarrierApiEndpoint(code: string): string {
  const endpoints: Record<string, string> = {
    'colissimo': 'https://ws.colissimo.fr',
    'chronopost': 'https://ws.chronopost.fr',
    'ups': 'https://onlinetools.ups.com/api',
    'dhl': 'https://api.dhl.com',
    'fedex': 'https://apis.fedex.com',
    'mondial_relay': 'https://api.mondialrelay.com'
  }
  return endpoints[code] || ''
}

function getSupportedCountries(code: string): string[] {
  const countries: Record<string, string[]> = {
    'colissimo': ['FR', 'BE', 'LU', 'CH', 'MC'],
    'chronopost': ['FR', 'BE', 'LU', 'CH', 'MC', 'ES', 'IT', 'DE'],
    'ups': ['*'], // Worldwide
    'dhl': ['*'], // Worldwide
    'fedex': ['*'], // Worldwide
    'mondial_relay': ['FR', 'BE', 'LU', 'ES', 'NL']
  }
  return countries[code] || ['FR']
}