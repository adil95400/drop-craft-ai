import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { action, orderId, config } = await req.json();

    if (action === 'process_order') {
      // Récupérer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      // Récupérer les produits de la commande
      const orderItems = order.items || [];
      const results = [];

      for (const item of orderItems) {
        // Trouver le fournisseur du produit
        const { data: product } = await supabase
          .from('products')
          .select('*, supplier:suppliers(*)')
          .eq('id', item.product_id)
          .single();

        if (!product || !product.supplier) {
          results.push({
            product_id: item.product_id,
            success: false,
            error: 'Supplier not found'
          });
          continue;
        }

        // Simuler une commande automatique au fournisseur
        const supplierOrder = {
          supplier_id: product.supplier.id,
          product_sku: product.sku,
          quantity: item.quantity,
          customer_address: order.shipping_address,
          order_reference: order.order_number,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        console.log('Auto-ordering from supplier:', supplierOrder);

        // Enregistrer dans les logs d'activité
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'auto_order_placed',
          entity_type: 'order',
          entity_id: orderId,
          description: `Auto order placed for ${product.name} from ${product.supplier.name}`,
          metadata: { supplier_order: supplierOrder }
        });

        results.push({
          product_id: item.product_id,
          success: true,
          supplier: product.supplier.name,
          tracking_number: `AUTO-${Date.now()}`
        });
      }

      // Mettre à jour le statut de la commande
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-order processed successfully',
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'configure') {
      // Sauvegarder la configuration
      const { data: extension } = await supabase
        .from('extensions')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'auto-order-fulfillment')
        .single();

      if (extension) {
        await supabase
          .from('extensions')
          .update({ 
            configuration: config,
            updated_at: new Date().toISOString()
          })
          .eq('id', extension.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Configuration saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
