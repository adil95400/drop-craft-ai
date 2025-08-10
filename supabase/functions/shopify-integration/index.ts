import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { action, shop_domain, access_token, integration_id } = await req.json()

    switch (action) {
      case 'connect':
        return await connectShopify(shop_domain, access_token, supabaseClient)
      
      case 'sync_products':
        return await syncProducts(integration_id, supabaseClient)
      
      case 'sync_orders':
        return await syncOrders(integration_id, supabaseClient)
      
      case 'webhook':
        return await handleWebhook(req, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erreur Shopify integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function connectShopify(shopDomain: string, accessToken: string, supabase: any) {
  try {
    // Test connection
    const response = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Connexion Shopify échouée')
    }

    const shopData = await response.json()

    // Create webhooks
    await createWebhooks(shopDomain, accessToken)

    return new Response(
      JSON.stringify({ 
        success: true, 
        shop: shopData.shop,
        message: 'Connexion Shopify réussie'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function syncProducts(integrationId: string, supabase: any) {
  try {
    // Get integration details
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (!integration) {
      throw new Error('Intégration non trouvée')
    }

    // Fetch products from Shopify
    const response = await fetch(
      `https://${integration.shop_domain}.myshopify.com/admin/api/2023-10/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.access_token,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    const products = data.products || []

    // Import products into catalog_products
    let imported = 0
    for (const product of products) {
      const catalogProduct = {
        external_id: product.id.toString(),
        name: product.title,
        description: product.body_html,
        price: parseFloat(product.variants?.[0]?.price || '0'),
        image_url: product.image?.src,
        image_urls: product.images?.map((img: any) => img.src),
        supplier_id: integration.id,
        supplier_name: 'Shopify',
        supplier_url: `https://${integration.shop_domain}.myshopify.com`,
        category: product.product_type,
        tags: product.tags?.split(',').map((tag: string) => tag.trim()),
        stock_quantity: product.variants?.[0]?.inventory_quantity || 0,
        sku: product.variants?.[0]?.sku,
        availability_status: product.status === 'active' ? 'in_stock' : 'out_of_stock'
      }

      const { error } = await supabase
        .from('catalog_products')
        .upsert(catalogProduct, { onConflict: 'external_id,supplier_id' })

      if (!error) imported++
    }

    // Update integration sync status
    await supabase
      .from('integrations')
      .update({ 
        last_sync_at: new Date().toISOString(),
        connection_status: 'connected'
      })
      .eq('id', integrationId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        total: products.length,
        message: `${imported} produits synchronisés depuis Shopify`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erreur sync produits:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function syncOrders(integrationId: string, supabase: any) {
  try {
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (!integration) {
      throw new Error('Intégration non trouvée')
    }

    // Fetch orders from Shopify
    const response = await fetch(
      `https://${integration.shop_domain}.myshopify.com/admin/api/2023-10/orders.json?status=any&limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.access_token,
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    const orders = data.orders || []

    let imported = 0
    for (const order of orders) {
      // Import customer if not exists
      if (order.customer) {
        await supabase
          .from('customers')
          .upsert({
            shopify_id: order.customer.id,
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            email: order.customer.email,
            phone: order.customer.phone,
            user_id: integration.user_id,
            address: {
              shipping: order.shipping_address,
              billing: order.billing_address
            }
          }, { onConflict: 'shopify_id' })
      }

      // Import order
      const orderData = {
        shopify_id: order.id,
        order_number: order.order_number,
        user_id: integration.user_id,
        customer_id: order.customer?.id,
        total_amount: parseFloat(order.total_price),
        currency: order.currency,
        status: mapShopifyStatus(order.fulfillment_status, order.financial_status),
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        created_at: order.created_at
      }

      const { data: insertedOrder } = await supabase
        .from('orders')
        .upsert(orderData, { onConflict: 'shopify_id' })
        .select()
        .single()

      // Import order items
      if (insertedOrder && order.line_items) {
        for (const item of order.line_items) {
          await supabase
            .from('order_items')
            .upsert({
              order_id: insertedOrder.id,
              product_name: item.title,
              product_sku: item.sku,
              quantity: item.quantity,
              unit_price: parseFloat(item.price),
              total_price: parseFloat(item.price) * item.quantity
            })
        }
      }

      imported++
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        total: orders.length,
        message: `${imported} commandes synchronisées depuis Shopify`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erreur sync commandes:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createWebhooks(shopDomain: string, accessToken: string) {
  const webhooks = [
    {
      topic: 'products/create',
      address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-integration`,
      format: 'json'
    },
    {
      topic: 'products/update',
      address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-integration`,
      format: 'json'
    },
    {
      topic: 'orders/create',
      address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-integration`,
      format: 'json'
    },
    {
      topic: 'orders/updated',
      address: `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-integration`,
      format: 'json'
    }
  ]

  for (const webhook of webhooks) {
    await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ webhook })
    })
  }
}

async function handleWebhook(req: Request, supabase: any) {
  const topic = req.headers.get('x-shopify-topic')
  const body = await req.text()
  const data = JSON.parse(body)

  console.log(`Webhook reçu: ${topic}`, data)

  // Handle webhook based on topic
  switch (topic) {
    case 'products/create':
    case 'products/update':
      // Update product in catalog
      break
    case 'orders/create':
    case 'orders/updated':
      // Update order status
      break
  }

  return new Response('OK', { headers: corsHeaders })
}

function mapShopifyStatus(fulfillmentStatus: string, financialStatus: string): string {
  if (financialStatus === 'paid' && fulfillmentStatus === 'fulfilled') {
    return 'completed'
  } else if (financialStatus === 'paid' && !fulfillmentStatus) {
    return 'processing'
  } else if (financialStatus === 'pending') {
    return 'pending'
  }
  return 'cancelled'
}