import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, api_key, ...data } = await req.json()

    // Validate API key is provided
    const bigbuyApiKey = api_key || Deno.env.get('BIGBUY_API_KEY')
    
    if (!bigbuyApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'BigBuy API key not configured. Add BIGBUY_API_KEY to Supabase secrets or provide api_key in request.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'fetch_products':
      case 'get_products':
        return await getBigBuyProducts(bigbuyApiKey, data, supabaseClient)
      
      case 'get_categories':
        return await getBigBuyCategories(bigbuyApiKey)
      
      case 'import_products':
        return await importBigBuyProducts(bigbuyApiKey, data, supabaseClient)
      
      case 'fetch_inventory':
      case 'get_stock':
        return await getBigBuyStock(bigbuyApiKey, data)
      
      case 'fetch_pricing':
        return await getBigBuyPricing(bigbuyApiKey, data)
      
      case 'create_order':
        return await createBigBuyOrder(bigbuyApiKey, data, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ 
            success: false,
            error: `Action not supported: ${action}`,
            supported_actions: ['fetch_products', 'get_categories', 'fetch_inventory', 'fetch_pricing', 'create_order', 'import_products']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erreur BigBuy integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getBigBuyProducts(apiKey: string, params: any, supabase: any) {
  try {
    const { limit = 100, page = 1, category_id, supplier_id } = params
    
    console.log(`🔍 Fetching BigBuy products: limit=${limit}, page=${page}, category=${category_id || 'all'}`)

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString()
    })
    
    if (category_id) {
      queryParams.append('categoryId', category_id.toString())
    }

    // Real BigBuy API call with pagination
    const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ BigBuy API Error (${response.status}):`, errorText)
      throw new Error(`BigBuy API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Transform BigBuy products to our format
    const transformedProducts = data.map((product: any) => ({
      external_id: product.id?.toString(),
      sku: product.sku,
      title: product.name,
      name: product.name,
      description: product.description,
      price: parseFloat(product.retailPrice || 0),
      costPrice: parseFloat(product.wholesalePrice || 0),
      currency: 'EUR',
      stock: product.stock || 0,
      images: product.images?.map((img: any) => img.url) || [],
      category: product.category?.name,
      brand: product.brand?.name,
      weight: product.weight,
      dimensions: product.dimensions,
      supplier: {
        name: 'BigBuy',
        sku: product.sku
      }
    }))

    console.log(`✅ Retrieved ${transformedProducts.length} BigBuy products`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        products: transformedProducts,
        total: transformedProducts.length,
        page,
        per_page: limit,
        message: `${transformedProducts.length} products fetched from BigBuy`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ getBigBuyProducts error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getBigBuyCategories(apiKey: string) {
  try {
    console.log('📁 Fetching BigBuy categories')

    const response = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ BigBuy API Error (${response.status}):`, errorText)
      throw new Error(`BigBuy API Error: ${response.status}`)
    }

    const data = await response.json()
    
    console.log(`✅ Retrieved ${data.length} BigBuy categories`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: data,
        total: data.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ getBigBuyCategories error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function importBigBuyProducts(apiKey: string, productData: any, supabase: any) {
  try {
    const { products, user_id } = productData
    let imported = 0

    for (const product of products) {
      const catalogProduct = {
        external_id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: parseFloat(product.retailPrice),
        cost_price: parseFloat(product.wholesalePrice),
        original_price: parseFloat(product.retailPrice),
        image_url: product.images?.[0]?.url,
        image_urls: product.images?.map((img: any) => img.url),
        supplier_id: 'bigbuy',
        supplier_name: 'BigBuy',
        supplier_url: 'https://www.bigbuy.eu',
        category: product.category?.name,
        tags: [product.brand?.name, 'bigbuy', 'european'].filter(Boolean),
        stock_quantity: product.stock || 0,
        sku: product.sku,
        ean: product.ean,
        availability_status: product.stock > 0 ? 'in_stock' : 'out_of_stock',
        shipping_cost: parseFloat(product.shippingCost || '4.99'),
        delivery_time: '2-5 jours',
        profit_margin: calculateProfitMargin(parseFloat(product.retailPrice), parseFloat(product.wholesalePrice)),
        brand: product.brand?.name,
        weight: product.weight,
        dimensions: product.dimensions
      }

      const { error } = await supabase
        .from('catalog_products')
        .upsert(catalogProduct, { onConflict: 'external_id,supplier_id' })

      if (!error) imported++
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported,
        total: products.length,
        message: `${imported} produits importés depuis BigBuy`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getBigBuyStock(apiKey: string, data: any) {
  try {
    const { product_ids } = data
    
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      throw new Error('product_ids array is required')
    }

    console.log(`📦 Fetching stock for ${product_ids.length} BigBuy products`)

    const response = await fetch('https://api.bigbuy.eu/rest/catalog/productsstocks.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products: product_ids })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ BigBuy API Error (${response.status}):`, errorText)
      throw new Error(`BigBuy API Error: ${response.status}`)
    }

    const stockData = await response.json()
    
    // Transform to standard format
    const inventory = stockData.map((item: any) => ({
      product_id: item.id?.toString() || item.productId?.toString(),
      stock: item.stock || 0,
      available: (item.stock || 0) > 0
    }))

    console.log(`✅ Retrieved stock data for ${inventory.length} products`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        inventory,
        total: inventory.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ getBigBuyStock error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getBigBuyPricing(apiKey: string, data: any) {
  try {
    const { product_ids } = data
    
    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      throw new Error('product_ids array is required')
    }

    console.log(`💰 Fetching pricing for ${product_ids.length} BigBuy products`)

    // BigBuy doesn't have a separate pricing endpoint, we fetch full product data
    // and extract pricing information
    const productPromises = product_ids.slice(0, 20).map(async (productId: string) => {
      const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${productId}.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch product ${productId}: ${response.status}`)
        return null
      }
      
      return await response.json()
    })

    const products = await Promise.all(productPromises)
    const validProducts = products.filter(p => p !== null)
    
    // Transform to pricing format
    const pricing = validProducts.map((product: any) => ({
      product_id: product.id?.toString(),
      retail_price: parseFloat(product.retailPrice || 0),
      wholesale_price: parseFloat(product.wholesalePrice || 0),
      cost_price: parseFloat(product.wholesalePrice || 0),
      price: parseFloat(product.retailPrice || 0),
      currency: 'EUR'
    }))

    console.log(`✅ Retrieved pricing for ${pricing.length} products`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pricing,
        total: pricing.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ getBigBuyPricing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function createBigBuyOrder(apiKey: string, orderData: any, supabase: any) {
  try {
    console.log('📦 Creating BigBuy order')

    const response = await fetch('https://api.bigbuy.eu/rest/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ BigBuy API Error (${response.status}):`, errorText)
      throw new Error(`BigBuy API Error: ${response.status}`)
    }

    const order = await response.json()
    
    console.log(`✅ BigBuy order created: ${order.id || 'N/A'}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        order,
        message: 'BigBuy order created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ createBigBuyOrder error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Mock functions removed - now using real BigBuy API
// All requests require BIGBUY_API_KEY to be configured
// See README.md for setup instructions

function calculateProfitMargin(retailPrice: number, wholesalePrice: number): number {
  if (wholesalePrice === 0) return 0
  return Math.round(((retailPrice - wholesalePrice) / wholesalePrice * 100) * 100) / 100
}