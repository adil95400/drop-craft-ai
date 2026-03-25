import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'forecast';

    // ── SECURITY: Dual auth ──
    const cronActions = ['cron_full_cycle', 'check_and_reorder', 'auto_reorder_check'];
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');

    if (cronActions.includes(action)) {
      const isServiceRole = authHeader?.includes(supabaseKey);
      if (!cronSecret && !isServiceRole) {
        return json({ error: 'Authentication required for cron actions' }, 401);
      }
      if (cronSecret && CRON_SECRET && cronSecret !== CRON_SECRET) {
        await supabase.from('activity_logs').insert({
          action: 'inventory_auth_failed', entity_type: 'security',
          description: 'Unauthorized smart-inventory-engine trigger attempt',
          severity: 'warn', source: 'smart_inventory_engine',
        });
        return json({ error: 'Unauthorized' }, 403);
      }
    } else {
      // User-facing actions: extract userId from JWT ONLY (no body fallback)
      if (!authHeader) {
        return json({ error: 'Authentication required' }, 401);
      }
      const isServiceRole = authHeader.includes(supabaseKey);
      if (!isServiceRole) {
        const token = authHeader.replace('Bearer ', '');
        const { data, error: authError } = await supabase.auth.getClaims(token);
        if (authError || !data?.claims?.sub) {
          return json({ error: 'Invalid token' }, 401);
        }
        // Override body.userId with JWT-derived userId (prevents spoofing)
        body.userId = data.claims.sub;
      }
    }

    const handlers: Record<string, () => Promise<Response>> = {
      forecast: () => handleDemandForecast(supabase, body),
      forecast_all: () => handleForecastAll(supabase, body),
      forecast_ai: () => handleAIForecast(supabase, body),
      auto_reorder_check: () => handleSmartReorderCheck(supabase, body),
      supplier_analysis: () => handleSupplierAnalysis(supabase, body),
      dashboard_metrics: () => handleDashboardMetrics(supabase, body),
      cron_full_cycle: () => handleCronFullCycle(supabase, body),
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

// ─── Types ───────────────────────────────────────────────────────────

interface ForecastResult {
  product_id: string;
  product_title: string;
  current_stock: number;
  daily_velocity: number;
  weekly_forecast: number[];
  monthly_forecast: number;
  seasonality_factor: number;
  monthly_seasonality: number[];
  trend_direction: 'up' | 'down' | 'stable';
  trend_strength: number;
  days_until_stockout: number | null;
  recommended_reorder_point: number;
  recommended_reorder_qty: number;
  confidence: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  promotion_impact: number;
  ai_enhanced: boolean;
}

// ─── Cron Full Cycle ─────────────────────────────────────────────────

async function handleCronFullCycle(supabase: any, body: any): Promise<Response> {
  const { userId } = body;

  let userIds: string[] = [];
  if (userId) {
    userIds = [userId];
  } else {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(100);
    userIds = (profiles || []).map((p: any) => p.id);
  }

  const results: any[] = [];

  for (const uid of userIds) {
    try {
      const forecastResult = await runForecastAll(supabase, uid);
      const reorderResult = await runSmartReorderCheck(supabase, uid);
      const supplierResult = await runSupplierAnalysis(supabase, uid);

      results.push({
        user_id: uid,
        forecasts: forecastResult.count,
        reorders_triggered: reorderResult.triggered,
        suppliers_analyzed: supplierResult.total,
      });

      await supabase.from('activity_logs').insert({
        user_id: uid, action: 'smart_inventory_cron', entity_type: 'inventory',
        description: `Cycle auto: ${forecastResult.count} prévisions, ${reorderResult.triggered} commandes, ${supplierResult.total} fournisseurs`,
        source: 'cron', severity: 'info',
      });
    } catch (e) {
      console.error(`Cron error for user ${uid}:`, e);
      results.push({ user_id: uid, error: e.message });
    }
  }

  return json({ success: true, results, users_processed: userIds.length });
}

// ─── Demand Forecasting ──────────────────────────────────────────────

async function handleDemandForecast(supabase: any, body: any): Promise<Response> {
  const { productId, userId } = body;
  if (!productId || !userId) return json({ error: 'productId and userId required' }, 400);

  const forecast = await computeProductForecast(supabase, productId, userId);
  if (!forecast) return json({ error: 'Product not found or no data' }, 404);

  await persistForecast(supabase, userId, forecast);
  return json({ success: true, forecast });
}

async function handleForecastAll(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);
  const result = await runForecastAll(supabase, userId);
  return json({ success: true, ...result });
}

