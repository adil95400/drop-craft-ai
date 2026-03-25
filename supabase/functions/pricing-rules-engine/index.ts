import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ─── Types ───────────────────────────────────────────────────────────
interface PricingRequest {
  action?: string;
  userId?: string;
  productId?: string;
  productIds?: string[];
  currentPrice?: number;
  costPrice?: number;
  category?: string;
  applyRules?: boolean;
  platformFeePercent?: number;
  shippingCost?: number;
  adSpendPerUnit?: number;
}

// ─── P&L Calculator (marge nette = revenue - COGS - fees - shipping - ads) ──
interface PnLBreakdown {
  costPrice: number;
  sellingPrice: number;
  platformFees: number;
  shippingCost: number;
  adSpend: number;
  vatAmount: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;
  breakEvenPrice: number;
  healthStatus: 'healthy' | 'warning' | 'danger';
}

function calculatePnL(
  sellingPrice: number,
  costPrice: number,
  options: {
    platformFeePercent?: number;
    shippingCost?: number;
    adSpendPerUnit?: number;
    vatPercent?: number;
  } = {}
): PnLBreakdown {
  const platformFeePercent = options.platformFeePercent ?? 5;
  const platformFees = sellingPrice * (platformFeePercent / 100);
  const shippingCost = options.shippingCost ?? 0;
  const adSpend = options.adSpendPerUnit ?? 0;
  const vatPercent = options.vatPercent ?? 0;
  const vatAmount = sellingPrice * (vatPercent / 100);

  const totalCost = costPrice + platformFees + shippingCost + adSpend + vatAmount;
  const grossProfit = sellingPrice - costPrice;
  const grossMarginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const netProfit = sellingPrice - totalCost;
  const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  // Break-even = total fixed costs / (1 - variable cost ratio)
  const fixedCosts = costPrice + shippingCost + adSpend;
  const variableRate = (platformFeePercent + vatPercent) / 100;
  const breakEvenPrice = variableRate < 1 ? fixedCosts / (1 - variableRate) : fixedCosts * 2;

  const healthStatus: PnLBreakdown['healthStatus'] =
    netMarginPercent >= 15 ? 'healthy' :
    netMarginPercent >= 5 ? 'warning' : 'danger';

  return {
    costPrice, sellingPrice, platformFees, shippingCost, adSpend, vatAmount,
    totalCost: round2(totalCost),
    grossProfit: round2(grossProfit),
    grossMarginPercent: round2(grossMarginPercent),
    netProfit: round2(netProfit),
    netMarginPercent: round2(netMarginPercent),
    breakEvenPrice: round2(breakEvenPrice),
    healthStatus,
  };
}

// ─── Confidence Scoring ──────────────────────────────────────────────
interface ConfidenceResult {
  score: number;
  level: 'high' | 'medium' | 'low';
  reasons: string[];
  allowAutoApply: boolean;
}

