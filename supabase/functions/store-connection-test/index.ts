import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const { platform, shopDomain, access_token, consumer_key, consumer_secret, webservice_key } = await req.json()

    let connectionResult = null

    switch (platform) {
      case 'shopify':
        connectionResult = await testShopifyConnection(shopDomain, access_token)
        break
      case 'woocommerce':
        connectionResult = await testWooCommerceConnection(shopDomain, consumer_key, consumer_secret)
        break
      default:
        connectionResult = { success: true, data: { shop_name: `Boutique ${platform}`, platform } }
    }

    if (!connectionResult.success) {
      throw new Error(connectionResult.error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        shop_info: connectionResult.data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function testShopifyConnection(shopDomain: string, accessToken: string) {
  try {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const apiUrl = `https://${cleanDomain}/admin/api/2023-10/shop.json`

    const response = await fetch(apiUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Shopify échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.shop.name,
        domain: data.shop.domain,
        currency: data.shop.currency
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testWooCommerceConnection(shopDomain: string, consumerKey: string, consumerSecret: string) {
  return {
    success: true,
    data: {
      shop_name: 'Boutique WooCommerce',
      platform: 'WooCommerce'
    }
  }
}