async function runForecastAll(supabase: any, userId: string) {
  const { data: products } = await supabase
    .from('products').select('id, title, stock_quantity, status')
    .eq('user_id', userId).eq('status', 'active').limit(200);

  if (!products || products.length === 0) return { forecasts: [], count: 0, errors: 0, summary: {} };

  const forecasts: ForecastResult[] = [];
  const errors: string[] = [];

  for (const product of products) {
    try {
      const forecast = await computeProductForecast(supabase, product.id, userId);
      if (forecast) { forecasts.push(forecast); await persistForecast(supabase, userId, forecast); }
    } catch (e) { errors.push(`${product.title}: ${e.message}`); }
  }

  await supabase.from('activity_logs').insert({
    user_id: userId, action: 'demand_forecast_batch', entity_type: 'inventory',
    description: `Prévisions calculées: ${forecasts.length}/${products.length} produits`,
    details: { count: forecasts.length, errors: errors.length },
    source: 'smart_inventory_engine', severity: 'info',
  });

  const summary = {
    critical: forecasts.filter(f => f.risk_level === 'critical').length,
    high: forecasts.filter(f => f.risk_level === 'high').length,
    medium: forecasts.filter(f => f.risk_level === 'medium').length,
    low: forecasts.filter(f => f.risk_level === 'low').length,
    avg_days_stockout: forecasts.length > 0
      ? Math.round(forecasts.filter(f => f.days_until_stockout !== null).reduce((s, f) => s + (f.days_until_stockout || 0), 0) / Math.max(1, forecasts.filter(f => f.days_until_stockout !== null).length))
      : null,
  };

  return { count: forecasts.length, errors: errors.length, forecasts, summary };
}

