import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Real marketplace APIs simulation with actual product data
const MARKETPLACE_APIS = {
  aliexpress: {
    baseUrl: 'https://gw.api.alibaba.com/openapi/param2/2/gateway.do',
    categories: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty'],
    sampleProducts: [
      {
        itemId: '1005006123456789',
        title: 'Smartphone Android 12 6.7" 8GB RAM 256GB',
        imageUrl: 'https://ae01.alicdn.com/kf/H12345.jpg',
        price: { min: '89.99', max: '129.99' },
        originalPrice: '199.99',
        discount: '35%',
        rating: '4.5',
        orders: '1,234',
        supplier: 'Global Tech Store',
        shippingFrom: 'China',
        deliveryTime: '15-25 days'
      },
      {
        itemId: '1005006987654321', 
        title: 'Montre Connectée Fitness Tracker IP68',
        imageUrl: 'https://ae01.alicdn.com/kf/H67890.jpg',
        price: { min: '24.99', max: '39.99' },
        originalPrice: '79.99',
        discount: '50%',
        rating: '4.3',
        orders: '3,567',
        supplier: 'Smart Watch Pro',
        shippingFrom: 'China',
        deliveryTime: '10-20 days'
      }
    ]
  },
  amazon: {
    baseUrl: 'https://webservices.amazon.com/paapi5/searchitems',
    categories: ['Electronics', 'Books', 'Fashion', 'Home', 'Sports'],
    sampleProducts: [
      {
        asin: 'B0BDJ12345',
        title: 'Apple AirPods Pro (2nd Generation)',
        imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
        price: '$249.00',
        originalPrice: '$279.00',
        rating: '4.6',
        reviewsCount: '12,456',
        prime: true,
        category: 'Electronics > Headphones',
        brand: 'Apple'
      },
      {
        asin: 'B0C1H67890',
        title: 'Kindle Paperwhite (11th Generation)',
        imageUrl: 'https://m.media-amazon.com/images/I/61rgM-rq0XL._AC_SL1000_.jpg',
        price: '$139.99',
        originalPrice: '$149.99',
        rating: '4.7',
        reviewsCount: '8,923',
        prime: true,
        category: 'Electronics > E-readers',
        brand: 'Amazon'
      }
    ]
  },
  shopify: {
    baseUrl: 'https://api.shopify.com/admin/api/2023-10',
    sampleProducts: [
      {
        id: '7891234567890',
        title: 'Premium Organic Cotton T-Shirt',
        handle: 'premium-organic-cotton-tshirt',
        images: ['https://cdn.shopify.com/s/files/1/0123/4567/products/tshirt.jpg'],
        price: '29.99',
        compareAtPrice: '39.99',
        vendor: 'EcoFashion Co',
        productType: 'Apparel',
        tags: ['organic', 'cotton', 'sustainable', 'premium'],
        variants: [
          { size: 'S', color: 'White', inventory: 25 },
          { size: 'M', color: 'White', inventory: 30 },
          { size: 'L', color: 'Black', inventory: 18 }
        ]
      }
    ]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { marketplace, category, keywords, limit = 50 } = await req.json()

    console.log(`Marketplace sync request: ${marketplace}, category: ${category}, keywords: ${keywords}`)

    let products: any[] = []

    switch (marketplace) {
      case 'aliexpress':
        products = await syncAliExpressProducts(category, keywords, limit)
        break
      case 'amazon':
        products = await syncAmazonProducts(category, keywords, limit)
        break
      case 'shopify':
        products = await syncShopifyProducts(category, keywords, limit)
        break
      case 'all':
        const aliProducts = await syncAliExpressProducts(category, keywords, Math.floor(limit/3))
        const amazonProducts = await syncAmazonProducts(category, keywords, Math.floor(limit/3))
        const shopifyProducts = await syncShopifyProducts(category, keywords, Math.floor(limit/3))
        products = [...aliProducts, ...amazonProducts, ...shopifyProducts]
        break
      default:
        throw new Error('Unknown marketplace')
    }

    // Transform and insert products into catalog
    const transformedProducts = products.map(product => transformToStandardFormat(product, marketplace))
    
    const { data: insertedProducts, error } = await supabaseClient
      .from('catalog_products')
      .upsert(transformedProducts, { 
        onConflict: 'external_id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Log sync activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        action: `marketplace_sync_${marketplace}`,
        description: `Synchronized ${insertedProducts?.length || 0} products from ${marketplace}`,
        entity_type: 'marketplace_sync',
        metadata: {
          marketplace,
          category,
          keywords,
          products_synced: insertedProducts?.length || 0,
          timestamp: new Date().toISOString()
        }
      })

    const result = {
      marketplace,
      products_synced: insertedProducts?.length || 0,
      products: insertedProducts?.slice(0, 10), // Return first 10 for preview
      total_available: products.length
    }

    console.log(`Marketplace sync completed:`, result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Marketplace sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function syncAliExpressProducts(category?: string, keywords?: string, limit = 50) {
  // Simulate AliExpress API call with realistic data
  const baseProducts = MARKETPLACE_APIS.aliexpress.sampleProducts
  const products = []

  for (let i = 0; i < limit; i++) {
    const baseProduct = baseProducts[i % baseProducts.length]
    
    // Generate variations of real products
    const variations = [
      'Pro Max', 'Ultra', 'Premium', 'Deluxe', 'Advanced', 'Smart', 'Wireless', 'Bluetooth',
      '5G', 'HD', '4K', 'LED', 'OLED', 'RGB', 'Fast Charge', 'Waterproof', 'Gaming'
    ]
    
    const colors = ['Black', 'White', 'Blue', 'Red', 'Silver', 'Gold', 'Pink', 'Green']
    const sizes = ['S', 'M', 'L', 'XL', '32GB', '64GB', '128GB', '256GB']
    
    const variation = variations[Math.floor(Math.random() * variations.length)]
    const color = colors[Math.floor(Math.random() * colors.length)]
    const size = sizes[Math.floor(Math.random() * sizes.length)]
    
    const product = {
      ...baseProduct,
      itemId: `${baseProduct.itemId}_${i}`,
      title: `${baseProduct.title} ${variation} ${color} ${size}`,
      price: {
        min: (parseFloat(baseProduct.price.min) + Math.random() * 20).toFixed(2),
        max: (parseFloat(baseProduct.price.max) + Math.random() * 30).toFixed(2)
      },
      rating: (parseFloat(baseProduct.rating) + (Math.random() * 0.6 - 0.3)).toFixed(1),
      orders: Math.floor(Math.random() * 5000).toString(),
      marketplace: 'aliexpress',
      category: category || 'Electronics',
      keywords: keywords ? keywords.split(',') : ['trending', 'popular', 'bestseller']
    }
    
    products.push(product)
  }

  return products
}

async function syncAmazonProducts(category?: string, keywords?: string, limit = 50) {
  // Simulate Amazon Product Advertising API
  const baseProducts = MARKETPLACE_APIS.amazon.sampleProducts
  const products = []

  for (let i = 0; i < limit; i++) {
    const baseProduct = baseProducts[i % baseProducts.length]
    
    const amazonCategories = [
      'Electronics > Smartphones', 'Electronics > Headphones', 'Electronics > Tablets',
      'Books > Fiction', 'Books > Non-Fiction', 'Fashion > Men', 'Fashion > Women',
      'Home & Kitchen > Appliances', 'Sports & Outdoors > Fitness', 'Beauty > Skincare'
    ]
    
    const product = {
      ...baseProduct,
      asin: `B0${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      title: baseProduct.title + ` - ${['Enhanced', 'Latest Model', '2024 Edition', 'Pro Version'][Math.floor(Math.random() * 4)]}`,
      price: `$${(parseFloat(baseProduct.price.replace('$', '')) + Math.random() * 50).toFixed(2)}`,
      rating: (parseFloat(baseProduct.rating) + (Math.random() * 0.4 - 0.2)).toFixed(1),
      reviewsCount: Math.floor(Math.random() * 20000).toLocaleString(),
      category: category || amazonCategories[Math.floor(Math.random() * amazonCategories.length)],
      marketplace: 'amazon',
      prime: Math.random() > 0.3, // 70% have Prime
      keywords: keywords ? keywords.split(',') : ['amazon-choice', 'bestseller', 'new-release']
    }
    
    products.push(product)
  }

  return products
}

async function syncShopifyProducts(category?: string, keywords?: string, limit = 50) {
  // Simulate Shopify Partner API for marketplace products
  const baseProducts = MARKETPLACE_APIS.shopify.sampleProducts
  const products = []

  for (let i = 0; i < limit; i++) {
    const baseProduct = baseProducts[i % baseProducts.length]
    
    const shopifyVendors = [
      'EcoFashion Co', 'TechGear Pro', 'Homestyle Living', 'Artisan Crafts',
      'Modern Basics', 'Urban Lifestyle', 'Premium Goods', 'Daily Essentials'
    ]
    
    const productTypes = [
      'Apparel', 'Accessories', 'Electronics', 'Home Decor', 'Beauty Products',
      'Sports Equipment', 'Toys & Games', 'Books & Media', 'Food & Beverage'
    ]
    
    const product = {
      ...baseProduct,
      id: (BigInt(baseProduct.id) + BigInt(i)).toString(),
      title: baseProduct.title + ` - ${['Premium', 'Deluxe', 'Limited Edition', 'Exclusive'][Math.floor(Math.random() * 4)]}`,
      price: (parseFloat(baseProduct.price) + Math.random() * 20).toFixed(2),
      vendor: shopifyVendors[Math.floor(Math.random() * shopifyVendors.length)],
      productType: category || productTypes[Math.floor(Math.random() * productTypes.length)],
      marketplace: 'shopify',
      shopifyStore: `store${i % 20 + 1}.myshopify.com`,
      keywords: keywords ? keywords.split(',') : ['handmade', 'sustainable', 'premium']
    }
    
    products.push(product)
  }

  return products
}

function transformToStandardFormat(product: any, marketplace: string) {
  let standardProduct: any = {
    external_id: '',
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    original_price: 0,
    currency: 'EUR',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    image_url: '',
    image_urls: [],
    rating: 0,
    reviews_count: 0,
    sales_count: 0,
    stock_quantity: Math.floor(Math.random() * 100) + 10,
    availability_status: 'in_stock',
    delivery_time: '',
    tags: [],
    is_trending: Math.random() > 0.7,
    is_bestseller: Math.random() > 0.8,
    supplier_name: marketplace,
    supplier_url: '',
    profit_margin: 0,
    competition_score: Math.random() * 100,
    trend_score: Math.random() * 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  switch (marketplace) {
    case 'aliexpress':
      const aliPrice = parseFloat(product.price.min)
      standardProduct = {
        ...standardProduct,
        external_id: `ali_${product.itemId}`,
        name: product.title,
        description: `${product.title} - Livré depuis ${product.shippingFrom}. ${product.orders} commandes. Remise de ${product.discount}.`,
        price: aliPrice * 1.15, // Convert USD to EUR approximately
        cost_price: aliPrice * 0.7,
        original_price: parseFloat(product.originalPrice) * 1.15,
        category: product.category || 'Electronics',
        brand: product.supplier,
        sku: `ALI-${product.itemId}`,
        image_url: product.imageUrl,
        image_urls: [product.imageUrl],
        rating: parseFloat(product.rating),
        reviews_count: parseInt(product.orders.replace(',', '')),
        delivery_time: product.deliveryTime,
        tags: ['aliexpress', 'import', ...(product.keywords || [])],
        supplier_name: product.supplier,
        supplier_url: `https://www.aliexpress.com/item/${product.itemId}.html`
      }
      break

    case 'amazon':
      const amazonPrice = parseFloat(product.price.replace('$', ''))
      standardProduct = {
        ...standardProduct,
        external_id: `amz_${product.asin}`,
        name: product.title,
        description: `${product.title} - ${product.category}. ${product.reviewsCount} avis clients.${product.prime ? ' Eligible Amazon Prime.' : ''}`,
        price: amazonPrice * 0.92, // Convert USD to EUR
        cost_price: amazonPrice * 0.6,
        original_price: parseFloat((product.originalPrice || product.price).replace('$', '')) * 0.92,
        category: product.category.split(' > ')[0],
        subcategory: product.category.split(' > ')[1] || '',
        brand: product.brand,
        sku: `AMZ-${product.asin}`,
        image_url: product.imageUrl,
        image_urls: [product.imageUrl],
        rating: parseFloat(product.rating),
        reviews_count: parseInt(product.reviewsCount.replace(',', '')),
        delivery_time: product.prime ? '24-48h' : '3-5 jours',
        tags: ['amazon', ...(product.keywords || []), ...(product.prime ? ['prime'] : [])],
        supplier_name: 'Amazon',
        supplier_url: `https://www.amazon.com/dp/${product.asin}`
      }
      break

    case 'shopify':
      const shopifyPrice = parseFloat(product.price)
      standardProduct = {
        ...standardProduct,
        external_id: `shopify_${product.id}`,
        name: product.title,
        description: `${product.title} par ${product.vendor}. Produit artisanal de qualité premium.`,
        price: shopifyPrice,
        cost_price: shopifyPrice * 0.65,
        original_price: parseFloat(product.compareAtPrice || product.price),
        category: product.productType,
        brand: product.vendor,
        sku: `SHP-${product.id}`,
        image_url: product.images[0],
        image_urls: product.images,
        rating: 4.0 + Math.random() * 1.0, // Shopify products generally well rated
        reviews_count: Math.floor(Math.random() * 500) + 50,
        delivery_time: '2-7 jours',
        tags: ['shopify', 'artisan', ...(product.tags || []), ...(product.keywords || [])],
        supplier_name: product.vendor,
        supplier_url: `https://${product.shopifyStore}/products/${product.handle}`
      }
      break
  }

  // Calculate profit margin
  if (standardProduct.cost_price > 0) {
    standardProduct.profit_margin = ((standardProduct.price - standardProduct.cost_price) / standardProduct.cost_price * 100)
  }

  return standardProduct
}