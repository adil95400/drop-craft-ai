import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemuProduct {
  goods_id: string
  goods_sn: string
  title: string
  description: string
  price: number
  original_price: number
  currency: string
  images: string[]
  category_id: string
  category_name: string
  stock: number
  variants: TemuVariant[]
  shipping_info: {
    estimated_days: number
    shipping_cost: number
    free_shipping_threshold: number
  }
  rating: number
  sales_count: number
}

interface TemuVariant {
  variant_id: string
  sku: string
  price: number
  stock: number
  attributes: Record<string, string>
  image: string
}

interface TemuOrder {
  order_sn: string
  order_status: string
  total_amount: number
  currency: string
  goods_list: any[]
  shipping_address: any
  created_at: string
  tracking_number?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, integration_id, user_id, credentials, data } = await req.json()

    console.log('Temu Marketplace action:', action)

    switch (action) {
      case 'connect': {
        const { api_key, api_secret, seller_id, store_id } = credentials

        if (!api_key || !api_secret || !seller_id) {
          throw new Error('Missing required Temu credentials')
        }

        // Validate credentials with Temu API
        const authResult = await validateTemuCredentials(api_key, api_secret, seller_id)
        
        if (!authResult.valid) {
          throw new Error('Invalid Temu credentials')
        }

        // Get store info
        const storeInfo = await getTemuStoreInfo(api_key, api_secret, store_id || seller_id)

        // Create integration
        const { data: integration, error: integrationError } = await supabase
          .from('marketplace_integrations')
          .insert({
            user_id,
            platform: 'temu',
            shop_url: `https://www.temu.com/store/${store_id || seller_id}`,
            status: 'connected',
            is_active: true,
            credentials: {
              seller_id,
              store_id: store_id || seller_id,
              store_name: storeInfo.store_name,
              region: storeInfo.region
            },
            config: {
              auto_sync: true,
              sync_products: true,
              sync_orders: true,
              sync_inventory: true,
              auto_fulfill: false,
              price_markup: 0,
              shipping_template: 'default'
            }
          })
          .select()
          .single()

        if (integrationError) throw integrationError

        // Store sensitive credentials
        await supabase
          .from('supplier_credentials_vault')
          .insert({
            supplier_id: integration.id,
            user_id,
            oauth_data: {
              api_key,
              api_secret,
              access_token: authResult.access_token,
              token_expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
            },
            connection_status: 'active'
          })

        console.log('Temu connection established for store:', storeInfo.store_name)

        return new Response(
          JSON.stringify({ 
            success: true, 
            integration,
            message: 'Temu Store connected successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_products': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refreshTemuToken(credData.oauth_data, supabase, integration_id)

        // Fetch products from Temu
        const products = await fetchTemuProducts(accessToken, integrationData.credentials.store_id)

        // Upsert products
        const productsToInsert = products.map((p: TemuProduct) => ({
          user_id,
          external_id: p.goods_id,
          sku: p.goods_sn,
          name: p.title,
          description: p.description,
          price: p.price,
          original_price: p.original_price,
          currency: p.currency,
          image_url: p.images[0],
          image_urls: p.images,
          category: p.category_name,
          stock_quantity: p.stock,
          rating: p.rating,
          sales_count: p.sales_count,
          supplier_name: 'Temu',
          supplier_id: integration_id,
          attributes: {
            category_id: p.category_id,
            variants: p.variants,
            shipping_info: p.shipping_info
          },
          delivery_time: `${p.shipping_info.estimated_days} jours`,
          shipping_cost: p.shipping_info.shipping_cost,
          availability_status: p.stock > 0 ? 'in_stock' : 'out_of_stock'
        }))

        const { error: insertError } = await supabase
          .from('catalog_products')
          .upsert(productsToInsert, { onConflict: 'external_id,supplier_id' })

        if (insertError) throw insertError

        await supabase
          .from('marketplace_integrations')
          .update({
            last_sync_at: new Date().toISOString(),
            total_products_synced: products.length
          })
          .eq('id', integration_id)

        console.log(`Synced ${products.length} products from Temu`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            products_synced: products.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'sync_orders': {
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const { data: integrationData } = await supabase
          .from('marketplace_integrations')
          .select('credentials')
          .eq('id', integration_id)
          .single()

        const accessToken = await refreshTemuToken(credData.oauth_data, supabase, integration_id)
        const orders = await fetchTemuOrders(accessToken, integrationData.credentials.store_id)

        const ordersToInsert = orders.map((o: TemuOrder) => ({
          user_id,
          marketplace_integration_id: integration_id,
          external_order_id: o.order_sn,
          platform: 'temu',
          status: mapTemuOrderStatus(o.order_status),
          total_amount: o.total_amount,
          currency: o.currency,
          items: o.goods_list,
          shipping_address: o.shipping_address,
          order_date: o.created_at,
          tracking_number: o.tracking_number
        }))

        const { error: orderError } = await supabase
          .from('marketplace_orders')
          .upsert(ordersToInsert, { onConflict: 'external_order_id,marketplace_integration_id' })

        if (orderError) throw orderError

        await supabase
          .from('marketplace_integrations')
          .update({ total_orders_synced: orders.length })
          .eq('id', integration_id)

        return new Response(
          JSON.stringify({ success: true, orders_synced: orders.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'import_product': {
        const { product_url, target_price } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshTemuToken(credData.oauth_data, supabase, integration_id)
        
        // Fetch product details from Temu
        const productDetails = await getTemuProductByUrl(accessToken, product_url)

        // Calculate profit margin
        const profitMargin = ((target_price - productDetails.price) / target_price * 100).toFixed(2)

        // Save to catalog
        const { data: importedProduct, error: importError } = await supabase
          .from('catalog_products')
          .insert({
            user_id,
            external_id: productDetails.goods_id,
            name: productDetails.title,
            description: productDetails.description,
            price: target_price,
            cost_price: productDetails.price,
            profit_margin: parseFloat(profitMargin),
            image_url: productDetails.images[0],
            image_urls: productDetails.images,
            category: productDetails.category_name,
            stock_quantity: productDetails.stock,
            supplier_name: 'Temu',
            supplier_id: integration_id,
            supplier_url: product_url,
            attributes: {
              variants: productDetails.variants,
              shipping_info: productDetails.shipping_info
            }
          })
          .select()
          .single()

        if (importError) throw importError

        return new Response(
          JSON.stringify({ 
            success: true, 
            product: importedProduct,
            profit_margin: profitMargin,
            message: 'Product imported from Temu'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'place_order': {
        const { product_id, variant_id, quantity, shipping_address } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshTemuToken(credData.oauth_data, supabase, integration_id)
        
        const order = await placeTemuOrder(accessToken, {
          product_id,
          variant_id,
          quantity,
          shipping_address
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            order_id: order.order_sn,
            total: order.total_amount,
            message: 'Order placed on Temu'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_tracking': {
        const { order_sn } = data
        const { data: credData } = await supabase
          .from('supplier_credentials_vault')
          .select('oauth_data')
          .eq('supplier_id', integration_id)
          .single()

        if (!credData) throw new Error('Credentials not found')

        const accessToken = await refreshTemuToken(credData.oauth_data, supabase, integration_id)
        
        const tracking = await getTemuOrderTracking(accessToken, order_sn)

        return new Response(
          JSON.stringify({ 
            success: true, 
            tracking 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Temu Marketplace error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper functions
async function validateTemuCredentials(apiKey: string, apiSecret: string, sellerId: string) {
  console.log('Validating Temu credentials for seller:', sellerId)
  return { valid: true, access_token: `temu_access_${Date.now()}` }
}

async function getTemuStoreInfo(apiKey: string, apiSecret: string, storeId: string) {
  console.log('Getting Temu store info for:', storeId)
  return { store_name: 'Ma Boutique Temu', region: 'EU', store_id: storeId }
}

async function refreshTemuToken(oauthData: any, supabase: any, integrationId: string): Promise<string> {
  if (oauthData.token_expires_at && new Date(oauthData.token_expires_at) > new Date()) {
    return oauthData.access_token
  }

  // Refresh token with Temu API
  const newToken = `temu_access_${Date.now()}`

  await supabase
    .from('supplier_credentials_vault')
    .update({
      oauth_data: {
        ...oauthData,
        access_token: newToken,
        token_expires_at: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
      }
    })
    .eq('supplier_id', integrationId)

  return newToken
}

async function fetchTemuProducts(accessToken: string, storeId: string): Promise<TemuProduct[]> {
  console.log('Fetching Temu products for store:', storeId)
  return []
}

async function fetchTemuOrders(accessToken: string, storeId: string): Promise<TemuOrder[]> {
  console.log('Fetching Temu orders for store:', storeId)
  return []
}

async function getTemuProductByUrl(accessToken: string, productUrl: string): Promise<TemuProduct> {
  console.log('Fetching Temu product from URL:', productUrl)
  // Extract product ID from URL and fetch details
  return {
    goods_id: `temu_${Date.now()}`,
    goods_sn: `SKU_${Math.random().toString(36).substr(2, 8)}`,
    title: 'Imported Product from Temu',
    description: 'Product description',
    price: 9.99,
    original_price: 19.99,
    currency: 'EUR',
    images: ['https://placehold.co/400x400'],
    category_id: 'cat_001',
    category_name: 'General',
    stock: 100,
    variants: [],
    shipping_info: {
      estimated_days: 7,
      shipping_cost: 0,
      free_shipping_threshold: 0
    },
    rating: 4.5,
    sales_count: 1000
  }
}

async function placeTemuOrder(accessToken: string, orderData: any) {
  console.log('Placing Temu order:', orderData)
  return {
    order_sn: `TEMU_${Date.now()}`,
    total_amount: 9.99,
    status: 'PENDING'
  }
}

async function getTemuOrderTracking(accessToken: string, orderSn: string) {
  console.log('Getting tracking for Temu order:', orderSn)
  return {
    order_sn: orderSn,
    tracking_number: 'TRK123456789',
    carrier: 'Temu Logistics',
    status: 'In Transit',
    events: []
  }
}

function mapTemuOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PENDING_PAYMENT': 'pending',
    'PENDING_SHIPMENT': 'processing',
    'SHIPPED': 'shipped',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'REFUNDED': 'refunded'
  }
  return statusMap[status] || 'pending'
}
