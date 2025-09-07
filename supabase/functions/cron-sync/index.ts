import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CRON-SYNC] ${step}${detailsStr}`);
};

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
    logStep("CRON sync started");

    const { syncType = "all" } = await req.json().catch(() => ({ syncType: "all" }));
    logStep("Sync type", { syncType });

    const results = {
      suppliers: 0,
      products: 0,
      orders: 0,
      integrations: 0,
      errors: []
    };

    // 1. Sync supplier product data
    if (syncType === "all" || syncType === "suppliers") {
      try {
        const { data: suppliers } = await supabaseClient
          .from('suppliers')
          .select('*')
          .eq('status', 'active');

        for (const supplier of suppliers || []) {
          const syncResult = await syncSupplierData(supplier);
          results.suppliers += syncResult.updated;
          results.products += syncResult.products;
        }
        
        logStep("Supplier sync completed", { suppliers: results.suppliers });
      } catch (error) {
        results.errors.push(`Supplier sync error: ${error.message}`);
      }
    }

    // 2. Sync integration data (Shopify, WooCommerce, etc.)
    if (syncType === "all" || syncType === "integrations") {
      try {
        const { data: integrations } = await supabaseClient
          .from('integrations')
          .select('*')
          .eq('is_active', true);

        for (const integration of integrations || []) {
          const syncResult = await syncIntegrationData(integration);
          results.integrations += syncResult.synced;
        }

        logStep("Integration sync completed", { integrations: results.integrations });
      } catch (error) {
        results.errors.push(`Integration sync error: ${error.message}`);
      }
    }

    // 3. Update order tracking
    if (syncType === "all" || syncType === "orders") {
      try {
        const { data: pendingOrders } = await supabaseClient
          .from('supplier_orders')
          .select('*')
          .in('status', ['sent', 'processing']);

        for (const order of pendingOrders || []) {
          const trackingResult = await updateOrderTracking(order);
          if (trackingResult.updated) {
            results.orders += 1;
          }
        }

        logStep("Order tracking updated", { orders: results.orders });
      } catch (error) {
        results.errors.push(`Order tracking error: ${error.message}`);
      }
    }

    // 4. Cleanup old data
    if (syncType === "all" || syncType === "cleanup") {
      try {
        await cleanupOldData(supabaseClient);
        logStep("Cleanup completed");
      } catch (error) {
        results.errors.push(`Cleanup error: ${error.message}`);
      }
    }

    logStep("CRON sync completed", results);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cron-sync", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Sync supplier product data
async function syncSupplierData(supplier: any) {
  logStep(`Syncing supplier ${supplier.name}`, { id: supplier.id });
  
  // Simulate API call to supplier
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data sync result
  const mockUpdate = Math.floor(Math.random() * 50);
  const mockProducts = Math.floor(Math.random() * 100);
  
  return {
    updated: mockUpdate,
    products: mockProducts
  };
}

// Sync integration data (Shopify, WooCommerce, etc.)
async function syncIntegrationData(integration: any) {
  logStep(`Syncing integration ${integration.platform_name}`, { id: integration.id });
  
  switch (integration.platform_name.toLowerCase()) {
    case 'shopify':
      return await syncShopifyData(integration);
    case 'woocommerce':
      return await syncWooCommerceData(integration);
    case 'prestashop':
      return await syncPrestaShopData(integration);
    default:
      return { synced: 0 };
  }
}

async function syncShopifyData(integration: any) {
  // Simulate Shopify API sync
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock sync: inventory, orders, products
  return { synced: Math.floor(Math.random() * 20) };
}

async function syncWooCommerceData(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { synced: Math.floor(Math.random() * 15) };
}

async function syncPrestaShopData(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 700));
  return { synced: Math.floor(Math.random() * 10) };
}

// Update order tracking information
async function updateOrderTracking(order: any) {
  logStep(`Updating tracking for order ${order.id}`);
  
  // Simulate tracking API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock tracking update
  const trackingStatuses = ['processing', 'shipped', 'delivered'];
  const randomStatus = trackingStatuses[Math.floor(Math.random() * trackingStatuses.length)];
  
  // Only update if status changed
  return {
    updated: randomStatus !== order.status,
    status: randomStatus,
    tracking: `TRK-${Date.now()}`
  };
}

// Cleanup old data and logs
async function cleanupOldData(supabaseClient: any) {
  logStep("Starting cleanup");
  
  // Delete old logs older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await supabaseClient
    .from('activity_logs')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString());
  
  // Delete old failed import jobs
  await supabaseClient
    .from('extension_jobs')
    .delete()
    .eq('status', 'failed')
    .lt('created_at', thirtyDaysAgo.toISOString());
  
  logStep("Cleanup completed");
}