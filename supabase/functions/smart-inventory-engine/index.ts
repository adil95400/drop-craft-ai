import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'forecast';

    const handlers: Record<string, () => Promise<Response>> = {
      forecast: () => handleDemandForecast(supabase, body),
      forecast_all: () => handleForecastAll(supabase, body),
      auto_reorder_check: () => handleSmartReorderCheck(supabase, body),
      supplier_analysis: () => handleSupplierAnalysis(supabase, body),
      dashboard_metrics: () => handleDashboardMetrics(supabase, body),
    };

    const handler = handlers[action];
    if (!handler) {
      return json({ error: `Unknown action: ${action}` }, 400);
    }

    return await handler();
  } catch (error) {
    console.error('Smart inventory engine error:', error);
    return json({ error: error.message }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ─── Demand Forecasting ──────────────────────────────────────────────

interface ForecastResult {
  product_id: string;
  product_title: string;
  current_stock: number;
  daily_velocity: number;
  weekly_forecast: number[];
  monthly_forecast: number;
  seasonality_factor: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_strength: number;
  days_until_stockout: number | null;
  recommended_reorder_point: number;
  recommended_reorder_qty: number;
  confidence: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
}

async function handleDemandForecast(supabase: any, body: any): Promise<Response> {
  const { productId, userId } = body;
  if (!productId || !userId) return json({ error: 'productId and userId required' }, 400);

  const forecast = await computeProductForecast(supabase, productId, userId);
  if (!forecast) return json({ error: 'Product not found or no data' }, 404);

  // Persist forecast to stock_predictions
  await supabase.from('stock_predictions').upsert({
    user_id: userId,
    product_id: productId,
    current_stock: forecast.current_stock,
    predicted_days_until_stockout: forecast.days_until_stockout,
    predicted_stockout_date: forecast.days_until_stockout
      ? new Date(Date.now() + forecast.days_until_stockout * 86400000).toISOString()
      : null,
    confidence_score: forecast.confidence,
    daily_sale_velocity: forecast.daily_velocity,
    trend_direction: forecast.trend_direction,
    recommendation: `Réappro: ${forecast.recommended_reorder_qty} unités quand stock ≤ ${forecast.recommended_reorder_point}`,
    reorder_quantity: forecast.recommended_reorder_qty,
    reorder_urgency: forecast.risk_level,
    last_calculated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,product_id', ignoreDuplicates: false });

  return json({ success: true, forecast });
}

async function handleForecastAll(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  const { data: products } = await supabase
    .from('products')
    .select('id, title, stock_quantity, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(200);

  if (!products || products.length === 0) return json({ success: true, forecasts: [], count: 0 });

  const forecasts: ForecastResult[] = [];
  const errors: string[] = [];

  for (const product of products) {
    try {
      const forecast = await computeProductForecast(supabase, product.id, userId);
      if (forecast) {
        forecasts.push(forecast);

        // Persist
        await supabase.from('stock_predictions').upsert({
          user_id: userId,
          product_id: product.id,
          current_stock: forecast.current_stock,
          predicted_days_until_stockout: forecast.days_until_stockout,
          predicted_stockout_date: forecast.days_until_stockout
            ? new Date(Date.now() + forecast.days_until_stockout * 86400000).toISOString()
            : null,
          confidence_score: forecast.confidence,
          daily_sale_velocity: forecast.daily_velocity,
          trend_direction: forecast.trend_direction,
          recommendation: `Réappro: ${forecast.recommended_reorder_qty}u quand stock ≤ ${forecast.recommended_reorder_point}`,
          reorder_quantity: forecast.recommended_reorder_qty,
          reorder_urgency: forecast.risk_level,
          last_calculated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,product_id', ignoreDuplicates: false });
      }
    } catch (e) {
      errors.push(`${product.title}: ${e.message}`);
    }
  }

  // Log
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'demand_forecast_batch',
    entity_type: 'inventory',
    description: `Prévisions calculées: ${forecasts.length}/${products.length} produits`,
    details: { count: forecasts.length, errors: errors.length },
    source: 'smart_inventory_engine',
    severity: 'info',
  });

  return json({
    success: true,
    count: forecasts.length,
    errors: errors.length,
    forecasts,
    summary: {
      critical: forecasts.filter(f => f.risk_level === 'critical').length,
      high: forecasts.filter(f => f.risk_level === 'high').length,
      medium: forecasts.filter(f => f.risk_level === 'medium').length,
      low: forecasts.filter(f => f.risk_level === 'low').length,
      avg_days_stockout: forecasts.length > 0
        ? Math.round(forecasts.filter(f => f.days_until_stockout !== null).reduce((s, f) => s + (f.days_until_stockout || 0), 0) / Math.max(1, forecasts.filter(f => f.days_until_stockout !== null).length))
        : null,
    },
  });
}

async function computeProductForecast(supabase: any, productId: string, userId: string): Promise<ForecastResult | null> {
  // Get product
  const { data: product } = await supabase
    .from('products')
    .select('id, title, stock_quantity, price, cost_price')
    .eq('id', productId)
    .single();

  if (!product) return null;

  // Get sales data (90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

  const { data: salesData } = await supabase
    .from('order_items')
    .select('quantity, created_at')
    .eq('product_id', productId)
    .gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: true });

  const sales = salesData || [];

  // Compute daily velocity for different periods
  const last30Sales = sales.filter((s: any) => s.created_at >= thirtyDaysAgo);
  const prev30Sales = sales.filter((s: any) => s.created_at >= sixtyDaysAgo && s.created_at < thirtyDaysAgo);
  const first30Sales = sales.filter((s: any) => s.created_at < sixtyDaysAgo);

  const totalLast30 = last30Sales.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
  const totalPrev30 = prev30Sales.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
  const totalFirst30 = first30Sales.reduce((s: number, o: any) => s + (o.quantity || 1), 0);

  const dailyVelocity = totalLast30 / 30;
  const prevDailyVelocity = totalPrev30 / 30;

  // Trend detection
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let trendStrength = 0;
  if (prevDailyVelocity > 0) {
    const change = (dailyVelocity - prevDailyVelocity) / prevDailyVelocity;
    trendStrength = Math.abs(change);
    if (change > 0.1) trendDirection = 'up';
    else if (change < -0.1) trendDirection = 'down';
  }

  // Seasonality factor (compare same period last year would be ideal, use simple weekly pattern)
  const weeklyData = computeWeeklyPattern(sales);
  const seasonalityFactor = weeklyData.seasonalityFactor;

  // Weekly forecast (next 4 weeks)
  const adjustedVelocity = dailyVelocity * (1 + (trendDirection === 'up' ? trendStrength * 0.5 : trendDirection === 'down' ? -trendStrength * 0.5 : 0));
  const weeklyForecast = [1, 2, 3, 4].map(week => {
    const base = adjustedVelocity * 7;
    const seasonal = base * (seasonalityFactor + (week - 1) * (trendDirection === 'up' ? 0.02 : trendDirection === 'down' ? -0.02 : 0));
    return Math.round(Math.max(0, seasonal));
  });

  const monthlyForecast = weeklyForecast.reduce((s, w) => s + w, 0);

  // Days until stockout
  const currentStock = product.stock_quantity || 0;
  const daysUntilStockout = adjustedVelocity > 0 ? Math.round(currentStock / adjustedVelocity) : null;

  // Reorder recommendations (EOQ-inspired)
  const leadTimeDays = 14; // default supplier lead time
  const safetyStock = Math.ceil(adjustedVelocity * leadTimeDays * 0.5);
  const recommendedReorderPoint = Math.ceil(adjustedVelocity * leadTimeDays + safetyStock);
  const recommendedReorderQty = Math.max(
    Math.ceil(adjustedVelocity * 30), // 30 days of cover
    10 // minimum
  );

  // Confidence score
  const dataPoints = sales.length;
  const confidence = Math.min(95, Math.max(20, 30 + dataPoints * 2 + (trendStrength < 0.5 ? 20 : 0)));

  // Risk level
  let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (currentStock === 0) riskLevel = 'critical';
  else if (daysUntilStockout !== null && daysUntilStockout <= 7) riskLevel = 'critical';
  else if (daysUntilStockout !== null && daysUntilStockout <= 14) riskLevel = 'high';
  else if (daysUntilStockout !== null && daysUntilStockout <= 30) riskLevel = 'medium';

  return {
    product_id: productId,
    product_title: product.title || 'Unknown',
    current_stock: currentStock,
    daily_velocity: Math.round(dailyVelocity * 100) / 100,
    weekly_forecast: weeklyForecast,
    monthly_forecast: monthlyForecast,
    seasonality_factor: seasonalityFactor,
    trend_direction: trendDirection,
    trend_strength: Math.round(trendStrength * 100) / 100,
    days_until_stockout: daysUntilStockout,
    recommended_reorder_point: recommendedReorderPoint,
    recommended_reorder_qty: recommendedReorderQty,
    confidence,
    risk_level: riskLevel,
  };
}

function computeWeeklyPattern(sales: any[]): { seasonalityFactor: number } {
  if (sales.length < 7) return { seasonalityFactor: 1.0 };

  const dayOfWeekTotals = new Array(7).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);

  for (const sale of sales) {
    const dow = new Date(sale.created_at).getDay();
    dayOfWeekTotals[dow] += sale.quantity || 1;
    dayOfWeekCounts[dow]++;
  }

  const averages = dayOfWeekTotals.map((t, i) => dayOfWeekCounts[i] > 0 ? t / dayOfWeekCounts[i] : 0);
  const overallAvg = averages.reduce((s, a) => s + a, 0) / 7;

  // Current day seasonality factor
  const today = new Date().getDay();
  const todayFactor = overallAvg > 0 ? averages[today] / overallAvg : 1;

  return { seasonalityFactor: Math.round(Math.max(0.5, Math.min(2.0, todayFactor)) * 100) / 100 };
}

// ─── Smart Reorder Check (with forecasting) ──────────────────────────

async function handleSmartReorderCheck(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  // Get active rules
  const { data: rules } = await supabase
    .from('auto_order_rules')
    .select('*, products(id, title, stock_quantity, cost_price, status), suppliers(id, name, tier, rating, avg_delivery_days)')
    .eq('user_id', userId)
    .eq('is_active', true);

  const results = { checked: 0, triggered: 0, skipped: 0, recommendations: [] as any[] };

  for (const rule of (rules || [])) {
    results.checked++;
    const product = rule.products;
    if (!product || product.status !== 'active') { results.skipped++; continue; }

    // Get forecast for this product
    const forecast = await computeProductForecast(supabase, product.id, userId);
    if (!forecast) { results.skipped++; continue; }

    // Dynamic threshold: use forecast-based reorder point instead of static threshold
    const dynamicThreshold = Math.max(
      rule.min_stock_trigger || 5,
      forecast.recommended_reorder_point
    );

    const currentStock = product.stock_quantity || 0;

    if (currentStock > dynamicThreshold) {
      results.recommendations.push({
        product_id: product.id,
        product_title: product.title,
        current_stock: currentStock,
        threshold: dynamicThreshold,
        action: 'ok',
        days_until_stockout: forecast.days_until_stockout,
      });
      results.skipped++;
      continue;
    }

    // Check for existing pending orders
    const { data: existingOrders } = await supabase
      .from('auto_order_queue')
      .select('id')
      .eq('order_id', product.id)
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      results.skipped++;
      continue;
    }

    // Use forecast-optimized quantity
    const reorderQty = Math.max(forecast.recommended_reorder_qty, rule.reorder_quantity || 10);

    // Select best supplier
    const bestSupplier = await selectBestSupplierForReorder(supabase, product.id, userId, reorderQty, rule);

    if (!bestSupplier) {
      results.recommendations.push({
        product_id: product.id,
        product_title: product.title,
        action: 'no_supplier',
        risk: forecast.risk_level,
      });
      continue;
    }

    // Create auto-order
    const unitCost = bestSupplier.price || product.cost_price || 0;
    const totalCost = unitCost * reorderQty;

    if (rule.max_price && totalCost > rule.max_price) {
      results.recommendations.push({
        product_id: product.id,
        product_title: product.title,
        action: 'price_exceeded',
        estimated_cost: totalCost,
        max_price: rule.max_price,
      });
      continue;
    }

    await supabase.from('auto_order_queue').insert({
      user_id: userId,
      order_id: product.id,
      supplier_type: bestSupplier.type,
      status: 'pending',
      payload: {
        product_id: product.id,
        product_title: product.title,
        quantity: reorderQty,
        unit_cost: unitCost,
        total_cost: totalCost,
        supplier_id: bestSupplier.id,
        supplier_name: bestSupplier.name,
        supplier_score: bestSupplier.score,
        estimated_delivery_days: bestSupplier.delivery_days,
        trigger_reason: `Forecast: ${forecast.days_until_stockout ?? '?'}j restants, seuil dynamique: ${dynamicThreshold}`,
        forecast_based: true,
        daily_velocity: forecast.daily_velocity,
        trend: forecast.trend_direction,
      },
      max_retries: 3,
    });

    await supabase.from('auto_order_rules').update({
      trigger_count: (rule.trigger_count || 0) + 1,
      last_triggered_at: new Date().toISOString(),
    }).eq('id', rule.id);

    results.triggered++;
    results.recommendations.push({
      product_id: product.id,
      product_title: product.title,
      action: 'ordered',
      quantity: reorderQty,
      supplier: bestSupplier.name,
      forecast_days: forecast.days_until_stockout,
      risk: forecast.risk_level,
    });
  }

  return json({ success: true, results });
}

async function selectBestSupplierForReorder(supabase: any, productId: string, userId: string, quantity: number, rule: any) {
  const { data: mappings } = await supabase
    .from('supplier_products')
    .select('*, suppliers(id, name, tier, rating, avg_delivery_days)')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    if (rule.suppliers) {
      return {
        id: rule.supplier_id,
        name: rule.suppliers.name,
        type: rule.suppliers.tier || 'generic',
        price: 0,
        stock: quantity,
        reliability: 50,
        delivery_days: 14,
        score: 50,
      };
    }
    return null;
  }

  // Get supplier scores if available
  const supplierIds = mappings.map((m: any) => m.supplier_id).filter(Boolean);
  const { data: scores } = await supabase
    .from('supplier_scores')
    .select('supplier_id, overall_score, reliability_score, delivery_score, quality_score')
    .in('supplier_id', supplierIds)
    .eq('user_id', userId);

  const scoreMap = new Map((scores || []).map((s: any) => [s.supplier_id, s]));

  const candidates = mappings
    .filter((m: any) => (m.stock_quantity || 0) >= quantity)
    .map((m: any) => {
      const supplier = m.suppliers || {};
      const supplierScore = scoreMap.get(m.supplier_id);
      const price = m.cost_price || m.price || 0;
      const reliability = supplierScore?.reliability_score || supplier.rating || 70;
      const deliveryScore = supplierScore?.delivery_score || Math.max(0, 100 - (supplier.avg_delivery_days || 14) * 5);
      const qualityScore = supplierScore?.quality_score || 75;
      const stock = m.stock_quantity || 0;

      // Price: 35%, Reliability: 25%, Delivery: 20%, Quality: 15%, Stock: 5%
      const prices = mappings.map((x: any) => x.cost_price || x.price || 1);
      const maxPrice = Math.max(...prices, 1);
      const priceScore = maxPrice > 0 ? (1 - price / maxPrice) * 100 : 50;
      const stockScore = Math.min(100, (stock / Math.max(quantity, 1)) * 50);

      const score = priceScore * 0.35 + reliability * 0.25 + deliveryScore * 0.20 + qualityScore * 0.15 + stockScore * 0.05;

      return {
        id: supplier.id || m.supplier_id,
        name: supplier.name || 'Unknown',
        type: supplier.tier || 'generic',
        price,
        stock,
        reliability,
        delivery_days: supplier.avg_delivery_days || 14,
        score: Math.round(score),
      };
    });

  candidates.sort((a: any, b: any) => b.score - a.score);
  return candidates[0] || null;
}

