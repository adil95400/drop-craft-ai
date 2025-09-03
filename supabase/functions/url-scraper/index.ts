import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string
  config?: {
    extract_images?: boolean
    analyze_seo?: boolean
    generate_variants?: boolean
    price_tracking?: boolean
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      })
    }

    const { url, config = {} }: ScrapeRequest = await req.json()

    console.log(`Scraping URL: ${url}`)

    // Create import job
    const { data: importJob, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'url_scraper',
        source_url: url,
        status: 'processing'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create import job' }), {
        status: 500,
        headers: corsHeaders
      })
    }

    try {
      // Fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
      }

      const html = await response.text()
      
      // Advanced scraping with multiple strategies
      const scrapedData = await scrapeProductData(html, url, config)
      
      if (!scrapedData || scrapedData.length === 0) {
        await supabaseClient
          .from('import_jobs')
          .update({
            status: 'completed',
            total_rows: 0,
            success_rows: 0,
            error_rows: 0,
            errors: ['No products found on the page']
          })
          .eq('id', importJob.id)

        return new Response(JSON.stringify({
          success: true,
          products_found: 0,
          message: 'No products found on this page'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Insert scraped products
      const productsToInsert = scrapedData.map(product => ({
        ...product,
        user_id: user.id,
        import_id: importJob.id,
        status: 'draft',
        review_status: 'pending'
      }))

      const { error: insertError } = await supabaseClient
        .from('imported_products')
        .insert(productsToInsert)

      if (insertError) {
        console.error('Products insertion error:', insertError)
        
        await supabaseClient
          .from('import_jobs')
          .update({
            status: 'failed',
            error_rows: scrapedData.length,
            errors: [insertError.message]
          })
          .eq('id', importJob.id)

        return new Response(JSON.stringify({ error: 'Failed to insert products' }), {
          status: 500,
          headers: corsHeaders
        })
      }

      // Update job as completed
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'completed',
          total_rows: scrapedData.length,
          success_rows: scrapedData.length,
          processed_rows: scrapedData.length,
          error_rows: 0,
          result_data: {
            products_scraped: scrapedData.length,
            source_url: url,
            scraping_config: config,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', importJob.id)

      console.log(`URL scraping completed: ${scrapedData.length} products scraped`)

      return new Response(JSON.stringify({
        success: true,
        import_id: importJob.id,
        products_scraped: scrapedData.length,
        products: scrapedData.slice(0, 3), // Return first 3 for preview
        message: `${scrapedData.length} produits scrapés avec succès`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      console.error('Scraping error:', error)
      
      await supabaseClient
        .from('import_jobs')
        .update({
          status: 'failed',
          errors: [error.message]
        })
        .eq('id', importJob.id)

      throw error
    }

  } catch (error) {
    console.error('URL scraper error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function scrapeProductData(html: string, url: string, config: any) {
  const products: any[] = []
  
  // Extract JSON-LD structured data
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
        const data = JSON.parse(jsonContent)
        
        if (data['@type'] === 'Product' || (Array.isArray(data) && data.some(item => item['@type'] === 'Product'))) {
          const productData = Array.isArray(data) ? data.filter(item => item['@type'] === 'Product') : [data]
          
          for (const product of productData) {
            products.push({
              name: product.name || 'Produit sans nom',
              description: product.description || '',
              price: parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || 0,
              currency: product.offers?.priceCurrency || 'EUR',
              image_urls: Array.isArray(product.image) ? product.image : product.image ? [product.image] : [],
              category: product.category || 'Divers',
              sku: product.sku || product.productID || `SCRAPED-${Date.now()}`,
              supplier_name: new URL(url).hostname.replace('www.', ''),
              supplier_url: url,
              tags: ['scraped', 'structured-data']
            })
          }
        }
      } catch (e) {
        console.error('Error parsing JSON-LD:', e)
      }
    }
  }

  // If no structured data, try CSS selectors
  if (products.length === 0) {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim().replace(/&[^;]+;/g, '').substring(0, 200) : 'Produit scraped'
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)
    const description = descMatch ? descMatch[1].trim() : 'Description extraite automatiquement'
    
    // Extract price using multiple patterns
    const pricePatterns = [
      /[\$€£¥]\s*([0-9,]+(?:\.[0-9]{2})?)/g,
      /([0-9,]+(?:\.[0-9]{2})?)\s*[\$€£¥]/g,
      /"price":\s*"?([0-9,]+(?:\.[0-9]{2})?)"?/g,
      /prix[^0-9]*([0-9,]+(?:\.[0-9]{2})?)/gi
    ]
    
    let price = 0
    for (const pattern of pricePatterns) {
      const matches = [...html.matchAll(pattern)]
      if (matches.length > 0) {
        price = parseFloat(matches[0][1].replace(',', '.')) || 0
        if (price > 0) break
      }
    }

    // Extract images
    const imageMatches = html.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || []
    const images = imageMatches
      .map(match => {
        const srcMatch = match.match(/src="([^"]*)"/)
        return srcMatch ? srcMatch[1] : null
      })
      .filter(src => src && !src.includes('data:') && (src.includes('.jpg') || src.includes('.png') || src.includes('.webp')))
      .slice(0, 5)

    products.push({
      name: title,
      description: description,
      price: price,
      currency: 'EUR',
      image_urls: images,
      category: 'Scraped',
      sku: `SCRAPED-${Date.now()}`,
      supplier_name: new URL(url).hostname.replace('www.', ''),
      supplier_url: url,
      tags: ['scraped', 'css-extracted']
    })
  }

  return products
}