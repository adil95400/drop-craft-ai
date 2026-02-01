import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Input validation schemas
const ImportTypeSchema = z.enum(['trending_products', 'search', 'complete_catalog', 'category'])
const FiltersSchema = z.object({
  category: z.string().optional(),
  keywords: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().optional(),
}).optional()

const ImportRequestSchema = z.object({
  importType: ImportTypeSchema,
  filters: FiltersSchema,
})

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
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 1. Auth obligatoire - userId provient du token uniquement
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // 2. Rate limiting
    const rateCheck = await checkRateLimit(supabase, userId, 'aliexpress_import', RATE_LIMITS.IMPORT)
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, corsHeaders)
    }
    
    // 3. Parse and validate input - IGNORING userId from body
    const body = await req.json()
    const parseResult = ImportRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request',
          details: parseResult.error.flatten()
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { importType, filters = {} } = parseResult.data
    
    const aliexpressApiKey = Deno.env.get('ALIEXPRESS_API_KEY')
    
    console.log(`[SECURE] Processing AliExpress import: ${importType} for user ${userId}`)
    
    const isEnabled = Deno.env.get('VITE_ALIEXPRESS_ENABLED') === 'true'
    
    if (!isEnabled) {
      throw new Error('AliExpress integration is disabled. Enable it in environment variables.')
    }
    
    if (!aliexpressApiKey || aliexpressApiKey === 'your_api_key_here') {
      throw new Error('AliExpress API key not configured. Please add ALIEXPRESS_API_KEY to your edge function secrets.')
    }
    
    // Real AliExpress API integration
    const products = await fetchFromAliExpressAPI(aliexpressApiKey, importType, filters)
    console.log(`Fetched ${products.length} products from AliExpress API`)

    // Save products to database with import tracking - SECURE: user_id from token only
    const { data: importRecord, error: importError } = await supabase
      .from('product_imports')
      .insert({
        user_id: userId, // CRITICAL: from token only
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

    // Process products in batches
    const batchSize = 50
    let processedCount = 0
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      // SECURE: All products get user_id from token
      const importedProducts = batch.map(product => ({
        user_id: userId, // CRITICAL: from token only
        import_id: importRecord.id,
        name: product.title,
        description: product.description || `High-quality ${product.title} from verified supplier`,
        price: product.price,
        cost_price: product.price * 0.7,
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

      // Update import progress - SCOPED to user
      await supabase
        .from('product_imports')
        .update({
          processed_rows: processedCount,
          products_imported: successCount,
          products_failed: errorCount
        })
        .eq('id', importRecord.id)
        .eq('user_id', userId) // SECURE: scope to user
    }

    // Final import status update - SCOPED to user
    await supabase
      .from('product_imports')
      .update({
        status: errorCount > 0 ? 'completed_with_errors' : 'completed',
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - new Date(importRecord.created_at).getTime()
      })
      .eq('id', importRecord.id)
      .eq('user_id', userId) // SECURE: scope to user

    // Log import activity - SECURE: user_id from token only
    await supabase.from('activity_logs').insert({
      user_id: userId, // CRITICAL: from token only
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
        products: products.slice(0, 10)
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
      headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})

async function fetchFromAliExpressAPI(apiKey: string, importType: string, filters: any): Promise<AliExpressProduct[]> {
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
      tracking_id: 'default'
    }
    
    console.warn('API AliExpress non implémentée - Structure prête pour intégration.')
    
    throw new Error(
      'AliExpress API integration not yet implemented. ' +
      'Real API structure is ready - developer needs to implement MD5 signature generation.'
    )
    
  } catch (error) {
    console.error('AliExpress API error:', error)
    throw error
  }
}

function calculateQualityScore(product: AliExpressProduct): number {
  let score = 50
  score += (product.rating / 5) * 25
  if (product.review_count > 1000) score += 15
  else if (product.review_count > 500) score += 10
  else if (product.review_count > 100) score += 5
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
