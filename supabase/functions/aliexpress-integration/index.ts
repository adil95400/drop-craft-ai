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
    
    const isEnabled = Deno.env.get('VITE_ALIEXPRESS_ENABLED') === 'true'
    
    if (!isEnabled) {
      throw new Error('AliExpress integration is disabled. Enable it in environment variables.')
    }
    
    if (aliexpressApiKey && aliexpressApiKey !== 'your_api_key_here') {
      // Real AliExpress API integration
      products = await fetchFromAliExpressAPI(aliexpressApiKey, importType, filters)
      console.log(`Fetched ${products.length} products from AliExpress API`)
    } else {
      throw new Error('AliExpress API key not configured. Please add ALIEXPRESS_API_KEY to your edge function secrets.')
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
  /**
   * REAL API INTEGRATION - À implémenter avec vraie API AliExpress
   * 
   * Documentation: https://developers.aliexpress.com/en/doc.htm
   * Voir README.md pour instructions complètes
   */
  
  const apiSecret = Deno.env.get('ALIEXPRESS_API_SECRET')
  
  if (!apiSecret) {
    throw new Error(
      'ALIEXPRESS_API_SECRET not configured. ' +
      'Cette edge function nécessite une clé API AliExpress valide. ' +
      'Voir README.md pour instructions.'
    )
  }

  const apiEndpoint = 'https://api-sg.aliexpress.com/sync'
  const pageSize = importType === 'complete_catalog' ? 200 : 100
  
  try {
    // Étape 1: Préparer paramètres de requête
    const baseParams = {
      app_key: apiKey,
      method: 'aliexpress.affiliate.product.query',
      format: 'json',
      v: '2.0',
      sign_method: 'md5',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      category_ids: filters.category || '',
      keywords: filters.keywords || '',
      max_sale_price: filters.maxPrice || '',
      min_sale_price: filters.minPrice || '',
      page_no: '1',
      page_size: pageSize.toString(),
      sort: 'SALE_PRICE_ASC',
      target_currency: 'USD',
      target_language: 'EN',
      tracking_id: 'default' // Votre tracking ID AliExpress
    }
    
    // Étape 2: Générer signature MD5
    // TODO: Implémenter generateMD5Signature(baseParams, apiSecret)
    // const signature = generateMD5Signature(baseParams, apiSecret)
    
    // Étape 3: Faire la requête API réelle
    // TODO: Remplacer par vraie requête HTTP
    console.warn(
      'API AliExpress non implémentée - Structure prête pour intégration. ' +
      'Paramètres:', baseParams
    )
    
    // TEMPORAIRE: Throw error explicite si credentials réels fournis
    throw new Error(
      'AliExpress API integration not yet implemented. ' +
      'Real API structure is ready - developer needs to: ' +
      '1. Implement MD5 signature generation ' +
      '2. Make HTTP request to ' + apiEndpoint + ' ' +
      '3. Parse and transform API response ' +
      'See README.md and https://developers.aliexpress.com for details.'
    )
    
    // Structure pour vraie implémentation:
    /*
    const response = await fetch(`${apiEndpoint}?${new URLSearchParams({
      ...baseParams,
      sign: signature
    })}`)
    
    if (!response.ok) {
      throw new Error(`AliExpress API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Gérer pagination si nécessaire
    let allProducts = transformAliExpressProducts(data.resp_result.result.products)
    
    // Si plus de pages disponibles
    if (data.resp_result.result.total_page_no > 1) {
      for (let page = 2; page <= data.resp_result.result.total_page_no; page++) {
        // Fetch page suivante...
        // Rate limiting: attendre 200ms entre requêtes
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    return allProducts
    */
    
  } catch (error) {
    console.error('AliExpress API error:', error)
    throw error
  }
}

/**
 * TODO: Implémenter génération signature MD5 selon doc AliExpress
 * https://developers.aliexpress.com/en/doc.htm?docId=27744
 */
function generateMD5Signature(params: Record<string, string>, appSecret: string): string {
  // Étapes requises:
  // 1. Trier paramètres alphabétiquement
  // 2. Concaténer en format key1value1key2value2...
  // 3. Préfixer et suffixer avec appSecret
  // 4. Calculer MD5 hash
  // 5. Convertir en uppercase hexadecimal
  
  throw new Error('MD5 signature generation not implemented')
}

/**
 * TODO: Transformer réponse API AliExpress vers notre format
 */
function transformAliExpressProducts(apiProducts: any[]): AliExpressProduct[] {
  return apiProducts.map(p => ({
    product_id: p.product_id,
    title: p.product_title,
    price: parseFloat(p.target_sale_price || p.sale_price),
    original_price: parseFloat(p.target_original_price || p.original_price),
    discount_rate: parseInt(p.discount || '0'),
    rating: parseFloat(p.evaluate_rate || '0'),
    review_count: parseInt(p.volume || '0'),
    image_urls: [p.product_main_image_url, ...(p.product_small_image_urls || [])],
    category: p.second_level_category_name || 'General',
    tags: [],
    supplier_name: p.shop_title || 'AliExpress',
    shipping_time: '15-30 days', // Estimation par défaut
    min_order_quantity: parseInt(p.min_order_quantity || '1'),
    description: p.product_detail_url,
    stock_quantity: 999 // AliExpress n'expose pas toujours le stock
  }))
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