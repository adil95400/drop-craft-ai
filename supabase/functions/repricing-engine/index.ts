import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    const { action, rule_id, product_ids, apply_to_all } = await req.json();

    console.log(`[REPRICING] Action: ${action}, User: ${user.id}`);

    // Action: apply_rule - Appliquer une règle de pricing
    if (action === 'apply_rule' && rule_id) {
      const { data: rule } = await supabaseClient
        .from('pricing_rules')
        .select('*')
        .eq('id', rule_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!rule) throw new Error('Pricing rule not found or inactive');

      // Créer un job dans la queue
      const { data: job } = await supabaseClient
        .from('repricing_queue')
        .insert({
          user_id: user.id,
          job_name: `Apply rule: ${rule.rule_name}`,
          pricing_rule_id: rule_id,
          product_ids,
          apply_to_all,
          status: 'processing'
        })
        .select()
        .single();

      // Récupérer les produits à reprendre
      const products = await getProductsForRule(supabaseClient, user.id, rule, product_ids, apply_to_all);

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const product of products) {
        try {
          const newPrice = await calculateNewPrice(supabaseClient, product, rule);
          
          if (newPrice !== null && newPrice !== product.price) {
            const result = await updateProductPrice(supabaseClient, user.id, product, newPrice, rule);
            results.push(result);
            successCount++;
          }
        } catch (error) {
          console.error(`[REPRICING] Error for product ${product.id}:`, error);
          failCount++;
        }
      }

      // Mettre à jour le job
      await supabaseClient
        .from('repricing_queue')
        .update({
          status: 'completed',
          total_products: products.length,
          processed_products: products.length,
          successful_updates: successCount,
          failed_updates: failCount,
          results: { summary: results },
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      // Mettre à jour les stats de la règle
      await supabaseClient
        .from('pricing_rules')
        .update({
          last_applied_at: new Date().toISOString(),
          total_applications: (rule.total_applications || 0) + 1,
          products_affected: successCount
        })
        .eq('id', rule_id);

      return new Response(JSON.stringify({
        success: true,
        job_id: job.id,
        products_processed: products.length,
        products_updated: successCount,
        products_failed: failCount,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: calculate_preview - Prévisualiser les changements sans appliquer
    if (action === 'calculate_preview' && rule_id) {
      const { data: rule } = await supabaseClient
        .from('pricing_rules')
        .select('*')
        .eq('id', rule_id)
        .eq('user_id', user.id)
        .single();

      if (!rule) throw new Error('Pricing rule not found');

      const products = await getProductsForRule(supabaseClient, user.id, rule, product_ids, apply_to_all);
      const preview = [];

      for (const product of products.slice(0, 50)) { // Limiter à 50 pour la preview
        const newPrice = await calculateNewPrice(supabaseClient, product, rule);
        
        if (newPrice !== null) {
          const currentMargin = product.cost_price 
            ? ((product.price - product.cost_price) / product.price * 100)
            : 0;
          const newMargin = product.cost_price
            ? ((newPrice - product.cost_price) / newPrice * 100)
            : 0;

          preview.push({
            product_id: product.id,
            product_name: product.name,
            current_price: product.price,
            new_price: newPrice,
            price_change: newPrice - product.price,
            price_change_percent: ((newPrice - product.price) / product.price * 100).toFixed(2),
            current_margin: currentMargin.toFixed(2),
            new_margin: newMargin.toFixed(2)
          });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        total_products: products.length,
        preview_count: preview.length,
        preview
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: apply_all_rules - Appliquer toutes les règles actives
    if (action === 'apply_all_rules') {
      const { data: rules } = await supabaseClient
        .from('pricing_rules')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      const allResults = [];

      for (const rule of rules || []) {
        const products = await getProductsForRule(supabaseClient, user.id, rule, null, false);
        
        for (const product of products) {
          try {
            const newPrice = await calculateNewPrice(supabaseClient, product, rule);
            if (newPrice !== null && newPrice !== product.price) {
              const result = await updateProductPrice(supabaseClient, user.id, product, newPrice, rule);
              allResults.push(result);
            }
          } catch (error) {
            console.error(`[REPRICING] Error:`, error);
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        rules_applied: rules?.length || 0,
        products_updated: allResults.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[REPRICING] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getProductsForRule(supabaseClient: any, userId: string, rule: any, productIds: string[] | null, applyToAll: boolean) {
  let query = supabaseClient
    .from('supplier_products')
    .select('*')
    .eq('user_id', userId);

  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds);
  } else if (rule.applies_to === 'category' && rule.category_filter) {
    query = query.eq('category', rule.category_filter);
  } else if (rule.applies_to === 'supplier' && rule.supplier_id) {
    query = query.eq('supplier_id', rule.supplier_id);
  } else if (rule.applies_to === 'products' && rule.product_ids && rule.product_ids.length > 0) {
    query = query.in('id', rule.product_ids);
  }

  const { data: products, error } = await query;
  if (error) throw error;

  return products || [];
}

async function calculateNewPrice(supabaseClient: any, product: any, rule: any): Promise<number | null> {
  const costPrice = product.cost_price || product.price * 0.5; // Fallback si pas de coût

  let newPrice: number;

  switch (rule.strategy) {
    case 'fixed_margin':
      newPrice = costPrice * (1 + (rule.fixed_margin_percent / 100));
      break;

    case 'target_margin':
      newPrice = costPrice / (1 - (rule.target_margin_percent / 100));
      if (rule.min_price && newPrice < rule.min_price) newPrice = rule.min_price;
      if (rule.max_price && newPrice > rule.max_price) newPrice = rule.max_price;
      break;

    case 'competitive':
      // Simuler récupération prix concurrent
      const competitorPrice = product.price * (1 + (Math.random() * 0.2 - 0.1)); // ±10%
      
      if (rule.competitor_price_offset) {
        newPrice = competitorPrice + rule.competitor_price_offset;
      } else if (rule.competitor_price_offset_percent) {
        newPrice = competitorPrice * (1 + (rule.competitor_price_offset_percent / 100));
      } else {
        newPrice = competitorPrice * 0.95; // -5% par défaut
      }
      break;

    case 'dynamic':
      // Règles dynamiques basées sur stock, ventes, etc.
      const stockLevel = product.stock_quantity || 0;
      const basePrice = costPrice * 1.3; // Marge 30% de base
      
      if (stockLevel > 100) {
        newPrice = basePrice * 0.9; // -10% si surstock
      } else if (stockLevel < 10) {
        newPrice = basePrice * 1.1; // +10% si stock faible
      } else {
        newPrice = basePrice;
      }
      break;

    default:
      return null;
  }

  // Appliquer les contraintes
  const minMargin = rule.min_margin_percent || 15;
  const minPriceFromMargin = costPrice * (1 + (minMargin / 100));
  newPrice = Math.max(newPrice, minPriceFromMargin);

  // Arrondir si configuré
  if (rule.round_to) {
    const roundTo = parseFloat(rule.round_to);
    newPrice = Math.floor(newPrice) + roundTo;
  }

  return parseFloat(newPrice.toFixed(2));
}

async function updateProductPrice(supabaseClient: any, userId: string, product: any, newPrice: number, rule: any) {
  const previousPrice = product.price;
  const previousMargin = product.cost_price 
    ? ((previousPrice - product.cost_price) / previousPrice * 100)
    : 0;
  const newMargin = product.cost_price
    ? ((newPrice - product.cost_price) / newPrice * 100)
    : 0;

  // Mettre à jour le prix du produit
  await supabaseClient
    .from('supplier_products')
    .update({ price: newPrice })
    .eq('id', product.id);

  // Enregistrer dans l'historique
  await supabaseClient
    .from('price_history')
    .insert({
      user_id: userId,
      product_id: product.id,
      product_source: 'supplier_products',
      previous_price: previousPrice,
      new_price: newPrice,
      price_change_percent: ((newPrice - previousPrice) / previousPrice * 100).toFixed(2),
      change_reason: 'rule_applied',
      pricing_rule_id: rule.id,
      previous_cost: product.cost_price,
      new_cost: product.cost_price,
      previous_margin_percent: previousMargin.toFixed(2),
      new_margin_percent: newMargin.toFixed(2)
    });

  console.log(`[REPRICING] Updated ${product.name}: ${previousPrice}€ → ${newPrice}€`);

  return {
    product_id: product.id,
    product_name: product.name,
    previous_price: previousPrice,
    new_price: newPrice,
    price_change: (newPrice - previousPrice).toFixed(2),
    new_margin: newMargin.toFixed(2)
  };
}
