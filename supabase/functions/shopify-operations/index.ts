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
  const { operation, storeId, integrationId, credentials, platform = 'shopify', operation_data } = requestBody

  // Support both storeId and integrationId for compatibility
  const targetId = storeId || integrationId

  switch (operation) {
    case 'test':
    case 'test_connection':
      return await testShopifyConnection(supabaseClient, credentials, targetId)
    case 'import-products':
    case 'sync_products':
      return await importShopifyProducts(supabaseClient, targetId, credentials)
    case 'import-orders':
    case 'sync_orders':
      return await importShopifyOrders(supabaseClient, targetId, credentials)
    case 'import-customers':
      return await importShopifyCustomers(supabaseClient, targetId, credentials)
    case 'export-products':
      return await exportProductsToShopify(supabaseClient, targetId, credentials, operation_data?.product_ids)
    case 'full-sync':
    case 'sync_full':
      return await performFullSync(supabaseClient, targetId, credentials)
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

// New import functions for better organization
async function importShopifyProducts(supabaseClient: any, storeId: string, credentials: any) {
  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  const accessToken = credentials.access_token

  console.log(`Starting product import for store: ${storeId}`)
  
  let allProducts = []
  let nextPageInfo = null
  let pageCount = 0
  const maxPages = 50

  // Update status to syncing
  await supabaseClient
    .from('store_integrations')
    .update({ connection_status: 'syncing' })
    .eq('id', storeId)
  
  do {
    pageCount++
    console.log(`Fetching products page ${pageCount}`)
    
    let url = `https://${normalizedDomain}/admin/api/2023-10/products.json?limit=250`
    if (nextPageInfo) {
      url += `&page_info=${nextPageInfo}`
    }
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    allProducts.push(...(data.products || []))
    
    const linkHeader = response.headers.get('Link')
    nextPageInfo = null
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        nextPageInfo = nextMatch[1]
      }
    }
    
    console.log(`Page ${pageCount}: ${data.products?.length || 0} products, total: ${allProducts.length}`)
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } while (nextPageInfo && pageCount < maxPages)
  
  console.log(`Total products fetched: ${allProducts.length}`)
  
  // Save to shopify_products table
  const batchSize = 100
  let importedCount = 0
  
  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize)
    const productData = batch.map(product => ({
      store_integration_id: storeId,
      shopify_product_id: product.id,
      title: product.title,
      description: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      status: product.status,
      price: product.variants?.[0]?.price ? parseFloat(product.variants[0].price) : 0,
      compare_at_price: product.variants?.[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : null,
      sku: product.variants?.[0]?.sku,
      inventory_quantity: product.variants?.[0]?.inventory_quantity || 0,
      image_url: product.image?.src,
      images: product.images?.map(img => img.src) || [],
      variants: product.variants || [],
      options: product.options || [],
      tags: product.tags?.split(',').map(tag => tag.trim()) || [],
      seo_title: product.title,
      seo_description: product.body_html?.replace(/<[^>]*>/g, '').substring(0, 160),
      created_at_shopify: product.created_at,
      updated_at_shopify: product.updated_at
    }))
    
    const { error: batchError } = await supabaseClient
      .from('shopify_products')
      .upsert(productData, { onConflict: 'store_integration_id,shopify_product_id' })
    
    if (batchError) {
      console.error('Error upserting products batch:', batchError)
      throw new Error(`Failed to save products: ${batchError.message}`)
    }
    
    importedCount += batch.length
    console.log(`Processed ${importedCount}/${allProducts.length} products`)
  }
  
  await supabaseClient
    .from('store_integrations')
    .update({ 
      product_count: allProducts.length,
      last_sync_at: new Date().toISOString(),
      connection_status: 'connected'
    })
    .eq('id', storeId)
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${allProducts.length} produits importés avec succès`,
      imported_count: allProducts.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function importShopifyOrders(supabaseClient: any, storeId: string, credentials: any) {
  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  const accessToken = credentials.access_token

  console.log(`Starting orders import for store: ${storeId}`)
  
  let allOrders = []
  let nextPageInfo = null
  let pageCount = 0
  const maxPages = 20
  
  do {
    pageCount++
    console.log(`Fetching orders page ${pageCount}`)
    
    let url = `https://${normalizedDomain}/admin/api/2023-10/orders.json?limit=250&status=any`
    if (nextPageInfo) {
      url += `&page_info=${nextPageInfo}`
    }
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    allOrders.push(...(data.orders || []))
    
    const linkHeader = response.headers.get('Link')
    nextPageInfo = null
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        nextPageInfo = nextMatch[1]
      }
    }
    
    console.log(`Page ${pageCount}: ${data.orders?.length || 0} orders, total: ${allOrders.length}`)
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } while (nextPageInfo && pageCount < maxPages)
  
  console.log(`Total orders fetched: ${allOrders.length}`)
  
  const batchSize = 50
  let importedCount = 0
  
  for (let i = 0; i < allOrders.length; i += batchSize) {
    const batch = allOrders.slice(i, i + batchSize)
    const orderData = batch.map(order => ({
      store_integration_id: storeId,
      shopify_order_id: order.id,
      order_number: order.order_number,
      email: order.email,
      total_price: parseFloat(order.total_price),
      subtotal_price: parseFloat(order.subtotal_price || 0),
      total_tax: parseFloat(order.total_tax || 0),
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      customer_id: order.customer?.id,
      billing_address: order.billing_address,
      shipping_address: order.shipping_address,
      line_items: order.line_items || [],
      shipping_lines: order.shipping_lines || [],
      tax_lines: order.tax_lines || [],
      order_status_url: order.order_status_url,
      created_at_shopify: order.created_at,
      updated_at_shopify: order.updated_at,
      processed_at_shopify: order.processed_at
    }))
    
    const { error: batchError } = await supabaseClient
      .from('shopify_orders')
      .upsert(orderData, { onConflict: 'store_integration_id,shopify_order_id' })
    
    if (batchError) {
      console.error('Error upserting orders batch:', batchError)
      throw new Error(`Failed to save orders: ${batchError.message}`)
    }
    
    importedCount += batch.length
    console.log(`Processed ${importedCount}/${allOrders.length} orders`)
  }
  
  await supabaseClient
    .from('store_integrations')
    .update({ 
      order_count: allOrders.length,
      last_sync_at: new Date().toISOString()
    })
    .eq('id', storeId)
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${allOrders.length} commandes importées avec succès`,
      imported_count: allOrders.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function importShopifyCustomers(supabaseClient: any, storeId: string, credentials: any) {
  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  const accessToken = credentials.access_token

  console.log(`Starting customers import for store: ${storeId}`)
  
  let allCustomers = []
  let nextPageInfo = null
  let pageCount = 0
  const maxPages = 20
  
  do {
    pageCount++
    console.log(`Fetching customers page ${pageCount}`)
    
    let url = `https://${normalizedDomain}/admin/api/2023-10/customers.json?limit=250`
    if (nextPageInfo) {
      url += `&page_info=${nextPageInfo}`
    }
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    allCustomers.push(...(data.customers || []))
    
    const linkHeader = response.headers.get('Link')
    nextPageInfo = null
    
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/)
      if (nextMatch) {
        nextPageInfo = nextMatch[1]
      }
    }
    
    console.log(`Page ${pageCount}: ${data.customers?.length || 0} customers, total: ${allCustomers.length}`)
    await new Promise(resolve => setTimeout(resolve, 500))
    
  } while (nextPageInfo && pageCount < maxPages)
  
  console.log(`Total customers fetched: ${allCustomers.length}`)
  
  const batchSize = 50
  let importedCount = 0
  
  for (let i = 0; i < allCustomers.length; i += batchSize) {
    const batch = allCustomers.slice(i, i + batchSize)
    const customerData = batch.map(customer => ({
      store_integration_id: storeId,
      shopify_customer_id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      verified_email: customer.verified_email,
      accepts_marketing: customer.accepts_marketing,
      state: customer.state,
      tags: customer.tags?.split(',').map(tag => tag.trim()) || [],
      total_spent: parseFloat(customer.total_spent || 0),
      orders_count: customer.orders_count || 0,
      default_address: customer.default_address,
      addresses: customer.addresses || [],
      created_at_shopify: customer.created_at,
      updated_at_shopify: customer.updated_at
    }))
    
    const { error: batchError } = await supabaseClient
      .from('shopify_customers')
      .upsert(customerData, { onConflict: 'store_integration_id,shopify_customer_id' })
    
    if (batchError) {
      console.error('Error upserting customers batch:', batchError)
      throw new Error(`Failed to save customers: ${batchError.message}`)
    }
    
    importedCount += batch.length
    console.log(`Processed ${importedCount}/${allCustomers.length} customers`)
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${allCustomers.length} clients importés avec succès`,
      imported_count: allCustomers.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function exportProductsToShopify(supabaseClient: any, storeId: string, credentials: any, productIds?: string[]) {
  const normalizedDomain = normalizeShopifyDomain(credentials.shop_domain)
  const accessToken = credentials.access_token

  console.log(`Starting product export to Shopify for store: ${storeId}`)
  
  // Get store integration to find user_id
  const { data: store, error: storeError } = await supabaseClient
    .from('store_integrations')
    .select('user_id')
    .eq('id', storeId)
    .single()

  if (storeError || !store) {
    throw new Error('Store not found')
  }
  
  let query = supabaseClient
    .from('products')
    .select('*')
    .eq('user_id', store.user_id)
  
  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds)
  }
  
  const { data: products, error: fetchError } = await query
  
  if (fetchError) {
    throw new Error(`Failed to fetch products: ${fetchError.message}`)
  }
  
  if (!products || products.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Aucun produit à exporter'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  console.log(`Exporting ${products.length} products to Shopify`)
  
  let exportedCount = 0
  let errors = []
  
  for (const product of products) {
    try {
      const shopifyProduct = {
        title: product.name,
        body_html: product.description,
        vendor: product.brand || 'Default',
        product_type: product.category || 'Default',
        status: 'active',
        variants: [{
          price: product.price.toString(),
          sku: product.sku,
          inventory_quantity: product.stock_quantity || 0,
          inventory_management: 'shopify'
        }],
        images: product.image_urls?.map(url => ({ src: url })) || []
      }
      
      const response = await fetch(`https://${normalizedDomain}/admin/api/2023-10/products.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product: shopifyProduct })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        errors.push(`Produit ${product.name}: ${errorData}`)
        continue
      }
      
      const createdProduct = await response.json()
      exportedCount++
      
      console.log(`Exported product: ${product.name} -> Shopify ID: ${createdProduct.product.id}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      errors.push(`Produit ${product.name}: ${error.message}`)
    }
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `${exportedCount}/${products.length} produits exportés vers Shopify`,
      exported_count: exportedCount,
      errors: errors
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function performFullSync(supabaseClient: any, storeId: string, credentials: any) {
  console.log(`Starting full sync for store: ${storeId}`)
  
  const results = {
    products: { success: false, count: 0, error: null },
    orders: { success: false, count: 0, error: null },
    customers: { success: false, count: 0, error: null }
  }
  
  // Import products
  try {
    const productResponse = await importShopifyProducts(supabaseClient, storeId, credentials)
    const productResult = await productResponse.json()
    results.products.success = productResult.success
    results.products.count = productResult.imported_count || 0
    if (!productResult.success) {
      results.products.error = productResult.error
    }
  } catch (error) {
    results.products.error = error.message
  }
  
  // Import orders
  try {
    const orderResponse = await importShopifyOrders(supabaseClient, storeId, credentials)
    const orderResult = await orderResponse.json()
    results.orders.success = orderResult.success
    results.orders.count = orderResult.imported_count || 0
    if (!orderResult.success) {
      results.orders.error = orderResult.error
    }
  } catch (error) {
    results.orders.error = error.message
  }
  
  // Import customers
  try {
    const customerResponse = await importShopifyCustomers(supabaseClient, storeId, credentials)
    const customerResult = await customerResponse.json()
    results.customers.success = customerResult.success
    results.customers.count = customerResult.imported_count || 0
    if (!customerResult.success) {
      results.customers.error = customerResult.error
    }
  } catch (error) {
    results.customers.error = error.message
  }
  
  const allSuccess = results.products.success && results.orders.success && results.customers.success
  
  await supabaseClient
    .from('store_integrations')
    .update({ 
      connection_status: allSuccess ? 'connected' : 'error',
      last_sync_at: new Date().toISOString(),
      product_count: results.products.count,
      order_count: results.orders.count
    })
    .eq('id', storeId)
  
  return new Response(
    JSON.stringify({ 
      success: allSuccess, 
      message: allSuccess ? 'Synchronisation complète réussie' : 'Synchronisation partielle avec erreurs',
      results: results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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