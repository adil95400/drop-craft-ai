import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmazonProduct {
  asin: string
  title: string
  price: number
  original_price: number
  currency: string
  rating: number
  reviews_count: number
  images: string[]
  category: string
  brand: string
  description: string
  features: string[]
  availability: string
  seller: string
  url: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization required')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { action, url, asin, keywords, category, marketplace = 'com', limit = 20 } = await req.json()
    console.log(`[AMAZON] Action: ${action}, User: ${user.id}`)

    // Action: scrape_product - Scrape a product by URL or ASIN
    if (action === 'scrape_product') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      let productUrl = url
      if (asin && !url) {
        productUrl = `https://www.amazon.${marketplace}/dp/${asin}`
      }
      
      if (!productUrl) throw new Error('URL or ASIN required')

      console.log('[AMAZON] Scraping:', productUrl)

      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: productUrl,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      })

      if (!firecrawlResponse.ok) {
        throw new Error(`Scraping failed: ${firecrawlResponse.status}`)
      }

      const firecrawlData = await firecrawlResponse.json()
      const product = extractAmazonProduct(firecrawlData, productUrl)

      // Save to catalog
      const { data: savedProduct } = await supabase
        .from('catalog_products')
        .insert({
          user_id: user.id,
          title: product.title,
          price: product.price,
          compare_at_price: product.original_price,
          description: product.description,
          image_urls: product.images,
          category: product.category,
          source_platform: 'amazon',
          source_url: productUrl,
          supplier_name: product.seller || 'Amazon'
        })
        .select()
        .single()

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'amazon_product_import',
        description: `Imported product from Amazon: ${product.title}`,
        entity_type: 'product',
        metadata: { asin: product.asin, url: productUrl }
      })

      return new Response(JSON.stringify({
        success: true,
        product,
        saved_id: savedProduct?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: search_products - Search Amazon products
    if (action === 'search_products') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const searchQuery = keywords || 'bestseller products'
      console.log('[AMAZON] Searching:', searchQuery)

      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:amazon.${marketplace} ${searchQuery}`,
          limit: Math.min(limit, 20),
          scrapeOptions: { formats: ['markdown'] }
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const products = (searchData.data || [])
        .filter((r: any) => r.url?.includes('/dp/'))
        .map((result: any) => extractAmazonFromSearch(result, marketplace))
        .filter((p: any) => p.title)

      return new Response(JSON.stringify({
        success: true,
        products,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: get_bestsellers - Get bestseller products by category
    if (action === 'get_bestsellers') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const categorySlug = category || 'electronics'
      const bsUrl = `https://www.amazon.${marketplace}/Best-Sellers-${categorySlug}`
      
      console.log('[AMAZON] Fetching bestsellers:', bsUrl)

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: bsUrl,
          formats: ['markdown', 'links'],
          onlyMainContent: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch bestsellers: ${response.status}`)
      }

      const data = await response.json()
      const links = (data.data?.links || [])
        .filter((link: string) => link.includes('/dp/'))
        .slice(0, limit)

      const products = links.map((link: string) => {
        const asinMatch = link.match(/\/dp\/([A-Z0-9]{10})/)
        return {
          asin: asinMatch?.[1] || '',
          url: link,
          title: 'Amazon Product',
          price: 0
        }
      }).filter((p: any) => p.asin)

      return new Response(JSON.stringify({
        success: true,
        products,
        category: categorySlug,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: bulk_import - Import multiple products by ASINs
    if (action === 'bulk_import') {
      const { asins } = await req.json()
      
      if (!asins || !Array.isArray(asins) || asins.length === 0) {
        throw new Error('ASINs array required')
      }

      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const results: AmazonProduct[] = []
      const errors: Array<{ asin: string; error: string }> = []

      for (const productAsin of asins.slice(0, 10)) {
        try {
          const productUrl = `https://www.amazon.${marketplace}/dp/${productAsin}`
          
          const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: productUrl,
              formats: ['markdown', 'html'],
              onlyMainContent: true,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const product = extractAmazonProduct(data, productUrl)
            results.push(product)
          } else {
            errors.push({ asin: productAsin, error: 'Scraping failed' })
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          errors.push({ asin: productAsin, error: error.message })
        }
      }

      // Save all successful products
      if (results.length > 0) {
        const productsToInsert = results.map(p => ({
          user_id: user.id,
          title: p.title,
          price: p.price,
          description: p.description,
          image_urls: p.images,
          category: p.category,
          source_platform: 'amazon',
          source_url: p.url,
          supplier_name: p.seller || 'Amazon'
        }))

        await supabase.from('catalog_products').insert(productsToInsert)
      }

      return new Response(JSON.stringify({
        success: true,
        imported: results.length,
        failed: errors.length,
        products: results,
        errors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action. Use: scrape_product, search_products, get_bestsellers, bulk_import')

  } catch (error) {
    console.error('[AMAZON] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function extractAmazonProduct(firecrawlData: any, url: string): AmazonProduct {
  const markdown = firecrawlData.data?.markdown || ''
  const html = firecrawlData.data?.html || ''
  const metadata = firecrawlData.data?.metadata || {}

  // Extract ASIN from URL
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/) || url.match(/\/gp\/product\/([A-Z0-9]{10})/)
  const asin = asinMatch ? asinMatch[1] : `amz-${Date.now()}`

  // Extract title
  let title = metadata.title || ''
  title = title.replace(/\s*:\s*Amazon.*$/i, '').replace(/\s*\|.*$/i, '').trim()
  if (!title) {
    const titleMatch = markdown.match(/^#\s*(.+)$/m)
    title = titleMatch ? titleMatch[1] : 'Amazon Product'
  }

  // Extract price
  let price = 0
  const pricePatterns = [
    /\$(\d+\.?\d*)/,
    /€(\d+\.?\d*)/,
    /£(\d+\.?\d*)/,
    /(\d+)[,.](\d{2})\s*(?:\$|€|£)/
  ]
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern) || html.match(pattern)
    if (match) {
      price = parseFloat(match[1] + (match[2] ? `.${match[2]}` : ''))
      break
    }
  }

  // Extract original price (was price)
  let originalPrice = price
  const wasMatch = markdown.match(/(?:was|list|original)\s*:?\s*\$?(\d+\.?\d*)/i)
  if (wasMatch) {
    originalPrice = parseFloat(wasMatch[1])
  }

  // Extract rating
  let rating = 0
  const ratingMatch = markdown.match(/(\d+\.?\d*)\s*out of\s*5/i) ||
                      markdown.match(/(\d+\.?\d*)\s*stars?/i)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  }

  // Extract reviews count
  let reviewsCount = 0
  const reviewsMatch = markdown.match(/(\d+(?:,\d+)*)\s*(?:ratings?|reviews?|customer)/i)
  if (reviewsMatch) {
    reviewsCount = parseInt(reviewsMatch[1].replace(/,/g, ''))
  }

  // Extract images
  const images: string[] = []
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+(?:images-amazon|m.media-amazon)[^"']+)["']/gi)
  for (const match of imgMatches) {
    if (match[1] && !match[1].includes('sprite') && images.length < 5) {
      images.push(match[1])
    }
  }

  // Extract brand
  const brandMatch = markdown.match(/(?:brand|by)\s*:?\s*([A-Za-z0-9\s]+)/i)
  const brand = brandMatch ? brandMatch[1].trim() : ''

  // Extract features
  const features: string[] = []
  const featureMatches = markdown.matchAll(/[-•]\s*(.+)/g)
  for (const match of featureMatches) {
    if (match[1].length > 10 && match[1].length < 200 && features.length < 5) {
      features.push(match[1].trim())
    }
  }

  return {
    asin,
    title,
    price,
    original_price: originalPrice,
    currency: 'USD',
    rating,
    reviews_count: reviewsCount,
    images,
    category: extractCategory(markdown, title),
    brand,
    description: markdown.substring(0, 500),
    features,
    availability: 'In Stock',
    seller: 'Amazon',
    url
  }
}

function extractAmazonFromSearch(result: any, marketplace: string): Partial<AmazonProduct> {
  const url = result.url || ''
  const title = result.title || ''
  const markdown = result.markdown || ''

  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  const asin = asinMatch ? asinMatch[1] : ''

  let price = 0
  const priceMatch = markdown.match(/\$(\d+\.?\d*)/)
  if (priceMatch) {
    price = parseFloat(priceMatch[1])
  }

  return {
    asin,
    title: title.replace(/\s*:\s*Amazon.*$/i, '').trim(),
    price,
    original_price: price,
    currency: 'USD',
    rating: 0,
    reviews_count: 0,
    images: [],
    category: 'General',
    brand: '',
    description: '',
    features: [],
    availability: 'Unknown',
    seller: 'Amazon',
    url
  }
}

function extractCategory(markdown: string, title: string): string {
  const categories = [
    'Electronics', 'Home & Kitchen', 'Clothing', 'Beauty', 'Toys & Games',
    'Sports & Outdoors', 'Automotive', 'Books', 'Health', 'Garden'
  ]
  
  const lowerText = (markdown + title).toLowerCase()
  
  for (const cat of categories) {
    if (lowerText.includes(cat.toLowerCase())) {
      return cat
    }
  }
  
  return 'General'
}
