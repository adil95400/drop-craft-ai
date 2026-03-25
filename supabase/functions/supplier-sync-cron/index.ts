import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Enhanced supplier-sync-cron v2
 * - Multi-supplier fallback
 * - Optimal supplier selection algorithm
 * - Auto-deactivation / reactivation
 * - Auto-repricing with margin protection
 * - Runs every 5-15 min via pg_cron
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const CRON_SECRET = Deno.env.get("CRON_SECRET");

    // ── SECURITY: Require CRON_SECRET or valid service_role JWT ──
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");
    const isServiceRole = authHeader?.includes(supabaseKey);

    if (!cronSecret && !isServiceRole) {
      return json({ error: "Authentication required" }, 401);
    }
    if (cronSecret && CRON_SECRET && cronSecret !== CRON_SECRET) {
      const logClient = createClient(supabaseUrl, supabaseKey);
      await logClient.from("activity_logs").insert({
        action: "supplier_sync_auth_failed", entity_type: "security",
        description: "Unauthorized supplier-sync-cron trigger attempt",
        severity: "warn", source: "supplier_sync_cron",
      });
      return json({ error: "Unauthorized" }, 403);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[supplier-sync-cron] Starting enhanced sync v2...");

    // 1. Get all active supplier connections
    const { data: connections, error: connError } = await supabase
      .from("premium_supplier_connections")
      .select("id, user_id, premium_supplier_id, auto_sync_enabled, sync_interval_minutes, last_sync_at")
      .eq("connection_status", "connected")
      .eq("auto_sync_enabled", true);

    if (connError) throw connError;

    if (!connections?.length) {
      return json({ success: true, message: "No active connections", processed: 0 });
    }

    console.log(`[supplier-sync-cron] ${connections.length} active connections`);

    const results: any[] = [];
    const now = new Date();

    for (const conn of connections) {
      // Check interval
      if (conn.last_sync_at) {
        const elapsed = now.getTime() - new Date(conn.last_sync_at).getTime();
        if (elapsed < (conn.sync_interval_minutes || 15) * 60_000) continue;
      }

      try {
        const result = await syncConnection(supabase, conn, now);
        results.push(result);
      } catch (err) {
        console.error(`[supplier-sync-cron] Error connection ${conn.id}:`, err);
        results.push({ connectionId: conn.id, status: "error", error: String(err) });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    console.log(`[supplier-sync-cron] Done: ${successCount}/${results.length}`);

    return json({ success: true, processed: results.length, succeeded: successCount, results });
  } catch (error) {
    console.error("[supplier-sync-cron] Fatal:", error);
    return json({ success: false, error: String(error) }, 500);
  }
});

