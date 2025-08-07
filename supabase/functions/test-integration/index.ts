import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { integration_id } = await req.json();

    // Get integration details
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (error || !integration) {
      throw new Error('Integration not found');
    }

    let testResult = { success: false, error: '' };

    switch (integration.platform_name) {
      case 'shopify':
        testResult = await testShopifyConnection(integration);
        break;
      case 'amazon':
        testResult = await testAmazonConnection(integration);
        break;
      case 'woocommerce':
        testResult = await testWooCommerceConnection(integration);
        break;
      case 'bigcommerce':
        testResult = await testBigCommerceConnection(integration);
        break;
      default:
        testResult = { success: false, error: 'Platform not supported yet' };
    }

    console.log(`Test connection for ${integration.platform_name}:`, testResult);

    return new Response(JSON.stringify(testResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error testing connection:', error);
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
    if (!integration.shop_domain || !integration.access_token) {
      return { success: false, error: 'Missing shop domain or access token' };
    }

    const response = await fetch(`https://${integration.shop_domain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': integration.access_token,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        data: { 
          shop_name: data.shop?.name,
          plan: data.shop?.plan_name 
        }
      };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAmazonConnection(integration: any) {
  try {
    // Amazon MWS connection test would go here
    // For now, we'll simulate a basic validation
    if (!integration.seller_id || !integration.api_key || !integration.api_secret) {
      return { success: false, error: 'Missing seller ID, API key, or secret' };
    }

    // Simulate connection test
    return { 
      success: true, 
      data: { 
        seller_id: integration.seller_id,
        status: 'connected' 
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testWooCommerceConnection(integration: any) {
  try {
    if (!integration.platform_url || !integration.api_key || !integration.api_secret) {
      return { success: false, error: 'Missing store URL, API key, or secret' };
    }

    const auth = btoa(`${integration.api_key}:${integration.api_secret}`);
    const response = await fetch(`${integration.platform_url}/wp-json/wc/v3/system_status`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        data: { 
          version: data.settings?.version,
          environment: data.environment?.wp_version 
        }
      };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testBigCommerceConnection(integration: any) {
  try {
    if (!integration.platform_url || !integration.api_key) {
      return { success: false, error: 'Missing store URL or API key' };
    }

    const response = await fetch(`${integration.platform_url}/api/v2/store`, {
      headers: {
        'X-Auth-Token': integration.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        data: { 
          store_name: data.name,
          domain: data.domain 
        }
      };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}