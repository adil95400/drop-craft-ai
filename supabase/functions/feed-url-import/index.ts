import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Non autorisé - Veuillez vous connecter')
    }

    const { 
      feedUrl, 
      mode = 'preview', // 'preview' | 'import'
      mapping = {}, 
      config = {},
      preset = 'auto' // 'auto' | 'shopify' | 'google' | 'matterhorn' | 'custom'
    } = await req.json()

    if (!feedUrl) {
      throw new Error('URL du flux requise')
    }

    console.log(`📥 Feed URL Import - Mode: ${mode}, URL: ${feedUrl}`)

    // Fetch the feed content
    const response = await fetch(feedUrl, {
      headers: {
        'Accept': 'text/csv, application/json, application/xml, text/xml, */*',
        'User-Agent': 'ShopOpti-FeedImport/2.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Impossible de récupérer le flux: ${response.status} ${response.statusText}`)
    }

    const content = await response.text()
    const contentType = response.headers.get('content-type') || ''
    
    console.log(`📄 Contenu récupéré: ${content.length} bytes, Content-Type: ${contentType}`)
    
    // Auto-detect format
    const detectedFormat = detectFormat(content, contentType)
    console.log(`🔍 Format détecté: ${detectedFormat}`)
    
    let products: any[] = []
    let parseError: string | null = null
    
    try {
      switch (detectedFormat) {
        case 'csv':
          products = parseCSV(content, mapping, preset)
          break
        case 'json':
          products = parseJSON(content, mapping)
          break
        case 'xml':
          products = parseXML(content, mapping)
          break
        default:
          throw new Error(`Format non reconnu. Formats supportés: CSV, JSON, XML`)
      }
    } catch (e) {
      parseError = e.message
      console.error('❌ Parse error:', e)
    }

    console.log(`📦 Produits parsés: ${products.length}`)

    // Preview mode - return sample data
    if (mode === 'preview') {
      const sampleProducts = products.slice(0, 10)
      const columns = products.length > 0 ? Object.keys(products[0]) : []
      
      return new Response(
        JSON.stringify({
          success: products.length > 0,
          format: detectedFormat,
          total_products: products.length,
          sample_products: sampleProducts,
          columns_detected: columns,
          content_preview: content.substring(0, 1000),
          parse_error: parseError,
          preset_applied: preset
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Import mode - save to database
    if (products.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: parseError || 'Aucun produit trouvé dans le flux. Vérifiez le format et le mapping.',
          format: detectedFormat,
          content_preview: content.substring(0, 500)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create import job
    const { data: job } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: `feed-${detectedFormat}`,
        source_url: feedUrl,
        status: 'processing',
        total_rows: products.length,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    const jobId = job?.id

    // Insert products in batches
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    const batchSize = config.batchSize || 100

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize).map((product, idx) => ({
        user_id: user.id,
        name: product.name || product.title || `Produit Feed ${i + idx + 1}`,
        description: cleanHTML(product.description || product.body || ''),
        price: parsePrice(product.price || product.variant_price),
        compare_at_price: parsePrice(product.compare_at_price),
        cost_price: parsePrice(product.cost_price),
        sku: product.sku || product.variant_sku || `FEED-${Date.now()}-${i + idx}`,
        barcode: product.barcode || product.variant_barcode || null,
        category: product.category || product.product_type || product.type || 'Import Feed',
        brand: product.brand || product.vendor || '',
        image_url: product.image_url || product.image_src || '',
        images: product.images || null,
        stock_quantity: parseInt(product.stock_quantity || product.variant_inventory_qty) || 0,
        weight: parseFloat(product.weight || product.variant_grams) || null,
        weight_unit: product.weight_unit || product.variant_weight_unit || 'g',
        status: config.status || 'draft',
        review_status: 'pending',
        source_url: feedUrl,
        external_id: product.handle || product.external_id || product.sku,
        supplier_name: config.supplierName || extractSupplierFromUrl(feedUrl),
        import_job_id: jobId,
        tags: product.tags || null,
        options: product.options || null,
        variants: product.variants || null,
        seo_title: product.seo_title || null,
        seo_description: product.seo_description || null,
        metadata: {
          feed_url: feedUrl,
          format: detectedFormat,
          preset: preset,
          original_data: product
        }
      }))

      const { data, error } = await supabaseClient
        .from('imported_products')
        .insert(batch)
        .select('id')

      if (error) {
        errorCount += batch.length
        errors.push(`Lot ${Math.floor(i / batchSize) + 1}: ${error.message}`)
        console.error(`❌ Batch error:`, error.message)
      } else {
        successCount += data?.length || 0
      }

      // Update job progress
      if (jobId) {
        await supabaseClient
          .from('import_jobs')
          .update({
            processed_rows: Math.min(i + batchSize, products.length),
            success_rows: successCount,
            error_rows: errorCount
          })
          .eq('id', jobId)
      }
    }

    // Update job as completed
    if (jobId) {
      await supabaseClient
        .from('import_jobs')
        .update({
          status: errorCount === products.length ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          processed_rows: products.length,
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors.length > 0 ? errors : null
        })
        .eq('id', jobId)
    }

    // Log activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'feed_import',
      description: `Import Feed ${detectedFormat.toUpperCase()}: ${successCount} produits importés depuis ${extractDomainFromUrl(feedUrl)}`,
      entity_type: 'import',
      metadata: {
        source_type: `feed-${detectedFormat}`,
        source_url: feedUrl,
        success: successCount,
        errors: errorCount,
        job_id: jobId,
        preset: preset
      }
    })

    console.log(`✅ Import terminé: ${successCount} succès, ${errorCount} erreurs`)

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Import du flux ${detectedFormat.toUpperCase()} réussi`,
        data: {
          products_imported: successCount,
          total_processed: products.length,
          errors: errorCount,
          error_details: errors.slice(0, 10),
          job_id: jobId,
          format: detectedFormat
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Feed import error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Detect format from content and headers
function detectFormat(content: string, contentType: string): 'csv' | 'json' | 'xml' | 'unknown' {
  const trimmed = content.trim()
  
  // Check content-type header first
  if (contentType.includes('csv') || contentType.includes('text/plain')) {
    // Verify it looks like CSV
    if (hasCSVStructure(trimmed)) return 'csv'
  }
  if (contentType.includes('json')) return 'json'
  if (contentType.includes('xml')) return 'xml'
  
  // Content-based detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return 'xml'
  
  // Check for CSV structure (lines with commas/semicolons and similar column counts)
  if (hasCSVStructure(trimmed)) return 'csv'
  
  return 'unknown'
}

// Check if content has CSV structure
function hasCSVStructure(content: string): boolean {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return false
  
  const firstLine = lines[0]
  const delimiter = firstLine.includes(';') ? ';' : ','
  const firstCols = firstLine.split(delimiter).length
  
  // Check if at least 3 columns and first few lines have similar structure
  if (firstCols < 3) return false
  
  // Check header looks like Shopify CSV
  const lowerHeader = firstLine.toLowerCase()
  const shopifyIndicators = ['handle', 'title', 'variant', 'sku', 'price', 'image']
  const matchedIndicators = shopifyIndicators.filter(ind => lowerHeader.includes(ind))
  
  return matchedIndicators.length >= 2
}

// CSV Parser with Shopify support
function parseCSV(content: string, mapping: Record<string, string>, preset: string): any[] {
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  
  const delimiter = lines[0].includes(';') ? ';' : ','
  const headers = parseCSVLine(lines[0], delimiter)
  
  console.log(`📊 CSV Headers: ${headers.slice(0, 10).join(', ')}...`)
  
  // Apply preset mapping
  const effectiveMapping = { ...getPresetMapping(preset, headers), ...mapping }
  
  // Group variants by Handle (Shopify format)
  const productsByHandle = new Map<string, any>()
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)
    if (values.length < 3) continue
    
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || ''
    })
    
    const handle = row['Handle'] || row['handle'] || `product-${i}`
    
    // Check if this is a variant row (no title but same handle)
    const title = row['Title'] || row['title'] || row['Titre'] || ''
    const isVariantRow = !title && productsByHandle.has(handle)
    
    if (isVariantRow) {
      // Add as variant to existing product
      const existingProduct = productsByHandle.get(handle)!
      
      if (!existingProduct.variants) {
        existingProduct.variants = []
      }
      
      existingProduct.variants.push({
        sku: row['Variant SKU'] || row['variant_sku'] || '',
        price: row['Variant Price'] || row['variant_price'] || '',
        compare_at_price: row['Variant Compare At Price'] || '',
        barcode: row['Variant Barcode'] || '',
        option1: row['Option1 Value'] || '',
        option2: row['Option2 Value'] || '',
        option3: row['Option3 Value'] || '',
        inventory_qty: row['Variant Inventory Qty'] || '',
        weight: row['Variant Grams'] || ''
      })
      
      // Add additional images
      const imageSrc = row['Image Src'] || row['image_src'] || ''
      if (imageSrc && !existingProduct.images?.includes(imageSrc)) {
        existingProduct.images = existingProduct.images || []
        existingProduct.images.push(imageSrc)
      }
    } else {
      // Create new product
      const product = mapCSVRowToProduct(row, effectiveMapping)
      product.handle = handle
      
      // Initialize images array
      const imageSrc = row['Image Src'] || row['image_src'] || ''
      if (imageSrc) {
        product.images = [imageSrc]
        product.image_url = imageSrc
      }
      
      // Initialize first variant
      const variantSku = row['Variant SKU'] || row['variant_sku'] || ''
      if (variantSku) {
        product.variants = [{
          sku: variantSku,
          price: row['Variant Price'] || '',
          compare_at_price: row['Variant Compare At Price'] || '',
          barcode: row['Variant Barcode'] || '',
          option1: row['Option1 Value'] || '',
          option2: row['Option2 Value'] || '',
          option3: row['Option3 Value'] || '',
          inventory_qty: row['Variant Inventory Qty'] || '',
          weight: row['Variant Grams'] || ''
        }]
        
        // Set main product fields from first variant
        product.sku = variantSku
        product.barcode = row['Variant Barcode'] || ''
        product.price = row['Variant Price'] || ''
        product.stock_quantity = row['Variant Inventory Qty'] || '0'
      }
      
      // Options
      const option1Name = row['Option1 Name'] || ''
      const option2Name = row['Option2 Name'] || ''
      const option3Name = row['Option3 Name'] || ''
      if (option1Name) {
        product.options = [
          { name: option1Name, values: [row['Option1 Value']] },
          option2Name ? { name: option2Name, values: [row['Option2 Value']] } : null,
          option3Name ? { name: option3Name, values: [row['Option3 Value']] } : null
        ].filter(Boolean)
      }
      
      productsByHandle.set(handle, product)
    }
  }
  
  return Array.from(productsByHandle.values())
}

// Parse CSV line respecting quotes
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

// Map CSV row to product
function mapCSVRowToProduct(row: Record<string, string>, mapping: Record<string, string>): any {
  const product: any = {}
  
  // Apply mapping
  for (const [csvField, productField] of Object.entries(mapping)) {
    if (row[csvField]) {
      product[productField] = row[csvField]
    }
  }
  
  // Default field extraction
  product.name = product.name || row['Title'] || row['title'] || row['Titre'] || ''
  product.description = product.description || row['Body (HTML)'] || row['body_html'] || row['Description'] || ''
  product.vendor = product.vendor || row['Vendor'] || row['vendor'] || row['Marque'] || ''
  product.product_type = product.product_type || row['Product Category'] || row['Type'] || row['type'] || ''
  product.tags = product.tags || row['Tags'] || row['tags'] || ''
  product.seo_title = product.seo_title || row['SEO Title'] || ''
  product.seo_description = product.seo_description || row['SEO Description'] || ''
  
  return product
}

// Get preset mapping
function getPresetMapping(preset: string, headers: string[]): Record<string, string> {
  const shopifyMapping: Record<string, string> = {
    'Title': 'name',
    'Body (HTML)': 'description',
    'Vendor': 'vendor',
    'Product Category': 'category',
    'Type': 'product_type',
    'Tags': 'tags',
    'Variant SKU': 'sku',
    'Variant Price': 'price',
    'Variant Compare At Price': 'compare_at_price',
    'Variant Barcode': 'barcode',
    'Variant Grams': 'weight',
    'Variant Inventory Qty': 'stock_quantity',
    'Image Src': 'image_url',
    'SEO Title': 'seo_title',
    'SEO Description': 'seo_description'
  }
  
  const googleShoppingMapping: Record<string, string> = {
    'title': 'name',
    'description': 'description',
    'price': 'price',
    'brand': 'vendor',
    'gtin': 'barcode',
    'mpn': 'sku',
    'image_link': 'image_url',
    'product_type': 'category',
    'availability': 'status',
    'g:title': 'name',
    'g:description': 'description',
    'g:price': 'price',
    'g:brand': 'vendor',
    'g:image_link': 'image_url'
  }
  
  switch (preset) {
    case 'shopify':
      return shopifyMapping
    case 'google':
      return googleShoppingMapping
    case 'matterhorn':
      return { ...shopifyMapping } // Matterhorn uses Shopify format
    case 'auto':
    default:
      // Auto-detect based on headers
      const hasShopifyHeaders = headers.some(h => 
        ['Handle', 'Title', 'Variant SKU', 'Variant Price'].includes(h)
      )
      return hasShopifyHeaders ? shopifyMapping : {}
  }
}

// JSON Parser
function parseJSON(content: string, mapping: Record<string, string>): any[] {
  try {
    const data = JSON.parse(content)
    
    let items = Array.isArray(data) ? data : null
    
    if (!items) {
      const paths = ['products', 'items', 'data', 'results', 'catalog', 'entries']
      for (const path of paths) {
        if (data[path] && Array.isArray(data[path])) {
          items = data[path]
          break
        }
      }
    }
    
    if (!items) items = [data]
    
    return items.map(item => ({
      name: item.name || item.title || '',
      description: item.description || item.body || '',
      price: item.price || item.sale_price || '',
      sku: item.sku || item.id || '',
      category: item.category || item.product_type || '',
      brand: item.brand || item.vendor || '',
      image_url: item.image_url || item.image || (item.images?.[0]) || '',
      stock_quantity: item.stock || item.quantity || 0,
      barcode: item.barcode || item.gtin || item.ean || '',
      ...item
    })).filter(p => p.name || p.sku)
  } catch (e) {
    console.error('JSON parse error:', e)
    return []
  }
}

// XML Parser
function parseXML(content: string, mapping: Record<string, string>): any[] {
  const products: any[] = []
  
  const patterns = [
    /<product[^>]*>([\s\S]*?)<\/product>/gi,
    /<item[^>]*>([\s\S]*?)<\/item>/gi,
    /<entry[^>]*>([\s\S]*?)<\/entry>/gi,
    /<offer[^>]*>([\s\S]*?)<\/offer>/gi,
  ]
  
  let matches: string[] = []
  
  for (const pattern of patterns) {
    const found = content.match(pattern)
    if (found && found.length > 0) {
      matches = found
      break
    }
  }
  
  for (const match of matches) {
    const product: any = {}
    
    const fields = [
      ['name', ['name', 'title', 'nom', 'titre']],
      ['description', ['description', 'desc', 'body']],
      ['price', ['price', 'prix', 'sale_price']],
      ['sku', ['sku', 'reference', 'id', 'mpn']],
      ['category', ['category', 'categorie', 'product_type']],
      ['brand', ['brand', 'marque', 'vendor']],
      ['image_url', ['image', 'image_url', 'picture', 'image_link']],
      ['stock_quantity', ['stock', 'quantity', 'qty']],
      ['barcode', ['gtin', 'ean', 'upc', 'barcode']]
    ]
    
    for (const [destField, srcFields] of fields) {
      for (const srcField of srcFields as string[]) {
        const value = extractXMLValue(match, srcField)
        if (value) {
          product[destField as string] = value
          break
        }
      }
    }
    
    if (product.name || product.sku) {
      products.push(product)
    }
  }
  
  return products
}

function extractXMLValue(xml: string, tag: string): string | null {
  const patterns = [
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

// Parse price (handle international formats)
function parsePrice(value: any): number | null {
  if (!value) return null
  const str = String(value)
    .replace(/[€$£¥]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Clean HTML
function cleanHTML(html: string): string {
  if (!html) return ''
  return html
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

// Extract supplier name from URL
function extractSupplierFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    const parts = domain.replace('www.', '').split('.')
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  } catch {
    return 'Feed Import'
  }
}

// Extract domain from URL
function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.substring(0, 50)
  }
}
