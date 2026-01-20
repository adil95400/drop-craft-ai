import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface BulkImportRequest {
  products: any[]
  source: 'supplier' | 'csv' | 'url' | 'shopify'
  options?: {
    auto_optimize?: boolean
    auto_publish?: boolean
    target_store?: string
  }
}

// Platform detection
function detectPlatform(url: string): { platform: string; productId: string | null } {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('amazon.')) {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i) || url.match(/\/gp\/product\/([A-Z0-9]+)/i)
    return { platform: 'amazon', productId: match?.[1] || null }
  }
  if (urlLower.includes('aliexpress.')) {
    const match = url.match(/item\/(\d+)\.html/) || url.match(/\/(\d+)\.html/)
    return { platform: 'aliexpress', productId: match?.[1] || null }
  }
  if (urlLower.includes('ebay.')) {
    const match = url.match(/\/itm\/(\d+)/)
    return { platform: 'ebay', productId: match?.[1] || null }
  }
  if (urlLower.includes('temu.com')) {
    return { platform: 'temu', productId: null }
  }
  return { platform: 'unknown', productId: null }
}

// Scrape product via quick-import-url function
async function scrapeProductUrl(url: string, userId: string, supabase: any): Promise<any> {
  console.log(`📡 Scraping URL: ${url}`)
  
  try {
    // Call quick-import-url edge function for full scraping
    const { data, error } = await supabase.functions.invoke('quick-import-url', {
      body: {
        url,
        user_id: userId,
        action: 'import',
        price_multiplier: 1.5
      }
    })
    
    if (error) {
      console.error(`Scrape error for ${url}:`, error)
      throw error
    }
    
    if (!data?.success) {
      throw new Error(data?.error || 'Scraping failed')
    }
    
    console.log(`✅ Scraped: ${data.data?.name || 'Unknown'} - ${data.summary?.images || 0} images, ${data.summary?.variants || 0} variants, ${data.summary?.videos || 0} videos`)
    
    return {
      success: true,
      product: data.data,
      summary: data.summary
    }
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error)
    return {
      success: false,
      error: error.message || 'Scraping failed'
    }
  }
}

Deno.serve(async (req) => {
  console.log('Bulk import function called')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    const { products, source, options }: BulkImportRequest = await req.json()

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('No products provided')
    }

    console.log(`Starting bulk import of ${products.length} products from ${source} for user ${user.id}`)

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_platform: source,
        job_type: 'bulk_import',
        status: 'processing',
        total_products: products.length,
        successful_imports: 0,
        failed_imports: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      throw new Error(`Failed to create import job: ${jobError.message}`)
    }

    const jobId = job.id
    console.log(`Created import job: ${jobId}`)

    let succeeded = 0
    let failed = 0
    const errors: string[] = []

    // Process differently based on source type
    if (source === 'url') {
      // URL-based import: scrape each URL using quick-import-url
      console.log('🔗 Processing URL-based bulk import with full scraping')
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const sourceUrl = product.source_url || product.url
        
        if (!sourceUrl) {
          failed++
          errors.push(`Product ${i + 1}: No URL provided`)
          continue
        }
        
        try {
          const result = await scrapeProductUrl(sourceUrl, user.id, supabase)
          
          if (result.success) {
            succeeded++
            console.log(`✅ Product ${i + 1}/${products.length} imported`)
          } else {
            failed++
            errors.push(`Product ${i + 1}: ${result.error}`)
          }
        } catch (error) {
          failed++
          errors.push(`Product ${i + 1}: ${error.message}`)
        }
        
        // Update job progress
        await supabase
          .from('import_jobs')
          .update({
            successful_imports: succeeded,
            failed_imports: failed,
            error_log: errors.length > 0 ? errors : null
          })
          .eq('id', jobId)
        
        // Rate limiting between requests
        if (i < products.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } else {
      // Non-URL import: batch insert (CSV, supplier, etc.)
      const batchSize = 25
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, Math.min(i + batchSize, products.length))
        
        try {
          const mappedProducts = batch.map((product, idx) => {
            const price = parseFloat(product.price || '0') || 0
            const costPrice = parseFloat(product.cost_price || '0') || price * 0.6
            
            return {
              user_id: user.id,
              title: (product.name || product.title || `Product ${i + idx + 1}`).substring(0, 500),
              description: (product.description || '').substring(0, 5000),
              price: Math.min(price, 999999.99),
              cost_price: Math.min(costPrice, 999999.99),
              sku: (product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`).substring(0, 100),
              category: (product.category || 'Imported').substring(0, 100),
              image_url: product.image_url || (Array.isArray(product.images) ? product.images[0] : null),
              images: Array.isArray(product.images) ? product.images.slice(0, 10) : [],
              stock_quantity: Math.min(parseInt(product.stock_quantity || '0') || 0, 999999),
              status: 'draft',
              tags: Array.isArray(product.tags) ? product.tags.slice(0, 20) : [],
              supplier: product.supplier_name || product.supplier || source,
              weight: Math.min(parseFloat(product.weight || '0') || 0, 9999),
            }
          })

          const { error: insertError } = await supabase
            .from('products')
            .insert(mappedProducts)

          if (insertError) {
            console.error(`Batch ${Math.floor(i / batchSize) + 1} insert error:`, insertError)
            failed += batch.length
            errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
          } else {
            succeeded += batch.length
            console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products imported successfully`)
          }

        } catch (error) {
          console.error(`Batch ${Math.floor(i / batchSize) + 1} processing error:`, error)
          failed += batch.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        }

        // Update job progress every batch
        await supabase
          .from('import_jobs')
          .update({
            successful_imports: succeeded,
            failed_imports: failed,
            error_log: errors.length > 0 ? errors : null
          })
          .eq('id', jobId)

        console.log(`Progress: ${i + batch.length}/${products.length} (${succeeded} success, ${failed} failed)`)
      }
    }

    // Mark job as completed
    const finalStatus = failed > 0 && succeeded === 0 ? 'failed' : failed > 0 ? 'completed' : 'completed'
    
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        successful_imports: succeeded,
        failed_imports: failed,
        error_log: errors.length > 0 ? errors : null
      })
      .eq('id', jobId)

    console.log(`Bulk import completed: ${succeeded} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        total: products.length,
        succeeded,
        failed,
        errors: errors.length > 0 ? errors.slice(0, 10) : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Bulk import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
