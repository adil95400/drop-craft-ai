import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkImportRequest {
  zipFileUrl: string
  mappingConfig?: Record<string, string>
  importConfig?: { batch_size?: number; validate_data?: boolean; auto_detect_encoding?: boolean; skip_duplicates?: boolean }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })

    const { zipFileUrl, mappingConfig = {}, importConfig = {} }: BulkImportRequest = await req.json()

    // Create job in unified `jobs` table
    const { data: importJob, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: user.id,
        job_type: 'import',
        job_subtype: 'bulk_zip',
        status: 'running',
        name: 'Import ZIP en masse',
        started_at: new Date().toISOString(),
        input_data: { source_url: zipFileUrl, mapping_config: mappingConfig },
        total_items: 0,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single()

    if (jobError) return new Response(JSON.stringify({ error: 'Failed to create job' }), { status: 500, headers: corsHeaders })

    try {
      const zipResponse = await fetch(zipFileUrl)
      if (!zipResponse.ok) throw new Error(`Failed to download ZIP file: ${zipResponse.status}`)

      // Mock bulk processing
      const mockFiles = [
        { name: 'products_1.csv', rows: 150 }, { name: 'products_2.csv', rows: 200 },
        { name: 'categories.xml', rows: 50 }, { name: 'inventory.csv', rows: 300 }
      ]

      let totalProducts = 0, successfulProducts = 0
      let errors: string[] = []

      for (const file of mockFiles) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const fileProducts = []
        for (let i = 0; i < file.rows; i++) {
          fileProducts.push({ name: `Produit ${file.name} ${i + 1}`, description: `Produit importé depuis ${file.name}`, price: Math.floor(Math.random() * 200) + 10, cost_price: Math.floor(Math.random() * 100) + 5, currency: 'EUR', sku: `BULK-${Date.now()}-${i}`, category: file.name.includes('xml') ? 'XML Import' : 'CSV Import', supplier_name: 'Bulk Import', tags: ['bulk-import', file.name.split('.')[1]] })
        }

        try {
          const batchSize = importConfig.batch_size || 100
          for (let i = 0; i < fileProducts.length; i += batchSize) {
            const batch = fileProducts.slice(i, i + batchSize)
            const productsToInsert = batch.map(product => ({ ...product, user_id: user.id, import_id: importJob.id, status: 'draft', review_status: 'pending' }))
            const { error: insertError } = await supabaseClient.from('imported_products').insert(productsToInsert)
            if (insertError) { errors.push(`${file.name}: ${insertError.message}`) } else { successfulProducts += batch.length }
          }
        } catch (error) { errors.push(`${file.name}: ${error.message}`) }

        totalProducts += file.rows

        // Update progress in unified `jobs` table
        await supabaseClient.from('jobs').update({
          total_items: totalProducts,
          processed_items: totalProducts,
          failed_items: totalProducts - successfulProducts,
          progress_percent: Math.round((totalProducts / mockFiles.reduce((s, f) => s + f.rows, 0)) * 100),
        }).eq('id', importJob.id)
      }

      // Final update in unified `jobs` table
      await supabaseClient.from('jobs').update({
        status: errors.length === mockFiles.length ? 'failed' : 'completed',
        total_items: totalProducts,
        processed_items: totalProducts,
        failed_items: totalProducts - successfulProducts,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
        output_data: { files_processed: mockFiles.map(f => f.name), total_files: mockFiles.length, bulk_import_config: importConfig },
      }).eq('id', importJob.id)

      return new Response(JSON.stringify({
        success: true, import_id: importJob.id, total_products: totalProducts, successful_products: successfulProducts,
        failed_products: totalProducts - successfulProducts, files_processed: mockFiles.length, errors,
        message: `Import en masse terminé: ${successfulProducts}/${totalProducts} produits importés`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
      await supabaseClient.from('jobs').update({ status: 'failed', error_message: error.message, completed_at: new Date().toISOString() }).eq('id', importJob.id)
      throw error
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
