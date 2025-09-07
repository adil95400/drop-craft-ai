import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHOPIFY-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Shopify webhook received");
    
    const body = await req.text();
    const topic = req.headers.get("x-shopify-topic");
    const shop = req.headers.get("x-shopify-shop-domain");
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    
    logStep("Webhook headers", { topic, shop, hmac: !!hmac });

    // Verify webhook authenticity
    const isValid = await verifyShopifyWebhook(body, hmac);
    if (!isValid) {
      logStep("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const webhookData = JSON.parse(body);
    logStep("Processing webhook", { topic, shop });

    // Find user by shop domain
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('user_id, id, configuration')
      .eq('shop_domain', shop)
      .eq('platform_type', 'shopify')
      .single();

    if (!integration) {
      logStep("No integration found for shop", { shop });
      return new Response("No integration found", { status: 404, headers: corsHeaders });
    }

    const userId = integration.user_id;

    // Process different webhook types
    switch (topic) {
      case "orders/create":
        await handleOrderCreate(supabaseClient, userId, webhookData);
        break;
      case "orders/updated":
        await handleOrderUpdate(supabaseClient, userId, webhookData);
        break;
      case "orders/paid":
        await handleOrderPaid(supabaseClient, userId, webhookData);
        break;
      case "orders/cancelled":
        await handleOrderCancel(supabaseClient, userId, webhookData);
        break;
      case "orders/fulfilled":
        await handleOrderFulfilled(supabaseClient, userId, webhookData);
        break;
      case "products/create":
        await handleProductCreate(supabaseClient, userId, webhookData);
        break;
      case "products/update":
        await handleProductUpdate(supabaseClient, userId, webhookData);
        break;
      case "app/uninstalled":
        await handleAppUninstall(supabaseClient, userId, webhookData);
        break;
      default:
        logStep("Unhandled webhook topic", { topic });
    }

    logStep("Webhook processed successfully", { topic });
    
    return new Response("OK", { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in shopify-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function verifyShopifyWebhook(body: string, hmac: string | null): Promise<boolean> {
  if (!hmac) return false;
  
  const webhookSecret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
  if (!webhookSecret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
    
    // Convert to base64
    const signatureArray = new Uint8Array(signature);
    const calculated = btoa(String.fromCharCode(...signatureArray));
    
    return calculated === hmac;
  } catch (error) {
    console.error('HMAC verification error:', error);
    return false;
  }
}

async function handleOrderCreate(supabase: any, userId: string, orderData: any) {
  logStep("Processing new order", { orderId: orderData.id });
  
  // Extract customer info
  const customer = orderData.customer || {};
  let customerId = null;

  if (customer.email) {
    // Upsert customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .eq('email', customer.email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          email: customer.email,
          phone: customer.phone,
          country: orderData.shipping_address?.country,
          address: {
            shipping: orderData.shipping_address,
            billing: orderData.billing_address
          }
        })
        .select('id')
        .single();
      
      customerId = newCustomer?.id;
    }
  }

  // Create order
  await supabase.from('orders').insert({
    user_id: userId,
    customer_id: customerId,
    order_number: orderData.order_number || orderData.name,
    external_id: orderData.id.toString(),
    status: mapOrderStatus(orderData.financial_status, orderData.fulfillment_status),
    total_amount: parseFloat(orderData.total_price || '0'),
    currency: orderData.currency,
    order_date: orderData.created_at,
    shipping_address: orderData.shipping_address,
    billing_address: orderData.billing_address,
    items: orderData.line_items?.map((item: any) => ({
      product_name: item.title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
      external_product_id: item.product_id?.toString(),
      external_variant_id: item.variant_id?.toString()
    })) || []
  });

  // Trigger supplier order automation if enabled
  try {
    await supabase.functions.invoke('supplier-order-automation', {
      body: {
        orderId: orderData.id.toString(),
        items: orderData.line_items || [],
        customerId: customerId,
        totalAmount: parseFloat(orderData.total_price || '0')
      }
    });
  } catch (error) {
    logStep("Failed to trigger supplier automation", { error: error.message });
  }
}

async function handleOrderUpdate(supabase: any, userId: string, orderData: any) {
  logStep("Updating order", { orderId: orderData.id });
  
  await supabase
    .from('orders')
    .update({
      status: mapOrderStatus(orderData.financial_status, orderData.fulfillment_status),
      total_amount: parseFloat(orderData.total_price || '0'),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('external_id', orderData.id.toString());
}

async function handleOrderPaid(supabase: any, userId: string, orderData: any) {
  logStep("Order paid", { orderId: orderData.id });
  
  await supabase
    .from('orders')
    .update({
      status: 'paid'
    })
    .eq('user_id', userId)
    .eq('external_id', orderData.id.toString());
}

async function handleOrderCancel(supabase: any, userId: string, orderData: any) {
  logStep("Order cancelled", { orderId: orderData.id });
  
  await supabase
    .from('orders')
    .update({
      status: 'cancelled'
    })
    .eq('user_id', userId)
    .eq('external_id', orderData.id.toString());
}

async function handleOrderFulfilled(supabase: any, userId: string, orderData: any) {
  logStep("Order fulfilled", { orderId: orderData.id });
  
  await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivery_date: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('external_id', orderData.id.toString());
}

async function handleProductCreate(supabase: any, userId: string, productData: any) {
  logStep("Product created", { productId: productData.id });
  
  // Process product variants
  for (const variant of productData.variants || []) {
    await supabase.from('supplier_products').upsert({
      user_id: userId,
      name: productData.title,
      description: productData.body_html?.replace(/<[^>]*>/g, ''),
      price: parseFloat(variant.price || '0'),
      sku: variant.sku,
      external_id: variant.id.toString(),
      image_url: productData.image?.src
    }, {
      onConflict: 'external_id,user_id'
    });
  }
}

async function handleProductUpdate(supabase: any, userId: string, productData: any) {
  logStep("Product updated", { productId: productData.id });
  
  // Update existing products
  for (const variant of productData.variants || []) {
    await supabase
      .from('supplier_products')
      .update({
        name: productData.title,
        description: productData.body_html?.replace(/<[^>]*>/g, ''),
        price: parseFloat(variant.price || '0'),
        sku: variant.sku,
        image_url: productData.image?.src,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('external_id', variant.id.toString());
  }
}

async function handleAppUninstall(supabase: any, userId: string, data: any) {
  logStep("App uninstalled", { userId });
  
  // Deactivate integration
  await supabase
    .from('integrations')
    .update({
      connection_status: 'disconnected',
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('platform_type', 'shopify');
}

function mapOrderStatus(financialStatus: string, fulfillmentStatus: string): string {
  if (fulfillmentStatus === 'fulfilled') return 'delivered';
  if (financialStatus === 'paid') return 'processing';
  if (financialStatus === 'pending') return 'pending';
  if (financialStatus === 'refunded') return 'cancelled';
  return 'pending';
}