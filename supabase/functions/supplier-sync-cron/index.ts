import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Cron-triggered edge function that monitors all active suppliers
 * for stock and price changes. Runs every 15 minutes via pg_cron.
 * 
 * Logs sync activity in `jobs` table (unified) for real-time tracking.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[supplier-sync-cron] Starting scheduled supplier sync...");

    const { data: connections, error: connError } = await supabase
      .from("premium_supplier_connections")
      .select("id, user_id, premium_supplier_id, auto_sync_enabled, sync_interval_minutes, last_sync_at")
      .eq("connection_status", "connected")
      .eq("auto_sync_enabled", true);

    if (connError) {
      console.error("[supplier-sync-cron] Error fetching connections:", connError);
      throw connError;
    }

    if (!connections || connections.length === 0) {
      console.log("[supplier-sync-cron] No active supplier connections found");
      return new Response(
        JSON.stringify({ success: true, message: "No active connections", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[supplier-sync-cron] Found ${connections.length} active connections`);

    const results: any[] = [];
    const now = new Date();

    for (const conn of connections) {
      if (conn.last_sync_at) {
        const lastSync = new Date(conn.last_sync_at);
        const intervalMs = (conn.sync_interval_minutes || 15) * 60 * 1000;
        if (now.getTime() - lastSync.getTime() < intervalMs) {
          console.log(`[supplier-sync-cron] Skipping ${conn.premium_supplier_id} - not due yet`);
          continue;
        }
      }

      try {
        // Create job in unified `jobs` table
        const { data: job } = await supabase
          .from("jobs")
          .insert({
            user_id: conn.user_id,
            job_type: "sync",
            job_subtype: "stock",
            status: "running",
            name: `Sync auto fournisseur`,
            started_at: now.toISOString(),
            metadata: { supplier_connection_id: conn.id, supplier_id: conn.premium_supplier_id },
          })
          .select("id")
          .single();

        // Check stock levels
        const { data: products } = await supabase
          .from("supplier_products")
          .select("id, name, sku, stock_quantity, price, last_synced_at")
          .eq("user_id", conn.user_id)
          .eq("supplier_id", conn.premium_supplier_id);

        let outOfStockCount = 0;
        let lowStockCount = 0;
        let priceChanges = 0;
        const checkedCount = products?.length || 0;

        for (const product of products || []) {
          // Stock monitoring
          if (product.stock_quantity === 0) {
            outOfStockCount++;
            await supabase.from("supplier_notifications").insert({
              user_id: conn.user_id,
              supplier_id: conn.premium_supplier_id,
              notification_type: "out_of_stock",
              severity: "high",
              title: `Rupture: ${product.name}`,
              message: `${product.name} (${product.sku}) est en rupture de stock`,
              data: { product_id: product.id, sku: product.sku },
            });
          } else if (product.stock_quantity <= 10) {
            lowStockCount++;
            await supabase.from("supplier_notifications").insert({
              user_id: conn.user_id,
              supplier_id: conn.premium_supplier_id,
              notification_type: "low_stock",
              severity: "medium",
              title: `Stock bas: ${product.name}`,
              message: `${product.name} (${product.sku}): ${product.stock_quantity} unités restantes`,
              data: { product_id: product.id, sku: product.sku, stock: product.stock_quantity },
            });
          }

          // Price change detection
          const { data: priceHistory } = await supabase
            .from("price_history")
            .select("price")
            .eq("product_id", product.id)
            .order("created_at", { ascending: false })
            .limit(2);

          if (priceHistory && priceHistory.length >= 2) {
            const diff = Math.abs(priceHistory[0].price - priceHistory[1].price);
            const pct = (diff / priceHistory[1].price) * 100;
            if (pct >= 5) {
              priceChanges++;
              const changeType = priceHistory[0].price > priceHistory[1].price ? "augmenté" : "diminué";
              await supabase.from("notifications").insert({
                user_id: conn.user_id,
                type: "price_change",
                title: `Prix ${changeType}: ${product.name}`,
                message: `${pct.toFixed(1)}% (${priceHistory[1].price}€ → ${priceHistory[0].price}€)`,
                severity: pct >= 10 ? "high" : "medium",
                metadata: { product_id: product.id, old_price: priceHistory[1].price, new_price: priceHistory[0].price },
              });
            }
          }
        }

        // Update connection last_sync_at
        await supabase
          .from("premium_supplier_connections")
          .update({ last_sync_at: now.toISOString() })
          .eq("id", conn.id);

        // Complete the job in unified `jobs` table
        if (job) {
          await supabase
            .from("jobs")
            .update({
              status: "completed",
              completed_at: now.toISOString(),
              total_items: checkedCount,
              processed_items: checkedCount,
              failed_items: 0,
              progress_percent: 100,
              progress_message: `${checkedCount} produits vérifiés — ${outOfStockCount} ruptures, ${lowStockCount} stocks bas, ${priceChanges} changements de prix`,
            })
            .eq("id", job.id);
        }

        results.push({
          connectionId: conn.id,
          supplierId: conn.premium_supplier_id,
          checked: checkedCount,
          outOfStock: outOfStockCount,
          lowStock: lowStockCount,
          priceChanges,
          status: "success",
        });

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: conn.user_id,
          action: "supplier_auto_sync",
          entity_type: "supplier",
          entity_id: conn.premium_supplier_id,
          description: `Sync auto: ${checkedCount} produits, ${outOfStockCount} ruptures, ${priceChanges} prix modifiés`,
          details: { checked: checkedCount, out_of_stock: outOfStockCount, low_stock: lowStockCount, price_changes: priceChanges },
        });
      } catch (err) {
        console.error(`[supplier-sync-cron] Error for connection ${conn.id}:`, err);
        results.push({
          connectionId: conn.id,
          supplierId: conn.premium_supplier_id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    console.log(`[supplier-sync-cron] Completed: ${successCount}/${results.length} suppliers synced`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[supplier-sync-cron] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
