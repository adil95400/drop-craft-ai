import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { sourceUrl, sourceType, mapping = {}, config = {} } = await req.json()

    const response = await fetch(sourceUrl, { headers: { 'Accept': 'application/json, application/xml, text/xml, */*', 'User-Agent': 'ShopOpti-Import/1.0' } })
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)

    const content = await response.text()
    let products: any[] = []
    
    if (sourceType === 'json') { products = parseJSON(content, mapping) }
    else if (sourceType === 'xml') { products = parseXML(content, mapping) }
    else {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) { products = parseJSON(content, mapping) }
      else if (content.trim().startsWith('<')) { products = parseXML(content, mapping) }
      else throw new Error('Unable to detect file format.')
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No products found in file.', debug: { content_preview: content.substring(0, 500), detected_type: sourceType } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Create job in unified `jobs` table
    const { data: job } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: user.id,
        job_type: 'import',
        job_subtype: sourceType,
        status: 'running',
        name: `Import ${sourceType.toUpperCase()}: ${sourceUrl}`,
        started_at: new Date().toISOString(),
        input_data: { source_url: sourceUrl, source_type: sourceType },
        total_items: products.length,
        processed_items: 0,
        failed_items: 0,
      })
      .select()
      .single()

    const jobId = job?.id

    let successCount = 0, errorCount = 0
    const errors: string[] = []
    const batchSize = config.batchSize || 100

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize).map((product, idx) => ({
        user_id: user.id, name: product.name || `Produit ${sourceType.toUpperCase()} ${i + idx + 1}`,
        description: cleanDescription(product.description || ''), price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : null,
        sku: product.sku || `${sourceType.toUpperCase()}-${Date.now()}-${i + idx}`,
        category: product.category || `Import ${sourceType.toUpperCase()}`, brand: product.brand || '',
        image_url: product.image_url || '', stock_quantity: parseInt(product.stock_quantity) || 0,
        status: config.status || 'draft', review_status: 'pending', source_url: sourceUrl,
        external_id: product.external_id || product.id || product.sku,
        supplier_name: product.supplier_name || config.supplierName || `Import ${sourceType.toUpperCase()}`,
        import_job_id: jobId, metadata: product.metadata || null
      }))

      const { data, error } = await supabaseClient.from('imported_products').insert(batch).select('id')
      if (error) { errorCount += batch.length; errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`) }
      else { successCount += data?.length || 0 }

      // Update progress in unified `jobs` table
      if (jobId) {
        await supabaseClient.from('jobs').update({
          processed_items: Math.min(i + batchSize, products.length),
          failed_items: errorCount,
          progress_percent: Math.round((Math.min(i + batchSize, products.length) / products.length) * 100),
        }).eq('id', jobId)
      }
    }

    // Complete job in unified `jobs` table
    if (jobId) {
      await supabaseClient.from('jobs').update({
        status: errorCount === products.length ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        processed_items: products.length,
        failed_items: errorCount,
        progress_percent: 100,
        error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
        output_data: { success_count: successCount, error_count: errorCount },
      }).eq('id', jobId)
    }

    await supabaseClient.from('activity_logs').insert({
      user_id: user.id, action: 'product_import',
      description: `Import ${sourceType.toUpperCase()}: ${successCount} produits importés`,
      entity_type: 'import', metadata: { source_type: sourceType, source_url: sourceUrl, success: successCount, errors: errorCount, job_id: jobId }
    })

    return new Response(JSON.stringify({ success: successCount > 0, message: `Import ${sourceType} réussi`, data: { products_imported: successCount, total_processed: products.length, errors: errorCount, error_details: errors.slice(0, 10), job_id: jobId } }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})

// Enhanced JSON Parser
function parseJSON(content: string, mapping: Record<string, string>): any[] {
  try {
    const data = JSON.parse(content)
    
    // Find the products array (try multiple common paths)
    let items = Array.isArray(data) ? data : null
    
    if (!items) {
      const paths = ['products', 'items', 'data', 'results', 'articles', 'entries', 'catalog', 'inventory']
      for (const path of paths) {
        if (data[path] && Array.isArray(data[path])) {
          items = data[path]
          break
        }
      }
    }
    
    if (!items) {
      // If single object, wrap it
      items = [data]
    }
    
    return items.map((item: any) => mapProduct(item, mapping)).filter((p: any) => p.name || p.sku)
  } catch (e) {
    console.error('JSON parse error:', e)
    return []
  }
}

// Enhanced XML Parser
function parseXML(content: string, mapping: Record<string, string>): any[] {
  const products: any[] = []
  
  // Try multiple product element patterns
  const patterns = [
    /<product[^>]*>([\s\S]*?)<\/product>/gi,
    /<item[^>]*>([\s\S]*?)<\/item>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<entry[^>]*>([\s\S]*?)<\/entry>/gi,
    /<offer[^>]*>([\s\S]*?)<\/offer>/gi, // Google Shopping
    /<g:item[^>]*>([\s\S]*?)<\/g:item>/gi, // Google namespace
  ]
  
  let matches: string[] = []
  
  for (const pattern of patterns) {
    const found = content.match(pattern)
    if (found && found.length > 0) {
      matches = found
      break
    }
  }
  
  if (matches.length === 0) {
    console.log('⚠️ No product elements found, trying to parse as flat structure')
    // Try to parse as single product or flat structure
    const product = extractXMLFields(content, mapping)
    if (product.name || product.sku) {
      products.push(product)
    }
    return products
  }
  
  for (const match of matches) {
    const product = extractXMLFields(match, mapping)
    if (product.name || product.sku) {
      products.push(product)
    }
  }
  
  return products
}

// Extract fields from XML element
function extractXMLFields(xml: string, mapping: Record<string, string>): any {
  const product: any = {}
  
  // Default field mappings
  const fieldMappings: Record<string, string[]> = {
    name: ['name', 'title', 'nom', 'titre', 'g:title', 'product_name'],
    description: ['description', 'desc', 'body', 'content', 'g:description', 'long_description'],
    price: ['price', 'prix', 'sale_price', 'g:price', 'regular_price', 'current_price'],
    cost_price: ['cost', 'cost_price', 'cout', 'wholesale_price'],
    sku: ['sku', 'reference', 'ref', 'id', 'g:id', 'product_id', 'mpn', 'g:mpn'],
    category: ['category', 'categorie', 'cat', 'g:product_type', 'product_type'],
    brand: ['brand', 'marque', 'manufacturer', 'g:brand'],
    image_url: ['image', 'image_url', 'picture', 'photo', 'g:image_link', 'image_link', 'main_image'],
    stock_quantity: ['stock', 'quantity', 'stock_quantity', 'qty', 'g:quantity', 'inventory'],
    gtin: ['gtin', 'ean', 'upc', 'g:gtin', 'barcode'],
    weight: ['weight', 'poids', 'g:shipping_weight'],
  }
  
  // Apply custom mapping first
  for (const [xmlField, productField] of Object.entries(mapping)) {
    const value = extractXMLValue(xml, xmlField)
    if (value) {
      product[productField] = value
    }
  }
  
  // Then apply default mappings for missing fields
  for (const [productField, xmlFields] of Object.entries(fieldMappings)) {
    if (!product[productField]) {
      for (const xmlField of xmlFields) {
        const value = extractXMLValue(xml, xmlField)
        if (value) {
          product[productField] = value
          break
        }
      }
    }
  }
  
  // Extract additional attributes as metadata
  const gtin = product.gtin
  const weight = product.weight
  if (gtin || weight) {
    product.metadata = { gtin, weight }
  }
  
  return product
}

// Extract value from XML tag
function extractXMLValue(xml: string, tag: string): string | null {
  // Handle namespaced tags
  const escapedTag = tag.replace(/:/g, '\\:')
  
  // Try different patterns
  const patterns = [
    new RegExp(`<${escapedTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i'),
    new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'),
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  ]
  
  for (const pattern of patterns) {
    const match = xml.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

// Map product fields
function mapProduct(item: any, mapping: Record<string, string>): any {
  const product: any = {}
  
  // Apply custom mapping
  for (const [srcField, destField] of Object.entries(mapping)) {
    if (item[srcField] !== undefined) {
      product[destField] = item[srcField]
    }
  }
  
  // Default mappings
  product.name = product.name || item.name || item.title || item.nom || item.titre
  product.description = product.description || item.description || item.desc || ''
  product.price = product.price || item.price || item.prix || item.sale_price
  product.cost_price = product.cost_price || item.cost_price || item.cost
  product.sku = product.sku || item.sku || item.reference || item.ref || item.id
  product.category = product.category || item.category || item.categorie
  product.brand = product.brand || item.brand || item.marque || item.manufacturer
  product.image_url = product.image_url || item.image_url || item.image || item.picture
  product.stock_quantity = product.stock_quantity || item.stock_quantity || item.stock || item.quantity
  product.external_id = item.id || item.external_id || product.sku
  
  // Handle images array
  if (item.images && Array.isArray(item.images) && !product.image_url) {
    product.image_url = item.images[0]
  }
  
  // Handle variants
  if (item.variants && Array.isArray(item.variants)) {
    product.metadata = { variants: item.variants }
  }
  
  return product
}

// Clean description HTML
function cleanDescription(desc: string): string {
  if (!desc) return ''
  
  // Remove HTML tags but keep text content
  return desc
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}
