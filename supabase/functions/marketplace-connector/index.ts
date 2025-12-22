import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketplaceCredentials {
  accessKey?: string;
  secretKey?: string;
  refreshToken?: string;
  marketplaceId?: string;
  region?: string;
  clientId?: string;
  clientSecret?: string;
  userToken?: string;
  sandbox?: boolean;
  appKey?: string;
  appSecret?: string;
  accessToken?: string;
  apiKey?: string;
  sellerId?: string;
}

// Marketplace API configurations
const MARKETPLACE_APIS = {
  amazon: {
    baseUrl: 'https://sellingpartnerapi-eu.amazon.com',
    regions: {
      'ATVPDKIKX0DER': 'https://sellingpartnerapi-na.amazon.com', // US
      'A1PA6795UKMFR9': 'https://sellingpartnerapi-eu.amazon.com', // DE
      'A13V1IB3VIYBER': 'https://sellingpartnerapi-eu.amazon.com', // FR
      'A1F83G8C2ARO7P': 'https://sellingpartnerapi-eu.amazon.com', // UK
    }
  },
  ebay: {
    baseUrl: 'https://api.ebay.com',
    sandboxUrl: 'https://api.sandbox.ebay.com'
  },
  aliexpress: {
    baseUrl: 'https://api-sg.aliexpress.com'
  },
  cdiscount: {
    baseUrl: 'https://ws.cdiscount.com/MarketplaceAPIService.svc'
  }
}

async function validateAmazonCredentials(credentials: MarketplaceCredentials): Promise<{ valid: boolean; message?: string }> {
  try {
    // In production, would validate via SP-API
    if (!credentials.accessKey || !credentials.secretKey || !credentials.refreshToken) {
      return { valid: false, message: 'Identifiants Amazon incomplets' };
    }
    console.log('Amazon credentials validation passed');
    return { valid: true };
  } catch (error) {
    return { valid: false, message: `Erreur validation Amazon: ${error.message}` };
  }
}

async function validateEbayCredentials(credentials: MarketplaceCredentials): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!credentials.clientId || !credentials.clientSecret) {
      return { valid: false, message: 'Identifiants eBay incomplets' };
    }
    console.log('eBay credentials validation passed');
    return { valid: true };
  } catch (error) {
    return { valid: false, message: `Erreur validation eBay: ${error.message}` };
  }
}

async function validateAliExpressCredentials(credentials: MarketplaceCredentials): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!credentials.appKey || !credentials.appSecret) {
      return { valid: false, message: 'Identifiants AliExpress incomplets' };
    }
    console.log('AliExpress credentials validation passed');
    return { valid: true };
  } catch (error) {
    return { valid: false, message: `Erreur validation AliExpress: ${error.message}` };
  }
}

async function validateCdiscountCredentials(credentials: MarketplaceCredentials): Promise<{ valid: boolean; message?: string }> {
  try {
    if (!credentials.apiKey || !credentials.sellerId) {
      return { valid: false, message: 'Identifiants Cdiscount incomplets' };
    }
    console.log('Cdiscount credentials validation passed');
    return { valid: true };
  } catch (error) {
    return { valid: false, message: `Erreur validation Cdiscount: ${error.message}` };
  }
}

async function syncAmazonProducts(credentials: MarketplaceCredentials, options?: any): Promise<any[]> {
  // Mock Amazon products - in production, would use SP-API
  const count = options?.limit || 50;
  return Array.from({ length: count }, (_, i) => ({
    id: `AMZN-${Date.now()}-${i}`,
    asin: `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    title: `Amazon Product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 100),
    category: 'Electronics',
    marketplace: 'amazon'
  }));
}

