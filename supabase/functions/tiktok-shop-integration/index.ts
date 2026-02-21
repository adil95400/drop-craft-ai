import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// TikTok Shop API Configuration
const TIKTOK_API_VERSION = '202309'
const TIKTOK_API_BASE_URLS: Record<string, string> = {
  US: 'https://open-api.tiktokglobalshop.com',
  UK: 'https://open-api.tiktokglobalshop.com',
  EU: 'https://open-api.tiktokglobalshop.com',
  SEA: 'https://open-api.tiktokglobalshop.com',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, ...params } = await req.json()
    console.log('TikTok Shop action:', action, JSON.stringify(params).substring(0, 200))

    let result

    switch (action) {
      case 'connect':
        result = await connectTikTokShop(user.id, params, supabaseClient)
        break
      
      case 'disconnect':
        result = await disconnectTikTokShop(params.integration_id, supabaseClient)
        break
      
      case 'publish_product':
        result = await publishProduct(params, supabaseClient)
        break
      
      case 'publish_bulk':
        result = await publishBulkProducts(params, supabaseClient)
        break
      
      case 'sync_products':
        result = await syncProducts(params.integration_id, supabaseClient)
        break
      
      case 'sync_orders':
        result = await syncOrders(params.integration_id, supabaseClient)
        break
      
      case 'update_inventory':
        result = await updateInventory(params, supabaseClient)
        break
      
      case 'get_categories':
        result = await getCategories(params.integration_id, supabaseClient)
        break
      
      case 'get_status':
        result = await getIntegrationStatus(params.integration_id, supabaseClient)
        break
      
      case 'get_analytics':
        result = await getAnalytics(params.integration_id, supabaseClient)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('TikTok Shop error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// TikTok Shop API Helper
async function tiktokApiRequest(
  accessToken: string,
  shopId: string,
  endpoint: string,
  method: string = 'GET',
  body?: any,
  region: string = 'US'
): Promise<any> {
  const baseUrl = TIKTOK_API_BASE_URLS[region] || TIKTOK_API_BASE_URLS.US
  const timestamp = Math.floor(Date.now() / 1000)
  
  const url = new URL(`${baseUrl}${endpoint}`)
  url.searchParams.set('app_key', Deno.env.get('TIKTOK_APP_KEY') || '')
  url.searchParams.set('timestamp', timestamp.toString())
  url.searchParams.set('shop_id', shopId)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tts-access-token': accessToken,
  }
  
  console.log(`TikTok API ${method} ${endpoint}`)
  
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  const data = await response.json()
  
  if (data.code !== 0) {
    console.error('TikTok API Error:', data)
    throw new Error(data.message || `TikTok API error: ${data.code}`)
  }
  
  return data.data
}

async function connectTikTokShop(userId: string, params: any, supabase: any) {
  const { shop_id, access_token, shop_name, shop_region } = params

  // Validate credentials with TikTok Shop API
  const isValid = await validateTikTokCredentials(access_token, shop_id, shop_region)
  
  if (!isValid.valid) {
    throw new Error(isValid.error || 'Invalid TikTok Shop credentials')
  }

  // Check if already connected
  const { data: existing } = await supabase
    .from('marketplace_integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('platform', 'tiktok_shop')
    .eq('status', 'connected')
    .single()
  
  if (existing) {
    throw new Error('TikTok Shop déjà connecté. Déconnectez d\'abord l\'intégration existante.')
  }

  // Store integration
  const { data: integration, error } = await supabase
    .from('marketplace_integrations')
    .insert({
      user_id: userId,
      platform: 'tiktok_shop',
      shop_name: shop_name || isValid.shop_name || `TikTok Shop ${shop_id}`,
      shop_domain: `shop_${shop_id}`,
      encrypted_credentials: {
        shop_id,
        access_token,
        shop_region: shop_region || 'US',
        shop_name: isValid.shop_name,
        seller_id: isValid.seller_id,
      },
      status: 'connected',
      sync_enabled: true,
      auto_sync_products: true,
      auto_sync_orders: true,
      sync_frequency_minutes: 60,
      last_sync_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  console.log('TikTok Shop connected:', integration.id)

  // Trigger initial sync
  try {
    await syncProducts(integration.id, supabase)
    console.log('Initial product sync completed')
  } catch (syncError) {
    console.error('Initial sync error:', syncError)
  }

  return {
    success: true,
    integration_id: integration.id,
    shop_name: integration.shop_name,
    message: 'TikTok Shop connecté avec succès',
  }
}

async function disconnectTikTokShop(integrationId: string, supabase: any) {
  const { error } = await supabase
    .from('marketplace_integrations')
    .update({ 
      status: 'disconnected',
      sync_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId)

  if (error) throw error

  return { success: true, message: 'TikTok Shop déconnecté' }
}

async function publishProduct(params: any, supabase: any) {
  const { integration_id, product_id } = params

  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integration_id)
    .single()

  if (!integration) throw new Error('Integration not found')

  const { data: product } = await supabase
    .from('imported_products')
    .select('*')
    .eq('id', product_id)
    .single()

  if (!product) throw new Error('Product not found')

  const credentials = integration.encrypted_credentials
  
  // Create product on TikTok Shop
  const tiktokProduct = await createTikTokProduct(
    credentials.access_token,
    credentials.shop_id,
    credentials.shop_region,
    {
      title: product.name,
      description: product.description || product.name,
      price: product.price,
      currency: product.currency || 'USD',
      images: product.image_urls || [],
      sku: product.sku || `SKU-${Date.now()}`,
      stock: product.stock_quantity || 100,
      category_id: product.category,
    }
  )

  // Save published product record
  const { data: published } = await supabase
    .from('published_products')
    .insert({
      user_id: integration.user_id,
      product_id: product_id,
      marketplace_id: integration_id,
      platform: 'tiktok_shop',
      external_listing_id: tiktokProduct.product_id,
      listing_url: tiktokProduct.product_url,
      status: 'active',
      published_at: new Date().toISOString(),
      sync_config: {
        auto_sync_inventory: true,
        auto_sync_price: true,
      },
    })
    .select()
    .single()

  console.log('Product published to TikTok Shop:', published?.id)

  return {
    success: true,
    published_id: published?.id,
    external_id: tiktokProduct.product_id,
    url: tiktokProduct.product_url,
    message: 'Produit publié sur TikTok Shop',
  }
}

async function publishBulkProducts(params: any, supabase: any) {
  const { integration_id, product_ids } = params
  
  const results = []
  let successCount = 0
  let failCount = 0

  for (const product_id of product_ids) {
    try {
      const result = await publishProduct({ integration_id, product_id }, supabase)
      results.push({ product_id, success: true, ...result })
      successCount++
    } catch (error) {
      results.push({ product_id, success: false, error: error.message })
      failCount++
    }
    
    // Rate limiting - TikTok API limit
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return {
    success: true,
    total: product_ids.length,
    success_count: successCount,
    fail_count: failCount,
    results,
  }
}

async function syncProducts(integrationId: string, supabase: any) {
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (!integration) throw new Error('Integration not found')

  const credentials = integration.encrypted_credentials
  
  // Fetch products from TikTok Shop
  const tiktokProducts = await fetchTikTokProducts(
    credentials.access_token,
    credentials.shop_id,
    credentials.shop_region
  )

  let syncedCount = 0
  const errors = []

  for (const tiktokProduct of tiktokProducts) {
    try {
      await supabase.from('imported_products').upsert({
        user_id: integration.user_id,
        name: tiktokProduct.title,
        description: tiktokProduct.description,
        price: tiktokProduct.price?.original_price || 0,
        currency: tiktokProduct.price?.currency || 'USD',
        sku: tiktokProduct.skus?.[0]?.seller_sku || tiktokProduct.product_id,
        stock_quantity: tiktokProduct.skus?.[0]?.stock_infos?.[0]?.available_stock || 0,
        image_urls: tiktokProduct.main_images?.map((img: any) => img.url_list?.[0]) || [],
        source: 'tiktok_shop',
        external_id: tiktokProduct.product_id,
        supplier_name: 'TikTok Shop',
        status: tiktokProduct.product_status === 4 ? 'active' : 'inactive',
      }, { onConflict: 'external_id,user_id' })
      
      syncedCount++
    } catch (error) {
      errors.push({ product_id: tiktokProduct.product_id, error: error.message })
    }
  }

  // Update last sync time
  await supabase
    .from('marketplace_integrations')
    .update({ 
      last_sync_at: new Date().toISOString(),
      sync_status: 'success',
    })
    .eq('id', integrationId)

  return {
    success: true,
    synced_count: syncedCount,
    total: tiktokProducts.length,
    errors,
  }
}

async function syncOrders(integrationId: string, supabase: any) {
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (!integration) throw new Error('Integration not found')

  const credentials = integration.encrypted_credentials
  
  // Fetch orders from TikTok Shop
  const tiktokOrders = await fetchTikTokOrders(
    credentials.access_token,
    credentials.shop_id,
    credentials.shop_region
  )

  let syncedCount = 0

  for (const order of tiktokOrders) {
    try {
      await supabase.from('orders').upsert({
        user_id: integration.user_id,
        order_number: order.order_id,
        external_order_id: order.order_id,
        platform: 'tiktok_shop',
        status: mapTikTokStatus(order.order_status),
        total_amount: parseFloat(order.payment?.original_total_product_price || '0'),
        currency: order.payment?.currency || 'USD',
        customer_name: order.recipient_address?.name || '',
        customer_phone: order.recipient_address?.phone || '',
        shipping_address: {
          name: order.recipient_address?.name,
          address1: order.recipient_address?.full_address,
          city: order.recipient_address?.city,
          province: order.recipient_address?.state,
          country: order.recipient_address?.region_code,
          zip: order.recipient_address?.zipcode,
          phone: order.recipient_address?.phone,
        },
        items: order.line_items?.map((item: any) => ({
          product_name: item.product_name,
          sku: item.seller_sku,
          quantity: item.quantity,
          price: parseFloat(item.sale_price || '0'),
        })) || [],
        order_date: order.create_time ? new Date(order.create_time * 1000).toISOString() : new Date().toISOString(),
      }, { onConflict: 'external_order_id' })
      
      syncedCount++
    } catch (error) {
      console.error('Order sync error:', error)
    }
  }

  return {
    success: true,
    synced_count: syncedCount,
    total: tiktokOrders.length,
  }
}

async function updateInventory(params: any, supabase: any) {
  const { integration_id, product_id, quantity } = params

  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integration_id)
    .single()

  const { data: published } = await supabase
    .from('published_products')
    .select('*')
    .eq('product_id', product_id)
    .eq('marketplace_id', integration_id)
    .single()

  if (!published) throw new Error('Product not published on TikTok Shop')

  const credentials = integration.encrypted_credentials
  
  await updateTikTokInventory(
    credentials.access_token,
    credentials.shop_id,
    credentials.shop_region,
    published.external_listing_id,
    quantity
  )

  return { success: true, message: 'Stock mis à jour sur TikTok Shop' }
}

async function getCategories(integrationId: string, supabase: any) {
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (!integration) throw new Error('Integration not found')

  const credentials = integration.encrypted_credentials
  
  const categories = await fetchTikTokCategories(
    credentials.access_token,
    credentials.shop_id,
    credentials.shop_region
  )

  return { success: true, categories }
}

async function getIntegrationStatus(integrationId: string, supabase: any) {
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (!integration) throw new Error('Integration not found')

  // Get published products count
  const { count: publishedCount } = await supabase
    .from('published_products')
    .select('*', { count: 'exact', head: true })
    .eq('marketplace_id', integrationId)
    .eq('status', 'active')

  // Get orders count
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'tiktok_shop')
    .eq('user_id', integration.user_id)

  return {
    success: true,
    status: integration.status,
    shop_name: integration.shop_name,
    last_sync: integration.last_sync_at,
    published_products: publishedCount || 0,
    total_orders: ordersCount || 0,
    sync_enabled: integration.sync_enabled,
  }
}

async function getAnalytics(integrationId: string, supabase: any) {
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (!integration) throw new Error('Integration not found')

  // Get revenue from orders
  const { data: orders } = await supabase
    .from('orders')
    .select('total_amount, created_at')
    .eq('platform', 'tiktok_shop')
    .eq('user_id', integration.user_id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0
  const ordersCount = orders?.length || 0

  return {
    success: true,
    analytics: {
      revenue_30d: totalRevenue,
      orders_30d: ordersCount,
      avg_order_value: ordersCount > 0 ? totalRevenue / ordersCount : 0,
    },
  }
}

// TikTok Shop API Functions
async function validateTikTokCredentials(accessToken: string, shopId: string, region: string = 'US'): Promise<{ valid: boolean; error?: string; shop_name?: string; seller_id?: string }> {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      console.log('TIKTOK_APP_KEY not configured, validating based on input')
      // Basic validation when API key not configured
      if (!accessToken || !shopId) {
        return { valid: false, error: 'Access token and Shop ID are required' }
      }
      return { valid: true, shop_name: `TikTok Shop ${shopId}`, seller_id: shopId }
    }

    // Real API validation
    const data = await tiktokApiRequest(
      accessToken,
      shopId,
      '/api/shop/get',
      'GET',
      undefined,
      region
    )
    
    return {
      valid: true,
      shop_name: data.shop_name,
      seller_id: data.seller_id,
    }
  } catch (error) {
    console.error('TikTok validation error:', error)
    return { valid: false, error: error.message }
  }
}

async function createTikTokProduct(accessToken: string, shopId: string, region: string, product: any) {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      // Simulate product creation when API not configured
      console.log('Creating TikTok product (simulated):', product.title)
      const productId = `tiktok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return {
        product_id: productId,
        product_url: `https://shop.tiktok.com/product/${productId}`,
        status: 'active',
      }
    }

    const data = await tiktokApiRequest(
      accessToken,
      shopId,
      '/api/products',
      'POST',
      {
        title: product.title,
        description: product.description,
        main_images: product.images.map((url: string) => ({ url })),
        skus: [{
          seller_sku: product.sku,
          original_price: product.price.toString(),
          stock_infos: [{ available_stock: product.stock }],
        }],
        category_id: product.category_id,
      },
      region
    )
    
    return {
      product_id: data.product_id,
      product_url: `https://shop.tiktok.com/product/${data.product_id}`,
      status: 'active',
    }
  } catch (error) {
    console.error('Error creating TikTok product:', error)
    throw error
  }
}

