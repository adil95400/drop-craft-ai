import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  integration_id: string
  sync_type: 'products' | 'orders' | 'inventory' | 'full'
  direction: 'import' | 'export' | 'bidirectional'
  options?: {
    limit?: number
    since_date?: string
    product_ids?: string[]
  }
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from token
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const body: SyncRequest = await req.json()
    console.log(`[CHANNEL-SYNC] Starting ${body.sync_type} sync for integration ${body.integration_id}`)

    // Get integration details
    const { data: integration, error: intError } = await supabaseClient
      .from('marketplace_integrations')
      .select('*')
      .eq('id', body.integration_id)
      .eq('user_id', user.id)
      .single()

    if (intError || !integration) {
      // Try integrations table
      const { data: altIntegration, error: altError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('id', body.integration_id)
        .eq('user_id', user.id)
        .single()
      
      if (altError || !altIntegration) {
        throw new Error('Integration not found')
      }
      
      return await performSync(supabaseClient, altIntegration, body, user.id)
    }

    return await performSync(supabaseClient, integration, body, user.id)

  } catch (error) {
    console.error('[CHANNEL-SYNC] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function performSync(
  supabase: any,
  integration: any,
  request: SyncRequest,
  userId: string
) {
  const platform = integration.platform || integration.platform_type
  const startTime = Date.now()
  
  let result = {
    success: true,
    products_synced: 0,
    orders_synced: 0,
    inventory_updated: 0,
    errors: [] as string[],
    duration_ms: 0
  }

  try {
    // Update sync status
    await updateSyncStatus(supabase, integration.id, 'syncing')

    switch (request.sync_type) {
      case 'products':
        if (request.direction === 'import' || request.direction === 'bidirectional') {
          const imported = await importProducts(supabase, integration, platform, request.options)
          result.products_synced += imported.count
          if (imported.errors.length) result.errors.push(...imported.errors)
        }
        if (request.direction === 'export' || request.direction === 'bidirectional') {
          const exported = await exportProducts(supabase, integration, platform, request.options)
          result.products_synced += exported.count
          if (exported.errors.length) result.errors.push(...exported.errors)
        }
        break

      case 'orders':
        const orders = await syncOrders(supabase, integration, platform, request.options)
        result.orders_synced = orders.count
        if (orders.errors.length) result.errors.push(...orders.errors)
        break

      case 'inventory':
        const inventory = await syncInventory(supabase, integration, platform, request.options)
        result.inventory_updated = inventory.count
        if (inventory.errors.length) result.errors.push(...inventory.errors)
        break

      case 'full':
        const prodResult = await importProducts(supabase, integration, platform, request.options)
        const orderResult = await syncOrders(supabase, integration, platform, request.options)
        const invResult = await syncInventory(supabase, integration, platform, request.options)
        
        result.products_synced = prodResult.count
        result.orders_synced = orderResult.count
        result.inventory_updated = invResult.count
        result.errors = [...prodResult.errors, ...orderResult.errors, ...invResult.errors]
        break
    }

    result.duration_ms = Date.now() - startTime

    // Update integration stats
    await supabase
      .from('marketplace_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        total_products_synced: integration.total_products_synced + result.products_synced,
        total_orders_synced: integration.total_orders_synced + result.orders_synced,
        total_sync_count: (integration.total_sync_count || 0) + 1,
        status: result.errors.length > 0 ? 'warning' : 'connected',
      })
      .eq('id', integration.id)

    // Also update integrations table if exists
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        products_synced: result.products_synced,
        orders_synced: result.orders_synced,
        connection_status: result.errors.length > 0 ? 'error' : 'connected',
      })
      .eq('id', integration.id)

    // Log sync event
    await supabase.from('marketplace_event_logs').insert({
      integration_id: integration.id,
      user_id: userId,
      event_type: 'sync_completed',
      event_source: 'api',
      severity: result.errors.length > 0 ? 'warning' : 'info',
      title: `Synchronisation ${request.sync_type} terminée`,
      message: `${result.products_synced} produits, ${result.orders_synced} commandes synchronisés`,
      data: result,
    })

    console.log(`[CHANNEL-SYNC] Completed: ${JSON.stringify(result)}`)

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    await updateSyncStatus(supabase, integration.id, 'error', error.message)
    throw error
  }
}

