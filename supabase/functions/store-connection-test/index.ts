import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  platform: string
  credentials: any
}

async function testShopifyConnection(credentials: any) {
  try {
    const { shop_domain, access_token } = credentials;
    
    if (!shop_domain || !access_token) {
      return { success: false, error: 'Missing required Shopify credentials' }
    }

    const response = await fetch(
      `https://${shop_domain}/admin/api/2023-10/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': access_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Shopify API error: ${response.statusText} - ${errorText}` }
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connected to ${data.shop.name}`,
      shop_info: {
        name: data.shop.name,
        domain: data.shop.domain,
        currency: data.shop.currency
      }
    }
  } catch (error) {
    console.error('Shopify connection test error:', error);
    return { success: false, error: `Connection failed: ${error.message}` }
  }
}

async function testWooCommerceConnection(credentials: any) {
  try {
    const { shop_domain, consumer_key, consumer_secret } = credentials;
    
    if (!shop_domain || !consumer_key || !consumer_secret) {
      return { success: false, error: 'Missing required WooCommerce credentials' }
    }

    const authHeader = btoa(`${consumer_key}:${consumer_secret}`);
    
    const response = await fetch(
      `${shop_domain}/wp-json/wc/v3/system_status`,
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `WooCommerce API error: ${response.statusText} - ${errorText}` }
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connected to WooCommerce store`,
      shop_info: {
        name: data.settings?.title?.value || 'WooCommerce Store',
        version: data.version,
        currency: data.settings?.currency?.value || 'EUR'
      }
    }
  } catch (error) {
    console.error('WooCommerce connection test error:', error);
    return { success: false, error: `Connection failed: ${error.message}` }
  }
}

async function testPrestaShopConnection(credentials: any) {
  try {
    const { shop_domain, webservice_key } = credentials;
    
    if (!shop_domain || !webservice_key) {
      return { success: false, error: 'Missing required PrestaShop credentials' }
    }

    const response = await fetch(
      `${shop_domain}/api/shops?ws_key=${webservice_key}&output_format=JSON`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `PrestaShop API error: ${response.statusText} - ${errorText}` }
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connected to PrestaShop store`,
      shop_info: {
        name: 'PrestaShop Store',
        shops_count: data.shops?.length || 1
      }
    }
  } catch (error) {
    console.error('PrestaShop connection test error:', error);
    return { success: false, error: `Connection failed: ${error.message}` }
  }
}

async function testMagentoConnection(credentials: any) {
  try {
    const { shop_domain, access_token } = credentials;
    
    if (!shop_domain || !access_token) {
      return { success: false, error: 'Missing required Magento credentials' }
    }

    const response = await fetch(
      `${shop_domain}/rest/V1/store/storeConfigs`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Magento API error: ${response.statusText} - ${errorText}` }
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `Connected to Magento store`,
      shop_info: {
        name: 'Magento Store',
        stores_count: data.length || 1
      }
    }
  } catch (error) {
    console.error('Magento connection test error:', error);
    return { success: false, error: `Connection failed: ${error.message}` }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, credentials }: RequestBody = await req.json();

    if (!platform || !credentials) {
      throw new Error('Missing platform or credentials');
    }

    let result;

    switch (platform.toLowerCase()) {
      case 'shopify':
        result = await testShopifyConnection(credentials);
        break;
      case 'woocommerce':
        result = await testWooCommerceConnection(credentials);
        break;
      case 'prestashop':
        result = await testPrestaShopConnection(credentials);
        break;
      case 'magento':
        result = await testMagentoConnection(credentials);
        break;
      default:
        throw new Error(`Platform ${platform} not supported`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in store-connection-test:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});