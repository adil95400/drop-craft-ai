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

    // Support new format (rows array) or old format (csv_content/file_url)
    const { rows, csv_content, file_url, field_mapping = {}, columnMapping = {}, config = {}, userId } = await req.json()
    
    if (!rows && !csv_content && !file_url) {
      throw new Error('CSV rows, content or file URL is required')
    }

    console.log('[CSV-IMPORT] Starting CSV import', { 
      user_id: userId || user.id,
      has_rows: !!rows,
      has_content: !!csv_content,
      has_url: !!file_url,
      rows_count: rows?.length
    })

    // Create import job
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId || user.id,
        source_type: 'csv',
        source_url: file_url || null,
        configuration: { field_mapping: columnMapping || field_mapping, ...config },
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.warn('[CSV-IMPORT] Failed to create job, continuing without job tracking', jobError)
      // Continue without job tracking
    } else {
      jobId = job.id
      console.log('[CSV-IMPORT] Created job', { job_id: jobId })
    }

    let records = rows || []

    // If rows not provided, parse CSV content
    if (!records || records.length === 0) {
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
      records = parse(csvData, {
        skipFirstRow: config.skipFirstRow !== false,
        separator: delimiter,
        columns: config.columns || undefined
      })

      console.log('[CSV-IMPORT] Parsed CSV', { 
        records_count: records.length 
      })
    }

    // Update total rows if job exists
    if (jobId) {
      await supabase
        .from('import_jobs')
        .update({
          total_rows: records.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    // Map and insert products in batches
    const batchSize = config.batchSize || 500
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: any[] = []
    const createdIds: string[] = []
    const mapping = columnMapping || field_mapping

    // Get existing SKUs for duplicate checking
    const checkDuplicates = config.ignoreDuplicates || config.updateExisting
    let existingSkus = new Set<string>()
    
    if (checkDuplicates) {
      const { data: existingProducts } = await supabase
        .from('imported_products')
        .select('sku')
        .eq('user_id', userId || user.id)
      existingProducts?.forEach((p: any) => existingSkus.add(p.sku))
    }

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const productsToInsert: any[] = []
      const productsToUpdate: any[] = []
      
      // Map records to product schema
      batch.forEach((record: any, batchIndex: number) => {
        const rowNumber = i + batchIndex + 1
        
        try {
          const product: any = {
            user_id: userId || user.id,
            status: config.status || 'draft',
            review_status: 'pending',
            source_url: 'csv_import'
          }

          if (jobId) {
            product.import_job_id = jobId
          }

          // Apply field mapping
          for (const [csvField, productField] of Object.entries(mapping)) {
            if (record[csvField] !== undefined && record[csvField] !== null && record[csvField] !== '') {
              product[productField] = record[csvField]
            }
          }

          // Fallback mappings
          product.name = product.name || record.name || record.title || record.product_name
          product.price = product.price !== undefined ? parseFloat(product.price) : (parseFloat(record.price || record.sale_price || '0') || 0)
          product.cost_price = product.cost_price !== undefined ? parseFloat(product.cost_price) : null
          product.description = product.description || record.description || ''
          product.sku = product.sku || record.sku || record.id
          product.image_url = product.image_url || record.image || record.image_url || ''
          product.category = product.category || record.category || ''
          product.brand = product.brand || record.brand || ''
          product.stock_quantity = product.stock_quantity !== undefined ? parseInt(product.stock_quantity) : 0
          product.supplier_name = product.supplier_name || record.supplier || record.supplier_name || ''

          // Validate required fields
          if (!product.name || !product.sku) {
            errors.push({
              row: rowNumber,
              sku: product.sku,
              field: !product.name ? 'name' : 'sku',
              message: 'Champ requis manquant'
            })
            errorCount++
            return
          }

          // Validate price
          if (isNaN(product.price) || product.price < 0) {
            errors.push({
              row: rowNumber,
              sku: product.sku,
              field: 'price',
              message: 'Prix invalide'
            })
            errorCount++
            return
          }

          // Check duplicates
          const isDuplicate = existingSkus.has(product.sku)
          
          if (isDuplicate && config.ignoreDuplicates && !config.updateExisting) {
            skippedCount++
            return
          }

          // Handle metadata
          if (record.tags || record.weight || record.length || record.width || record.height) {
            product.metadata = {
              tags: record.tags ? record.tags.split(',').map((t: string) => t.trim()) : [],
              dimensions: {
                weight: record.weight ? parseFloat(record.weight) : null,
                length: record.length ? parseFloat(record.length) : null,
                width: record.width ? parseFloat(record.width) : null,
                height: record.height ? parseFloat(record.height) : null,
              }
            }
          }

          product.external_id = product.sku

          if (isDuplicate && config.updateExisting) {
            productsToUpdate.push(product)
          } else if (!isDuplicate) {
            productsToInsert.push(product)
          }
          
        } catch (error) {
          console.error(`[CSV-IMPORT] Error processing row ${rowNumber}:`, error)
          errors.push({
            row: rowNumber,
            sku: record.sku,
            message: error instanceof Error ? error.message : 'Erreur inconnue'
          })
          errorCount++
        }
      })

      // Insert new products
      if (productsToInsert.length > 0) {
        console.log('[CSV-IMPORT] Inserting batch', { 
          start: i,
          count: productsToInsert.length,
          total: records.length
        })

        const { data: inserted, error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)
          .select('id')

        if (insertError) {
          console.error('[CSV-IMPORT] Batch insert error', insertError.message)
          errorCount += productsToInsert.length
          errors.push({
            row: i,
            message: `Erreur d'insertion batch: ${insertError.message}`
          })
        } else {
          successCount += inserted?.length || 0
          inserted?.forEach((p: any) => createdIds.push(p.id))
        }
      }

      // Update existing products
      if (productsToUpdate.length > 0) {
        console.log('[CSV-IMPORT] Updating batch', { 
          count: productsToUpdate.length
        })
        
        for (const product of productsToUpdate) {
          const { error: updateError } = await supabase
            .from('imported_products')
            .update(product)
            .eq('user_id', userId || user.id)
            .eq('sku', product.sku)

          if (updateError) {
            errorCount++
            errors.push({
              row: i,
              sku: product.sku,
              message: `Erreur de mise à jour: ${updateError.message}`
            })
          } else {
            successCount++
          }
        }
      }

      // Update progress if job exists
      if (jobId) {
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
    }

    const duration = Date.now() - startTime
    const finalStatus = errorCount === records.length ? 'failed' : 'completed'

    // Update job as completed if exists
    if (jobId) {
      await supabase
        .from('import_jobs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          total_rows: records.length,
          processed_rows: records.length,
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors.length > 0 ? errors.map(e => JSON.stringify(e)) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId || user.id,
      action: 'product_import',
      description: `Import CSV: ${successCount} produits importés`,
      entity_type: 'product',
      metadata: {
        total_rows: records.length,
        success_count: successCount,
        error_count: errorCount,
        skipped_count: skippedCount,
        duration_ms: duration,
        job_id: jobId
      }
    })

    console.log('[CSV-IMPORT] Import completed', {
      job_id: jobId,
      total: records.length,
      success: successCount,
      errors: errorCount,
      skipped: skippedCount,
      duration_ms: duration
    })

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        totalRows: records.length,
        successCount,
        errorCount,
        skippedCount,
        errors: errors.slice(0, 100), // Limit error list
        duration,
        createdIds,
        job_id: jobId
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