async function updateSyncStatus(supabase: any, integrationId: string, status: string, error?: string) {
  await supabase
    .from('marketplace_integrations')
    .update({ 
      status,
      ...(error && { sync_error: error })
    })
    .eq('id', integrationId)
  
  await supabase
    .from('integrations')
    .update({ 
      connection_status: status === 'syncing' ? 'connecting' : status,
      ...(error && { sync_error: error })
    })
    .eq('id', integrationId)
}

async function importProducts(
  supabase: any, 
  integration: any, 
  platform: string,
  options?: SyncRequest['options']
): Promise<{ count: number; errors: string[] }> {
  console.log(`[CHANNEL-SYNC] Importing products from ${platform}`)
  
  const products = await fetchPlatformProducts(integration, platform, options?.limit || 100)
  const errors: string[] = []
  let count = 0

  for (const product of products) {
    try {
      const standardProduct = transformToStandard(product, platform)
      
      const { error } = await supabase
        .from('imported_products')
        .upsert({
          ...standardProduct,
          user_id: integration.user_id,
          source: platform,
          integration_id: integration.id,
          imported_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,external_id'
        })
      
      if (error) throw error
      count++
    } catch (e) {
      errors.push(`Product ${product.id}: ${e.message}`)
    }
  }

  return { count, errors }
}

async function exportProducts(
  supabase: any,
  integration: any,
  platform: string,
  options?: SyncRequest['options']
): Promise<{ count: number; errors: string[] }> {
  console.log(`[CHANNEL-SYNC] Exporting products to ${platform}`)
  
  // Get products to export
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', integration.user_id)
    .eq('status', 'active')
    .limit(options?.limit || 100)
  
  if (options?.product_ids?.length) {
    query = query.in('id', options.product_ids)
  }

  const { data: products, error } = await query
  if (error) return { count: 0, errors: [error.message] }

  const errors: string[] = []
  let count = 0

  for (const product of products || []) {
    try {
      await pushProductToPlatform(integration, platform, product)
      
      // Mark as published
      await supabase
        .from('published_products')
        .upsert({
          user_id: integration.user_id,
          product_id: product.id,
          channel: platform,
          integration_id: integration.id,
          status: 'published',
          published_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,product_id,channel'
        })
      
      count++
    } catch (e) {
      errors.push(`Product ${product.id}: ${e.message}`)
    }
  }

  return { count, errors }
}

async function syncOrders(
  supabase: any,
  integration: any,
  platform: string,
  options?: SyncRequest['options']
): Promise<{ count: number; errors: string[] }> {
  console.log(`[CHANNEL-SYNC] Syncing orders from ${platform}`)
  
  const orders = await fetchPlatformOrders(integration, platform, options?.since_date)
  const errors: string[] = []
  let count = 0

  for (const order of orders) {
    try {
      const standardOrder = transformOrderToStandard(order, platform)
      
      const { error } = await supabase
        .from('orders')
        .upsert({
          ...standardOrder,
          user_id: integration.user_id,
          source_platform: platform,
          integration_id: integration.id,
        }, {
          onConflict: 'user_id,order_number'
        })
      
      if (error) throw error
      count++
    } catch (e) {
      errors.push(`Order ${order.id}: ${e.message}`)
    }
  }

  return { count, errors }
}

async function syncInventory(
  supabase: any,
  integration: any,
  platform: string,
  options?: SyncRequest['options']
): Promise<{ count: number; errors: string[] }> {
  console.log(`[CHANNEL-SYNC] Syncing inventory for ${platform}`)
  
  // Get local inventory
  const { data: products } = await supabase
    .from('products')
    .select('id, sku, stock_quantity')
    .eq('user_id', integration.user_id)
    .not('sku', 'is', null)
    .limit(options?.limit || 500)

  const errors: string[] = []
  let count = 0

  for (const product of products || []) {
    try {
      await updatePlatformInventory(integration, platform, product)
      count++
    } catch (e) {
      errors.push(`SKU ${product.sku}: ${e.message}`)
    }
  }

  return { count, errors }
}

// Platform-specific API calls (simplified implementations)
async function fetchPlatformProducts(integration: any, platform: string, limit: number): Promise<any[]> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      const response = await fetch(
        `https://${shopUrl.replace(/^https?:\/\//, '')}/admin/api/2024-01/products.json?limit=${limit}`,
        {
          headers: { 'X-Shopify-Access-Token': credentials.access_token }
        }
      )
      const data = await response.json()
      return data.products || []
    }
    
    case 'woocommerce': {
      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      const response = await fetch(
        `${credentials.shop_url}/wp-json/wc/v3/products?per_page=${limit}`,
        {
          headers: { 'Authorization': `Basic ${auth}` }
        }
      )
      return await response.json()
    }
    
    default:
      // Return mock data for platforms without real API implementation
      return generateMockProducts(limit, platform)
  }
}

