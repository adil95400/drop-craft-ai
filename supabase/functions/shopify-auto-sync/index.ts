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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Starting automatic Shopify sync...')

    // Récupérer toutes les intégrations Shopify actives
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('store_integrations')
      .select('*')
      .eq('platform', 'shopify')
      .eq('is_active', true)

    if (integrationsError) {
      throw integrationsError
    }

    if (!integrations || integrations.length === 0) {
      console.log('ℹ️ No active Shopify integrations found')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active Shopify integrations to sync',
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${integrations.length} active Shopify integration(s)`)

    const results = []

    // Synchroniser chaque intégration
    for (const integration of integrations) {
      try {
        console.log(`Syncing integration ${integration.id} for user ${integration.user_id}`)
        
        // Sync products
        const productResult = await syncShopifyProducts(supabaseClient, integration)
        
        // Sync orders automatically
        const orderResult = await syncShopifyOrders(supabaseClient, integration)
        
        // Sync customers automatically  
        const customerResult = await syncShopifyCustomers(supabaseClient, integration)
        
        results.push({
          integration_id: integration.id,
          user_id: integration.user_id,
          success: true,
          products_synced: productResult.imported,
          orders_synced: orderResult.imported,
          customers_synced: customerResult.imported
        })

        console.log(`✅ Successfully synced for integration ${integration.id}:`)
        console.log(`   - Products: ${productResult.imported}`)
        console.log(`   - Orders: ${orderResult.imported}`)
        console.log(`   - Customers: ${customerResult.imported}`)
      } catch (error) {
        console.error(`❌ Error syncing integration ${integration.id}:`, error)
        results.push({
          integration_id: integration.id,
          user_id: integration.user_id,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalProducts = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.products_synced || 0), 0)
    const totalOrders = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.orders_synced || 0), 0)
    const totalCustomers = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.customers_synced || 0), 0)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${successCount}/${integrations.length} integrations`,
        total_products: totalProducts,
        total_orders: totalOrders,
        total_customers: totalCustomers,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Auto-sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function syncShopifyProducts(supabaseClient: any, integration: any) {
  const credentials = integration.credentials || {}
  
  if (!credentials.access_token || !credentials.shop_domain) {
    throw new Error('Missing Shopify credentials')
  }

  const shopifyDomain = credentials.shop_domain
  const accessToken = credentials.access_token

  // Vérifier la validité du token avant la synchronisation
  console.log('🔐 Vérification du token Shopify...')
  const testResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  })

  if (!testResponse.ok) {
    const errorText = await testResponse.text()
    console.error('❌ Token Shopify invalide:', testResponse.status, errorText)
    
    // Mettre à jour le statut de l'intégration
    await supabaseClient
      .from('store_integrations')
      .update({ 
        connection_status: 'error',
        sync_error: `Token invalide: ${testResponse.status}`
      })
      .eq('id', integration.id)
    
    throw new Error(`Token Shopify invalide (${testResponse.status}). Veuillez reconnecter votre magasin Shopify.`)
  }

  console.log('✅ Token valide, démarrage de la synchronisation...')

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
      throw new Error(`Shopify API error: ${response.status}`)
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

  console.log(`📦 Retrieved ${allProducts.length} products from Shopify`)

  // Transformer et insérer les produits dans imported_products
  const productsToInsert = allProducts.map(product => ({
    user_id: integration.user_id,
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants?.[0]?.price || '0'),
    cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0'),
    currency: 'EUR',
    sku: product.variants?.[0]?.sku || '',
    category: product.product_type || 'Général',
    brand: product.vendor || '',
    
    // Champs spécifiques à imported_products
    supplier_name: 'Shopify',
    supplier_product_id: product.id.toString(),
    supplier_sku: product.variants?.[0]?.sku || '',
    supplier_url: `https://${integration.credentials.shop_domain}/admin/products/${product.id}`,
    
    // Images (array)
    image_urls: product.images?.map((img: any) => img.src) || [],
    
    // Stock et statut
    stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    status: product.status === 'active' ? 'active' as const : 'draft' as const,
    
    // Tags
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    
    // SEO
    seo_title: product.title,
    seo_description: product.body_html?.substring(0, 160) || ''
  }))

  // Upsert des produits dans imported_products
  for (const product of productsToInsert) {
    const { error } = await supabaseClient
      .from('imported_products')
      .upsert(product, { 
        onConflict: 'supplier_product_id,user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Product upsert error:', error)
    }
  }

  console.log(`✅ Shopify sync completed:`)
  console.log(`   - Products fetched: ${allProducts.length}`)
  console.log(`   - Products inserted/updated: ${productsToInsert.length}`)
  console.log(`   - Integration: ${integration.id}`)
  console.log(`   - User: ${integration.user_id}`)

  // Mettre à jour le statut de l'intégration
  await supabaseClient
    .from('store_integrations')
    .update({ 
      connection_status: 'connected',
      last_sync_at: new Date().toISOString(),
      product_count: productsToInsert.length
    })
    .eq('id', integration.id)

  return {
    success: true,
    imported: productsToInsert.length
  }
}

