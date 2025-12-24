import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AliExpressProduct {
  product_id: string
  title: string
  price: number
  original_price: number
  discount_rate: number
  rating: number
  review_count: number
  image_urls: string[]
  category: string
  tags: string[]
  supplier_name: string
  shipping_time: string
  min_order_quantity: number
  description?: string
  source_url: string
  stock_quantity?: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { action, url, keywords, category, maxPrice, minPrice, limit = 20 } = await req.json()
    console.log(`[ALIEXPRESS-SCRAPER] Action: ${action}, User: ${user.id}`)

    // Action: scrape_product - Scraper un produit par URL
    if (action === 'scrape_product' && url) {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured. Please connect Firecrawl in Settings.')
      }

      console.log('[ALIEXPRESS-SCRAPER] Scraping URL:', url)

      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      })

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text()
        console.error('[ALIEXPRESS-SCRAPER] Firecrawl error:', errorText)
        throw new Error(`Failed to scrape: ${firecrawlResponse.status}`)
      }

      const firecrawlData = await firecrawlResponse.json()
      const product = extractProductFromPage(firecrawlData, url)

      // Sauvegarder le produit
      const { data: savedProduct, error: saveError } = await supabase
        .from('imported_products')
        .insert({
          user_id: user.id,
          source_platform: 'aliexpress',
          source_url: url,
          category: product.category,
          price: product.price,
          status: 'draft'
        })
        .select()
        .single()

      if (saveError) {
        console.error('[ALIEXPRESS-SCRAPER] Save error:', saveError)
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'aliexpress_product_import',
        description: `Imported product from AliExpress: ${product.title}`,
        entity_type: 'product',
        metadata: { url, product_id: product.product_id }
      })

      return new Response(JSON.stringify({
        success: true,
        product,
        saved_id: savedProduct?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: search_products - Rechercher des produits via scraping
    if (action === 'search_products') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const searchQuery = keywords || 'dropshipping winning products'
      console.log('[ALIEXPRESS-SCRAPER] Searching:', searchQuery)

      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:aliexpress.com ${searchQuery}`,
          limit: Math.min(limit, 20),
          scrapeOptions: {
            formats: ['markdown']
          }
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const products = (searchData.data || []).map((result: any) => extractProductFromSearch(result))
        .filter((p: any) => p.title && p.price > 0)

      return new Response(JSON.stringify({
        success: true,
        products,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: bulk_import - Import multiple products
    if (action === 'bulk_import') {
      const { urls } = await req.json()
      
      if (!urls || !Array.isArray(urls) || urls.length === 0) {
        throw new Error('URLs array required')
      }

      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const results = []
      const errors = []

      for (const productUrl of urls.slice(0, 10)) { // Limit to 10 products
        try {
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
            }),
          })

          if (firecrawlResponse.ok) {
            const data = await firecrawlResponse.json()
            const product = extractProductFromPage(data, productUrl)
            results.push(product)
          } else {
            errors.push({ url: productUrl, error: 'Scraping failed' })
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          errors.push({ url: productUrl, error: error.message })
        }
      }

      // Save all successful products
      if (results.length > 0) {
        const productsToInsert = results.map(p => ({
          user_id: user.id,
          source_platform: 'aliexpress',
          source_url: p.source_url,
          category: p.category,
          price: p.price,
          status: 'draft'
        }))

        await supabase.from('imported_products').insert(productsToInsert)
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

    throw new Error('Invalid action. Use: scrape_product, search_products, or bulk_import')

  } catch (error) {
    console.error('[ALIEXPRESS-SCRAPER] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function extractProductFromPage(firecrawlData: any, url: string): AliExpressProduct {
  const markdown = firecrawlData.data?.markdown || ''
  const html = firecrawlData.data?.html || ''
  const metadata = firecrawlData.data?.metadata || {}

  // Extract title
  let title = metadata.title || ''
  title = title.replace(/\s*[-|]\s*AliExpress.*$/i, '').trim()
  if (!title) {
    const titleMatch = markdown.match(/^#\s*(.+)$/m)
    title = titleMatch ? titleMatch[1] : 'Unknown Product'
  }

  // Extract price
  let price = 0
  const pricePatterns = [
    /\$\s*(\d+\.?\d*)/,
    /US\s*\$\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*USD/,
    /€\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*€/
  ]
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern) || html.match(pattern)
    if (match) {
      price = parseFloat(match[1])
      break
    }
  }

  // Extract original price
  let originalPrice = price
  const originalPriceMatch = markdown.match(/(?:was|original|from)\s*\$?\s*(\d+\.?\d*)/i)
  if (originalPriceMatch) {
    originalPrice = parseFloat(originalPriceMatch[1])
  }

  // Extract rating
  let rating = 0
  const ratingMatch = markdown.match(/(\d+\.?\d*)\s*(?:out of|\/)\s*5/i) || 
                      markdown.match(/rating[:\s]*(\d+\.?\d*)/i)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  }

  // Extract review count
  let reviewCount = 0
  const reviewMatch = markdown.match(/(\d+(?:,\d+)*)\s*(?:reviews?|orders?|sold)/i)
  if (reviewMatch) {
    reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''))
  }

  // Extract images
  const imageUrls: string[] = []
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+alicdn[^"']+)["']/gi)
  for (const match of imgMatches) {
    if (match[1] && !match[1].includes('avatar') && imageUrls.length < 5) {
      imageUrls.push(match[1])
    }
  }

  // Extract product ID from URL
  const productIdMatch = url.match(/\/item\/(\d+)\.html/) || url.match(/\/(\d{10,})/)
  const productId = productIdMatch ? productIdMatch[1] : `ae-${Date.now()}`

  return {
    product_id: productId,
    title,
    price,
    original_price: originalPrice,
    discount_rate: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
    rating,
    review_count: reviewCount,
    image_urls: imageUrls,
    category: extractCategory(markdown, title),
    tags: extractTags(markdown, title),
    supplier_name: 'AliExpress',
    shipping_time: extractShippingTime(markdown),
    min_order_quantity: 1,
    description: markdown.substring(0, 500),
    source_url: url,
    stock_quantity: 999
  }
}

function extractProductFromSearch(result: any): Partial<AliExpressProduct> {
  const url = result.url || ''
  const title = result.title || ''
  const markdown = result.markdown || ''

  let price = 0
  const priceMatch = markdown.match(/\$\s*(\d+\.?\d*)/) || title.match(/\$\s*(\d+\.?\d*)/)
  if (priceMatch) {
    price = parseFloat(priceMatch[1])
  }

  const productIdMatch = url.match(/\/item\/(\d+)\.html/) || url.match(/\/(\d{10,})/)
  const productId = productIdMatch ? productIdMatch[1] : `ae-search-${Date.now()}`

  return {
    product_id: productId,
    title: title.replace(/\s*[-|]\s*AliExpress.*$/i, '').trim(),
    price,
    original_price: price,
    discount_rate: 0,
    rating: 0,
    review_count: 0,
    image_urls: [],
    category: 'General',
    tags: [],
    supplier_name: 'AliExpress',
    shipping_time: '15-30 days',
    min_order_quantity: 1,
    source_url: url,
    stock_quantity: 999
  }
}

function extractCategory(markdown: string, title: string): string {
  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Toys', 
    'Sports', 'Automotive', 'Jewelry', 'Phones', 'Computers'
  ]
  
  const lowerTitle = title.toLowerCase()
  const lowerMarkdown = markdown.toLowerCase()
  
  for (const cat of categories) {
    if (lowerTitle.includes(cat.toLowerCase()) || lowerMarkdown.includes(cat.toLowerCase())) {
      return cat
    }
  }
  
  return 'General'
}

function extractTags(markdown: string, title: string): string[] {
  const tags: string[] = ['aliexpress', 'dropshipping']
  
  const keywords = ['wireless', 'bluetooth', 'usb', 'led', 'mini', 'portable', 'waterproof']
  const lowerTitle = title.toLowerCase()
  
  for (const kw of keywords) {
    if (lowerTitle.includes(kw)) {
      tags.push(kw)
    }
  }
  
  return tags.slice(0, 5)
}

function extractShippingTime(markdown: string): string {
  const shippingMatch = markdown.match(/(\d+)\s*-\s*(\d+)\s*days?/i)
  if (shippingMatch) {
    return `${shippingMatch[1]}-${shippingMatch[2]} days`
  }
  return '15-30 days'
}
