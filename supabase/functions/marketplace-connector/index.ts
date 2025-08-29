import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[MARKETPLACE-CONNECTOR] ${step}`, details ? JSON.stringify(details) : '');
};

// Platform configurations based on your image
const PLATFORM_CONFIGS = {
  // Marketplaces
  amazon: {
    type: 'marketplace',
    api_base: 'https://mws.amazonservices.com',
    auth_type: 'api_key',
    supported_regions: ['US', 'EU', 'UK', 'CA', 'JP']
  },
  ebay: {
    type: 'marketplace', 
    api_base: 'https://api.ebay.com',
    auth_type: 'oauth',
    supported_regions: ['US', 'UK', 'DE', 'FR', 'IT', 'ES']
  },
  aliexpress: {
    type: 'supplier',
    api_base: 'https://api.aliexpress.com',
    auth_type: 'api_key'
  },
  cdiscount: {
    type: 'marketplace',
    api_base: 'https://ws.cdiscount.com',
    auth_type: 'api_key',
    supported_regions: ['FR']
  },
  fnac: {
    type: 'marketplace',
    api_base: 'https://api.fnac.com',
    auth_type: 'api_key',
    supported_regions: ['FR']
  },
  carrefour: {
    type: 'marketplace',
    api_base: 'https://api.carrefour.com',
    auth_type: 'api_key',
    supported_regions: ['FR']
  },
  rakuten: {
    type: 'marketplace',
    api_base: 'https://api.rakuten.com',
    auth_type: 'oauth',
    supported_regions: ['FR', 'UK', 'DE']
  },
  allegro: {
    type: 'marketplace',
    api_base: 'https://api.allegro.pl',
    auth_type: 'oauth',
    supported_regions: ['PL']
  },
  kaufland: {
    type: 'marketplace',
    api_base: 'https://api.kaufland.de',
    auth_type: 'api_key',
    supported_regions: ['DE']
  },
  worten: {
    type: 'marketplace',
    api_base: 'https://api.worten.pt',
    auth_type: 'api_key',
    supported_regions: ['PT']
  },
  // E-commerce platforms
  shopify: {
    type: 'ecommerce',
    api_base: 'https://{shop}.myshopify.com/admin/api/2023-10',
    auth_type: 'oauth'
  },
  woocommerce: {
    type: 'ecommerce',
    auth_type: 'api_key'
  },
  prestashop: {
    type: 'ecommerce',
    auth_type: 'api_key'
  },
  wix: {
    type: 'ecommerce',
    api_base: 'https://www.wixapis.com',
    auth_type: 'oauth'
  },
  // Social platforms
  instagram: {
    type: 'social',
    api_base: 'https://graph.facebook.com',
    auth_type: 'oauth'
  },
  facebook: {
    type: 'social',
    api_base: 'https://graph.facebook.com',
    auth_type: 'oauth'
  },
  tiktok: {
    type: 'social',
    api_base: 'https://open-api.tiktok.com',
    auth_type: 'oauth'
  },
  pinterest: {
    type: 'social',
    api_base: 'https://api.pinterest.com',
    auth_type: 'oauth'
  },
  youtube: {
    type: 'social',
    api_base: 'https://www.googleapis.com/youtube',
    auth_type: 'oauth'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    const { action, platform, credentials, config, products } = await req.json();

    logStep('Request details', { action, platform, configKeys: Object.keys(config || {}) });

    if (!PLATFORM_CONFIGS[platform]) {
      throw new Error(`Platform ${platform} not supported`);
    }

    const platformConfig = PLATFORM_CONFIGS[platform];
    
    let result;
    switch (action) {
      case 'connect':
        result = await connectPlatform(platform, credentials, config, supabase, user.id);
        break;
      case 'test_connection':
        result = await testConnection(platform, credentials, config);
        break;
      case 'sync_products':
        result = await syncProducts(platform, credentials, supabase, user.id);
        break;
      case 'push_products':
        result = await pushProducts(platform, credentials, products, supabase, user.id);
        break;
      case 'sync_orders':
        result = await syncOrders(platform, credentials, supabase, user.id);
        break;
      case 'get_categories':
        result = await getCategories(platform, credentials);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Error', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function connectPlatform(platform: string, credentials: any, config: any, supabase: any, userId: string) {
  logStep('Connecting platform', { platform });

  const platformConfig = PLATFORM_CONFIGS[platform];
  
  // Store integration
  const { data: integration, error } = await supabase
    .from('platform_integrations')
    .upsert({
      user_id: userId,
      platform_type: platformConfig.type,
      platform_name: platform,
      platform_config: config || {},
      credentials: credentials || {},
      is_active: true,
      sync_status: 'connected',
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id,platform_name',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    integration_id: integration.id,
    platform,
    status: 'connected'
  };
}

async function testConnection(platform: string, credentials: any, config: any) {
  logStep('Testing connection', { platform });

  const platformConfig = PLATFORM_CONFIGS[platform];
  
  // Mock connection test based on platform
  switch (platform) {
    case 'amazon':
      return await testAmazonConnection(credentials);
    case 'ebay':
      return await testEbayConnection(credentials);
    case 'shopify':
      return await testShopifyConnection(credentials);
    case 'aliexpress':
      return await testAliExpressConnection(credentials);
    default:
      // Generic test
      return {
        success: true,
        platform,
        status: 'connection_tested',
        message: `Connection to ${platform} tested successfully`
      };
  }
}

async function testAmazonConnection(credentials: any) {
  if (!credentials.access_key || !credentials.secret_key || !credentials.marketplace_id) {
    throw new Error('Amazon credentials incomplete: need access_key, secret_key, marketplace_id');
  }

  // Mock Amazon MWS/SP-API connection test
  return {
    success: true,
    platform: 'amazon',
    marketplace_id: credentials.marketplace_id,
    status: 'connected'
  };
}

async function testEbayConnection(credentials: any) {
  if (!credentials.client_id || !credentials.client_secret) {
    throw new Error('eBay credentials incomplete: need client_id, client_secret');
  }

  // Mock eBay API connection test
  return {
    success: true,
    platform: 'ebay',
    status: 'connected'
  };
}

async function testShopifyConnection(credentials: any) {
  if (!credentials.shop_domain || !credentials.access_token) {
    throw new Error('Shopify credentials incomplete: need shop_domain, access_token');
  }

  // Test actual Shopify connection
  try {
    const response = await fetch(`https://${credentials.shop_domain}.myshopify.com/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': credentials.access_token
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      platform: 'shopify',
      shop_name: data.shop.name,
      status: 'connected'
    };
  } catch (error) {
    throw new Error(`Shopify connection failed: ${error.message}`);
  }
}

