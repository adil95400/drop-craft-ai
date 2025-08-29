import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform') || 'unknown';
    const integrationId = url.searchParams.get('integration_id');
    
    console.log(`Webhook received for platform: ${platform}, integration: ${integrationId}`);

    // Get request headers and body
    const headers = Object.fromEntries(req.headers.entries());
    const body = await req.text();
    let webhookData;

    try {
      webhookData = JSON.parse(body);
    } catch {
      webhookData = { raw_body: body };
    }

    // Determine event type based on platform
    let eventType = 'unknown';
    
    if (platform === 'shopify') {
      eventType = headers['x-shopify-topic'] || 'unknown';
      
      // Verify Shopify webhook (basic verification)
      const shopDomain = headers['x-shopify-shop-domain'];
      console.log(`Shopify webhook from shop: ${shopDomain}, topic: ${eventType}`);
      
    } else if (platform === 'woocommerce') {
      // WooCommerce webhook detection
      eventType = headers['x-wc-webhook-event'] || 'product.updated';
      console.log(`WooCommerce webhook event: ${eventType}`);
    }

    // Store webhook event in database
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert([{
        integration_id: integrationId,
        platform,
        event_type: eventType,
        webhook_data: webhookData,
        processed: false
      }])
      .select()
      .single();

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
      throw new Error('Failed to store webhook event');
    }

    // Process webhook immediately
    const processed = await processWebhookEvent(supabase, webhookEvent, platform, eventType, webhookData);

    return new Response(JSON.stringify({
      success: true,
      event_id: webhookEvent.id,
      processed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processWebhookEvent(supabase: any, webhookEvent: any, platform: string, eventType: string, webhookData: any) {
  try {
    console.log(`Processing ${platform} webhook: ${eventType}`);

    let processed = false;

    if (platform === 'shopify') {
      processed = await processShopifyWebhook(supabase, eventType, webhookData, webhookEvent.integration_id);
    } else if (platform === 'woocommerce') {
      processed = await processWooCommerceWebhook(supabase, eventType, webhookData, webhookEvent.integration_id);
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString(),
        error_message: processed ? null : 'Processing failed'
      })
      .eq('id', webhookEvent.id);

    return processed;

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Mark webhook as failed
    await supabase
      .from('webhook_events')
      .update({ 
        processed: false,
        error_message: error.message,
        processed_at: new Date().toISOString()
      })
      .eq('id', webhookEvent.id);

    return false;
  }
}

async function processShopifyWebhook(supabase: any, eventType: string, data: any, integrationId: string) {
  switch (eventType) {
    case 'products/update':
      return await handleShopifyProductUpdate(supabase, data, integrationId);
    
    case 'inventory_levels/update':
      return await handleShopifyInventoryUpdate(supabase, data, integrationId);
    
    case 'orders/create':
      return await handleShopifyOrderCreate(supabase, data, integrationId);
    
    default:
      console.log(`Unhandled Shopify event: ${eventType}`);
      return false;
  }
}

async function processWooCommerceWebhook(supabase: any, eventType: string, data: any, integrationId: string) {
  switch (eventType) {
    case 'product.updated':
      return await handleWooCommerceProductUpdate(supabase, data, integrationId);
    
    case 'order.created':
      return await handleWooCommerceOrderCreate(supabase, data, integrationId);
    
    default:
      console.log(`Unhandled WooCommerce event: ${eventType}`);
      return false;
  }
}

async function handleShopifyProductUpdate(supabase: any, productData: any, integrationId: string) {
  try {
    console.log(`Updating product from Shopify: ${productData.id}`);
    
    // Find local product by Shopify ID
    const { data: localProducts } = await supabase
      .from('products')
      .select('*')
      .eq('shopify_id', productData.id.toString())
      .limit(1);

    if (!localProducts || localProducts.length === 0) {
      console.log('Local product not found, skipping update');
      return false;
    }

    const localProduct = localProducts[0];

    // Update local product data
    const updates = {
      name: productData.title,
      description: productData.body_html,
      price: parseFloat(productData.variants?.[0]?.price || '0'),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', localProduct.id);

    if (error) {
      console.error('Error updating local product:', error);
      return false;
    }

    // Update variants if they exist
    if (productData.variants && productData.variants.length > 0) {
      for (const variant of productData.variants) {
        await updateProductVariant(supabase, localProduct.id, variant, 'shopify');
      }
    }

    console.log(`Successfully updated product: ${localProduct.id}`);
    return true;

  } catch (error) {
    console.error('Error handling Shopify product update:', error);
    return false;
  }
}

async function handleShopifyInventoryUpdate(supabase: any, inventoryData: any, integrationId: string) {
  try {
    console.log(`Updating inventory from Shopify: ${inventoryData.inventory_item_id}`);
    
    // Update inventory levels
    const { error } = await supabase
      .from('inventory_levels')
      .upsert({
        location_id: inventoryData.location_id.toString(),
        available_quantity: inventoryData.available || 0,
        platform: 'shopify',
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'location_id,platform'
      });

    if (error) {
      console.error('Error updating inventory:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error handling Shopify inventory update:', error);
    return false;
  }
}

async function handleShopifyOrderCreate(supabase: any, orderData: any, integrationId: string) {
  try {
    console.log(`Creating order from Shopify: ${orderData.id}`);
    
    // Get integration to find user_id
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('id', integrationId)
      .single();

    if (!integration) return false;

    // Create local order
    const { error } = await supabase
      .from('orders')
      .insert({
        user_id: integration.user_id,
        order_number: orderData.order_number || orderData.name,
        total_amount: parseFloat(orderData.total_price),
        currency: orderData.currency,
        status: orderData.financial_status === 'paid' ? 'confirmed' : 'pending',
        created_at: orderData.created_at
      });

    if (error) {
      console.error('Error creating order:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error handling Shopify order create:', error);
    return false;
  }
}

async function handleWooCommerceProductUpdate(supabase: any, productData: any, integrationId: string) {
  try {
    console.log(`Updating product from WooCommerce: ${productData.id}`);
    
    // Similar logic to Shopify but for WooCommerce
    const { data: localProducts } = await supabase
      .from('products')
      .select('*')
      .ilike('sku', productData.sku)
      .limit(1);

    if (!localProducts || localProducts.length === 0) {
      return false;
    }

    const localProduct = localProducts[0];

    const updates = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.regular_price || '0'),
      stock_quantity: productData.stock_quantity || 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', localProduct.id);

    return !error;
  } catch (error) {
    console.error('Error handling WooCommerce product update:', error);
    return false;
  }
}

async function handleWooCommerceOrderCreate(supabase: any, orderData: any, integrationId: string) {
  try {
    console.log(`Creating order from WooCommerce: ${orderData.id}`);
    
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('id', integrationId)
      .single();

    if (!integration) return false;

    const { error } = await supabase
      .from('orders')
      .insert({
        user_id: integration.user_id,
        order_number: orderData.number,
        total_amount: parseFloat(orderData.total),
        currency: orderData.currency,
        status: orderData.status === 'processing' ? 'confirmed' : 'pending',
        created_at: orderData.date_created
      });

    return !error;
  } catch (error) {
    console.error('Error handling WooCommerce order create:', error);
    return false;
  }
}

async function updateProductVariant(supabase: any, productId: string, variantData: any, platform: string) {
  const variantUpdate = {
    product_id: productId,
    variant_sku: variantData.sku,
    price: parseFloat(variantData.price || '0'),
    stock_quantity: variantData.inventory_quantity || 0,
    updated_at: new Date().toISOString()
  };

  if (platform === 'shopify') {
    variantUpdate.shopify_variant_id = variantData.id.toString();
  } else if (platform === 'woocommerce') {
    variantUpdate.woocommerce_variant_id = variantData.id.toString();
  }

  await supabase
    .from('product_variants')
    .upsert(variantUpdate, {
      onConflict: 'product_id,variant_sku'
    });
}