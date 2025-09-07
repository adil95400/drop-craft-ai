import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PRESTASHOP-SYNC] ${step}${detailsStr}`);
};

interface PrestaShopCredentials {
  shop_url: string;
  webservice_key: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { action, integration_id } = await req.json();
    
    if (!integration_id) throw new Error("Integration ID is required");

    // Get PrestaShop integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .eq('platform_type', 'prestashop')
      .single();

    if (integrationError || !integration) {
      throw new Error("PrestaShop integration not found");
    }

    const credentials: PrestaShopCredentials = integration.encrypted_credentials;
    const { shop_url, webservice_key } = credentials;

    logStep("Integration found", { shop_url, platform: integration.platform_name });

    // PrestaShop API Base URL
    const apiBaseUrl = `${shop_url}/api`;
    const auth = btoa(`${webservice_key}:`);

    switch (action) {
      case 'sync_products':
        return await syncProducts(apiBaseUrl, auth, supabaseClient, user.id, integration.id);
      
      case 'sync_orders':
        return await syncOrders(apiBaseUrl, auth, supabaseClient, user.id, integration.id);
      
      case 'test_connection':
        return await testConnection(apiBaseUrl, auth);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in prestashop-sync", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function testConnection(apiBaseUrl: string, auth: string) {
  logStep("Testing PrestaShop connection");
  
  const response = await fetch(`${apiBaseUrl}/products?limit=1&output_format=JSON`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PrestaShop API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  logStep("Connection test successful");

  return new Response(JSON.stringify({ 
    success: true, 
    message: "Connection successful",
    api_access: true
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function syncProducts(apiBaseUrl: string, auth: string, supabaseClient: any, userId: string, integrationId: string) {
  logStep("Starting products sync");
  
  const response = await fetch(`${apiBaseUrl}/products?limit=50&output_format=JSON`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PrestaShop API error: ${response.status}`);
  }

  const data = await response.json();
  const products = data.products || [];
  
  if (products.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "No products found",
      products_synced: 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Get detailed product info for each product
  const detailedProducts = [];
  for (const product of products.slice(0, 10)) { // Limit to 10 for demo
    try {
      const detailResponse = await fetch(`${apiBaseUrl}/products/${product.id}?output_format=JSON`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        const productDetail = detailData.product;
        
        detailedProducts.push({
          external_id: productDetail.id?.toString() || product.id?.toString(),
          supplier_id: 'prestashop',
          supplier_name: 'PrestaShop Store',
          name: productDetail.name?.[0]?.value || `Product ${product.id}`,
          description: productDetail.description?.[0]?.value || '',
          price: parseFloat(productDetail.price) || 0,
          original_price: parseFloat(productDetail.price) || 0,
          currency: 'EUR',
          category: 'General',
          sku: productDetail.reference || `ps_${product.id}`,
          image_url: null,
          image_urls: [],
          stock_quantity: parseInt(productDetail.quantity) || 0,
          availability_status: productDetail.active === '1' ? 'in_stock' : 'out_of_stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      logStep(`Error fetching product detail for ${product.id}`, { error });
    }
  }

  if (detailedProducts.length > 0) {
    // Upsert products into catalog_products
    const { error: upsertError } = await supabaseClient
      .from('catalog_products')
      .upsert(detailedProducts, { onConflict: 'external_id,supplier_id' });

    if (upsertError) {
      logStep("Error upserting products", { error: upsertError });
    }
  }

  // Update integration last sync
  await supabaseClient
    .from('integrations')
    .update({ 
      last_sync_at: new Date().toISOString(),
      sync_settings: { last_products_sync: new Date().toISOString(), products_synced: detailedProducts.length }
    })
    .eq('id', integrationId);

  logStep("Products sync completed", { totalSynced: detailedProducts.length });

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Successfully synced ${detailedProducts.length} products`,
    products_synced: detailedProducts.length 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function syncOrders(apiBaseUrl: string, auth: string, supabaseClient: any, userId: string, integrationId: string) {
  logStep("Starting orders sync");
  
  const response = await fetch(`${apiBaseUrl}/orders?limit=50&output_format=JSON`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PrestaShop API error: ${response.status}`);
  }

  const data = await response.json();
  const orders = data.orders || [];
  
  if (orders.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "No orders found",
      orders_synced: 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Transform PrestaShop orders to our format (simplified)
  const transformedOrders = orders.slice(0, 10).map((order: any) => ({
    user_id: userId,
    order_number: `PS-${order.id}`,
    external_id: order.id?.toString(),
    status: 'processing',
    total_amount: parseFloat(order.total_paid) || 0,
    currency: 'EUR',
    order_date: order.date_add || new Date().toISOString(),
    shipping_address: {},
    billing_address: {},
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Upsert orders
  const { error: upsertError } = await supabaseClient
    .from('orders')
    .upsert(transformedOrders, { onConflict: 'external_id' });

  if (upsertError) {
    logStep("Error upserting orders", { error: upsertError });
    throw new Error("Failed to sync orders");
  }

  logStep("Orders sync completed", { ordersSynced: transformedOrders.length });

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Successfully synced ${transformedOrders.length} orders`,
    orders_synced: transformedOrders.length 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}