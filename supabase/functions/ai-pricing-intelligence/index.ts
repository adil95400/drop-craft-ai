import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AI_MODEL, AI_GATEWAY_URL } from '../_shared/ai-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PricingRequest {
  action: 'competitor_monitor' | 'margin_calculate' | 'price_history' | 'auto_pricing_rules';
  product_ids?: string[];
  competitor_urls?: string[];
  margin_params?: {
    cost_price: number;
    selling_price: number;
    shipping_cost?: number;
    platform_fees_percent?: number;
    ad_spend_per_unit?: number;
  };
  rule_config?: {
    rule_type: 'psychological_rounding' | 'margin_floor' | 'competitor_match' | 'demand_based';
    params: Record<string, unknown>;
  };
  period_days?: number;
}

async function requireAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing authorization header');
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { user, supabase };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  
  if (!response.ok) throw new Error(`AI error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, supabase } = await requireAuth(req);
    const body: PricingRequest = await req.json();

    let result: Record<string, unknown>;

    switch (body.action) {
      case 'competitor_monitor': {
        // Fetch user's products for comparison
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price, cost_price, sku, category')
          .eq('user_id', user.id)
          .in('id', body.product_ids || [])
          .limit(50);

        const aiResult = await callAI(
          `You are a pricing intelligence analyst. Analyze competitor pricing data and provide actionable insights.
           Return JSON: { "products": [{ "product_id", "your_price", "estimated_market_avg", "price_position" ("below"|"at"|"above"), "recommended_price", "confidence", "competitors_analyzed": number, "insights": string[] }], "market_summary": string, "opportunities": string[] }`,
          `Analyze pricing for these products: ${JSON.stringify(products)}. Competitor URLs provided: ${JSON.stringify(body.competitor_urls || [])}.`
        );

        result = { action: 'competitor_monitor', ...aiResult };
        break;
      }

      case 'margin_calculate': {
        const p = body.margin_params!;
        const grossMargin = p.selling_price - p.cost_price - (p.shipping_cost || 0);
        const platformFees = p.selling_price * ((p.platform_fees_percent || 0) / 100);
        const netMargin = grossMargin - platformFees - (p.ad_spend_per_unit || 0);
        const netMarginPercent = (netMargin / p.selling_price) * 100;
        const breakEvenPrice = p.cost_price + (p.shipping_cost || 0) + platformFees + (p.ad_spend_per_unit || 0);
        const roi = netMargin > 0 ? ((netMargin / (p.cost_price + (p.shipping_cost || 0))) * 100) : 0;

        // AI-powered pricing suggestions
        const aiResult = await callAI(
          `You are a pricing strategist. Given margin data, suggest optimal price points.
           Return JSON: { "suggestions": [{ "strategy", "recommended_price", "expected_margin_percent", "rationale" }], "psychological_prices": number[], "volume_tiers": [{ "min_qty", "price", "margin_percent" }] }`,
          `Cost: ${p.cost_price}, Current sell: ${p.selling_price}, Shipping: ${p.shipping_cost || 0}, Platform fees: ${p.platform_fees_percent || 0}%, Ad cost/unit: ${p.ad_spend_per_unit || 0}. Net margin: ${netMarginPercent.toFixed(1)}%`
        );

        result = {
          action: 'margin_calculate',
          breakdown: {
            cost_price: p.cost_price,
            selling_price: p.selling_price,
            shipping_cost: p.shipping_cost || 0,
            platform_fees: platformFees,
            ad_spend_per_unit: p.ad_spend_per_unit || 0,
            gross_margin: grossMargin,
            net_margin: netMargin,
            net_margin_percent: Math.round(netMarginPercent * 100) / 100,
            break_even_price: Math.round(breakEvenPrice * 100) / 100,
            roi: Math.round(roi * 100) / 100,
          },
          ...aiResult,
        };
        break;
      }

      case 'price_history': {
        const days = body.period_days || 90;
        
        // Get price change logs from products
        const { data: products } = await supabase
          .from('products')
          .select('id, title, price, cost_price, updated_at, created_at')
          .eq('user_id', user.id)
          .in('id', body.product_ids || [])
          .limit(50);

        // Get analytics snapshots for price trends
        const { data: snapshots } = await supabase
          .from('analytics_snapshots')
          .select('metrics, snapshot_date')
          .eq('user_id', user.id)
          .eq('snapshot_type', 'pricing')
          .gte('snapshot_date', new Date(Date.now() - days * 86400000).toISOString().split('T')[0])
          .order('snapshot_date', { ascending: true });

        const aiResult = await callAI(
          `You are a pricing trend analyst. Analyze price history and predict future trends.
           Return JSON: { "trends": [{ "product_id", "direction" ("up"|"down"|"stable"), "avg_change_percent", "volatility" ("low"|"medium"|"high") }], "forecast_30d": { "direction", "confidence", "predicted_avg_change_percent" }, "seasonality_detected": boolean, "recommendations": string[] }`,
          `Products: ${JSON.stringify(products)}. Snapshots (${days}d): ${JSON.stringify(snapshots || [])}.`
        );

        result = {
          action: 'price_history',
          period_days: days,
          products: products || [],
          snapshots: snapshots || [],
          ...aiResult,
        };
        break;
      }

      case 'auto_pricing_rules': {
        const config = body.rule_config!;

        const aiResult = await callAI(
          `You are a pricing automation expert. Generate pricing rules based on configuration.
           Return JSON: { "rules": [{ "rule_name", "rule_type", "condition", "action", "priority": number, "example_before": number, "example_after": number }], "psychological_rounding_map": { "x.x1-x.x4": "x.x0", "x.x5-x.x9": "x.x9" }, "estimated_revenue_impact_percent": number, "warnings": string[] }`,
          `Rule type: ${config.rule_type}. Params: ${JSON.stringify(config.params)}. Generate comprehensive pricing rules.`
        );

        result = { action: 'auto_pricing_rules', config, ...aiResult };
        break;
      }

      default:
        throw new Error(`Unknown action: ${body.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
