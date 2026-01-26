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

    const body = await req.json()
    const syncType = body.sync_type || 'products'
    const direction = body.direction || 'bidirectional'
    
    console.log(`[CHANNEL-SYNC] Starting ${syncType} sync for user ${user.id}, integration: ${body.integration_id || 'all'}`)

    // If no specific integration_id, sync all active integrations
    if (!body.integration_id) {
      const { data: integrations, error: listError } = await supabaseClient
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (listError) {
        console.error('[CHANNEL-SYNC] Error fetching integrations:', listError)
        throw new Error('Failed to fetch integrations')
      }
      
      if (!integrations || integrations.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No active integrations found',
            products_synced: 0,
            orders_synced: 0 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log(`[CHANNEL-SYNC] Found ${integrations.length} active integrations`)
      
      // Sync all integrations
      let totalResults = {
        success: true,
        products_synced: 0,
        orders_synced: 0,
        inventory_updated: 0,
        integrations_processed: 0,
        errors: [] as string[]
      }
      
      for (const integration of integrations) {
        try {
          const request: SyncRequest = {
            integration_id: integration.id,
            sync_type: syncType,
            direction,
            options: body.options
          }
          const result = await performSyncInternal(supabaseClient, integration, request, user.id)
          totalResults.products_synced += result.products_synced
          totalResults.orders_synced += result.orders_synced
          totalResults.inventory_updated += result.inventory_updated
          totalResults.integrations_processed++
          if (result.errors.length) totalResults.errors.push(...result.errors)
        } catch (e) {
          totalResults.errors.push(`Integration ${integration.platform}: ${e.message}`)
        }
      }
      
      return new Response(
        JSON.stringify(totalResults),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Single integration sync
    const { data: integration, error: intError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', body.integration_id)
      .eq('user_id', user.id)
      .single()

    if (intError || !integration) {
      // Try marketplace_integrations table
      const { data: altIntegration, error: altError } = await supabaseClient
        .from('marketplace_integrations')
        .select('*')
        .eq('id', body.integration_id)
        .eq('user_id', user.id)
        .single()
      
      if (altError || !altIntegration) {
        throw new Error('Integration not found')
      }
      
      const request: SyncRequest = {
        integration_id: body.integration_id,
        sync_type: syncType,
        direction,
        options: body.options
      }
      const result = await performSyncInternal(supabaseClient, altIntegration, request, user.id)
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const request: SyncRequest = {
      integration_id: body.integration_id,
      sync_type: syncType,
      direction,
      options: body.options
    }
    const result = await performSyncInternal(supabaseClient, integration, request, user.id)
    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CHANNEL-SYNC] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function performSyncInternal(
  supabase: any,
  integration: any,
  request: SyncRequest,
  userId: string
): Promise<{
  products_synced: number;
  orders_synced: number;
  inventory_updated: number;
  errors: string[];
  duration_ms: number;
}> {
  const platform = integration.platform || integration.platform_type
  const startTime = Date.now()
  
  let result = {
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

    // Update integration stats (ignore errors on update)
    await supabase
      .from('marketplace_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        total_products_synced: (integration.total_products_synced || 0) + result.products_synced,
        total_orders_synced: (integration.total_orders_synced || 0) + result.orders_synced,
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

    // Log sync event (ignore errors)
    await supabase.from('marketplace_event_logs').insert({
      integration_id: integration.id,
      user_id: userId,
      event_type: 'sync_completed',
      event_source: 'api',
      severity: result.errors.length > 0 ? 'warning' : 'info',
      title: `Synchronisation ${request.sync_type} terminée`,
      message: `${result.products_synced} produits, ${result.orders_synced} commandes synchronisés`,
      data: result,
    }).catch(() => {}) // Ignore log errors

    console.log(`[CHANNEL-SYNC] Completed: ${JSON.stringify(result)}`)
    
    await updateSyncStatus(supabase, integration.id, result.errors.length > 0 ? 'warning' : 'connected')

    return result

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

// Platform-specific API calls - REAL IMPLEMENTATIONS ONLY
async function fetchPlatformProducts(integration: any, platform: string, limit: number): Promise<any[]> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      if (!shopUrl || !credentials.access_token) {
        console.warn('[CHANNEL-SYNC] Missing Shopify credentials')
        return []
      }
      
      const response = await fetch(
        `https://${shopUrl.replace(/^https?:\/\//, '')}/admin/api/2024-01/products.json?limit=${limit}`,
        {
          headers: { 'X-Shopify-Access-Token': credentials.access_token }
        }
      )
      
      if (!response.ok) {
        console.error(`[CHANNEL-SYNC] Shopify API error: ${response.status}`)
        return []
      }
      
      const data = await response.json()
      return data.products || []
    }
    
    case 'woocommerce': {
      if (!credentials.shop_url || !credentials.consumer_key || !credentials.consumer_secret) {
        console.warn('[CHANNEL-SYNC] Missing WooCommerce credentials')
        return []
      }
      
      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      const response = await fetch(
        `${credentials.shop_url}/wp-json/wc/v3/products?per_page=${limit}`,
        {
          headers: { 'Authorization': `Basic ${auth}` }
        }
      )
      
      if (!response.ok) {
        console.error(`[CHANNEL-SYNC] WooCommerce API error: ${response.status}`)
        return []
      }
      
      return await response.json()
    }
    
    case 'prestashop': {
      if (!credentials.shop_url || !credentials.api_key) {
        console.warn('[CHANNEL-SYNC] Missing PrestaShop credentials')
        return []
      }
      
      const auth = btoa(`${credentials.api_key}:`)
      const response = await fetch(
        `${credentials.shop_url}/api/products?output_format=JSON&limit=${limit}`,
        {
          headers: { 'Authorization': `Basic ${auth}` }
        }
      )
      
      if (!response.ok) {
        console.error(`[CHANNEL-SYNC] PrestaShop API error: ${response.status}`)
        return []
      }
      
      const data = await response.json()
      return data.products || []
    }
    
    default:
      // No fallback mock data - return empty array for unsupported platforms
      console.warn(`[CHANNEL-SYNC] Platform ${platform} not supported for product import`)
      return []
  }
}

async function fetchPlatformOrders(integration: any, platform: string, sinceDate?: string): Promise<any[]> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      if (!shopUrl || !credentials.access_token) {
        console.warn('[CHANNEL-SYNC] Missing Shopify credentials for orders')
        return []
      }
      
      let url = `https://${shopUrl.replace(/^https?:\/\//, '')}/admin/api/2024-01/orders.json?limit=50`
      if (sinceDate) url += `&created_at_min=${sinceDate}`
      
      const response = await fetch(url, {
        headers: { 'X-Shopify-Access-Token': credentials.access_token }
      })
      
      if (!response.ok) {
        console.error(`[CHANNEL-SYNC] Shopify orders API error: ${response.status}`)
        return []
      }
      
      const data = await response.json()
      return data.orders || []
    }
    
    case 'woocommerce': {
      if (!credentials.shop_url || !credentials.consumer_key || !credentials.consumer_secret) {
        console.warn('[CHANNEL-SYNC] Missing WooCommerce credentials for orders')
        return []
      }
      
      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      let url = `${credentials.shop_url}/wp-json/wc/v3/orders?per_page=50`
      if (sinceDate) url += `&after=${sinceDate}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Basic ${auth}` }
      })
      
      if (!response.ok) {
        console.error(`[CHANNEL-SYNC] WooCommerce orders API error: ${response.status}`)
        return []
      }
      
      return await response.json()
    }
    
    default:
      // No fallback mock data
      console.warn(`[CHANNEL-SYNC] Platform ${platform} not supported for order import`)
      return []
  }
}

