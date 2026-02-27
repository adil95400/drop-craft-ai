/**
 * Smart Inventory Manager — SECURED (JWT-first, RLS-enforced)
 * Uses Lovable AI Gateway instead of OpenAI
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { productId, analysisType = 'full' } = await req.json()

    console.log('Smart Inventory Manager:', { productId, userId, analysisType })

    // Get product data (RLS-scoped)
    const { data: product } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single()

    const { data: orders } = await supabase
      .from('order_items')
      .select('*, orders!inner(*)')
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .order('orders.created_at', { ascending: false })
      .limit(100)

    const productData = {
      product,
      currentStock: product?.stock_quantity || 0,
      orderHistory: orders || [],
      supplierPerformance: { leadTime: 7, reliability: 95, minOrderQty: 10 }
    }

    // Demand analysis via Lovable AI Gateway
    const demandAnalysis = await analyzeDemand(productData)
    const optimization = calculateOptimalLevels(productData, demandAnalysis)
    const recommendations = generateRecommendations(productData, demandAnalysis, optimization)

    // Save analysis (RLS-scoped)
    const { data: smartInventory, error: upsertError } = await supabase
      .from('smart_inventory')
      .upsert({
        user_id: userId,
        product_id: productId,
        current_stock: productData.currentStock,
        optimal_stock: optimization.optimalStock,
        minimum_threshold: optimization.minimumThreshold,
        maximum_threshold: optimization.maximumThreshold,
        reorder_point: optimization.reorderPoint,
        reorder_quantity: optimization.reorderQuantity,
        demand_forecast: demandAnalysis.forecast,
        seasonality_data: demandAnalysis.seasonality,
        supplier_performance: productData.supplierPerformance,
        cost_optimization: optimization.costAnalysis,
        stock_risk_level: recommendations.riskLevel,
        next_reorder_prediction: recommendations.nextReorderDate,
        performance_metrics: { accuracy: demandAnalysis.accuracy, confidence: recommendations.confidence, lastAnalysis: new Date().toISOString() }
      })
      .select()
      .single()

    if (upsertError) throw new Error('Failed to save inventory analysis')

    return successResponse({
      success: true,
      currentStock: productData.currentStock,
      optimalLevels: optimization,
      demandForecast: demandAnalysis.forecast,
      recommendations,
      riskAssessment: { stockoutRisk: recommendations.stockoutRisk, overstockRisk: recommendations.overstockRisk, overall: recommendations.riskLevel },
      nextActions: recommendations.actions,
      inventoryId: smartInventory.id
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[smart-inventory-manager] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Erreur interne' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeDemand(productData: any) {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    return { trend: 'stable', avgDemandPerDay: 1, seasonality: {}, forecast: { next7Days: 7, next30Days: 30 }, variability: 'medium', accuracy: 70 }
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'Expert en gestion de stock. Analyse et retourne du JSON uniquement.' },
          { role: 'user', content: `Analyse demande: stock=${productData.currentStock}, commandes=${productData.orderHistory.length}. Retourne JSON: { "trend": "stable|up|down", "avgDemandPerDay": number, "seasonality": {}, "forecast": { "next7Days": number, "next30Days": number }, "variability": "low|medium|high", "accuracy": number }` }
        ],
      }),
    })
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    const match = content.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { trend: 'stable', avgDemandPerDay: 1, seasonality: {}, forecast: { next7Days: 7, next30Days: 30 }, variability: 'medium', accuracy: 70 }
  } catch {
    return { trend: 'stable', avgDemandPerDay: 1, seasonality: {}, forecast: { next7Days: 7, next30Days: 30 }, variability: 'medium', accuracy: 70 }
  }
}

function calculateOptimalLevels(productData: any, demandAnalysis: any) {
  const leadTime = productData.supplierPerformance.leadTime
  const avgDemand = demandAnalysis.avgDemandPerDay || 1
  const variabilityFactor = demandAnalysis.variability === 'high' ? 2 : demandAnalysis.variability === 'medium' ? 1.5 : 1

  const safetyStock = Math.ceil(avgDemand * leadTime * variabilityFactor)
  const reorderPoint = Math.ceil((avgDemand * leadTime) + safetyStock)
  const reorderQuantity = Math.max(Math.ceil(avgDemand * 14), productData.supplierPerformance.minOrderQty)
  const optimalStock = reorderPoint + reorderQuantity

  return {
    optimalStock: Math.ceil(optimalStock),
    minimumThreshold: Math.ceil(safetyStock),
    maximumThreshold: Math.ceil(optimalStock * 1.5),
    reorderPoint: Math.ceil(reorderPoint),
    reorderQuantity: Math.ceil(reorderQuantity),
    safetyStock: Math.ceil(safetyStock),
    costAnalysis: {
      holdingCost: optimalStock * (productData.product?.cost_price || 0) * 0.02,
      stockoutCost: avgDemand * (productData.product?.price || 0) * 0.1
    }
  }
}

function generateRecommendations(productData: any, demandAnalysis: any, optimization: any) {
  const currentStock = productData.currentStock
  const avgDemand = demandAnalysis.avgDemandPerDay || 1
  const actions: any[] = []

  const daysUntilStockout = currentStock / avgDemand
  const stockoutRisk = daysUntilStockout < 7 ? 'high' : daysUntilStockout < 14 ? 'medium' : 'low'
  const overstockRatio = currentStock / (optimization.optimalStock || 1)
  const overstockRisk = overstockRatio > 1.5 ? 'high' : overstockRatio > 1.2 ? 'medium' : 'low'

  if (currentStock <= optimization.reorderPoint) {
    actions.push({ type: 'reorder', priority: 'high', message: `Réapprovisionner ${optimization.reorderQuantity} unités`, quantity: optimization.reorderQuantity })
  }
  if (stockoutRisk === 'high') {
    actions.push({ type: 'urgent_reorder', priority: 'critical', message: 'Risque de rupture élevé - commande urgente' })
  }
  if (overstockRisk === 'high') {
    actions.push({ type: 'reduce_price', priority: 'medium', message: 'Surstock détecté - considérer une promotion' })
  }

  const riskLevel = stockoutRisk === 'high' || overstockRisk === 'high' ? 'high' : stockoutRisk === 'medium' || overstockRisk === 'medium' ? 'medium' : 'low'
  const daysUntilReorder = Math.max(0, (currentStock - optimization.reorderPoint) / avgDemand)

  return {
    riskLevel, stockoutRisk, overstockRisk, actions,
    nextReorderDate: new Date(Date.now() + daysUntilReorder * 86400000).toISOString(),
    confidence: demandAnalysis.accuracy || 70,
    daysUntilStockout: Math.ceil(daysUntilStockout),
    recommendations: actions.map((a: any) => a.message)
  }
}
