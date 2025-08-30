import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-HANDLER] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Webhook received', { method: req.method, url: req.url });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get('x-shopify-hmac-sha256') || req.headers.get('x-wc-webhook-signature');
    const source = req.headers.get('x-shopify-topic') ? 'shopify' : 'woocommerce';
    const eventType = req.headers.get('x-shopify-topic') || req.headers.get('x-wc-webhook-event') || 'unknown';
    
    const payload = await req.json();
    logStep('Payload received', { source, eventType, payloadSize: JSON.stringify(payload).length });

    // Store webhook event for processing
    const { data: webhookEvent, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        source,
        event_type: eventType,
        webhook_id: signature,
        payload,
        user_id: payload.customer?.id || payload.user_id // Extract user context if available
      })
      .select()
      .single();

    if (insertError) {
      logStep('Error storing webhook', insertError);
      throw insertError;
    }

    logStep('Webhook stored', { id: webhookEvent.id });

    // Process webhook based on type
    await processWebhook(supabase, webhookEvent);

    return new Response(JSON.stringify({ success: true, id: webhookEvent.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep('Webhook error', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processWebhook(supabase: any, webhookEvent: any) {
  const { source, event_type, payload } = webhookEvent;
  
  try {
    if (source === 'shopify') {
      await processShopifyWebhook(supabase, event_type, payload);
    } else if (source === 'woocommerce') {
      await processWooCommerceWebhook(supabase, event_type, payload);
    }

    // Mark as processed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('id', webhookEvent.id);

  } catch (error) {
    logStep('Processing error', error.message);
    
    // Update retry count and error
    await supabase
      .from('webhook_events')
      .update({ 
        retry_count: webhookEvent.retry_count + 1,
        error_message: error.message 
      })
      .eq('id', webhookEvent.id);
  }
}

async function processShopifyWebhook(supabase: any, eventType: string, payload: any) {
  logStep('Processing Shopify webhook', { eventType });

  switch (eventType) {
    case 'products/update':
      await syncProductFromShopify(supabase, payload);
      break;
    case 'inventory_levels/update':
      await syncInventoryFromShopify(supabase, payload);
      break;
    case 'orders/create':
    case 'orders/updated':
      await syncOrderFromShopify(supabase, payload);
      break;
    default:
      logStep('Unhandled Shopify event', { eventType });
  }
}

async function processWooCommerceWebhook(supabase: any, eventType: string, payload: any) {
  logStep('Processing WooCommerce webhook', { eventType });

  switch (eventType) {
    case 'product.updated':
      await syncProductFromWooCommerce(supabase, payload);
      break;
    case 'order.created':
    case 'order.updated':
      await syncOrderFromWooCommerce(supabase, payload);
      break;
    default:
      logStep('Unhandled WooCommerce event', { eventType });
  }
}

async function syncProductFromShopify(supabase: any, product: any) {
  logStep('Syncing Shopify product', { id: product.id });

  // Find matching imported product by external ID
  const { data: importedProduct } = await supabase
    .from('imported_products')
    .select('*')
    .eq('supplier_product_id', product.id.toString())
    .single();

  if (importedProduct) {
    // Update local product with Shopify changes
    await supabase
      .from('imported_products')
      .update({
        name: product.title,
        price: parseFloat(product.variants[0]?.price || '0'),
        stock_quantity: product.variants[0]?.inventory_quantity || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', importedProduct.id);

    logStep('Product synced from Shopify', { productId: importedProduct.id });
  }
}

async function syncInventoryFromShopify(supabase: any, inventory: any) {
  logStep('Syncing Shopify inventory', { variantId: inventory.inventory_item_id });

  // Update inventory levels
  await supabase
    .from('inventory_levels')
    .upsert({
      platform: 'shopify',
      product_id: inventory.inventory_item_id,
      location_id: inventory.location_id,
      available_quantity: inventory.available,
      updated_at: new Date().toISOString()
    });
}

async function syncOrderFromShopify(supabase: any, order: any) {
  logStep('Syncing Shopify order', { id: order.id });

  // Store or update order
  await supabase
    .from('orders')
    .upsert({
      order_number: order.name,
      status: mapShopifyOrderStatus(order.fulfillment_status),
      total_amount: parseFloat(order.total_price),
      currency: order.currency,
      created_at: order.created_at,
      updated_at: new Date().toISOString()
    });
}

async function syncProductFromWooCommerce(supabase: any, product: any) {
  logStep('Syncing WooCommerce product', { id: product.id });

  const { data: importedProduct } = await supabase
    .from('imported_products')
    .select('*')
    .eq('supplier_product_id', product.id.toString())
    .single();

  if (importedProduct) {
    await supabase
      .from('imported_products')
      .update({
        name: product.name,
        price: parseFloat(product.price || '0'),
        stock_quantity: product.stock_quantity || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', importedProduct.id);

    logStep('Product synced from WooCommerce', { productId: importedProduct.id });
  }
}

async function syncOrderFromWooCommerce(supabase: any, order: any) {
  logStep('Syncing WooCommerce order', { id: order.id });

  await supabase
    .from('orders')
    .upsert({
      order_number: order.number,
      status: order.status,
      total_amount: parseFloat(order.total),
      currency: order.currency,
      created_at: order.date_created,
      updated_at: new Date().toISOString()
    });
}

function mapShopifyOrderStatus(fulfillmentStatus: string): string {
  switch (fulfillmentStatus) {
    case 'fulfilled': return 'completed';
    case 'partial': return 'processing';
    case 'unfulfilled': return 'pending';
    default: return 'pending';
  }
}