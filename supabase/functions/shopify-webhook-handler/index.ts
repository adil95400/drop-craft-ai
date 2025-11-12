import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
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

    // Get Shopify headers
    const shopifyHmac = req.headers.get('X-Shopify-Hmac-Sha256');
    const shopifyTopic = req.headers.get('X-Shopify-Topic');
    const shopifyDomain = req.headers.get('X-Shopify-Shop-Domain');
    const webhookId = req.headers.get('X-Shopify-Webhook-Id');

    console.log('Webhook received:', {
      topic: shopifyTopic,
      domain: shopifyDomain,
      webhookId
    });

    if (!shopifyHmac || !shopifyTopic || !shopifyDomain) {
      throw new Error('Missing required Shopify headers');
    }

    // Get the raw body for HMAC verification
    const body = await req.text();
    const payload = JSON.parse(body);

    // Find the integration based on shop domain
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('shop_domain', shopifyDomain)
      .eq('platform_name', 'shopify')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found for domain:', shopifyDomain);
      throw new Error('Integration not found');
    }

    // Verify HMAC signature using Web Crypto API
    const accessToken = integration.encrypted_credentials?.access_token;
    if (accessToken) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(accessToken),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const digest = btoa(String.fromCharCode(...new Uint8Array(signature)));

      if (digest !== shopifyHmac) {
        throw new Error('HMAC verification failed');
      }
    }

    // Log the webhook event
    await supabaseClient
      .from('webhook_events')
      .insert({
        integration_id: integration.id,
        platform: 'shopify',
        event_type: shopifyTopic,
        webhook_data: payload,
        processed: false
      });

    // Process webhook based on topic
    await processWebhook(supabaseClient, integration, shopifyTopic, payload);

    console.log('Webhook processed successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processWebhook(supabaseClient: any, integration: any, topic: string, payload: any) {
  console.log(`Processing webhook: ${topic}`);

  try {
    switch (topic) {
      case 'products/create':
      case 'products/update':
        await handleProductUpdate(supabaseClient, integration, payload);
        break;
      
      case 'products/delete':
        await handleProductDelete(supabaseClient, integration, payload);
        break;
      
      case 'orders/create':
      case 'orders/updated':
        await handleOrderUpdate(supabaseClient, integration, payload);
        break;
      
      case 'orders/cancelled':
        await handleOrderCancellation(supabaseClient, integration, payload);
        break;
      
      case 'inventory_levels/update':
        await handleInventoryUpdate(supabaseClient, integration, payload);
        break;
      
      case 'customers/create':
      case 'customers/update':
        await handleCustomerUpdate(supabaseClient, integration, payload);
        break;
      
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    // Mark webhook event as processed
    const eventId = (payload as any).id?.toString();
    if (eventId) {
      await supabaseClient
        .from('webhook_events')
        .update({ 
          processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('integration_id', integration.id)
        .eq('event_type', topic)
        .contains('webhook_data', { id: (payload as any).id });
    }

  } catch (error) {
    console.error(`Error processing webhook ${topic}:`, error);
    
    // Log error in webhook_events
    const eventId = (payload as any).id?.toString();
    if (eventId) {
      await supabaseClient
        .from('webhook_events')
        .update({ 
          error_message: error.message 
        })
        .eq('integration_id', integration.id)
        .eq('event_type', topic)
        .contains('webhook_data', { id: (payload as any).id });
    }
    
    throw error;
  }
}

async function handleProductUpdate(supabaseClient: any, integration: any, product: any) {
  console.log('Updating product:', product.id);

  const productData = {
    user_id: integration.user_id,
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants?.[0]?.price || '0'),
    cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0'),
    sku: product.variants?.[0]?.sku || '',
    category: product.product_type || 'General',
    image_url: product.images?.[0]?.src || null,
    stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    status: product.status === 'active' ? 'active' as const : 'inactive' as const,
    external_id: product.id.toString(),
    external_platform: 'shopify',
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    attributes: {
      handle: product.handle,
      vendor: product.vendor,
      created_at: product.created_at,
      updated_at: product.updated_at,
      variants: product.variants
    }
  };

  const { error } = await supabaseClient
    .from('products')
    .upsert(productData, { 
      onConflict: 'external_id,user_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Product upsert error:', error);
    throw error;
  }
}

async function handleProductDelete(supabaseClient: any, integration: any, payload: any) {
  console.log('Deleting product:', payload.id);

  const { error } = await supabaseClient
    .from('products')
    .update({ status: 'archived' as const })
    .eq('external_id', payload.id.toString())
    .eq('user_id', integration.user_id)
    .eq('external_platform', 'shopify');

  if (error) {
    console.error('Product delete error:', error);
    throw error;
  }
}

async function handleOrderUpdate(supabaseClient: any, integration: any, order: any) {
  console.log('Updating order:', order.id);

  // Create or get customer
  let customer_id = null;
  if (order.customer) {
    const { data: existingCustomer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('email', order.customer.email)
      .eq('user_id', integration.user_id)
      .single();

    if (existingCustomer) {
      customer_id = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabaseClient
        .from('customers')
        .insert({
          user_id: integration.user_id,
          name: `${order.customer.first_name} ${order.customer.last_name}`,
          email: order.customer.email,
          phone: order.customer.phone,
          country: order.shipping_address?.country
        })
        .select('id')
        .single();

      if (!customerError && newCustomer) {
        customer_id = newCustomer.id;
      }
    }
  }

  // Map Shopify status to our system
  const mapShopifyStatus = (shopifyStatus: string, fulfillmentStatus: string) => {
    if (shopifyStatus === 'cancelled') return 'cancelled';
    if (fulfillmentStatus === 'fulfilled') return 'delivered';
    if (fulfillmentStatus === 'partial') return 'shipped';
    if (shopifyStatus === 'open') return 'processing';
    return 'pending';
  };

  const orderData = {
    user_id: integration.user_id,
    customer_id,
    order_number: order.order_number?.toString() || order.id.toString(),
    status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
    total_amount: parseFloat(order.total_price || '0'),
    currency: order.currency || 'EUR',
    payment_status: order.financial_status === 'paid' ? 'paid' as const : 'pending' as const,
    shipping_address: order.shipping_address,
    billing_address: order.billing_address,
    external_id: order.id.toString(),
    external_platform: 'shopify',
    order_items: order.line_items?.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: parseFloat(item.price),
      sku: item.sku,
      variant_title: item.variant_title
    })),
    attributes: {
      tags: order.tags,
      note: order.note,
      created_at: order.created_at,
      processed_at: order.processed_at
    },
    created_at: order.created_at,
    updated_at: order.updated_at
  };

  const { error } = await supabaseClient
    .from('orders')
    .upsert(orderData, { 
      onConflict: 'external_id,user_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Order upsert error:', error);
    throw error;
  }
}

async function handleOrderCancellation(supabaseClient: any, integration: any, order: any) {
  console.log('Cancelling order:', order.id);

  const { error } = await supabaseClient
    .from('orders')
    .update({ status: 'cancelled' as const })
    .eq('external_id', order.id.toString())
    .eq('user_id', integration.user_id)
    .eq('external_platform', 'shopify');

  if (error) {
    console.error('Order cancellation error:', error);
    throw error;
  }
}

async function handleInventoryUpdate(supabaseClient: any, integration: any, payload: any) {
  console.log('Updating inventory:', payload);
  // Handle inventory updates if needed
}

async function handleCustomerUpdate(supabaseClient: any, integration: any, customer: any) {
  console.log('Updating customer:', customer.id);

  const customerData = {
    user_id: integration.user_id,
    name: `${customer.first_name} ${customer.last_name}`,
    email: customer.email,
    phone: customer.phone,
    external_id: customer.id.toString(),
    external_platform: 'shopify',
    attributes: {
      tags: customer.tags,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }
  };

  const { error } = await supabaseClient
    .from('customers')
    .upsert(customerData, { 
      onConflict: 'email,user_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Customer upsert error:', error);
    throw error;
  }
}