async function syncConnection(supabase: any, conn: any, now: Date) {
  const userId = conn.user_id;
  const supplierId = conn.premium_supplier_id;

  // Create job
  const { data: job } = await supabase
    .from("jobs")
    .insert({
      user_id: userId, job_type: "sync", job_subtype: "stock",
      status: "running", name: "Sync auto fournisseur",
      started_at: now.toISOString(),
      metadata: { supplier_connection_id: conn.id, supplier_id: supplierId },
    })
    .select("id").single();

  // Get all supplier products for this user+supplier
  const { data: products } = await supabase
    .from("supplier_products")
    .select("id, name, sku, stock_quantity, price, cost_price, selling_price, product_id, supplier_id, is_primary, priority, last_synced_at")
    .eq("user_id", userId)
    .eq("supplier_id", supplierId);

  // Load pricing rules
  const { data: pricingRules } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("user_id", userId).eq("is_active", true)
    .order("priority", { ascending: false });

  // Load fallback rules
  const { data: fallbackRules } = await supabase
    .from("supplier_fallback_rules")
    .select("*")
    .eq("user_id", userId).eq("is_active", true);

  let stats = {
    checked: products?.length || 0,
    outOfStock: 0, lowStock: 0, priceChanges: 0,
    deactivated: 0, reactivated: 0, repriced: 0, fallbacks: 0,
  };

  for (const product of products || []) {
    // ═══ STOCK MONITORING ═══
    if (product.stock_quantity === 0) {
      stats.outOfStock++;

      // Try fallback first
      const fallbackResult = await tryFallback(supabase, userId, product, fallbackRules || [], pricingRules || []);
      if (fallbackResult.switched) {
        stats.fallbacks++;
        continue; // Fallback handled it
      }

      // No fallback → deactivate
      if (product.product_id) {
        const deactivated = await deactivateProduct(supabase, userId, product);
        if (deactivated) stats.deactivated++;
      }

      await createNotification(supabase, userId, supplierId, "out_of_stock", "high",
        `Rupture: ${product.name}`,
        `${product.name} (${product.sku}) en rupture de stock`,
        { product_id: product.id, sku: product.sku, fallback_attempted: true, fallback_found: false }
      );

    } else if (product.stock_quantity <= 10) {
      stats.lowStock++;
      // Reactivate if needed
      if (product.product_id) {
        const reactivated = await reactivateIfNeeded(supabase, userId, product);
        if (reactivated) stats.reactivated++;
      }

      await createNotification(supabase, userId, supplierId, "low_stock", "medium",
        `Stock bas: ${product.name}`,
        `${product.name}: ${product.stock_quantity} unités`,
        { product_id: product.id, stock: product.stock_quantity }
      );
    } else {
      // Healthy stock — reactivate if was deactivated
      if (product.product_id) {
        const reactivated = await reactivateIfNeeded(supabase, userId, product);
        if (reactivated) stats.reactivated++;
      }
    }

    // ═══ PRICE CHANGE DETECTION + AUTO-REPRICING ═══
    const priceChanged = await detectPriceChange(supabase, product);
    if (priceChanged) {
      stats.priceChanges++;

      // If this is the primary supplier, update catalog price
      if (product.product_id && product.is_primary !== false) {
        const repriced = await applyAutoRepricing(supabase, userId, product, product.price, pricingRules || []);
        if (repriced) stats.repriced++;
      }

      // Check if another supplier is now better
      await evaluateOptimalSupplier(supabase, userId, product);
    }

    // Update last_synced_at
    await supabase.from("supplier_products")
      .update({ last_synced_at: now.toISOString() })
      .eq("id", product.id);
  }

  // Update connection
  await supabase.from("premium_supplier_connections")
    .update({ last_sync_at: now.toISOString() })
    .eq("id", conn.id);

  // Complete job
  if (job) {
    await supabase.from("jobs").update({
      status: "completed", completed_at: now.toISOString(),
      total_items: stats.checked, processed_items: stats.checked,
      progress_percent: 100,
      progress_message: `${stats.checked} produits — ${stats.outOfStock} ruptures, ${stats.deactivated} désactivés, ${stats.reactivated} réactivés, ${stats.repriced} repricés, ${stats.fallbacks} fallbacks`,
    }).eq("id", job.id);
  }

  // Log
  await supabase.from("activity_logs").insert({
    user_id: userId, action: "supplier_auto_sync",
    entity_type: "supplier", entity_id: supplierId,
    description: `Sync: ${stats.checked} produits, ${stats.outOfStock} ruptures, ${stats.fallbacks} fallbacks, ${stats.repriced} repricés`,
    details: stats, source: "automation",
  });

  return { connectionId: conn.id, supplierId, status: "success", ...stats };
}

/**
 * Multi-supplier fallback: when primary is out of stock,
 * find the best alternative supplier and switch
 */
