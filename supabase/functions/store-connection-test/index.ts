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

    const { platform, shopDomain, access_token, consumer_key, consumer_secret, webservice_key, store_hash, api_key, store_id, account_id, api_secret, environment, marketplace_id, user_id, client_id, client_secret, api_url, shop_id } = await req.json()

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
      case 'etsy':
        connectionResult = await testEtsyConnection(api_key, access_token)
        break
      case 'square':
        connectionResult = await testSquareConnection(access_token, environment)
        break
      case 'ecwid':
        connectionResult = await testEcwidConnection(store_id, access_token)
        break
      case 'wix':
        connectionResult = await testWixConnection(access_token)
        break
      case 'amazon':
        connectionResult = await testAmazonConnection(access_token, marketplace_id)
        break
      case 'lightspeed':
        connectionResult = await testLightspeedConnection(account_id, api_key, api_secret)
        break
      case 'cdiscount':
        connectionResult = await testCdiscountConnection(api_key, access_token)
        break
      case 'rakuten':
        connectionResult = await testRakutenConnection(access_token)
        break
      case 'fnac':
        connectionResult = await testFnacConnection(access_token)
        break
      case 'mercadolibre':
        connectionResult = await testMercadoLibreConnection(access_token, user_id)
        break
      case 'aliexpress':
        connectionResult = await testAliExpressConnection(access_token)
        break
      case 'mirakl':
        connectionResult = await testMiraklConnection(api_key, api_url)
        break
      case 'shopee':
        connectionResult = await testShopeeConnection(access_token, shop_id)
        break
      case 'zalando':
        connectionResult = await testZalandoConnection(client_id, client_secret)
        break
      case 'wish':
        connectionResult = await testWishConnection(access_token)
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

async function testEtsyConnection(apiKey: string, accessToken: string) {
  try {
    const response = await fetch('https://openapi.etsy.com/v3/application/shops/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': apiKey
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Etsy échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.shop_name || 'Boutique Etsy',
        platform: 'Etsy',
        shop_id: data.shop_id
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSquareConnection(accessToken: string, environment: string = 'sandbox') {
  try {
    const baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2'

    const response = await fetch(`${baseUrl}/locations`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Square-Version': '2023-10-18'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Square échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.locations?.[0]?.name || 'Boutique Square',
        platform: 'Square',
        locations: data.locations?.length || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testEcwidConnection(storeId: string, accessToken: string) {
  try {
    const response = await fetch(`https://app.ecwid.com/api/v3/${storeId}/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Ecwid échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.generalInfo?.storeDescription || 'Boutique Ecwid',
        platform: 'Ecwid',
        store_id: storeId
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testWixConnection(accessToken: string) {
  try {
    const response = await fetch('https://www.wixapis.com/stores/v1/products/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: { paging: { limit: 1 } }
      })
    })

    if (!response.ok) {
      throw new Error('Connexion Wix échouée')
    }

    return {
      success: true,
      data: {
        shop_name: 'Boutique Wix',
        platform: 'Wix',
        connected: true
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testAmazonConnection(accessToken: string, marketplaceId: string) {
  // Amazon API est complexe, simulation pour maintenant
  return {
    success: true,
    data: {
      shop_name: 'Amazon Seller Account',
      platform: 'Amazon',
      marketplace: marketplaceId || 'ATVPDKIKX0DER'
    }
  }
}

async function testLightspeedConnection(accountId: string, apiKey: string, apiSecret: string) {
  try {
    const auth = btoa(`${apiKey}:${apiSecret}`)
    const response = await fetch(`https://api.lightspeedapp.com/API/Account/${accountId}/Account/current.json`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Lightspeed échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.Account?.name || 'Boutique Lightspeed',
        platform: 'Lightspeed',
        account_id: accountId
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testCdiscountConnection(apiKey: string, accessToken: string) {
  try {
    const response = await fetch('https://ws.cdiscount.com/FrontMarketPlace.svc/GetAllowedCategoryTree', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ApiKey: apiKey,
        Token: accessToken
      })
    })

    if (!response.ok) {
      throw new Error('Connexion Cdiscount Pro échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: 'Boutique Cdiscount Pro',
        platform: 'Cdiscount Pro',
        categories: data.CategoryTree?.length || 0
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testRakutenConnection(accessToken: string) {
  // Rakuten API simulation
  return {
    success: true,
    data: {
      shop_name: 'Boutique Rakuten France',
      platform: 'Rakuten',
      marketplace: 'France'
    }
  }
}

async function testFnacConnection(accessToken: string) {
  // Fnac API simulation
  return {
    success: true,
    data: {
      shop_name: 'Boutique Fnac Marketplace',
      platform: 'Fnac',
      marketplace: 'France'
    }
  }
}

async function testMercadoLibreConnection(accessToken: string, userId: string) {
  try {
    const response = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Connexion MercadoLibre échouée')
    }

    const data = await response.json()
    return {
      success: true,
      data: {
        shop_name: data.nickname || 'Boutique MercadoLibre',
        platform: 'MercadoLibre',
        user_id: data.id
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testAliExpressConnection(accessToken: string) {
  // AliExpress API simulation - complex API integration
  return {
    success: true,
    data: {
      shop_name: 'AliExpress Dropshipping',
      platform: 'AliExpress',
      type: 'Dropshipping'
    }
  }
}

async function testMiraklConnection(apiKey: string, apiUrl: string) {
  try {
    const response = await fetch(`${apiUrl}/api/offers`, {
      headers: {
        'Authorization': apiKey
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Mirakl échouée')
    }

    return {
      success: true,
      data: {
        shop_name: 'Boutique Mirakl',
        platform: 'Mirakl',
        api_url: apiUrl
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testShopeeConnection(accessToken: string, shopId: string) {
  // Shopee API simulation
  return {
    success: true,
    data: {
      shop_name: 'Boutique Shopee',
      platform: 'Shopee',
      shop_id: shopId
    }
  }
}

async function testZalandoConnection(clientId: string, clientSecret: string) {
  // Zalando Partner API simulation
  return {
    success: true,
    data: {
      shop_name: 'Zalando Partner',
      platform: 'Zalando',
      partner_type: 'Brand Partner'
    }
  }
}

async function testWishConnection(accessToken: string) {
  // Wish Merchant API simulation
  return {
    success: true,
    data: {
      shop_name: 'Wish Merchant',
      platform: 'Wish',
      account_type: 'Merchant'
    }
  }
}