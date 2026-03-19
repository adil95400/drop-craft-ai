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
    case 'gls':
    case 'dpd':
    case 'postnl':
    case 'correos':
    case 'bpost':
    case 'poste_italiane':
    case 'hermes':
    case 'royal_mail':
    case 'yun_express':
    case 'cainiao':
    case 'yanwen':
      if (!credentials.apiKey) return { success: false, error: 'API key requis' }
      break
    case 'la_poste':
      if (!credentials.apiKey) return { success: false, error: 'Clé API La Poste requise (developer.laposte.fr)' }
      break
    case 'dpd_fr':
      if (!credentials.accountNumber || !credentials.password) return { success: false, error: 'Numéro de compte et mot de passe DPD requis' }
      break
    case 'tnt':
      if (!credentials.username || !credentials.password) return { success: false, error: 'Username et password TNT requis' }
      break
    default:
      return { success: false, error: 'Transporteur non supporté' }
  }
  return { success: true }
}

function getCarrierName(code: string): string {
  const names: Record<string, string> = {
    colissimo: 'Colissimo', chronopost: 'Chronopost', ups: 'UPS', dhl: 'DHL Express',
    fedex: 'FedEx', mondial_relay: 'Mondial Relay', la_poste: 'La Poste',
    gls: 'GLS', dpd: 'DPD', dpd_fr: 'DPD France', postnl: 'PostNL',
    correos: 'Correos', bpost: 'bpost', poste_italiane: 'Poste Italiane',
    hermes: 'Evri (Hermes)', royal_mail: 'Royal Mail', tnt: 'TNT/FedEx',
    yun_express: 'YunExpress', cainiao: 'Cainiao', yanwen: 'Yanwen',
  }
  return names[code] || code
}

function getCarrierApiEndpoint(code: string): string {
  const endpoints: Record<string, string> = {
    colissimo: 'https://ws.colissimo.fr',
    chronopost: 'https://ws.chronopost.fr',
    ups: 'https://onlinetools.ups.com/api',
    dhl: 'https://api.dhl.com',
    fedex: 'https://apis.fedex.com',
    mondial_relay: 'https://api.mondialrelay.com',
    la_poste: 'https://api.laposte.fr/suivi/v2',
    gls: 'https://api.gls-group.eu/public/v1',
    dpd: 'https://public-api.dpd.com/v1',
    dpd_fr: 'https://e-station.dpd.fr/api',
    postnl: 'https://api.postnl.nl/v1',
    correos: 'https://api.correos.es',
    bpost: 'https://api.bpost.be',
    poste_italiane: 'https://api.posteitaliane.it',
    hermes: 'https://api.evri.com/v1',
    royal_mail: 'https://api.royalmail.net/shipping/v3',
    tnt: 'https://express.tnt.com/expressconnect',
    yun_express: 'https://api.yunexpress.com/LMS.API',
    cainiao: 'https://global.cainiao.com/global/api',
    yanwen: 'https://api.yanwen.com/api',
  }
  return endpoints[code] || ''
}

function getSupportedCountries(code: string): string[] {
  const countries: Record<string, string[]> = {
    colissimo: ['FR', 'BE', 'LU', 'CH', 'MC'],
    chronopost: ['FR', 'BE', 'LU', 'CH', 'MC', 'ES', 'IT', 'DE', 'GB', 'NL', 'PT'],
    ups: ['*'], dhl: ['*'], fedex: ['*'], tnt: ['*'],
    mondial_relay: ['FR', 'BE', 'LU', 'ES', 'NL', 'PT', 'AT', 'IT'],
    la_poste: ['FR', 'BE', 'LU', 'CH', 'MC', 'GP', 'MQ', 'RE', 'GF'],
    gls: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'AT', 'PT', 'CZ', 'PL', 'HU', 'RO', 'DK', 'IE', 'HR'],
    dpd: ['FR', 'DE', 'GB', 'ES', 'IT', 'BE', 'NL', 'AT', 'PL', 'PT', 'CZ', 'CH'],
    dpd_fr: ['FR'],
    postnl: ['NL', 'BE', 'DE'],
    correos: ['ES', 'PT'],
    bpost: ['BE', 'LU'],
    poste_italiane: ['IT'],
    hermes: ['GB', 'DE'],
    royal_mail: ['GB'],
    yun_express: ['CN', '*'],
    cainiao: ['CN', '*'],
    yanwen: ['CN', '*'],
  }
  return countries[code] || ['FR']
}
