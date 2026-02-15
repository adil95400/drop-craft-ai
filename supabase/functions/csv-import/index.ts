import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { parse } from "https://deno.land/std@0.181.0/encoding/csv.ts"
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { secureBatchInsert, logDatabaseOperation } from '../_shared/db-helpers.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'
import { createRateLimitResponse } from '../_shared/rate-limit.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)
  
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

  const startTime = Date.now()
  let jobId: string | null = null

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id
    
    const rateCheck = await checkRateLimit(supabase, userId, 'csv_import', 10, 60)
    if (!rateCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Max 10 imports per hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('[CSV-IMPORT] Authenticated user:', { user_id: userId })

    const { rows, csv_content, file_url, field_mapping = {}, columnMapping = {}, config = {} } = await req.json()
    
    if (!rows && !csv_content && !file_url) {
      throw new Error('CSV rows, content or file URL is required')
    }

    // Create job in unified `jobs` table
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        job_type: 'import',
        job_subtype: 'csv',
        status: 'running',
        name: 'Import CSV',
        started_at: new Date().toISOString(),
        input_data: { source_url: file_url || null, field_mapping: columnMapping || field_mapping, ...config },
        total_items: 0,
        processed_items: 0,
        failed_items: 0,
        progress_percent: 0,
      })
      .select()
      .single()

    if (jobError) {
      console.warn('[CSV-IMPORT] Failed to create job, continuing without job tracking', jobError)
    } else {
      jobId = job.id
      console.log('[CSV-IMPORT] Created job', { job_id: jobId })
    }

    let records = rows || []

    if (!records || records.length === 0) {
      let csvData = csv_content
      if (file_url && !csvData) {
        const response = await fetch(file_url)
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status}`)
        }
        csvData = await response.text()
      }

      const delimiter = config.delimiter || detectDelimiter(csvData)
      
      records = parse(csvData, {
        skipFirstRow: config.skipFirstRow !== false,
        separator: delimiter,
        columns: config.columns || undefined
      })
    }

    // Update total items
    if (jobId) {
      await supabase
        .from('jobs')
        .update({ total_items: records.length, updated_at: new Date().toISOString() })
        .eq('id', jobId)
    }

    const batchSize = config.batchSize || 500
    let successCount = 0
    let errorCount = 0
    let skippedCount = 0
    const errors: any[] = []
    const createdIds: string[] = []
    const mapping = columnMapping || field_mapping

    const checkDuplicates = config.ignoreDuplicates || config.updateExisting
    let existingSkus = new Set<string>()
    
    if (checkDuplicates) {
      const { data: existingProducts } = await supabase
        .from('imported_products')
        .select('sku')
        .eq('user_id', userId)
      existingProducts?.forEach((p: any) => existingSkus.add(p.sku))
    }

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const productsToInsert: any[] = []
      const productsToUpdate: any[] = []
      
      batch.forEach((record: any, batchIndex: number) => {
        const rowNumber = i + batchIndex + 1
        
        try {
          const product: any = {
            user_id: userId,
            status: config.status || 'draft',
            review_status: 'pending',
            source_url: 'csv_import'
          }

          if (jobId) {
            product.import_job_id = jobId
          }

          for (const [csvField, productField] of Object.entries(mapping)) {
            if (record[csvField] !== undefined && record[csvField] !== null && record[csvField] !== '') {
              product[productField as string] = record[csvField]
            }
          }

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

          if (!product.name || !product.sku) {
            errors.push({ row: rowNumber, sku: product.sku, field: !product.name ? 'name' : 'sku', message: 'Champ requis manquant' })
            errorCount++
            return
          }

          if (isNaN(product.price) || product.price < 0) {
            errors.push({ row: rowNumber, sku: product.sku, field: 'price', message: 'Prix invalide' })
            errorCount++
            return
          }

          const isDuplicate = existingSkus.has(product.sku)
          
          if (isDuplicate && config.ignoreDuplicates && !config.updateExisting) {
            skippedCount++
            return
          }

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
          errors.push({ row: rowNumber, sku: record.sku, message: error instanceof Error ? error.message : 'Erreur inconnue' })
          errorCount++
        }
      })

      if (productsToInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('imported_products')
          .insert(productsToInsert)
          .select('id')

        if (insertError) {
          errorCount += productsToInsert.length
          errors.push({ row: i, message: `Erreur d'insertion batch: ${insertError.message}` })
        } else {
          successCount += inserted?.length || 0
          inserted?.forEach((p: any) => createdIds.push(p.id))
        }
      }

      if (productsToUpdate.length > 0) {
        for (const product of productsToUpdate) {
          const { error: updateError } = await supabase
            .from('imported_products')
            .update(product)
            .eq('user_id', userId)
            .eq('sku', product.sku)

          if (updateError) {
            errorCount++
            errors.push({ row: i, sku: product.sku, message: `Erreur de mise à jour: ${updateError.message}` })
          } else {
            successCount++
          }
        }
      }

      // Update progress in unified `jobs` table
      if (jobId) {
        await supabase
          .from('jobs')
          .update({
            processed_items: Math.min(i + batch.length, records.length),
            failed_items: errorCount,
            progress_percent: Math.round((Math.min(i + batch.length, records.length) / records.length) * 100),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }
    }

    const duration = Date.now() - startTime
    const finalStatus = errorCount === records.length ? 'failed' : 'completed'

    // Update job as completed in unified `jobs` table
    if (jobId) {
      await supabase
        .from('jobs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          total_items: records.length,
          processed_items: records.length,
          failed_items: errorCount,
          progress_percent: 100,
          duration_ms: duration,
          error_message: errors.length > 0 ? errors.slice(0, 5).map(e => e.message || JSON.stringify(e)).join('; ') : null,
          output_data: { success_count: successCount, error_count: errorCount, skipped_count: skippedCount },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
    }

    await logDatabaseOperation(supabase, userId, 'insert', 'imported_products', successCount)
    
    await logSecurityEvent(supabase, userId, 'csv_import_completed', 'info', {
      total_rows: records.length, success_count: successCount, error_count: errorCount,
      skipped_count: skippedCount, duration_ms: duration, job_id: jobId
    })
    
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'product_import',
      description: `Import CSV: ${successCount} produits importés`,
      entity_type: 'product',
      metadata: { total_rows: records.length, success_count: successCount, error_count: errorCount, skipped_count: skippedCount, duration_ms: duration, job_id: jobId }
    })

    return new Response(
      JSON.stringify({ success: successCount > 0, totalRows: records.length, successCount, errorCount, skippedCount, errors: errors.slice(0, 100), duration, createdIds, job_id: jobId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('[CSV-IMPORT] Error', { error: error.message, job_id: jobId })

    if (jobId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        await supabase
          .from('jobs')
          .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: error.message, duration_ms: executionTime, updated_at: new Date().toISOString() })
          .eq('id', jobId)
      } catch (updateError) {
        console.error('[CSV-IMPORT] Failed to update job status', updateError)
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message, job_id: jobId, execution_time_ms: executionTime }),
      { headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
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
    if (count > maxCount) { maxCount = count; detectedDelimiter = delimiter }
  }
  return detectedDelimiter
}