async function tryFallback(
  supabase: any, userId: string, product: any,
  fallbackRules: any[], pricingRules: any[]
): Promise<{ switched: boolean }> {
  if (!product.product_id) return { switched: false };

  // Find rule for this product
  const rule = fallbackRules.find((r: any) => r.product_id === product.product_id);
  if (!rule?.auto_switch) return { switched: false };

  const fallbackSuppliers = (rule.fallback_suppliers || []) as Array<{
    supplier_id: string; priority: number; max_price?: number;
  }>;

  // Get all supplier_products linked to this catalog product
  const { data: alternatives } = await supabase
    .from("supplier_products")
    .select("id, supplier_id, price, stock_quantity, name, is_primary")
    .eq("product_id", product.product_id)
    .eq("user_id", userId)
    .gt("stock_quantity", 0)
    .neq("id", product.id);

  if (!alternatives?.length) return { switched: false };

  // Sort by fallback priority, then by optimal score
  const scored = alternatives.map((alt: any) => {
    const fbEntry = fallbackSuppliers.find((f: any) => f.supplier_id === alt.supplier_id);
    const priority = fbEntry?.priority ?? 999;
    const maxPriceOk = !fbEntry?.max_price || alt.price <= fbEntry.max_price;
    return { ...alt, priority, maxPriceOk };
  })
  .filter((a: any) => a.maxPriceOk)
  .sort((a: any, b: any) => a.priority - b.priority || a.price - b.price);

  if (!scored.length) return { switched: false };

  const best = scored[0];

  // Switch primary: demote old, promote new
  await supabase.from("supplier_products")
    .update({ is_primary: false }).eq("id", product.id);
  await supabase.from("supplier_products")
    .update({ is_primary: true }).eq("id", best.id);

  // Update catalog product cost_price
  await supabase.from("products")
    .update({ cost_price: best.price, status: "active" })
    .eq("id", product.product_id);

  // Reprice with new cost
  await applyAutoRepricing(supabase, userId, { ...best, product_id: product.product_id }, best.price, pricingRules);

  // Record
  await supabase.from("price_change_history").insert({
    user_id: userId, product_id: product.product_id,
    supplier_product_id: best.id,
    old_price: product.price || 0, new_price: best.price,
    change_percent: product.price > 0 ? ((best.price - product.price) / product.price) * 100 : 0,
    change_type: "fallback",
    change_reason: `Basculement auto vers fournisseur alternatif (priorité ${best.priority})`,
    source: "supplier_sync_cron",
    metadata: { old_supplier_id: product.supplier_id, new_supplier_id: best.supplier_id, rule_id: rule.id },
  });

  // Update fallback rule stats
  await supabase.from("supplier_fallback_rules")
    .update({ last_switch_at: new Date().toISOString(), switch_count: (rule.switch_count || 0) + 1 })
    .eq("id", rule.id);

  // Log & notify
  await supabase.from("activity_logs").insert({
    user_id: userId, action: "supplier_fallback_switch",
    entity_type: "product", entity_id: product.product_id,
    description: `Fallback: ${product.name} → nouveau fournisseur (prix: ${best.price}€)`,
    details: { old_supplier: product.supplier_id, new_supplier: best.supplier_id, new_price: best.price },
    source: "automation", severity: "warn",
  });

  if (rule.notify_on_switch) {
    await createNotification(supabase, userId, product.supplier_id, "fallback_switch", "high",
      `Fournisseur alternatif activé: ${product.name}`,
      `Basculement automatique vers un fournisseur avec stock`,
      { product_id: product.product_id, new_supplier: best.supplier_id }
    );
  }

  return { switched: true };
}

/**
 * Evaluate if another supplier offers a better deal for this product
 */
async function evaluateOptimalSupplier(supabase: any, userId: string, product: any) {
  if (!product.product_id || product.is_primary === false) return;

  const { data: alternatives } = await supabase
    .from("supplier_products")
    .select("id, supplier_id, price, stock_quantity, name")
    .eq("product_id", product.product_id)
    .eq("user_id", userId)
    .gt("stock_quantity", 0)
    .neq("id", product.id);

  if (!alternatives?.length) return;

  // Find if any alternative is significantly cheaper (>5%)
  const currentPrice = product.price || 0;
  const better = alternatives.find((a: any) =>
    a.price < currentPrice * 0.95 && (a.stock_quantity || 0) >= 5
  );

  if (better) {
    // Create a recommendation (don't auto-switch for price-based, only for stockout)
    await supabase.from("ai_recommendations").insert({
      user_id: userId,
      recommendation_type: "supplier_switch",
      title: `Fournisseur moins cher pour ${product.name}`,
      description: `${better.name} propose ce produit à ${better.price}€ vs ${currentPrice}€ actuel (-${(((currentPrice - better.price) / currentPrice) * 100).toFixed(1)}%)`,
      confidence_score: 0.85,
      impact_estimate: `${(currentPrice - better.price).toFixed(2)}€/unité`,
      source_product_id: product.product_id,
      status: "pending",
      metadata: {
        current_supplier_product_id: product.id,
        better_supplier_product_id: better.id,
        price_diff: currentPrice - better.price,
      },
    });
  }
}

async function detectPriceChange(supabase: any, product: any): Promise<boolean> {
  const { data: history } = await supabase
    .from("price_history")
    .select("price")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(2);

  if (!history || history.length < 2) return false;
  const pct = Math.abs(history[0].price - history[1].price) / history[1].price * 100;
  return pct >= 3;
}