function calculateConfidence(params: {
  hasCompetitorData: boolean;
  competitorCount: number;
  dateFreshnessDays: number;
  hasCostPrice: boolean;
  ruleCount: number;
  hasSalesHistory?: boolean;
}): ConfidenceResult {
  let score = 40; // base
  const reasons: string[] = [];

  // Cost price is critical for margin accuracy
  if (params.hasCostPrice) { score += 20; }
  else { reasons.push('Pas de prix de revient — marge non vérifiable'); }

  // Competitor data quality
  if (params.hasCompetitorData) {
    score += 10;
    if (params.competitorCount >= 5) { score += 10; }
    else if (params.competitorCount >= 3) { score += 5; }
    else { reasons.push(`Seulement ${params.competitorCount} concurrent(s) analysé(s)`); }

    if (params.dateFreshnessDays <= 1) { score += 10; }
    else if (params.dateFreshnessDays <= 7) { score += 5; }
    else { reasons.push(`Données concurrentielles datent de ${Math.round(params.dateFreshnessDays)}j`); }
  } else {
    reasons.push('Aucune donnée concurrentielle disponible');
  }

  // Rules coverage
  if (params.ruleCount >= 2) { score += 5; }

  // Sales history for demand signal
  if (params.hasSalesHistory) { score += 5; }
  else { reasons.push('Pas d\'historique de ventes'); }

  score = Math.min(100, Math.max(0, score));
  const level: ConfidenceResult['level'] =
    score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';

  return {
    score, level, reasons,
    allowAutoApply: level !== 'low',
  };
}

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const body = await req.json() as PricingRequest;
    const cronSecret = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');

    // ── Route: batch/cron actions ──
    const batchActions = ['apply_all', 'reprice_from_competitors', 'sync_stock_alerts',
      'apply_pricing_rules', 'auto_reprice_from_competitors'];

    if (body.action && batchActions.includes(body.action)) {
      // Validate auth: either cron secret, service role, or user JWT
      const isServiceRole = authHeader?.includes(supabaseServiceKey);
      const isCronAuth = cronSecret && CRON_SECRET && cronSecret === CRON_SECRET;

      let userId: string | undefined;

      if (!isServiceRole && !isCronAuth) {
        // Try JWT auth for user-scoped batch
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: userData, error: authError } = await supabase.auth.getUser(token);
          if (authError || !userData?.user) {
            return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
          }
          userId = userData.user.id;
        } else {
          return jsonResponse({ success: false, error: 'Authentication required' }, 401);
        }
      }

      // Normalize legacy action names from cross-module-sync
      const normalizedAction = body.action === 'apply_pricing_rules' ? 'apply_all'
        : body.action === 'auto_reprice_from_competitors' ? 'reprice_from_competitors'
        : body.action;

      switch (normalizedAction) {
        case 'apply_all':
          return await handleApplyAll(supabase, userId, body);
        case 'reprice_from_competitors':
          return await handleRepriceFromCompetitors(supabase, userId);
        case 'sync_stock_alerts':
          return await handleSyncStockAlerts(supabase, userId);
      }
    }

    // ── Route: single product evaluation ──
    let userId = body.userId;
    if (authHeader && !authHeader.includes(supabaseServiceKey)) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData?.user) {
        return jsonResponse({ success: false, error: 'Invalid token' }, 401);
      }
      userId = userData.user.id;
    }

    // Action: calculate_pnl — standalone P&L calculation
    if (body.action === 'calculate_pnl') {
      if (!body.costPrice || !body.currentPrice) {
        return jsonResponse({ success: false, error: 'costPrice and currentPrice required' }, 400);
      }
      const pnl = calculatePnL(body.currentPrice, body.costPrice, {
        platformFeePercent: body.platformFeePercent,
        shippingCost: body.shippingCost,
        adSpendPerUnit: body.adSpendPerUnit,
      });
      return jsonResponse({ success: true, pnl });
    }

    // Action: batch_pnl — P&L for multiple products
    if (body.action === 'batch_pnl' && userId) {
      return await handleBatchPnL(supabase, userId, body);
    }

    const { productId, currentPrice, costPrice, category, applyRules = false } = body;

    if (!userId || !productId) {
      return jsonResponse({ success: false, error: 'userId and productId required' }, 400);
    }

    // Fetch rules
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules').select('*')
      .eq('user_id', userId).eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;

    // Fetch competitor data
    const { data: competitors } = await supabase
      .from('competitor_prices').select('competitor_price, updated_at')
      .eq('product_id', productId).eq('user_id', userId);

    const competitorCount = competitors?.length || 0;
    const freshestCompetitor = competitors?.length
      ? Math.min(...competitors.map((c: any) => (Date.now() - new Date(c.updated_at).getTime()) / 86400000))
      : 999;

    // Check sales history for confidence
    const { count: salesCount } = await supabase
      .from('orders').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).limit(1);

    let suggestedPrice = currentPrice || 0;
    const appliedRules: any[] = [];

    for (const rule of rules || []) {
      let ruleApplies = false;
      let newPrice = suggestedPrice;
      const conditions = rule.conditions as any;
      const actions = rule.actions as any;
      const calculation = rule.calculation as any;

      // Check category filter
      if (rule.apply_to === 'category' && rule.apply_filter) {
        const filter = rule.apply_filter as any;
        if (filter.category && category && filter.category !== category) continue;
      }

      switch (rule.rule_type) {
        case 'markup':
          if (calculation?.markup_percent && costPrice && costPrice > 0) {
            newPrice = costPrice * (1 + calculation.markup_percent / 100);
            ruleApplies = true;
          } else if (conditions?.fixed_markup && actions?.markup_value && costPrice) {
            newPrice = costPrice * (1 + actions.markup_value / 100);
            ruleApplies = true;
          } else if (conditions?.min_margin_percent && costPrice) {
            const currentMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100;
            if (currentMargin < conditions.min_margin_percent) {
              newPrice = costPrice / (1 - conditions.min_margin_percent / 100);
              ruleApplies = true;
            }
          }
          break;
        case 'margin':
          if (rule.target_margin && costPrice && costPrice > 0) {
            newPrice = costPrice / (1 - rule.target_margin / 100);
            ruleApplies = true;
          }
          break;
        case 'fixed':
          if (calculation?.fixed_amount && costPrice && costPrice > 0) {
            newPrice = costPrice + calculation.fixed_amount;
            ruleApplies = true;
          }
          break;
        case 'competitor':
          if (actions?.position === 'below_average' && competitors && competitors.length > 0) {
            const avgPrice = competitors.reduce((sum: number, c: any) => sum + c.competitor_price, 0) / competitors.length;
            newPrice = avgPrice * (1 - (actions.discount_percent || 5) / 100);
            ruleApplies = true;
          }
          break;
        case 'time_based': {
          const now = new Date();
          const hour = now.getHours();
          if (conditions?.time_range) {
            const [startHour, endHour] = conditions.time_range;
            if (hour >= startHour && hour < endHour && actions?.adjustment_percent) {
              newPrice = suggestedPrice * (1 + actions.adjustment_percent / 100);
              ruleApplies = true;
            }
          }
          break;
        }
      }

      if (ruleApplies && newPrice !== suggestedPrice) {
        appliedRules.push({
          rule_id: rule.id, rule_name: rule.name || rule.rule_name,
          rule_type: rule.rule_type,
          old_price: round2(suggestedPrice), new_price: round2(newPrice),
          change_percent: round2(((newPrice - suggestedPrice) / suggestedPrice) * 100),
        });
        suggestedPrice = newPrice;
      }
    }

    // Apply rounding from first active rule
    const roundingStrategy = (rules || [])[0]?.rounding_strategy ?? 'nearest_99';
    suggestedPrice = applyRounding(suggestedPrice, roundingStrategy);

    // Full P&L breakdown
    const pnl = calculatePnL(suggestedPrice, costPrice || 0, {
      platformFeePercent: body.platformFeePercent ?? 5,
      shippingCost: body.shippingCost,
      adSpendPerUnit: body.adSpendPerUnit,
    });

    // Confidence scoring
    const confidence = calculateConfidence({
      hasCompetitorData: competitorCount > 0,
      competitorCount,
      dateFreshnessDays: freshestCompetitor,
      hasCostPrice: !!costPrice && costPrice > 0,
      ruleCount: appliedRules.length,
      hasSalesHistory: (salesCount || 0) > 0,
    });

    // Auto-apply gate: confidence must be medium+ AND net margin >= 5%
    const canAutoApply = confidence.allowAutoApply && pnl.netMarginPercent >= 5;
    const didApply = applyRules && appliedRules.length > 0 && canAutoApply;

    if (didApply) {
      const finalPrice = round2(suggestedPrice);
      await supabase.from('products')
        .update({ price: finalPrice, updated_at: new Date().toISOString() })
        .eq('id', productId).eq('user_id', userId);

      await supabase.from('price_change_history').insert({
        user_id: userId, product_id: productId,
        old_price: currentPrice, new_price: finalPrice,
        change_type: 'automatic', source: 'pricing_rules_engine',
        reason: `Rules: ${appliedRules.map(r => r.rule_name).join(', ')} | Confidence: ${confidence.score}% | Net margin: ${pnl.netMarginPercent}%`,
      });
    }

    return jsonResponse({
      success: true,
      product_id: productId,
      original_price: currentPrice,
      suggested_price: round2(suggestedPrice),
      price_change: round2(suggestedPrice - (currentPrice || 0)),
      rules_evaluated: rules?.length || 0,
      rules_applied: appliedRules.length,
      applied_rules: appliedRules,
      applied: didApply,
      pnl,
      confidence,
    });
  } catch (error) {
    console.error('Pricing rules engine error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});

// ─── Batch apply all pricing rules ───────────────────────────────────
async function handleApplyAll(supabase: any, scopeUserId?: string, body?: PricingRequest) {
  const startTime = Date.now();

  let rulesQuery = supabase
    .from('pricing_rules').select('*').eq('is_active', true)
    .order('priority', { ascending: false });

  if (scopeUserId) {
    rulesQuery = rulesQuery.eq('user_id', scopeUserId);
  }

  const { data: rules, error: rulesError } = await rulesQuery;
  if (rulesError) throw rulesError;

  if (!rules || rules.length === 0) {
    return jsonResponse({ success: true, message: 'No active rules', applied: 0, products_updated: 0 });
  }

  const rulesByUser = new Map<string, any[]>();
  for (const rule of rules) {
    const list = rulesByUser.get(rule.user_id) || [];
    list.push(rule);
    rulesByUser.set(rule.user_id, list);
  }

  let totalUpdated = 0, totalEvaluated = 0, totalErrors = 0, totalSkippedMargin = 0;

  for (const [userId, userRules] of rulesByUser) {
    try {
      const { data: products } = await supabase
        .from('products').select('id, price, cost_price, category, status')
        .eq('user_id', userId).eq('status', 'active')
        .not('cost_price', 'is', null).gt('cost_price', 0).limit(500);

      if (!products) continue;

      for (const product of products) {
        totalEvaluated++;
        let newPrice = product.price || 0;
        const costPrice = product.cost_price;
        let ruleApplied: string | null = null;

        for (const rule of userRules) {
          if (rule.apply_to === 'category' && rule.apply_filter?.category) {
            if (product.category !== rule.apply_filter.category) continue;
          }

          const calculation = rule.calculation as any;
          const targetMargin = rule.target_margin;

          switch (rule.rule_type) {
            case 'margin':
              if (targetMargin && costPrice > 0) {
                newPrice = costPrice / (1 - targetMargin / 100);
                ruleApplied = rule.name;
              }
              break;
            case 'markup':
              if (calculation?.markup_percent && costPrice > 0) {
                newPrice = costPrice * (1 + calculation.markup_percent / 100);
                ruleApplied = rule.name;
              } else if (rule.conditions?.fixed_markup && rule.actions?.markup_value && costPrice > 0) {
                newPrice = costPrice * (1 + rule.actions.markup_value / 100);
                ruleApplied = rule.name;
              }
              break;
            case 'fixed':
              if (calculation?.fixed_amount && costPrice > 0) {
                newPrice = costPrice + calculation.fixed_amount;
                ruleApplied = rule.name;
              }
              break;
          }
        }

        // Margin protection
        const marginProtection = userRules[0]?.margin_protection ?? 15;
        const minAllowed = costPrice / (1 - marginProtection / 100);
        if (newPrice < minAllowed) newPrice = minAllowed;

        // Rounding
        const roundingStrategy = userRules[0]?.rounding_strategy ?? 'nearest_99';
        newPrice = applyRounding(newPrice, roundingStrategy);

        const roundedNew = round2(newPrice);
        const currentPrice = round2(product.price || 0);

        if (roundedNew !== currentPrice && ruleApplied) {
          // P&L safety: skip if net margin < 5%
          const pnl = calculatePnL(roundedNew, costPrice, {
            platformFeePercent: body?.platformFeePercent ?? 5,
          });
          if (pnl.netMarginPercent < 5) {
            totalSkippedMargin++;
            continue;
          }

          await supabase.from('products')
            .update({ price: roundedNew, updated_at: new Date().toISOString() })
            .eq('id', product.id);

          await supabase.from('price_change_history').insert({
            user_id: userId, product_id: product.id,
            old_price: currentPrice, new_price: roundedNew,
            change_type: 'automatic', source: 'pricing_rules_engine',
            reason: `Rule: ${ruleApplied} | Net margin: ${pnl.netMarginPercent}%`,
          });
          totalUpdated++;
        }
      }

      // Update rule execution counters
      for (const rule of userRules) {
        await supabase.from('pricing_rules').update({
          execution_count: (rule.execution_count || 0) + 1,
          last_executed_at: new Date().toISOString(),
        }).eq('id', rule.id);
      }
    } catch (userError) {
      console.error(`[pricing-rules-engine] Error for user ${userId}:`, userError);
      totalErrors++;
    }
  }

  const durationMs = Date.now() - startTime;

  await supabase.from('activity_logs').insert({
    action: 'pricing_batch_apply', entity_type: 'pricing',
    description: `Batch pricing: ${totalUpdated}/${totalEvaluated} updated, ${totalSkippedMargin} skipped (low margin)`,
    source: 'automation', severity: totalErrors > 0 ? 'warn' : 'info',
    details: { totalUpdated, totalEvaluated, totalErrors, totalSkippedMargin, durationMs, usersProcessed: rulesByUser.size },
  });

  return jsonResponse({
    success: true,
    applied: totalUpdated,
    products_evaluated: totalEvaluated,
    products_updated: totalUpdated,
    skipped_low_margin: totalSkippedMargin,
    errors: totalErrors,
    users_processed: rulesByUser.size,
    duration_ms: durationMs,
  });
}

// ─── Competitive repricing ───────────────────────────────────────────
async function handleRepriceFromCompetitors(supabase: any, scopeUserId?: string) {
  const startTime = Date.now();

  let query = supabase
    .from('competitive_intelligence')
    .select('user_id, product_id, competitor_price, competitor_name, updated_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (scopeUserId) {
    query = query.eq('user_id', scopeUserId);
  }

  const { data: intel } = await query;

  if (!intel?.length) {
    return jsonResponse({ success: true, message: 'No competitor data', adjusted: 0, competitors_analyzed: 0 });
  }

  // Group by user:product, track lowest price + freshness
  const userProductMap = new Map<string, { lowestPrice: number; competitorCount: number; freshestDays: number }>();
  for (const row of intel) {
    if (!row.product_id || !row.user_id) continue;
    const key = `${row.user_id}:${row.product_id}`;
    const compPrice = Number(row.competitor_price);
    const daysSince = (Date.now() - new Date(row.updated_at).getTime()) / 86400000;
    const existing = userProductMap.get(key);

    if (!existing) {
      userProductMap.set(key, { lowestPrice: compPrice, competitorCount: 1, freshestDays: daysSince });
    } else {
      existing.lowestPrice = Math.min(existing.lowestPrice, compPrice);
      existing.competitorCount++;
      existing.freshestDays = Math.min(existing.freshestDays, daysSince);
    }
  }

  let adjusted = 0, skippedLowConfidence = 0, skippedLowMargin = 0;

  for (const [key, data] of userProductMap) {
    const [userId, productId] = key.split(':');

    const conf = calculateConfidence({
      hasCompetitorData: true,
      competitorCount: data.competitorCount,
      dateFreshnessDays: data.freshestDays,
      hasCostPrice: true,
      ruleCount: 1,
    });

    if (!conf.allowAutoApply) { skippedLowConfidence++; continue; }

    const { data: product } = await supabase
      .from('products').select('id, price, cost_price')
      .eq('id', productId).single();

    if (!product) continue;

    // Strategy: match lowest -1%, floor at cost +10%
    const targetPrice = round2(data.lowestPrice * 0.99);
    const minPrice = product.cost_price ? product.cost_price * 1.1 : product.price * 0.7;
    const newPrice = Math.max(targetPrice, minPrice);

    // P&L safety check
    if (product.cost_price) {
      const pnl = calculatePnL(newPrice, product.cost_price);
      if (pnl.netMarginPercent < 5) { skippedLowMargin++; continue; }
    }

    if (Math.abs(newPrice - product.price) > 0.5) {
      const roundedPrice = round2(newPrice);
      await supabase.from('products').update({ price: roundedPrice }).eq('id', productId);
      await supabase.from('price_change_history').insert({
        user_id: userId, product_id: productId,
        old_price: product.price, new_price: roundedPrice,
        change_type: 'competitive', source: 'pricing_rules_engine',
        reason: `Competitive reprice | Confidence: ${conf.score}% | ${data.competitorCount} competitors`,
      });
      adjusted++;
    }
  }

  const durationMs = Date.now() - startTime;

  await supabase.from('activity_logs').insert({
    action: 'competitive_reprice', entity_type: 'pricing',
    description: `Competitive reprice: ${adjusted} adjusted, ${skippedLowConfidence} low-conf, ${skippedLowMargin} low-margin`,
    source: 'pricing_rules_engine', severity: 'info',
    details: { adjusted, skippedLowConfidence, skippedLowMargin, analyzed: userProductMap.size, durationMs },
  });

  return jsonResponse({
    success: true, adjusted,
    skipped_low_confidence: skippedLowConfidence,
    skipped_low_margin: skippedLowMargin,
    competitors_analyzed: intel.length,
    duration_ms: durationMs,
  });
}

// ─── Stock alerts ────────────────────────────────────────────────────
async function handleSyncStockAlerts(supabase: any, scopeUserId?: string) {
  let lowQuery = supabase
    .from('products').select('id, title, stock_quantity, user_id')
    .lte('stock_quantity', 3).gt('stock_quantity', 0).limit(200);
  let oosQuery = supabase
    .from('products').select('id, title, user_id')
    .eq('stock_quantity', 0).limit(200);

  if (scopeUserId) {
    lowQuery = lowQuery.eq('user_id', scopeUserId);
    oosQuery = oosQuery.eq('user_id', scopeUserId);
  }

  const [{ data: lowStock }, { data: outOfStock }] = await Promise.all([lowQuery, oosQuery]);

  const alerts: any[] = [];

  // Group OOS by user
  const oosByUser = new Map<string, any[]>();
  for (const p of (outOfStock || [])) {
    const list = oosByUser.get(p.user_id) || [];
    list.push(p);
    oosByUser.set(p.user_id, list);
  }

  for (const p of (lowStock || []).slice(0, 50)) {
    alerts.push({
      user_id: p.user_id, alert_type: 'low_stock', severity: 'warning',
      title: `Stock bas: ${p.title?.slice(0, 50)}`,
      message: `Il ne reste que ${p.stock_quantity} unités de "${p.title?.slice(0, 50)}"`,
      metadata: { product_id: p.id, stock: p.stock_quantity },
    });
  }

  for (const [userId, products] of oosByUser) {
    alerts.push({
      user_id: userId, alert_type: 'out_of_stock', severity: 'critical',
      title: `${products.length} produit(s) en rupture`,
      message: `${products.length} produit(s) sont en rupture de stock.`,
      metadata: { count: products.length, product_ids: products.slice(0, 5).map((p: any) => p.id) },
    });
  }

  if (alerts.length > 0) {
    await supabase.from('active_alerts').insert(alerts);
  }

  return jsonResponse({
    success: true,
    low_stock: lowStock?.length || 0,
    out_of_stock: outOfStock?.length || 0,
    alerts_created: alerts.length,
  });
}

// ─── Batch P&L for multiple products ─────────────────────────────────
async function handleBatchPnL(supabase: any, userId: string, body: PricingRequest) {
  const { data: products } = await supabase
    .from('products').select('id, title, price, cost_price')
    .eq('user_id', userId).not('price', 'is', null).not('cost_price', 'is', null)
    .gt('cost_price', 0).limit(200);

  if (!products?.length) {
    return jsonResponse({ success: true, products: [], summary: null });
  }

  const results = products.map((p: any) => {
    const pnl = calculatePnL(p.price, p.cost_price, {
      platformFeePercent: body.platformFeePercent ?? 5,
      shippingCost: body.shippingCost,
      adSpendPerUnit: body.adSpendPerUnit,
    });
    return { product_id: p.id, title: p.title, pnl };
  });

  const totalRevenue = results.reduce((s: number, r: any) => s + r.pnl.sellingPrice, 0);
  const totalNetProfit = results.reduce((s: number, r: any) => s + r.pnl.netProfit, 0);
  const avgNetMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const healthCounts = { healthy: 0, warning: 0, danger: 0 };
  results.forEach((r: any) => { healthCounts[r.pnl.healthStatus as keyof typeof healthCounts]++; });

  return jsonResponse({
    success: true,
    products: results,
    summary: {
      total_products: results.length,
      total_revenue: round2(totalRevenue),
      total_net_profit: round2(totalNetProfit),
      avg_net_margin: round2(avgNetMargin),
      health_distribution: healthCounts,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function applyRounding(price: number, strategy: string): number {
  switch (strategy) {
    case 'nearest_99': return Math.floor(price) + 0.99;
    case 'nearest_50': return Math.round(price * 2) / 2;
    case 'round_up': return Math.ceil(price);
    case 'nearest_95': return Math.floor(price) + 0.95;
    default: return Math.round(price * 100) / 100;
  }
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
