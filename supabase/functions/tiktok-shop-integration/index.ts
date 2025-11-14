import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { action, ...params } = await req.json()
    console.log('TikTok Shop action:', action, params)

    let result

    switch (action) {
      case 'connect':
        result = await connectTikTokShop(user.id, params, supabaseClient)
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

async function connectTikTokShop(userId: string, params: any, supabase: any) {
  const { shop_id, access_token, shop_name, shop_region } = params

  // Validate credentials with TikTok Shop API
  const isValid = await validateTikTokCredentials(access_token, shop_id)
  
  if (!isValid) {
    throw new Error('Invalid TikTok Shop credentials')
  }

  // Store integration
  const { data: integration, error } = await supabase
    .from('marketplace_integrations')
    .insert({
      user_id: userId,
      platform: 'tiktok_shop',
      shop_name: shop_name || `TikTok Shop ${shop_id}`,
      shop_domain: `shop_${shop_id}`,
      encrypted_credentials: {
        shop_id,
        access_token,
        shop_region: shop_region || 'US',
      },
      status: 'connected',
      sync_enabled: true,
      auto_sync_products: true,
      auto_sync_orders: true,
      sync_frequency_minutes: 60,
    })
    .select()
    .single()

  if (error) throw error

  console.log('TikTok Shop connected:', integration.id)

  return {
    success: true,
    integration_id: integration.id,
    message: 'TikTok Shop connecté avec succès',
  }
}

async function publishProduct(params: any, supabase: any) {
  const { integration_id, product_id } = params

  // Get integration credentials
  const { data: integration } = await supabase
    .from('marketplace_integrations')
    .select('*')
    .eq('id', integration_id)
    .single()

  if (!integration) throw new Error('Integration not found')

  // Get product details
  const { data: product } = await supabase
    .from('imported_products')
    .select('*')
    .eq('id', product_id)
    .single()

  if (!product) throw new Error('Product not found')

  const credentials = integration.encrypted_credentials
  
  // Publish to TikTok Shop
  const tiktokProduct = await publishToTikTokAPI(
    credentials.access_token,
    credentials.shop_id,
    {
      title: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency || 'USD',
      images: product.image_urls || [],
      sku: product.sku,
      stock: product.stock_quantity || 0,
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

  console.log('Product published to TikTok Shop:', published.id)

  return {
    success: true,
    published_id: published.id,
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
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
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
    credentials.shop_id
  )

  let syncedCount = 0
  const errors = []

  for (const tiktokProduct of tiktokProducts) {
    try {
      // Import product to our system
      await supabase.from('imported_products').upsert({
        user_id: integration.user_id,
        name: tiktokProduct.title,
        description: tiktokProduct.description,
        price: tiktokProduct.price,
        currency: tiktokProduct.currency,
        sku: tiktokProduct.sku,
        stock_quantity: tiktokProduct.stock,
        image_urls: tiktokProduct.images,
        source: 'tiktok_shop',
        external_id: tiktokProduct.product_id,
        supplier_name: 'TikTok Shop',
      }, { onConflict: 'external_id,user_id' })
      
      syncedCount++
    } catch (error) {
      errors.push({ product_id: tiktokProduct.product_id, error: error.message })
    }
  }

  // Update last sync time
  await supabase
    .from('marketplace_integrations')
    .update({ last_sync_at: new Date().toISOString() })
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
    credentials.shop_id
  )

  let syncedCount = 0

  for (const order of tiktokOrders) {
    try {
      await supabase.from('orders').upsert({
        user_id: integration.user_id,
        order_number: order.order_id,
        external_order_id: order.order_id,
        platform: 'tiktok_shop',
        status: mapTikTokStatus(order.status),
        total_amount: order.total_amount,
        currency: order.currency,
        customer_name: order.recipient_name,
        customer_email: order.buyer_email,
        customer_phone: order.recipient_phone,
        shipping_address: {
          name: order.recipient_name,
          address1: order.recipient_address,
          city: order.recipient_city,
          province: order.recipient_state,
          country: order.recipient_country,
          zip: order.recipient_zipcode,
          phone: order.recipient_phone,
        },
        items: order.items.map((item: any) => ({
          product_name: item.product_name,
          sku: item.seller_sku,
          quantity: item.quantity,
          price: item.sale_price,
        })),
        order_date: order.create_time,
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

  if (!published) throw new Error('Product not published')

  const credentials = integration.encrypted_credentials
  
  await updateTikTokInventory(
    credentials.access_token,
    credentials.shop_id,
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

  const credentials = integration.encrypted_credentials
  
  const categories = await fetchTikTokCategories(
    credentials.access_token,
    credentials.shop_id
  )

  return { success: true, categories }
}

// TikTok Shop API Helper Functions
async function validateTikTokCredentials(accessToken: string, shopId: string): Promise<boolean> {
  try {
    // In production, make actual API call to TikTok Shop
    // For now, simulate validation
    console.log('Validating TikTok credentials:', { shopId })
    return accessToken && shopId ? true : false
  } catch (error) {
    return false
  }
}

async function publishToTikTokAPI(accessToken: string, shopId: string, product: any) {
  // In production, make actual API call to TikTok Shop
  console.log('Publishing to TikTok:', { shopId, product: product.title })
  
  return {
    product_id: `tiktok_${Date.now()}`,
    product_url: `https://shop.tiktok.com/product/${Date.now()}`,
    status: 'active',
  }
}

async function fetchTikTokProducts(accessToken: string, shopId: string) {
  // In production, make actual API call to TikTok Shop
  console.log('Fetching TikTok products:', { shopId })
  
  return []
}

async function fetchTikTokOrders(accessToken: string, shopId: string) {
  // In production, make actual API call to TikTok Shop
  console.log('Fetching TikTok orders:', { shopId })
  
  return []
}

async function updateTikTokInventory(accessToken: string, shopId: string, productId: string, quantity: number) {
  // In production, make actual API call to TikTok Shop
  console.log('Updating TikTok inventory:', { shopId, productId, quantity })
}

async function fetchTikTokCategories(accessToken: string, shopId: string) {
  // In production, make actual API call to TikTok Shop
  console.log('Fetching TikTok categories:', { shopId })
  
  return [
    { id: '1', name: 'Fashion & Accessories' },
    { id: '2', name: 'Beauty & Personal Care' },
    { id: '3', name: 'Home & Living' },
    { id: '4', name: 'Electronics' },
    { id: '5', name: 'Sports & Outdoors' },
  ]
}

function mapTikTokStatus(tiktokStatus: string): string {
  const statusMap: Record<string, string> = {
    'UNPAID': 'pending',
    'AWAITING_SHIPMENT': 'processing',
    'AWAITING_COLLECTION': 'processing',
    'IN_TRANSIT': 'shipped',
    'DELIVERED': 'delivered',
    'COMPLETED': 'delivered',
    'CANCELLED': 'cancelled',
  }
  
  return statusMap[tiktokStatus] || 'pending'
}
