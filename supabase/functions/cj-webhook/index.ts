import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CJWebhookPayload {
  messageId: string
  type: 'PRODUCT' | 'VARIANT' | 'STOCK' | 'ORDER' | 'ORDERSPLIT' | 'LOGISTIC' | 'SOURCINGCREATE'
  messageType: 'INSERT' | 'UPDATE' | 'DELETE' | 'ORDER_CONNECTED'
  params: Record<string, any>
  openId?: number
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: CJWebhookPayload = await req.json()
    
    console.log(`CJ Webhook received: ${payload.type} - ${payload.messageType}`, {
      messageId: payload.messageId,
      type: payload.type
    })

    // Log the webhook event
    await supabase.from('webhook_logs').insert({
      source: 'cjdropshipping',
      event_type: `${payload.type}_${payload.messageType}`,
      payload: payload,
      message_id: payload.messageId
    }).catch(e => console.log('Webhook log insert failed:', e.message))

    switch (payload.type) {
      case 'PRODUCT':
        await handleProductEvent(supabase, payload)
        break
      case 'VARIANT':
        await handleVariantEvent(supabase, payload)
        break
      case 'STOCK':
        await handleStockEvent(supabase, payload)
        break
      case 'ORDER':
        await handleOrderEvent(supabase, payload)
        break
      case 'ORDERSPLIT':
        await handleOrderSplitEvent(supabase, payload)
        break
      case 'LOGISTIC':
        await handleLogisticEvent(supabase, payload)
        break
      case 'SOURCINGCREATE':
        await handleSourcingEvent(supabase, payload)
        break
      default:
        console.log('Unknown webhook type:', payload.type)
    }

    // CJ requires 200 OK response within 3 seconds
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('CJ Webhook error:', error)
    // Still return 200 to prevent CJ from retrying
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleProductEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload
  const pid = params.pid

  console.log(`Product ${messageType}: ${pid}`)

  if (messageType === 'DELETE') {
    // Mark product as inactive
    await supabase
      .from('supplier_products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('external_id', pid)
      .eq('supplier_name', 'CJ Dropshipping')
    return
  }

  // For INSERT/UPDATE, update the product fields that changed
  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (params.productNameEn) updateFields.name = params.productNameEn
  if (params.productDescription) updateFields.description = params.productDescription
  if (params.productImage) updateFields.images = [params.productImage]
  if (params.productSellPrice) updateFields.price = params.productSellPrice
  if (params.categoryName) updateFields.category = params.categoryName
  if (params.productSku) updateFields.sku = params.productSku
  if (params.productStatus === 3) updateFields.is_active = true
  if (params.productStatus === 2) updateFields.is_active = false

  const { error } = await supabase
    .from('supplier_products')
    .update(updateFields)
    .eq('external_id', pid)
    .eq('supplier_name', 'CJ Dropshipping')

  if (error) {
    console.error('Failed to update product:', error)
  }
}

async function handleVariantEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload
  const vid = params.vid

  console.log(`Variant ${messageType}: ${vid}`)

  // Update variant data in attributes or dedicated variants table
  const updateData = {
    variant_id: vid,
    variant_sku: params.variantSku,
    variant_price: params.variantSellPrice,
    variant_weight: params.variantWeight,
    variant_image: params.variantImage,
    variant_key: params.variantKey,
    updated_at: new Date().toISOString()
  }

  // Store variant update in product attributes
  const { data: products } = await supabase
    .from('supplier_products')
    .select('id, attributes')
    .eq('supplier_name', 'CJ Dropshipping')
    .contains('attributes', { variants: [{ vid: vid }] })
    .limit(1)

  if (products?.length > 0) {
    const product = products[0]
    const attributes = product.attributes || {}
    const variants = attributes.variants || []
    
    const variantIndex = variants.findIndex((v: any) => v.vid === vid)
    if (variantIndex >= 0) {
      if (messageType === 'DELETE') {
        variants.splice(variantIndex, 1)
      } else {
        variants[variantIndex] = { ...variants[variantIndex], ...updateData }
      }
    } else if (messageType !== 'DELETE') {
      variants.push(updateData)
    }

    await supabase
      .from('supplier_products')
      .update({ 
        attributes: { ...attributes, variants },
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id)
  }
}

async function handleStockEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload
  
  console.log('Stock update received for variants:', Object.keys(params))

  // params contains variant IDs as keys with stock info arrays
  for (const [vid, stockInfoArray] of Object.entries(params)) {
    if (!Array.isArray(stockInfoArray)) continue

    const totalStock = stockInfoArray.reduce((sum: number, info: any) => {
      return sum + (info.storageNum || 0)
    }, 0)

    console.log(`Variant ${vid} total stock: ${totalStock}`)

    // Update stock in supplier_products via attributes
    const { data: products } = await supabase
      .from('supplier_products')
      .select('id, stock_quantity, attributes')
      .eq('supplier_name', 'CJ Dropshipping')
      .or(`external_id.eq.${vid},attributes->variants.cs.[{"vid":"${vid}"}]`)
      .limit(1)

    if (products?.length > 0) {
      const product = products[0]
      const attributes = product.attributes || {}
      
      // Update variant stock in attributes
      if (attributes.variants) {
        const variantIndex = attributes.variants.findIndex((v: any) => v.vid === vid)
        if (variantIndex >= 0) {
          attributes.variants[variantIndex].stock = totalStock
          attributes.variants[variantIndex].stockDetails = stockInfoArray
        }
      }

      // Also update main stock_quantity if this is the primary variant
      await supabase
        .from('supplier_products')
        .update({ 
          stock_quantity: totalStock,
          attributes,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
    }
  }
}

async function handleOrderEvent(supabase: any, payload: CJWebhookPayload) {
  const { params, messageType } = payload
  
  console.log(`Order ${messageType}:`, params.orderNumber || params.cjOrderId)

  const orderUpdate = {
    cj_order_id: params.cjOrderId?.toString(),
    cj_order_status: params.orderStatus,
    logistics_name: params.logisticName,
    tracking_number: params.trackNumber,
    tracking_url: params.trackingUrl,
    cj_created_at: params.createDate,
    cj_updated_at: params.updateDate,
    cj_paid_at: params.payDate,
    cj_delivered_at: params.deliveryDate,
    cj_completed_at: params.completeDate,
    updated_at: new Date().toISOString()
  }

  // Update order in orders table using orderNumber
  const { error } = await supabase
    .from('orders')
    .update({
      fulfillment_status: mapCJOrderStatus(params.orderStatus),
      tracking_number: params.trackNumber,
      tracking_url: params.trackingUrl,
      shipping_carrier: params.logisticName,
      metadata: orderUpdate,
      updated_at: new Date().toISOString()
    })
    .or(`order_number.eq.${params.orderNumber},order_number.eq.${params.orderNum}`)

  if (error) {
    console.error('Failed to update order:', error)
  }

  // Also log to supplier_order_sync for tracking
  await supabase.from('supplier_order_sync').upsert({
    order_number: params.orderNumber || params.orderNum,
    supplier_order_id: params.cjOrderId?.toString(),
    supplier_name: 'CJ Dropshipping',
    status: params.orderStatus,
    tracking_number: params.trackNumber,
    tracking_url: params.trackingUrl,
    carrier: params.logisticName,
    sync_data: orderUpdate,
    synced_at: new Date().toISOString()
  }, { onConflict: 'order_number,supplier_name' }).catch(e => console.log('Order sync log failed:', e.message))
}

async function handleOrderSplitEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload
  
  console.log('Order split:', params.originalOrderId)

  // Log the split order info
  await supabase.from('webhook_logs').insert({
    source: 'cjdropshipping',
    event_type: 'ORDER_SPLIT',
    payload: {
      originalOrderId: params.originalOrderId,
      splitOrders: params.splitOrderList,
      splitTime: params.orderSplitTime
    },
    message_id: payload.messageId
  }).catch(e => console.log('Order split log failed:', e.message))
}

async function handleLogisticEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload
  
  console.log('Logistics update for order:', params.orderId)

  const trackingEvents = params.logisticsTrackEvents 
    ? (typeof params.logisticsTrackEvents === 'string' 
        ? JSON.parse(params.logisticsTrackEvents) 
        : params.logisticsTrackEvents)
    : []

  // Update order with latest tracking info
  await supabase
    .from('orders')
    .update({
      tracking_number: params.trackingNumber,
      tracking_url: params.trackingUrl,
      shipping_carrier: params.logisticName,
      fulfillment_status: mapTrackingStatus(params.trackingStatus),
      metadata: {
        trackingStatus: params.trackingStatus,
        trackingEvents,
        lastTrackingUpdate: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->cj_order_id', params.orderId?.toString())
    .catch(e => console.log('Logistics update failed:', e.message))
}

async function handleSourcingEvent(supabase: any, payload: CJWebhookPayload) {
  const { params } = payload
  
  console.log('Sourcing result:', params.cjSourcingId, params.status)

  // Log sourcing results
  await supabase.from('webhook_logs').insert({
    source: 'cjdropshipping',
    event_type: 'SOURCING_RESULT',
    payload: params,
    message_id: payload.messageId
  }).catch(e => console.log('Sourcing log failed:', e.message))
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
  }
  return statusMap[status] || 'processing'
}

function mapTrackingStatus(status: number): string {
  // 0-No info, 1-Warehouse out, 2-Forwarder in, 3-Forwarder return, 4-Forwarder out
  // 5-First transport, 6-Destination country, 7-Customs start, 8-Customs done
  // 9-Terminal pickup, 10-Delivering, 11-Waiting pickup, 12-Signed, 13-Exception, 14-Return
  if (status >= 12) return 'delivered'
  if (status >= 10) return 'out_for_delivery'
  if (status >= 5) return 'in_transit'
  if (status >= 1) return 'shipped'
  return 'processing'
}
