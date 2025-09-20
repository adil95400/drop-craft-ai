import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface APIConfig {
  url: string
  method: 'GET' | 'POST'
  headers: Record<string, string>
  body?: string
  authentication: {
    type: 'none' | 'bearer' | 'api_key' | 'basic'
    token?: string
    username?: string
    password?: string
    api_key_header?: string
    api_key_value?: string
  }
  pagination: {
    enabled: boolean
    type: 'offset' | 'cursor' | 'page'
    page_param?: string
    size_param?: string
    max_pages?: number
  }
  data_path: string
  field_mapping: Record<string, string>
}

function evaluateJSONPath(obj: any, path: string): any {
  if (path === '$') return obj
  
  const parts = path.replace(/^\$\.?/, '').split('.')
  let current = obj
  
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = current[part]
    } else {
      return null
    }
  }
  
  return current
}

function buildHeaders(config: APIConfig): Record<string, string> {
  const headers = { ...config.headers }
  
  switch (config.authentication.type) {
    case 'bearer':
      if (config.authentication.token) {
        headers['Authorization'] = `Bearer ${config.authentication.token}`
      }
      break
    case 'api_key':
      if (config.authentication.api_key_header && config.authentication.api_key_value) {
        headers[config.authentication.api_key_header] = config.authentication.api_key_value
      }
      break
    case 'basic':
      if (config.authentication.username && config.authentication.password) {
        const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`)
        headers['Authorization'] = `Basic ${credentials}`
      }
      break
  }
  
  return headers
}

function mapProduct(apiProduct: any, mapping: Record<string, string>): any {
  const product: any = {}
  
  for (const [apiField, productField] of Object.entries(mapping)) {
    if (productField && apiProduct.hasOwnProperty(apiField)) {
      product[productField] = apiProduct[apiField]
    }
  }
  
  // Ensure required fields have defaults
  if (!product.name && apiProduct.title) product.name = apiProduct.title
  if (!product.name && apiProduct.product_name) product.name = apiProduct.product_name
  if (!product.price && apiProduct.cost) product.price = apiProduct.cost
  if (!product.sku && apiProduct.id) product.sku = String(apiProduct.id)
  
  return product
}

async function fetchAllPages(config: APIConfig): Promise<any[]> {
  const allProducts: any[] = []
  const headers = buildHeaders(config)
  let currentPage = 1
  const maxPages = config.pagination.max_pages || 5
  
  if (!config.pagination.enabled) {
    // Single request
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    }
    
    if (config.method === 'POST' && config.body) {
      requestOptions.body = config.body
    }
    
    const response = await fetch(config.url, requestOptions)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const products = evaluateJSONPath(data, config.data_path)
    return Array.isArray(products) ? products : [products]
  }
  
  // Paginated requests
  while (currentPage <= maxPages) {
    const url = new URL(config.url)
    
    if (config.pagination.page_param) {
      url.searchParams.set(config.pagination.page_param, currentPage.toString())
    }
    if (config.pagination.size_param) {
      url.searchParams.set(config.pagination.size_param, '100') // Default page size
    }
    
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    }
    
    if (config.method === 'POST' && config.body) {
      // Modify body to include pagination params
      try {
        const bodyObj = JSON.parse(config.body)
        if (config.pagination.page_param) {
          bodyObj[config.pagination.page_param] = currentPage
        }
        if (config.pagination.size_param) {
          bodyObj[config.pagination.size_param] = 100
        }
        requestOptions.body = JSON.stringify(bodyObj)
      } catch {
        requestOptions.body = config.body
      }
    }
    
    console.log(`Fetching page ${currentPage}: ${url.toString()}`)
    
    const response = await fetch(url.toString(), requestOptions)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const products = evaluateJSONPath(data, config.data_path)
    
    if (!products || (Array.isArray(products) && products.length === 0)) {
      console.log(`No more products found on page ${currentPage}`)
      break
    }
    
    const pageProducts = Array.isArray(products) ? products : [products]
    allProducts.push(...pageProducts)
    
    console.log(`Page ${currentPage}: Found ${pageProducts.length} products`)
    
    // If we got less than expected, we might be at the end
    if (pageProducts.length < 100) {
      break
    }
    
    currentPage++
  }
  
  return allProducts
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { config }: { config: APIConfig } = await req.json()
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    console.log(`Starting API import for user ${user.id}`)

    // Fetch all products from API
    const apiProducts = await fetchAllPages(config)
    console.log(`Total products fetched: ${apiProducts.length}`)

    if (apiProducts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          message: 'No products found to import'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Map and prepare products for insertion
    const productsToInsert = apiProducts.map((apiProduct, index) => {
      const mappedProduct = mapProduct(apiProduct, config.field_mapping)
      
      return {
        user_id: user.id,
        external_id: mappedProduct.sku || `api_${Date.now()}_${index}`,
        name: mappedProduct.name || 'Produit sans nom',
        description: mappedProduct.description || '',
        price: parseFloat(mappedProduct.price) || 0,
        sku: mappedProduct.sku || '',
        category: mappedProduct.category || 'API Import',
        brand: mappedProduct.brand || '',
        stock_quantity: parseInt(mappedProduct.stock_quantity) || 0,
        image_url: mappedProduct.image_url || '',
        weight: mappedProduct.weight ? parseFloat(mappedProduct.weight) : null,
        status: 'pending',
        source: 'api_import',
        ai_optimized: false,
        quality_score: 0.5,
        source_data: apiProduct // Store original data for reference
      }
    }).filter(product => product.name && product.name !== 'Produit sans nom') // Filter out invalid products

    console.log(`Prepared ${productsToInsert.length} products for insertion`)

    // Insert products in batches
    const batchSize = 100
    let totalInserted = 0
    
    for (let i = 0; i < productsToInsert.length; i += batchSize) {
      const batch = productsToInsert.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('imported_products')
        .insert(batch)
        .select('id')
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
        // Continue with next batch instead of failing completely
      } else {
        totalInserted += batch.length
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} products`)
      }
    }

    // Log the import activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'api_import',
        description: `API import completed: ${totalInserted} products imported`,
        metadata: {
          source_url: config.url,
          total_fetched: apiProducts.length,
          total_inserted: totalInserted,
          field_mapping: config.field_mapping
        }
      })

    console.log(`API import completed: ${totalInserted} products inserted`)

    return new Response(
      JSON.stringify({
        success: true,
        imported: totalInserted,
        total_fetched: apiProducts.length,
        message: `Successfully imported ${totalInserted} products`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('API import error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})