import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wc-webhook-source, x-wc-webhook-topic, x-wc-webhook-signature',
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
    const source = req.headers.get('x-wc-webhook-source')
    const topic = req.headers.get('x-wc-webhook-topic')
    const signature = req.headers.get('x-wc-webhook-signature')
    
    if (!topic || !source) {
      return new Response(JSON.stringify({ error: 'Missing required WooCommerce headers' }), {
        status: 400,
        headers: corsHeaders
      })
    }

    const body = await req.text()
    
    try {
      const data = JSON.parse(body)
      
      console.log(`Processing WooCommerce webhook: ${topic} from ${source}`)

      // Extract shop domain from source URL
      const shopDomain = new URL(source).hostname

      // Handle different webhook types
      switch (topic) {
        case 'product.updated':
          await handleProductUpdate(supabaseClient, data, shopDomain)
          break
          
        case 'product.created':
          await handleProductCreate(supabaseClient, data, shopDomain)
          break
          
        case 'order.created':
          await handleOrderCreate(supabaseClient, data, shopDomain)
          break
          
        case 'order.updated':
          await handleOrderUpdate(supabaseClient, data, shopDomain)
          break
          
        case 'customer.created':
          await handleCustomerCreate(supabaseClient, data, shopDomain)
          break
          
        default:
          console.log(`Unhandled WooCommerce webhook topic: ${topic}`)
      }

      // Log webhook event
      await supabaseClient
        .from('webhook_events')
        .insert({
          source: 'woocommerce',
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
    console.error('WooCommerce webhook error:', error)
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
      .eq('platform_url', `https://${shopDomain}`)
      .eq('platform_type', 'woocommerce')
      .single()

    if (!integration) {
      console.log(`No integration found for shop domain: ${shopDomain}`)
      return
    }

    // Handle product variations
    const variants = product.variations && product.variations.length > 0
    
    if (variants) {
      // Handle variable product
      for (const variationId of product.variations) {
        // In a real implementation, you'd fetch variation details
        // For now, we'll create a basic record
        await upsertProduct(supabase, integration.user_id, {
          ...product,
          id: `${product.id}-${variationId}`,
          is_variation: true,
          parent_id: product.id
        })
      }
    } else {
      // Handle simple product
      await upsertProduct(supabase, integration.user_id, product)
    }

    console.log(`Updated WooCommerce product: ${product.name}`)
  } catch (error) {
    console.error('Error handling product update:', error)
  }
}

async function handleProductCreate(supabase: any, product: any, shopDomain: string) {
  // Same logic as update for new products
  await handleProductUpdate(supabase, product, shopDomain)
}

async function upsertProduct(supabase: any, userId: string, product: any) {
  const productData = {
    user_id: userId,
    supplier_product_id: product.id.toString(),
    name: product.name,
    description: product.description || product.short_description || '',
    price: parseFloat(product.price || '0'),
    cost_price: parseFloat(product.cost_price || '0'),
    sku: product.sku || '',
    category: product.categories?.[0]?.name || 'General',
    brand: product.brands?.[0]?.name || '',
    image_urls: product.images?.map((img: any) => img.src) || [],
    stock_quantity: product.stock_quantity || 0,
    supplier_name: 'WooCommerce',
    status: product.status === 'publish' ? 'published' : 'draft',
    tags: product.tags?.map((tag: any) => tag.name) || [],
    attributes: product.attributes?.reduce((acc: any, attr: any) => {
      acc[attr.name] = attr.options?.join(', ') || ''
      return acc
    }, {}),
    updated_at: new Date().toISOString()
  }

  await supabase
    .from('imported_products')
    .upsert(productData, { 
      onConflict: 'user_id,supplier_product_id,supplier_name' 
    })
}

async function handleOrderCreate(supabase: any, order: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('platform_url', `https://${shopDomain}`)
      .eq('platform_type', 'woocommerce')
      .single()

    if (!integration) {
      console.log(`No integration found for shop domain: ${shopDomain}`)
      return
    }

    // Create or find customer
    let customerId = null
    if (order.customer_id && order.customer_id > 0) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', integration.user_id)
        .eq('email', order.billing.email)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            user_id: integration.user_id,
            name: `${order.billing.first_name} ${order.billing.last_name}`,
            email: order.billing.email,
            phone: order.billing.phone,
            address: {
              billing: order.billing,
              shipping: order.shipping
            }
          })
          .select()
          .single()

        customerId = newCustomer?.id
      }
    }

    // Create order record
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: integration.user_id,
        customer_id: customerId,
        order_number: order.number || `WC-${order.id}`,
        total_amount: parseFloat(order.total || '0'),
        status: mapWooCommerceOrderStatus(order.status),
        external_order_id: order.id.toString(),
        platform: 'woocommerce',
        customer_data: {
          email: order.billing.email,
          name: `${order.billing.first_name} ${order.billing.last_name}`,
          phone: order.billing.phone
        },
        shipping_address: order.shipping,
        order_date: order.date_created
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
          product_name: item.name,
          sku: item.sku,
          qty: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.total)
        })
    }

    console.log(`Created WooCommerce order: ${order.number}`)
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
      .eq('platform_url', `https://${shopDomain}`)
      .eq('platform_type', 'woocommerce')
      .single()

    if (!integration) return

    // Update order status
    await supabase
      .from('orders')
      .update({
        status: mapWooCommerceOrderStatus(order.status),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', integration.user_id)
      .eq('external_order_id', order.id.toString())

    console.log(`Updated WooCommerce order: ${order.number}`)
  } catch (error) {
    console.error('Error handling order update:', error)
  }
}

async function handleCustomerCreate(supabase: any, customer: any, shopDomain: string) {
  try {
    // Find user by shop domain
    const { data: integration } = await supabase
      .from('integrations')
      .select('user_id')
      .eq('platform_url', `https://${shopDomain}`)
      .eq('platform_type', 'woocommerce')
      .single()

    if (!integration) return

    // Create customer record
    await supabase
      .from('customers')
      .insert({
        user_id: integration.user_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        phone: customer.billing?.phone,
        address: {
          billing: customer.billing,
          shipping: customer.shipping
        },
        total_spent: parseFloat(customer.total_spent || '0'),
        total_orders: customer.orders_count || 0
      })

    console.log(`Created WooCommerce customer: ${customer.email}`)
  } catch (error) {
    console.error('Error handling customer creation:', error)
  }
}

function mapWooCommerceOrderStatus(status: string): string {
  switch (status) {
    case 'pending':
      return 'pending'
    case 'processing':
      return 'processing'
    case 'on-hold':
      return 'on_hold'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    case 'failed':
      return 'failed'
    default:
      return 'pending'
  }
}