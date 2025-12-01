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

    const payload = await req.json();
    console.log('[BIGBUY-WEBHOOK] Received:', payload);

    // BigBuy webhook format
    const { event, data } = payload;

    if (event === 'stock_update') {
      const { productId, stock } = data;

      // Find all users with this BigBuy product
      const { data: products, error: prodError } = await supabaseClient
        .from('supplier_products')
        .select('*, user_id')
        .eq('supplier_id', 'bigbuy')
        .eq('external_id', productId.toString());

      if (prodError) throw prodError;

      // Update stock for all users
      for (const product of products || []) {
        const previousQuantity = product.stock_quantity || 0;

        await supabaseClient
          .from('supplier_products')
          .update({ 
            stock_quantity: stock,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', product.id);

        // Record in history
        await supabaseClient
          .from('stock_history')
          .insert({
            user_id: product.user_id,
            product_id: product.id,
            product_source: 'supplier_products',
            previous_quantity: previousQuantity,
            new_quantity: stock,
            change_amount: stock - previousQuantity,
            change_reason: 'webhook',
            supplier_id: 'bigbuy'
          });

        // Create alert if needed
        if (stock === 0) {
          await supabaseClient
            .from('stock_alerts')
            .insert({
              user_id: product.user_id,
              product_id: product.id,
              product_source: 'supplier_products',
              product_name: product.name,
              alert_type: 'out_of_stock',
              severity: 'critical',
              message: `Stock épuisé pour ${product.name}`,
              current_stock: stock,
              supplier_id: 'bigbuy'
            });
        } else if (stock <= 10) {
          await supabaseClient
            .from('stock_alerts')
            .insert({
              user_id: product.user_id,
              product_id: product.id,
              product_source: 'supplier_products',
              product_name: product.name,
              alert_type: 'low_stock',
              severity: 'medium',
              message: `Stock faible (${stock} unités) pour ${product.name}`,
              current_stock: stock,
              threshold: 10,
              supplier_id: 'bigbuy'
            });
        }

        console.log(`[BIGBUY-WEBHOOK] Updated product ${product.name}: ${previousQuantity} → ${stock}`);
      }

      return new Response(JSON.stringify({
        success: true,
        updated: products?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Event ignored'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[BIGBUY-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