// ========== SYNC SHOPIFY ORDERS ==========
async function syncShopifyOrders(supabaseClient: any, integration: any) {
  const credentials = integration.credentials || {}
  
  if (!credentials.access_token || !credentials.shop_domain) {
    console.log('⚠️ Missing Shopify credentials for orders sync')
    return { success: true, imported: 0 }
  }

  const shopifyDomain = credentials.shop_domain
  const accessToken = credentials.access_token

  console.log('📋 Fetching Shopify orders...')

  let allOrders: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  // Récupérer les commandes des 30 derniers jours
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const createdAtMin = thirtyDaysAgo.toISOString()

  while (hasNextPage) {
    const url = `https://${shopifyDomain}/admin/api/2023-10/orders.json?limit=250&status=any&created_at_min=${createdAtMin}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Shopify orders API error: ${response.status}`)
      return { success: false, imported: 0 }
    }

    const data = await response.json()
    allOrders = allOrders.concat(data.orders || [])

    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`📦 Retrieved ${allOrders.length} orders from Shopify`)

  let importedCount = 0

  for (const order of allOrders) {
    try {
      // Map Shopify status to our status
      let status = 'pending'
      if (order.financial_status === 'paid') {
        status = order.fulfillment_status === 'fulfilled' ? 'delivered' : 'processing'
      } else if (order.financial_status === 'refunded') {
        status = 'refunded'
      } else if (order.cancelled_at) {
        status = 'cancelled'
      }

      const orderData = {
        user_id: integration.user_id,
        order_number: order.name || order.order_number?.toString() || `SHOP-${order.id}`,
        customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Client Shopify',
        customer_email: order.customer?.email || order.email || null,
        status,
        total_amount: parseFloat(order.total_price || '0'),
        currency: order.currency || 'EUR',
        external_id: order.id.toString(),
        external_platform: 'shopify',
        notes: `Importé depuis Shopify - ${order.financial_status || 'N/A'}`
      }

      const { error } = await supabaseClient
        .from('orders')
        .upsert(orderData, {
          onConflict: 'user_id,external_id',
          ignoreDuplicates: false
        })

      if (!error) {
        importedCount++
      } else {
        console.error('Order upsert error:', error)
      }
    } catch (err) {
      console.error('Order processing error:', err)
    }
  }

  console.log(`✅ Orders sync completed: ${importedCount} imported`)

  return {
    success: true,
    imported: importedCount
  }
}

// ========== SYNC SHOPIFY CUSTOMERS ==========
async function syncShopifyCustomers(supabaseClient: any, integration: any) {
  const credentials = integration.credentials || {}
  
  if (!credentials.access_token || !credentials.shop_domain) {
    console.log('⚠️ Missing Shopify credentials for customers sync')
    return { success: true, imported: 0 }
  }

  const shopifyDomain = credentials.shop_domain
  const accessToken = credentials.access_token

  console.log('👥 Fetching Shopify customers...')

  let allCustomers: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  while (hasNextPage && allCustomers.length < 500) { // Limit to 500 customers
    const url = `https://${shopifyDomain}/admin/api/2023-10/customers.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Shopify customers API error: ${response.status}`)
      return { success: false, imported: 0 }
    }

    const data = await response.json()
    allCustomers = allCustomers.concat(data.customers || [])

    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  console.log(`👥 Retrieved ${allCustomers.length} customers from Shopify`)

  let importedCount = 0

  for (const customer of allCustomers) {
    try {
      if (!customer.email) continue // Skip customers without email

      const customerData = {
        user_id: integration.user_id,
        email: customer.email,
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || null,
        total_orders: customer.orders_count || 0,
        total_spent: parseFloat(customer.total_spent || '0'),
        notes: `Importé depuis Shopify (ID: ${customer.id})${customer.accepts_marketing ? ' - Accepte marketing' : ''}`
      }

      const { error } = await supabaseClient
        .from('customers')
        .upsert(customerData, {
          onConflict: 'user_id,email',
          ignoreDuplicates: false
        })

      if (!error) {
        importedCount++
      } else {
        console.error('Customer upsert error:', error)
      }
    } catch (err) {
      console.error('Customer processing error:', err)
    }
  }

  console.log(`✅ Customers sync completed: ${importedCount} imported`)

  return {
    success: true,
    imported: importedCount
  }
}
