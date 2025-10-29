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
    const { action, monitoringId } = await req.json();

    if (action === 'check_prices') {
      // Récupérer tous les moniteurs actifs ou un spécifique
      const query = supabase
        .from('price_monitoring')
        .select('*')
        .eq('is_active', true);

      if (monitoringId) {
        query.eq('id', monitoringId);
      } else {
        // Vérifier uniquement ceux qui doivent être vérifiés maintenant
        query.or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`);
      }

      const { data: monitors, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;

      console.log(`Checking prices for ${monitors?.length || 0} products`);

      const results = [];
      for (const monitor of monitors || []) {
        try {
          // Simuler le scraping du prix (en production, utiliser un vrai scraper)
          const newPrice = monitor.current_price * (0.95 + Math.random() * 0.1);
          const priceChange = newPrice - monitor.current_price;
          const changePercentage = (priceChange / monitor.current_price) * 100;

          // Mettre à jour le monitoring
          await supabase
            .from('price_monitoring')
            .update({
              previous_price: monitor.current_price,
              current_price: newPrice,
              price_change_percentage: changePercentage,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', monitor.id);

          // Enregistrer l'historique si changement significatif
          if (Math.abs(changePercentage) >= monitor.alert_threshold_percentage) {
            await supabase
              .from('price_history')
              .insert({
                monitoring_id: monitor.id,
                product_id: monitor.product_id,
                old_price: monitor.current_price,
                new_price: newPrice,
                price_change: priceChange,
                change_percentage: changePercentage
              });

            // Créer une alerte si nécessaire
            if (
              (changePercentage > 0 && monitor.alert_on_increase) ||
              (changePercentage < 0 && monitor.alert_on_decrease)
            ) {
              await supabase
                .from('activity_logs')
                .insert({
                  user_id: monitor.user_id,
                  action: 'price_alert',
                  entity_type: 'price_monitoring',
                  entity_id: monitor.id,
                  description: `Prix ${changePercentage > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(changePercentage).toFixed(2)}%`,
                  metadata: {
                    old_price: monitor.current_price,
                    new_price: newPrice,
                    change: priceChange,
                    percentage: changePercentage
                  }
                });
            }
          }

          results.push({
            id: monitor.id,
            success: true,
            old_price: monitor.current_price,
            new_price: newPrice,
            change_percentage: changePercentage
          });
        } catch (error) {
          console.error(`Error checking price for monitor ${monitor.id}:`, error);
          results.push({
            id: monitor.id,
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

    if (action === 'create_monitor') {
      const { userId, productId, supplierUrl, checkFrequency, alertThreshold } = await req.json();

      const { data, error } = await supabase
        .from('price_monitoring')
        .insert({
          user_id: userId,
          product_id: productId,
          supplier_url: supplierUrl,
          current_price: 0,
          check_frequency_minutes: checkFrequency || 60,
          alert_threshold_percentage: alertThreshold || 5.0
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, monitor: data }),
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
    console.error('Price monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
