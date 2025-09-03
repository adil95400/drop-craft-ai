import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-shopify-shop-domain',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook headers
    const topic = req.headers.get('x-shopify-topic')
    const hmac = req.headers.get('x-shopify-hmac-sha256')
    const shopDomain = req.headers.get('x-shopify-shop-domain')
    
    if (!topic || !hmac || !shopDomain) {
      return new Response(JSON.stringify({ error: 'Missing required Shopify headers' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    // Verify webhook authenticity (simplified - implement proper HMAC verification in production)
    const body = await req.text()
    
    try {
      const data = JSON.parse(body)
      
      console.log(`Processing Shopify webhook: ${topic} from ${shopDomain}`)

      // Handle different webhook types
      switch (topic) {
        case 'products/update':
          await handleProductUpdate(supabaseClient, data, shopDomain)
          break
          
        case 'inventory_levels/update':
          await handleInventoryUpdate(supabaseClient, data, shopDomain)
          break
          
        case 'orders/create':
          await handleOrderCreate(supabaseClient, data, shopDomain)
          break
          
        case 'orders/updated':
          await handleOrderUpdate(supabaseClient, data, shopDomain)
          break
          
        case 'orders/paid':
          await handleOrderPaid(supabaseClient, data, shopDomain)
          break
          
        default:
          console.log(`Unhandled Shopify webhook topic: ${topic}`)
      }

      // Log webhook event
      await supabaseClient
        .from('webhook_events')
        .insert({
          source: 'shopify',
          event_type: topic,
          shop_domain: shopDomain,
          data: data,
          processed_at: new Date().toISOString(),
          status: 'processed'
        })

    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError)
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Shopify webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleProductUpdate(supabase: any, product: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .eq('platform_type', 'shopify')
      .single()

    if (!integration) {
      console.log(`No integration found for shop domain: ${shopDomain}`)
      return
    }

    // Update or create product
    const productData = {
      user_id: integration.user_id,
      supplier_product_id: product.id.toString(),
      name: product.title,
      description: product.body_html || '',
      price: parseFloat(product.variants?.[0]?.price || '0'),
      sku: product.variants?.[0]?.sku || '',
      category: product.product_type || 'General',
      brand: product.vendor || '',
      image_urls: product.images?.map((img: any) => img.src) || [],
      supplier_name: 'Shopify',
      status: product.status === 'active' ? 'published' : 'draft',
      updated_at: new Date().toISOString()
    }

    await supabase
      .from('imported_products')
      .upsert(productData, { 
        onConflict: 'user_id,supplier_product_id,supplier_name' 
      })

    console.log(`Updated product: ${product.title}`)
  } catch (error) {
    console.error('Error handling product update:', error)
  }
}

async function handleInventoryUpdate(supabase: any, inventoryLevel: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .eq('platform_type', 'shopify')
      .single()

    if (!integration) {
      console.log(`No integration found for shop domain: ${shopDomain}`)
      return
    }

    // Get variant info to find SKU
    const variantResponse = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/variants/${inventoryLevel.inventory_item_id}.json`, {
      headers: {
        'X-Shopify-Access-Token': integration.access_token
      }
    })
    
    if (!variantResponse.ok) {
      console.log('Could not fetch variant information')
      return
    }
    
    const variantData = await variantResponse.json()
    const sku = variantData.variant?.sku

    if (sku) {
      // Update inventory in our database
      await supabase
        .from('imported_products')
        .update({ 
          stock_quantity: inventoryLevel.available,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', integration.user_id)
        .eq('sku', sku)
        .eq('supplier_name', 'Shopify')

      console.log(`Updated inventory for SKU ${sku}: ${inventoryLevel.available} units`)
    }
  } catch (error) {
    console.error('Error handling inventory update:', error)
  }
}

async function handleOrderCreate(supabase: any, order: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .eq('platform_type', 'shopify')
      .single()

    if (!integration) {
      console.log(`No integration found for shop domain: ${shopDomain}`)
      return
    }

    // Create order record
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: integration.user_id,
        order_number: order.name || `SHOP-${order.id}`,
        total_amount: parseFloat(order.total_price || '0'),
        status: 'pending',
        external_order_id: order.id.toString(),
        platform: 'shopify',
        customer_data: {
          email: order.email,
          name: `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`,
          phone: order.shipping_address?.phone
        },
        shipping_address: order.shipping_address,
        order_date: order.created_at
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return
    }

    // Create order items
    for (const item of order.line_items || []) {
      await supabase
        .from('order_items')
        .insert({
          order_id: orderRecord.id,
          product_name: item.title,
          sku: item.sku,
          qty: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity
        })
    }

    console.log(`Created order: ${order.name}`)
  } catch (error) {
    console.error('Error handling order creation:', error)
  }
}

async function handleOrderUpdate(supabase: any, order: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .eq('platform_type', 'shopify')
      .single()

    if (!integration) return

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: mapShopifyOrderStatus(order.fulfillment_status),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', integration.user_id)
      .eq('external_order_id', order.id.toString())

    console.log(`Updated order: ${order.name}`)
  } catch (error) {
    console.error('Error handling order update:', error)
  }
}

async function handleOrderPaid(supabase: any, order: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('shop_domain', shopDomain)
      .eq('platform_type', 'shopify')
      .single()

    if (!integration) return

    // Update order to paid status
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', integration.user_id)
      .eq('external_order_id', order.id.toString())

    console.log(`Order paid: ${order.name}`)
  } catch (error) {
    console.error('Error handling order paid:', error)
  }
}

function mapShopifyOrderStatus(fulfillmentStatus: string): string {
  switch (fulfillmentStatus) {
    case 'fulfilled':
      return 'shipped'
    case 'partial':
      return 'processing'
    case 'unfulfilled':
    case null:
      return 'pending'
    default:
      return 'pending'
  }
}