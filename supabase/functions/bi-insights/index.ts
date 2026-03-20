import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY_AUTOMATION") || Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    // Auth
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { analysisType = "general" } = await req.json().catch(() => ({}));

    // Fetch business data
    const adminClient = createClient(supabaseUrl, supabaseKey);

    const [ordersRes, productsRes, customersRes] = await Promise.all([
      adminClient.from("orders").select("total_amount, status, created_at, external_platform").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
      adminClient.from("products").select("title, price, stock_quantity, status, category, created_at").eq("user_id", user.id).limit(300),
      adminClient.from("customers").select("id, total_orders, total_spent, created_at, country").eq("user_id", user.id).limit(300),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const customers = customersRes.data || [];

    // Build summary for AI
    const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
    const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
    const lowStockProducts = products.filter(p => (p.stock_quantity ?? 0) < 10 && p.status === "active");
    const topCustomers = customers.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 5);
    const platformBreakdown: Record<string, number> = {};
    orders.forEach(o => {
      const p = o.external_platform || "direct";
      platformBreakdown[p] = (platformBreakdown[p] || 0) + (o.total_amount || 0);
    });

    // Recent vs older revenue comparison
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    const sixtyDaysAgo = now - 60 * 86400000;
    const recentRevenue = orders.filter(o => new Date(o.created_at).getTime() > thirtyDaysAgo).reduce((s, o) => s + (o.total_amount || 0), 0);
    const olderRevenue = orders.filter(o => { const t = new Date(o.created_at).getTime(); return t > sixtyDaysAgo && t <= thirtyDaysAgo; }).reduce((s, o) => s + (o.total_amount || 0), 0);
    const revenueGrowth = olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue * 100).toFixed(1) : "N/A";

    const dataContext = `
DONNÉES BUSINESS DU MARCHAND:
- Commandes totales: ${orders.length} | Revenu total: ${totalRevenue.toFixed(2)}€
- Revenu 30j: ${recentRevenue.toFixed(2)}€ | Croissance vs 30j précédents: ${revenueGrowth}%
- Panier moyen: ${avgOrderValue.toFixed(2)}€
- Produits actifs: ${products.filter(p => p.status === 'active').length}/${products.length}
- Produits stock critique (<10): ${lowStockProducts.length} → ${lowStockProducts.slice(0, 5).map(p => `"${p.title}" (stock: ${p.stock_quantity})`).join(", ")}
- Clients: ${customers.length} | Top 5 dépenses: ${topCustomers.map(c => `${(c.total_spent || 0).toFixed(0)}€ (${c.total_orders} cmd)`).join(", ")}
- Répartition par plateforme: ${Object.entries(platformBreakdown).map(([k, v]) => `${k}: ${v.toFixed(0)}€`).join(", ")}
- Catégories: ${[...new Set(products.map(p => p.category).filter(Boolean))].join(", ") || "non catégorisé"}
`;

    const systemPrompt = `Tu es un analyste BI expert pour le e-commerce. Analyse les données du marchand et fournis des insights actionnables.
Réponds en JSON strict avec cette structure:
{
  "summary": "Résumé exécutif en 2-3 phrases",
  "health_score": nombre 0-100,
  "insights": [
    {
      "id": "string unique",
      "category": "revenue|inventory|customers|growth|risk",
      "title": "Titre court",
      "description": "Description détaillée",
      "impact": "high|medium|low",
      "action": "Recommandation d'action concrète",
      "metric_value": nombre ou null,
      "metric_label": "label du KPI" ou null
    }
  ],
  "predictions": [
    {
      "metric": "nom de la métrique",
      "current_value": nombre,
      "predicted_value": nombre,
      "confidence": nombre 0-100,
      "timeframe": "30j|60j|90j",
      "trend": "up|down|stable"
    }
  ],
  "anomalies": [
    {
      "type": "positive|negative",
      "description": "Description de l'anomalie",
      "severity": "high|medium|low"
    }
  ]
}
Fournis 5-8 insights, 3-4 prédictions, et les anomalies détectées. Sois précis et quantitatif.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${dataContext}\n\nType d'analyse: ${analysisType}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_bi_report",
            description: "Generate a structured BI report with insights, predictions and anomalies",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                health_score: { type: "number" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      category: { type: "string", enum: ["revenue", "inventory", "customers", "growth", "risk"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      action: { type: "string" },
                      metric_value: { type: "number" },
                      metric_label: { type: "string" }
                    },
                    required: ["id", "category", "title", "description", "impact", "action"]
                  }
                },
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      current_value: { type: "number" },
                      predicted_value: { type: "number" },
                      confidence: { type: "number" },
                      timeframe: { type: "string" },
                      trend: { type: "string", enum: ["up", "down", "stable"] }
                    },
                    required: ["metric", "current_value", "predicted_value", "confidence", "timeframe", "trend"]
                  }
                },
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["positive", "negative"] },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["high", "medium", "low"] }
                    },
                    required: ["type", "description", "severity"]
                  }
                }
              },
              required: ["summary", "health_score", "insights", "predictions", "anomalies"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_bi_report" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let report;
    
    if (toolCall?.function?.arguments) {
      report = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      report = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: "Analyse non disponible", health_score: 50, insights: [], predictions: [], anomalies: [] };
    }

    return new Response(JSON.stringify({
      ...report,
      generated_at: new Date().toISOString(),
      data_summary: {
        orders_count: orders.length,
        products_count: products.length,
        customers_count: customers.length,
        total_revenue: totalRevenue,
        recent_revenue: recentRevenue,
        revenue_growth: revenueGrowth,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bi-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
