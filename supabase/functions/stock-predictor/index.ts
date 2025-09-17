import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      product_id, 
      prediction_days = 30, 
      include_seasonality = true, 
      include_trends = true 
    } = await req.json()

    // Get product details and historical data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, user_id')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Get historical stock movements for the last 90 days
    const historicalDataDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const { data: movements, error: movementsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', product.user_id)
      .eq('entity_id', product_id)
      .eq('action', 'stock_movement')
      .gte('created_at', historicalDataDate.toISOString())
      .order('created_at', { ascending: true })

    if (movementsError) {
      console.warn('Failed to fetch historical movements:', movementsError)
    }

    // Get order data to understand sales velocity
    const { data: orders, error: ordersError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', product.user_id)
      .in('action', ['order_placed', 'order_completed'])
      .gte('created_at', historicalDataDate.toISOString())
      .order('created_at', { ascending: true })

    if (ordersError) {
      console.warn('Failed to fetch order data:', ordersError)
    }

    // Calculate sales velocity (units per day)
    const salesData = analyzeHistoricalSales(movements || [], orders || [])
    let dailySalesVelocity = salesData.averageDailySales

    // Apply seasonality adjustments if requested
    if (include_seasonality) {
      const seasonalityFactor = calculateSeasonalityFactor(new Date())
      dailySalesVelocity *= seasonalityFactor
    }

    // Apply trend adjustments if requested
    if (include_trends) {
      const trendFactor = calculateTrendFactor(salesData.salesHistory)
      dailySalesVelocity *= trendFactor
    }

    // Current stock level
    const currentStock = product.stock_quantity || 0

    // Calculate predictions
    const daysUntilStockout = currentStock / Math.max(dailySalesVelocity, 0.1)
    const predictedStockoutDate = new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000)
    
    // Recommend reordering when 7 days of stock remain (safety buffer)
    const safetyBufferDays = 7
    const recommendedReorderDate = new Date(predictedStockoutDate.getTime() - safetyBufferDays * 24 * 60 * 60 * 1000)

    // Calculate confidence score based on data quality
    const confidenceScore = calculateConfidenceScore(
      movements?.length || 0,
      orders?.length || 0,
      salesData.variability
    )

    // Additional insights
    const stockoutRisk = calculateStockoutRisk(daysUntilStockout, confidenceScore)
    const optimalStockLevel = Math.ceil(dailySalesVelocity * 30) // 30 days of stock
    const reorderRecommendation = Math.max(optimalStockLevel - currentStock, 0)

    const predictions = {
      predicted_stockout_date: predictedStockoutDate.toISOString(),
      recommended_reorder_date: recommendedReorderDate.toISOString(),
      predicted_sales_velocity: Math.round(dailySalesVelocity * 100) / 100,
      confidence_score: Math.round(confidenceScore * 100) / 100,
      days_until_stockout: Math.round(daysUntilStockout * 10) / 10,
      current_stock: currentStock,
      stockout_risk_level: stockoutRisk,
      optimal_stock_level: optimalStockLevel,
      reorder_recommendation: reorderRecommendation,
      analysis_period_days: 90,
      factors_considered: {
        historical_sales: true,
        seasonality: include_seasonality,
        trends: include_trends,
        safety_buffer: safetyBufferDays
      }
    }

    // Log the prediction request
    await supabase
      .from('activity_logs')
      .insert({
        user_id: product.user_id,
        action: 'stock_prediction_generated',
        entity_type: 'product',
        entity_id: product_id,
        description: `Stock prediction generated for ${product.name}`,
        metadata: {
          product_name: product.name,
          prediction_days,
          predictions
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stock predictions generated successfully',
        product_id,
        product_name: product.name,
        predictions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stock prediction error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function analyzeHistoricalSales(movements: any[], orders: any[]) {
  // Combine movement and order data to estimate sales
  const dailySales: { [date: string]: number } = {}
  
  // Process stock movements (outgoing stock)
  movements.forEach(movement => {
    const metadata = movement.metadata as any
    if (metadata?.movement_type === 'out') {
      const date = movement.created_at.split('T')[0]
      dailySales[date] = (dailySales[date] || 0) + (metadata.quantity || 1)
    }
  })

  // Process orders for additional sales data
  orders.forEach(order => {
    if (order.action === 'order_completed') {
      const date = order.created_at.split('T')[0]
      // Estimate 1-3 units per order (would be more precise with real order data)
      const estimatedUnits = Math.floor(Math.random() * 3) + 1
      dailySales[date] = (dailySales[date] || 0) + estimatedUnits
    }
  })

  const salesValues = Object.values(dailySales)
  const totalSales = salesValues.reduce((sum, sales) => sum + sales, 0)
  const daysCovered = Math.max(Object.keys(dailySales).length, 1)
  const averageDailySales = totalSales / daysCovered

  // Calculate variability (standard deviation)
  const variance = salesValues.reduce((sum, sales) => sum + Math.pow(sales - averageDailySales, 2), 0) / salesValues.length
  const variability = Math.sqrt(variance)

  return {
    averageDailySales: Math.max(averageDailySales, 0.5), // Minimum 0.5 units/day
    variability,
    totalSales,
    daysCovered,
    salesHistory: salesValues
  }
}

function calculateSeasonalityFactor(date: Date): number {
  const month = date.getMonth() + 1
  
  // Simple seasonality model (would be more sophisticated in production)
  const seasonalFactors: { [month: number]: number } = {
    1: 0.8,   // January - post-holiday slowdown
    2: 0.9,   // February
    3: 1.0,   // March
    4: 1.1,   // April - spring boost
    5: 1.2,   // May
    6: 1.1,   // June
    7: 1.0,   // July
    8: 0.9,   // August - summer slowdown
    9: 1.1,   // September - back to school
    10: 1.2,  // October
    11: 1.4,  // November - holiday preparation
    12: 1.3   // December - holiday season
  }

  return seasonalFactors[month] || 1.0
}

function calculateTrendFactor(salesHistory: number[]): number {
  if (salesHistory.length < 3) return 1.0

  // Simple linear trend calculation
  const n = salesHistory.length
  const xSum = n * (n - 1) / 2
  const ySum = salesHistory.reduce((sum, y) => sum + y, 0)
  const xySum = salesHistory.reduce((sum, y, i) => sum + i * y, 0)
  const x2Sum = n * (n - 1) * (2 * n - 1) / 6

  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
  
  // Convert slope to trend factor (capped between 0.5 and 2.0)
  const trendFactor = Math.max(0.5, Math.min(2.0, 1 + slope * 0.1))
  return trendFactor
}

function calculateConfidenceScore(movementsCount: number, ordersCount: number, variability: number): number {
  // Base confidence on data availability
  let confidence = 0.3 // Minimum confidence
  
  // Add confidence based on data points
  if (movementsCount > 10) confidence += 0.3
  if (ordersCount > 5) confidence += 0.2
  
  // Reduce confidence based on variability
  const variabilityPenalty = Math.min(variability * 0.1, 0.3)
  confidence -= variabilityPenalty
  
  // Add confidence if we have recent data
  confidence += 0.2
  
  return Math.max(0.1, Math.min(1.0, confidence))
}

function calculateStockoutRisk(daysUntilStockout: number, confidenceScore: number): string {
  if (daysUntilStockout <= 3) return 'critical'
  if (daysUntilStockout <= 7) return 'high'
  if (daysUntilStockout <= 14) return 'medium'
  return 'low'
}