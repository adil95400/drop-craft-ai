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

    const { action, productId } = await req.json();

    if (action === "forecast") {
      // Get product sales data
      const { data: product } = await supabase
        .from("products")
        .select("id, title, price, stock_quantity, sales_count, created_at")
        .eq("id", productId)
        .eq("user_id", user.id)
        .single();

      if (!product) throw new Error("Product not found");

      // Get order history for this product
      const { data: orders } = await supabase
        .from("order_items")
        .select("quantity, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(100);

      // Use AI to generate forecast
      let forecast;
      if (lovableKey) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{
              role: "system",
              content: "You are a demand forecasting analyst. Analyze sales data and provide 30-day demand predictions. Return JSON with tool call."
            }, {
              role: "user",
              content: `Product: ${product.title}, Price: ${product.price}€, Current stock: ${product.stock_quantity}, Total sales: ${product.sales_count || 0}. Recent orders: ${JSON.stringify(orders?.slice(0, 20) || [])}. Provide 30-day forecast.`
            }],
            tools: [{
              type: "function",
              function: {
                name: "demand_forecast",
                description: "Return demand forecast data",
                parameters: {
                  type: "object",
                  properties: {
                    predicted_demand_30d: { type: "integer" },
                    confidence: { type: "number" },
                    trend: { type: "string", enum: ["up", "down", "stable"] },
                    seasonality: { type: "number" },
                    reasoning: { type: "string" },
                    reorder_point: { type: "integer" },
                    scenarios: {
                      type: "object",
                      properties: {
                        optimistic: { type: "integer" },
                        realistic: { type: "integer" },
                        pessimistic: { type: "integer" }
                      }
                    }
                  },
                  required: ["predicted_demand_30d", "confidence", "trend", "scenarios"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "demand_forecast" } }
          }),
        });

        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: corsHeaders });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: corsHeaders });
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        forecast = toolCall ? JSON.parse(toolCall.function.arguments) : null;
      }

      // Fallback to basic calculation if no AI
      if (!forecast) {
        const totalSales = product.sales_count || 0;
        const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(product.created_at).getTime()) / 86400000));
        const dailyRate = totalSales / daysSinceCreation;
        const demand30d = Math.round(dailyRate * 30);
        
        forecast = {
          predicted_demand_30d: demand30d,
          confidence: 0.5,
          trend: "stable",
          seasonality: 1.0,
          reasoning: "Based on historical sales rate",
          reorder_point: Math.max(5, Math.round(dailyRate * 7)),
          scenarios: {
            optimistic: Math.round(demand30d * 1.3),
            realistic: demand30d,
            pessimistic: Math.round(demand30d * 0.7)
          }
        };
      }

      // Save forecasts for all scenarios
      const scenarios = ["optimistic", "realistic", "pessimistic"];
      for (const scenario of scenarios) {
        await supabase.from("demand_forecasts").insert({
          user_id: user.id,
          product_id: productId,
          forecast_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          predicted_demand: forecast.scenarios[scenario] || forecast.predicted_demand_30d,
          confidence_score: forecast.confidence,
          scenario,
          seasonality_factor: forecast.seasonality || 1.0,
          trend_direction: forecast.trend,
          input_data: { reasoning: forecast.reasoning, reorder_point: forecast.reorder_point }
        });
      }

      return new Response(JSON.stringify({ success: true, forecast }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "score_supplier") {
      const { supplierId } = await req.json().catch(() => ({ supplierId: null }));
      // Get supplier data
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId || productId)
        .eq("user_id", user.id)
        .single();

      if (!supplier) throw new Error("Supplier not found");

      // Get supplier products stats
      const { data: products } = await supabase
        .from("supplier_products")
        .select("price, stock_quantity, is_active")
        .eq("supplier_id", supplier.id)
        .eq("user_id", user.id);

      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active)?.length || 0;
      const avgPrice = totalProducts > 0 
        ? products!.reduce((s, p) => s + (p.price || 0), 0) / totalProducts 
        : 0;

      // Calculate scores
      const reliability = Math.min(100, (activeProducts / Math.max(1, totalProducts)) * 100);
      const priceScore = Math.min(100, avgPrice > 0 ? 70 : 30);
      const overall = (reliability * 0.3 + priceScore * 0.2 + 60 * 0.2 + 70 * 0.15 + 65 * 0.15);

      const recommendation = overall >= 80 ? 'preferred' : overall >= 60 ? 'recommended' : overall >= 40 ? 'neutral' : 'caution';

      await supabase.from("supplier_scores").upsert({
        user_id: user.id,
        supplier_id: supplier.id,
        overall_score: Math.round(overall * 100) / 100,
        reliability_score: Math.round(reliability * 100) / 100,
        delivery_score: 60,
        quality_score: 70,
        price_score: Math.round(priceScore * 100) / 100,
        communication_score: 65,
        total_orders: 0,
        total_issues: 0,
        recommendation,
        last_evaluated_at: new Date().toISOString(),
      }, { onConflict: "user_id,supplier_id" });

      return new Response(JSON.stringify({ success: true, score: { overall, reliability, priceScore, recommendation } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    console.error("intelligence-engine error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