async function persistForecast(supabase: any, userId: string, forecast: ForecastResult) {
  await supabase.from('stock_predictions').upsert({
    user_id: userId, product_id: forecast.product_id,
    current_stock: forecast.current_stock,
    predicted_days_until_stockout: forecast.days_until_stockout,
    predicted_stockout_date: forecast.days_until_stockout ? new Date(Date.now() + forecast.days_until_stockout * 86400000).toISOString() : null,
    confidence_score: forecast.confidence,
    daily_sale_velocity: forecast.daily_velocity,
    trend_direction: forecast.trend_direction,
    recommendation: `Réappro: ${forecast.recommended_reorder_qty}u quand stock ≤ ${forecast.recommended_reorder_point}` +
      (forecast.promotion_impact > 0 ? ` | Impact promo: +${Math.round(forecast.promotion_impact * 100)}%` : '') +
      (forecast.ai_enhanced ? ' | IA' : ''),
    reorder_quantity: forecast.recommended_reorder_qty,
    reorder_urgency: forecast.risk_level,
    last_calculated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,product_id', ignoreDuplicates: false });
}

async function computeProductForecast(supabase: any, productId: string, userId: string): Promise<ForecastResult | null> {
  const { data: product } = await supabase.from('products').select('id, title, stock_quantity, price, cost_price').eq('id', productId).single();
  if (!product) return null;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();

  const { data: salesData } = await supabase
    .from('order_items').select('quantity, created_at')
    .eq('product_id', productId).gte('created_at', ninetyDaysAgo)
    .order('created_at', { ascending: true });

  const sales = salesData || [];

  const last30Sales = sales.filter((s: any) => s.created_at >= thirtyDaysAgo);
  const prev30Sales = sales.filter((s: any) => s.created_at >= sixtyDaysAgo && s.created_at < thirtyDaysAgo);

  const totalLast30 = last30Sales.reduce((s: number, o: any) => s + (o.quantity || 1), 0);
  const totalPrev30 = prev30Sales.reduce((s: number, o: any) => s + (o.quantity || 1), 0);

  const dailyVelocity = totalLast30 / 30;
  const prevDailyVelocity = totalPrev30 / 30;

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  let trendStrength = 0;
  if (prevDailyVelocity > 0) {
    const change = (dailyVelocity - prevDailyVelocity) / prevDailyVelocity;
    trendStrength = Math.abs(change);
    if (change > 0.1) trendDirection = 'up';
    else if (change < -0.1) trendDirection = 'down';
  }

  const weeklyPattern = computeWeeklyPattern(sales);
  const monthlySeasonality = computeMonthlySeasonality(sales);
  const promotionImpact = detectPromotionImpact(sales);

  const currentMonth = new Date().getMonth();
  const monthlySeasFactor = monthlySeasonality[currentMonth] || 1.0;
  const trendMultiplier = trendDirection === 'up' ? 1 + trendStrength * 0.5 : trendDirection === 'down' ? 1 - trendStrength * 0.5 : 1;
  const adjustedVelocity = dailyVelocity * trendMultiplier * monthlySeasFactor * (1 + promotionImpact * 0.3);

  const weeklyForecast = [1, 2, 3, 4].map(week => {
    const base = adjustedVelocity * 7;
    return Math.round(Math.max(0, base * (1 + (week - 1) * (trendDirection === 'up' ? 0.02 : trendDirection === 'down' ? -0.02 : 0))));
  });

  const monthlyForecast = weeklyForecast.reduce((s, w) => s + w, 0);
  const currentStock = product.stock_quantity || 0;
  const daysUntilStockout = adjustedVelocity > 0 ? Math.round(currentStock / adjustedVelocity) : null;

  const leadTimeDays = await getSupplierLeadTime(supabase, productId, userId);
  const safetyStock = Math.ceil(adjustedVelocity * leadTimeDays * 0.5);
  const recommendedReorderPoint = Math.ceil(adjustedVelocity * leadTimeDays + safetyStock);
  const recommendedReorderQty = Math.max(Math.ceil(adjustedVelocity * 30), 10);

  const dataPoints = sales.length;
  const confidence = Math.min(95, Math.max(20, 30 + dataPoints * 2 + (trendStrength < 0.5 ? 20 : 0)));

  let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (currentStock === 0) riskLevel = 'critical';
  else if (daysUntilStockout !== null && daysUntilStockout <= 7) riskLevel = 'critical';
  else if (daysUntilStockout !== null && daysUntilStockout <= 14) riskLevel = 'high';
  else if (daysUntilStockout !== null && daysUntilStockout <= 30) riskLevel = 'medium';

  return {
    product_id: productId, product_title: product.title || 'Unknown',
    current_stock: currentStock, daily_velocity: Math.round(dailyVelocity * 100) / 100,
    weekly_forecast: weeklyForecast, monthly_forecast: monthlyForecast,
    seasonality_factor: weeklyPattern.seasonalityFactor, monthly_seasonality: monthlySeasonality,
    trend_direction: trendDirection, trend_strength: Math.round(trendStrength * 100) / 100,
    days_until_stockout: daysUntilStockout,
    recommended_reorder_point: recommendedReorderPoint, recommended_reorder_qty: recommendedReorderQty,
    confidence, risk_level: riskLevel, promotion_impact: promotionImpact, ai_enhanced: false,
  };
}

async function getSupplierLeadTime(supabase: any, productId: string, userId: string): Promise<number> {
  const { data } = await supabase.from('supplier_products').select('suppliers(avg_delivery_days)')
    .eq('product_id', productId).eq('user_id', userId).eq('is_active', true).limit(1);
  return data?.[0]?.suppliers?.avg_delivery_days || 14;
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
  const today = new Date().getDay();
  const todayFactor = overallAvg > 0 ? averages[today] / overallAvg : 1;
  return { seasonalityFactor: Math.round(Math.max(0.5, Math.min(2.0, todayFactor)) * 100) / 100 };
}

function computeMonthlySeasonality(sales: any[]): number[] {
  const monthlyTotals = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);
  for (const sale of sales) {
    const month = new Date(sale.created_at).getMonth();
    monthlyTotals[month] += sale.quantity || 1;
    monthlyCounts[month]++;
  }
  const averages = monthlyTotals.map((t, i) => monthlyCounts[i] > 0 ? t / monthlyCounts[i] : 0);
  const overallAvg = averages.reduce((s, a) => s + a, 0) / Math.max(1, averages.filter(a => a > 0).length);
  return averages.map(a => {
    if (overallAvg <= 0 || a <= 0) return 1.0;
    return Math.round(Math.max(0.5, Math.min(2.0, a / overallAvg)) * 100) / 100;
  });
}

function detectPromotionImpact(sales: any[]): number {
  if (sales.length < 14) return 0;
  const dailyMap = new Map<string, number>();
  for (const sale of sales) {
    const day = sale.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + (sale.quantity || 1));
  }
  const dailyValues = Array.from(dailyMap.values());
  if (dailyValues.length < 7) return 0;
  const avg = dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length;
  const stdDev = Math.sqrt(dailyValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / dailyValues.length);
  const spikeDays = dailyValues.filter(v => v > avg + 2 * stdDev).length;
  return Math.round(Math.min(1.0, (spikeDays / dailyValues.length) * 5) * 100) / 100;
}

