import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handlePreflight, requireAuth, errorResponse, successResponse } from '../_shared/jwt-auth.ts'

serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")

    const { action, productId } = await req.json()

    if (action === "forecast") {
      // RLS-scoped
      const { data: product } = await supabase
        .from("products")
        .select("id, title, price, stock_quantity, sales_count, created_at")
        .eq("id", productId)
        .single()

      if (!product) return errorResponse("Product not found", corsHeaders, 404)

      const { data: orders } = await supabase
        .from("order_items")
        .select("quantity, created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(100)

      let forecast;
      if (lovableKey) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a demand forecasting analyst. Analyze sales data and provide 30-day demand predictions. Return JSON with tool call." },
              { role: "user", content: `Product: ${product.title}, Price: ${product.price}€, Stock: ${product.stock_quantity}, Sales: ${product.sales_count || 0}. Recent orders: ${JSON.stringify(orders?.slice(0, 20) || [])}. Provide 30-day forecast.` }
            ],
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
                    scenarios: { type: "object", properties: { optimistic: { type: "integer" }, realistic: { type: "integer" }, pessimistic: { type: "integer" } } }
                  },
                  required: ["predicted_demand_30d", "confidence", "trend", "scenarios"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "demand_forecast" } }
          }),
        })

        if (aiResponse.status === 429) return errorResponse("Rate limit exceeded", corsHeaders, 429)
        if (aiResponse.status === 402) return errorResponse("Credits required", corsHeaders, 402)

        const aiData = await aiResponse.json()
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0]
        forecast = toolCall ? JSON.parse(toolCall.function.arguments) : null
      }

      if (!forecast) {
        const totalSales = product.sales_count || 0
        const daysSinceCreation = Math.max(1, Math.floor((Date.now() - new Date(product.created_at).getTime()) / 86400000))
        const dailyRate = totalSales / daysSinceCreation
        const demand30d = Math.round(dailyRate * 30)
        forecast = {
          predicted_demand_30d: demand30d, confidence: 0.5, trend: "stable", seasonality: 1.0,
          reasoning: "Based on historical sales rate", reorder_point: Math.max(5, Math.round(dailyRate * 7)),
          scenarios: { optimistic: Math.round(demand30d * 1.3), realistic: demand30d, pessimistic: Math.round(demand30d * 0.7) }
        }
      }

      for (const scenario of ["optimistic", "realistic", "pessimistic"]) {
        await supabase.from("demand_forecasts").insert({
          user_id: userId, product_id: productId,
          forecast_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          predicted_demand: forecast.scenarios[scenario] || forecast.predicted_demand_30d,
          confidence_score: forecast.confidence, scenario,
          seasonality_factor: forecast.seasonality || 1.0, trend_direction: forecast.trend,
          input_data: { reasoning: forecast.reasoning, reorder_point: forecast.reorder_point }
        })
      }

      return successResponse({ forecast }, corsHeaders)
    }

    if (action === "score_supplier") {
      const body = await req.json().catch(() => ({}))
      const supplierId = body.supplierId || productId

      const { data: supplier } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .single()

      if (!supplier) return errorResponse("Supplier not found", corsHeaders, 404)

      const { data: products } = await supabase
        .from("supplier_products")
        .select("price, stock_quantity, is_active")
        .eq("supplier_id", supplier.id)

      const totalProducts = products?.length || 0
      const activeProducts = products?.filter((p: any) => p.is_active)?.length || 0
      const avgPrice = totalProducts > 0 ? products!.reduce((s: number, p: any) => s + (p.price || 0), 0) / totalProducts : 0

      const reliability = Math.min(100, (activeProducts / Math.max(1, totalProducts)) * 100)
      const priceScore = Math.min(100, avgPrice > 0 ? 70 : 30)
      const overall = reliability * 0.3 + priceScore * 0.2 + 60 * 0.2 + 70 * 0.15 + 65 * 0.15
      const recommendation = overall >= 80 ? 'preferred' : overall >= 60 ? 'recommended' : overall >= 40 ? 'neutral' : 'caution'

      await supabase.from("supplier_scores").upsert({
        user_id: userId, supplier_id: supplier.id,
        overall_score: Math.round(overall * 100) / 100, reliability_score: Math.round(reliability * 100) / 100,
        delivery_score: 60, quality_score: 70, price_score: Math.round(priceScore * 100) / 100,
        communication_score: 65, total_orders: 0, total_issues: 0, recommendation,
        last_evaluated_at: new Date().toISOString(),
      }, { onConflict: "user_id,supplier_id" })

      return successResponse({ score: { overall, reliability, priceScore, recommendation } }, corsHeaders)
    }

    return errorResponse("Unknown action", corsHeaders)
  } catch (error: any) {
    if (error instanceof Response) return error
    console.error("intelligence-engine error:", error)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return errorResponse(error.message || 'Internal error', getSecureCorsHeaders(origin), 500)
  }
})
