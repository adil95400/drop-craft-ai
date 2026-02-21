import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { ruleId } = await req.json();
    if (!ruleId) throw new Error('Missing ruleId');

    // Get the rule
    const { data: rule, error: ruleErr } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('user_id', user.id)
      .single();

    if (ruleErr || !rule) throw new Error('Rule not found');

    // Get target products
    let productsQuery = supabase
      .from('products')
      .select('id, price, cost_price, category, tags')
      .eq('user_id', user.id);

    if (rule.apply_to === 'category' && rule.apply_filter?.category) {
      productsQuery = productsQuery.eq('category', rule.apply_filter.category);
    }

    const { data: products, error: pErr } = await productsQuery.limit(500);
    if (pErr) throw pErr;

    let applied = 0;
    let changes = 0;

    for (const product of products || []) {
      const costPrice = product.cost_price ?? 0;
      if (costPrice <= 0) continue;

      let newPrice = costPrice;

      switch (rule.rule_type) {
        case 'margin':
          newPrice = costPrice / (1 - (rule.target_margin ?? 30) / 100);
          break;
        case 'markup':
          newPrice = costPrice * (1 + (rule.calculation?.markup_percent ?? 30) / 100);
          break;
        case 'fixed':
          newPrice = costPrice + (rule.calculation?.fixed_amount ?? 0);
          break;
      }

      // Margin protection
      const minMarginPrice = costPrice / (1 - (rule.margin_protection ?? 15) / 100);
      if (newPrice < minMarginPrice) newPrice = minMarginPrice;

      // Min/max bounds
      if (rule.min_price && newPrice < rule.min_price) newPrice = rule.min_price;
      if (rule.max_price && newPrice > rule.max_price) newPrice = rule.max_price;

      // Rounding
      switch (rule.rounding_strategy) {
        case 'nearest_99': newPrice = Math.floor(newPrice) + 0.99; break;
        case 'nearest_50': newPrice = Math.round(newPrice * 2) / 2; break;
        case 'round_up': newPrice = Math.ceil(newPrice); break;
        default: newPrice = Math.round(newPrice * 100) / 100;
      }

      applied++;

      if (Math.abs(newPrice - (product.price ?? 0)) > 0.01) {
        // Update product price
        await supabase
          .from('products')
          .update({ price: newPrice })
          .eq('id', product.id);

        // Log price change
        await supabase
          .from('price_change_history')
          .insert({
            user_id: user.id,
            product_id: product.id,
            old_price: product.price,
            new_price: newPrice,
            change_percent: product.price > 0 ? ((newPrice - product.price) / product.price) * 100 : 0,
            change_type: 'repricing_rule',
            source: `rule:${rule.name}`,
          });

        changes++;
      }
    }

    // Update rule execution stats
    await supabase
      .from('pricing_rules')
      .update({
        last_executed_at: new Date().toISOString(),
        execution_count: (rule.execution_count ?? 0) + 1,
        products_affected: applied,
      })
      .eq('id', ruleId);

    return new Response(
      JSON.stringify({ success: true, applied, changes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