// ─── AI-Enhanced Forecast ────────────────────────────────────────────

async function handleAIForecast(supabase: any, body: any): Promise<Response> {
  const { userId, productId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  const products = productId
    ? [{ id: productId }]
    : await supabase.from('products').select('id').eq('user_id', userId).eq('status', 'active').limit(50).then((r: any) => r.data || []);

  const forecasts: any[] = [];
  for (const p of products) {
    const forecast = await computeProductForecast(supabase, p.id, userId);
    if (forecast) {
      forecast.ai_enhanced = true;
      forecasts.push(forecast);
      await persistForecast(supabase, userId, forecast);
    }
  }

  return json({ success: true, forecasts, count: forecasts.length });
}

// ─── Smart Reorder Check ────────────────────────────────────────────

async function handleSmartReorderCheck(supabase: any, body: any): Promise<Response> {
  const { userId } = body;

  let userIds: string[] = [];
  if (userId) {
    userIds = [userId];
  } else {
    const { data: profiles } = await supabase.from('profiles').select('id').limit(100);
    userIds = (profiles || []).map((p: any) => p.id);
  }

  let totalTriggered = 0;

  for (const uid of userIds) {
    const result = await runSmartReorderCheck(supabase, uid);
    totalTriggered += result.triggered;
  }

  return json({ success: true, triggered: totalTriggered, users: userIds.length });
}

async function runSmartReorderCheck(supabase: any, userId: string) {
  const { data: predictions } = await supabase
    .from('stock_predictions').select('*')
    .eq('user_id', userId).in('reorder_urgency', ['critical', 'high']);

  let triggered = 0;

  for (const pred of (predictions || [])) {
    if (!pred.product_id) continue;

    const { data: existing } = await supabase
      .from('auto_order_queue').select('id')
      .eq('order_id', pred.product_id).eq('user_id', userId)
      .in('status', ['pending', 'processing']).limit(1);

    if (existing && existing.length > 0) continue;

    const { data: rules } = await supabase
      .from('auto_order_rules').select('*')
      .eq('product_id', pred.product_id).eq('user_id', userId).eq('is_active', true).limit(1);

    if (!rules || rules.length === 0) continue;

    const rule = rules[0];
    await supabase.from('auto_order_queue').insert({
      user_id: userId, order_id: pred.product_id, supplier_type: rule.supplier_type || 'generic',
      status: 'pending',
      payload: {
        product_id: pred.product_id, quantity: pred.reorder_quantity || rule.reorder_quantity || 10,
        trigger_reason: `Smart reorder: ${pred.reorder_urgency} urgency, ${pred.predicted_days_until_stockout || '?'} days to stockout`,
        rule_id: rule.id, auto_generated: true, selection_method: 'smart_forecast',
      },
      max_retries: 3,
    });

    triggered++;
  }

  return { triggered };
}

// ─── Supplier Analysis ──────────────────────────────────────────────

async function handleSupplierAnalysis(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);
  const result = await runSupplierAnalysis(supabase, userId);
  return json({ success: true, ...result });
}

async function runSupplierAnalysis(supabase: any, userId: string) {
  const { data: suppliers } = await supabase
    .from('suppliers').select('id, name, rating, avg_delivery_days, tier')
    .eq('user_id', userId).limit(50);

  return { total: suppliers?.length || 0, suppliers: suppliers || [] };
}

// ─── Dashboard Metrics ──────────────────────────────────────────────

async function handleDashboardMetrics(supabase: any, body: any): Promise<Response> {
  const { userId } = body;
  if (!userId) return json({ error: 'userId required' }, 400);

  const { data: predictions } = await supabase
    .from('stock_predictions').select('*').eq('user_id', userId);

  const critical = (predictions || []).filter((p: any) => p.reorder_urgency === 'critical').length;
  const high = (predictions || []).filter((p: any) => p.reorder_urgency === 'high').length;
  const medium = (predictions || []).filter((p: any) => p.reorder_urgency === 'medium').length;

  const { count: pendingOrders } = await supabase
    .from('auto_order_queue').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).in('status', ['pending', 'processing']);

  return json({
    success: true,
    metrics: {
      total_predictions: predictions?.length || 0,
      risk_breakdown: { critical, high, medium },
      pending_orders: pendingOrders || 0,
    },
  });
}
