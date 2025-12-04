import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bigbuy-signature',
}

interface BigBuyWebhookPayload {
  event: string
  data: Record<string, any>
  timestamp: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('x-bigbuy-signature')
    const body = await req.text()
    let payload: BigBuyWebhookPayload

    try {
      payload = JSON.parse(body)
    } catch {
      console.error('Invalid JSON payload')
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`📦 BigBuy Webhook: ${payload.event}`, { timestamp: payload.timestamp })

    // Log webhook event
    await supabase.from('webhook_logs').insert({
      source: 'bigbuy',
      event_type: payload.event,
      payload: payload,
      signature: signature
    }).catch(e => console.log('Webhook log failed:', e.message))

    switch (payload.event) {
      case 'product.updated':
        await handleProductUpdate(supabase, payload.data)
        break
      case 'product.deleted':
        await handleProductDelete(supabase, payload.data)
        break
      case 'stock.updated':
        await handleStockUpdate(supabase, payload.data)
        break
      case 'price.updated':
        await handlePriceUpdate(supabase, payload.data)
        break
      case 'order.status_changed':
        await handleOrderStatusChange(supabase, payload.data)
        break
      case 'order.shipped':
        await handleOrderShipped(supabase, payload.data)
        break
      case 'order.delivered':
        await handleOrderDelivered(supabase, payload.data)
        break
      default:
        console.log('Unknown BigBuy event:', payload.event)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('BigBuy Webhook error:', error)
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleProductUpdate(supabase: any, data: any) {
  const { sku, name, description, images, categories } = data
  
  console.log(`Product update: ${sku}`)

  const updateFields: Record<string, any> = {
    updated_at: new Date().toISOString()
  }

  if (name) updateFields.name = name
  if (description) updateFields.description = description
  if (images?.length) updateFields.images = images
  if (categories?.length) updateFields.category = categories[0]

  await supabase
    .from('supplier_products')
    .update(updateFields)
    .eq('sku', sku)
    .eq('supplier_name', 'BigBuy')
}

async function handleProductDelete(supabase: any, data: any) {
  const { sku } = data
  
  console.log(`Product deleted: ${sku}`)

  await supabase
    .from('supplier_products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('sku', sku)
    .eq('supplier_name', 'BigBuy')
}

async function handleStockUpdate(supabase: any, data: any) {
  const { products } = data
  
  console.log(`Stock update for ${products?.length || 0} products`)

  if (!Array.isArray(products)) return

  for (const product of products) {
    const { sku, stock, warehouses } = product
    
    const totalStock = warehouses?.reduce((sum: number, w: any) => sum + (w.quantity || 0), 0) || stock || 0

    await supabase
      .from('supplier_products')
      .update({ 
        stock_quantity: totalStock,
        attributes: { warehouses, lastStockUpdate: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)
      .eq('supplier_name', 'BigBuy')

    // Check low stock alerts
    if (totalStock < 10) {
      await supabase.from('notifications').insert({
        type: 'low_stock',
        title: 'Stock faible BigBuy',
        message: `Le produit ${sku} n'a plus que ${totalStock} unités en stock`,
        severity: totalStock === 0 ? 'critical' : 'warning',
        metadata: { sku, stock: totalStock, supplier: 'BigBuy' }
      }).catch(() => {})
    }
  }
}

async function handlePriceUpdate(supabase: any, data: any) {
  const { products } = data
  
  console.log(`Price update for ${products?.length || 0} products`)

  if (!Array.isArray(products)) return

  for (const product of products) {
    const { sku, retailPrice, wholesalePrice, internalReference } = product
    
    const previousData = await supabase
      .from('supplier_products')
      .select('price, cost_price')
      .eq('sku', sku)
      .eq('supplier_name', 'BigBuy')
      .single()

    await supabase
      .from('supplier_products')
      .update({ 
        price: retailPrice,
        cost_price: wholesalePrice,
        attributes: { 
          previousPrice: previousData?.data?.price,
          priceUpdatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku)
      .eq('supplier_name', 'BigBuy')

    // Notify price change if significant (>5%)
    if (previousData?.data?.cost_price) {
      const priceDiff = Math.abs(wholesalePrice - previousData.data.cost_price) / previousData.data.cost_price
      if (priceDiff > 0.05) {
        await supabase.from('notifications').insert({
          type: 'price_change',
          title: 'Changement de prix BigBuy',
          message: `Le prix du produit ${sku} a changé de ${(priceDiff * 100).toFixed(1)}%`,
          severity: priceDiff > 0.15 ? 'warning' : 'info',
          metadata: { sku, oldPrice: previousData.data.cost_price, newPrice: wholesalePrice }
        }).catch(() => {})
      }
    }
  }
}

async function handleOrderStatusChange(supabase: any, data: any) {
  const { orderId, status, trackingNumber, carrier } = data
  
  console.log(`Order status change: ${orderId} -> ${status}`)

  await supabase
    .from('orders')
    .update({
      fulfillment_status: mapBigBuyStatus(status),
      tracking_number: trackingNumber,
      shipping_carrier: carrier,
      updated_at: new Date().toISOString()
    })
    .eq('metadata->bigbuy_order_id', orderId)
}

async function handleOrderShipped(supabase: any, data: any) {
  const { orderId, trackingNumber, carrier, estimatedDelivery } = data
  
  console.log(`Order shipped: ${orderId}, tracking: ${trackingNumber}`)

  await supabase
    .from('orders')
    .update({
      fulfillment_status: 'shipped',
      tracking_number: trackingNumber,
      shipping_carrier: carrier,
      metadata: { 
        bigbuy_order_id: orderId,
        estimatedDelivery,
        shippedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->bigbuy_order_id', orderId)
}

async function handleOrderDelivered(supabase: any, data: any) {
  const { orderId, deliveredAt } = data
  
  console.log(`Order delivered: ${orderId}`)

  await supabase
    .from('orders')
    .update({
      fulfillment_status: 'delivered',
      metadata: { 
        bigbuy_order_id: orderId,
        deliveredAt: deliveredAt || new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    })
    .eq('metadata->bigbuy_order_id', orderId)
}

function mapBigBuyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'processing',
    'shipped': 'shipped',
    'in_transit': 'in_transit',
    'out_for_delivery': 'out_for_delivery',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'returned'
  }
  return statusMap[status?.toLowerCase()] || 'processing'
}
