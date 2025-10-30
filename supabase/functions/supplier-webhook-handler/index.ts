import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
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

    const { supplier, event, data } = await req.json();

    console.log(`📨 Webhook received from ${supplier}: ${event}`);

    // Verify webhook signature (implement per supplier)
    const signature = req.headers.get('x-webhook-signature');
    // In production, verify signature here

    switch (event) {
      case 'price_update':
        // Handle price updates from supplier
        console.log(`💰 Price update for product ${data.product_id}: ${data.old_price} → ${data.new_price}`);
        
        // Find all monitors for this product
        const { data: monitors } = await supabaseClient
          .from('price_stock_monitoring')
          .select('*')
          .eq('catalog_product_id', data.product_id);

        for (const monitor of monitors || []) {
          // Update current price
          await supabaseClient
            .from('price_stock_monitoring')
            .update({
              current_price: data.new_price,
              previous_price: data.old_price,
              price_change_percentage: ((data.new_price - data.old_price) / data.old_price) * 100,
              last_checked_at: new Date().toISOString()
            })
            .eq('id', monitor.id);

          // Create alert if significant change
          const changePercent = ((data.new_price - data.old_price) / data.old_price) * 100;
          if (Math.abs(changePercent) > (monitor.price_change_threshold || 5)) {
            await supabaseClient
              .from('price_stock_alerts')
              .insert({
                user_id: monitor.user_id,
                monitoring_id: monitor.id,
                alert_type: changePercent > 0 ? 'price_increase' : 'price_decrease',
                severity: Math.abs(changePercent) > 15 ? 'critical' : 'medium',
                message: `Prix fournisseur ${changePercent > 0 ? 'augmenté' : 'baissé'} de ${Math.abs(changePercent).toFixed(1)}%`,
                previous_value: data.old_price.toString(),
                new_value: data.new_price.toString()
              });
          }
        }
        break;

      case 'stock_update':
        // Handle stock updates from supplier
        console.log(`📦 Stock update for product ${data.product_id}: ${data.quantity} units`);
        
        const { data: stockMonitors } = await supabaseClient
          .from('price_stock_monitoring')
          .select('*')
          .eq('catalog_product_id', data.product_id);

        for (const monitor of stockMonitors || []) {
          await supabaseClient
            .from('price_stock_monitoring')
            .update({
              current_stock: data.quantity,
              last_checked_at: new Date().toISOString()
            })
            .eq('id', monitor.id);

          // Create alert if low stock
          if (data.quantity <= (monitor.stock_alert_threshold || 10)) {
            await supabaseClient
              .from('price_stock_alerts')
              .insert({
                user_id: monitor.user_id,
                monitoring_id: monitor.id,
                alert_type: data.quantity === 0 ? 'stock_out' : 'stock_low',
                severity: data.quantity === 0 ? 'critical' : 'high',
                message: `Stock fournisseur: ${data.quantity} unités`,
                new_value: data.quantity.toString()
              });
          }
        }
        break;

      case 'order_status_update':
        // Handle order status updates
        console.log(`🔄 Order status update: ${data.order_id} → ${data.status}`);
        
        const { data: orders } = await supabaseClient
          .from('auto_orders')
          .select('*')
          .eq('supplier_order_id', data.order_id);

        for (const order of orders || []) {
          const updateData: any = {
            order_status: data.status,
            updated_at: new Date().toISOString()
          };

          if (data.tracking_number) {
            updateData.tracking_number = data.tracking_number;
          }

          if (data.expected_delivery) {
            updateData.expected_delivery_date = data.expected_delivery;
          }

          await supabaseClient
            .from('auto_orders')
            .update(updateData)
            .eq('id', order.id);

          // Log activity
          await supabaseClient
            .from('activity_logs')
            .insert({
              user_id: order.user_id,
              action: 'order_status_update',
              entity_type: 'order',
              entity_id: order.id,
              description: `Statut commande mis à jour: ${data.status}`,
              metadata: data
            });
        }
        break;

      case 'product_discontinued':
        // Handle discontinued products
        console.log(`⚠️ Product discontinued: ${data.product_id}`);
        
        const { data: discontinuedMonitors } = await supabaseClient
          .from('price_stock_monitoring')
          .select('*')
          .eq('catalog_product_id', data.product_id);

        for (const monitor of discontinuedMonitors || []) {
          await supabaseClient
            .from('price_stock_alerts')
            .insert({
              user_id: monitor.user_id,
              monitoring_id: monitor.id,
              alert_type: 'product_discontinued',
              severity: 'critical',
              message: `Produit arrêté par le fournisseur: ${data.reason || 'Raison non spécifiée'}`
            });

          // Disable monitoring
          await supabaseClient
            .from('price_stock_monitoring')
            .update({ is_active: false })
            .eq('id', monitor.id);
        }
        break;

      default:
        console.log(`⚠️ Unknown webhook event: ${event}`);
    }

    // Log webhook receipt
    await supabaseClient
      .from('webhook_delivery_logs')
      .insert({
        source: supplier,
        event_type: event,
        payload: data,
        status: 'processed',
        processed_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
