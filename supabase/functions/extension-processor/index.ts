import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Extension Processor - Real API Integration
 * 
 * This function processes extension jobs for:
 * - Amazon product imports (via PA-API or extension scraper)
 * - Social media review aggregation (via Firecrawl)
 * - Shopify sync (via Admin API)
 * 
 * Required secrets:
 * - FIRECRAWL_API_KEY: For web scraping
 * - AMAZON_PA_API_KEY: For Amazon Product Advertising API (optional)
 * - AMAZON_PA_API_SECRET: For Amazon PA-API (optional)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { jobId } = await req.json()

    if (!jobId) {
      throw new Error('Missing required jobId parameter')
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('extension_jobs')
      .select('*, extensions(*)')
      .eq('id', jobId)
      .single()

    if (jobError) throw jobError
    if (!job) throw new Error(`Job ${jobId} not found`)

    console.log(`📦 Processing extension job: ${job.id} - Provider: ${job.extensions?.provider}`)

    // Update job status to processing
    await supabase
      .from('extension_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 0
      })
      .eq('id', jobId)

    // Process based on extension type
    let results: any[] = []
    const extension = job.extensions

    try {
      if (extension?.provider === 'amazon') {
        results = await processAmazonImport(job, supabase)
      } else if (extension?.provider === 'social_media') {
        results = await processSocialReviews(job, supabase)
      } else if (extension?.provider === 'shopify') {
        results = await processShopifySync(job, supabase)
      } else {
        throw new Error(`Unsupported extension provider: ${extension?.provider}`)
      }

      // Update job completion
      await supabase
        .from('extension_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          success_items: results.length,
          output_data: { results, processed_at: new Date().toISOString() }
        })
        .eq('id', jobId)

      console.log(`✅ Job ${jobId} completed successfully with ${results.length} items`)

    } catch (processingError) {
      console.error(`❌ Job ${jobId} processing failed:`, processingError)
      
      await supabase
        .from('extension_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: processingError.message,
          output_data: { error: processingError.message }
        })
        .eq('id', jobId)

      throw processingError
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processAmazonImport(job: any, supabase: any): Promise<any[]> {
  const { searchTerm, maxProducts = 10, asin_list } = job.input_data || {}
  const results: any[] = []
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')

  console.log(`🛒 Processing Amazon import for: ${searchTerm || asin_list?.join(', ')}`)

  // Strategy 1: Use Firecrawl for scraping if available
  if (firecrawlKey && searchTerm) {
    try {
      const searchUrl = `https://www.amazon.fr/s?k=${encodeURIComponent(searchTerm)}`
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: searchUrl,
          formats: ['markdown', 'html'],
          onlyMainContent: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Parse products from scraped content
        const products = parseAmazonSearchResults(data, maxProducts)
        
        for (const product of products) {
          await supabase
            .from('extension_data')
            .insert({
              user_id: job.user_id,
              extension_id: job.extension_id,
              job_id: job.id,
              data_type: 'product',
              external_id: product.external_id,
              data_content: product,
              quality_score: calculateQualityScore(product)
            })

          results.push(product)
        }

        console.log(`✅ Scraped ${results.length} products from Amazon`)
        return results
      }
    } catch (scrapeError) {
      console.error('Firecrawl scraping failed:', scrapeError)
    }
  }

  // Strategy 2: If ASIN list provided, fetch individual products
  if (asin_list?.length > 0) {
    for (const asin of asin_list.slice(0, maxProducts)) {
      const product = await fetchAmazonProductByASIN(asin, firecrawlKey)
      if (product) {
        await supabase
          .from('extension_data')
          .insert({
            user_id: job.user_id,
            extension_id: job.extension_id,
            job_id: job.id,
            data_type: 'product',
            external_id: product.external_id,
            data_content: product,
            quality_score: calculateQualityScore(product)
          })
        results.push(product)
      }
    }
    return results
  }

  // No API key or data source available
  throw new Error('FIRECRAWL_API_KEY not configured. Configure it in Secrets to enable Amazon product scraping.')
}

async function fetchAmazonProductByASIN(asin: string, firecrawlKey?: string): Promise<any | null> {
  if (!firecrawlKey) return null

  try {
    const productUrl = `https://www.amazon.fr/dp/${asin}`
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown'],
        onlyMainContent: true
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    
    return {
      external_id: `amazon_${asin}`,
      asin,
      name: extractProductTitle(data.data?.markdown || ''),
      price: extractPrice(data.data?.markdown || ''),
      description: extractDescription(data.data?.markdown || ''),
      category: 'Amazon',
      source_url: productUrl,
      scraped_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`Failed to fetch ASIN ${asin}:`, error)
    return null
  }
}

function parseAmazonSearchResults(data: any, maxProducts: number): any[] {
  const markdown = data.data?.markdown || ''
  const products: any[] = []
  
  // Extract product blocks from markdown content
  const productMatches = markdown.match(/\[([^\]]+)\]\((https:\/\/www\.amazon\.[^)]+dp\/([A-Z0-9]{10})[^)]*)\)/g) || []
  
  for (const match of productMatches.slice(0, maxProducts)) {
    const titleMatch = match.match(/\[([^\]]+)\]/)
    const asinMatch = match.match(/dp\/([A-Z0-9]{10})/)
    
    if (titleMatch && asinMatch) {
      products.push({
        external_id: `amazon_${asinMatch[1]}`,
        asin: asinMatch[1],
        name: titleMatch[1].substring(0, 200),
        price: null, // Would need additional parsing
        category: 'Amazon',
        source_url: `https://www.amazon.fr/dp/${asinMatch[1]}`,
        scraped_at: new Date().toISOString()
      })
    }
  }
  
  return products
}