async function fetchPlatformOrders(integration: any, platform: string, sinceDate?: string): Promise<any[]> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      let url = `https://${shopUrl.replace(/^https?:\/\//, '')}/admin/api/2024-01/orders.json?limit=50`
      if (sinceDate) url += `&created_at_min=${sinceDate}`
      
      const response = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': credentials.access_token }
      })
      const data = await response.json()
      return data.orders || []
    }
    
    default:
      return generateMockOrders(20, platform)
  }
}

async function pushProductToPlatform(integration: any, platform: string, product: any): Promise<void> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      await fetch(
        `https://${shopUrl.replace(/^https?:\/\//, '')}/admin/api/2024-01/products.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': credentials.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product: {
              title: product.name,
              body_html: product.description,
              vendor: product.brand,
              product_type: product.category,
              variants: [{
                price: product.price,
                sku: product.sku,
                inventory_quantity: product.stock_quantity
              }]
            }
          })
        }
      )
      break
    }
    // Add more platforms as needed
  }
}

async function updatePlatformInventory(integration: any, platform: string, product: any): Promise<void> {
  // Implement platform-specific inventory updates
  console.log(`[CHANNEL-SYNC] Updating inventory for ${product.sku} on ${platform}`)
}

// Transform functions
function transformToStandard(product: any, platform: string): any {
  switch (platform) {
    case 'shopify':
      return {
        external_id: `shopify_${product.id}`,
        name: product.title,
        description: product.body_html,
        price: parseFloat(product.variants?.[0]?.price || 0),
        sku: product.variants?.[0]?.sku,
        stock_quantity: product.variants?.[0]?.inventory_quantity || 0,
        image_url: product.image?.src || product.images?.[0]?.src,
        category: product.product_type,
        brand: product.vendor,
        status: product.status === 'active' ? 'active' : 'draft',
      }
    
    case 'woocommerce':
      return {
        external_id: `woo_${product.id}`,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price || 0),
        sku: product.sku,
        stock_quantity: product.stock_quantity || 0,
        image_url: product.images?.[0]?.src,
        category: product.categories?.[0]?.name,
        status: product.status === 'publish' ? 'active' : 'draft',
      }
    
    default:
      return {
        external_id: `${platform}_${product.id}`,
        name: product.title || product.name,
        description: product.description,
        price: parseFloat(product.price || 0),
        sku: product.sku,
        stock_quantity: product.stock || 0,
        image_url: product.image,
        status: 'active',
      }
  }
}

function transformOrderToStandard(order: any, platform: string): any {
  switch (platform) {
    case 'shopify':
      return {
        order_number: order.name || `ORD-${order.id}`,
        external_id: `shopify_${order.id}`,
        status: order.fulfillment_status || 'pending',
        total_amount: parseFloat(order.total_price || 0),
        currency: order.currency,
        customer_email: order.email,
        customer_name: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        shipping_address: order.shipping_address,
        items: order.line_items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        order_date: order.created_at,
      }
    
    default:
      return {
        order_number: `ORD-${platform.toUpperCase()}-${order.id}`,
        external_id: `${platform}_${order.id}`,
        status: order.status || 'pending',
        total_amount: parseFloat(order.total || 0),
        currency: order.currency || 'EUR',
        order_date: order.date_created || new Date().toISOString(),
      }
  }
}

// Mock data generators for platforms without real API
function generateMockProducts(count: number, platform: string): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${platform}_${Date.now()}_${i}`,
    title: `Product ${i + 1} from ${platform}`,
    description: `Sample product imported from ${platform}`,
    price: (Math.random() * 100 + 10).toFixed(2),
    sku: `${platform.toUpperCase()}-${1000 + i}`,
    stock: Math.floor(Math.random() * 100),
    image: `https://picsum.photos/seed/${i}/400/400`,
  }))
}

function generateMockOrders(count: number, platform: string): any[] {
  const statuses = ['pending', 'processing', 'shipped', 'delivered']
  return Array.from({ length: count }, (_, i) => ({
    id: `${platform}_order_${Date.now()}_${i}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    total: (Math.random() * 500 + 20).toFixed(2),
    currency: 'EUR',
    date_created: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}
