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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get all stock levels that need reordering
    const { data: stockLevels, error: stockError } = await supabaseClient
      .from('stock_levels')
      .select(`
        *,
        product:products(*),
        warehouse:warehouses(*)
      `)
      .lte('available_quantity', 'reorder_point');

    if (stockError) throw stockError;

    const reorderResults = [];

    for (const level of stockLevels || []) {
      // Calculate optimal reorder quantity
      const reorderQuantity = level.optimal_reorder_quantity || 
        (level.max_stock_level - level.available_quantity);

      // Check if we already have a recent prediction
      const { data: prediction } = await supabaseClient
        .from('stock_predictions')
        .select('*')
        .eq('product_id', level.product_id)
        .eq('warehouse_id', level.warehouse_id)
        .gte('valid_until', new Date().toISOString())
        .single();

      // Create reorder recommendation
      const recommendation = {
        product_id: level.product_id,
        warehouse_id: level.warehouse_id,
        current_stock: level.available_quantity,
        reorder_point: level.reorder_point,
        recommended_quantity: reorderQuantity,
        estimated_cost: reorderQuantity * (level.product?.price || 0) * 0.6, // Assuming 60% cost
        urgency: level.available_quantity === 0 ? 'critical' : 
                 level.available_quantity < level.reorder_point * 0.5 ? 'high' : 'medium',
        ai_prediction: prediction ? {
          predicted_stockout_date: prediction.predicted_reorder_date,
          confidence: prediction.confidence_score
        } : null
      };

      reorderResults.push(recommendation);

      // Create alert if critical
      if (recommendation.urgency === 'critical') {
        await supabaseClient
          .from('stock_alerts')
          .insert({
            user_id: (await supabaseClient.auth.getUser()).data.user?.id,
            product_id: level.product_id,
            warehouse_id: level.warehouse_id,
            alert_type: 'out_of_stock',
            severity: 'critical',
            message: `Stock épuisé pour ${level.product?.name} à ${level.warehouse?.name}`,
            current_quantity: 0,
            threshold_quantity: level.reorder_point,
            recommended_action: `Commander ${reorderQuantity} unités immédiatement`
          });
      }
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: (await supabaseClient.auth.getUser()).data.user?.id,
        action: 'auto_reorder_check',
        entity_type: 'stock',
        description: `Vérification automatique: ${reorderResults.length} produits nécessitent un réapprovisionnement`,
        metadata: { recommendations: reorderResults }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        reorder_recommendations: reorderResults,
        count: reorderResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto reorder error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
