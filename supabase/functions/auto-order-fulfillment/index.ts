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

    const { action, orderId } = await req.json();

    console.log(`📦 Auto-order fulfillment action: ${action}`);

    if (action === 'process_pending') {
      // Process all pending orders
      const { data: pendingOrders, error: ordersError } = await supabaseClient
        .from('auto_orders')
        .select('*, catalog_product:catalog_product_id(*), monitoring:monitoring_id(*)')
        .eq('order_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (ordersError) throw ordersError;

      console.log(`📋 Processing ${pendingOrders?.length || 0} pending orders`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        orders: [] as any[]
      };

      for (const order of pendingOrders || []) {
        try {
          // Update order to processing
          await supabaseClient
            .from('auto_orders')
            .update({ 
              order_status: 'processing',
              processing_started_at: new Date().toISOString()
            })
            .eq('id', order.id);

          // Simulate placing order with supplier
          console.log(`🛒 Placing order with supplier for ${order.catalog_product?.name}`);
          
          // In real implementation, call supplier API here
          // For now, simulate with delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const success = Math.random() > 0.1; // 90% success rate

          if (success) {
            // Generate tracking number
            const trackingNumber = `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;
            const supplierOrderId = `SUP${Date.now()}`;
            const expectedDelivery = new Date();
            expectedDelivery.setDate(expectedDelivery.getDate() + 7);

            // Update order as completed
            await supabaseClient
              .from('auto_orders')
              .update({
                order_status: 'completed',
                supplier_order_id: supplierOrderId,
                tracking_number: trackingNumber,
                order_date: new Date().toISOString(),
                expected_delivery_date: expectedDelivery.toISOString(),
                completed_at: new Date().toISOString()
              })
              .eq('id', order.id);

            // Create activity log
            await supabaseClient
              .from('activity_logs')
              .insert({
                user_id: order.user_id,
                action: 'auto_order_completed',
                entity_type: 'order',
                entity_id: order.id,
                description: `Commande automatique passée: ${order.catalog_product?.name} (${order.quantity} unités)`,
                metadata: {
                  tracking_number: trackingNumber,
                  supplier_order_id: supplierOrderId
                }
              });

            results.successful++;
            results.orders.push({
              id: order.id,
              status: 'success',
              tracking: trackingNumber
            });

            console.log(`✅ Order ${order.id} completed successfully`);

          } else {
            // Simulate failure
            const errorMessage = 'Supplier API temporarily unavailable';
            
            await supabaseClient
              .from('auto_orders')
              .update({
                order_status: 'failed',
                error_message: errorMessage,
                retry_count: (order.retry_count || 0) + 1,
                next_retry_at: new Date(Date.now() + 3600000).toISOString() // Retry in 1 hour
              })
              .eq('id', order.id);

            results.failed++;
            results.orders.push({
              id: order.id,
              status: 'failed',
              error: errorMessage
            });

            console.log(`❌ Order ${order.id} failed: ${errorMessage}`);
          }

          results.processed++;

        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error);
          
          await supabaseClient
            .from('auto_orders')
            .update({
              order_status: 'failed',
              error_message: error.message,
              retry_count: (order.retry_count || 0) + 1
            })
            .eq('id', order.id);

          results.failed++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_tracking') {
      // Update tracking information for orders
      const { data: ordersWithTracking, error: trackingError } = await supabaseClient
        .from('auto_orders')
        .select('*')
        .not('tracking_number', 'is', null)
        .in('order_status', ['completed', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (trackingError) throw trackingError;

      const updates = [];
      for (const order of ordersWithTracking || []) {
        // Simulate tracking update
        const statuses = ['processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentIndex = statuses.indexOf(order.order_status);
        const newIndex = Math.min(currentIndex + 1, statuses.length - 1);
        const newStatus = statuses[newIndex];

        if (newStatus !== order.order_status) {
          await supabaseClient
            .from('auto_orders')
            .update({ 
              order_status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);

          updates.push({
            order_id: order.id,
            old_status: order.order_status,
            new_status: newStatus
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          updates_count: updates.length,
          updates
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'retry_failed') {
      // Retry failed orders
      const { data: failedOrders } = await supabaseClient
        .from('auto_orders')
        .select('*')
        .eq('order_status', 'failed')
        .lt('retry_count', 3)
        .lt('next_retry_at', new Date().toISOString());

      if (failedOrders) {
        for (const order of failedOrders) {
          await supabaseClient
            .from('auto_orders')
            .update({ order_status: 'pending' })
            .eq('id', order.id);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          retried_count: failedOrders?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Fulfillment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
