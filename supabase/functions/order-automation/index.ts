import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ORDER-AUTOMATION] ${step}${detailsStr}`);
};

interface OrderItem {
  product_id: string;
  supplier_id: string;
  quantity: number;
  price: number;
}

interface SupplierOrder {
  supplier_id: string;
  items: OrderItem[];
  total_amount: number;
  customer_info: any;
  shipping_address: any;
  order_reference: string;
}

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
    logStep("Order automation function started");

    const { action, order_id, tracking_number, status } = await req.json();

    switch (action) {
      case 'process_order':
        return await processOrder(order_id, supabaseClient);
      
      case 'route_to_suppliers':
        return await routeOrderToSuppliers(order_id, supabaseClient);
      
      case 'update_tracking':
        return await updateOrderTracking(order_id, tracking_number, status, supabaseClient);
      
      case 'check_fulfillment_status':
        return await checkFulfillmentStatus(order_id, supabaseClient);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in order-automation", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processOrder(orderId: string, supabaseClient: any) {
  logStep("Processing order", { orderId });

  // Get order details
  const { data: order, error: orderError } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Order not found");
  }

  // Group items by supplier
  const supplierGroups = new Map<string, OrderItem[]>();
  
  for (const item of order.items || []) {
    // Get product supplier info
    const { data: product } = await supabaseClient
      .from('catalog_products')
      .select('supplier_id, supplier_name')
      .eq('id', item.product_id)
      .single();

    if (product) {
      const supplierId = product.supplier_id;
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, []);
      }
      supplierGroups.get(supplierId)!.push({
        product_id: item.product_id,
        supplier_id: supplierId,
        quantity: item.quantity,
        price: item.price
      });
    }
  }

  // Create supplier orders
  for (const [supplierId, items] of supplierGroups) {
    const supplierOrder: SupplierOrder = {
      supplier_id: supplierId,
      items,
      total_amount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      customer_info: {
        name: order.customer_name,
        email: order.customer_email
      },
      shipping_address: order.shipping_address,
      order_reference: `${order.order_number}-${supplierId}`
    };

    // Send order to supplier
    await sendOrderToSupplier(supplierOrder, supabaseClient);
  }

  // Update order status
  await supabaseClient
    .from('orders')
    .update({
      status: 'processing',
      processing_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  logStep("Order processed successfully", { orderId, supplierCount: supplierGroups.size });

  return new Response(JSON.stringify({
    success: true,
    message: "Order processed and routed to suppliers",
    supplier_orders: supplierGroups.size
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function sendOrderToSupplier(supplierOrder: SupplierOrder, supabaseClient: any) {
  logStep("Sending order to supplier", { supplier: supplierOrder.supplier_id });

  // Get supplier integration details
  const { data: supplier } = await supabaseClient
    .from('suppliers')
    .select('*')
    .eq('id', supplierOrder.supplier_id)
    .single();

  if (!supplier) {
    logStep("Supplier not found", { supplier_id: supplierOrder.supplier_id });
    return;
  }

  // Create supplier order record
  const { data: createdOrder, error } = await supabaseClient
    .from('supplier_orders')
    .insert({
      supplier_id: supplierOrder.supplier_id,
      order_reference: supplierOrder.order_reference,
      items: supplierOrder.items,
      total_amount: supplierOrder.total_amount,
      customer_info: supplierOrder.customer_info,
      shipping_address: supplierOrder.shipping_address,
      status: 'pending',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    logStep("Error creating supplier order", { error });
    return;
  }

  // Simulate API call to supplier (in real implementation, this would be actual API calls)
  switch (supplier.supplier_type) {
    case 'bigbuy':
      await sendToBigBuy(supplierOrder, supplier);
      break;
    case 'aliexpress':
      await sendToAliExpress(supplierOrder, supplier);
      break;
    case 'shopify':
      await sendToShopify(supplierOrder, supplier);
      break;
    default:
      // Generic email notification
      await sendEmailToSupplier(supplierOrder, supplier);
  }

  logStep("Order sent to supplier successfully", { 
    supplier: supplierOrder.supplier_id,
    order_id: createdOrder.id 
  });
}

async function sendToBigBuy(supplierOrder: SupplierOrder, supplier: any) {
  logStep("Sending order to BigBuy", { reference: supplierOrder.order_reference });
  
  // Simulate BigBuy API call
  const orderData = {
    reference: supplierOrder.order_reference,
    products: supplierOrder.items.map(item => ({
      sku: item.product_id,
      quantity: item.quantity
    })),
    shipping_address: supplierOrder.shipping_address,
    carrier: 'standard'
  };

  // In real implementation: await bigbuyApi.createOrder(orderData)
  logStep("BigBuy order simulated", { orderData });
}

async function sendToAliExpress(supplierOrder: SupplierOrder, supplier: any) {
  logStep("Sending order to AliExpress", { reference: supplierOrder.order_reference });
  
  // Simulate AliExpress dropshipping order
  const orderData = {
    order_id: supplierOrder.order_reference,
    product_items: supplierOrder.items,
    logistics_address: supplierOrder.shipping_address
  };

  // In real implementation: await aliexpressApi.placeOrder(orderData)
  logStep("AliExpress order simulated", { orderData });
}

async function sendToShopify(supplierOrder: SupplierOrder, supplier: any) {
  logStep("Sending order to Shopify", { reference: supplierOrder.order_reference });
  
  // Simulate Shopify order creation
  const orderData = {
    order: {
      line_items: supplierOrder.items.map(item => ({
        variant_id: item.product_id,
        quantity: item.quantity
      })),
      shipping_address: supplierOrder.shipping_address,
      financial_status: 'paid'
    }
  };

  // In real implementation: await shopifyApi.post('/orders', orderData)
  logStep("Shopify order simulated", { orderData });
}

async function sendEmailToSupplier(supplierOrder: SupplierOrder, supplier: any) {
  logStep("Sending email to supplier", { supplier: supplier.name });
  
  // Simulate email sending
  const emailContent = {
    to: supplier.contact_email,
    subject: `New Order: ${supplierOrder.order_reference}`,
    body: `
      New order received:
      Reference: ${supplierOrder.order_reference}
      Items: ${supplierOrder.items.length}
      Total: ${supplierOrder.total_amount}
      
      Please process this order and provide tracking information.
    `
  };

  // In real implementation: await sendEmail(emailContent)
  logStep("Email notification simulated", { to: supplier.contact_email });
}

async function routeOrderToSuppliers(orderId: string, supabaseClient: any) {
  // This function is called by processOrder, but can also be called independently
  return await processOrder(orderId, supabaseClient);
}

async function updateOrderTracking(orderId: string, trackingNumber: string, status: string, supabaseClient: any) {
  logStep("Updating order tracking", { orderId, trackingNumber, status });

  const { error } = await supabaseClient
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      status: status,
      tracking_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Failed to update tracking: ${error.message}`);
  }

  // Notify customer about tracking update
  await notifyCustomerTracking(orderId, trackingNumber, status, supabaseClient);

  return new Response(JSON.stringify({
    success: true,
    message: "Tracking information updated successfully"
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function checkFulfillmentStatus(orderId: string, supabaseClient: any) {
  logStep("Checking fulfillment status", { orderId });

  // Get supplier orders for this main order
  const { data: supplierOrders } = await supabaseClient
    .from('supplier_orders')
    .select('*')
    .ilike('order_reference', `%-${orderId}-%`);

  const fulfillmentStatus = {
    total_suppliers: supplierOrders?.length || 0,
    pending: supplierOrders?.filter(o => o.status === 'pending').length || 0,
    processing: supplierOrders?.filter(o => o.status === 'processing').length || 0,
    shipped: supplierOrders?.filter(o => o.status === 'shipped').length || 0,
    delivered: supplierOrders?.filter(o => o.status === 'delivered').length || 0,
    all_fulfilled: supplierOrders?.every(o => o.status === 'delivered') || false
  };

  return new Response(JSON.stringify({
    success: true,
    fulfillment_status: fulfillmentStatus
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function notifyCustomerTracking(orderId: string, trackingNumber: string, status: string, supabaseClient: any) {
  logStep("Notifying customer about tracking", { orderId, trackingNumber });

  // Get order and customer info
  const { data: order } = await supabaseClient
    .from('orders')
    .select('customer_email, customer_name, order_number')
    .eq('id', orderId)
    .single();

  if (order && order.customer_email) {
    // Simulate email notification
    const emailContent = {
      to: order.customer_email,
      subject: `Tracking Update for Order ${order.order_number}`,
      body: `
        Hello ${order.customer_name},
        
        Your order ${order.order_number} has been updated:
        Status: ${status}
        Tracking Number: ${trackingNumber}
        
        You can track your package using this number.
        
        Thank you for your order!
      `
    };

    // In real implementation: await sendEmail(emailContent)
    logStep("Customer notification email simulated", { to: order.customer_email });
  }
}