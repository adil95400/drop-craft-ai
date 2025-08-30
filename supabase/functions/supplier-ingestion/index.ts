import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ImportJob {
  supplier_id: string
  user_id: string
  feed_type: 'csv' | 'xml' | 'json' | 'api'
  feed_url?: string
  feed_config: Record<string, any>
  field_mapping: Record<string, string>
  authentication?: Record<string, any>
}

interface ProductData {
  external_sku: string
  name: string
  description?: string
  price: number
  currency?: string
  stock_quantity?: number
  category?: string
  subcategory?: string
  brand?: string
  ean?: string
  upc?: string
  image_urls?: string[]
  attributes?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { job }: { job: ImportJob } = await req.json()

    console.log(`Starting import job for supplier ${job.supplier_id}`)

    // Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        supplier_id: job.supplier_id,
        user_id: job.user_id,
        batch_type: job.feed_type,
        status: 'processing'
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Process data based on feed type
    let products: ProductData[] = []
    
    try {
      switch (job.feed_type) {
        case 'csv':
          products = await processCsvFeed(job.feed_url!, job.field_mapping)
          break
        case 'xml':
          products = await processXmlFeed(job.feed_url!, job.field_mapping)
          break
        case 'json':
          products = await processJsonFeed(job.feed_url!, job.field_mapping, job.authentication)
          break
        case 'api':
          products = await processApiFeed(job.feed_config, job.field_mapping, job.authentication)
          break
      }

      console.log(`Processed ${products.length} products from ${job.feed_type} feed`)

      // Update batch with total count
      await supabase
        .from('import_batches')
        .update({ 
          total_products: products.length,
          processed_products: 0
        })
        .eq('id', batch.id)

      // Process products in batches of 100
      const batchSize = 100
      let successCount = 0
      let errorCount = 0
      const errors: any[] = []

      for (let i = 0; i < products.length; i += batchSize) {
        const productBatch = products.slice(i, i + batchSize)
        
        try {
          const supplierProducts = productBatch.map(product => ({
            supplier_id: job.supplier_id,
            user_id: job.user_id,
            external_sku: product.external_sku,
            name: product.name,
            description: product.description || '',
            price: product.price,
            currency: product.currency || 'EUR',
            stock_quantity: product.stock_quantity || 0,
            category: product.category,
            subcategory: product.subcategory,
            brand: product.brand,
            ean: product.ean,
            upc: product.upc,
            image_urls: product.image_urls || [],
            attributes: product.attributes || {},
            raw_data: product,
            import_batch_id: batch.id
          }))

          const { error: insertError } = await supabase
            .from('supplier_products')
            .upsert(supplierProducts, { 
              onConflict: 'supplier_id,external_sku',
              ignoreDuplicates: false 
            })

          if (insertError) {
            console.error(`Batch ${i}-${i + batchSize} error:`, insertError)
            errors.push({ batch: `${i}-${i + batchSize}`, error: insertError.message })
            errorCount += productBatch.length
          } else {
            successCount += productBatch.length
            console.log(`Successfully imported batch ${i}-${i + batchSize}`)
          }

        } catch (batchError) {
          console.error(`Batch processing error:`, batchError)
          errors.push({ batch: `${i}-${i + batchSize}`, error: batchError.message })
          errorCount += productBatch.length
        }

        // Update progress
        await supabase
          .from('import_batches')
          .update({ 
            processed_products: Math.min(i + batchSize, products.length),
            successful_imports: successCount,
            failed_imports: errorCount
          })
          .eq('id', batch.id)
      }

      // Finalize batch
      await supabase
        .from('import_batches')
        .update({
          status: errors.length > 0 ? 'completed' : 'completed',
          successful_imports: successCount,
          failed_imports: errorCount,
          error_details: errors,
          completed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - new Date(batch.created_at).getTime()
        })
        .eq('id', batch.id)

      // Update supplier feed status
      await supabase
        .from('supplier_feeds')
        .update({
          last_import_at: new Date().toISOString(),
          last_import_status: errors.length === 0 ? 'success' : 'error',
          error_log: errors.length > 0 ? errors : []
        })
        .eq('supplier_id', job.supplier_id)

      return new Response(
        JSON.stringify({
          success: true,
          batchId: batch.id,
          totalProducts: products.length,
          successCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } catch (processingError) {
      console.error('Import processing error:', processingError)
      
      // Update batch as failed
      await supabase
        .from('import_batches')
        .update({
          status: 'failed',
          error_details: [{ error: processingError.message }],
          completed_at: new Date().toISOString()
        })
        .eq('id', batch.id)

      throw processingError
    }

  } catch (error) {
    console.error('Supplier ingestion error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processCsvFeed(url: string, mapping: Record<string, string>): Promise<ProductData[]> {
  const response = await fetch(url)
  const csvText = await response.text()
  
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  const products: ProductData[] = []
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    products.push(mapRowToProduct(row, mapping))
  }
  
  return products
}

async function processXmlFeed(url: string, mapping: Record<string, string>): Promise<ProductData[]> {
  const response = await fetch(url)
  const xmlText = await response.text()
  
  // Simple XML parsing - in production, use a proper XML parser
  const productMatches = xmlText.match(/<product[^>]*>[\s\S]*?<\/product>/g) || []
  
  const products: ProductData[] = []
  
  for (const productXml of productMatches) {
    const row: Record<string, string> = {}
    
    // Extract values using regex (simplified)
    Object.keys(mapping).forEach(key => {
      const regex = new RegExp(`<${key}[^>]*>([^<]*)<\/${key}>`, 'i')
      const match = productXml.match(regex)
      row[key] = match ? match[1].trim() : ''
    })
    
    products.push(mapRowToProduct(row, mapping))
  }
  
  return products
}

async function processJsonFeed(url: string, mapping: Record<string, string>, auth?: Record<string, any>): Promise<ProductData[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (auth?.api_key) {
    headers['Authorization'] = `Bearer ${auth.api_key}`
  }
  
  const response = await fetch(url, { headers })
  const data = await response.json()
  
  const products: ProductData[] = []
  const items = Array.isArray(data) ? data : data.products || data.items || []
  
  for (const item of items) {
    products.push(mapRowToProduct(item, mapping))
  }
  
  return products
}

async function processApiFeed(config: Record<string, any>, mapping: Record<string, string>, auth?: Record<string, any>): Promise<ProductData[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (auth?.api_key) {
    headers['Authorization'] = `Bearer ${auth.api_key}`
  }
  
  const response = await fetch(config.endpoint, {
    method: config.method || 'GET',
    headers,
    body: config.body ? JSON.stringify(config.body) : undefined
  })
  
  const data = await response.json()
  
  const products: ProductData[] = []
  const items = Array.isArray(data) ? data : data.products || data.items || []
  
  for (const item of items) {
    products.push(mapRowToProduct(item, mapping))
  }
  
  return products
}

function mapRowToProduct(row: Record<string, any>, mapping: Record<string, string>): ProductData {
  const product: ProductData = {
    external_sku: String(row[mapping.sku] || row[mapping.external_sku] || row.sku || row.id || ''),
    name: String(row[mapping.name] || row.name || ''),
    description: String(row[mapping.description] || row.description || ''),
    price: parseFloat(String(row[mapping.price] || row.price || '0')),
    currency: String(row[mapping.currency] || row.currency || 'EUR'),
    stock_quantity: parseInt(String(row[mapping.stock] || row.stock_quantity || '0')),
    category: String(row[mapping.category] || row.category || ''),
    subcategory: String(row[mapping.subcategory] || row.subcategory || ''),
    brand: String(row[mapping.brand] || row.brand || ''),
    ean: String(row[mapping.ean] || row.ean || ''),
    upc: String(row[mapping.upc] || row.upc || ''),
    image_urls: Array.isArray(row[mapping.images]) ? row[mapping.images] : 
                row[mapping.images] ? [String(row[mapping.images])] : [],
    attributes: typeof row === 'object' ? row : {}
  }
  
  return product
}