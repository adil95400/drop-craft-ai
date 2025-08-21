import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface URLImportRequest {
  url: string
  userId: string
  options?: {
    extract_images?: boolean
    analyze_content?: boolean
    auto_categorize?: boolean
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId, options = {} }: URLImportRequest = await req.json();
    
    // Validate inputs
    if (!url || !userId) {
      return new Response(JSON.stringify({ 
        error: 'URL et ID utilisateur requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration')
      return new Response(JSON.stringify({ 
        error: 'Configuration serveur manquante',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    console.log(`Processing URL import: ${url} for user ${userId}`)
    
    // Validate URL
    if (!isValidURL(url)) {
      return new Response(JSON.stringify({ 
        error: 'URL invalide fournie',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('product_imports')
      .insert({
        user_id: userId,
        import_type: 'url',
        source_name: 'URL Import',
        source_url: url,
        status: 'processing',
        import_config: { url, options, timestamp: new Date().toISOString() }
      })
      .select()
      .single()

    if (importError) {
      console.error('Import record creation error:', importError)
      return new Response(JSON.stringify({ 
        error: `Erreur lors de la création de l'import: ${importError.message}`,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch and analyze URL content
    let products: any[] = []
    
    try {
      const urlContent = await fetchURLContent(url)
      
      if (openaiApiKey && openaiApiKey !== 'your_openai_key_here') {
        // Use AI to extract product information
        products = await extractProductsWithAI(openaiApiKey, urlContent, url, options)
      } else {
        // Fallback to pattern-based extraction
        products = await extractProductsWithPatterns(urlContent, url)
      }

      console.log(`Extracted ${products.length} products from URL`)

      // Save extracted products
      if (products.length > 0) {
        const importedProducts = products.map(product => ({
          user_id: userId,
          import_id: importRecord.id,
          name: product.title || 'Produit importé depuis URL',
          description: product.description || `Produit importé depuis ${url}`,
          price: product.price || 0,
          cost_price: product.cost_price || (product.price * 0.7),
          currency: product.currency || 'EUR',
          sku: product.sku || `URL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: product.category || 'General',
          supplier_name: getDomainFromURL(url),
          supplier_url: url,
          image_urls: product.images || [],
          tags: product.tags || ['url-import', getDomainFromURL(url)],
          status: 'draft',
          review_status: 'pending',
          ai_optimized: !!openaiApiKey,
          import_quality_score: calculateImportQuality(product),
          data_completeness_score: calculateDataCompleteness(product)
        }))

        const { error: productsError } = await supabase
          .from('imported_products')
          .insert(importedProducts)

        if (productsError) {
          console.error('Products insert error:', productsError)
          throw new Error(`Failed to save products: ${productsError.message}`)
        }
      }

      // Update import status
      await supabase
        .from('product_imports')
        .update({
          status: 'completed',
          products_imported: products.length,
          completed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - new Date(importRecord.created_at).getTime()
        })
        .eq('id', importRecord.id)

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action: 'url_import',
          description: `Imported ${products.length} products from URL`,
          entity_type: 'import',
          entity_id: importRecord.id,
          metadata: {
            url,
            products_count: products.length,
            ai_enabled: !!openaiApiKey
          }
        })

      return new Response(JSON.stringify({
        success: true,
        data: {
          import_id: importRecord.id,
          products_imported: products.length,
          products: products.slice(0, 5), // Return first 5 for preview
          source_url: url
        },
        message: `Successfully imported ${products.length} product(s) from URL`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processingError) {
      console.error('URL processing error:', processingError)
      
      // Update import status to failed
      await supabase
        .from('product_imports')
        .update({
          status: 'failed',
          error_message: processingError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', importRecord.id)

      throw processingError
    }

  } catch (error) {
    console.error('URL import function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function isValidURL(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

async function fetchURLContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }
    
    return await response.text()
  } catch (error) {
    throw new Error(`Error fetching URL content: ${error.message}`)
  }
}

async function extractProductsWithAI(
  apiKey: string,
  content: string,
  url: string,
  options: any
): Promise<any[]> {
  try {
    // Truncate content to avoid token limits
    const truncatedContent = content.substring(0, 8000)
    
    const prompt = `Extract product information from this webpage content.
URL: ${url}
Content: ${truncatedContent}

Please extract products and return JSON array with format:
[{
  "title": "Product name",
  "description": "Product description", 
  "price": number,
  "currency": "EUR/USD/etc",
  "images": ["image_url1", "image_url2"],
  "category": "category",
  "sku": "product_sku",
  "tags": ["tag1", "tag2"]
}]

Focus on extracting real product data. If no clear products found, return empty array.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at extracting product information from web content. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const extractedContent = data.choices[0].message.content

    try {
      const products = JSON.parse(extractedContent)
      return Array.isArray(products) ? products : [products]
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      return await extractProductsWithPatterns(content, url)
    }

  } catch (error) {
    console.error('AI extraction failed:', error)
    return await extractProductsWithPatterns(content, url)
  }
}

async function extractProductsWithPatterns(content: string, url: string): Promise<any[]> {
  // Simple pattern-based extraction for common e-commerce patterns
  const products: any[] = []
  
  // Extract JSON-LD structured data
  const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
        const data = JSON.parse(jsonContent)
        
        if (data['@type'] === 'Product' || data.type === 'Product') {
          products.push({
            title: data.name || 'Produit extrait',
            description: data.description || '',
            price: parseFloat(data.offers?.price || data.price || '0'),
            currency: data.offers?.priceCurrency || 'EUR',
            images: [data.image].flat().filter(Boolean),
            category: data.category || 'General',
            sku: data.sku || data.productID || `EXTRACT-${Date.now()}`,
            tags: ['url-import', getDomainFromURL(url)]
          })
        }
      } catch (e) {
        // Skip invalid JSON-LD
      }
    }
  }
  
  // If no structured data found, create a basic product from URL
  if (products.length === 0) {
    // Extract title from page
    const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Produit importé depuis URL'
    
    // Try to extract price patterns
    const priceMatches = content.match(/[\$€£¥]\s*\d+(?:[.,]\d{2})?/g)
    const price = priceMatches ? parseFloat(priceMatches[0].replace(/[^\d.,]/g, '').replace(',', '.')) : 0
    
    // Extract image URLs
    const imageMatches = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || []
    const images = imageMatches
      .map(img => {
        const srcMatch = img.match(/src=["']([^"']+)["']/)
        return srcMatch ? srcMatch[1] : null
      })
      .filter(Boolean)
      .slice(0, 3) // Limit to 3 images
    
    products.push({
      title: title.substring(0, 200),
      description: `Produit importé depuis ${url}`,
      price,
      currency: 'EUR',
      images,
      category: 'General',
      sku: `URL-${Date.now()}`,
      tags: ['url-import', getDomainFromURL(url)]
    })
  }
  
  return products
}

function getDomainFromURL(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

function calculateImportQuality(product: any): number {
  let score = 0
  
  if (product.title && product.title.length > 10) score += 25
  if (product.description && product.description.length > 50) score += 25
  if (product.price && product.price > 0) score += 20
  if (product.images && product.images.length > 0) score += 20
  if (product.category && product.category !== 'General') score += 10
  
  return Math.min(100, score)
}

function calculateDataCompleteness(product: any): number {
  const fields = ['title', 'description', 'price', 'images', 'category', 'sku']
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