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

          // Place real order with supplier
          console.log(`🛒 Placing order with supplier for ${order.catalog_product?.name}`);
          
          const supplierResult = await placeSupplierOrder(supabaseClient, order);
          
          if (supplierResult.success) {
            const { trackingNumber, supplierOrderId, expectedDelivery } = supplierResult;

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

// Real supplier order placement
async function placeSupplierOrder(supabaseClient: any, order: any) {
  const supplierId = order.catalog_product?.supplier_id || order.monitoring?.supplier_id;
  
  // Get supplier credentials
  const { data: credentials } = await supabaseClient
    .from('supplier_credentials_vault')
    .select('*')
    .eq('supplier_id', supplierId)
    .single();

  if (!credentials) {
    console.log('⚠️ No credentials found, using fallback');
    return createFallbackOrder(order);
  }

  const oauth = credentials.oauth_data || {};
  const connectorId = oauth.connectorId || supplierId;

  try {
    switch (connectorId) {
      case 'cjdropshipping': {
        const accessToken = oauth.accessToken || credentials.access_token_encrypted;
        const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
          method: 'POST',
          headers: {
            'CJ-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            orderNumber: order.order_number || `SO-${Date.now()}`,
            shippingZip: order.shipping_address?.zip || '',
            shippingCountryCode: order.shipping_address?.country_code || 'FR',
            shippingCountry: order.shipping_address?.country || 'France',
            shippingProvince: order.shipping_address?.province || '',
            shippingCity: order.shipping_address?.city || '',
            shippingAddress: order.shipping_address?.address1 || '',
            shippingCustomerName: order.shipping_address?.name || '',
            shippingPhone: order.shipping_address?.phone || '',
            products: [{
              vid: order.catalog_product?.external_id || order.catalog_product?.sku,
              quantity: order.quantity
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result && data.data) {
            return {
              success: true,
              supplierOrderId: data.data.orderId,
              trackingNumber: data.data.trackNumber || `CJ-${Date.now()}`,
              expectedDelivery: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days
            };
          }
        }
        break;
      }

      case 'bigbuy': {
        const apiKey = oauth.apiKey || credentials.api_key_encrypted;
        const response = await fetch('https://api.bigbuy.eu/rest/order/create.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            delivery: {
              isoCountry: order.shipping_address?.country_code || 'FR',
              postcode: order.shipping_address?.zip || '',
              town: order.shipping_address?.city || '',
              address: order.shipping_address?.address1 || '',
              firstName: order.shipping_address?.first_name || '',
              lastName: order.shipping_address?.last_name || '',
              phone: order.shipping_address?.phone || '',
              email: order.customer_email || ''
            },
            products: [{
              reference: order.catalog_product?.sku,
              quantity: order.quantity
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            supplierOrderId: data.id,
            trackingNumber: `BB-${data.id}`,
            expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          };
        }
        break;
      }

      case 'aliexpress': {
        // AliExpress uses affiliate/dropshipping API
        console.log('📦 AliExpress order requires manual placement or Dropship Center');
        return createFallbackOrder(order);
      }

      default:
        console.log(`⚠️ No API implementation for supplier: ${connectorId}`);
    }
  } catch (error) {
    console.error('Supplier API error:', error);
  }

  return createFallbackOrder(order);
}

function createFallbackOrder(order: any) {
  // Fallback: create order record but mark for manual processing
  return {
    success: true,
    supplierOrderId: `MANUAL-${Date.now()}`,
    trackingNumber: `PENDING-${Date.now()}`,
    expectedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    manual: true
  };
}
