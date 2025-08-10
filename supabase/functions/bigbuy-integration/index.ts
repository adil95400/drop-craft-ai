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

    switch (action) {
      case 'get_products':
        return await getBigBuyProducts(api_key, data, supabaseClient)
      
      case 'get_categories':
        return await getBigBuyCategories(api_key)
      
      case 'import_products':
        return await importBigBuyProducts(api_key, data, supabaseClient)
      
      case 'get_stock':
        return await getBigBuyStock(api_key, data)
      
      case 'create_order':
        return await createBigBuyOrder(api_key, data, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
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
    if (!apiKey) {
      // Return mock data if no API key
      return new Response(
        JSON.stringify({ 
          success: true, 
          products: generateMockBigBuyProducts(),
          message: 'Produits BigBuy (données de test)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Real BigBuy API call
    const response = await fetch('https://api.bigbuy.eu/rest/catalog/products.json', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`BigBuy API Error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        products: data,
        total: data.length,
        message: `${data.length} produits récupérés depuis BigBuy`
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

async function getBigBuyCategories(apiKey: string) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          categories: generateMockCategories(),
          message: 'Catégories BigBuy (données de test)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories: data
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

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          stock: product_ids.map((id: string) => ({
            id,
            stock: Math.floor(Math.random() * 100),
            status: 'available'
          })),
          message: 'Stock BigBuy (données de test)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.bigbuy.eu/rest/catalog/productsstocks.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ products: product_ids })
    })

    const stockData = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        stock: stockData
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

async function createBigBuyOrder(apiKey: string, orderData: any, supabase: any) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          order: {
            id: 'BB' + Date.now(),
            status: 'processing',
            tracking: 'BB' + Math.random().toString(36).substr(2, 9).toUpperCase()
          },
          message: 'Commande BigBuy créée (test)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.bigbuy.eu/rest/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    const order = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        order,
        message: 'Commande BigBuy créée avec succès'
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

function generateMockBigBuyProducts() {
  const products = []
  const categories = ['Electronics', 'Home & Garden', 'Sports', 'Fashion', 'Baby']
  const brands = ['Samsung', 'Sony', 'Philips', 'Bosch', 'Nike']

  for (let i = 1; i <= 50; i++) {
    products.push({
      id: i,
      name: `BigBuy Product Premium ${i}`,
      description: `High quality European product with fast delivery and warranty support`,
      retailPrice: (Math.random() * 100 + 20).toFixed(2),
      wholesalePrice: (Math.random() * 50 + 10).toFixed(2),
      sku: `BB-${i}-${Date.now()}`,
      ean: `123456789012${i.toString().padStart(2, '0')}`,
      stock: Math.floor(Math.random() * 200),
      category: {
        id: Math.floor(Math.random() * 5) + 1,
        name: categories[Math.floor(Math.random() * categories.length)]
      },
      brand: {
        id: Math.floor(Math.random() * 5) + 1,
        name: brands[Math.floor(Math.random() * brands.length)]
      },
      images: [
        {
          url: `https://via.placeholder.com/400x400/059669/FFFFFF?text=BigBuy+${i}`,
          position: 1
        },
        {
          url: `https://via.placeholder.com/400x400/047857/FFFFFF?text=BigBuy+${i}+B`,
          position: 2
        }
      ],
      weight: Math.round(Math.random() * 5000), // grams
      dimensions: {
        length: Math.round(Math.random() * 50),
        width: Math.round(Math.random() * 50),
        height: Math.round(Math.random() * 30)
      },
      shippingCost: '4.99'
    })
  }

  return products
}

function generateMockCategories() {
  return [
    { id: 1, name: 'Electronics', parent_id: null },
    { id: 2, name: 'Home & Garden', parent_id: null },
    { id: 3, name: 'Sports & Outdoor', parent_id: null },
    { id: 4, name: 'Fashion', parent_id: null },
    { id: 5, name: 'Baby & Kids', parent_id: null },
    { id: 11, name: 'Smartphones', parent_id: 1 },
    { id: 12, name: 'Laptops', parent_id: 1 },
    { id: 21, name: 'Kitchen', parent_id: 2 },
    { id: 22, name: 'Bathroom', parent_id: 2 }
  ]
}

function calculateProfitMargin(retailPrice: number, wholesalePrice: number): number {
  if (wholesalePrice === 0) return 0
  return Math.round(((retailPrice - wholesalePrice) / wholesalePrice * 100) * 100) / 100
}