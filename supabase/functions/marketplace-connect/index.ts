import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectRequest {
  platform: string
  credentials: {
    api_key?: string
    api_secret?: string
    shop_url?: string
    shop_id?: string
    access_token?: string
  }
  config?: Record<string, any>
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const body: ConnectRequest = await req.json()
    
    console.log(`[MARKETPLACE-CONNECT] Connecting ${body.platform} for user ${user.id}`)

    // Validate platform
    const validPlatforms = ['shopify', 'woocommerce', 'etsy', 'cdiscount', 'allegro', 'manomano', 'amazon', 'ebay']
    if (!validPlatforms.includes(body.platform)) {
      throw new Error(`Invalid platform: ${body.platform}`)
    }

    // Validate credentials based on platform
    const isValid = await validatePlatformCredentials(body.platform, body.credentials)
    if (!isValid.success) {
      return new Response(
        JSON.stringify({ error: isValid.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('marketplace_integrations')
      .upsert({
        user_id: user.id,
        platform: body.platform,
        api_key: body.credentials.api_key,
        api_secret: body.credentials.api_secret,
        shop_url: body.credentials.shop_url,
        shop_id: body.credentials.shop_id || body.credentials.shop_url,
        access_token: body.credentials.access_token,
        config: body.config || {},
        status: 'connected',
        is_active: true,
      })
      .select()
      .single()

    if (integrationError) {
      console.error('[MARKETPLACE-CONNECT] Error creating integration:', integrationError)
      throw integrationError
    }

    // Log event
    await supabaseClient.from('marketplace_event_logs').insert({
      integration_id: integration.id,
      user_id: user.id,
      event_type: 'integration_connected',
      event_source: 'api',
      severity: 'info',
      title: `${body.platform} connected`,
      message: `Successfully connected to ${body.platform}`,
      data: { platform: body.platform },
    })

    console.log(`[MARKETPLACE-CONNECT] Integration created: ${integration.id}`)

    return new Response(
      JSON.stringify({ success: true, integration }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MARKETPLACE-CONNECT] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function validatePlatformCredentials(
  platform: string,
  credentials: ConnectRequest['credentials']
): Promise<{ success: boolean; error?: string }> {
  // Validation based on platform requirements
  switch (platform) {
    case 'shopify':
      if (!credentials.shop_url || !credentials.access_token) {
        return { success: false, error: 'Shopify requires shop_url and access_token' }
      }
      break
    
    case 'woocommerce':
      if (!credentials.shop_url || !credentials.api_key || !credentials.api_secret) {
        return { success: false, error: 'WooCommerce requires shop_url, api_key, and api_secret' }
      }
      break
    
    case 'etsy':
      if (!credentials.api_key || !credentials.shop_id) {
        return { success: false, error: 'Etsy requires api_key and shop_id' }
      }
      break
    
    case 'cdiscount':
      if (!credentials.api_key) {
        return { success: false, error: 'Cdiscount requires api_key' }
      }
      break
    
    case 'allegro':
      if (!credentials.api_key || !credentials.access_token) {
        return { success: false, error: 'Allegro requires api_key and access_token' }
      }
      break
    
    case 'manomano':
      if (!credentials.api_key || !credentials.shop_id) {
        return { success: false, error: 'ManoMano requires api_key and shop_id' }
      }
      break
    
    default:
      return { success: true }
  }

  return { success: true }
}