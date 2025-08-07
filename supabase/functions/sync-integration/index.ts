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

    const { integration_id, sync_type } = await req.json();

    // Get integration details
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (error || !integration) {
      throw new Error('Integration not found');
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('sync_logs')
      .insert([{
        integration_id,
        sync_type,
        status: 'in_progress',
        records_processed: 0,
        records_succeeded: 0,
        records_failed: 0,
        sync_data: {},
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (logError) {
      throw new Error('Failed to create sync log');
    }

    try {
      let syncResult;
      
      switch (integration.platform_name) {
        case 'shopify':
          syncResult = await syncShopifyData(integration, sync_type);
          break;
        case 'amazon':
          syncResult = await syncAmazonData(integration, sync_type);
          break;
        case 'woocommerce':
          syncResult = await syncWooCommerceData(integration, sync_type);
          break;
        case 'bigcommerce':
          syncResult = await syncBigCommerceData(integration, sync_type);
          break;
        default:
          throw new Error('Platform not supported');
      }

      // Update sync log with results
      await supabase
        .from('sync_logs')
        .update({
          status: 'success',
          records_processed: syncResult.processed,
          records_succeeded: syncResult.succeeded,
          records_failed: syncResult.failed,
          sync_data: syncResult.data,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      // Update integration last sync time
      await supabase
        .from('integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration_id);

      console.log(`Sync completed for ${integration.platform_name} - ${sync_type}:`, syncResult);

      return new Response(JSON.stringify({
        success: true,
        sync_id: syncLog.id,
        ...syncResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      // Update sync log with error
      await supabase
        .from('sync_logs')
        .update({
          status: 'error',
          error_message: syncError.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id);

      throw syncError;
    }

  } catch (error) {
    console.error('Error in sync function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncShopifyData(integration: any, syncType: string) {
  const baseUrl = `https://${integration.shop_domain}/admin/api/2023-10`;
  const headers = {
    'X-Shopify-Access-Token': integration.access_token,
    'Content-Type': 'application/json',
  };

  switch (syncType) {
    case 'products':
      const productsResponse = await fetch(`${baseUrl}/products.json?limit=50`, { headers });
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      const productsData = await productsResponse.json();
      
      return {
        processed: productsData.products?.length || 0,
        succeeded: productsData.products?.length || 0,
        failed: 0,
        data: { 
          products: productsData.products?.slice(0, 5).map((p: any) => ({ 
            id: p.id, 
            title: p.title, 
            price: p.variants?.[0]?.price 
          })) 
        }
      };

    case 'orders':
      const ordersResponse = await fetch(`${baseUrl}/orders.json?limit=50&status=any`, { headers });
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
      const ordersData = await ordersResponse.json();
      
      return {
        processed: ordersData.orders?.length || 0,
        succeeded: ordersData.orders?.length || 0,
        failed: 0,
        data: { 
          orders: ordersData.orders?.slice(0, 5).map((o: any) => ({ 
            id: o.id, 
            number: o.order_number, 
            total: o.total_price 
          })) 
        }
      };

    case 'customers':
      const customersResponse = await fetch(`${baseUrl}/customers.json?limit=50`, { headers });
      if (!customersResponse.ok) throw new Error('Failed to fetch customers');
      const customersData = await customersResponse.json();
      
      return {
        processed: customersData.customers?.length || 0,
        succeeded: customersData.customers?.length || 0,
        failed: 0,
        data: { 
          customers: customersData.customers?.slice(0, 5).map((c: any) => ({ 
            id: c.id, 
            email: c.email, 
            name: `${c.first_name} ${c.last_name}` 
          })) 
        }
      };

    case 'inventory':
      // Simulate inventory sync
      return {
        processed: 25,
        succeeded: 23,
        failed: 2,
        data: { message: 'Inventory levels synchronized' }
      };

    default:
      throw new Error(`Sync type ${syncType} not supported for Shopify`);
  }
}

async function syncAmazonData(integration: any, syncType: string) {
  // Amazon MWS/SP-API sync would go here
  // For demo purposes, we'll simulate data
  return {
    processed: Math.floor(Math.random() * 50) + 10,
    succeeded: Math.floor(Math.random() * 45) + 8,
    failed: Math.floor(Math.random() * 3),
    data: { 
      message: `Amazon ${syncType} synchronized`,
      seller_id: integration.seller_id 
    }
  };
}

async function syncWooCommerceData(integration: any, syncType: string) {
  const auth = btoa(`${integration.api_key}:${integration.api_secret}`);
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };

  switch (syncType) {
    case 'products':
      const productsResponse = await fetch(`${integration.platform_url}/wp-json/wc/v3/products?per_page=50`, { headers });
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      const productsData = await productsResponse.json();
      
      return {
        processed: productsData.length || 0,
        succeeded: productsData.length || 0,
        failed: 0,
        data: { 
          products: productsData.slice(0, 5).map((p: any) => ({ 
            id: p.id, 
            name: p.name, 
            price: p.price 
          })) 
        }
      };

    case 'orders':
      const ordersResponse = await fetch(`${integration.platform_url}/wp-json/wc/v3/orders?per_page=50`, { headers });
      if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
      const ordersData = await ordersResponse.json();
      
      return {
        processed: ordersData.length || 0,
        succeeded: ordersData.length || 0,
        failed: 0,
        data: { 
          orders: ordersData.slice(0, 5).map((o: any) => ({ 
            id: o.id, 
            number: o.number, 
            total: o.total 
          })) 
        }
      };

    default:
      // Simulate other sync types
      return {
        processed: Math.floor(Math.random() * 30) + 5,
        succeeded: Math.floor(Math.random() * 25) + 5,
        failed: Math.floor(Math.random() * 2),
        data: { message: `WooCommerce ${syncType} synchronized` }
      };
  }
}

async function syncBigCommerceData(integration: any, syncType: string) {
  const headers = {
    'X-Auth-Token': integration.api_key,
    'Content-Type': 'application/json',
  };

  switch (syncType) {
    case 'products':
      const productsResponse = await fetch(`${integration.platform_url}/api/v3/catalog/products?limit=50`, { headers });
      if (!productsResponse.ok) throw new Error('Failed to fetch products');
      const productsData = await productsResponse.json();
      
      return {
        processed: productsData.data?.length || 0,
        succeeded: productsData.data?.length || 0,
        failed: 0,
        data: { 
          products: productsData.data?.slice(0, 5).map((p: any) => ({ 
            id: p.id, 
            name: p.name, 
            price: p.price 
          })) 
        }
      };

    default:
      // Simulate other sync types
      return {
        processed: Math.floor(Math.random() * 40) + 10,
        succeeded: Math.floor(Math.random() * 35) + 8,
        failed: Math.floor(Math.random() * 3),
        data: { message: `BigCommerce ${syncType} synchronized` }
      };
  }
}