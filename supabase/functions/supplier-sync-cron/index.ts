import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Enhanced Cron-triggered edge function that monitors all active suppliers
 * for stock and price changes. Runs every 15 minutes via pg_cron.
 *
 * NEW: Auto-deactivation on stockout, auto-repricing on price change,
 * re-activation when stock returns.
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
          .select("id, name, sku, stock_quantity, price, selling_price, product_id, last_synced_at")
          .eq("user_id", conn.user_id)
          .eq("supplier_id", conn.premium_supplier_id);

        let outOfStockCount = 0;
        let lowStockCount = 0;
        let priceChanges = 0;
        let deactivatedCount = 0;
        let reactivatedCount = 0;
        let repricedCount = 0;
        const checkedCount = products?.length || 0;

        // Load user's pricing rules for auto-repricing
        const { data: pricingRules } = await supabase
          .from("pricing_rules")
          .select("*")
          .eq("user_id", conn.user_id)
          .eq("is_active", true)
          .order("priority", { ascending: false });

        for (const product of products || []) {
          // === STOCK MONITORING ===
          if (product.stock_quantity === 0) {
            outOfStockCount++;

            // AUTO-DEACTIVATION: Deactivate linked catalog product
            if (product.product_id) {
              const { data: catalogProduct } = await supabase
                .from("products")
                .select("id, status")
                .eq("id", product.product_id)
                .single();

              if (catalogProduct && catalogProduct.status !== 'inactive' && catalogProduct.status !== 'out_of_stock') {
                await supabase
                  .from("products")
                  .update({ status: 'out_of_stock' })
                  .eq("id", product.product_id);

                deactivatedCount++;

                // Log the auto-action
                await supabase.from("activity_logs").insert({
                  user_id: conn.user_id,
                  action: "product_auto_deactivated",
                  entity_type: "product",
                  entity_id: product.product_id,
                  description: `Produit désactivé automatiquement: rupture fournisseur (${product.name})`,
                  details: { supplier_product_id: product.id, sku: product.sku },
                  source: "automation",
                  severity: "warn",
                });

                // Record in price_change_history for tracking
                await supabase.from("price_change_history").insert({
                  user_id: conn.user_id,
                  product_id: product.product_id,
                  supplier_product_id: product.id,
                  old_price: product.selling_price || product.price || 0,
                  new_price: product.selling_price || product.price || 0,
                  change_percent: 0,
                  change_type: "stockout_deactivation",
                  change_reason: "Auto-désactivation: rupture stock fournisseur",
                  source: "supplier_sync_cron",
                });
              }
            }

            await supabase.from("supplier_notifications").insert({
              user_id: conn.user_id,
              supplier_id: conn.premium_supplier_id,
              notification_type: "out_of_stock",
              severity: "high",
              title: `Rupture: ${product.name}`,
              message: `${product.name} (${product.sku}) est en rupture de stock`,
              data: { product_id: product.id, sku: product.sku, auto_deactivated: !!product.product_id },
            });
          } else if (product.stock_quantity <= 10) {
            lowStockCount++;

            // RE-ACTIVATION: If product was deactivated due to stockout, re-enable it
            if (product.product_id) {
              const { data: catalogProduct } = await supabase
                .from("products")
                .select("id, status")
                .eq("id", product.product_id)
                .single();

              if (catalogProduct && catalogProduct.status === 'out_of_stock') {
                await supabase
                  .from("products")
                  .update({ status: 'active' })
                  .eq("id", product.product_id);

                reactivatedCount++;

                await supabase.from("activity_logs").insert({
                  user_id: conn.user_id,
                  action: "product_auto_reactivated",
                  entity_type: "product",
                  entity_id: product.product_id,
                  description: `Produit réactivé automatiquement: stock revenu (${product.stock_quantity} unités)`,
                  details: { supplier_product_id: product.id, new_stock: product.stock_quantity },
                  source: "automation",
                  severity: "info",
                });
              }
            }

            await supabase.from("supplier_notifications").insert({
              user_id: conn.user_id,
              supplier_id: conn.premium_supplier_id,
              notification_type: "low_stock",
              severity: "medium",
              title: `Stock bas: ${product.name}`,
              message: `${product.name} (${product.sku}): ${product.stock_quantity} unités restantes`,
              data: { product_id: product.id, sku: product.sku, stock: product.stock_quantity },
            });
          } else {
            // Stock is healthy — re-activate if needed
            if (product.product_id) {
              const { data: catalogProduct } = await supabase
                .from("products")
                .select("id, status")
                .eq("id", product.product_id)
                .single();

              if (catalogProduct && catalogProduct.status === 'out_of_stock') {
                await supabase
                  .from("products")
                  .update({ status: 'active' })
                  .eq("id", product.product_id);
                reactivatedCount++;
              }
            }
          }

          // === PRICE CHANGE DETECTION + AUTO-REPRICING ===
          const { data: priceHistory } = await supabase
            .from("price_history")
            .select("price")
            .eq("product_id", product.id)
            .order("created_at", { ascending: false })
            .limit(2);

          if (priceHistory && priceHistory.length >= 2) {
            const currentPrice = priceHistory[0].price;
            const previousPrice = priceHistory[1].price;
            const diff = Math.abs(currentPrice - previousPrice);
            const pct = (diff / previousPrice) * 100;

            if (pct >= 3) {
              priceChanges++;
              const changeType = currentPrice > previousPrice ? "augmenté" : "diminué";

              // AUTO-REPRICING: Apply pricing rules to linked catalog product
              if (product.product_id && pricingRules && pricingRules.length > 0) {
                const repricingResult = await applyAutoRepricing(
                  supabase, conn.user_id, product, currentPrice, pricingRules
                );
                if (repricingResult.repriced) {
                  repricedCount++;
                }
              }

              // Notification for significant price changes
              if (pct >= 5) {
                await supabase.from("notifications").insert({
                  user_id: conn.user_id,
                  type: "price_change",
                  title: `Prix ${changeType}: ${product.name}`,
                  message: `${pct.toFixed(1)}% (${previousPrice}€ → ${currentPrice}€)`,
                  severity: pct >= 10 ? "high" : "medium",
                  metadata: {
                    product_id: product.id,
                    old_price: previousPrice,
                    new_price: currentPrice,
                    auto_repriced: product.product_id ? true : false,
                  },
                });
              }
            }
          }
        }

        // Update connection last_sync_at
        await supabase
          .from("premium_supplier_connections")
          .update({ last_sync_at: now.toISOString() })
          .eq("id", conn.id);

        // Complete the job
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
              progress_message: `${checkedCount} produits — ${outOfStockCount} ruptures, ${deactivatedCount} désactivés, ${reactivatedCount} réactivés, ${repricedCount} repricés, ${priceChanges} variations prix`,
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
          deactivated: deactivatedCount,
          reactivated: reactivatedCount,
          repriced: repricedCount,
          status: "success",
        });

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: conn.user_id,
          action: "supplier_auto_sync",
          entity_type: "supplier",
          entity_id: conn.premium_supplier_id,
          description: `Sync auto: ${checkedCount} produits, ${outOfStockCount} ruptures, ${deactivatedCount} désactivés, ${repricedCount} repricés`,
          details: {
            checked: checkedCount,
            out_of_stock: outOfStockCount,
            low_stock: lowStockCount,
            price_changes: priceChanges,
            deactivated: deactivatedCount,
            reactivated: reactivatedCount,
            repriced: repricedCount,
          },
          source: "automation",
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

