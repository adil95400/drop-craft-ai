import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-matterhorn-signature',
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

    const payload = await req.json()
    const eventType = payload.event || payload.type || 'unknown'

    console.log(`🏔️ Matterhorn Webhook: ${eventType}`)

    await supabase.from('webhook_logs').insert({
      source: 'matterhorn',
      event_type: eventType,
      payload: payload
    }).catch(e => console.log('Webhook log failed:', e.message))

    switch (eventType) {
      case 'stock_update':
        await handleStockUpdate(supabase, payload.data || payload)
        break
      case 'price_update':
        await handlePriceUpdate(supabase, payload.data || payload)
        break
      case 'product_update':
        await handleProductUpdate(supabase, payload.data || payload)
        break
      case 'order_update':
        await handleOrderUpdate(supabase, payload.data || payload)
        break
      default:
        console.log('Unknown Matterhorn event:', eventType)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Matterhorn Webhook error:', error)
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleStockUpdate(supabase: any, data: any) {
  const products = Array.isArray(data) ? data : [data]
  
  for (const item of products) {
    const { ean, sku, stock, quantity } = item
    const stockValue = stock ?? quantity ?? 0
    const identifier = ean || sku

    if (!identifier) continue

    await supabase
      .from('supplier_products')
      .update({ 
        stock_quantity: stockValue,
        updated_at: new Date().toISOString()
      })
      .eq('supplier_name', 'Matterhorn')
      .or(`sku.eq.${identifier},external_id.eq.${identifier}`)

    if (stockValue < 5) {
      await supabase.from('notifications').insert({
        type: 'low_stock',
        title: 'Stock faible Matterhorn',
        message: `Produit ${identifier}: ${stockValue} unités restantes`,
        severity: stockValue === 0 ? 'critical' : 'warning',
        metadata: { identifier, stock: stockValue, supplier: 'Matterhorn' }
      }).catch(() => {})
    }
  }
}

async function handlePriceUpdate(supabase: any, data: any) {
  const products = Array.isArray(data) ? data : [data]
  
  for (const item of products) {
    const { ean, sku, price, wholesale_price } = item
    const identifier = ean || sku

    if (!identifier) continue

    await supabase
      .from('supplier_products')
      .update({ 
        price: price,
        cost_price: wholesale_price,
        updated_at: new Date().toISOString()
      })
      .eq('supplier_name', 'Matterhorn')
      .or(`sku.eq.${identifier},external_id.eq.${identifier}`)
  }
}

async function handleProductUpdate(supabase: any, data: any) {
  const { ean, sku, name, description, images, category, is_active } = data
  const identifier = ean || sku

  if (!identifier) return

  const updateFields: Record<string, any> = { updated_at: new Date().toISOString() }
  
  if (name) updateFields.name = name
  if (description) updateFields.description = description
  if (images) updateFields.images = images
  if (category) updateFields.category = category
  if (typeof is_active === 'boolean') updateFields.is_active = is_active

  await supabase
    .from('supplier_products')
    .update(updateFields)
    .eq('supplier_name', 'Matterhorn')
    .or(`sku.eq.${identifier},external_id.eq.${identifier}`)
}

async function handleOrderUpdate(supabase: any, data: any) {
  const { order_id, status, tracking_number, carrier } = data

  if (!order_id) return

  await supabase
    .from('orders')
    .update({
      fulfillment_status: status,
      tracking_number,
      shipping_carrier: carrier,
      updated_at: new Date().toISOString()
    })
    .eq('metadata->matterhorn_order_id', order_id)
}
