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
    const { action, ruleId, orderId, reason } = await req.json();

    if (action === 'create_order') {
      // Récupérer la règle d'auto-ordering
      const { data: rule, error: ruleError } = await supabase
        .from('auto_order_rules')
        .select('*, catalog_products(*)')
        .eq('id', ruleId)
        .single();

      if (ruleError || !rule) throw new Error('Rule not found');

      if (!rule.is_enabled) {
        return new Response(
          JSON.stringify({ error: 'Rule is disabled' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Vérifier le prix maximum si configuré
      const currentPrice = rule.catalog_products?.price || 0;
      if (rule.max_price && currentPrice > rule.max_price) {
        console.log(`Price ${currentPrice} exceeds max price ${rule.max_price}`);
        
        await supabase
          .from('activity_logs')
          .insert({
            user_id: rule.user_id,
            action: 'auto_order_skipped',
            entity_type: 'auto_order',
            description: `Commande automatique annulée: prix trop élevé (${currentPrice} > ${rule.max_price})`,
            metadata: { rule_id: ruleId, current_price: currentPrice, max_price: rule.max_price }
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Price exceeds maximum', 
            current_price: currentPrice,
            max_price: rule.max_price
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Créer la commande automatique
      const totalPrice = currentPrice * rule.reorder_quantity;
      
      const { data: order, error: orderError } = await supabase
        .from('auto_orders')
        .insert({
          user_id: rule.user_id,
          product_id: rule.product_id,
          supplier_url: rule.supplier_url,
          order_status: 'pending',
          quantity: rule.reorder_quantity,
          unit_price: currentPrice,
          total_price: totalPrice,
          metadata: {
            rule_id: ruleId,
            trigger_reason: reason || 'manual',
            created_by: 'auto_order_processor'
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Logger l'événement
      await supabase
        .from('activity_logs')
        .insert({
          user_id: rule.user_id,
          action: 'auto_order_created',
          entity_type: 'auto_order',
          entity_id: order.id,
          description: `Commande automatique créée: ${rule.reorder_quantity}x ${rule.catalog_products?.name || 'Product'}`,
          metadata: {
            order_id: order.id,
            quantity: rule.reorder_quantity,
            total_price: totalPrice,
            reason
          }
        });

      // Simuler le traitement de la commande (en production: appeler API fournisseur)
      setTimeout(async () => {
        try {
          const supplierOrderId = `SO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          const trackingNumber = `TRK${Date.now()}`;
          
          await supabase
            .from('auto_orders')
            .update({
              order_status: 'ordered',
              supplier_order_id: supplierOrderId,
              tracking_number: trackingNumber,
              expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', order.id);

          console.log(`Order ${order.id} placed successfully with supplier`);
        } catch (error) {
          console.error(`Failed to place order ${order.id}:`, error);
          
          await supabase
            .from('auto_orders')
            .update({
              order_status: 'failed',
              error_message: error.message,
              retry_count: order.retry_count + 1
            })
            .eq('id', order.id);
        }
      }, 2000);

      return new Response(
        JSON.stringify({
          success: true,
          order,
          message: 'Auto-order created and processing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (action === 'retry_order') {
      const { data: order, error: fetchError } = await supabase
        .from('auto_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) throw new Error('Order not found');

      if (order.retry_count >= order.max_retries) {
        return new Response(
          JSON.stringify({ error: 'Max retries exceeded' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      await supabase
        .from('auto_orders')
        .update({
          order_status: 'pending',
          retry_count: order.retry_count + 1,
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ success: true, message: 'Order queued for retry' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (action === 'update_status') {
      const { status, trackingNumber, deliveryDate } = await req.json();

      const updates: any = {
        order_status: status,
        updated_at: new Date().toISOString()
      };

      if (trackingNumber) updates.tracking_number = trackingNumber;
      if (deliveryDate) updates.actual_delivery_date = deliveryDate;
      if (status === 'delivered') updates.actual_delivery_date = new Date().toISOString();

      await supabase
        .from('auto_orders')
        .update(updates)
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ success: true, message: 'Order status updated' }),
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
    console.error('Auto-order processor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
