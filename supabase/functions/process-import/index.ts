import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Process import function called')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    const { importJobId, fileData, mappingConfig } = await req.json()
    
    if (!importJobId || !fileData || !Array.isArray(fileData)) {
      throw new Error('Missing required parameters: importJobId and fileData array')
    }
    
    console.log(`Processing import job: ${importJobId}, ${fileData.length} rows`)

    // Update job status to processing
    await supabase
      .from('import_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', importJobId)

    const totalRows = Math.min(fileData.length, 1000) // Limit to 1000 for performance
    let successRows = 0
    let errorRows = 0
    const errors: string[] = []

    // Process in batches of 50
    const batchSize = 50
    
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = fileData.slice(i, Math.min(i + batchSize, totalRows))
      const productsToInsert: any[] = []
      
      for (let j = 0; j < batch.length; j++) {
        const row = batch[j]
        const rowIndex = i + j + 1
        
        try {
          // Map fields according to configuration
          const name = row[mappingConfig?.name] || `Product ${rowIndex}`
          const price = parseFloat(row[mappingConfig?.price]) || 0
          
          if (!name || price <= 0) {
            throw new Error('Missing name or invalid price')
          }
          
          productsToInsert.push({
            user_id: user.id,
            title: name.substring(0, 500),
            description: (row[mappingConfig?.description] || '').substring(0, 5000),
            price: Math.min(price, 999999.99),
            cost_price: Math.min(parseFloat(row[mappingConfig?.cost_price]) || price * 0.7, 999999.99),
            sku: (row[mappingConfig?.sku] || `SKU-${Date.now()}-${rowIndex}`).substring(0, 100),
            category: (row[mappingConfig?.category] || 'Divers').substring(0, 100),
            image_url: row[mappingConfig?.image_url] || null,
            status: 'draft'
          })
          
        } catch (error) {
          console.warn(`Row ${rowIndex} error:`, error.message)
          errors.push(`Row ${rowIndex}: ${error.message}`)
          errorRows++
        }
      }
      
      // Insert batch
      if (productsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert)

        if (insertError) {
          console.error(`Batch insert error:`, insertError)
          errorRows += productsToInsert.length
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
        } else {
          successRows += productsToInsert.length
        }
      }

      // Update progress every batch
      await supabase
        .from('import_jobs')
        .update({
          successful_imports: successRows,
          failed_imports: errorRows,
          error_log: errors.length > 0 ? errors.slice(0, 50) : null
        })
        .eq('id', importJobId)

      console.log(`Progress: ${Math.min(i + batchSize, totalRows)}/${totalRows} (${successRows} success, ${errorRows} failed)`)
    }

    // Final update
    const finalStatus = errorRows > 0 && successRows === 0 ? 'failed' : 'completed'
    
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        total_products: totalRows,
        successful_imports: successRows,
        failed_imports: errorRows,
        error_log: errors.length > 0 ? errors.slice(0, 50) : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', importJobId)

    console.log(`Import completed: ${successRows} success, ${errorRows} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalRows,
        successful: successRows,
        failed: errorRows,
        errors: errors.slice(0, 10)
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
