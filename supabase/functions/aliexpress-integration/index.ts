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

    const { action, api_key, app_secret, keywords, category } = await req.json()

    switch (action) {
      case 'search_products':
        return await searchProducts(api_key, app_secret, keywords, category, supabaseClient)
      
      case 'get_product_details':
        return await getProductDetails(api_key, app_secret, req.json(), supabaseClient)
      
      case 'import_products':
        return await importProducts(api_key, app_secret, req.json(), supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erreur AliExpress integration:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function searchProducts(apiKey: string, appSecret: string, keywords: string, category: string, supabase: any) {
  try {
    // Get AliExpress API key from environment
    const ALIEXPRESS_API_KEY = Deno.env.get('ALIEXPRESS_API_KEY')
    
    if (!ALIEXPRESS_API_KEY) {
      console.log('AliExpress API key not found, using mock data')
      const mockProducts = generateMockAliExpressProducts(keywords, category)
      return new Response(
        JSON.stringify({ 
          success: true, 
          products: mockProducts,
          total: mockProducts.length,
          message: `${mockProducts.length} produits trouvés (données de test)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Real AliExpress API call
    console.log('Making real AliExpress API call with key:', ALIEXPRESS_API_KEY.substring(0, 8) + '...')
    
    try {
      // AliExpress Dropshipping API call
      const response = await fetch('https://api.aliexpress.com/dropshipping/product/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ALIEXPRESS_API_KEY}`
        },
        body: JSON.stringify({
          keywords: keywords,
          category: category,
          page: 1,
          page_size: 20,
          sort: 'sale_count_desc'
        })
      })

      if (!response.ok) {
        throw new Error(`AliExpress API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform AliExpress data to our format
      const products = data.products?.map((product: any) => ({
        id: product.product_id,
        title: product.subject,
        description: product.description,
        price: product.target_sale_price,
        original_price: product.target_original_price,
        image_url: product.product_main_image_url,
        images: product.product_video_url ? [product.product_main_image_url] : [],
        category: category || 'general',
        tags: [keywords, 'aliexpress', 'imported'],
        sku: `AE-${product.product_id}`,
        url: product.product_detail_url,
        orders: product.evaluate_rate || 0,
        rating: product.avg_evaluation_rating || 0,
        shipping_cost: product.freight?.value || 2.99,
        supplier: {
          name: product.owner_member_display,
          rating: product.evaluate_rate || 0
        }
      })) || []

      return new Response(
        JSON.stringify({ 
          success: true, 
          products: products,
          total: products.length,
          message: `${products.length} produits trouvés sur AliExpress`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (apiError) {
      console.error('AliExpress API error:', apiError)
      // Fallback to mock data
      const mockProducts = generateMockAliExpressProducts(keywords, category)
      return new Response(
        JSON.stringify({ 
          success: true, 
          products: mockProducts,
          total: mockProducts.length,
          message: `${mockProducts.length} produits trouvés (API indisponible, données de test)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function getProductDetails(apiKey: string, appSecret: string, productData: any, supabase: any) {
  try {
    const { product_id } = productData

    // Mock detailed product info
    const productDetails = {
      id: product_id,
      title: "Produit AliExpress Premium",
      description: "Description détaillée du produit avec spécifications complètes",
      price: {
        min: 9.99,
        max: 29.99,
        currency: "USD"
      },
      images: [
        "https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Product+1",
        "https://via.placeholder.com/400x400/7C3AED/FFFFFF?text=Product+2"
      ],
      variants: [
        { name: "Couleur", options: ["Rouge", "Bleu", "Noir"] },
        { name: "Taille", options: ["S", "M", "L", "XL"] }
      ],
      shipping: {
        cost: 2.99,
        time: "7-15 jours"
      },
      supplier: {
        name: "AliExpress Supplier",
        rating: 4.8,
        orders: 1234
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        product: productDetails
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

async function importProducts(apiKey: string, appSecret: string, productData: any, supabase: any) {
  try {
    const { products, user_id } = productData
    let imported = 0

    for (const product of products) {
      const catalogProduct = {
        external_id: product.id,
        name: product.title,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        cost_price: product.price * 0.6, // Estimation
        image_url: product.image_url,
        image_urls: product.images,
        supplier_id: 'aliexpress',
        supplier_name: 'AliExpress',
        supplier_url: product.url,
        category: product.category,
        tags: product.tags,
        stock_quantity: 999, // AliExpress typically has high stock
        sku: product.sku,
        availability_status: 'in_stock',
        shipping_cost: product.shipping_cost || 2.99,
        delivery_time: '7-15 jours',
        profit_margin: calculateProfitMargin(product.price, product.price * 0.6),
        is_trending: product.orders > 1000,
        sales_count: product.orders,
        rating: product.rating
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
        message: `${imported} produits importés depuis AliExpress`
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

function generateMockAliExpressProducts(keywords: string, category: string) {
  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty']
  const mockProducts = []

  for (let i = 1; i <= 20; i++) {
    mockProducts.push({
      id: `ae_${i}`,
      title: `${keywords} Premium Product ${i}`,
      description: `High quality ${keywords} from trusted AliExpress supplier`,
      price: Math.round((Math.random() * 50 + 10) * 100) / 100,
      original_price: Math.round((Math.random() * 80 + 20) * 100) / 100,
      image_url: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=${keywords}+${i}`,
      images: [
        `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${keywords}+${i}+A`,
        `https://via.placeholder.com/400x400/7C3AED/FFFFFF?text=${keywords}+${i}+B`
      ],
      category: category || categories[Math.floor(Math.random() * categories.length)],
      tags: [keywords, 'aliexpress', 'imported'],
      sku: `AE-${i}-${Date.now()}`,
      url: `https://aliexpress.com/item/${i}.html`,
      orders: Math.floor(Math.random() * 5000),
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      shipping_cost: 2.99,
      supplier: {
        name: `Supplier ${i}`,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10
      }
    })
  }

  return mockProducts
}

function calculateProfitMargin(sellPrice: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return Math.round(((sellPrice - costPrice) / costPrice * 100) * 100) / 100
}