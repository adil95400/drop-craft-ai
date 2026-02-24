import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { carrierCode, credentials, isDefault } = await req.json()

    console.log(`[carrier-connect] Connecting ${carrierCode} for user ${userId}`)

    const validated = validateCarrierCredentials(carrierCode, credentials)
    if (!validated.success) {
      return errorResponse(validated.error!, corsHeaders, 400)
    }

    // RLS-scoped
    const { data: existing } = await supabase
      .from('fulfillment_carriers')
      .select('*')
      .eq('carrier_code', carrierCode)
      .single()

    let carrier
    if (existing) {
      const { data } = await supabase
        .from('fulfillment_carriers')
        .update({
          credentials, is_active: true, connection_status: 'connected',
          last_sync_at: new Date().toISOString(), is_default: isDefault || false,
        })
        .eq('id', existing.id)
        .select()
        .single()
      carrier = data
    } else {
      const { data } = await supabase
        .from('fulfillment_carriers')
        .insert({
          user_id: userId, carrier_name: getCarrierName(carrierCode),
          carrier_code: carrierCode, credentials,
          api_endpoint: getCarrierApiEndpoint(carrierCode),
          connection_status: 'connected', is_active: true,
          is_default: isDefault || false,
          supported_countries: getSupportedCountries(carrierCode),
          last_sync_at: new Date().toISOString(),
        })
        .select()
        .single()
      carrier = data
    }

    return successResponse({
      carrier, message: `${getCarrierName(carrierCode)} connecté avec succès`,
    }, corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error('[carrier-connect] Error:', error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message, getSecureCorsHeaders(origin), 500)
  }
})

function validateCarrierCredentials(carrierCode: string, credentials: any): { success: boolean; error?: string } {
  switch (carrierCode) {
    case 'colissimo':
    case 'chronopost':
      if (!credentials.accountNumber || !credentials.password) return { success: false, error: 'Numéro de compte et mot de passe requis' }
      break
    case 'ups':
      if (!credentials.accessKey || !credentials.username || !credentials.password) return { success: false, error: 'Access key, username et password requis' }
      break
    case 'dhl':
      if (!credentials.apiKey || !credentials.apiSecret) return { success: false, error: 'API key et secret requis' }
      break
    case 'fedex':
      if (!credentials.apiKey || !credentials.secretKey) return { success: false, error: 'API key et secret requis' }
      break
    case 'mondial_relay':
      if (!credentials.apiKey) return { success: false, error: 'API key requis' }
      break
    default:
      return { success: false, error: 'Transporteur non supporté' }
  }
  return { success: true }
}

function getCarrierName(code: string): string {
  const names: Record<string, string> = { colissimo: 'Colissimo', chronopost: 'Chronopost', ups: 'UPS', dhl: 'DHL', fedex: 'FedEx', mondial_relay: 'Mondial Relay' }
  return names[code] || code
}

function getCarrierApiEndpoint(code: string): string {
  const endpoints: Record<string, string> = { colissimo: 'https://ws.colissimo.fr', chronopost: 'https://ws.chronopost.fr', ups: 'https://onlinetools.ups.com/api', dhl: 'https://api.dhl.com', fedex: 'https://apis.fedex.com', mondial_relay: 'https://api.mondialrelay.com' }
  return endpoints[code] || ''
}

function getSupportedCountries(code: string): string[] {
  const countries: Record<string, string[]> = { colissimo: ['FR', 'BE', 'LU', 'CH', 'MC'], chronopost: ['FR', 'BE', 'LU', 'CH', 'MC', 'ES', 'IT', 'DE'], ups: ['*'], dhl: ['*'], fedex: ['*'], mondial_relay: ['FR', 'BE', 'LU', 'ES', 'NL'] }
  return countries[code] || ['FR']
}
