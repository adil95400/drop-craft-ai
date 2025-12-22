import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRequest {
  source: 'url' | 'csv' | 'supplier'
  data: {
    url?: string
    csvData?: any[]
    supplier?: string
    mapping?: Record<string, string>
    config?: Record<string, any>
  }
}

serve(async (req) => {
  console.log('Import products function called')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Invalid authorization')
    }

    const { source, data }: ImportRequest = await req.json()
    
    console.log(`Starting ${source} import for user ${user.id}`)

    // Create import job record
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_platform: source,
        job_type: 'import',
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      throw new Error(`Failed to create import job: ${jobError.message}`)
    }

    let importedProducts: any[] = []

    // Process based on source type with timeout protection
    const timeoutMs = 25000 // 25 seconds to stay under edge function limits
    
    try {
      const importPromise = (async () => {
        switch (source) {
          case 'url':
            return await importFromURL(data.url!, data.config)
          case 'csv':
            return await importFromCSV(data.csvData!, data.mapping!)
          case 'supplier':
            return await importFromSupplier(data.supplier!, data.config)
          default:
            throw new Error(`Unsupported import source: ${source}`)
        }
      })()

      importedProducts = await Promise.race([
        importPromise,
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Import timeout')), timeoutMs)
        )
      ])
    } catch (error) {
      console.error('Import processing error:', error)
      
      // Update job as failed
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_log: [error.message],
          completed_at: new Date().toISOString()
        })
        .eq('id', importJob.id)
      
      throw error
    }

    // Save imported products to products table
    if (importedProducts.length > 0) {
      const productsToInsert = importedProducts.map(product => ({
        user_id: user.id,
        title: (product.name || 'Produit sans nom').substring(0, 500),
        description: (product.description || '').substring(0, 5000),
        price: Math.min(parseFloat(product.price) || 0, 999999.99),
        cost_price: Math.min(parseFloat(product.cost_price) || (parseFloat(product.price) * 0.7), 999999.99),
        sku: (product.sku || `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`).substring(0, 100),
        category: (product.category || 'Divers').substring(0, 100),
        supplier: product.supplier_name || (source === 'supplier' ? data.supplier : 'Import'),
        image_url: Array.isArray(product.images) ? product.images[0] : product.images || null,
        images: Array.isArray(product.images) ? product.images.slice(0, 10) : [],
        tags: product.tags || [`${source}-import`],
        status: 'draft',
      }))

      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert)

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(`Failed to save products: ${insertError.message}`)
      }
    }

    // Update import job as completed
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        total_products: importedProducts.length,
        successful_imports: importedProducts.length,
        failed_imports: 0,
        completed_at: new Date().toISOString()
      })
      .eq('id', importJob.id)

    console.log(`Import completed: ${importedProducts.length} products imported`)

    return new Response(JSON.stringify({
      success: true,
      import_id: importJob.id,
      products_imported: importedProducts.length,
      message: `${importedProducts.length} produits importés avec succès`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function importFromURL(url: string, config: any = {}): Promise<any[]> {
  try {
    console.log(`Fetching URL: ${url}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for fetch
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const content = await response.text()
    const products: any[] = []
    
    // Look for JSON-LD structured data
    const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches.slice(0, 5)) { // Limit to 5 matches
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
          const data = JSON.parse(jsonContent)
          
          if (data['@type'] === 'Product') {
            products.push({
              name: data.name,
              description: data.description?.substring(0, 2000),
              price: data.offers?.price || 0,
              currency: data.offers?.priceCurrency || 'EUR',
              images: Array.isArray(data.image) ? data.image.slice(0, 5) : [data.image].filter(Boolean),
              category: data.category || 'Divers',
              sku: data.sku || data.productID,
              supplier_url: url,
              supplier_name: new URL(url).hostname.replace('www.', '')
            })
          }
        } catch (e) {
          console.warn('Error parsing JSON-LD:', e)
        }
      }
    }

    // If no structured data, create basic product from page
    if (products.length === 0) {
      const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : 'Produit importé'
      
      const priceMatches = content.match(/[\$€£¥]\s*\d+(?:[.,]\d{2})?/g)
      const price = priceMatches ? parseFloat(priceMatches[0].replace(/[^\d.,]/g, '').replace(',', '.')) : 0
      
      products.push({
        name: title.substring(0, 200),
        description: `Produit importé depuis ${url}`,
        price,
        currency: 'EUR',
        images: [],
        category: 'Divers',
        supplier_url: url,
        supplier_name: new URL(url).hostname.replace('www.', '')
      })
    }

    console.log(`Extracted ${products.length} products from URL`)
    return products
    
  } catch (error) {
    console.error('URL import error:', error)
    return []
  }
}

async function importFromCSV(csvData: any[], mapping: Record<string, string>): Promise<any[]> {
  if (!csvData || !Array.isArray(csvData)) {
    return []
  }
  
  return csvData.slice(0, 1000).map((row, index) => ({ // Limit to 1000 products
    name: row[mapping?.name] || `Produit ${index + 1}`,
    description: row[mapping?.description] || '',
    price: parseFloat(row[mapping?.price]) || 0,
    cost_price: parseFloat(row[mapping?.cost_price]) || 0,
    currency: row[mapping?.currency] || 'EUR',
    sku: row[mapping?.sku] || `CSV-${Date.now()}-${index}`,
    category: row[mapping?.category] || 'Divers',
    images: row[mapping?.images] ? [row[mapping?.images]] : [],
    supplier_name: 'Import CSV'
  }))
}

async function importFromSupplier(supplier: string, config: any = {}): Promise<any[]> {
  console.log(`Importing from supplier: ${supplier}`)
  
  // This would be replaced with actual supplier API calls
  // For now, return empty array to indicate no mock data
  return []
}
