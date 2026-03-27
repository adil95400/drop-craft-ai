import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case "check_fallbacks": return await checkFallbacks(supabase, params);
      case "execute_fallback": return await executeFallback(supabase, params);
      case "get_fallback_status": return await getFallbackStatus(supabase, params);
      case "get_fallback_history": return await getFallbackHistory(supabase, params);
      case "configure_rules": return await configureRules(supabase, params);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("auto-fallback error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Check all products for fallback opportunities:
 * 1. Primary supplier out of stock → switch to next priority supplier
 * 2. Better price available from alternate supplier
 */
async function checkFallbacks(supabase: any, params: { user_id: string }) {
  const { user_id } = params;

  // Get all supplier links grouped by product
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, product_id, supplier_id, supplier_name, supplier_url, is_primary, priority, last_seen_price, last_seen_stock, metadata")
    .eq("user_id", user_id)
    .order("priority", { ascending: true });

  if (!links?.length) return json({ fallbacks: [], message: "No supplier links" });

  // Group by product
  const productLinks = new Map<string, any[]>();
  for (const link of links) {
    const existing = productLinks.get(link.product_id) || [];
    existing.push(link);
    productLinks.set(link.product_id, existing);
  }

  const fallbackOpportunities: any[] = [];

  for (const [productId, pLinks] of productLinks) {
    // Only relevant for products with multiple suppliers
    if (pLinks.length < 2) continue;

    const primary = pLinks.find((l: any) => l.is_primary);
    const alternates = pLinks.filter((l: any) => !l.is_primary).sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));

    if (!primary || !alternates.length) continue;

    // Check 1: Primary out of stock
    if (primary.last_seen_stock != null && primary.last_seen_stock === 0) {
      const inStockAlt = alternates.find((a: any) => a.last_seen_stock == null || a.last_seen_stock > 0);
      if (inStockAlt) {
        fallbackOpportunities.push({
          type: "stockout",
          product_id: productId,
          current_supplier: { id: primary.id, name: primary.supplier_name, stock: 0 },
          fallback_supplier: { id: inStockAlt.id, name: inStockAlt.supplier_name, stock: inStockAlt.last_seen_stock, price: inStockAlt.last_seen_price },
          severity: "critical",
          auto_executable: true,
        });
      }
    }

    // Check 2: Better price from alternate (>10% cheaper)
    if (primary.last_seen_price != null && primary.last_seen_price > 0) {
      for (const alt of alternates) {
        if (alt.last_seen_price != null && alt.last_seen_price > 0) {
          const savings = ((primary.last_seen_price - alt.last_seen_price) / primary.last_seen_price) * 100;
          if (savings >= 10) {
            fallbackOpportunities.push({
              type: "better_price",
              product_id: productId,
              current_supplier: { id: primary.id, name: primary.supplier_name, price: primary.last_seen_price },
              fallback_supplier: { id: alt.id, name: alt.supplier_name, price: alt.last_seen_price, stock: alt.last_seen_stock },
              savings_percent: +savings.toFixed(1),
              savings_amount: +(primary.last_seen_price - alt.last_seen_price).toFixed(2),
              severity: savings >= 20 ? "high" : "medium",
              auto_executable: false, // Price changes need review
            });
          }
        }
      }
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  fallbackOpportunities.sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] || 3) -
    (severityOrder[b.severity as keyof typeof severityOrder] || 3)
  );

  return json({
    fallbacks: fallbackOpportunities,
    summary: {
      stockout_count: fallbackOpportunities.filter((f) => f.type === "stockout").length,
      better_price_count: fallbackOpportunities.filter((f) => f.type === "better_price").length,
      total_potential_savings: fallbackOpportunities
        .filter((f) => f.type === "better_price")
        .reduce((sum: number, f: any) => sum + (f.savings_amount || 0), 0),
    },
  });
}

/**
 * Execute a fallback: switch primary supplier for a product
 */
