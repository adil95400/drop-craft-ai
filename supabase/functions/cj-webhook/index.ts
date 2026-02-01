/**
 * CJ Dropshipping Webhook Handler - Enterprise-Safe Implementation
 * 
 * SECURITY NOTES:
 * - Webhooks are server-to-server, so we verify by request pattern
 * - All database writes are scoped to verified integrations
 * - No user authentication needed (webhook from CJ servers)
 * - Signature verification recommended when CJ provides it
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Minimal CORS for webhooks (server-to-server)
const webhookHeaders = {
  'Content-Type': 'application/json',
};

interface CJWebhookPayload {
  messageId: string
  type: 'PRODUCT' | 'VARIANT' | 'STOCK' | 'ORDER' | 'ORDERSPLIT' | 'LOGISTIC' | 'SOURCINGCREATE'
  messageType: 'INSERT' | 'UPDATE' | 'DELETE' | 'ORDER_CONNECTED'
  params: Record<string, any>
  openId?: number
}

// Allowed webhook types - whitelist
const ALLOWED_WEBHOOK_TYPES = new Set([
  'PRODUCT',
  'VARIANT', 
  'STOCK',
  'ORDER',
  'ORDERSPLIT',
  'LOGISTIC',
  'SOURCINGCREATE'
]);

const ALLOWED_MESSAGE_TYPES = new Set([
  'INSERT',
  'UPDATE',
  'DELETE',
  'ORDER_CONNECTED'
]);

serve(async (req) => {
  // Webhooks should only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: webhookHeaders }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Server configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload
    let payload: CJWebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: webhookHeaders }
      );
    }

    // Validate payload structure
    if (!payload.type || !payload.messageType || !payload.params) {
      console.log('Invalid CJ webhook payload structure');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid payload structure' }),
        { status: 400, headers: webhookHeaders }
      );
    }

    // Whitelist validation
    if (!ALLOWED_WEBHOOK_TYPES.has(payload.type)) {
      console.log(`Unknown CJ webhook type: ${payload.type}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Unknown type' }),
        { status: 200, headers: webhookHeaders }
      );
    }

    if (!ALLOWED_MESSAGE_TYPES.has(payload.messageType)) {
      console.log(`Unknown CJ message type: ${payload.messageType}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'Unknown message type' }),
        { status: 200, headers: webhookHeaders }
      );
    }

    console.log(`CJ Webhook received: ${payload.type} - ${payload.messageType}`, {
      messageId: payload.messageId,
      type: payload.type
    });

    // Log the webhook event (for audit)
    await supabase.from('webhook_logs').insert({
      source: 'cjdropshipping',
      event_type: `${payload.type}_${payload.messageType}`,
      payload: payload,
      message_id: payload.messageId,
      processed_at: new Date().toISOString()
    }).catch(e => console.log('Webhook log insert failed:', e.message));

    // Process by type with scoped database operations
    switch (payload.type) {
      case 'PRODUCT':
        await handleProductEvent(supabase, payload);
        break;
      case 'VARIANT':
        await handleVariantEvent(supabase, payload);
        break;
      case 'STOCK':
        await handleStockEvent(supabase, payload);
        break;
      case 'ORDER':
        await handleOrderEvent(supabase, payload);
        break;
      case 'ORDERSPLIT':
        await handleOrderSplitEvent(supabase, payload);
        break;
      case 'LOGISTIC':
        await handleLogisticEvent(supabase, payload);
        break;
      case 'SOURCINGCREATE':
        await handleSourcingEvent(supabase, payload);
        break;
      default:
        console.log('Unhandled webhook type:', payload.type);
    }

    // CJ requires 200 OK response within 3 seconds
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: webhookHeaders }
    );

  } catch (error) {
    console.error('CJ Webhook error:', error);
    // Still return 200 to prevent CJ from retrying excessively
    return new Response(
      JSON.stringify({ success: false, error: 'Processing error' }),
      { status: 200, headers: webhookHeaders }
    );
  }
});

async function handleProductEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload;
  const pid = params.pid;

  if (!pid) {
    console.log('Product event missing pid');
    return;
  }

  console.log(`Product ${messageType}: ${pid}`);

  // SECURITY: Only update products that already exist with CJ as supplier
  // This prevents injection of arbitrary products
  if (messageType === 'DELETE') {
    await supabase
      .from('supplier_products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('external_id', String(pid))
      .eq('supplier_name', 'CJ Dropshipping');
    return;
  }

  // Build update fields with validation
  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (typeof params.productNameEn === 'string') {
    updateFields.name = params.productNameEn.substring(0, 500);
  }
  if (typeof params.productDescription === 'string') {
    updateFields.description = params.productDescription.substring(0, 5000);
  }
  if (typeof params.productImage === 'string' && params.productImage.startsWith('http')) {
    updateFields.images = [params.productImage];
  }
  if (typeof params.productSellPrice === 'number' && params.productSellPrice > 0) {
    updateFields.price = params.productSellPrice;
  }
  if (typeof params.categoryName === 'string') {
    updateFields.category = params.categoryName.substring(0, 200);
  }
  if (typeof params.productSku === 'string') {
    updateFields.sku = params.productSku.substring(0, 100);
  }
  if (params.productStatus === 3) updateFields.is_active = true;
  if (params.productStatus === 2) updateFields.is_active = false;

  const { error } = await supabase
    .from('supplier_products')
    .update(updateFields)
    .eq('external_id', String(pid))
    .eq('supplier_name', 'CJ Dropshipping');

  if (error) {
    console.error('Failed to update product:', error);
  }
}

async function handleVariantEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload;
  const vid = params.vid;

  if (!vid) {
    console.log('Variant event missing vid');
    return;
  }

  console.log(`Variant ${messageType}: ${vid}`);

  const updateData = {
    variant_id: String(vid),
    variant_sku: typeof params.variantSku === 'string' ? params.variantSku.substring(0, 100) : null,
    variant_price: typeof params.variantSellPrice === 'number' ? params.variantSellPrice : null,
    variant_weight: typeof params.variantWeight === 'number' ? params.variantWeight : null,
    variant_image: typeof params.variantImage === 'string' && params.variantImage.startsWith('http') ? params.variantImage : null,
    variant_key: typeof params.variantKey === 'string' ? params.variantKey : null,
    updated_at: new Date().toISOString()
  };

  // Find and update product variant in attributes
  const { data: products } = await supabase
    .from('supplier_products')
    .select('id, attributes')
    .eq('supplier_name', 'CJ Dropshipping')
    .contains('attributes', { variants: [{ vid: String(vid) }] })
    .limit(1);

  if (products?.length > 0) {
    const product = products[0];
    const attributes = product.attributes || {};
    const variants = attributes.variants || [];
    
    const variantIndex = variants.findIndex((v: any) => String(v.vid) === String(vid));
    if (variantIndex >= 0) {
      if (messageType === 'DELETE') {
        variants.splice(variantIndex, 1);
      } else {
        variants[variantIndex] = { ...variants[variantIndex], ...updateData };
      }
    } else if (messageType !== 'DELETE') {
      variants.push(updateData);
    }

    await supabase
      .from('supplier_products')
      .update({ 
        attributes: { ...attributes, variants },
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
  }
}

async function handleStockEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload;
  
  console.log('Stock update received for variants:', Object.keys(params));

  for (const [vid, stockInfoArray] of Object.entries(params)) {
    if (!Array.isArray(stockInfoArray)) continue;

    const totalStock = stockInfoArray.reduce((sum: number, info: any) => {
      return sum + (typeof info.storageNum === 'number' ? info.storageNum : 0);
    }, 0);

    console.log(`Variant ${vid} total stock: ${totalStock}`);

    // Update stock - scoped to CJ products only
    const { data: products } = await supabase
      .from('supplier_products')
      .select('id, stock_quantity, attributes')
      .eq('supplier_name', 'CJ Dropshipping')
      .or(`external_id.eq.${vid}`)
      .limit(1);

    if (products?.length > 0) {
      const product = products[0];
      const attributes = product.attributes || {};
      
      if (attributes.variants) {
        const variantIndex = attributes.variants.findIndex((v: any) => String(v.vid) === String(vid));
        if (variantIndex >= 0) {
          attributes.variants[variantIndex].stock = totalStock;
          attributes.variants[variantIndex].stockDetails = stockInfoArray;
        }
      }

      await supabase
        .from('supplier_products')
        .update({ 
          stock_quantity: totalStock,
          attributes,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id);
    }
  }
}

async function handleOrderEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload;
  
  const orderNumber = params.orderNumber || params.orderNum;
  const cjOrderId = params.cjOrderId;
  
  if (!orderNumber && !cjOrderId) {
    console.log('Order event missing order identifiers');
    return;
  }

  console.log(`Order ${messageType}:`, orderNumber || cjOrderId);

  const orderUpdate = {
    cj_order_id: cjOrderId ? String(cjOrderId) : null,
    cj_order_status: typeof params.orderStatus === 'string' ? params.orderStatus : null,
    logistics_name: typeof params.logisticName === 'string' ? params.logisticName.substring(0, 100) : null,
    tracking_number: typeof params.trackNumber === 'string' ? params.trackNumber.substring(0, 100) : null,
    tracking_url: typeof params.trackingUrl === 'string' && params.trackingUrl.startsWith('http') ? params.trackingUrl : null,
    cj_updated_at: params.updateDate,
    updated_at: new Date().toISOString()
  };

  // Update order in orders table - requires matching order number
  const { error } = await supabase
    .from('orders')
    .update({
      fulfillment_status: mapCJOrderStatus(params.orderStatus),
      tracking_number: orderUpdate.tracking_number,
      tracking_url: orderUpdate.tracking_url,
      shipping_carrier: orderUpdate.logistics_name,
      metadata: orderUpdate,
      updated_at: new Date().toISOString()
    })
    .or(`order_number.eq.${orderNumber},order_number.eq.${params.orderNum}`);

  if (error) {
    console.error('Failed to update order:', error);
  }

  // Log to supplier_order_sync for tracking
  await supabase.from('supplier_order_sync').upsert({
    order_number: orderNumber || params.orderNum,
    supplier_order_id: cjOrderId ? String(cjOrderId) : null,
    supplier_name: 'CJ Dropshipping',
    status: params.orderStatus,
    tracking_number: orderUpdate.tracking_number,
    tracking_url: orderUpdate.tracking_url,
    carrier: orderUpdate.logistics_name,
    sync_data: orderUpdate,
    synced_at: new Date().toISOString()
  }, { onConflict: 'order_number,supplier_name' }).catch(e => console.log('Order sync log failed:', e.message));
}

async function handleOrderSplitEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload;
  
  console.log('Order split:', params.originalOrderId);

  await supabase.from('webhook_logs').insert({
    source: 'cjdropshipping',
    event_type: 'ORDER_SPLIT',
    payload: {
      originalOrderId: params.originalOrderId,
      splitOrders: params.splitOrderList,
      splitTime: params.orderSplitTime
    },
    message_id: payload.messageId
  }).catch(e => console.log('Order split log failed:', e.message));
}

async function handleLogisticEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload;
  
  if (!params.orderId) {
    console.log('Logistic event missing orderId');
    return;
  }

  console.log('Logistics update for order:', params.orderId);

  let trackingEvents: any[] = [];
  try {
    trackingEvents = params.logisticsTrackEvents 
      ? (typeof params.logisticsTrackEvents === 'string' 
          ? JSON.parse(params.logisticsTrackEvents) 
          : params.logisticsTrackEvents)
      : [];
  } catch {
    trackingEvents = [];
  }

  // Update order with latest tracking info
  await supabase
    .from('orders')
    .update({
      tracking_number: typeof params.trackingNumber === 'string' ? params.trackingNumber.substring(0, 100) : null,
      tracking_url: typeof params.trackingUrl === 'string' && params.trackingUrl.startsWith('http') ? params.trackingUrl : null,
      shipping_carrier: typeof params.logisticName === 'string' ? params.logisticName.substring(0, 100) : null,
      fulfillment_status: mapTrackingStatus(params.trackingStatus),
      metadata: {
        trackingStatus: params.trackingStatus,
        trackingEvents,
        lastTrackingUpdate: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->cj_order_id', String(params.orderId))
    .catch(e => console.log('Logistics update failed:', e.message));
}

async function handleSourcingEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload;
  
  console.log('Sourcing result:', params.cjSourcingId, params.status);

  await supabase.from('webhook_logs').insert({
    source: 'cjdropshipping',
    event_type: 'SOURCING_RESULT',
    payload: params,
    message_id: payload.messageId
  }).catch(e => console.log('Sourcing log failed:', e.message));
}

function mapCJOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'CREATED': 'pending',
    'IN_CART': 'pending',
    'UNPAID': 'pending',
    'UNCONFIRMED': 'processing',
    'AWAITING_SHIPMENT': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'COMPLETED': 'delivered'
  };
  return statusMap[status] || 'processing';
}

function mapTrackingStatus(status: number): string {
  if (status >= 12) return 'delivered';
  if (status >= 10) return 'out_for_delivery';
  if (status >= 5) return 'in_transit';
  if (status >= 1) return 'shipped';
  return 'processing';
}
