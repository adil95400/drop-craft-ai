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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, ...params } = await req.json();
    console.log('🚚 Tracking automation action:', action);

    switch (action) {
      case 'generate_tracking': {
        const { order_id, carrier, warehouse_id } = params;
        
        // Generate tracking number (format: CARRIER-TIMESTAMP-RANDOM)
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        const tracking_number = `${carrier.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;

        // Get order details
        const { data: order, error: orderError } = await supabaseClient
          .from('orders')
          .select('*, customers(*)')
          .eq('id', order_id)
          .single();

        if (orderError) throw orderError;

        // Find shipping zone
        const destination_country = order.shipping_address?.country || order.customers?.country;
        const { data: zone } = await supabaseClient
          .from('shipping_zones')
          .select('*')
          .eq('user_id', user.id)
          .contains('countries', [destination_country])
          .single();

        // Create shipment tracking
        const estimated_delivery = new Date();
        estimated_delivery.setDate(estimated_delivery.getDate() + 7);

        const { data: shipment, error: shipmentError } = await supabaseClient
          .from('shipment_tracking')
          .insert({
            user_id: user.id,
            order_id,
            tracking_number,
            carrier,
            origin_warehouse_id: warehouse_id,
            destination_address: order.shipping_address || {},
            shipping_zone_id: zone?.id,
            status: 'pending',
            shipped_at: new Date().toISOString(),
            estimated_delivery_at: estimated_delivery.toISOString(),
            tracking_events: [{
              timestamp: new Date().toISOString(),
              status: 'Label Created',
              location: 'Warehouse',
              description: 'Shipping label has been created'
            }]
          })
          .select()
          .single();

        if (shipmentError) throw shipmentError;

        // Update order with tracking
        await supabaseClient
          .from('orders')
          .update({ 
            tracking_number,
            status: 'shipped'
          })
          .eq('id', order_id);

        return new Response(
          JSON.stringify({
            success: true,
            tracking_number,
            shipment,
            message: 'Tracking number generated and assigned'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_tracking': {
        const { tracking_number, status, location, description } = params;

        const { data: shipment, error: findError } = await supabaseClient
          .from('shipment_tracking')
          .select('*')
          .eq('tracking_number', tracking_number)
          .eq('user_id', user.id)
          .single();

        if (findError) throw findError;

        const newEvent = {
          timestamp: new Date().toISOString(),
          status,
          location,
          description
        };

        const updatedEvents = [...(shipment.tracking_events || []), newEvent];
        const updateData: any = {
          tracking_events: updatedEvents
        };

        if (status) {
          updateData.status = status.toLowerCase().replace(/\s+/g, '_');
        }

        if (status === 'Delivered') {
          updateData.delivered_at = new Date().toISOString();
          
          // Update order status
          await supabaseClient
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', shipment.order_id);
        }

        const { data: updated, error: updateError } = await supabaseClient
          .from('shipment_tracking')
          .update(updateData)
          .eq('id', shipment.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            success: true,
            shipment: updated,
            message: 'Tracking updated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'bulk_generate': {
        const { order_ids, carrier, warehouse_id } = params;
        
        const results = [];
        for (const order_id of order_ids) {
          try {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            const tracking_number = `${carrier.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;

            await supabaseClient
              .from('orders')
              .update({ 
                tracking_number,
                status: 'shipped'
              })
              .eq('id', order_id);

            results.push({ order_id, tracking_number, success: true });
          } catch (error) {
            results.push({ order_id, success: false, error: error.message });
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
            message: `Generated ${results.filter(r => r.success).length} tracking numbers`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('❌ Tracking automation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