async function executeFallback(supabase: any, params: {
  product_id: string;
  old_primary_link_id: string;
  new_primary_link_id: string;
  reason: string;
  user_id: string;
}) {
  const { product_id, old_primary_link_id, new_primary_link_id, reason, user_id } = params;

  // Demote old primary
  await supabase
    .from("product_supplier_links")
    .update({ is_primary: false, priority: 2 })
    .eq("id", old_primary_link_id);

  // Promote new primary
  const { data: newPrimary } = await supabase
    .from("product_supplier_links")
    .update({ is_primary: true, priority: 1 })
    .eq("id", new_primary_link_id)
    .select("supplier_name, last_seen_price, last_seen_stock")
    .single();

  // Update product cost_price if available
  if (newPrimary?.last_seen_price) {
    await supabase
      .from("products")
      .update({ cost_price: newPrimary.last_seen_price })
      .eq("id", product_id);
  }

  // Log the fallback in metadata
  const { data: link } = await supabase
    .from("product_supplier_links")
    .select("metadata")
    .eq("id", new_primary_link_id)
    .single();

  const meta = link?.metadata || {};
  const fallbackHistory = meta.fallback_history || [];
  fallbackHistory.unshift({
    timestamp: new Date().toISOString(),
    reason,
    from: old_primary_link_id,
    to: new_primary_link_id,
  });

  await supabase
    .from("product_supplier_links")
    .update({ metadata: { ...meta, fallback_history: fallbackHistory.slice(0, 20) } })
    .eq("id", new_primary_link_id);

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id,
    action: "supplier_fallback",
    entity_type: "product",
    entity_id: product_id,
    description: `Fallback: ${reason} → ${newPrimary?.supplier_name}`,
    details: { reason, old_primary_link_id, new_primary_link_id },
  }).catch(() => {});

  return json({
    success: true,
    product_id,
    new_primary: newPrimary?.supplier_name,
    reason,
  });
}

/**
 * Get fallback status for all products
 */
async function getFallbackStatus(supabase: any, params: { user_id: string }) {
  const { user_id } = params;

  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("product_id, supplier_name, is_primary, last_seen_stock, last_seen_price, priority")
    .eq("user_id", user_id);

  if (!links?.length) return json({ products: [] });

  const productMap = new Map<string, any>();
  for (const link of links) {
    if (!productMap.has(link.product_id)) {
      productMap.set(link.product_id, { suppliers: [], has_fallback: false, primary_healthy: true });
    }
    const p = productMap.get(link.product_id)!;
    p.suppliers.push(link);
    if (!link.is_primary) p.has_fallback = true;
    if (link.is_primary && link.last_seen_stock === 0) p.primary_healthy = false;
  }

  const products = [...productMap.entries()].map(([id, data]) => ({
    product_id: id,
    supplier_count: data.suppliers.length,
    has_fallback: data.has_fallback,
    primary_healthy: data.primary_healthy,
    primary_supplier: data.suppliers.find((s: any) => s.is_primary)?.supplier_name,
    status: !data.primary_healthy && data.has_fallback ? "needs_fallback" :
            !data.primary_healthy ? "at_risk" :
            data.has_fallback ? "protected" : "single_source",
  }));

  return json({
    products,
    summary: {
      protected: products.filter((p) => p.status === "protected").length,
      needs_fallback: products.filter((p) => p.status === "needs_fallback").length,
      at_risk: products.filter((p) => p.status === "at_risk").length,
      single_source: products.filter((p) => p.status === "single_source").length,
    },
  });
}

/**
 * Get fallback history
 */
async function getFallbackHistory(supabase: any, params: { user_id: string; limit?: number }) {
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", params.user_id)
    .eq("action", "supplier_fallback")
    .order("created_at", { ascending: false })
    .limit(params.limit || 20);

  return json({ history: logs || [] });
}

/**
 * Configure fallback rules
 */
async function configureRules(supabase: any, params: {
  user_id: string;
  rules: {
    auto_switch_on_stockout: boolean;
    price_threshold_percent: number;
    notify_on_fallback: boolean;
  };
}) {
  // Store in user's profile or settings — using first link's metadata as global config
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, metadata")
    .eq("user_id", params.user_id)
    .limit(1);

  if (links?.length) {
    const meta = links[0].metadata || {};
    await supabase.from("product_supplier_links").update({
      metadata: { ...meta, fallback_rules: params.rules },
    }).eq("id", links[0].id);
  }

  return json({ success: true, rules: params.rules });
}
