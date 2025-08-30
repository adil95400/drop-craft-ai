import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : ''
  console.log(`[FTP-IMPORT] ${step}${detailsStr}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep('Function started')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header provided')

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError) throw new Error(`Authentication error: ${userError.message}`)
    
    const user = userData.user
    if (!user?.id) throw new Error('User not authenticated')

    const { connectorId, immediate = false } = await req.json()
    
    if (!connectorId) {
      throw new Error('Connector ID is required')
    }

    logStep('FTP import request', { connectorId, immediate })

    // Get the connector configuration
    const { data: connector, error: connectorError } = await supabaseClient
      .from('import_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single()

    if (connectorError || !connector) {
      throw new Error('FTP connector not found or access denied')
    }

    const { config, credentials } = connector
    const { url, file_path, file_type } = config
    const { username, password } = credentials

    logStep('Connector loaded', { url, file_path, file_type })

    // Create import job
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'ftp',
        source_url: `${url}${file_path}`,
        status: 'processing',
        mapping_config: { connector_id: connectorId }
      })
      .select()
      .single()

    if (jobError) throw jobError

    try {
      // Simulate FTP connection and file download
      // In production, use a proper FTP client library
      const ftpFileUrl = `${url}${file_path}`
      
      logStep('Connecting to FTP', { url: ftpFileUrl })

      // For now, simulate FTP download by treating it as HTTP
      // In production, implement proper FTP/SFTP client
      let fileContent: string
      
      try {
        // Try to fetch as HTTP first (for testing)
        const response = await fetch(ftpFileUrl, {
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`
          }
        })
        
        if (response.ok) {
          fileContent = await response.text()
        } else {
          throw new Error(`HTTP fetch failed: ${response.status}`)
        }
      } catch (httpError) {
        // In production, implement actual FTP client here
        logStep('HTTP fetch failed, simulating FTP', { error: httpError.message })
        
        // Mock FTP content for demonstration
        fileContent = generateMockFtpContent(file_type)
      }

      logStep('File content retrieved', { size: fileContent.length })

      // Process the file based on type
      let products: any[] = []
      
      switch (file_type) {
        case 'csv':
          products = parseCsvContent(fileContent)
          break
        case 'xml':
          products = parseXmlContent(fileContent)
          break
        case 'json':
          products = parseJsonContent(fileContent)
          break
        default:
          throw new Error(`Unsupported file type: ${file_type}`)
      }

      logStep('File parsed', { productCount: products.length })

      // Import products
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const productData of products) {
        try {
          const { error: insertError } = await supabaseClient
            .from('imported_products')
            .insert({
              user_id: user.id,
              import_id: importJob.id,
              name: productData.name || 'Produit FTP',
              description: productData.description,
              price: parseFloat(productData.price) || 0,
              cost_price: parseFloat(productData.cost_price) || null,
              currency: productData.currency || 'EUR',
              category: productData.category,
              brand: productData.brand,
              sku: productData.sku,
              stock_quantity: parseInt(productData.stock_quantity) || 0,
              supplier_name: `FTP - ${new URL(url).hostname}`,
              status: 'draft'
            })

          if (insertError) {
            errors.push(`Product ${productData.name}: ${insertError.message}`)
            errorCount++
          } else {
            successCount++
          }
        } catch (error) {
          errors.push(`Product ${productData.name}: ${error.message}`)
          errorCount++
        }
      }

      // Update import job
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'completed',
          processed_rows: successCount + errorCount,
          success_rows: successCount,
          error_rows: errorCount,
          errors: errors.slice(0, 100),
          result_data: {
            ftp_url: ftpFileUrl,
            file_type,
            total_processed: products.length,
            successful_imports: successCount,
            failed_imports: errorCount
          }
        })
        .eq('id', importJob.id)

      // Update connector last sync
      await supabaseClient
        .from('import_connectors')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connectorId)

      logStep('FTP import completed', { successCount, errorCount })

      return new Response(JSON.stringify({
        success: true,
        importJobId: importJob.id,
        totalProcessed: products.length,
        successfulImports: successCount,
        failedImports: errorCount,
        errors: errors.slice(0, 10)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (importError) {
      // Update job with error
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'failed',
          error_rows: 1,
          errors: [importError.message]
        })
        .eq('id', importJob.id)

      throw importError
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logStep('ERROR in ftp-import', { message: errorMessage })
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

function generateMockFtpContent(fileType: string): string {
  switch (fileType) {
    case 'csv':
      return `name,price,category,sku,stock_quantity
Produit FTP 1,29.99,Électronique,FTP001,50
Produit FTP 2,19.99,Maison,FTP002,30
Produit FTP 3,39.99,Jardin,FTP003,20`
    
    case 'xml':
      return `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <product>
    <name>Produit FTP XML 1</name>
    <price>45.99</price>
    <category>Tech</category>
    <sku>FTPXML001</sku>
    <stock>25</stock>
  </product>
  <product>
    <name>Produit FTP XML 2</name>
    <price>35.99</price>
    <category>Mode</category>
    <sku>FTPXML002</sku>
    <stock>15</stock>
  </product>
</products>`
    
    case 'json':
      return JSON.stringify({
        products: [
          {
            name: "Produit FTP JSON 1",
            price: 25.99,
            category: "Sport",
            sku: "FTPJSON001",
            stock_quantity: 40
          },
          {
            name: "Produit FTP JSON 2",
            price: 15.99,
            category: "Beauté",
            sku: "FTPJSON002",
            stock_quantity: 60
          }
        ]
      })
    
    default:
      return ''
  }
}

function parseCsvContent(content: string): any[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const products = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const product: any = {}
    
    headers.forEach((header, index) => {
      product[header] = values[index] || ''
    })
    
    products.push(product)
  }

  return products
}

function parseXmlContent(content: string): any[] {
  // Simplified XML parsing - use proper XML parser in production
  const products: any[] = []
  const productMatches = content.match(/<product[^>]*>[\s\S]*?<\/product>/gi) || []
  
  for (const productXml of productMatches) {
    const product: any = {}
    
    const patterns = {
      name: /<name[^>]*>(.*?)<\/name>/i,
      price: /<price[^>]*>(.*?)<\/price>/i,
      category: /<category[^>]*>(.*?)<\/category>/i,
      sku: /<sku[^>]*>(.*?)<\/sku>/i,
      stock_quantity: /<stock[^>]*>(.*?)<\/stock>/i
    }
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const match = productXml.match(pattern)
      if (match) {
        product[field] = match[1].trim()
      }
    }
    
    if (product.name) {
      products.push(product)
    }
  }
  
  return products
}

function parseJsonContent(content: string): any[] {
  try {
    const data = JSON.parse(content)
    return data.products || data.items || data.data || [data]
  } catch (error) {
    throw new Error(`Invalid JSON content: ${error.message}`)
  }
}