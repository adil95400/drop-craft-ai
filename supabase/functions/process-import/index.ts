import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    })

    const { importJobId, fileData, mappingConfig } = await req.json()
    
    console.log('Processing import job:', importJobId)

    // Update job status to processing
    await supabaseClient
      .from('import_jobs')
      .update({ 
        status: 'processing',
        processed_rows: 0,
        success_rows: 0,
        error_rows: 0
      })
      .eq('id', importJobId)

    // Simulate processing with some realistic data
    const totalRows = fileData.length
    let processedRows = 0
    let successRows = 0
    let errorRows = 0
    const errors: string[] = []

    // Process each row
    for (let i = 0; i < fileData.length; i++) {
      const row = fileData[i]
      
      try {
        // Map fields according to configuration
        const mappedProduct = {
          name: row[mappingConfig.name] || `Product ${i + 1}`,
          description: row[mappingConfig.description] || '',
          price: parseFloat(row[mappingConfig.price]) || 0,
          cost_price: parseFloat(row[mappingConfig.cost_price]) || 0,
          sku: row[mappingConfig.sku] || `SKU-${Date.now()}-${i}`,
          category: row[mappingConfig.category] || 'Divers',
          image_url: row[mappingConfig.image_url] || null
        }

        // Validate required fields
        if (!mappedProduct.name || mappedProduct.price <= 0) {
          throw new Error(`Row ${i + 1}: Missing required fields`)
        }

        // Insert into imported_products table
        const { error: insertError } = await supabaseClient
          .from('imported_products')
          .insert([{
            import_id: importJobId,
            ...mappedProduct,
            status: 'draft',
            review_status: 'pending'
          }])

        if (insertError) throw insertError

        successRows++
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        errors.push(`Row ${i + 1}: ${error.message}`)
        errorRows++
      }

      processedRows++

      // Update progress every 10 rows or at the end
      if (processedRows % 10 === 0 || processedRows === totalRows) {
        await supabaseClient
          .from('import_jobs')
          .update({
            processed_rows: processedRows,
            success_rows: successRows,
            error_rows: errorRows,
            errors: errors
          })
          .eq('id', importJobId)
      }

      // Small delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Final update
    await supabaseClient
      .from('import_jobs')
      .update({
        status: 'completed',
        processed_rows: processedRows,
        success_rows: successRows,
        error_rows: errorRows,
        errors: errors,
        result_data: {
          summary: {
            total: totalRows,
            success: successRows,
            errors: errorRows
          },
          completion_time: new Date().toISOString()
        }
      })
      .eq('id', importJobId)

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedRows,
        successful: successRows,
        failed: errorRows,
        errors: errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Import processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process import',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})