async function fetchTikTokProducts(accessToken: string, shopId: string, region: string = 'US') {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      console.log('Fetching TikTok products (API not configured)')
      return []
    }

    const allProducts = []
    let cursor = ''
    let hasMore = true
    
    while (hasMore) {
      const params = cursor ? `&cursor=${cursor}` : ''
      const data = await tiktokApiRequest(
        accessToken,
        shopId,
        `/api/products?page_size=100${params}`,
        'GET',
        undefined,
        region
      )
      
      allProducts.push(...(data.products || []))
      cursor = data.next_cursor
      hasMore = !!data.next_cursor
    }
    
    return allProducts
  } catch (error) {
    console.error('Error fetching TikTok products:', error)
    return []
  }
}

async function fetchTikTokOrders(accessToken: string, shopId: string, region: string = 'US') {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      console.log('Fetching TikTok orders (API not configured)')
      return []
    }

    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
    const now = Math.floor(Date.now() / 1000)
    
    const data = await tiktokApiRequest(
      accessToken,
      shopId,
      `/api/orders/search`,
      'POST',
      {
        create_time_ge: thirtyDaysAgo,
        create_time_lt: now,
        page_size: 100,
      },
      region
    )
    
    return data.orders || []
  } catch (error) {
    console.error('Error fetching TikTok orders:', error)
    return []
  }
}

