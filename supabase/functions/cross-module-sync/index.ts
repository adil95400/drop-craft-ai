import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * cross-module-sync — Applies pricing rules to products and triggers marketing notifications.
 * Actions:
 *   - apply_pricing_rules: Apply user's pricing_rules to products missing price markup
 *   - sync_stock_alerts: Check low stock and create active_alerts
 *   - auto_reprice_from_competitors: Adjust prices based on competitive_intelligence
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validate user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    const { action } = await req.json();

    switch (action) {
      case 'apply_pricing_rules': {
        // Get user's active pricing rules
        const { data: rules } = await supabase
          .from('pricing_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!rules?.length) {
          return new Response(JSON.stringify({ 
            success: true, message: 'No active rules', applied: 0 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Get products without proper markup (cost_price exists but price may need update)
        const { data: products } = await supabase
          .from('products')
          .select('id, price, cost_price, category')
          .eq('user_id', user.id)
          .not('cost_price', 'is', null)
          .gt('cost_price', 0);

        let applied = 0;
        const updates: { id: string; price: number }[] = [];

        for (const product of (products || [])) {
          for (const rule of rules) {
            const ruleConfig = (rule as any).rule_config || {};
            const ruleType = (rule as any).rule_type || ruleConfig.type;

            let newPrice = product.price;

            if (ruleType === 'markup_percentage' || ruleConfig.markup_percent) {
              const markup = ruleConfig.markup_percent || 30;
              newPrice = Math.round(product.cost_price * (1 + markup / 100) * 100) / 100;
            } else if (ruleType === 'fixed_margin' || ruleConfig.margin) {
              const margin = ruleConfig.margin || 10;
              newPrice = Math.round((product.cost_price + margin) * 100) / 100;
            } else if (ruleType === 'psychological_rounding' || ruleConfig.round_to_99) {
              // Apply .99 rounding
              newPrice = Math.floor(product.price) + 0.99;
            }

            // Only update if price actually changed
            if (Math.abs(newPrice - product.price) > 0.01) {
              updates.push({ id: product.id, price: newPrice });
              applied++;
              break; // Apply first matching rule
            }
          }
        }

        // Batch update prices
        for (const upd of updates) {
          await supabase
            .from('products')
            .update({ price: upd.price })
            .eq('id', upd.id);
        }

        return new Response(JSON.stringify({ 
          success: true, applied, total: products?.length || 0 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_stock_alerts': {
        // Find products with critically low stock
        const { data: lowStock } = await supabase
          .from('products')
          .select('id, title, stock_quantity')
          .eq('user_id', user.id)
          .lte('stock_quantity', 3)
          .gt('stock_quantity', 0);

        const { data: outOfStock } = await supabase
          .from('products')
          .select('id, title')
          .eq('user_id', user.id)
          .eq('stock_quantity', 0);

        // Create alerts for low stock
        const alerts = [];
        for (const p of (lowStock || []).slice(0, 10)) {
          alerts.push({
            user_id: user.id,
            alert_type: 'low_stock',
            severity: 'warning',
            title: `Stock bas: ${p.title}`,
            message: `Il ne reste que ${p.stock_quantity} unités de "${p.title}"`,
            metadata: { product_id: p.id, stock: p.stock_quantity },
          });
        }

        if ((outOfStock?.length || 0) > 0) {
          alerts.push({
            user_id: user.id,
            alert_type: 'out_of_stock',
            severity: 'critical',
            title: `${outOfStock!.length} produit(s) en rupture`,
            message: `${outOfStock!.length} produit(s) sont en rupture de stock et doivent être réapprovisionnés`,
            metadata: { count: outOfStock!.length, product_ids: outOfStock!.slice(0, 5).map(p => p.id) },
          });
        }

        if (alerts.length > 0) {
          await supabase.from('active_alerts').insert(alerts);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          low_stock: lowStock?.length || 0,
          out_of_stock: outOfStock?.length || 0,
          alerts_created: alerts.length,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'auto_reprice_from_competitors': {
        // Get competitive intelligence data
        const { data: intel } = await supabase
          .from('competitive_intelligence')
          .select('product_id, competitor_price, competitor_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!intel?.length) {
          return new Response(JSON.stringify({ 
            success: true, message: 'No competitor data', adjusted: 0 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Group by product, get lowest competitor price
        const productMap = new Map<string, number>();
        for (const row of intel) {
          if (!row.product_id) continue;
          const existing = productMap.get(row.product_id);
          const compPrice = Number(row.competitor_price);
          if (!existing || compPrice < existing) {
            productMap.set(row.product_id, compPrice);
          }
        }

        let adjusted = 0;
        for (const [productId, lowestCompPrice] of productMap) {
          const { data: product } = await supabase
            .from('products')
            .select('id, price, cost_price')
            .eq('id', productId)
            .single();

          if (!product) continue;

          // Strategy: match lowest competitor -1%, but never below cost + 10%
          const targetPrice = Math.round(lowestCompPrice * 0.99 * 100) / 100;
          const minPrice = product.cost_price ? product.cost_price * 1.1 : product.price * 0.7;
          const newPrice = Math.max(targetPrice, minPrice);

          if (Math.abs(newPrice - product.price) > 0.5) {
            await supabase
              .from('products')
              .update({ price: Math.round(newPrice * 100) / 100 })
              .eq('id', productId);
            adjusted++;
          }
        }

        return new Response(JSON.stringify({ 
          success: true, adjusted, competitors_analyzed: intel.length 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('cross-module-sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
