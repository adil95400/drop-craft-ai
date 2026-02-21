import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }).auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Get products with margin data
    const { data: products } = await supabase
      .from("products")
      .select("id, title, price, cost_price, stock_quantity, sales_count, tags, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!products?.length) {
      return new Response(JSON.stringify({ success: true, opportunities: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze each product for opportunities
    const opportunities = [];

    for (const p of products) {
      const margin = p.price && p.cost_price ? ((p.price - p.cost_price) / p.price) * 100 : 0;
      const dailySales = p.sales_count && p.sales_count > 0 ? p.sales_count / 30 : 0;

      // High margin opportunity
      if (margin > 40 && dailySales > 0.5) {
        opportunities.push({
          user_id: user.id,
          product_id: p.id,
          opportunity_type: "high_margin",
          opportunity_score: Math.min(100, margin + dailySales * 10),
          estimated_margin: margin,
          estimated_demand: Math.round(dailySales * 30),
          competition_level: margin > 60 ? "low" : "medium",
          reasoning: `Marge élevée de ${margin.toFixed(1)}% avec ${dailySales.toFixed(1)} ventes/jour`,
          status: "new",
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
      }

      // Trending (high sales velocity)
      if (dailySales > 2) {
        opportunities.push({
          user_id: user.id,
          product_id: p.id,
          opportunity_type: "trending",
          opportunity_score: Math.min(100, dailySales * 15),
          estimated_margin: margin,
          estimated_demand: Math.round(dailySales * 30),
          competition_level: "medium",
          reasoning: `Vélocité élevée: ${dailySales.toFixed(1)} ventes/jour`,
          status: "new",
          expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
        });
      }

      // Low stock + high demand = restock opportunity
      if ((p.stock_quantity || 0) < 10 && dailySales > 0.3) {
        opportunities.push({
          user_id: user.id,
          product_id: p.id,
          opportunity_type: "seasonal",
          opportunity_score: 75,
          estimated_margin: margin,
          estimated_demand: Math.round(dailySales * 30),
          competition_level: "low",
          reasoning: `Stock critique (${p.stock_quantity}) avec demande active — réapprovisionnement urgent`,
          status: "new",
          expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        });
      }
    }

    // Insert opportunities (deduplicate by product + type)
    if (opportunities.length > 0) {
      // Clear old expired
      await supabase
        .from("product_opportunities")
        .delete()
        .eq("user_id", user.id)
        .lt("expires_at", new Date().toISOString());

      // Insert new
      const { error: insertError } = await supabase
        .from("product_opportunities")
        .insert(opportunities.slice(0, 50));

      if (insertError) console.error("Insert error:", insertError);
    }

    // Generate smart alerts for critical findings
    const criticalAlerts = [];
    
    const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= 3 && (p.sales_count || 0) > 0);
    if (lowStockProducts.length > 0) {
      criticalAlerts.push({
        user_id: user.id,
        alert_category: "stock",
        severity: "critical",
        priority_score: 90,
        title: `${lowStockProducts.length} produit(s) en rupture imminente`,
        message: `Les produits suivants ont moins de 3 unités en stock: ${lowStockProducts.map(p => p.title).slice(0, 3).join(", ")}`,
        source: "opportunity-scanner",
        entity_type: "product",
        metadata: { product_ids: lowStockProducts.map(p => p.id) },
        actions: JSON.stringify([{ label: "Voir les produits", action: "navigate", url: "/products" }]),
        expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      });
    }

    if (opportunities.filter(o => o.opportunity_type === "high_margin").length > 3) {
      criticalAlerts.push({
        user_id: user.id,
        alert_category: "opportunity",
        severity: "medium",
        priority_score: 60,
        title: `${opportunities.filter(o => o.opportunity_type === "high_margin").length} opportunités à forte marge détectées`,
        message: "Des produits avec des marges supérieures à 40% ont une demande soutenue",
        source: "opportunity-scanner",
        entity_type: "opportunity",
        actions: JSON.stringify([{ label: "Voir", action: "navigate", url: "/products/opportunities" }]),
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
    }

    if (criticalAlerts.length > 0) {
      await supabase.from("smart_alerts").insert(criticalAlerts);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      opportunities: opportunities.length,
      alerts: criticalAlerts.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("opportunity-scanner error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
