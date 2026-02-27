/**
 * AI Recommendations Engine
 * Uses Lovable AI + real product/order data for:
 * - Trending product analysis
 * - Cross-sell / upsell suggestions (collaborative filtering)
 * - Proactive inventory & pricing alerts
 * - Bundle recommendations
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth, handlePreflight, errorResponse, successResponse } from "../_shared/jwt-auth.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req);
    const { action } = await req.json();

    if (!action) return errorResponse("Missing action parameter", corsHeaders);

    switch (action) {
      case "generate_all":
        return await generateAllRecommendations(userId, supabase, corsHeaders);
      case "cross_sell":
        return await generateCrossSell(userId, supabase, corsHeaders);
      case "accept":
      case "dismiss": {
        const body = await req.json().catch(() => ({}));
        return await updateRecommendationStatus(userId, supabase, corsHeaders, body.recommendation_id, action);
      }
      default:
        return errorResponse(`Unknown action: ${action}`, corsHeaders);
    }
  } catch (e) {
    if (e instanceof Response) return e;
    console.error("ai-recommendations-engine error:", e);
    const origin = req.headers.get("origin");
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin || "*" } }
    );
  }
});

async function generateAllRecommendations(userId: string, supabase: any, corsHeaders: Record<string, string>) {
  // 1. Fetch real product data
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, title, category, sale_price, cost_price, stock_quantity, status, sku, description, image_url, created_at")
    .limit(100);

  if (prodErr) return errorResponse("Failed to fetch products: " + prodErr.message, corsHeaders);
  if (!products || products.length === 0) {
    return successResponse({ recommendations: [], message: "No products found" }, corsHeaders);
  }

  // 2. Fetch recent orders for demand signals
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity, unit_price, order_id")
    .limit(500);

  // 3. Compute product metrics
  const productSales: Record<string, { qty: number; revenue: number; orderCount: number }> = {};
  (orderItems || []).forEach((item: any) => {
    if (!productSales[item.product_id]) {
      productSales[item.product_id] = { qty: 0, revenue: 0, orderCount: 0 };
    }
    productSales[item.product_id].qty += item.quantity || 1;
    productSales[item.product_id].revenue += (item.unit_price || 0) * (item.quantity || 1);
    productSales[item.product_id].orderCount += 1;
  });

  // 4. Build context for AI analysis
  const productSummaries = products.slice(0, 50).map((p: any) => {
    const sales = productSales[p.id] || { qty: 0, revenue: 0, orderCount: 0 };
    const margin = p.sale_price && p.cost_price ? ((p.sale_price - p.cost_price) / p.sale_price * 100).toFixed(1) : "N/A";
    return `- ${p.title || "Sans titre"} | Cat: ${p.category || "?"} | Prix: ${p.sale_price || 0}€ | Coût: ${p.cost_price || "?"}€ | Marge: ${margin}% | Stock: ${p.stock_quantity ?? "?"} | Ventes: ${sales.qty} (${sales.revenue.toFixed(0)}€) | Statut: ${p.status || "?"}`;
  });

  const totalRevenue = (orders || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const avgOrderValue = orders?.length ? (totalRevenue / orders.length).toFixed(2) : "0";

  // 5. Call Lovable AI for intelligent recommendations
  if (!LOVABLE_API_KEY) {
    return errorResponse("AI service not configured", corsHeaders, 503);
  }

  const prompt = `Tu es un expert en e-commerce et en data analytics. Analyse les données suivantes et génère des recommandations actionnables.

DONNÉES BOUTIQUE:
- ${products.length} produits au catalogue
- ${orders?.length || 0} commandes récentes
- Revenu total: ${totalRevenue.toFixed(0)}€
- Panier moyen: ${avgOrderValue}€

TOP PRODUITS:
${productSummaries.join("\n")}

Génère exactement 5-8 recommandations JSON structurées. Chaque recommandation doit être concrète et basée sur les données réelles ci-dessus.

Réponds UNIQUEMENT avec un JSON valide au format:
[
  {
    "type": "trending|cross_sell|upsell|restock|pricing|bundle",
    "title": "titre court et actionnable",
    "description": "explication détaillée basée sur les données",
    "confidence": 65-95,
    "impact_estimate": "estimation chiffrée de l'impact",
    "impact_value": 0,
    "reasoning": "raisonnement basé sur les métriques",
    "source_product": "nom du produit source si applicable",
    "target_product": "nom du produit cible si applicable"
  }
]

Types de recommandations attendus:
- restock: produits en rupture ou stock critique avec forte demande
- pricing: ajustements de prix basés sur les marges et la demande
- cross_sell: produits complémentaires à vendre ensemble
- trending: produits avec potentiel de croissance
- bundle: combinaisons de produits à promouvoir`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: "Tu es un moteur de recommandation e-commerce. Réponds toujours en JSON valide, sans markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ success: false, error: "AI credits exhausted" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const errText = await aiResponse.text();
    console.error("AI gateway error:", aiResponse.status, errText);
    return errorResponse("AI analysis failed", corsHeaders, 500);
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "[]";

  // Parse AI response
  let recommendations: any[];
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    recommendations = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response:", content);
    return errorResponse("Failed to parse AI recommendations", corsHeaders);
  }

  // 6. Map product names to IDs and store in DB
  const productNameMap: Record<string, string> = {};
  products.forEach((p: any) => { if (p.title) productNameMap[p.title.toLowerCase()] = p.id; });

  const storedRecs = [];
  for (const rec of recommendations) {
    const sourceId = rec.source_product ? findProductId(rec.source_product, productNameMap) : null;
    const targetId = rec.target_product ? findProductId(rec.target_product, productNameMap) : null;

    const { data: inserted, error: insertErr } = await supabase
      .from("ai_recommendations")
      .insert({
        user_id: userId,
        recommendation_type: rec.type || "trending",
        source_product_id: sourceId,
        target_product_id: targetId,
        title: rec.title,
        description: rec.description,
        confidence_score: Math.min(99, Math.max(1, rec.confidence || 70)),
        impact_estimate: rec.impact_estimate,
        impact_value: rec.impact_value || null,
        reasoning: rec.reasoning,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (!insertErr && inserted) storedRecs.push(inserted);
  }

  // 7. Update metrics
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("recommendation_metrics").upsert({
    user_id: userId,
    period_start: today,
    period_end: today,
    total_generated: storedRecs.length,
    avg_confidence: storedRecs.reduce((s: number, r: any) => s + Number(r.confidence_score), 0) / (storedRecs.length || 1),
  }, { onConflict: "user_id,period_start,period_end" });

  return successResponse({
    recommendations: storedRecs,
    stats: {
      products_analyzed: products.length,
      orders_analyzed: orders?.length || 0,
      total_revenue: totalRevenue,
      avg_order_value: Number(avgOrderValue),
    },
  }, corsHeaders);
}

async function generateCrossSell(userId: string, supabase: any, corsHeaders: Record<string, string>) {
  // Compute co-purchase affinities from order_items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, order_id")
    .limit(1000);

  if (!orderItems || orderItems.length === 0) {
    return successResponse({ affinities: [], message: "Not enough data for cross-sell analysis" }, corsHeaders);
  }

  // Group items by order
  const orderGroups: Record<string, string[]> = {};
  orderItems.forEach((item: any) => {
    if (!orderGroups[item.order_id]) orderGroups[item.order_id] = [];
    orderGroups[item.order_id].push(item.product_id);
  });

  // Compute co-occurrence pairs
  const pairs: Record<string, number> = {};
  Object.values(orderGroups).forEach((items: string[]) => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const key = [items[i], items[j]].sort().join("|");
        pairs[key] = (pairs[key] || 0) + 1;
      }
    }
  });

  // Store top affinities
  const topPairs = Object.entries(pairs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  for (const [key, count] of topPairs) {
    const [a, b] = key.split("|");
    const score = Math.min(99, count * 10);
    await supabase.from("product_affinities").upsert({
      user_id: userId,
      product_a_id: a,
      product_b_id: b,
      co_occurrence_count: count,
      affinity_score: score,
      last_computed_at: new Date().toISOString(),
    }, { onConflict: "user_id,product_a_id,product_b_id" });
  }

  // Fetch with product names
  const { data: affinities } = await supabase
    .from("product_affinities")
    .select(`
      *,
      product_a:products!product_affinities_product_a_id_fkey(id, title, sale_price, image_url),
      product_b:products!product_affinities_product_b_id_fkey(id, title, sale_price, image_url)
    `)
    .order("affinity_score", { ascending: false })
    .limit(10);

  return successResponse({ affinities: affinities || [] }, corsHeaders);
}

async function updateRecommendationStatus(userId: string, supabase: any, corsHeaders: Record<string, string>, recId: string, action: string) {
  if (!recId) return errorResponse("Missing recommendation_id", corsHeaders);

  const updates: any = {
    status: action === "accept" ? "accepted" : "dismissed",
  };
  if (action === "dismiss") updates.dismissed_at = new Date().toISOString();
  if (action === "accept") updates.applied_at = new Date().toISOString();

  const { error } = await supabase
    .from("ai_recommendations")
    .update(updates)
    .eq("id", recId)
    .eq("user_id", userId);

  if (error) return errorResponse("Update failed: " + error.message, corsHeaders);
  return successResponse({ updated: true }, corsHeaders);
}

function findProductId(name: string, nameMap: Record<string, string>): string | null {
  const lower = name.toLowerCase();
  // Exact match
  if (nameMap[lower]) return nameMap[lower];
  // Partial match
  for (const [key, id] of Object.entries(nameMap)) {
    if (key.includes(lower) || lower.includes(key)) return id;
  }
  return null;
}