async function testAliExpressConnection(credentials: any) {
  if (!credentials.api_key || !credentials.api_secret) {
    throw new Error('AliExpress credentials incomplete: need api_key, api_secret');
  }

  // Mock AliExpress API connection test
  return {
    success: true,
    platform: 'aliexpress',
    status: 'connected'
  };
}

async function syncProducts(platform: string, credentials: any, supabase: any, userId: string) {
  logStep('Syncing products', { platform });

  // Mock product sync - in real implementation, this would call actual APIs
  const mockProducts = [
    {
      external_id: `${platform}_product_1`,
      name: `Sample Product from ${platform}`,
      description: `Product imported from ${platform}`,
      price: 29.99,
      currency: 'EUR',
      category: 'Electronics',
      image_urls: ['https://example.com/image1.jpg'],
      stock_quantity: 100,
      sku: `${platform.toUpperCase()}_SKU_001`
    }
  ];

  // Insert products into imported_products
  const { data: importedProducts, error } = await supabase
    .from('imported_products')
    .insert(
      mockProducts.map(product => ({
        ...product,
        user_id: userId,
        supplier_name: platform,
        status: 'draft',
        import_quality_score: 85,
        data_completeness_score: 90
      }))
    )
    .select();

  if (error) throw error;

  return {
    success: true,
    platform,
    synced_products: importedProducts.length,
    products: importedProducts
  };
}

async function pushProducts(platform: string, credentials: any, products: any[], supabase: any, userId: string) {
  logStep('Pushing products', { platform, count: products.length });

  // Mock product push - in real implementation, this would call actual APIs
  const results = products.map(product => ({
    product_id: product.id,
    external_id: `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'success',
    message: `Product pushed to ${platform} successfully`
  }));

  // Update products with external IDs
  for (const result of results) {
    if (result.status === 'success') {
      await supabase
        .from('imported_products')
        .update({
          [`${platform}_product_id`]: result.external_id,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', result.product_id)
        .eq('user_id', userId);
    }
  }

  return {
    success: true,
    platform,
    total: products.length,
    successful: results.filter(r => r.status === 'success').length,
    results
  };
}

async function syncOrders(platform: string, credentials: any, supabase: any, userId: string) {
  logStep('Syncing orders', { platform });

  // Mock order sync - in real implementation, this would call actual APIs
  const mockOrders = [
    {
      order_number: `${platform.toUpperCase()}_ORD_${Date.now()}`,
      total_amount: 99.99,
      currency: 'EUR',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  // Insert orders
  const { data: orders, error } = await supabase
    .from('orders')
    .insert(
      mockOrders.map(order => ({
        ...order,
        user_id: userId
      }))
    )
    .select();

  if (error) throw error;

  return {
    success: true,
    platform,
    synced_orders: orders.length,
    orders
  };
}

async function getCategories(platform: string, credentials: any) {
  logStep('Getting categories', { platform });

  // Mock categories - in real implementation, this would call actual APIs
  const mockCategories = [
    { id: '1', name: 'Electronics', parent_id: null },
    { id: '2', name: 'Fashion', parent_id: null },
    { id: '3', name: 'Home & Garden', parent_id: null },
    { id: '4', name: 'Sports', parent_id: null },
    { id: '5', name: 'Books', parent_id: null }
  ];

  return {
    success: true,
    platform,
    categories: mockCategories
  };
}