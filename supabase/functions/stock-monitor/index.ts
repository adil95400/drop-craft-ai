import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, alertId } = await req.json();

    if (action === 'check_stock') {
      const query = supabase
        .from('stock_alerts')
        .select('*')
        .eq('is_active', true);

      if (alertId) {
        query.eq('id', alertId);
      } else {
        query.or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 30 * 60 * 1000).toISOString()}`);
      }

      const { data: alerts, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;

      console.log(`Checking stock for ${alerts?.length || 0} products`);

      const results = [];
      for (const alert of alerts || []) {
        try {
          // Simuler la vérification du stock (en production, scraper le site)
          const newStock = Math.floor(Math.random() * 100);
          let stockStatus = 'in_stock';
          
          if (newStock === 0) {
            stockStatus = 'out_of_stock';
          } else if (newStock <= alert.alert_threshold) {
            stockStatus = 'low_stock';
          }

          const stockChanged = newStock !== alert.current_stock;

          // Mettre à jour l'alerte
          await supabase
            .from('stock_alerts')
            .update({
              previous_stock: alert.current_stock,
              current_stock: newStock,
              stock_status: stockStatus,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', alert.id);

          // Créer une notification si changement critique
          if (stockChanged && (stockStatus === 'out_of_stock' || stockStatus === 'low_stock')) {
            await supabase
              .from('activity_logs')
              .insert({
                user_id: alert.user_id,
                action: 'stock_alert',
                entity_type: 'stock_alert',
                entity_id: alert.id,
                description: `Stock ${stockStatus === 'out_of_stock' ? 'épuisé' : 'faible'}: ${newStock} unités`,
                metadata: {
                  previous_stock: alert.current_stock,
                  current_stock: newStock,
                  status: stockStatus,
                  threshold: alert.alert_threshold
                }
              });

            // Déclencher auto-order si règle configurée
            const { data: rules } = await supabase
              .from('auto_order_rules')
              .select('*')
              .eq('product_id', alert.product_id)
              .eq('is_enabled', true)
              .single();

            if (rules && newStock <= rules.min_stock_trigger) {
              console.log(`Triggering auto-order for product ${alert.product_id}`);
              
              await supabase.functions.invoke('auto-order-processor', {
                body: {
                  action: 'create_order',
                  ruleId: rules.id,
                  reason: 'low_stock_trigger'
                }
              });
            }
          }

          results.push({
            id: alert.id,
            success: true,
            previous_stock: alert.current_stock,
            current_stock: newStock,
            status: stockStatus,
            changed: stockChanged
          });
        } catch (error) {
          console.error(`Error checking stock for alert ${alert.id}:`, error);
          results.push({
            id: alert.id,
            success: false,
            error: error.message
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          checked: results.length,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (action === 'create_alert') {
      const { userId, productId, supplierUrl, alertThreshold, checkFrequency } = await req.json();

      const { data, error } = await supabase
        .from('stock_alerts')
        .insert({
          user_id: userId,
          product_id: productId,
          supplier_url: supplierUrl,
          alert_threshold: alertThreshold || 10,
          check_frequency_minutes: checkFrequency || 30
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, alert: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  } catch (error) {
    console.error('Stock monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
