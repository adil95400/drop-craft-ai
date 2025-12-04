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
      throw new Error('Unauthorized')
    }

    const { connectorId, ftpConfig } = await req.json()

    console.log('📂 Starting FTP import for connector:', connectorId)

    // Get connector details with credentials
    const { data: connector, error: connectorError } = await supabaseClient
      .from('import_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single()

    if (connectorError || !connector) {
      throw new Error('Connector not found or access denied')
    }

    // Get FTP configuration from connector or request
    const config = ftpConfig || connector.config || {}
    const ftpUrl = config.url || config.host
    const ftpUser = config.username || config.user
    const ftpPassword = config.password
    const ftpPath = config.path || config.file_path || '/'
    const ftpPort = config.port || 21

    if (!ftpUrl) {
      throw new Error('FTP URL/Host is required')
    }

    console.log('🔌 Connecting to FTP:', { host: ftpUrl, port: ftpPort, path: ftpPath })

    // Build FTP URL for fetch (works with some FTP servers)
    // For proper FTP support, we use HTTP-to-FTP proxy or direct file URL
    let fileContent = ''
    let fetchSuccess = false

    // Try different methods to fetch FTP content
    const fetchMethods = [
      // Method 1: Direct FTP URL (some browsers/runtimes support this)
      async () => {
        const ftpFullUrl = `ftp://${ftpUser}:${ftpPassword}@${ftpUrl}:${ftpPort}${ftpPath}`
        const response = await fetch(ftpFullUrl)
        if (response.ok) {
          return await response.text()
        }
        throw new Error('FTP fetch failed')
      },
      // Method 2: HTTP URL if it's actually an HTTP endpoint
      async () => {
        if (ftpUrl.startsWith('http')) {
          const response = await fetch(ftpUrl, {
            headers: ftpUser ? {
              'Authorization': 'Basic ' + btoa(`${ftpUser}:${ftpPassword}`)
            } : {}
          })
          if (response.ok) {
            return await response.text()
          }
        }
        throw new Error('HTTP fetch failed')
      },
      // Method 3: Use stored file URL from connector
      async () => {
        if (connector.config?.file_url) {
          const response = await fetch(connector.config.file_url)
          if (response.ok) {
            return await response.text()
          }
        }
        throw new Error('File URL fetch failed')
      }
    ]

    for (const method of fetchMethods) {
      try {
        fileContent = await method()
        fetchSuccess = true
        console.log('✅ Successfully fetched FTP content, size:', fileContent.length)
        break
      } catch (e) {
        console.log('⚠️ Fetch method failed, trying next...')
      }
    }

    if (!fetchSuccess || !fileContent) {
      // Log the connection attempt for debugging
      await supabaseClient.from('activity_logs').insert({
        user_id: user.id,
        action: 'ftp_import_failed',
        description: `FTP connection failed: ${ftpUrl}`,
        entity_type: 'import',
        metadata: { connector_id: connectorId, host: ftpUrl, port: ftpPort }
      })
      
      throw new Error(`Unable to connect to FTP server: ${ftpUrl}. Please verify credentials and ensure the server is accessible.`)
    }

    // Detect file type and parse content
    const fileName = ftpPath.toLowerCase()
    let products: any[] = []

    if (fileName.endsWith('.csv') || fileContent.includes(',') || fileContent.includes(';')) {
      // Parse CSV
      products = parseCSV(fileContent)
    } else if (fileName.endsWith('.xml') || fileContent.trim().startsWith('<')) {
      // Parse XML
      products = parseXML(fileContent)
    } else if (fileName.endsWith('.json') || fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[')) {
      // Parse JSON
      products = parseJSON(fileContent)
    } else {
      // Try auto-detection
      if (fileContent.trim().startsWith('<')) {
        products = parseXML(fileContent)
      } else if (fileContent.trim().startsWith('{') || fileContent.trim().startsWith('[')) {
        products = parseJSON(fileContent)
      } else {
        products = parseCSV(fileContent)
      }
    }

    console.log(`📦 Parsed ${products.length} products from FTP file`)

    // Insert products
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    const batchSize = 100

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize).map(product => ({
        user_id: user.id,
        name: product.name || product.title || `Produit FTP ${i}`,
        description: product.description || '',
        price: parseFloat(product.price || product.sale_price || '0') || 0,
        cost_price: parseFloat(product.cost_price || product.cost || '0') || null,
        sku: product.sku || product.id || `FTP-${connectorId.substring(0, 8)}-${i}`,
        category: product.category || '',
        brand: product.brand || '',
        image_url: product.image_url || product.image || '',
        stock_quantity: parseInt(product.stock_quantity || product.quantity || '0') || 0,
        status: 'draft',
        review_status: 'pending',
        source_url: ftpUrl,
        external_id: product.external_id || product.id || product.sku,
        supplier_name: connector.name || 'FTP Import'
      }))

      const { data, error } = await supabaseClient
        .from('imported_products')
        .insert(batch)
        .select('id')

      if (error) {
        errorCount += batch.length
        errors.push(`Batch ${i}: ${error.message}`)
      } else {
        successCount += data?.length || 0
      }
    }

    console.log('✅ FTP import completed:', { successCount, errorCount })

    // Update connector last sync
    await supabaseClient
      .from('import_connectors')
      .update({ 
        last_sync_at: new Date().toISOString(),
        sync_status: errorCount === 0 ? 'success' : 'partial'
      })
      .eq('id', connectorId)

    // Log activity
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'ftp_import_completed',
      description: `Import FTP: ${successCount} produits importés depuis ${connector.name}`,
      entity_type: 'import',
      metadata: { 
        connector_id: connectorId, 
        success: successCount, 
        errors: errorCount,
        host: ftpUrl
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Import FTP réussi',
        data: {
          products_imported: successCount,
          total_processed: products.length,
          errors: errorCount,
          connector_id: connectorId,
          error_details: errors.slice(0, 10)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ FTP import error:', error)
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

// CSV Parser
function parseCSV(content: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Detect delimiter
  const firstLine = lines[0]
  const delimiter = [',', ';', '\t', '|'].reduce((best, del) => 
    (firstLine.split(del).length > firstLine.split(best).length) ? del : best
  , ',')

  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''))
    const product: any = {}
    
    headers.forEach((header, i) => {
      const key = mapHeader(header)
      product[key] = values[i] || ''
    })
    
    return product
  }).filter(p => p.name || p.title || p.sku)
}

