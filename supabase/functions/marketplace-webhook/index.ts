import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WebhookPayload {
  marketplace: 'shopify' | 'amazon' | 'ebay' | 'etsy'
  event_type: 'order_created' | 'product_updated' | 'stock_updated' | 'price_changed'
  data: any
  timestamp: string
}

/**
 * Universal webhook handler for marketplace events
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Extract marketplace from path or header
    const url = new URL(req.url)
    const marketplace = url.searchParams.get('marketplace') || req.headers.get('X-Marketplace')
    
    if (!marketplace) {
      throw new Error('Marketplace not specified')
    }

    const payload: WebhookPayload = await req.json()
    
    console.log(`Webhook received from ${marketplace}:`, payload.event_type)

    // Get user from marketplace connection
    const { data: connection } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('platform_name', marketplace)
      .eq('connection_status', 'connected')
      .single()

    if (!connection) {
      throw new Error(`No active connection found for ${marketplace}`)
    }

    const userId = connection.user_id

    // Process event based on type
    switch (payload.event_type) {
      case 'order_created':
        await handleOrderCreated(supabase, userId, marketplace, payload.data)
        break
      
      case 'product_updated':
        await handleProductUpdated(supabase, userId, marketplace, payload.data)
        break
      
      case 'stock_updated':
        await handleStockUpdated(supabase, userId, marketplace, payload.data)
        break
      
      case 'price_changed':
        await handlePriceChanged(supabase, userId, marketplace, payload.data)
        break
      
      default:
        console.log('Unhandled event type:', payload.event_type)
    }

    // Log webhook receipt
    await supabase
      .from('webhook_logs')
      .insert({
        user_id: userId,
        marketplace,
        event_type: payload.event_type,
        payload: payload.data,
        processed_at: new Date().toISOString(),
        status: 'success'
      })

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleOrderCreated(supabase: any, userId: string, marketplace: string, data: any) {
  console.log('Creating order from webhook:', data)
  
  const orderNumber = data.order_id || data.id || `${marketplace}-${Date.now()}`
  
  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      platform_order_id: data.id,
      status: 'pending',
      total_amount: data.total || data.total_price || 0,
      currency: data.currency || 'EUR',
      customer_id: data.customer_id,
      shipping_address: data.shipping_address,
      billing_address: data.billing_address,
      payment_status: data.financial_status === 'paid' ? 'paid' : 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Create order items
  if (data.line_items && Array.isArray(data.line_items)) {
    const orderItems = data.line_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku
    }))

    await supabase.from('order_items').insert(orderItems)
  }

  // Create notification
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type: 'order_created',
      title: `Nouvelle commande ${marketplace}`,
      message: `Commande ${orderNumber} reçue de ${marketplace}`,
      severity: 'info',
      metadata: { order_id: order.id, marketplace }
    })
}

async function handleProductUpdated(supabase: any, userId: string, marketplace: string, data: any) {
  console.log('Updating product from webhook:', data)
  
  const { data: product } = await supabase
    .from('marketplace_products')
    .select('product_id')
    .eq('user_id', userId)
    .eq('marketplace', marketplace)
    .eq('external_product_id', data.id)
    .single()

  if (product) {
    await supabase
      .from('products')
      .update({
        name: data.title || data.name,
        description: data.description,
        price: data.price,
        stock_quantity: data.inventory_quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.product_id)
  }
}

async function handleStockUpdated(supabase: any, userId: string, marketplace: string, data: any) {
  console.log('Updating stock from webhook:', data)
  
  const { data: product } = await supabase
    .from('marketplace_products')
    .select('product_id')
    .eq('user_id', userId)
    .eq('marketplace', marketplace)
    .eq('external_product_id', data.id)
    .single()

  if (product) {
    await supabase
      .from('products')
      .update({
        stock_quantity: data.inventory_quantity || data.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.product_id)

    // Create notification if low stock
    if ((data.inventory_quantity || data.quantity) < 10) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'low_stock',
          title: 'Stock faible',
          message: `Stock faible pour produit sur ${marketplace}`,
          severity: 'warning',
          metadata: { product_id: product.product_id, marketplace, stock: data.inventory_quantity }
        })
    }
  }
}

async function handlePriceChanged(supabase: any, userId: string, marketplace: string, data: any) {
  console.log('Updating price from webhook:', data)
  
  const { data: product } = await supabase
    .from('marketplace_products')
    .select('product_id, price')
    .eq('user_id', userId)
    .eq('marketplace', marketplace)
    .eq('external_product_id', data.id)
    .single()

  if (product) {
    const oldPrice = product.price
    const newPrice = data.price

    await supabase
      .from('marketplace_products')
      .update({
        price: newPrice,
        last_synced_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('marketplace', marketplace)
      .eq('external_product_id', data.id)

    // Log price change
    await supabase
      .from('price_history')
      .insert({
        product_id: product.product_id,
        old_price: oldPrice,
        new_price: newPrice,
        change_reason: `Webhook from ${marketplace}`,
        changed_by: userId
      })
  }
}
