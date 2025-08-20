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
      throw new Error('Invalid authorization')
    }

    const { source, data }: ImportRequest = await req.json()
    
    console.log(`Starting ${source} import for user ${user.id}`)

    // Create import job record
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: source,
        status: 'processing',
        file_data: data,
        mapping_config: data.mapping || {}
      })
      .select()
      .single()

    if (jobError) throw jobError

    let importedProducts: any[] = []

    // Process based on source type
    switch (source) {
      case 'url':
        importedProducts = await importFromURL(data.url!, data.config)
        break
      case 'csv':
        importedProducts = await importFromCSV(data.csvData!, data.mapping!)
        break
      case 'supplier':
        importedProducts = await importFromSupplier(data.supplier!, data.config)
        break
      default:
        throw new Error(`Unsupported import source: ${source}`)
    }

    // Save imported products
    if (importedProducts.length > 0) {
      const productsToInsert = importedProducts.map(product => ({
        user_id: user.id,
        import_id: importJob.id,
        name: product.name || 'Produit sans nom',
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        cost_price: parseFloat(product.cost_price) || (parseFloat(product.price) * 0.7),
        currency: product.currency || 'EUR',
        sku: product.sku || `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category: product.category || 'Divers',
        supplier_name: product.supplier_name || (source === 'supplier' ? data.supplier : 'Import'),
        supplier_url: product.supplier_url || data.url,
        image_urls: Array.isArray(product.images) ? product.images : product.images ? [product.images] : [],
        tags: product.tags || [`${source}-import`],
        status: 'draft',
        review_status: 'pending',
        ai_optimized: product.ai_optimized || false,
        import_quality_score: calculateQualityScore(product),
        data_completeness_score: calculateCompletenessScore(product)
      }))

      const { error: insertError } = await supabase
        .from('imported_products')
        .insert(productsToInsert)

      if (insertError) throw insertError
    }

    // Update import job
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        total_rows: importedProducts.length,
        success_rows: importedProducts.length,
        error_rows: 0,
        processed_rows: importedProducts.length,
        result_data: {
          products_imported: importedProducts.length,
          completed_at: new Date().toISOString()
        }
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
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function importFromURL(url: string, config: any = {}): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const content = await response.text()
    
    // Try to extract product data from the page
    const products = []
    
    // Look for JSON-LD structured data
    const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
          const data = JSON.parse(jsonContent)
          
          if (data['@type'] === 'Product') {
            products.push({
              name: data.name,
              description: data.description,
              price: data.offers?.price || 0,
              currency: data.offers?.priceCurrency || 'EUR',
              images: Array.isArray(data.image) ? data.image : [data.image].filter(Boolean),
              category: data.category || 'Divers',
              sku: data.sku || data.productID,
              supplier_url: url,
              supplier_name: new URL(url).hostname.replace('www.', '')
            })
          }
        } catch (e) {
          console.error('Error parsing JSON-LD:', e)
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

    return products
  } catch (error) {
    console.error('URL import error:', error)
    return []
  }
}

async function importFromCSV(csvData: any[], mapping: Record<string, string>): Promise<any[]> {
  return csvData.map((row, index) => ({
    name: row[mapping.name] || `Produit ${index + 1}`,
    description: row[mapping.description] || '',
    price: parseFloat(row[mapping.price]) || 0,
    cost_price: parseFloat(row[mapping.cost_price]) || 0,
    currency: row[mapping.currency] || 'EUR',
    sku: row[mapping.sku] || `CSV-${Date.now()}-${index}`,
    category: row[mapping.category] || 'Divers',
    images: row[mapping.images] ? [row[mapping.images]] : [],
    supplier_name: 'Import CSV'
  }))
}

async function importFromSupplier(supplier: string, config: any = {}): Promise<any[]> {
  // Mock supplier data - in real implementation, this would call actual supplier APIs
  const mockProducts = [
    {
      name: `Produit ${supplier} 1`,
      description: 'Description du produit importé depuis le fournisseur',
      price: 29.99,
      cost_price: 19.99,
      currency: 'EUR',
      category: 'Électronique',
      images: ['https://example.com/image1.jpg'],
      supplier_name: supplier,
      sku: `${supplier.toUpperCase()}-001`
    },
    {
      name: `Produit ${supplier} 2`,
      description: 'Autre produit du fournisseur',
      price: 49.99,
      cost_price: 34.99,
      currency: 'EUR',
      category: 'Accessoires',
      images: ['https://example.com/image2.jpg'],
      supplier_name: supplier,
      sku: `${supplier.toUpperCase()}-002`
    }
  ]

  return mockProducts
}

function calculateQualityScore(product: any): number {
  let score = 0
  
  if (product.name && product.name.length > 10) score += 25
  if (product.description && product.description.length > 50) score += 25
  if (product.price && product.price > 0) score += 20
  if (product.images && product.images.length > 0) score += 20
  if (product.category && product.category !== 'Divers') score += 10
  
  return Math.min(100, score)
}

function calculateCompletenessScore(product: any): number {
  const fields = ['name', 'description', 'price', 'images', 'category', 'sku']
  let filledFields = 0
  
  fields.forEach(field => {
    if (product[field] && 
        (typeof product[field] === 'string' ? product[field].trim() : true) &&
        (Array.isArray(product[field]) ? product[field].length > 0 : true)) {
      filledFields++
    }
  })
  
  return Math.round((filledFields / fields.length) * 100)
}