// XML Parser
function parseXML(content: string): any[] {
  const products: any[] = []
  
  // Match product or item elements
  const productMatches = content.match(/<(?:product|item|article|entry)[^>]*>[\s\S]*?<\/(?:product|item|article|entry)>/gi) || []
  
  for (const match of productMatches) {
    const product: any = {}
    
    // Extract common fields
    const fieldMappings = [
      { patterns: ['name', 'title', 'nom', 'titre'], key: 'name' },
      { patterns: ['description', 'desc', 'body'], key: 'description' },
      { patterns: ['price', 'prix', 'sale_price'], key: 'price' },
      { patterns: ['cost', 'cost_price', 'cout'], key: 'cost_price' },
      { patterns: ['sku', 'reference', 'ref', 'id'], key: 'sku' },
      { patterns: ['category', 'categorie', 'cat'], key: 'category' },
      { patterns: ['brand', 'marque', 'manufacturer'], key: 'brand' },
      { patterns: ['image', 'image_url', 'picture', 'photo'], key: 'image_url' },
      { patterns: ['stock', 'quantity', 'stock_quantity', 'qty'], key: 'stock_quantity' },
    ]
    
    for (const mapping of fieldMappings) {
      for (const pattern of mapping.patterns) {
        const regex = new RegExp(`<${pattern}[^>]*>([\\s\\S]*?)<\\/${pattern}>`, 'i')
        const m = match.match(regex)
        if (m) {
          product[mapping.key] = m[1].trim().replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
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

// JSON Parser
function parseJSON(content: string): any[] {
  try {
    const data = JSON.parse(content)
    const items = Array.isArray(data) ? data : 
                  data.products || data.items || data.data || 
                  data.articles || data.entries || [data]
    
    return items.map((item: any) => ({
      name: item.name || item.title || item.nom,
      description: item.description || item.desc || '',
      price: item.price || item.prix || item.sale_price,
      cost_price: item.cost_price || item.cost || item.cout,
      sku: item.sku || item.reference || item.ref || item.id,
      category: item.category || item.categorie,
      brand: item.brand || item.marque,
      image_url: item.image_url || item.image || item.picture,
      stock_quantity: item.stock_quantity || item.stock || item.quantity,
      external_id: item.id || item.external_id
    })).filter((p: any) => p.name || p.sku)
  } catch (e) {
    console.error('JSON parse error:', e)
    return []
  }
}

// Map CSV headers to product fields
function mapHeader(header: string): string {
  const mappings: Record<string, string> = {
    'nom': 'name',
    'titre': 'name',
    'title': 'name',
    'product_name': 'name',
    'prix': 'price',
    'sale_price': 'price',
    'cout': 'cost_price',
    'cost': 'cost_price',
    'reference': 'sku',
    'ref': 'sku',
    'categorie': 'category',
    'cat': 'category',
    'marque': 'brand',
    'manufacturer': 'brand',
    'image': 'image_url',
    'picture': 'image_url',
    'photo': 'image_url',
    'stock': 'stock_quantity',
    'quantity': 'stock_quantity',
    'qty': 'stock_quantity',
    'quantite': 'stock_quantity',
  }
  
  return mappings[header] || header
}
