import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { integrationId, type = 'products' } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer l'intégration depuis store_integrations
    const { data: integration, error: integrationError } = await supabaseClient
      .from('store_integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (integrationError || !integration) {
      throw new Error('Intégration non trouvée')
    }

    // Les credentials sont stockés directement dans l'intégration
    const credentials = integration.credentials || {}
    
    if (!credentials.access_token || !credentials.shop_domain) {
      throw new Error('Credentials Shopify manquants')
    }

    const shopifyDomain = credentials.shop_domain
    const accessToken = credentials.access_token

    if (!shopifyDomain || !accessToken) {
      throw new Error('Configuration Shopify incomplète')
    }

    console.log(`Synchronisation ${type} pour ${shopifyDomain}`)

    if (type === 'products') {
      return await syncProducts(supabaseClient, integration, shopifyDomain, accessToken)
    } else if (type === 'orders') {
      return await syncOrders(supabaseClient, integration, shopifyDomain, accessToken)
    }

    throw new Error('Type de synchronisation non supporté')

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncProducts(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string) {
  let allProducts: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  // Récupérer tous les produits via pagination
  while (hasNextPage) {
    const url = `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur Shopify API: ${response.status}`)
    }

    const data = await response.json()
    allProducts = allProducts.concat(data.products || [])

    // Vérifier s'il y a une page suivante
    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`Récupéré ${allProducts.length} produits de Shopify`)

  // Transformer et insérer les produits
  const productsToInsert = allProducts.map(product => ({
    user_id: integration.user_id,
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants?.[0]?.price || '0'),
    cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0'),
    sku: product.variants?.[0]?.sku || '',
    category: product.product_type || 'Général',
    image_url: product.images?.[0]?.src || null,
    stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    status: product.status === 'active' ? 'active' as const : 'inactive' as const,
    external_id: product.id.toString(),
    external_platform: 'shopify',
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    shopify_data: {
      handle: product.handle,
      vendor: product.vendor,
      created_at: product.created_at,
      updated_at: product.updated_at,
      variants: product.variants
    }
  }))

  // Upsert des produits (mise à jour si existe, création sinon)
  for (const product of productsToInsert) {
    const { error } = await supabaseClient
      .from('products')
      .upsert(product, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Erreur insertion produit:', error)
    }
  }

  // Mettre à jour le statut de l'intégration
  await supabaseClient
    .from('store_integrations')
    .update({ 
      connection_status: 'connected',
      last_sync_at: new Date().toISOString(),
      product_count: productsToInsert.length
    })
    .eq('id', integration.id)

  return new Response(
    JSON.stringify({ 
      success: true, 
      imported: productsToInsert.length,
      message: `${productsToInsert.length} produits synchronisés depuis Shopify`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncOrders(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string) {
  let allOrders: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  // Récupérer toutes les commandes des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  while (hasNextPage) {
    const url = `https://${shopifyDomain}/admin/api/2023-10/orders.json?limit=250&status=any&created_at_min=${thirtyDaysAgo.toISOString()}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur Shopify API Orders: ${response.status}`)
    }

    const data = await response.json()
    allOrders = allOrders.concat(data.orders || [])

    // Pagination
    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`Récupéré ${allOrders.length} commandes de Shopify`)

  // Transformer et insérer les commandes
  for (const order of allOrders) {
    // Créer ou récupérer le client
    let customer_id = null
    if (order.customer) {
      const { data: existingCustomer } = await supabaseClient
        .from('customers')
        .select('id')
        .eq('email', order.customer.email)
        .eq('user_id', integration.user_id)
        .single()

      if (existingCustomer) {
        customer_id = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabaseClient
          .from('customers')
          .insert({
            user_id: integration.user_id,
            name: `${order.customer.first_name} ${order.customer.last_name}`,
            email: order.customer.email,
            phone: order.customer.phone,
            country: order.shipping_address?.country
          })
          .select('id')
          .single()

        if (!customerError && newCustomer) {
          customer_id = newCustomer.id
        }
      }
    }

    // Mapper le statut Shopify vers notre système
    const mapShopifyStatus = (shopifyStatus: string, fulfillmentStatus: string) => {
      if (shopifyStatus === 'cancelled') return 'cancelled'
      if (fulfillmentStatus === 'fulfilled') return 'delivered'
      if (fulfillmentStatus === 'partial') return 'shipped'
      if (shopifyStatus === 'open') return 'processing'
      return 'pending'
    }

    const orderToInsert = {
      user_id: integration.user_id,
      customer_id,
      order_number: order.order_number.toString(),
      status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
      total_amount: parseFloat(order.total_price || '0'),
      currency: order.currency,
      payment_status: order.financial_status === 'paid' ? 'paid' as const : 'pending' as const,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      external_id: order.id.toString(),
      external_platform: 'shopify',
      order_items: order.line_items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        sku: item.sku,
        variant_title: item.variant_title
      })),
      shopify_data: {
        tags: order.tags,
        note: order.note,
        created_at: order.created_at,
        processed_at: order.processed_at
      },
      created_at: order.created_at,
      updated_at: order.updated_at
    }

    // Upsert de la commande
    const { error } = await supabaseClient
      .from('orders')
      .upsert(orderToInsert, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Erreur insertion commande:', error)
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      imported: allOrders.length,
      message: `${allOrders.length} commandes synchronisées depuis Shopify`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}