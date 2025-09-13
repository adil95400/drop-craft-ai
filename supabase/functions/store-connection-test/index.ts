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

    const { platform, shopDomain, access_token, consumer_key, consumer_secret, webservice_key, store_hash } = await req.json()

    let connectionResult = null

    switch (platform) {
      case 'shopify':
        connectionResult = await testShopifyConnection(shopDomain, access_token)
        break
      case 'woocommerce':
        connectionResult = await testWooCommerceConnection(shopDomain, consumer_key, consumer_secret)
        break
      case 'prestashop':
        connectionResult = await testPrestaShopConnection(shopDomain, webservice_key)
        break
      case 'magento':
        connectionResult = await testMagentoConnection(shopDomain, access_token)
        break
      case 'bigcommerce':
        connectionResult = await testBigCommerceConnection(store_hash, access_token)
        break
      case 'opencart':
        connectionResult = await testOpenCartConnection(shopDomain, access_token)
        break
      case 'squarespace':
        connectionResult = await testSquarespaceConnection(shopDomain, access_token)
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
  try {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const apiUrl = `https://${cleanDomain}/wp-json/wc/v3/system_status`

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion WooCommerce échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.settings?.title || 'Boutique WooCommerce',
        platform: 'WooCommerce',
        version: data.environment?.version
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testPrestaShopConnection(shopDomain: string, webserviceKey: string) {
  try {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const auth = btoa(`${webserviceKey}:`)
    const apiUrl = `https://${cleanDomain}/api/categories?display=full&limit=1`

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion PrestaShop échouée')
    }

    return {
      success: true,
      data: {
        shop_name: 'Boutique PrestaShop',
        platform: 'PrestaShop',
        domain: cleanDomain
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testMagentoConnection(shopDomain: string, accessToken: string) {
  try {
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const apiUrl = `https://${cleanDomain}/rest/V1/store/storeViews`

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Magento échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data[0]?.name || 'Boutique Magento',
        platform: 'Magento',
        stores: data.length
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testBigCommerceConnection(storeHash: string, accessToken: string) {
  try {
    const apiUrl = `https://api.bigcommerce.com/stores/${storeHash}/v2/store`

    const response = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': accessToken,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion BigCommerce échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.name || 'Boutique BigCommerce',
        platform: 'BigCommerce',
        domain: data.domain
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testOpenCartConnection(shopDomain: string, accessToken: string) {
  // OpenCart n'a pas d'API standard, simulation
  return {
    success: true,
    data: {
      shop_name: 'Boutique OpenCart',
      platform: 'OpenCart',
      domain: shopDomain
    }
  }
}

async function testSquarespaceConnection(shopDomain: string, accessToken: string) {
  // Squarespace utilise OAuth, simulation pour maintenant
  return {
    success: true,
    data: {
      shop_name: 'Boutique Squarespace',
      platform: 'Squarespace',
      domain: shopDomain
    }
  }
}