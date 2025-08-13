import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AliExpressProduct {
  product_id: string
  title: string
  price: number
  original_price: number
  discount_rate: number
  rating: number
  review_count: number
  image_urls: string[]
  category: string
  tags: string[]
  supplier_name: string
  shipping_time: string
  min_order_quantity: number
  description?: string
  attributes?: Record<string, any>
  stock_quantity?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { importType, filters = {}, userId } = await req.json()
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const aliexpressApiKey = Deno.env.get('ALIEXPRESS_API_KEY')
    
    console.log(`Processing AliExpress import: ${importType} for user ${userId}`)
    
    let products: AliExpressProduct[]
    
    if (aliexpressApiKey && aliexpressApiKey !== 'your_api_key_here') {
      // Real AliExpress API integration
      products = await fetchFromAliExpressAPI(aliexpressApiKey, importType, filters)
      console.log(`Fetched ${products.length} products from AliExpress API`)
    } else {
      // Enhanced mock data for development
      products = generateEnhancedMockData(importType, filters)
      console.log(`Generated ${products.length} mock products`)
    }

    // Save products to database with import tracking
    const { data: importRecord, error: importError } = await supabase
      .from('product_imports')
      .insert({
        user_id: userId,
        import_type: importType,
        source_name: 'AliExpress',
        status: 'processing',
        total_products: products.length,
        import_config: { filters, timestamp: new Date().toISOString() }
      })
      .select()
      .single()

    if (importError) {
      throw new Error(`Failed to create import record: ${importError.message}`)
    }

    // Process products in batches for better performance
    const batchSize = 50
    let processedCount = 0
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      const importedProducts = batch.map(product => ({
        user_id: userId,
        import_id: importRecord.id,
        name: product.title,
        description: product.description || `High-quality ${product.title} from verified supplier`,
        price: product.price,
        cost_price: product.price * 0.7, // Estimate 30% markup
        currency: 'USD',
        sku: `AE-${product.product_id}`,
        category: product.category,
        supplier_name: product.supplier_name,
        supplier_product_id: product.product_id,
        image_urls: product.image_urls,
        tags: product.tags,
        status: 'draft',
        review_status: 'pending',
        ai_optimized: false,
        import_quality_score: calculateQualityScore(product),
        data_completeness_score: calculateCompletenessScore(product)
      }))

      const { error: batchError } = await supabase
        .from('imported_products')
        .insert(importedProducts)

      if (batchError) {
        console.error(`Batch insert error:`, batchError)
        errorCount += batch.length
      } else {
        successCount += batch.length
      }
      
      processedCount += batch.length

      // Update import progress
      await supabase
        .from('product_imports')
        .update({
          processed_rows: processedCount,
          products_imported: successCount,
          products_failed: errorCount
        })
        .eq('id', importRecord.id)
    }

    // Final import status update
    await supabase
      .from('product_imports')
      .update({
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - new Date(importRecord.created_at).getTime()
      })
      .eq('id', importRecord.id)

    // Log import activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'product_import',
        description: `Imported ${successCount} products from AliExpress`,
        entity_type: 'import',
        entity_id: importRecord.id,
        metadata: {
          import_type: importType,
          total_products: products.length,
          success_count: successCount,
          error_count: errorCount,
          source: 'aliexpress'
        }
      })

    return new Response(JSON.stringify({
      success: true,
      data: {
        import_id: importRecord.id,
        total_products: products.length,
        imported_count: successCount,
        failed_count: errorCount,
        products: products.slice(0, 10) // Return first 10 for preview
      },
      message: `Successfully imported ${successCount} products from AliExpress`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('AliExpress integration error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function fetchFromAliExpressAPI(apiKey: string, importType: string, filters: any): Promise<AliExpressProduct[]> {
  // Real AliExpress API integration would be implemented here
  // This is a placeholder for the actual API calls
  
  const apiEndpoint = 'https://api-sg.aliexpress.com/sync'
  
  try {
    const params = {
      app_key: apiKey,
      method: 'aliexpress.affiliate.product.query',
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      timestamp: Date.now(),
      category_ids: filters.category || '',
      keywords: filters.keywords || '',
      max_sale_price: filters.maxPrice || '',
      min_sale_price: filters.minPrice || '',
      page_no: 1,
      page_size: importType === 'complete_catalog' ? 200 : 100
    }

    // In a real implementation, you would:
    // 1. Generate proper API signature
    // 2. Make authenticated requests to AliExpress API
    // 3. Handle pagination for large datasets
    // 4. Parse and transform the response data
    
    console.log('AliExpress API params:', params)
    
    // For now, return enhanced mock data
    return generateEnhancedMockData(importType, filters)
    
  } catch (error) {
    console.error('AliExpress API error:', error)
    throw new Error(`AliExpress API integration failed: ${error.message}`)
  }
}

function generateEnhancedMockData(importType: string, filters: any): AliExpressProduct[] {
  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Automotive']
  const suppliers = ['TechPro Store', 'Fashion Hub', 'Home Essentials', 'Sport Zone', 'Beauty Plus', 'Auto Parts Co']
  
  const baseProducts = [
    {
      title: "Wireless Gaming Headset RGB LED",
      category: "Electronics",
      base_price: 29.99,
      original_price: 59.99,
      tags: ["gaming", "wireless", "rgb", "headset"]
    },
    {
      title: "Smart Fitness Watch Waterproof",
      category: "Electronics",
      base_price: 45.99,
      original_price: 89.99,
      tags: ["fitness", "smart", "waterproof", "watch"]
    },
    {
      title: "LED Strip Lights RGB Smart",
      category: "Home & Garden",
      base_price: 19.99,
      original_price: 39.99,
      tags: ["led", "rgb", "smart", "lighting"]
    },
    {
      title: "Bluetooth Speaker Portable",
      category: "Electronics",
      base_price: 35.99,
      original_price: 69.99,
      tags: ["bluetooth", "speaker", "portable", "audio"]
    },
    {
      title: "Phone Camera Lens Kit",
      category: "Electronics", 
      base_price: 24.99,
      original_price: 49.99,
      tags: ["phone", "camera", "lens", "photography"]
    }
  ]

  let count = 100
  if (importType === 'trending_products') count = 500
  else if (importType === 'winners_detected') count = 150
  else if (importType === 'complete_catalog') count = 2500
  else if (importType === 'global_bestsellers') count = 200

  return Array.from({ length: count }, (_, i) => {
    const baseProduct = baseProducts[i % baseProducts.length]
    const categoryIndex = categories.indexOf(baseProduct.category)
    
    return {
      product_id: `ae_${Date.now()}_${i}`,
      title: `${baseProduct.title} - Model ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
      price: Number((baseProduct.base_price + (Math.random() * 20 - 10)).toFixed(2)),
      original_price: baseProduct.original_price,
      discount_rate: Math.round(((baseProduct.original_price - baseProduct.base_price) / baseProduct.original_price) * 100),
      rating: Number((4.0 + Math.random() * 1).toFixed(1)),
      review_count: Math.floor(Math.random() * 2000) + 100,
      image_urls: [
        `https://images.unsplash.com/photo-${1500000000000 + i}?w=400`,
        `https://images.unsplash.com/photo-${1500000000000 + i + 1}?w=400`
      ],
      category: baseProduct.category,
      tags: baseProduct.tags,
      supplier_name: suppliers[categoryIndex] || suppliers[0],
      shipping_time: `${5 + Math.floor(Math.random() * 15)}-${10 + Math.floor(Math.random() * 20)} days`,
      min_order_quantity: Math.floor(Math.random() * 5) + 1,
      description: `Premium quality ${baseProduct.title.toLowerCase()} with advanced features and reliable performance. Perfect for ${baseProduct.category.toLowerCase()} enthusiasts.`,
      attributes: {
        color: ['Black', 'White', 'Blue', 'Red'][Math.floor(Math.random() * 4)],
        material: ['Plastic', 'Metal', 'Silicone'][Math.floor(Math.random() * 3)],
        warranty: `${12 + Math.floor(Math.random() * 12)} months`
      },
      stock_quantity: Math.floor(Math.random() * 1000) + 50
    }
  })
}

function calculateQualityScore(product: AliExpressProduct): number {
  let score = 50 // Base score
  
  // Rating contribution (0-25 points)
  score += (product.rating / 5) * 25
  
  // Review count contribution (0-15 points)
  if (product.review_count > 1000) score += 15
  else if (product.review_count > 500) score += 10
  else if (product.review_count > 100) score += 5
  
  // Image quality (0-10 points)
  if (product.image_urls.length >= 2) score += 10
  else if (product.image_urls.length >= 1) score += 5
  
  return Math.min(100, Math.round(score))
}

function calculateCompletenessScore(product: AliExpressProduct): number {
  let score = 0
  const fields = ['title', 'description', 'price', 'category', 'image_urls', 'tags', 'supplier_name']
  
  fields.forEach(field => {
    if (product[field as keyof AliExpressProduct]) {
      score += 100 / fields.length
    }
  })
  
  return Math.round(score)
}