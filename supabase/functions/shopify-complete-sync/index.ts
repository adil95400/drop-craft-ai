import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncOptions {
  integrationId?: string
  userId?: string
  syncProducts?: boolean
  syncOrders?: boolean
  syncCustomers?: boolean
  syncInventory?: boolean
  daysBack?: number
  isScheduled?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  
  try {
    const options: SyncOptions = await req.json().catch(() => ({}))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Starting Shopify Complete Sync...')
    console.log('Options:', JSON.stringify(options))

    // Récupérer les intégrations à synchroniser
    let query = supabase
      .from('store_integrations')
      .select('*')
      .eq('platform', 'shopify')
      .eq('is_active', true)

    if (options.integrationId) {
      query = query.eq('id', options.integrationId)
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }

    const { data: integrations, error: integrationsError } = await query

    if (integrationsError) {
      throw integrationsError
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Aucune intégration Shopify active à synchroniser',
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📦 Found ${integrations.length} active Shopify integration(s)`)

    const results = {
      total_integrations: integrations.length,
      successful: 0,
      failed: 0,
      products_synced: 0,
      orders_synced: 0,
      customers_synced: 0,
      details: [] as any[]
    }

    for (const integration of integrations) {
      const integrationStart = Date.now()
      const integrationResult: any = {
        integration_id: integration.id,
        user_id: integration.user_id,
        store: integration.credentials?.shop_domain,
        success: true,
        products: 0,
        orders: 0,
        customers: 0,
        errors: []
      }

      try {
        const credentials = integration.credentials || {}
        
        if (!credentials.access_token || !credentials.shop_domain) {
          throw new Error('Credentials Shopify manquants')
        }

        const shopDomain = credentials.shop_domain
        const accessToken = credentials.access_token

        // Test de connexion
        const testRes = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
          headers: { 'X-Shopify-Access-Token': accessToken }
        })

        if (!testRes.ok) {
          throw new Error(`Token invalide: ${testRes.status}`)
        }

        // Sync Products
        if (options.syncProducts !== false) {
          console.log(`📦 Syncing products for ${shopDomain}...`)
          const productResult = await syncProducts(supabase, integration, shopDomain, accessToken)
          integrationResult.products = productResult.count
          results.products_synced += productResult.count
        }

        // Sync Orders
        if (options.syncOrders !== false) {
          console.log(`📋 Syncing orders for ${shopDomain}...`)
          const orderResult = await syncOrders(supabase, integration, shopDomain, accessToken, options.daysBack || 30)
          integrationResult.orders = orderResult.count
          results.orders_synced += orderResult.count
        }

        // Sync Customers
        if (options.syncCustomers === true) {
          console.log(`👥 Syncing customers for ${shopDomain}...`)
          const customerResult = await syncCustomers(supabase, integration, shopDomain, accessToken)
          integrationResult.customers = customerResult.count
          results.customers_synced += customerResult.count
        }

        // Mettre à jour l'intégration
        await supabase
          .from('store_integrations')
          .update({
            connection_status: 'connected',
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            product_count: integrationResult.products
          })
          .eq('id', integration.id)

        results.successful++

      } catch (error) {
        console.error(`❌ Error syncing integration ${integration.id}:`, error)
        integrationResult.success = false
        integrationResult.errors.push(error.message)
        results.failed++

        // Marquer l'erreur sur l'intégration
        await supabase
          .from('store_integrations')
          .update({
            connection_status: 'error',
            sync_error: error.message
          })
          .eq('id', integration.id)
      }

      integrationResult.duration_ms = Date.now() - integrationStart
      results.details.push(integrationResult)

      // Log dans activity_logs
      await supabase
        .from('activity_logs')
        .insert({
          user_id: integration.user_id,
          action: 'shopify_sync',
          entity_type: 'shopify_sync',
          entity_id: integration.id,
          description: integrationResult.success 
            ? `Sync réussie: ${integrationResult.products} produits, ${integrationResult.orders} commandes`
            : `Sync échouée: ${integrationResult.errors.join(', ')}`,
          details: {
            sync_type: options.isScheduled ? 'scheduled' : 'manual',
            status: integrationResult.success ? 'success' : 'error',
            products_synced: integrationResult.products,
            orders_synced: integrationResult.orders,
            customers_synced: integrationResult.customers,
            errors: integrationResult.errors,
            duration_ms: integrationResult.duration_ms
          }
        })
    }

    const duration = Date.now() - startTime

    console.log(`✅ Sync complete in ${duration}ms`)
    console.log(`   Products: ${results.products_synced}`)
    console.log(`   Orders: ${results.orders_synced}`)
    console.log(`   Success: ${results.successful}/${results.total_integrations}`)

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: duration,
        ...results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Complete sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        duration_ms: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// ============================================
// SYNC PRODUCTS
// ============================================
async function syncProducts(supabase: any, integration: any, shopDomain: string, accessToken: string) {
  let allProducts: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  while (hasNextPage) {
    const url = `https://${shopDomain}/admin/api/2024-01/products.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Shopify Products API error: ${response.status}`)
    }

    const data = await response.json()
    allProducts = allProducts.concat(data.products || [])

    const linkHeader = response.headers.get('Link')
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
      hasNextPage = !!nextPageInfo
    } else {
      hasNextPage = false
    }
  }

  // Transformer et upserter
  const productsToUpsert = allProducts.map(product => ({
    user_id: integration.user_id,
    name: product.title,
    description: product.body_html || '',
    price: parseFloat(product.variants?.[0]?.price || '0'),
    cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0'),
    sku: product.variants?.[0]?.sku || `SHOP-${product.id}`,
    category: product.product_type || 'Général',
    image_url: product.images?.[0]?.src || null,
    stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
    status: product.status === 'active' ? 'active' : 'inactive',
    external_id: product.id.toString(),
    external_platform: 'shopify',
    tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
    shopify_data: {
      handle: product.handle,
      vendor: product.vendor,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        price: v.price,
        sku: v.sku,
        inventory_quantity: v.inventory_quantity
      })),
      images: product.images?.map((img: any) => img.src),
      created_at: product.created_at,
      updated_at: product.updated_at
    }
  }))

  // Batch upsert
  const batchSize = 100
  for (let i = 0; i < productsToUpsert.length; i += batchSize) {
    const batch = productsToUpsert.slice(i, i + batchSize)
    const { error } = await supabase
      .from('products')
      .upsert(batch, { 
        onConflict: 'external_id,user_id',
        ignoreDuplicates: false 
      })
    
    if (error) {
      console.error('Product batch upsert error:', error)
    }
  }

  return { count: allProducts.length }
}

