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

    // Process products in batches of 25 (more efficient)
    const batchSize = 25
    let processed = 0
    let succeeded = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length))
      
      try {
        // Map products to products table format (not imported_products)
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

        // Insert batch into products table
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

      processed += batch.length

      // Update job progress every batch
      const { error: updateError } = await supabase
        .from('import_jobs')
        .update({
          successful_imports: succeeded,
          failed_imports: failed,
          error_log: errors.length > 0 ? errors : null
        })
        .eq('id', jobId)

      if (updateError) {
        console.warn('Failed to update job progress:', updateError)
      }

      console.log(`Progress: ${processed}/${products.length} (${succeeded} success, ${failed} failed)`)
    }

    // Mark job as completed
    const finalStatus = failed > 0 && succeeded === 0 ? 'failed' : failed > 0 ? 'completed' : 'completed'
    
    const { error: finalError } = await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        successful_imports: succeeded,
        failed_imports: failed,
        error_log: errors.length > 0 ? errors : null
      })
      .eq('id', jobId)

    if (finalError) {
      console.error('Failed to finalize job:', finalError)
    }

    console.log(`Bulk import completed: ${succeeded} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        total: products.length,
        succeeded,
        failed,
        errors: errors.length > 0 ? errors.slice(0, 10) : null // Limit errors in response
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
