/**
 * CSV Import — Thin proxy to robust-import-pipeline
 * P0.1: Parses CSV then delegates item processing to unified pipeline.
 * Writes to canonical `products` table via pipeline (not `imported_products`).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.181.0/encoding/csv.ts'
import { authenticateUser, logSecurityEvent, checkRateLimit } from '../_shared/secure-auth.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req)
  }

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

    const { rows, csv_content, file_url, field_mapping = {}, columnMapping = {}, config = {} } = await req.json()

    if (!rows && !csv_content && !file_url) {
      throw new Error('CSV rows, content or file URL is required')
    }

    let records = rows || []

    // Parse CSV if raw content or URL provided
    if (!records || records.length === 0) {
      let csvData = csv_content
      if (file_url && !csvData) {
        const response = await fetch(file_url)
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`)
        csvData = await response.text()
      }

      const delimiter = config.delimiter || detectDelimiter(csvData)
      records = parse(csvData, {
        skipFirstRow: config.skipFirstRow !== false,
        separator: delimiter,
        columns: config.columns || undefined,
      })
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No records found in CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mapping = columnMapping || field_mapping

    // Map CSV records to pipeline items
    const pipelineItems = records.map((record: any) => {
      const item: any = {}

      // Apply field mapping
      for (const [csvField, productField] of Object.entries(mapping)) {
        if (record[csvField] !== undefined && record[csvField] !== null && record[csvField] !== '') {
          item[productField as string] = record[csvField]
        }
      }

      // Default field extraction
      item.title = item.title || item.name || record.name || record.title || record.product_name
      item.name = item.title
      item.price = item.price !== undefined ? item.price : (record.price || record.sale_price || '0')
      item.cost_price = item.cost_price || record.cost_price || record.cost
      item.description = item.description || record.description || ''
      item.sku = item.sku || record.sku || record.id
      item.image_url = item.image_url || record.image || record.image_url || ''
      item.category = item.category || record.category || ''
      item.brand = item.brand || record.brand || ''
      item.stock_quantity = item.stock_quantity || record.stock_quantity || record.stock || '0'
      item.supplier = item.supplier_name || record.supplier || record.supplier_name || ''

      // Tags
      if (record.tags) {
        item.tags = typeof record.tags === 'string' ? record.tags.split(',').map((t: string) => t.trim()) : record.tags
      }

      return item
    })

    console.log(`[csv-import] Delegating ${pipelineItems.length} CSV rows to robust-import-pipeline for user ${userId.slice(0, 8)}`)

    // Delegate to robust-import-pipeline
    const authHeader = req.headers.get('Authorization')!
    const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/robust-import-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        action: 'start',
        items: pipelineItems,
        source: 'csv',
      }),
    })

    const pipelineResult = await pipelineResponse.json()

    if (!pipelineResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: pipelineResult.error || 'Pipeline error' }),
        { status: pipelineResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await logSecurityEvent(supabase, userId, 'csv_import_delegated', 'info', {
      total_rows: records.length,
      job_id: pipelineResult.job_id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        job_id: pipelineResult.job_id,
        totalRows: records.length,
        status: 'processing',
        message: `${records.length} CSV rows queued via robust-import-pipeline`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 }
    )
  } catch (error) {
    console.error('[csv-import] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