// ============================================
// SYNC ORDERS
// ============================================
async function syncOrders(supabase: any, integration: any, shopDomain: string, accessToken: string, daysBack: number) {
  let allOrders: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - daysBack)

  while (hasNextPage) {
    const url = `https://${shopDomain}/admin/api/2024-01/orders.json?limit=250&status=any&created_at_min=${sinceDate.toISOString()}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Shopify Orders API error: ${response.status}`)
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

  // Mapper et upserter les commandes
  for (const order of allOrders) {
    // Chercher ou créer le client
    let customer_id = null
    if (order.customer?.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', order.customer.email)
        .eq('user_id', integration.user_id)
        .single()

      if (existingCustomer) {
        customer_id = existingCustomer.id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            user_id: integration.user_id,
            email: order.customer.email,
            first_name: order.customer.first_name,
            last_name: order.customer.last_name,
            phone: order.customer.phone,
            country: order.shipping_address?.country
          })
          .select('id')
          .single()

        if (newCustomer) {
          customer_id = newCustomer.id
        }
      }
    }

    // Mapper le statut
    const mapStatus = (financialStatus: string, fulfillmentStatus: string | null) => {
      if (financialStatus === 'refunded') return 'cancelled'
      if (fulfillmentStatus === 'fulfilled') return 'delivered'
      if (fulfillmentStatus === 'partial') return 'shipped'
      if (financialStatus === 'paid') return 'processing'
      return 'pending'
    }

    const orderData = {
      user_id: integration.user_id,
      customer_id,
      order_number: order.order_number?.toString() || order.name,
      status: mapStatus(order.financial_status, order.fulfillment_status),
      total_amount: parseFloat(order.total_price || '0'),
      subtotal: parseFloat(order.subtotal_price || '0'),
      tax_amount: parseFloat(order.total_tax || '0'),
      shipping_cost: parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0'),
      discount_amount: parseFloat(order.total_discounts || '0'),
      currency: order.currency,
      payment_status: order.financial_status === 'paid' ? 'paid' : 'pending',
      fulfillment_status: order.fulfillment_status || 'unfulfilled',
      shipping_address: order.shipping_address,
      billing_address: order.billing_address,
      shopify_order_id: order.id.toString(),
      tracking_number: order.fulfillments?.[0]?.tracking_number,
      tracking_url: order.fulfillments?.[0]?.tracking_url,
      carrier: order.fulfillments?.[0]?.tracking_company,
      notes: order.note,
      created_at: order.created_at,
      updated_at: order.updated_at
    }

    // Upsert la commande
    const { data: upsertedOrder, error: orderError } = await supabase
      .from('orders')
      .upsert(orderData, { 
        onConflict: 'shopify_order_id,user_id'
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Order upsert error:', orderError)
      continue
    }

    // Upsert les items de commande
    if (upsertedOrder && order.line_items) {
      for (const item of order.line_items) {
        await supabase
          .from('order_items')
          .upsert({
            order_id: upsertedOrder.id,
            product_name: item.name,
            product_sku: item.sku,
            qty: item.quantity,
            unit_price: parseFloat(item.price),
            total_price: parseFloat(item.price) * item.quantity,
            variant_title: item.variant_title
          }, {
            onConflict: 'order_id,product_sku'
          })
      }
    }
  }

  return { count: allOrders.length }
}

// ============================================
// SYNC CUSTOMERS
// ============================================
async function syncCustomers(supabase: any, integration: any, shopDomain: string, accessToken: string) {
  let allCustomers: any[] = []
  let nextPageInfo = null
  let hasNextPage = true

  while (hasNextPage) {
    const url = `https://${shopDomain}/admin/api/2024-01/customers.json?limit=250${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Shopify Customers API error: ${response.status}`)
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

  // Upserter les clients
  const customersToUpsert = allCustomers.map(customer => ({
    user_id: integration.user_id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    phone: customer.phone,
    address: customer.default_address?.address1,
    city: customer.default_address?.city,
    country: customer.default_address?.country,
    postal_code: customer.default_address?.zip,
    total_orders: customer.orders_count || 0,
    total_spent: parseFloat(customer.total_spent || '0'),
    tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
    notes: customer.note
  }))

  for (const customer of customersToUpsert) {
    if (!customer.email) continue
    
    await supabase
      .from('customers')
      .upsert(customer, { 
        onConflict: 'email,user_id'
      })
  }

  return { count: allCustomers.length }
}