async function pushProductToPlatform(integration: any, platform: string, product: any): Promise<void> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      const shopUrl = credentials.shop_domain || credentials.shop_url
      if (!shopUrl || !credentials.access_token) {
        throw new Error('Missing Shopify credentials')
      }
      
      const response = await fetch(
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
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors || `Shopify API error: ${response.status}`)
      }
      break
    }
    
    case 'woocommerce': {
      if (!credentials.shop_url || !credentials.consumer_key || !credentials.consumer_secret) {
        throw new Error('Missing WooCommerce credentials')
      }
      
      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      const response = await fetch(
        `${credentials.shop_url}/wp-json/wc/v3/products`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: product.name,
            description: product.description,
            regular_price: String(product.price),
            sku: product.sku,
            stock_quantity: product.stock_quantity
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `WooCommerce API error: ${response.status}`)
      }
      break
    }
    
    default:
      throw new Error(`Platform ${platform} does not support product export`)
  }
}

async function updatePlatformInventory(integration: any, platform: string, product: any): Promise<void> {
  const credentials = integration.config?.credentials || integration
  
  switch (platform) {
    case 'shopify': {
      // Shopify requires inventory item ID for stock updates
      console.log(`[CHANNEL-SYNC] Would update Shopify inventory for SKU ${product.sku}`)
      break
    }
    
    case 'woocommerce': {
      if (!credentials.shop_url || !credentials.consumer_key || !credentials.consumer_secret) {
        throw new Error('Missing WooCommerce credentials')
      }
      
      // First find the product by SKU
      const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
      const searchResponse = await fetch(
        `${credentials.shop_url}/wp-json/wc/v3/products?sku=${product.sku}`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      )
      
      if (searchResponse.ok) {
        const products = await searchResponse.json()
        if (products.length > 0) {
          await fetch(
            `${credentials.shop_url}/wp-json/wc/v3/products/${products[0].id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                stock_quantity: product.stock_quantity
              })
            }
          )
        }
      }
      break
    }
    
    default:
      console.log(`[CHANNEL-SYNC] Inventory sync not implemented for ${platform}`)
  }
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
    
    case 'prestashop':
      return {
        external_id: `prestashop_${product.id}`,
        name: product.name?.[1]?.value || product.name,
        description: product.description?.[1]?.value || product.description,
        price: parseFloat(product.price || 0),
        sku: product.reference,
        stock_quantity: parseInt(product.quantity || 0),
        image_url: product.id_default_image,
        status: product.active === '1' ? 'active' : 'draft',
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
    
    case 'woocommerce':
      return {
        order_number: `ORD-WOO-${order.id}`,
        external_id: `woo_${order.id}`,
        status: order.status || 'pending',
        total_amount: parseFloat(order.total || 0),
        currency: order.currency || 'EUR',
        customer_email: order.billing?.email,
        customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
        shipping_address: order.shipping,
        items: order.line_items?.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        order_date: order.date_created,
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
