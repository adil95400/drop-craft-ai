import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUPPLIER-ORDER-AUTOMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { orderId, items, customerId, totalAmount } = await req.json();
    logStep("Processing order", { orderId, itemCount: items?.length, customerId, totalAmount });

    if (!orderId || !items || items.length === 0) {
      throw new Error("Missing required order data");
    }

    // Group items by supplier
    const supplierGroups = new Map();
    for (const item of items) {
      const supplierId = item.supplier_id || 'default';
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, []);
      }
      supplierGroups.get(supplierId).push(item);
    }

    logStep("Grouped items by supplier", { supplierCount: supplierGroups.size });

    const results = [];

    // Process each supplier group
    for (const [supplierId, supplierItems] of supplierGroups) {
      try {
        logStep(`Processing supplier ${supplierId}`, { itemCount: supplierItems.length });

        // Get supplier configuration
        const { data: supplier } = await supabaseClient
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single();

        if (!supplier) {
          logStep(`Supplier ${supplierId} not found`);
          continue;
        }

        // Create supplier order record
        const supplierOrderData = {
          order_id: orderId,
          supplier_id: supplierId,
          user_id: supplier.user_id,
          items: supplierItems,
          total_amount: supplierItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          status: 'pending',
          sent_at: new Date().toISOString()
        };

        const { data: supplierOrder, error: insertError } = await supabaseClient
          .from('supplier_orders')
          .insert(supplierOrderData)
          .select()
          .single();

        if (insertError) {
          logStep(`Error creating supplier order for ${supplierId}`, { error: insertError });
          continue;
        }

        // Simulate sending order to supplier
        const orderResult = await sendOrderToSupplier(supplier, supplierItems, supplierOrder.id);
        
        // Update supplier order with result
        await supabaseClient
          .from('supplier_orders')
          .update({
            status: orderResult.success ? 'sent' : 'failed',
            supplier_order_reference: orderResult.reference,
            error_message: orderResult.error,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplierOrder.id);

        results.push({
          supplierId,
          success: orderResult.success,
          reference: orderResult.reference,
          error: orderResult.error
        });

        logStep(`Supplier order processed`, { 
          supplierId, 
          success: orderResult.success, 
          reference: orderResult.reference 
        });

      } catch (error) {
        logStep(`Error processing supplier ${supplierId}`, { error: error.message });
        results.push({
          supplierId,
          success: false,
          error: error.message
        });
      }
    }

    logStep("Order automation completed", { totalSuppliers: results.length, successful: results.filter(r => r.success).length });

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in supplier-order-automation", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Simulate sending order to supplier
async function sendOrderToSupplier(supplier: any, items: any[], orderId: string) {
  try {
    // Simulate different supplier integrations
    switch (supplier.name.toLowerCase()) {
      case 'bigbuy':
        return await sendToBigBuy(supplier, items, orderId);
      case 'eprolo':
        return await sendToEprolo(supplier, items, orderId);
      case 'printful':
        return await sendToPrintful(supplier, items, orderId);
      default:
        return await sendGenericOrder(supplier, items, orderId);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// BigBuy integration simulation
async function sendToBigBuy(supplier: any, items: any[], orderId: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock successful response
  return {
    success: true,
    reference: `BB-${orderId}-${Date.now()}`,
    trackingUrl: `https://bigbuy.com/tracking/BB-${orderId}-${Date.now()}`
  };
}

// Eprolo integration simulation
async function sendToEprolo(supplier: any, items: any[], orderId: string) {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    success: true,
    reference: `EP-${orderId}-${Date.now()}`,
    trackingUrl: `https://eprolo.com/tracking/EP-${orderId}-${Date.now()}`
  };
}

// Printful integration simulation
async function sendToPrintful(supplier: any, items: any[], orderId: string) {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    success: true,
    reference: `PF-${orderId}-${Date.now()}`,
    trackingUrl: `https://printful.com/tracking/PF-${orderId}-${Date.now()}`
  };
}

// Generic email-based order sending
async function sendGenericOrder(supplier: any, items: any[], orderId: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock email sending success
  return {
    success: true,
    reference: `GEN-${orderId}-${Date.now()}`,
    error: null
  };
}