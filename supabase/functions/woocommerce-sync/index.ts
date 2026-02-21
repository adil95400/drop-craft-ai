import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WOOCOMMERCE-SYNC] ${step}${detailsStr}`);
};

interface WooCommerceCredentials {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
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

    // Get WooCommerce integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .eq('platform_type', 'woocommerce')
      .single();

    if (integrationError || !integration) {
      throw new Error("WooCommerce integration not found");
    }

    const credentials: WooCommerceCredentials = integration.encrypted_credentials;
    const { store_url, consumer_key, consumer_secret } = credentials;

    logStep("Integration found", { store_url, platform: integration.platform_name });

    // WooCommerce REST API Base URL
    const apiBaseUrl = `${store_url}/wp-json/wc/v3`;
    const auth = btoa(`${consumer_key}:${consumer_secret}`);

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
    logStep("ERROR in woocommerce-sync", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function testConnection(apiBaseUrl: string, auth: string) {
  logStep("Testing WooCommerce connection");
  
  const response = await fetch(`${apiBaseUrl}/system_status`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  logStep("Connection test successful", { version: data.version });

  return new Response(JSON.stringify({ 
    success: true, 
    message: "Connection successful",
    woocommerce_version: data.version 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function syncProducts(apiBaseUrl: string, auth: string, supabaseClient: any, userId: string, integrationId: string) {
  logStep("Starting products sync");
  
  let page = 1;
  let totalSynced = 0;

  const response = await fetch(`${apiBaseUrl}/products?page=${page}&per_page=50`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status}`);
  }

  const products = await response.json();
  
  // Transform WooCommerce products to our format
  const transformedProducts = products.map((product: any) => ({
    external_id: product.id.toString(),
    supplier_id: 'woocommerce',
    supplier_name: 'WooCommerce Store',
    name: product.name,
    description: product.description || product.short_description,
    price: parseFloat(product.price) || parseFloat(product.regular_price) || 0,
    original_price: parseFloat(product.regular_price) || 0,
    currency: 'USD',
    category: product.categories?.[0]?.name || 'Uncategorized',
    sku: product.sku || `woo_${product.id}`,
    image_url: product.images?.[0]?.src || null,
    image_urls: product.images?.map((img: any) => img.src) || [],
    stock_quantity: product.stock_quantity || 0,
    availability_status: product.stock_status === 'instock' ? 'in_stock' : 'out_of_stock',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Upsert products into catalog_products
  const { error: upsertError } = await supabaseClient
    .from('catalog_products')
    .upsert(transformedProducts, { onConflict: 'external_id,supplier_id' });

  if (!upsertError) {
    totalSynced = products.length;
    logStep(`Synced products`, { products: products.length });
  }

  // Update integration last sync
  await supabaseClient
    .from('integrations')
    .update({ 
      last_sync_at: new Date().toISOString(),
      sync_settings: { last_products_sync: new Date().toISOString(), products_synced: totalSynced }
    })
    .eq('id', integrationId);

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Successfully synced ${totalSynced} products`,
    products_synced: totalSynced 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function syncOrders(apiBaseUrl: string, auth: string, supabaseClient: any, userId: string, integrationId: string) {
  logStep("Starting orders sync");
  
  const response = await fetch(`${apiBaseUrl}/orders?per_page=50&status=processing,completed`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status}`);
  }

  const orders = await response.json();
  logStep(`Found ${orders.length} orders to sync`);

  if (orders.length === 0) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: "No new orders to sync",
      orders_synced: 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Transform WooCommerce orders to our format
  const transformedOrders = orders.map((order: any) => ({
    user_id: userId,
    order_number: order.number,
    external_id: order.id.toString(),
    status: order.status,
    total_amount: parseFloat(order.total),
    currency: order.currency,
    order_date: order.date_created,
    shipping_address: order.shipping,
    billing_address: order.billing,
    items: order.line_items,
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

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Successfully synced ${orders.length} orders`,
    orders_synced: orders.length 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}