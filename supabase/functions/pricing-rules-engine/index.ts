import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface PricingRequest {
  action?: string;
  userId?: string;
  productId?: string;
  currentPrice?: number;
  costPrice?: number;
  category?: string;
  applyRules?: boolean;
}

// ─── Net Margin Calculator (cost + fees + shipping + ads) ────────────
interface PnLBreakdown {
  costPrice: number;
  sellingPrice: number;
  platformFees: number;
  shippingCost: number;
  adSpend: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  netMarginPercent: number;
}

function calculatePnL(
  sellingPrice: number,
  costPrice: number,
  options: { platformFeePercent?: number; shippingCost?: number; adSpendPerUnit?: number } = {}
): PnLBreakdown {
  const platformFees = sellingPrice * ((options.platformFeePercent || 0) / 100);
  const shippingCost = options.shippingCost || 0;
  const adSpend = options.adSpendPerUnit || 0;
  const totalCost = costPrice + platformFees + shippingCost + adSpend;
  const grossProfit = sellingPrice - costPrice;
  const netProfit = sellingPrice - totalCost;
  const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  return {
    costPrice, sellingPrice, platformFees, shippingCost, adSpend,
    totalCost, grossProfit, netProfit,
    netMarginPercent: Math.round(netMarginPercent * 100) / 100,
  };
}

