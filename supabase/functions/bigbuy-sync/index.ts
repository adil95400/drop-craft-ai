import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BigBuyCredentials {
  api_key: string;
  test_mode?: boolean;
  language?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, ...params } = await req.json()

    // Get BigBuy integration details
    const { data: integration } = await supabaseClient
      .from('integrations')
      .select('credentials')
      .eq('user_id', user.id)
      .eq('platform_id', 'bigbuy')
      .eq('is_active', true)
      .single()

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'BigBuy integration not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const credentials = integration.credentials as BigBuyCredentials

    switch (action) {
      case 'testConnection':
        return await testConnection(credentials)
      case 'syncProducts':
        return await syncProducts(supabaseClient, user.id, credentials, params)
      case 'syncOrders':
        return await syncOrders(supabaseClient, user.id, credentials, params)
      case 'getStock':
        return await getStock(credentials, params.sku)
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('BigBuy sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testConnection(credentials: BigBuyCredentials) {
  try {
    const baseUrl = credentials.test_mode 
      ? 'https://api-test.bigbuy.eu' 
      : 'https://api.bigbuy.eu'
    
    const response = await fetch(`${baseUrl}/rest/user/me.json`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BigBuy API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection successful',
        user: data.user 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function syncProducts(supabaseClient: any, userId: string, credentials: BigBuyCredentials, params: any) {
  try {
    const baseUrl = credentials.test_mode 
      ? 'https://api-test.bigbuy.eu' 
      : 'https://api.bigbuy.eu'
    
    const limit = params.limit || 50
    const page = params.page || 1
    
    // Fetch products from BigBuy API
    const response = await fetch(`${baseUrl}/rest/catalog/products.json?limit=${limit}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BigBuy API error: ${response.status} ${response.statusText}`)
    }

    const products = await response.json()
    
    const transformedProducts = []
    let imported = 0
    let duplicates = 0
    const errors = []

    for (const product of products) {
      try {
        // Get product images
        const imagesResponse = await fetch(`${baseUrl}/rest/catalog/productimages/${product.id}.json`, {
          headers: {
            'Authorization': `Bearer ${credentials.api_key}`,
            'Content-Type': 'application/json'
          }
        })
        
        let images = []
        if (imagesResponse.ok) {
          const imageData = await imagesResponse.json()
          images = imageData.map((img: any) => img.url)
        }

        // Get product stock
        const stockResponse = await fetch(`${baseUrl}/rest/catalog/productstock/${product.id}.json`, {
          headers: {
            'Authorization': `Bearer ${credentials.api_key}`,
            'Content-Type': 'application/json'
          }
        })
        
        let stock = 0
        if (stockResponse.ok) {
          const stockData = await stockResponse.json()
          stock = stockData.quantity || 0
        }

        const transformedProduct = {
          user_id: userId,
          external_id: product.id.toString(),
          sku: product.sku || `bigbuy-${product.id}`,
          name: product.name || '',
          description: product.description || '',
          price: parseFloat(product.retailPrice) || 0,
          cost_price: parseFloat(product.wholesalePrice) || null,
          currency: 'EUR',
          stock_quantity: stock,
          images: images,
          category: product.category?.name || 'General',
          brand: product.brand?.name || '',
          supplier_name: 'BigBuy',
          supplier_sku: product.sku || `bigbuy-${product.id}`,
          attributes: {
            weight: product.weight,
            dimensions: {
              length: product.length,
              width: product.width,
              height: product.height
            },
            ean: product.ean,
            category_id: product.category?.id,
            brand_id: product.brand?.id
          },
          last_synced_at: new Date().toISOString()
        }

        // Check if product already exists
        const { data: existingProduct } = await supabaseClient
          .from('catalog_products')
          .select('id')
          .eq('user_id', userId)
          .eq('external_id', product.id.toString())
          .eq('supplier_name', 'BigBuy')
          .single()

        if (existingProduct) {
          // Update existing product
          await supabaseClient
            .from('catalog_products')
            .update(transformedProduct)
            .eq('id', existingProduct.id)
          
          duplicates++
        } else {
          // Insert new product
          const { error: insertError } = await supabaseClient
            .from('catalog_products')
            .insert(transformedProduct)

          if (insertError) {
            errors.push(`Error inserting product ${product.id}: ${insertError.message}`)
          } else {
            imported++
          }
        }

        transformedProducts.push(transformedProduct)

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (productError) {
        errors.push(`Error processing product ${product.id}: ${productError.message}`)
      }
    }

    // Update integration sync stats
    await supabaseClient
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_status: 'completed'
      })
      .eq('user_id', userId)
      .eq('platform_id', 'bigbuy')

    return new Response(
      JSON.stringify({
        success: true,
        total: products.length,
        imported,
        duplicates,
        errors,
        products: transformedProducts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('BigBuy product sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function syncOrders(supabaseClient: any, userId: string, credentials: BigBuyCredentials, params: any) {
  try {
    const baseUrl = credentials.test_mode 
      ? 'https://api-test.bigbuy.eu' 
      : 'https://api.bigbuy.eu'
    
    // Fetch orders from BigBuy API
    const response = await fetch(`${baseUrl}/rest/orders.json?limit=${params.limit || 50}`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BigBuy API error: ${response.status} ${response.statusText}`)
    }

    const orders = await response.json()
    let processed = 0
    const errors = []

    for (const order of orders) {
      try {
        const transformedOrder = {
          user_id: userId,
          external_id: order.id.toString(),
          order_number: order.reference || `BB-${order.id}`,
          status: order.status || 'pending',
          total_amount: parseFloat(order.totalAmount) || 0,
          currency: order.currency || 'EUR',
          customer_info: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone
          },
          shipping_address: order.shippingAddress || {},
          billing_address: order.billingAddress || {},
          items: order.items || [],
          supplier_name: 'BigBuy',
          created_at: order.createdAt || new Date().toISOString(),
          updated_at: order.updatedAt || new Date().toISOString()
        }

        // Upsert order
        const { error } = await supabaseClient
          .from('orders')
          .upsert(transformedOrder, {
            onConflict: 'user_id,external_id,supplier_name'
          })

        if (error) {
          errors.push(`Error processing order ${order.id}: ${error.message}`)
        } else {
          processed++
        }

      } catch (orderError) {
        errors.push(`Error processing order ${order.id}: ${orderError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: orders.length,
        processed,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('BigBuy order sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getStock(credentials: BigBuyCredentials, sku: string) {
  try {
    const baseUrl = credentials.test_mode 
      ? 'https://api-test.bigbuy.eu' 
      : 'https://api.bigbuy.eu'
    
    const response = await fetch(`${baseUrl}/rest/catalog/productstock/${sku}.json`, {
      headers: {
        'Authorization': `Bearer ${credentials.api_key}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BigBuy API error: ${response.status} ${response.statusText}`)
    }

    const stockData = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        sku,
        quantity: stockData.quantity || 0,
        available: stockData.available || false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}