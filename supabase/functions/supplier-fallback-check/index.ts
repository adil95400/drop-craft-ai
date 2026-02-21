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

    // Get active fallback rules
    const { data: rules, error: rErr } = await supabase
      .from('supplier_fallback_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (rErr) throw rErr;

    const results = [];

    for (const rule of rules || []) {
      if (!rule.product_id) continue;

      // Get product current state
      const { data: product } = await supabase
        .from('products')
        .select('id, name, price, cost_price, stock_quantity')
        .eq('id', rule.product_id)
        .single();

      if (!product) continue;

      let shouldSwitch = false;
      let reason = '';

      switch (rule.trigger_condition) {
        case 'out_of_stock':
          shouldSwitch = (product.stock_quantity ?? 0) === 0;
          reason = 'Product out of stock';
          break;
        case 'low_stock':
          shouldSwitch = (product.stock_quantity ?? 0) <= (rule.low_stock_threshold ?? 5);
          reason = `Stock below threshold (${product.stock_quantity}/${rule.low_stock_threshold})`;
          break;
        case 'price_increase':
          // Check if primary supplier price increased significantly
          if (rule.primary_supplier_id) {
            const { data: sp } = await supabase
              .from('supplier_products')
              .select('price')
              .eq('supplier_id', rule.primary_supplier_id)
              .eq('product_id', rule.product_id)
              .single();
            if (sp && product.cost_price) {
              const increase = ((sp.price - product.cost_price) / product.cost_price) * 100;
              shouldSwitch = increase >= (rule.price_increase_threshold ?? 10);
              reason = `Price increase ${increase.toFixed(1)}% exceeds threshold`;
            }
          }
          break;
      }

      if (shouldSwitch) {
        // Find best alternative
        const fallbacks = (rule.fallback_suppliers || []).sort((a: any, b: any) => a.priority - b.priority);
        let bestAlt = null;

        for (const fb of fallbacks) {
          const { data: sp } = await supabase
            .from('supplier_products')
            .select('supplier_id, price, stock_quantity')
            .eq('supplier_id', fb.supplier_id)
            .eq('product_id', rule.product_id)
            .eq('is_active', true)
            .single();

          if (sp && (sp.stock_quantity ?? 0) > 0 && (!fb.max_price || sp.price <= fb.max_price)) {
            bestAlt = sp;
            break;
          }
        }

        if (bestAlt && rule.auto_switch) {
          // Auto-switch: update product cost_price and fallback reference
          await supabase
            .from('products')
            .update({ cost_price: bestAlt.price, fallback_supplier_id: bestAlt.supplier_id })
            .eq('id', rule.product_id);

          // Log switch
          await supabase
            .from('price_change_history')
            .insert({
              user_id: user.id,
              product_id: rule.product_id,
              old_price: product.cost_price,
              new_price: bestAlt.price,
              change_percent: product.cost_price > 0 ? ((bestAlt.price - product.cost_price) / product.cost_price) * 100 : 0,
              change_type: 'fallback',
              source: 'supplier_fallback_check',
              metadata: { rule_id: rule.id, new_supplier_id: bestAlt.supplier_id },
            });

          // Create alert
          if (rule.notify_on_switch) {
            await supabase
              .from('stock_alerts')
              .insert({
                user_id: user.id,
                product_id: rule.product_id,
                alert_type: 'supplier_switched',
                severity: 'medium',
                title: `Fournisseur basculé pour ${product.name}`,
                message: reason,
                recommended_action: `Nouveau fournisseur actif (prix: ${bestAlt.price}€)`,
              });
          }

          // Update rule stats
          await supabase
            .from('supplier_fallback_rules')
            .update({ 
              last_switch_at: new Date().toISOString(), 
              switch_count: (rule.switch_count ?? 0) + 1 
            })
            .eq('id', rule.id);
        }

        results.push({
          product_id: rule.product_id,
          product_name: product.name,
          reason,
          switched: !!bestAlt && rule.auto_switch,
          alternative: bestAlt,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, evaluated: rules?.length ?? 0, switches: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
