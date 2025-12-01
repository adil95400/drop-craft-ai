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
    console.log('[CJ-WEBHOOK] Received:', payload);

    // CJ Dropshipping webhook format
    const { type, data } = payload;

    if (type === 'PRODUCT_STOCK_UPDATE') {
      const { pid, variantId, stock } = data;

      // Find all users with this CJ product
      const { data: products, error: prodError } = await supabaseClient
        .from('supplier_products')
        .select('*, user_id')
        .eq('supplier_id', 'cjdropshipping')
        .eq('external_id', pid);

      if (prodError) throw prodError;

      // Update stock for all users
      for (const product of products || []) {
        const previousQuantity = product.stock_quantity || 0;
        const newStock = stock || 999; // CJ has high availability

        await supabaseClient
          .from('supplier_products')
          .update({ 
            stock_quantity: newStock,
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
            new_quantity: newStock,
            change_amount: newStock - previousQuantity,
            change_reason: 'webhook',
            supplier_id: 'cjdropshipping'
          });

        console.log(`[CJ-WEBHOOK] Updated product ${product.name}: ${previousQuantity} → ${newStock}`);
      }

      return new Response(JSON.stringify({
        success: true,
        updated: products?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (type === 'ORDER_STATUS_UPDATE') {
      const { orderId, status, trackingNumber } = data;

      // Find order and update
      const { data: orders } = await supabaseClient
        .from('fulfillment_shipments')
        .select('*')
        .eq('external_order_id', orderId);

      for (const order of orders || []) {
        await supabaseClient
          .from('fulfillment_shipments')
          .update({
            status: mapCJStatus(status),
            tracking_number: trackingNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', order.id);

        console.log(`[CJ-WEBHOOK] Updated order ${orderId}: ${status}`);
      }

      return new Response(JSON.stringify({
        success: true,
        updated: orders?.length || 0
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
    console.error('[CJ-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function mapCJStatus(cjStatus: string): string {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'PROCESSING': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled'
  };
  return statusMap[cjStatus] || 'pending';
}