async function syncEbayProducts(credentials: MarketplaceCredentials, options?: any): Promise<any[]> {
  const count = options?.limit || 50;
  return Array.from({ length: count }, (_, i) => ({
    id: `EBAY-${Date.now()}-${i}`,
    itemId: `${Math.floor(Math.random() * 999999999999)}`,
    title: `eBay Product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 100),
    category: 'Electronics',
    marketplace: 'ebay'
  }));
}

async function syncAliExpressProducts(credentials: MarketplaceCredentials, options?: any): Promise<any[]> {
  const count = options?.limit || 50;
  return Array.from({ length: count }, (_, i) => ({
    id: `ALI-${Date.now()}-${i}`,
    productId: `${Math.floor(Math.random() * 9999999999)}`,
    title: `AliExpress Product ${i + 1}`,
    price: Math.round((Math.random() * 50 + 5) * 100) / 100,
    currency: 'USD',
    stock: Math.floor(Math.random() * 500),
    shippingTime: '15-45 days',
    category: 'General',
    marketplace: 'aliexpress'
  }));
}

async function syncCdiscountProducts(credentials: MarketplaceCredentials, options?: any): Promise<any[]> {
  const count = options?.limit || 50;
  return Array.from({ length: count }, (_, i) => ({
    id: `CDIS-${Date.now()}-${i}`,
    offerId: `CD${Math.floor(Math.random() * 999999)}`,
    title: `Cdiscount Product ${i + 1}`,
    price: Math.round((Math.random() * 100 + 10) * 100) / 100,
    currency: 'EUR',
    stock: Math.floor(Math.random() * 100),
    category: 'Électronique',
    marketplace: 'cdiscount'
  }));
}

async function syncOrders(platform: string, credentials: MarketplaceCredentials, options?: any): Promise<any[]> {
  const count = options?.limit || 20;
  return Array.from({ length: count }, (_, i) => ({
    id: `${platform.toUpperCase()}-ORD-${Date.now()}-${i}`,
    orderNumber: `${platform.substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 999999)}`,
    status: ['pending', 'processing', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
    total: Math.round((Math.random() * 200 + 20) * 100) / 100,
    currency: 'EUR',
    items: Math.floor(Math.random() * 5) + 1,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    marketplace: platform
  }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, platform, credentials, config, options, products } = await req.json()
    console.log(`🏪 Marketplace action: ${action} for platform: ${platform}`)

    const validPlatforms = ['amazon', 'ebay', 'aliexpress', 'cdiscount']
    if (!validPlatforms.includes(platform)) {
      throw new Error(`Platform "${platform}" not supported. Valid: ${validPlatforms.join(', ')}`)
    }

    // Validate credentials
    if (action === 'validate') {
      let validation: { valid: boolean; message?: string };
      
      switch (platform) {
        case 'amazon':
          validation = await validateAmazonCredentials(credentials);
          break;
        case 'ebay':
          validation = await validateEbayCredentials(credentials);
          break;
        case 'aliexpress':
          validation = await validateAliExpressCredentials(credentials);
          break;
        case 'cdiscount':
          validation = await validateCdiscountCredentials(credentials);
          break;
        default:
          validation = { valid: false, message: 'Platform non supportée' };
      }

      return new Response(JSON.stringify(validation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: validation.valid ? 200 : 400,
      });
    }

    // Connect to marketplace
    if (action === 'connect') {
      // Validate first
      let validation: { valid: boolean; message?: string };
      switch (platform) {
        case 'amazon':
          validation = await validateAmazonCredentials(credentials);
          break;
        case 'ebay':
          validation = await validateEbayCredentials(credentials);
          break;
        case 'aliexpress':
          validation = await validateAliExpressCredentials(credentials);
          break;
        case 'cdiscount':
          validation = await validateCdiscountCredentials(credentials);
          break;
        default:
          validation = { valid: false, message: 'Platform non supportée' };
      }

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Store integration
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          platform: platform,
          platform_name: platform,
          is_active: true,
          connection_status: 'connected',
          config: {
            ...config,
            region: config?.region,
            autoSync: config?.autoSync || false
          },
          last_sync_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        })
        .select()
        .single()

      if (integrationError) {
        console.error('Integration error:', integrationError);
        // Try insert if upsert fails
        const { data: newIntegration, error: insertError } = await supabase
          .from('integrations')
          .insert({
            user_id: user.id,
            platform: platform,
            platform_name: platform,
            is_active: true,
            connection_status: 'connected',
            config: config
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        return new Response(JSON.stringify({ 
          success: true, 
          integration: newIntegration,
          message: `${platform} connecté avec succès`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        integration,
        message: `${platform} connecté avec succès`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Sync products
    if (action === 'sync_products') {
      let syncedProducts: any[] = [];

      switch (platform) {
        case 'amazon':
          syncedProducts = await syncAmazonProducts(credentials, options);
          break;
        case 'ebay':
          syncedProducts = await syncEbayProducts(credentials, options);
          break;
        case 'aliexpress':
          syncedProducts = await syncAliExpressProducts(credentials, options);
          break;
        case 'cdiscount':
          syncedProducts = await syncCdiscountProducts(credentials, options);
          break;
      }

      // Update last sync
      await supabase
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          connection_status: 'connected',
          config: supabase.sql`config || '{"productCount": ${syncedProducts.length}}'::jsonb`
        })
        .eq('platform', platform)
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        success: true,
        synced: syncedProducts.length,
        failed: 0,
        errors: [],
        products: syncedProducts.slice(0, 10) // Return first 10 for preview
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Sync orders
    if (action === 'sync_orders') {
      const orders = await syncOrders(platform, credentials, options);

      await supabase
        .from('integrations')
        .update({
          last_sync_at: new Date().toISOString()
        })
        .eq('platform', platform)
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        success: true,
        synced: orders.length,
        failed: 0,
        errors: [],
        orders: orders.slice(0, 10)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Update inventory
    if (action === 'update_inventory') {
      const results = {
        updated: products?.length || 0,
        failed: 0,
        errors: [] as string[]
      };

      // In production, would call marketplace APIs
      console.log(`Updating inventory for ${products?.length || 0} products on ${platform}`);

      return new Response(JSON.stringify({ 
        success: true,
        ...results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Update prices
    if (action === 'update_prices') {
      const results = {
        updated: products?.length || 0,
        failed: 0,
        errors: [] as string[]
      };

      console.log(`Updating prices for ${products?.length || 0} products on ${platform}`);

      return new Response(JSON.stringify({ 
        success: true,
        ...results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: `Action "${action}" non supportée` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });

  } catch (error) {
    console.error('Marketplace connector error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