/**
 * Auto-repricing engine: applies user's pricing rules when supplier cost changes.
 * Calculates new selling price based on margin rules and updates catalog product.
 */
async function applyAutoRepricing(
  supabase: any,
  userId: string,
  supplierProduct: any,
  newSupplierPrice: number,
  pricingRules: any[]
): Promise<{ repriced: boolean; oldPrice?: number; newPrice?: number; rule?: string }> {
  try {
    if (!supplierProduct.product_id) {
      return { repriced: false };
    }

    // Get current catalog product
    const { data: catalogProduct } = await supabase
      .from("products")
      .select("id, price, cost_price, status")
      .eq("id", supplierProduct.product_id)
      .single();

    if (!catalogProduct) return { repriced: false };

    const oldSellingPrice = catalogProduct.price || 0;
    let newSellingPrice = oldSellingPrice;
    let appliedRule = "none";

    // Find the best matching pricing rule
    for (const rule of pricingRules) {
      const calc = rule.calculation || {};
      const ruleType = rule.rule_type || calc.type;

      if (ruleType === "margin_percent" || ruleType === "markup") {
        // Margin-based pricing: cost * (1 + margin%)
        const marginPercent = calc.value || calc.margin_percent || 30;
        newSellingPrice = newSupplierPrice * (1 + marginPercent / 100);
        appliedRule = `${rule.name} (marge ${marginPercent}%)`;
        break;
      } else if (ruleType === "fixed_markup") {
        // Fixed markup: cost + fixed amount
        const fixedAmount = calc.value || calc.fixed_amount || 5;
        newSellingPrice = newSupplierPrice + fixedAmount;
        appliedRule = `${rule.name} (markup fixe ${fixedAmount}€)`;
        break;
      } else if (ruleType === "multiplier") {
        // Multiplier: cost * X
        const multiplier = calc.value || calc.multiplier || 2;
        newSellingPrice = newSupplierPrice * multiplier;
        appliedRule = `${rule.name} (x${multiplier})`;
        break;
      }
    }

    // Apply minimum margin protection (never go below 10% margin)
    const minMarginPercent = 10;
    const minPrice = newSupplierPrice * (1 + minMarginPercent / 100);
    if (newSellingPrice < minPrice) {
      newSellingPrice = minPrice;
      appliedRule += " + protection marge min";
    }

    // Round to 2 decimals
    newSellingPrice = Math.round(newSellingPrice * 100) / 100;

    // Only update if price actually changed
    if (Math.abs(newSellingPrice - oldSellingPrice) < 0.01) {
      return { repriced: false };
    }

    // Update catalog product price and cost
    await supabase
      .from("products")
      .update({
        price: newSellingPrice,
        cost_price: newSupplierPrice,
      })
      .eq("id", catalogProduct.id);

    // Record in price_change_history
    await supabase.from("price_change_history").insert({
      user_id: userId,
      product_id: catalogProduct.id,
      supplier_product_id: supplierProduct.id,
      old_price: oldSellingPrice,
      new_price: newSellingPrice,
      change_percent: oldSellingPrice > 0
        ? ((newSellingPrice - oldSellingPrice) / oldSellingPrice) * 100
        : 0,
      change_type: "auto_repricing",
      change_reason: `Auto-repricing: coût fournisseur modifié → ${appliedRule}`,
      source: "supplier_sync_cron",
      metadata: {
        supplier_old_price: supplierProduct.price,
        supplier_new_price: newSupplierPrice,
        rule_applied: appliedRule,
      },
    });

    // Log the action
    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "product_auto_repriced",
      entity_type: "product",
      entity_id: catalogProduct.id,
      description: `Prix ajusté: ${oldSellingPrice}€ → ${newSellingPrice}€ (${appliedRule})`,
      details: {
        old_price: oldSellingPrice,
        new_price: newSellingPrice,
        supplier_price: newSupplierPrice,
        rule: appliedRule,
      },
      source: "automation",
      severity: "info",
    });

    return { repriced: true, oldPrice: oldSellingPrice, newPrice: newSellingPrice, rule: appliedRule };
  } catch (error) {
    console.error("[AUTO-REPRICING] Error:", error);
    return { repriced: false };
  }
}
