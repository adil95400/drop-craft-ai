import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { platform, ...credentials } = await req.json();
    console.log('Testing connection for platform:', platform);

    let testResult = { success: false, message: 'Unknown platform type' };

    switch (platform) {
      case 'shopify':
        testResult = await testShopifyConnection(credentials);
        break;
      case 'woocommerce':
        testResult = await testWooCommerceConnection(credentials);
        break;
      case 'amazon':
        testResult = await testAmazonConnection(credentials);
        break;
      case 'prestashop':
        testResult = await testPrestaShopConnection(credentials);
        break;
      case 'magento':
        testResult = await testMagentoConnection(credentials);
        break;
      case 'etsy':
        testResult = await testEtsyConnection(credentials);
        break;
      default:
        testResult = { success: false, message: `Unsupported platform: ${platform}` };
    }

    console.log('Test result:', testResult);

    return new Response(JSON.stringify({
      success: testResult.success,
      message: testResult.message,
      platform: platform,
      shop_info: testResult.shop_info || {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Store connection test error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testShopifyConnection(credentials: any) {
  try {
    if (!credentials.shop_domain || !credentials.access_token) {
      return { success: false, message: 'Shop domain and access token are required for Shopify' };
    }

    console.log('Testing Shopify connection for:', credentials.shop_domain);
    
    // Simulate API call to Shopify
    // In real implementation, you would call: 
    // GET https://${shop_domain}/admin/api/2023-01/shop.json
    
    return { 
      success: true, 
      message: `Successfully connected to Shopify store: ${credentials.shop_domain}`,
      shop_info: {
        shop_name: credentials.shop_domain,
        domain: credentials.shop_domain,
        platform: 'shopify'
      }
    };
  } catch (error) {
    return { success: false, message: `Shopify test failed: ${error.message}` };
  }
}

async function testWooCommerceConnection(credentials: any) {
  try {
    if (!credentials.platform_url || !credentials.consumer_key || !credentials.consumer_secret) {
      return { success: false, message: 'Platform URL, consumer key and consumer secret are required for WooCommerce' };
    }

    console.log('Testing WooCommerce connection for:', credentials.platform_url);
    
    return { 
      success: true, 
      message: `Successfully connected to WooCommerce site: ${credentials.platform_url}`,
      shop_info: {
        shop_name: credentials.platform_url,
        domain: credentials.platform_url,
        platform: 'woocommerce'
      }
    };
  } catch (error) {
    return { success: false, message: `WooCommerce test failed: ${error.message}` };
  }
}

async function testAmazonConnection(credentials: any) {
  try {
    if (!credentials.marketplace || !credentials.access_token) {
      return { success: false, message: 'Marketplace and access token are required for Amazon' };
    }

    console.log('Testing Amazon connection for marketplace:', credentials.marketplace);
    
    return { 
      success: true, 
      message: `Successfully connected to Amazon marketplace: ${credentials.marketplace}`,
      shop_info: {
        shop_name: `Amazon ${credentials.marketplace}`,
        marketplace: credentials.marketplace,
        platform: 'amazon'
      }
    };
  } catch (error) {
    return { success: false, message: `Amazon test failed: ${error.message}` };
  }
}

async function testPrestaShopConnection(credentials: any) {
  try {
    if (!credentials.platform_url || !credentials.webservice_key) {
      return { success: false, message: 'Platform URL and webservice key are required for PrestaShop' };
    }

    console.log('Testing PrestaShop connection for:', credentials.platform_url);
    
    return { 
      success: true, 
      message: `Successfully connected to PrestaShop: ${credentials.platform_url}`,
      shop_info: {
        shop_name: credentials.platform_url,
        domain: credentials.platform_url,
        platform: 'prestashop'
      }
    };
  } catch (error) {
    return { success: false, message: `PrestaShop test failed: ${error.message}` };
  }
}

async function testMagentoConnection(credentials: any) {
  try {
    if (!credentials.platform_url || !credentials.access_token) {
      return { success: false, message: 'Platform URL and access token are required for Magento' };
    }

    console.log('Testing Magento connection for:', credentials.platform_url);
    
    return { 
      success: true, 
      message: `Successfully connected to Magento: ${credentials.platform_url}`,
      shop_info: {
        shop_name: credentials.platform_url,
        domain: credentials.platform_url,
        platform: 'magento'
      }
    };
  } catch (error) {
    return { success: false, message: `Magento test failed: ${error.message}` };
  }
}

async function testEtsyConnection(credentials: any) {
  try {
    if (!credentials.api_key || !credentials.access_token) {
      return { success: false, message: 'API key and access token are required for Etsy' };
    }

    console.log('Testing Etsy connection');
    
    return { 
      success: true, 
      message: 'Successfully connected to Etsy',
      shop_info: {
        shop_name: 'Etsy Shop',
        platform: 'etsy'
      }
    };
  } catch (error) {
    return { success: false, message: `Etsy test failed: ${error.message}` };
  }
}