// ─── Supplier Analysis ───────────────────────────────────────────────

async function handleSupplierAnalysis(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  // Get all suppliers with their products
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, tier, rating, avg_delivery_days, config, contact_email')
    .eq('user_id', userId);

  if (!suppliers || suppliers.length === 0) return json({ success: true, suppliers: [], scores: [] });

  const analysis = [];

  for (const supplier of suppliers) {
    // Get products from this supplier
    const { data: products } = await supabase
      .from('supplier_products')
      .select('id, product_id, cost_price, price, stock_quantity, is_active')
      .eq('supplier_id', supplier.id)
      .eq('user_id', userId);

    // Get completed orders for this supplier
    const { data: orders } = await supabase
      .from('auto_order_queue')
      .select('payload, result, processed_at, created_at, status')
      .eq('user_id', userId)
      .contains('payload', { supplier_id: supplier.id });

    const totalOrders = (orders || []).length;
    const completedOrders = (orders || []).filter((o: any) => o.status === 'completed').length;
    const failedOrders = (orders || []).filter((o: any) => o.status === 'failed').length;

    // Calculate delivery performance
    const deliveredOrders = (orders || []).filter((o: any) => o.result?.tracking_status === 'delivered');
    const avgDeliveryDays = deliveredOrders.length > 0
      ? Math.round(deliveredOrders.reduce((s: number, o: any) => s + (o.result?.days_since_order || 0), 0) / deliveredOrders.length)
      : supplier.avg_delivery_days || 14;

    // Reliability score
    const reliabilityScore = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 50;

    // Price competitiveness
    const avgCost = (products || []).reduce((s: number, p: any) => s + (p.cost_price || p.price || 0), 0) / Math.max(1, (products || []).length);

    // Stock availability
    const activeProducts = (products || []).filter((p: any) => p.is_active);
    const inStockProducts = activeProducts.filter((p: any) => (p.stock_quantity || 0) > 0);
    const stockAvailability = activeProducts.length > 0 ? Math.round((inStockProducts.length / activeProducts.length) * 100) : 0;

    // Overall score
    const overallScore = Math.round(
      reliabilityScore * 0.3 +
      Math.min(100, Math.max(0, 100 - (avgDeliveryDays - 5) * 5)) * 0.25 +
      stockAvailability * 0.25 +
      (supplier.rating || 50) * 0.2
    );

    const recommendation = overallScore >= 80 ? 'preferred' :
      overallScore >= 60 ? 'recommended' :
        overallScore >= 40 ? 'neutral' :
          overallScore >= 20 ? 'caution' : 'avoid';

    analysis.push({
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      tier: supplier.tier,
      overall_score: overallScore,
      reliability_score: reliabilityScore,
      delivery_score: Math.min(100, Math.max(0, 100 - (avgDeliveryDays - 5) * 5)),
      avg_delivery_days: avgDeliveryDays,
      stock_availability: stockAvailability,
      total_products: (products || []).length,
      active_products: activeProducts.length,
      avg_cost: Math.round(avgCost * 100) / 100,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      failed_orders: failedOrders,
      recommendation,
    });

    // Persist score
    await supabase.from('supplier_scores').upsert({
      user_id: userId,
      supplier_id: supplier.id,
      overall_score: overallScore,
      reliability_score: reliabilityScore,
      delivery_score: Math.min(100, Math.max(0, 100 - (avgDeliveryDays - 5) * 5)),
      quality_score: stockAvailability,
      price_score: Math.round(avgCost > 0 ? Math.min(100, 5000 / avgCost) : 50),
      communication_score: 50,
      return_rate: failedOrders > 0 ? Math.round((failedOrders / Math.max(1, totalOrders)) * 100) : 0,
      avg_delivery_days: avgDeliveryDays,
      on_time_rate: reliabilityScore,
      total_orders: totalOrders,
      total_issues: failedOrders,
      recommendation,
      last_evaluated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,supplier_id', ignoreDuplicates: false });
  }

  analysis.sort((a, b) => b.overall_score - a.overall_score);

  return json({
    success: true,
    suppliers: analysis,
    summary: {
      total: analysis.length,
      preferred: analysis.filter(s => s.recommendation === 'preferred').length,
      caution: analysis.filter(s => s.recommendation === 'caution' || s.recommendation === 'avoid').length,
      avg_score: Math.round(analysis.reduce((s, a) => s + a.overall_score, 0) / Math.max(1, analysis.length)),
    },
  });
}

// ─── Dashboard Metrics ───────────────────────────────────────────────

async function handleDashboardMetrics(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  const [
    { data: predictions },
    { data: products },
    { count: activeRules },
    { count: pendingOrders },
    { data: supplierScores },
  ] = await Promise.all([
    supabase.from('stock_predictions').select('*').eq('user_id', userId).order('predicted_days_until_stockout', { ascending: true, nullsFirst: false }).limit(100),
    supabase.from('products').select('id, stock_quantity, status').eq('user_id', userId).eq('status', 'active'),
    supabase.from('auto_order_rules').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
    supabase.from('auto_order_queue').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['pending', 'processing']),
    supabase.from('supplier_scores').select('*').eq('user_id', userId).order('overall_score', { ascending: false }),
  ]);

  const preds = predictions || [];
  const prods = products || [];
  const criticalProducts = preds.filter((p: any) => p.reorder_urgency === 'critical' || p.reorder_urgency === 'high');
  const outOfStock = prods.filter((p: any) => (p.stock_quantity || 0) === 0);
  const lowStock = prods.filter((p: any) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) <= 5);

  return json({
    success: true,
    metrics: {
      total_products: prods.length,
      out_of_stock: outOfStock.length,
      low_stock: lowStock.length,
      critical_predictions: criticalProducts.length,
      active_reorder_rules: activeRules || 0,
      pending_orders: pendingOrders || 0,
      avg_days_to_stockout: preds.length > 0
        ? Math.round(preds.filter((p: any) => p.predicted_days_until_stockout != null).reduce((s: number, p: any) => s + p.predicted_days_until_stockout, 0) / Math.max(1, preds.filter((p: any) => p.predicted_days_until_stockout != null).length))
        : null,
      top_suppliers: (supplierScores || []).slice(0, 5).map((s: any) => ({
        id: s.supplier_id,
        score: s.overall_score,
        recommendation: s.recommendation,
      })),
      forecasts_count: preds.length,
    },
  });
}
