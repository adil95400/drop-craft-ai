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
    const requestBody = await req.json()
    console.log('Request received:', JSON.stringify(requestBody, null, 2))
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Support both operation formats
    if (requestBody.operation) {
      // New unified format
      return await handleUnifiedOperation(supabaseClient, requestBody)
    } else {
      // Legacy format support
      return await handleLegacyOperation(supabaseClient, requestBody)
    }

  } catch (error) {
    console.error('Shopify Operations Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleUnifiedOperation(supabaseClient: any, requestBody: any) {
  const { operation, integrationId, credentials, platform = 'shopify' } = requestBody

  switch (operation) {
    case 'test_connection':
      return await testShopifyConnection(supabaseClient, credentials, integrationId)
    case 'sync_products':
      return await syncShopifyData(supabaseClient, integrationId, 'products')
    case 'sync_orders':
      return await syncShopifyData(supabaseClient, integrationId, 'orders')
    case 'sync_full':
      return await syncShopifyData(supabaseClient, integrationId, 'full')
    default:
      throw new Error(`Opération non supportée: ${operation}`)
  }
}

async function handleLegacyOperation(supabaseClient: any, requestBody: any) {
  if (requestBody.platform === 'shopify' && requestBody.credentials) {
    // Legacy test connection format
    return await testShopifyConnection(supabaseClient, requestBody.credentials, requestBody.integrationId)
  } else if (requestBody.integrationId && requestBody.type) {
    // Legacy sync format
    return await syncShopifyData(supabaseClient, requestBody.integrationId, requestBody.type)
  } else {
    throw new Error('Format de requête non reconnu')
  }
}

function normalizeShopifyDomain(domain: string): string {
  if (!domain) {
    throw new Error('Domaine Shopify requis')
  }
  
  // Remove any protocol
  domain = domain.replace(/^https?:\/\//, '')
  
  // Remove trailing slash
  domain = domain.replace(/\/$/, '')
  
  // If it doesn't end with .myshopify.com, add it
  if (!domain.endsWith('.myshopify.com')) {
    domain = `${domain}.myshopify.com`
  }
  
  console.log(`Domain normalized: ${domain}`)
  return domain
}

async function testShopifyConnection(supabaseClient: any, credentials: any, integrationId?: string) {
  console.log('Testing Shopify connection...')
  
  if (!credentials?.shop_domain || !credentials?.access_token) {
    throw new Error('Domaine de boutique et token d\'accès requis')
  }

  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  
  try {
    const response = await fetch(`https://${normalizedDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': credentials.access_token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token d\'accès invalide. Vérifiez vos credentials Shopify.')
      }
      if (response.status === 403) {
        throw new Error('Accès refusé. Vérifiez les permissions de votre token.')
      }
      if (response.status === 404) {
        throw new Error('Boutique introuvable. Vérifiez le domaine de votre boutique.')
      }
      throw new Error(`Erreur Shopify API (${response.status}): ${response.statusText}`)
    }

    const shopData = await response.json()
    console.log('Connection successful for shop:', shopData.shop?.name)

    // Update integration if ID provided
    if (integrationId) {
      const { error } = await supabaseClient
        .from('store_integrations')
        .update({
          connection_status: 'connected',
          store_name: shopData.shop?.name || 'Boutique Shopify',
          store_url: `https://${normalizedDomain}`,
          credentials: {
            shop_domain: normalizedDomain,
            access_token: credentials.access_token
          }
        })
        .eq('id', integrationId)

      if (error) {
        console.error('Error updating integration:', error)
      } else {
        console.log('Integration updated successfully')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        shop: shopData.shop,
        message: `Connexion réussie à ${shopData.shop?.name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Shopify connection test failed:', error)
    throw error
  }
}

async function syncShopifyData(supabaseClient: any, integrationId: string, type: 'products' | 'orders' | 'full') {
  console.log(`Starting sync ${type} for integration ${integrationId}`)

  // Get integration details
  const { data: integration, error: integrationError } = await supabaseClient
    .from('store_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (integrationError || !integration) {
    throw new Error('Intégration non trouvée')
  }

  const credentials = integration.credentials || {}
  
  if (!credentials.access_token || !credentials.shop_domain) {
    throw new Error('Configuration Shopify manquante. Veuillez tester la connexion d\'abord.')
  }

  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  const accessToken = credentials.access_token

  let results = { products: 0, orders: 0 }

  // Update status to syncing
  await supabaseClient
    .from('store_integrations')
    .update({ connection_status: 'syncing' })
    .eq('id', integrationId)

  try {
    if (type === 'full' || type === 'products') {
      const productsResult = await syncProducts(supabaseClient, integration, normalizedDomain, accessToken)
      results.products = productsResult.imported
    }

    if (type === 'full' || type === 'orders') {
      const ordersResult = await syncOrders(supabaseClient, integration, normalizedDomain, accessToken)
      results.orders = ordersResult.imported
    }

    // Update final status
    await supabaseClient
      .from('store_integrations')
      .update({
        connection_status: 'connected',
        last_sync_at: new Date().toISOString(),
        product_count: type === 'products' || type === 'full' ? results.products : integration.product_count,
        order_count: type === 'orders' || type === 'full' ? results.orders : integration.order_count
      })
      .eq('id', integrationId)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        message: `Synchronisation terminée: ${results.products} produits, ${results.orders} commandes`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    
    // Update status to error
    await supabaseClient
      .from('store_integrations')
      .update({ connection_status: 'error' })
      .eq('id', integrationId)
    
    throw error
  }
}

async function syncProducts(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string) {
  console.log(`Syncing products from ${shopifyDomain}`)
  
  let allProducts: any[] = []
  let nextPageInfo = null
  let hasNextPage = true
  let pageCount = 0

  // Fetch all products with pagination
  while (hasNextPage && pageCount < 50) { // Safety limit
    pageCount++
    
    const url = `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    console.log(`Fetching products page ${pageCount} from: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API Shopify produits (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    const products = data.products || []
    allProducts = allProducts.concat(products)
    
    console.log(`Page ${pageCount}: ${products.length} products, total: ${allProducts.length}`)

    // Check for next page
    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`Total products fetched: ${allProducts.length}`)

  // Transform and insert products
  const productsToInsert = allProducts.map(product => ({
    user_id: integration.user_id,
    name: product.title || 'Produit sans nom',
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

  // Batch upsert products
  let inserted = 0
  for (let i = 0; i < productsToInsert.length; i += 100) {
    const batch = productsToInsert.slice(i, i + 100)
    
    const { error } = await supabaseClient
      .from('products')
      .upsert(batch, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error upserting products batch:', error)
      throw error
    }
    
    inserted += batch.length
    console.log(`Inserted batch ${Math.floor(i/100) + 1}, total: ${inserted}`)
  }

  return { imported: productsToInsert.length }
}

async function syncOrders(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string) {
  console.log(`Syncing orders from ${shopifyDomain}`)
  
  let allOrders: any[] = []
  let nextPageInfo = null
  let hasNextPage = true
  let pageCount = 0

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch orders with pagination
  while (hasNextPage && pageCount < 50) { // Safety limit
    pageCount++
    
    const url = `https://${shopifyDomain}/admin/api/2023-10/orders.json?limit=250&status=any&created_at_min=${thirtyDaysAgo.toISOString()}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    console.log(`Fetching orders page ${pageCount}`)
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erreur API Shopify commandes (${response.status}): ${response.statusText}`)
    }

    const data = await response.json()
    const orders = data.orders || []
    allOrders = allOrders.concat(orders)
    
    console.log(`Page ${pageCount}: ${orders.length} orders, total: ${allOrders.length}`)

    // Check for next page
    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`Total orders fetched: ${allOrders.length}`)

  // Process orders
  let ordersProcessed = 0
  for (const order of allOrders) {
    try {
      // Handle customer
      let customer_id = null
      if (order.customer?.email) {
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
              name: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Client anonyme',
              email: order.customer.email,
              phone: order.customer.phone || null,
              country: order.shipping_address?.country || null
            })
            .select('id')
            .single()

          if (!customerError && newCustomer) {
            customer_id = newCustomer.id
          }
        }
      }

      // Map Shopify status
      const mapShopifyStatus = (financialStatus: string, fulfillmentStatus: string) => {
        if (financialStatus === 'refunded') return 'cancelled'
        if (fulfillmentStatus === 'fulfilled') return 'delivered'
        if (fulfillmentStatus === 'partial') return 'shipped'
        if (financialStatus === 'paid') return 'processing'
        return 'pending'
      }

      const orderToInsert = {
        user_id: integration.user_id,
        customer_id,
        order_number: order.order_number?.toString() || order.id.toString(),
        status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
        total_amount: parseFloat(order.total_price || '0'),
        currency: order.currency || 'EUR',
        payment_status: order.financial_status === 'paid' ? 'paid' as const : 'pending' as const,
        shipping_address: order.shipping_address || {},
        billing_address: order.billing_address || {},
        external_id: order.id.toString(),
        external_platform: 'shopify',
        order_items: order.line_items?.map((item: any) => ({
          name: item.name || 'Article',
          quantity: item.quantity || 1,
          price: parseFloat(item.price || '0'),
          sku: item.sku || '',
          variant_title: item.variant_title || ''
        })) || [],
        created_at: order.created_at || new Date().toISOString(),
        updated_at: order.updated_at || new Date().toISOString()
      }

      // Upsert order
      const { error } = await supabaseClient
        .from('orders')
        .upsert(orderToInsert, { 
          onConflict: 'external_id,user_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error upserting order:', error)
      } else {
        ordersProcessed++
      }

    } catch (orderError) {
      console.error('Error processing order:', order.id, orderError)
    }
  }

  return { imported: ordersProcessed }
}