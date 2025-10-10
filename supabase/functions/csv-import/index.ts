import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { parse } from "https://deno.land/std@0.181.0/encoding/csv.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Authentication required')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { csv_content, file_url, field_mapping = {}, config = {} } = await req.json()
    
    if (!csv_content && !file_url) {
      throw new Error('CSV content or file URL is required')
    }

    console.log('[CSV-IMPORT] Starting CSV import', { 
      user_id: user.id,
      has_content: !!csv_content,
      has_url: !!file_url
    })

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'csv',
        source_url: file_url || null,
        configuration: { field_mapping, ...config },
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) throw jobError
    jobId = job.id

    console.log('[CSV-IMPORT] Created job', { job_id: jobId })

    // Get CSV content
    let csvData = csv_content
    if (file_url && !csvData) {
      const response = await fetch(file_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`)
      }
      csvData = await response.text()
    }

    // Detect delimiter if not specified
    const delimiter = config.delimiter || detectDelimiter(csvData)
    
    console.log('[CSV-IMPORT] Parsing CSV', { 
      delimiter,
      size: csvData.length 
    })

    // Parse CSV
    const records = parse(csvData, {
      skipFirstRow: config.skipFirstRow !== false,
      separator: delimiter,
      columns: config.columns || undefined
    })

    console.log('[CSV-IMPORT] Parsed CSV', { 
      records_count: records.length 
    })

    // Update total rows
    await supabase
      .from('import_jobs')
      .update({
        total_rows: records.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // Map and insert products in batches
    const batchSize = 50
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      // Map records to product schema
      const products = batch.map((record: any) => {
        const product: any = {
          user_id: user.id,
          status: 'draft',
          import_job_id: jobId
        }

        // Apply field mapping
        for (const [csvField, productField] of Object.entries(field_mapping)) {
          if (record[csvField] !== undefined && record[csvField] !== null) {
            product[productField] = record[csvField]
          }
        }

        // Fallback mappings
        product.name = product.name || record.name || record.title || record.product_name || 'Sans nom'
        product.price = product.price || parseFloat(record.price || record.sale_price || '0') || 0
        product.description = product.description || record.description || null
        product.sku = product.sku || record.sku || record.id || null
        product.image_url = product.image_url || record.image || record.image_url || null

        // Handle image arrays
        if (record.images) {
          try {
            product.images = typeof record.images === 'string' 
              ? JSON.parse(record.images) 
              : record.images
          } catch (e) {
            product.images = [record.images]
          }
        }

        return product
      })

      console.log('[CSV-IMPORT] Inserting batch', { 
        start: i,
        end: i + batch.length,
        total: records.length
      })

      const { error: insertError } = await supabase
        .from('imported_products')
        .insert(products)

      if (insertError) {
        console.error('[CSV-IMPORT] Batch insert error', insertError.message)
        errorCount += batch.length
        errors.push(`Batch ${i}-${i + batch.length}: ${insertError.message}`)
      } else {
        successCount += batch.length
      }

      // Update progress
      await supabase
        .from('import_jobs')
        .update({
          processed_rows: Math.min(i + batch.length, records.length),
          success_rows: successCount,
          error_rows: errorCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    const executionTime = Date.now() - startTime
    const finalStatus = errorCount === records.length ? 'failed' : 'completed'

    // Update job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        total_rows: records.length,
        processed_rows: records.length,
        success_rows: successCount,
        error_rows: errorCount,
        errors: errors.length > 0 ? errors : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    console.log('[CSV-IMPORT] Import completed', {
      job_id: jobId,
      total: records.length,
      success: successCount,
      errors: errorCount,
      duration_ms: executionTime
    })

    return new Response(
      JSON.stringify({
        success: finalStatus === 'completed',
        job_id: jobId,
        total_records: records.length,
        imported: successCount,
        errors: errorCount,
        error_details: errors.length > 0 ? errors : undefined,
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('[CSV-IMPORT] Error', { 
      error: error.message,
      job_id: jobId 
    })

    if (jobId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('import_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            errors: [error.message],
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      } catch (updateError) {
        console.error('[CSV-IMPORT] Failed to update job status', updateError)
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        job_id: jobId,
        execution_time_ms: executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function detectDelimiter(csv: string): string {
  const firstLine = csv.split('\n')[0]
  const delimiters = [',', ';', '\t', '|']
  
  let maxCount = 0
  let detectedDelimiter = ','
  
  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(delimiter, 'g')) || []).length
    if (count > maxCount) {
      maxCount = count
      detectedDelimiter = delimiter
    }
  }
  
  return detectedDelimiter
}