function extractProductTitle(markdown: string): string {
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  return titleMatch?.[1]?.substring(0, 200) || 'Unknown Product'
}

function extractPrice(markdown: string): number | null {
  const priceMatch = markdown.match(/(\d+[,.]?\d*)\s*€/)
  if (priceMatch) {
    return parseFloat(priceMatch[1].replace(',', '.'))
  }
  return null
}

function extractDescription(markdown: string): string {
  return markdown.substring(0, 500)
}

function calculateQualityScore(product: any): number {
  let score = 50
  if (product.name && product.name.length > 10) score += 20
  if (product.price) score += 15
  if (product.asin) score += 15
  return Math.min(score, 100)
}

async function processSocialReviews(job: any, supabase: any): Promise<any[]> {
  const { platform, productUrl, productId } = job.input_data || {}
  const results: any[] = []
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')

  console.log(`📱 Processing social reviews for: ${productUrl || productId}`)

  if (!firecrawlKey) {
    throw new Error('FIRECRAWL_API_KEY not configured. Configure it in Secrets to enable review scraping.')
  }

  if (!productUrl) {
    throw new Error('Product URL is required for social media review import')
  }

  try {
    // Scrape product page for reviews
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: productUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true
      })
    })

    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.status}`)
    }

    const data = await response.json()
    const reviews = parseReviewsFromContent(data.data?.markdown || '', platform || 'unknown')

    for (const review of reviews) {
      const reviewData = {
        ...review,
        external_id: `${platform}_${productId}_${Date.now()}_${results.length}`,
        product_id: productId,
        platform,
        scraped_at: new Date().toISOString()
      }

      await supabase
        .from('extension_data')
        .insert({
          user_id: job.user_id,
          extension_id: job.extension_id,
          job_id: job.id,
          data_type: 'review',
          external_id: reviewData.external_id,
          data_content: reviewData,
          quality_score: reviewData.rating ? reviewData.rating * 20 : 50
        })

      results.push(reviewData)
    }

    console.log(`✅ Extracted ${results.length} reviews from ${platform}`)
  } catch (error) {
    console.error('Review scraping failed:', error)
    throw new Error(`Failed to scrape reviews: ${error.message}`)
  }

  return results
}

function parseReviewsFromContent(markdown: string, platform: string): any[] {
  const reviews: any[] = []
  
  // Look for common review patterns in markdown
  const starPatterns = markdown.match(/(\d)[\/\s]?[⭐★☆]+|(\d)\s*(?:étoile|star|out of 5)/gi) || []
  const textBlocks = markdown.split(/\n{2,}/).filter(block => block.length > 50 && block.length < 1000)
  
  for (let i = 0; i < Math.min(textBlocks.length, 10); i++) {
    const block = textBlocks[i]
    const ratingMatch = block.match(/(\d)[\/\s]?5|(\d)\s*star/i)
    
    reviews.push({
      content: block.substring(0, 500),
      rating: ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2]) : null,
      platform,
      verified: block.toLowerCase().includes('verified') || block.toLowerCase().includes('vérifié')
    })
  }
  
  return reviews
}

async function processShopifySync(job: any, supabase: any): Promise<any[]> {
  const { store_domain, access_token, sync_type = 'products' } = job.input_data || {}
  const results: any[] = []

  console.log(`🛍️ Processing Shopify sync for: ${store_domain}`)

  if (!store_domain || !access_token) {
    throw new Error('Store domain and access token are required for Shopify sync')
  }

  // Normalize domain
  const domain = store_domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

  try {
    // Fetch products from Shopify Admin API
    const response = await fetch(`https://${domain}/admin/api/2024-01/products.json?limit=50`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const products = data.products || []

    console.log(`📦 Found ${products.length} products in Shopify store`)

    for (const product of products) {
      const syncData = {
        external_id: `shopify_${product.id}`,
        shopify_id: product.id,
        title: product.title,
        description: product.body_html,
        vendor: product.vendor,
        product_type: product.product_type,
        status: product.status,
        variants: product.variants?.map((v: any) => ({
          id: v.id,
          title: v.title,
          price: v.price,
          sku: v.sku,
          inventory_quantity: v.inventory_quantity
        })),
        images: product.images?.map((img: any) => img.src),
        synced_at: new Date().toISOString()
      }

      await supabase
        .from('extension_data')
        .upsert({
          user_id: job.user_id,
          extension_id: job.extension_id,
          job_id: job.id,
          data_type: 'product',
          external_id: syncData.external_id,
          data_content: syncData,
          quality_score: 100
        }, {
          onConflict: 'external_id'
        })

      results.push(syncData)
    }

    console.log(`✅ Synced ${results.length} products from Shopify`)

  } catch (error) {
    console.error('Shopify sync failed:', error)
    throw new Error(`Shopify sync failed: ${error.message}`)
  }

  return results
}