async function deactivateProduct(supabase: any, userId: string, product: any): Promise<boolean> {
  const { data: cat } = await supabase.from("products")
    .select("id, status").eq("id", product.product_id).single();
  if (!cat || cat.status === "inactive" || cat.status === "out_of_stock") return false;

  await supabase.from("products").update({ status: "out_of_stock" }).eq("id", product.product_id);

  await supabase.from("activity_logs").insert({
    user_id: userId, action: "product_auto_deactivated",
    entity_type: "product", entity_id: product.product_id,
    description: `Désactivé: rupture fournisseur (${product.name})`,
    details: { supplier_product_id: product.id }, source: "automation", severity: "warn",
  });

  await supabase.from("price_change_history").insert({
    user_id: userId, product_id: product.product_id,
    supplier_product_id: product.id,
    old_price: product.selling_price || product.price || 0,
    new_price: product.selling_price || product.price || 0,
    change_percent: 0, change_type: "stockout_deactivation",
    change_reason: "Auto-désactivation: rupture stock", source: "supplier_sync_cron",
  });

  return true;
}

async function reactivateIfNeeded(supabase: any, userId: string, product: any): Promise<boolean> {
  const { data: cat } = await supabase.from("products")
    .select("id, status").eq("id", product.product_id).single();
  if (!cat || cat.status !== "out_of_stock") return false;

  await supabase.from("products").update({ status: "active" }).eq("id", product.product_id);

  await supabase.from("activity_logs").insert({
    user_id: userId, action: "product_auto_reactivated",
    entity_type: "product", entity_id: product.product_id,
    description: `Réactivé: stock revenu (${product.stock_quantity} unités)`,
    details: { supplier_product_id: product.id, new_stock: product.stock_quantity },
    source: "automation", severity: "info",
  });

  return true;
}

async function applyAutoRepricing(
  supabase: any, userId: string, product: any,
  newCost: number, pricingRules: any[]
): Promise<boolean> {
  if (!product.product_id) return false;

  const { data: cat } = await supabase.from("products")
    .select("id, price, cost_price").eq("id", product.product_id).single();
  if (!cat) return false;

  const oldPrice = cat.price || 0;
  let newPrice = oldPrice;
  let appliedRule = "none";

  for (const rule of pricingRules) {
    const calc = rule.calculation || {};
    const type = rule.rule_type || calc.type;

    if (type === "margin_percent" || type === "markup") {
      const pct = calc.value || calc.margin_percent || 30;
      newPrice = newCost * (1 + pct / 100);
      appliedRule = `${rule.name} (marge ${pct}%)`;
      break;
    } else if (type === "fixed_markup") {
      const amt = calc.value || calc.fixed_amount || 5;
      newPrice = newCost + amt;
      appliedRule = `${rule.name} (+${amt}€)`;
      break;
    } else if (type === "multiplier") {
      const mult = calc.value || calc.multiplier || 2;
      newPrice = newCost * mult;
      appliedRule = `${rule.name} (x${mult})`;
      break;
    }
  }

  // Min margin 10%
  const minPrice = newCost * 1.1;
  if (newPrice < minPrice) {
    newPrice = minPrice;
    appliedRule += " + marge min";
  }

  newPrice = Math.round(newPrice * 100) / 100;
  if (Math.abs(newPrice - oldPrice) < 0.01) return false;

  await supabase.from("products")
    .update({ price: newPrice, cost_price: newCost })
    .eq("id", cat.id);

  await supabase.from("price_change_history").insert({
    user_id: userId, product_id: cat.id,
    supplier_product_id: product.id,
    old_price: oldPrice, new_price: newPrice,
    change_percent: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0,
    change_type: "auto_repricing",
    change_reason: `Auto-repricing: ${appliedRule}`,
    source: "supplier_sync_cron",
    metadata: { supplier_price: newCost, rule: appliedRule },
  });

  await supabase.from("activity_logs").insert({
    user_id: userId, action: "product_auto_repriced",
    entity_type: "product", entity_id: cat.id,
    description: `Prix: ${oldPrice}€ → ${newPrice}€ (${appliedRule})`,
    details: { old_price: oldPrice, new_price: newPrice, cost: newCost, rule: appliedRule },
    source: "automation", severity: "info",
  });

  return true;
}

async function createNotification(
  supabase: any, userId: string, supplierId: string,
  type: string, severity: string, title: string, message: string, data: any
) {
  await supabase.from("supplier_notifications").insert({
    user_id: userId, supplier_id: supplierId,
    notification_type: type, severity, title, message, data,
  });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