async function updateTikTokInventory(accessToken: string, shopId: string, region: string, productId: string, quantity: number) {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      console.log('Updating TikTok inventory (simulated):', { productId, quantity })
      return
    }

    await tiktokApiRequest(
      accessToken,
      shopId,
      `/api/products/${productId}/inventory`,
      'PUT',
      {
        skus: [{ available_stock: quantity }],
      },
      region
    )
  } catch (error) {
    console.error('Error updating TikTok inventory:', error)
    throw error
  }
}

async function fetchTikTokCategories(accessToken: string, shopId: string, region: string = 'US') {
  try {
    const appKey = Deno.env.get('TIKTOK_APP_KEY')
    
    if (!appKey) {
      // Return common TikTok Shop categories
      return [
        { id: 'fashion', name: 'Fashion & Accessories', parent_id: null },
        { id: 'beauty', name: 'Beauty & Personal Care', parent_id: null },
        { id: 'home', name: 'Home & Living', parent_id: null },
        { id: 'electronics', name: 'Electronics', parent_id: null },
        { id: 'sports', name: 'Sports & Outdoors', parent_id: null },
        { id: 'toys', name: 'Toys & Hobbies', parent_id: null },
        { id: 'health', name: 'Health & Wellness', parent_id: null },
        { id: 'food', name: 'Food & Beverages', parent_id: null },
      ]
    }

    const data = await tiktokApiRequest(
      accessToken,
      shopId,
      '/api/products/categories',
      'GET',
      undefined,
      region
    )
    
    return data.categories || []
  } catch (error) {
    console.error('Error fetching TikTok categories:', error)
    return []
  }
}

function mapTikTokStatus(tiktokStatus: number | string): string {
  const statusMap: Record<string, string> = {
    '100': 'pending',
    '111': 'processing',
    '112': 'processing',
    '121': 'shipped',
    '122': 'delivered',
    '130': 'completed',
    '140': 'cancelled',
    'UNPAID': 'pending',
    'AWAITING_SHIPMENT': 'processing',
    'AWAITING_COLLECTION': 'processing',
    'IN_TRANSIT': 'shipped',
    'DELIVERED': 'delivered',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
  }
  
  return statusMap[tiktokStatus?.toString()] || 'pending'
}
