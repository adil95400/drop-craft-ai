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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting automated price & stock monitoring...');

    // Get all active monitors that need checking
    const now = new Date();
    const { data: monitors, error: monitorsError } = await supabaseClient
      .from('price_stock_monitoring')
      .select('*, catalog_product:catalog_product_id(*)')
      .eq('is_active', true);

    if (monitorsError) throw monitorsError;

    console.log(`📊 Found ${monitors?.length || 0} active monitors`);

    const results = {
      checked: 0,
      price_changes: 0,
      stock_alerts: 0,
      auto_orders: 0,
      errors: [] as string[]
    };

    for (const monitor of monitors || []) {
      try {
        // Check if it's time to check this monitor
        const lastChecked = monitor.last_checked_at ? new Date(monitor.last_checked_at) : new Date(0);
        const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / 1000 / 60;

        if (minutesSinceLastCheck < (monitor.check_frequency_minutes || 60)) {
          continue; // Not time to check yet
        }

        console.log(`🔍 Checking monitor ${monitor.id} for product ${monitor.catalog_product?.name}`);

        // Simulate price check (in real implementation, this would scrape/call supplier API)
        const currentPrice = monitor.current_price || 0;
        const newPrice = currentPrice + (Math.random() - 0.5) * 10; // Simulated price fluctuation
        const priceChangePercent = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0;

        // Simulate stock check
        const currentStock = monitor.current_stock || 50;
        const newStock = Math.max(0, currentStock + Math.floor((Math.random() - 0.3) * 10));

        // Update monitor
        await supabaseClient
          .from('price_stock_monitoring')
          .update({
            current_price: newPrice,
            previous_price: currentPrice,
            price_change_percentage: priceChangePercent,
            current_stock: newStock,
            last_checked_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', monitor.id);

        results.checked++;

        // Create price alert if threshold exceeded
        if (Math.abs(priceChangePercent) > (monitor.price_change_threshold || 5)) {
          const alertType = priceChangePercent > 0 ? 'price_increase' : 'price_decrease';
          const severity = Math.abs(priceChangePercent) > 15 ? 'critical' : 
                          Math.abs(priceChangePercent) > 10 ? 'high' : 'medium';

          await supabaseClient
            .from('price_stock_alerts')
            .insert({
              user_id: monitor.user_id,
              monitoring_id: monitor.id,
              alert_type: alertType,
              severity: severity,
              message: `Prix ${priceChangePercent > 0 ? 'augmenté' : 'baissé'} de ${Math.abs(priceChangePercent).toFixed(1)}%`,
              previous_value: currentPrice.toString(),
              new_value: newPrice.toString(),
              is_read: false,
              is_resolved: false
            });

          results.price_changes++;

          // Log activity
          await supabaseClient
            .from('activity_logs')
            .insert({
              user_id: monitor.user_id,
              action: 'price_alert',
              entity_type: 'monitoring',
              entity_id: monitor.id,
              description: `Alerte prix: ${monitor.catalog_product?.name} - ${priceChangePercent.toFixed(1)}%`
            });
        }

        // Create stock alert if below threshold
        if (newStock <= (monitor.stock_alert_threshold || 10)) {
          const severity = newStock === 0 ? 'critical' : newStock < 5 ? 'high' : 'medium';

          await supabaseClient
            .from('price_stock_alerts')
            .insert({
              user_id: monitor.user_id,
              monitoring_id: monitor.id,
              alert_type: newStock === 0 ? 'stock_out' : 'stock_low',
              severity: severity,
              message: `Stock ${newStock === 0 ? 'épuisé' : 'faible'}: ${newStock} unités restantes`,
              previous_value: currentStock.toString(),
              new_value: newStock.toString(),
              is_read: false,
              is_resolved: false
            });

          results.stock_alerts++;

          // Trigger auto-ordering if enabled
          if (monitor.auto_adjust_price && newStock <= (monitor.stock_alert_threshold || 10)) {
            const orderQuantity = 50; // Calculate optimal quantity
            const maxPrice = monitor.price_adjustment_rules?.max_price || 0;

            if (maxPrice === 0 || newPrice <= maxPrice) {
              // Create auto order
              const { error: orderError } = await supabaseClient
                .from('auto_orders')
                .insert({
                  user_id: monitor.user_id,
                  monitoring_id: monitor.id,
                  catalog_product_id: monitor.catalog_product_id,
                  quantity: orderQuantity,
                  unit_price: newPrice,
                  total_price: newPrice * orderQuantity,
                  order_status: 'pending',
                  auto_order_reason: 'low_stock'
                });

              if (!orderError) {
                results.auto_orders++;
                console.log(`🛒 Auto-order created for ${monitor.catalog_product?.name}`);
              }
            }
          }
        }

      } catch (error) {
        console.error(`Error checking monitor ${monitor.id}:`, error);
        results.errors.push(`Monitor ${monitor.id}: ${error.message}`);
      }
    }

    console.log('✅ Monitoring cycle completed:', results);

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cron error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
