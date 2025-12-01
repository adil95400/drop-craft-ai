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
      throw new Error('Unauthorized')
    }

    const { products, source, options }: BulkImportRequest = await req.json()

    console.log(`Starting bulk import of ${products.length} products from ${source}`)

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: source,
        job_type: 'bulk_import',
        status: 'processing',
        total_products: products.length,
        processed_products: 0,
        successful_imports: 0,
        failed_imports: 0,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      throw jobError
    }

    const jobId = job.id

    // Process products in batches
    const batchSize = 10
    let processed = 0
    let succeeded = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      try {
        // Map products to internal format
        const mappedProducts = batch.map(product => ({
          user_id: user.id,
          name: product.name || product.title,
          description: product.description,
          price: parseFloat(product.price || '0'),
          cost_price: parseFloat(product.cost_price || product.price || '0') * 0.6,
          currency: product.currency || 'EUR',
          sku: product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: product.category || 'Imported',
          image_url: Array.isArray(product.images) ? product.images[0] : product.image_url,
          images: Array.isArray(product.images) ? product.images : [product.image_url].filter(Boolean),
          stock_quantity: parseInt(product.stock_quantity || '0'),
          status: 'active',
          tags: product.tags || [],
          supplier_id: product.supplier_id,
          supplier: product.supplier_name,
          weight: parseFloat(product.weight || '0'),
          dimensions: product.dimensions
        }))

        // Insert batch
        const { error: insertError } = await supabase
          .from('imported_products')
          .insert(mappedProducts)

        if (insertError) {
          console.error('Batch insert error:', insertError)
          failed += batch.length
          errors.push(`Batch ${i / batchSize + 1}: ${insertError.message}`)
        } else {
          succeeded += batch.length
        }

      } catch (error) {
        console.error('Batch processing error:', error)
        failed += batch.length
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`)
      }

      processed += batch.length

      // Update job progress
      await supabase
        .from('import_jobs')
        .update({
          processed_products: processed,
          successful_imports: succeeded,
          failed_imports: failed
        })
        .eq('id', jobId)

      console.log(`Progress: ${processed}/${products.length} (${succeeded} success, ${failed} failed)`)
    }

    // Mark job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: failed > 0 && succeeded === 0 ? 'failed' : failed > 0 ? 'partial' : 'completed',
        completed_at: new Date().toISOString(),
        error_log: errors.length > 0 ? errors : null
      })
      .eq('id', jobId)

    // Trigger auto-optimization if requested
    if (options?.auto_optimize && succeeded > 0) {
      console.log('Triggering auto-optimization...')
      try {
        await supabase.functions.invoke('bulk-ai-optimize', {
          body: { userId: user.id, jobId }
        })
      } catch (error) {
        console.error('Auto-optimization failed:', error)
      }
    }

    console.log('Bulk import completed')

    return new Response(
      JSON.stringify({
        success: true,
        job_id: jobId,
        total: products.length,
        succeeded,
        failed,
        errors: errors.length > 0 ? errors : null
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
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
