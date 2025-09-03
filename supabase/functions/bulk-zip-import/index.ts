import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkImportRequest {
  zipFileUrl: string
  mappingConfig?: Record<string, string>
  importConfig?: {
    batch_size?: number
    validate_data?: boolean
    auto_detect_encoding?: boolean
    skip_duplicates?: boolean
  }
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { zipFileUrl, mappingConfig = {}, importConfig = {} }: BulkImportRequest = await req.json()

    console.log(`Processing bulk ZIP import from: ${zipFileUrl}`)

    // Create import job
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'bulk_zip',
        source_url: zipFileUrl,
        status: 'processing',
        mapping_config: mappingConfig
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create import job' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    try {
      // Download ZIP file
      console.log('Downloading ZIP file...')
      const zipResponse = await fetch(zipFileUrl)
      
      if (!zipResponse.ok) {
        throw new Error(`Failed to download ZIP file: ${zipResponse.status}`)
      }

      // In a real implementation, you would:
      // 1. Download and extract the ZIP file
      // 2. Parse CSV/XML files inside
      // 3. Apply mapping configuration
      // 4. Process in batches
      
      // Mock bulk processing
      const mockFiles = [
        { name: 'products_1.csv', rows: 150 },
        { name: 'products_2.csv', rows: 200 },
        { name: 'categories.xml', rows: 50 },
        { name: 'inventory.csv', rows: 300 }
      ]

      let totalProducts = 0
      let successfulProducts = 0
      let errors: string[] = []

      // Process each file
      for (const file of mockFiles) {
        console.log(`Processing file: ${file.name}`)
        
        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate mock products for this file
        const fileProducts = []
        for (let i = 0; i < file.rows; i++) {
          fileProducts.push({
            name: `Produit ${file.name} ${i + 1}`,
            description: `Produit importé depuis ${file.name}`,
            price: Math.floor(Math.random() * 200) + 10,
            cost_price: Math.floor(Math.random() * 100) + 5,
            currency: 'EUR',
            sku: `BULK-${Date.now()}-${i}`,
            category: file.name.includes('xml') ? 'XML Import' : 'CSV Import',
            supplier_name: 'Bulk Import',
            tags: ['bulk-import', file.name.split('.')[1]]
          })
        }

        try {
          // Insert products in batches
          const batchSize = importConfig.batch_size || 100
          for (let i = 0; i < fileProducts.length; i += batchSize) {
            const batch = fileProducts.slice(i, i + batchSize)
            const productsToInsert = batch.map(product => ({
              ...product,
              user_id: user.id,
              import_id: importJob.id,
              status: 'draft',
              review_status: 'pending'
            }))

            const { error: insertError } = await supabaseClient
              .from('imported_products')
              .insert(productsToInsert)

            if (insertError) {
              console.error(`Batch insertion error for ${file.name}:`, insertError)
              errors.push(`${file.name}: ${insertError.message}`)
            } else {
              successfulProducts += batch.length
            }
          }
        } catch (error) {
          console.error(`File processing error for ${file.name}:`, error)
          errors.push(`${file.name}: ${error.message}`)
        }

        totalProducts += file.rows

        // Update progress
        await supabaseClient
          .from('import_jobs')
          .update({
            processed_rows: totalProducts,
            success_rows: successfulProducts,
            error_rows: totalProducts - successfulProducts,
            errors: errors
          })
          .eq('id', importJob.id)
      }

      // Final update
      await supabaseClient
        .from('import_jobs')
        .update({
          status: errors.length === mockFiles.length ? 'failed' : 'completed',
          total_rows: totalProducts,
          processed_rows: totalProducts,
          success_rows: successfulProducts,
          error_rows: totalProducts - successfulProducts,
          errors: errors,
          result_data: {
            files_processed: mockFiles.map(f => f.name),
            total_files: mockFiles.length,
            bulk_import_config: importConfig,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', importJob.id)

      console.log(`Bulk import completed: ${successfulProducts}/${totalProducts} products imported`)

      return new Response(JSON.stringify({
        success: true,
        import_id: importJob.id,
        total_products: totalProducts,
        successful_products: successfulProducts,
        failed_products: totalProducts - successfulProducts,
        files_processed: mockFiles.length,
        errors: errors,
        message: `Import en masse terminé: ${successfulProducts}/${totalProducts} produits importés`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Bulk import processing error:', error)
      
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'failed',
          errors: [error.message]
        })
        .eq('id', importJob.id)

      throw error
    }

  } catch (error) {
    console.error('Bulk ZIP import error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})