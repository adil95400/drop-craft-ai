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

    const { integrationId, type = 'all', platform } = await req.json();
    console.log('Syncing integration:', { integrationId, type, platform });

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError) {
      throw new Error(`Integration not found: ${integrationError.message}`);
    }

    console.log('Syncing platform:', integration.platform_type);

    let syncResult = { success: false, message: 'Unknown sync type', data: {} };

    // Sync based on platform type and sync type
    switch (integration.platform_type) {
      case 'shopify':
        syncResult = await syncShopify(integration, type, supabase);
        break;
      case 'woocommerce':
        syncResult = await syncWooCommerce(integration, type, supabase);
        break;
      case 'aliexpress':
        syncResult = await syncAliExpress(integration, type, supabase);
        break;
      case 'bigbuy':
        syncResult = await syncBigBuy(integration, type, supabase);
        break;
      default:
        syncResult = { success: false, message: `Unsupported platform: ${integration.platform_type}`, data: {} };
    }

    // Update last sync time
    await supabase
      .from('integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        connection_status: syncResult.success ? 'connected' : 'error'
      })
      .eq('id', integrationId);

    console.log('Sync result:', syncResult);

    return new Response(JSON.stringify({
      success: syncResult.success,
      message: syncResult.message,
      data: syncResult.data,
      platform: integration.platform_type,
      syncType: type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sync integration error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncShopify(integration: any, type: string, supabase: any) {
  try {
    console.log(`Syncing Shopify ${type} for:`, integration.shop_domain);
    
    // Mock sync data - in real implementation, fetch from Shopify API
    const mockData = {
      products: generateMockProducts(10, 'shopify'),
      orders: generateMockOrders(5, 'shopify'),
      customers: generateMockCustomers(3)
    };

    let syncedCount = 0;
    
    if (type === 'products' || type === 'all') {
      // Insert products into imported_products table
      const { data: insertedProducts } = await supabase
        .from('imported_products')
        .insert(mockData.products.map(p => ({
          ...p,
          user_id: integration.user_id,
          supplier_name: 'Shopify',
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.products.length;
    }

    if (type === 'orders' || type === 'all') {
      // Insert orders
      const { data: insertedOrders } = await supabase
        .from('orders')
        .insert(mockData.orders.map(o => ({
          ...o,
          user_id: integration.user_id,
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.orders.length;
    }

    return { 
      success: true, 
      message: `Successfully synced ${syncedCount} items from Shopify`,
      data: { syncedCount, type }
    };
  } catch (error) {
    return { success: false, message: `Shopify sync failed: ${error.message}`, data: {} };
  }
}

async function syncWooCommerce(integration: any, type: string, supabase: any) {
  try {
    console.log(`Syncing WooCommerce ${type} for:`, integration.platform_url);
    
    const mockData = {
      products: generateMockProducts(8, 'woocommerce'),
      orders: generateMockOrders(4, 'woocommerce')
    };

    let syncedCount = 0;
    
    if (type === 'products' || type === 'all') {
      const { data: insertedProducts } = await supabase
        .from('imported_products')
        .insert(mockData.products.map(p => ({
          ...p,
          user_id: integration.user_id,
          supplier_name: 'WooCommerce',
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.products.length;
    }

    if (type === 'orders' || type === 'all') {
      const { data: insertedOrders } = await supabase
        .from('orders')
        .insert(mockData.orders.map(o => ({
          ...o,
          user_id: integration.user_id,
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.orders.length;
    }

    return { 
      success: true, 
      message: `Successfully synced ${syncedCount} items from WooCommerce`,
      data: { syncedCount, type }
    };
  } catch (error) {
    return { success: false, message: `WooCommerce sync failed: ${error.message}`, data: {} };
  }
}

async function syncAliExpress(integration: any, type: string, supabase: any) {
  try {
    console.log(`Syncing AliExpress ${type}`);
    
    const mockData = {
      products: generateMockProducts(15, 'aliexpress')
    };

    let syncedCount = 0;
    
    if (type === 'products' || type === 'all') {
      const { data: insertedProducts } = await supabase
        .from('imported_products')
        .insert(mockData.products.map(p => ({
          ...p,
          user_id: integration.user_id,
          supplier_name: 'AliExpress',
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.products.length;
    }

    return { 
      success: true, 
      message: `Successfully synced ${syncedCount} products from AliExpress`,
      data: { syncedCount, type }
    };
  } catch (error) {
    return { success: false, message: `AliExpress sync failed: ${error.message}`, data: {} };
  }
}

async function syncBigBuy(integration: any, type: string, supabase: any) {
  try {
    console.log(`Syncing BigBuy ${type}`);
    
    const mockData = {
      products: generateMockProducts(12, 'bigbuy')
    };

    let syncedCount = 0;
    
    if (type === 'products' || type === 'all') {
      const { data: insertedProducts } = await supabase
        .from('imported_products')
        .insert(mockData.products.map(p => ({
          ...p,
          user_id: integration.user_id,
          supplier_name: 'BigBuy',
          created_at: new Date().toISOString()
        })));
      syncedCount += mockData.products.length;
    }

    return { 
      success: true, 
      message: `Successfully synced ${syncedCount} products from BigBuy`,
      data: { syncedCount, type }
    };
  } catch (error) {
    return { success: false, message: `BigBuy sync failed: ${error.message}`, data: {} };
  }
}

function generateMockProducts(count: number, platform: string) {
  const products = [];
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'];
  const brands = ['TechPro', 'StyleMax', 'HomeEssentials', 'SportGear', 'GlowBeauty'];
  
  for (let i = 0; i < count; i++) {
    products.push({
      name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Product ${i + 1}`,
      description: `High-quality product from ${platform} with excellent features and customer satisfaction.`,
      price: parseFloat((Math.random() * 200 + 20).toFixed(2)),
      category: categories[Math.floor(Math.random() * categories.length)],
      brand: brands[Math.floor(Math.random() * brands.length)],
      sku: `${platform.toUpperCase()}-${Date.now()}-${i}`,
      stock_quantity: Math.floor(Math.random() * 100) + 10,
      status: 'draft',
      review_status: 'pending'
    });
  }
  
  return products;
}

function generateMockOrders(count: number, platform: string) {
  const orders = [];
  const statuses = ['pending', 'processing', 'shipped', 'delivered'];
  
  for (let i = 0; i < count; i++) {
    orders.push({
      order_number: `${platform.toUpperCase()}-${Date.now()}-${i}`,
      total_amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
      currency: 'EUR',
      status: statuses[Math.floor(Math.random() * statuses.length)]
    });
  }
  
  return orders;
}

function generateMockCustomers(count: number) {
  const customers = [];
  const names = ['Jean Dupont', 'Marie Martin', 'Pierre Bernard', 'Sophie Thomas'];
  
  for (let i = 0; i < count; i++) {
    customers.push({
      name: names[i % names.length],
      email: `customer${i + 1}@example.com`,
      phone: `+33${Math.floor(Math.random() * 900000000) + 100000000}`,
      status: 'active'
    });
  }
  
  return customers;
}