// ─── Confidence Scoring ──────────────────────────────────────────────
function calculateConfidence(params: {
  hasCompetitorData: boolean;
  competitorCount: number;
  dateFreshnessDays: number;
  hasCostPrice: boolean;
  ruleCount: number;
}): { score: number; level: 'high' | 'medium' | 'low'; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  if (params.hasCostPrice) { score += 15; } else { reasons.push('No cost price available'); }
  if (params.hasCompetitorData) {
    score += 10;
    if (params.competitorCount >= 3) { score += 10; } else { reasons.push(`Only ${params.competitorCount} competitor(s)`); }
    if (params.dateFreshnessDays <= 1) { score += 10; }
    else if (params.dateFreshnessDays <= 7) { score += 5; }
    else { reasons.push(`Competitor data is ${params.dateFreshnessDays} days old`); }
  } else {
    reasons.push('No competitor data');
  }
  if (params.ruleCount >= 2) { score += 5; }

  score = Math.min(100, Math.max(0, score));
  const level = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
  return { score, level, reasons };
}

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

    // ── Batch modes: require CRON_SECRET or service_role ──
    if (body.action === 'apply_all' || body.action === 'reprice_from_competitors' || body.action === 'sync_stock_alerts') {
      const isServiceRole = authHeader?.includes(supabaseServiceKey);
      if (!cronSecret && !isServiceRole) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication required for batch mode' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      if (cronSecret && CRON_SECRET && cronSecret !== CRON_SECRET) {
        await supabase.from('activity_logs').insert({
          action: 'pricing_auth_failed', entity_type: 'security',
          description: 'Unauthorized pricing-rules-engine trigger attempt',
          severity: 'warn', source: 'pricing_rules_engine',
        });
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      if (body.action === 'apply_all') return await handleApplyAll(supabase);
      if (body.action === 'reprice_from_competitors') return await handleRepriceFromCompetitors(supabase);
      if (body.action === 'sync_stock_alerts') return await handleSyncStockAlerts(supabase);
    }

    // ── Single product mode: extract userId from JWT ──
    let userId = body.userId;
    if (authHeader && !authHeader.includes(supabaseServiceKey)) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !userData?.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      userId = userData.user.id;
    }

    const { productId, currentPrice, costPrice, category, applyRules = false } = body;

    if (!userId || !productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and productId required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch rules
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules').select('*')
      .eq('user_id', userId).eq('is_active', true)
      .order('priority', { ascending: false });

    if (rulesError) throw rulesError;

    // Fetch competitor data for confidence
    const { data: competitors } = await supabase
      .from('competitor_prices').select('competitor_price, updated_at')
      .eq('product_id', productId).eq('user_id', userId);

    const competitorCount = competitors?.length || 0;
    const freshestCompetitor = competitors?.length
      ? Math.min(...competitors.map((c: any) => (Date.now() - new Date(c.updated_at).getTime()) / 86400000))
      : 999;

    let suggestedPrice = currentPrice || 0;
    const appliedRules: any[] = [];

    for (const rule of rules || []) {
      let ruleApplies = false;
      let newPrice = suggestedPrice;
      const conditions = rule.conditions as any;
      const actions = rule.actions as any;

      switch (rule.rule_type) {
        case 'markup':
          if (conditions?.min_margin_percent && costPrice) {
            const currentMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100;
            if (currentMargin < conditions.min_margin_percent) {
              newPrice = costPrice / (1 - conditions.min_margin_percent / 100);
              ruleApplies = true;
            }
          }
          if (conditions?.fixed_markup && actions?.markup_value && costPrice) {
            newPrice = costPrice * (1 + actions.markup_value / 100);
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
        case 'custom':
          if (actions?.formula && costPrice) {
            try {
              const formula = actions.formula
                .replace(/cost/g, costPrice.toString())
                .replace(/current/g, (currentPrice || 0).toString());
              if (/^[\d\s\+\-\*\/\.\(\)]+$/.test(formula)) {
                newPrice = eval(formula);
                ruleApplies = true;
              }
            } catch (_e) { /* skip */ }
          }
          break;
      }

      if (ruleApplies && newPrice !== suggestedPrice) {
        appliedRules.push({
          rule_id: rule.id, rule_name: rule.rule_name, rule_type: rule.rule_type,
          old_price: suggestedPrice, new_price: newPrice,
          change_percent: ((newPrice - suggestedPrice) / suggestedPrice) * 100,
        });
        suggestedPrice = newPrice;
      }
    }

    // P&L breakdown
    const pnl = calculatePnL(suggestedPrice, costPrice || 0, {
      platformFeePercent: 5, // default marketplace fee
    });

    // Confidence scoring
    const confidence = calculateConfidence({
      hasCompetitorData: competitorCount > 0,
      competitorCount,
      dateFreshnessDays: freshestCompetitor,
      hasCostPrice: !!costPrice && costPrice > 0,
      ruleCount: appliedRules.length,
    });

    // Auto-apply only if confidence is medium or high
    if (applyRules && appliedRules.length > 0 && confidence.level !== 'low') {
      await supabase.from('products')
        .update({ price: Math.round(suggestedPrice * 100) / 100, updated_at: new Date().toISOString() })
        .eq('id', productId).eq('user_id', userId);

      await supabase.from('price_change_history').insert({
        user_id: userId, product_id: productId,
        old_price: currentPrice, new_price: Math.round(suggestedPrice * 100) / 100,
        change_type: 'automatic', source: 'pricing_rules_engine',
        reason: `Rules: ${appliedRules.map(r => r.rule_name).join(', ')} | Confidence: ${confidence.score}%`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true, product_id: productId,
        original_price: currentPrice,
        suggested_price: Math.round(suggestedPrice * 100) / 100,
        price_change: Math.round((suggestedPrice - (currentPrice || 0)) * 100) / 100,
        rules_evaluated: rules?.length || 0,
        rules_applied: appliedRules.length,
        applied_rules: appliedRules,
        applied: applyRules && appliedRules.length > 0 && confidence.level !== 'low',
        pnl,
        confidence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Pricing rules engine error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ─── Batch apply all pricing rules ───────────────────────────────────
async function handleApplyAll(supabase: any) {
  const startTime = Date.now();

  const { data: rules, error: rulesError } = await supabase
    .from('pricing_rules').select('*').eq('is_active', true)
    .order('priority', { ascending: false });

  if (rulesError) throw rulesError;
  if (!rules || rules.length === 0) {
    return jsonResponse({ success: true, message: 'No active rules', products_updated: 0 });
  }

  const rulesByUser = new Map<string, any[]>();
  for (const rule of rules) {
    const list = rulesByUser.get(rule.user_id) || [];
    list.push(rule);
    rulesByUser.set(rule.user_id, list);
  }

  let totalUpdated = 0, totalEvaluated = 0, totalErrors = 0;

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
              if (targetMargin && costPrice > 0) { newPrice = costPrice / (1 - targetMargin / 100); ruleApplied = rule.name; }
              break;
            case 'markup':
              if (calculation?.markup_percent && costPrice > 0) { newPrice = costPrice * (1 + calculation.markup_percent / 100); ruleApplied = rule.name; }
              else if (rule.conditions?.fixed_markup && rule.actions?.markup_value && costPrice > 0) { newPrice = costPrice * (1 + rule.actions.markup_value / 100); ruleApplied = rule.name; }
              break;
            case 'fixed':
              if (calculation?.fixed_amount && costPrice > 0) { newPrice = costPrice + calculation.fixed_amount; ruleApplied = rule.name; }
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

        const roundedNew = Math.round(newPrice * 100) / 100;
        const currentPrice = Math.round((product.price || 0) * 100) / 100;

        if (roundedNew !== currentPrice && ruleApplied) {
          // P&L check before applying
          const pnl = calculatePnL(roundedNew, costPrice);
          if (pnl.netMarginPercent < 5) continue; // Skip if net margin too low

          await supabase.from('products').update({ price: roundedNew, updated_at: new Date().toISOString() }).eq('id', product.id);
          await supabase.from('price_change_history').insert({
            user_id: userId, product_id: product.id,
            old_price: currentPrice, new_price: roundedNew,
            change_type: 'automatic', source: 'pricing_rules_engine',
            reason: `Rule: ${ruleApplied} | Net margin: ${pnl.netMarginPercent}%`,
          });
          totalUpdated++;
        }
      }

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
    description: `Batch pricing: ${totalUpdated}/${totalEvaluated} updated`,
    source: 'automation', severity: totalErrors > 0 ? 'warn' : 'info',
    details: { totalUpdated, totalEvaluated, totalErrors, durationMs, usersProcessed: rulesByUser.size },
  });

  return jsonResponse({
    success: true, products_evaluated: totalEvaluated, products_updated: totalUpdated,
    errors: totalErrors, users_processed: rulesByUser.size, duration_ms: durationMs,
  });
}

// ─── Auto-reprice from competitors (merged from cross-module-sync) ───
async function handleRepriceFromCompetitors(supabase: any) {
  const startTime = Date.now();

  // Get all users with active competitor tracking
  const { data: intel } = await supabase
    .from('competitive_intelligence')
    .select('user_id, product_id, competitor_price, competitor_name, updated_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (!intel?.length) {
    return jsonResponse({ success: true, message: 'No competitor data', adjusted: 0 });
  }

  // Group by user + product, get lowest competitor price
  const userProductMap = new Map<string, { lowestPrice: number; competitorCount: number; freshestDays: number }>();
  for (const row of intel) {
    if (!row.product_id || !row.user_id) continue;
    const key = `${row.user_id}:${row.product_id}`;
    const existing = userProductMap.get(key);
    const compPrice = Number(row.competitor_price);
    const daysSince = (Date.now() - new Date(row.updated_at).getTime()) / 86400000;

    if (!existing) {
      userProductMap.set(key, { lowestPrice: compPrice, competitorCount: 1, freshestDays: daysSince });
    } else {
      existing.lowestPrice = Math.min(existing.lowestPrice, compPrice);
      existing.competitorCount++;
      existing.freshestDays = Math.min(existing.freshestDays, daysSince);
    }
  }

  let adjusted = 0, skippedLowConfidence = 0;

  for (const [key, data] of userProductMap) {
    const [userId, productId] = key.split(':');

    // Confidence check
    const conf = calculateConfidence({
      hasCompetitorData: true,
      competitorCount: data.competitorCount,
      dateFreshnessDays: data.freshestDays,
      hasCostPrice: true,
      ruleCount: 1,
    });

    if (conf.level === 'low') { skippedLowConfidence++; continue; }

    const { data: product } = await supabase
      .from('products')
      .select('id, price, cost_price')
      .eq('id', productId)
      .single();

    if (!product) continue;

    // Strategy: match lowest competitor -1%, but never below cost + 10%
    const targetPrice = Math.round(data.lowestPrice * 0.99 * 100) / 100;
    const minPrice = product.cost_price ? product.cost_price * 1.1 : product.price * 0.7;
    const newPrice = Math.max(targetPrice, minPrice);

    // P&L safety check
    if (product.cost_price) {
      const pnl = calculatePnL(newPrice, product.cost_price);
      if (pnl.netMarginPercent < 5) continue;
    }

    if (Math.abs(newPrice - product.price) > 0.5) {
      const roundedPrice = Math.round(newPrice * 100) / 100;
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
    description: `Competitive reprice: ${adjusted} adjusted, ${skippedLowConfidence} skipped (low confidence)`,
    source: 'pricing_rules_engine', severity: 'info',
    details: { adjusted, skippedLowConfidence, analyzed: userProductMap.size, durationMs },
  });

  return jsonResponse({
    success: true, adjusted, skipped_low_confidence: skippedLowConfidence,
    competitors_analyzed: intel.length, duration_ms: durationMs,
  });
}

// ─── Stock alerts (merged from cross-module-sync) ────────────────────
async function handleSyncStockAlerts(supabase: any) {
  // Get all users with products
  const { data: lowStock } = await supabase
    .from('products')
    .select('id, title, stock_quantity, user_id')
    .lte('stock_quantity', 3)
    .gt('stock_quantity', 0)
    .limit(200);

  const { data: outOfStock } = await supabase
    .from('products')
    .select('id, title, user_id')
    .eq('stock_quantity', 0)
    .limit(200);

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
    success: true, low_stock: lowStock?.length || 0,
    out_of_stock: outOfStock?.length || 0, alerts_created: alerts.length,
  });
}

function applyRounding(price: number, strategy: string): number {
  switch (strategy) {
    case 'nearest_99': return Math.floor(price) + 0.99;
    case 'nearest_50': return Math.round(price * 2) / 2;
    case 'round_up': return Math.ceil(price);
    default: return Math.round(price * 100) / 100;
  }
}

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}