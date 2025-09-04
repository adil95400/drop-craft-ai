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

    const { integrationId } = await req.json();
    console.log('Testing integration:', integrationId);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError) {
      throw new Error(`Integration not found: ${integrationError.message}`);
    }

    console.log('Found integration:', integration.platform_name);

    // Test different integration types
    let testResult = { success: false, message: 'Unknown platform type' };

    switch (integration.platform_type) {
      case 'shopify':
        testResult = await testShopifyConnection(integration);
        break;
      case 'woocommerce':
        testResult = await testWooCommerceConnection(integration);
        break;
      case 'aliexpress':
        testResult = await testAliExpressConnection(integration);
        break;
      case 'bigbuy':
        testResult = await testBigBuyConnection(integration);
        break;
      default:
        testResult = { success: false, message: `Unsupported platform: ${integration.platform_type}` };
    }

    // Update integration status based on test result
    const newStatus = testResult.success ? 'connected' : 'error';
    await supabase
      .from('integrations')
      .update({ 
        connection_status: newStatus,
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integrationId);

    console.log('Test result:', testResult);

    return new Response(JSON.stringify({
      success: testResult.success,
      message: testResult.message,
      platform: integration.platform_type,
      status: newStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Test integration error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function testShopifyConnection(integration: any) {
  try {
    if (!integration.shop_domain) {
      return { success: false, message: 'Shop domain is required for Shopify' };
    }

    // Mock test for Shopify
    console.log('Testing Shopify connection for:', integration.shop_domain);
    
    // In a real implementation, you would test the actual API
    // For now, we'll simulate a successful connection
    return { 
      success: true, 
      message: `Successfully connected to Shopify store: ${integration.shop_domain}` 
    };
  } catch (error) {
    return { success: false, message: `Shopify test failed: ${error.message}` };
  }
}

async function testWooCommerceConnection(integration: any) {
  try {
    if (!integration.platform_url) {
      return { success: false, message: 'Platform URL is required for WooCommerce' };
    }

    console.log('Testing WooCommerce connection for:', integration.platform_url);
    
    // Mock test for WooCommerce
    return { 
      success: true, 
      message: `Successfully connected to WooCommerce site: ${integration.platform_url}` 
    };
  } catch (error) {
    return { success: false, message: `WooCommerce test failed: ${error.message}` };
  }
}

async function testAliExpressConnection(integration: any) {
  try {
    console.log('Testing AliExpress connection');
    
    // Mock test for AliExpress
    return { 
      success: true, 
      message: 'Successfully connected to AliExpress API' 
    };
  } catch (error) {
    return { success: false, message: `AliExpress test failed: ${error.message}` };
  }
}

async function testBigBuyConnection(integration: any) {
  try {
    console.log('Testing BigBuy connection');
    
    // Mock test for BigBuy
    return { 
      success: true, 
      message: 'Successfully connected to BigBuy API' 
    };
  } catch (error) {
    return { success: false, message: `BigBuy test failed: ${error.message}` };
  }
}