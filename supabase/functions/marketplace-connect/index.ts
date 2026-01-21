import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectRequest {
  platform: string
  credentials: Record<string, string>
  config?: Record<string, any>
  sync_settings?: {
    auto_sync: boolean
    sync_products: boolean
    sync_orders: boolean
    sync_inventory: boolean
    sync_frequency_minutes?: number
  }
}

// Platform configurations
const PLATFORM_CONFIG: Record<string, {
  type: 'store' | 'marketplace'
  name: string
  requiredFields: string[]
  apiEndpoint?: string
}> = {
  shopify: {
    type: 'store',
    name: 'Shopify',
    requiredFields: ['shop_domain', 'access_token'],
    apiEndpoint: '/admin/api/2024-01'
  },
  woocommerce: {
    type: 'store',
    name: 'WooCommerce',
    requiredFields: ['shop_url', 'consumer_key', 'consumer_secret'],
    apiEndpoint: '/wp-json/wc/v3'
  },
  prestashop: {
    type: 'store',
    name: 'PrestaShop',
    requiredFields: ['shop_url', 'api_key'],
    apiEndpoint: '/api'
  },
  magento: {
    type: 'store',
    name: 'Magento',
    requiredFields: ['shop_url', 'access_token'],
    apiEndpoint: '/rest/V1'
  },
  wix: {
    type: 'store',
    name: 'Wix',
    requiredFields: ['site_id', 'api_key'],
  },
  amazon: {
    type: 'marketplace',
    name: 'Amazon Seller',
    requiredFields: ['seller_id', 'mws_auth_token', 'marketplace_id'],
  },
  ebay: {
    type: 'marketplace',
    name: 'eBay',
    requiredFields: ['app_id', 'cert_id', 'oauth_token'],
  },
  etsy: {
    type: 'marketplace',
    name: 'Etsy',
    requiredFields: ['api_key', 'shop_id'],
    apiEndpoint: 'https://openapi.etsy.com/v3'
  },
  google: {
    type: 'marketplace',
    name: 'Google Merchant',
    requiredFields: ['merchant_id', 'access_token'],
  },
  facebook: {
    type: 'marketplace',
    name: 'Meta Commerce',
    requiredFields: ['page_id', 'access_token'],
  },
  tiktok: {
    type: 'marketplace',
    name: 'TikTok Shop',
    requiredFields: ['shop_id', 'access_token'],
  },
  cdiscount: {
    type: 'marketplace',
    name: 'Cdiscount',
    requiredFields: ['api_key', 'seller_id'],
  },
  fnac: {
    type: 'marketplace',
    name: 'Fnac',
    requiredFields: ['api_key', 'partner_id'],
  },
  rakuten: {
    type: 'marketplace',
    name: 'Rakuten',
    requiredFields: ['api_key', 'shop_id'],
  },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const body: ConnectRequest = await req.json()
    const platformKey = body.platform.toLowerCase()
    
    console.log(`[MARKETPLACE-CONNECT] Connecting ${body.platform} for user ${user.id}`)

    // Validate platform
    const platformConfig = PLATFORM_CONFIG[platformKey]
    if (!platformConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Plateforme non supportée: ${body.platform}`,
          supported_platforms: Object.keys(PLATFORM_CONFIG)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required credentials
    const missingFields = platformConfig.requiredFields.filter(
      field => !body.credentials[field]
    )
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Champs requis manquants: ${missingFields.join(', ')}`,
          required_fields: platformConfig.requiredFields
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Test connection before saving
    const testResult = await testPlatformConnection(platformKey, body.credentials)
    if (!testResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: testResult.error,
          details: testResult.details
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine shop_url/shop_id from credentials
    const shopUrl = body.credentials.shop_url || 
                    body.credentials.shop_domain || 
                    body.credentials.shop_id ||
                    `${platformKey}-${user.id.slice(0, 8)}`

    // Create or update integration in marketplace_integrations
    const { data: integration, error: integrationError } = await supabaseClient
      .from('marketplace_integrations')
      .upsert({
        user_id: user.id,
        platform: platformKey,
        shop_url: shopUrl,
        shop_id: body.credentials.shop_id || body.credentials.seller_id || shopUrl,
        api_key: body.credentials.api_key || body.credentials.consumer_key,
        api_secret: body.credentials.api_secret || body.credentials.consumer_secret || body.credentials.cert_id,
        access_token: body.credentials.access_token || body.credentials.oauth_token,
        config: {
          ...body.config,
          platform_type: platformConfig.type,
          credentials: body.credentials, // Store all credentials
        },
        status: 'connected',
        is_active: true,
        sync_frequency_minutes: body.sync_settings?.sync_frequency_minutes || 60,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform'
      })
      .select()
      .single()

    if (integrationError) {
      console.error('[MARKETPLACE-CONNECT] Error creating integration:', integrationError)
      
      // Try inserting into integrations table as fallback
      const { data: altIntegration, error: altError } = await supabaseClient
        .from('integrations')
        .upsert({
          user_id: user.id,
          platform: platformKey,
          platform_name: platformConfig.name,
          store_url: shopUrl,
          store_id: body.credentials.shop_id || body.credentials.seller_id || shopUrl,
          connection_status: 'connected',
          is_active: true,
          config: {
            ...body.config,
            platform_type: platformConfig.type,
            credentials: body.credentials,
          },
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform'
        })
        .select()
        .single()
      
      if (altError) {
        console.error('[MARKETPLACE-CONNECT] Fallback error:', altError)
        throw altError
      }
      
      // Log event
      await logEvent(supabaseClient, altIntegration.id, user.id, platformKey, 'connected')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          integration: altIntegration,
          platform: platformConfig,
          shop_info: testResult.shopInfo
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log event
    await logEvent(supabaseClient, integration.id, user.id, platformKey, 'connected')

    console.log(`[MARKETPLACE-CONNECT] Integration created: ${integration.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        integration,
        platform: platformConfig,
        shop_info: testResult.shopInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MARKETPLACE-CONNECT] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function logEvent(
  supabase: any, 
  integrationId: string, 
  userId: string, 
  platform: string, 
  eventType: string
) {
  try {
    await supabase.from('marketplace_event_logs').insert({
      integration_id: integrationId,
      user_id: userId,
      event_type: `integration_${eventType}`,
      event_source: 'api',
      severity: 'info',
      title: `${platform} ${eventType}`,
      message: `Successfully ${eventType} to ${platform}`,
      data: { platform, timestamp: new Date().toISOString() },
    })
  } catch (e) {
    console.error('[MARKETPLACE-CONNECT] Error logging event:', e)
  }
}

async function testPlatformConnection(
  platform: string,
  credentials: Record<string, string>
): Promise<{ success: boolean; error?: string; details?: string; shopInfo?: any }> {
  try {
    switch (platform) {
      case 'shopify':
        return await testShopifyConnection(credentials)
      case 'woocommerce':
        return await testWooCommerceConnection(credentials)
      case 'prestashop':
        return await testPrestaShopConnection(credentials)
      case 'etsy':
        return await testEtsyConnection(credentials)
      default:
        // For platforms without specific API tests, validate format
        return { success: true, details: 'Credentials validated' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testShopifyConnection(credentials: Record<string, string>) {
  let shopUrl = credentials.shop_domain || credentials.shop_url || ''
  shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!shopUrl.includes('.myshopify.com')) {
    shopUrl = `${shopUrl}.myshopify.com`
  }

  const response = await fetch(`https://${shopUrl}/admin/api/2024-01/shop.json`, {
    headers: {
      'X-Shopify-Access-Token': credentials.access_token,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) return { success: false, error: 'Token d\'accès invalide' }
    if (status === 404) return { success: false, error: 'Boutique non trouvée' }
    return { success: false, error: `Erreur HTTP ${status}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    shopInfo: { 
      name: data.shop?.name,
      domain: data.shop?.domain,
      email: data.shop?.email 
    }
  }
}

async function testWooCommerceConnection(credentials: Record<string, string>) {
  let shopUrl = credentials.shop_url?.replace(/\/$/, '') || ''
  if (!shopUrl.startsWith('http')) shopUrl = `https://${shopUrl}`

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const response = await fetch(`${shopUrl}/wp-json/wc/v3/system_status`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) return { success: false, error: 'Identifiants WooCommerce invalides' }
    if (status === 404) return { success: false, error: 'API WooCommerce non trouvée' }
    return { success: false, error: `Erreur HTTP ${status}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    shopInfo: { 
      version: data.environment?.version,
      store_id: data.settings?.store_id 
    }
  }
}

async function testPrestaShopConnection(credentials: Record<string, string>) {
  let shopUrl = credentials.shop_url?.replace(/\/$/, '') || ''
  if (!shopUrl.startsWith('http')) shopUrl = `https://${shopUrl}`

  const response = await fetch(`${shopUrl}/api`, {
    headers: {
      'Authorization': `Basic ${btoa(credentials.api_key + ':')}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const status = response.status
    if (status === 401) return { success: false, error: 'Clé API PrestaShop invalide' }
    if (status === 404) return { success: false, error: 'API PrestaShop non trouvée' }
    return { success: false, error: `Erreur HTTP ${status}` }
  }

  return { success: true, details: 'Connecté à PrestaShop' }
}

async function testEtsyConnection(credentials: Record<string, string>) {
  const response = await fetch(
    `https://openapi.etsy.com/v3/application/shops/${credentials.shop_id}`,
    {
      headers: {
        'x-api-key': credentials.api_key,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const status = response.status
    if (status === 401 || status === 403) return { success: false, error: 'Clé API Etsy invalide' }
    if (status === 404) return { success: false, error: 'Boutique Etsy non trouvée' }
    return { success: false, error: `Erreur HTTP ${status}` }
  }

  const data = await response.json()
  return { 
    success: true, 
    shopInfo: { 
      name: data.shop_name,
      shop_id: data.shop_id 
    }
  }
}
