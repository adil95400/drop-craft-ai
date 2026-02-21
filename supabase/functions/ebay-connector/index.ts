import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface EbayProduct {
  item_id: string
  title: string
  price: number
  currency: string
  condition: string
  seller: string
  seller_rating: number
  shipping_cost: number
  location: string
  images: string[]
  category: string
  description: string
  bids: number
  watchers: number
  time_left: string
  buy_it_now: boolean
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

    const { action, url, item_id, keywords, category, site = 'com', limit = 20 } = await req.json()
    console.log(`[EBAY] Action: ${action}, User: ${user.id}`)

    // Action: scrape_product - Scrape a product by URL or item ID
    if (action === 'scrape_product') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      let productUrl = url
      if (item_id && !url) {
        productUrl = `https://www.ebay.${site}/itm/${item_id}`
      }
      
      if (!productUrl) throw new Error('URL or item_id required')

      console.log('[EBAY] Scraping:', productUrl)

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
      const product = extractEbayProduct(firecrawlData, productUrl)

      // Save to catalog
      const { data: savedProduct } = await supabase
        .from('catalog_products')
        .insert({
          user_id: user.id,
          title: product.title,
          price: product.price,
          description: product.description,
          image_urls: product.images,
          category: product.category,
          source_platform: 'ebay',
          source_url: productUrl,
          supplier_name: product.seller || 'eBay'
        })
        .select()
        .single()

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'ebay_product_import',
        description: `Imported product from eBay: ${product.title}`,
        entity_type: 'product',
        metadata: { item_id: product.item_id, url: productUrl }
      })

      return new Response(JSON.stringify({
        success: true,
        product,
        saved_id: savedProduct?.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: search_products - Search eBay products
    if (action === 'search_products') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const searchQuery = keywords || 'trending items'
      console.log('[EBAY] Searching:', searchQuery)

      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:ebay.${site} ${searchQuery}`,
          limit: Math.min(limit, 20),
          scrapeOptions: { formats: ['markdown'] }
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const products = (searchData.data || [])
        .filter((r: any) => r.url?.includes('/itm/'))
        .map((result: any) => extractEbayFromSearch(result, site))
        .filter((p: any) => p.title)

      return new Response(JSON.stringify({
        success: true,
        products,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: get_trending - Get trending/popular items
    if (action === 'get_trending') {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const categorySlug = category || 'deals'
      console.log('[EBAY] Fetching trending for:', categorySlug)

      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:ebay.${site} ${categorySlug} trending popular`,
          limit: Math.min(limit, 20),
          scrapeOptions: { formats: ['markdown'] }
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const products = (searchData.data || [])
        .filter((r: any) => r.url?.includes('/itm/'))
        .map((result: any) => extractEbayFromSearch(result, site))

      return new Response(JSON.stringify({
        success: true,
        products,
        category: categorySlug,
        total: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Action: bulk_import - Import multiple products by item IDs
    if (action === 'bulk_import') {
      const { item_ids } = await req.json()
      
      if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        throw new Error('item_ids array required')
      }

      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured')
      }

      const results: EbayProduct[] = []
      const errors: Array<{ item_id: string; error: string }> = []

      for (const itemId of item_ids.slice(0, 10)) {
        try {
          const productUrl = `https://www.ebay.${site}/itm/${itemId}`
          
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
            const product = extractEbayProduct(data, productUrl)
            results.push(product)
          } else {
            errors.push({ item_id: itemId, error: 'Scraping failed' })
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          errors.push({ item_id: itemId, error: error.message })
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
          source_platform: 'ebay',
          source_url: p.url,
          supplier_name: p.seller || 'eBay'
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

    // Action: monitor_price - Set up price monitoring for an item
    if (action === 'monitor_price') {
      const { target_price } = await req.json()
      
      if (!item_id) throw new Error('item_id required')
      if (!target_price) throw new Error('target_price required')

      const productUrl = `https://www.ebay.${site}/itm/${item_id}`

      // Save price monitoring
      const { data, error } = await supabase
        .from('price_stock_monitoring')
        .insert({
          user_id: user.id,
          supplier_url: productUrl,
          alert_threshold: target_price,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify({
        success: true,
        monitoring_id: data.id,
        item_id,
        target_price
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action. Use: scrape_product, search_products, get_trending, bulk_import, monitor_price')

  } catch (error) {
    console.error('[EBAY] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function extractEbayProduct(firecrawlData: any, url: string): EbayProduct {
  const markdown = firecrawlData.data?.markdown || ''
  const html = firecrawlData.data?.html || ''
  const metadata = firecrawlData.data?.metadata || {}

  // Extract item ID from URL
  const itemIdMatch = url.match(/\/itm\/(\d+)/) || url.match(/item=(\d+)/)
  const itemId = itemIdMatch ? itemIdMatch[1] : `ebay-${Date.now()}`

  // Extract title
  let title = metadata.title || ''
  title = title.replace(/\s*\|\s*eBay.*$/i, '').trim()
  if (!title) {
    const titleMatch = markdown.match(/^#\s*(.+)$/m)
    title = titleMatch ? titleMatch[1] : 'eBay Item'
  }

  // Extract price
  let price = 0
  const pricePatterns = [
    /US\s*\$(\d+\.?\d*)/,
    /\$(\d+\.?\d*)/,
    /€(\d+\.?\d*)/,
    /£(\d+\.?\d*)/
  ]
  for (const pattern of pricePatterns) {
    const match = markdown.match(pattern) || html.match(pattern)
    if (match) {
      price = parseFloat(match[1])
      break
    }
  }

  // Detect currency
  let currency = 'USD'
  if (markdown.includes('€') || html.includes('€')) currency = 'EUR'
  if (markdown.includes('£') || html.includes('£')) currency = 'GBP'

  // Extract condition
  let condition = 'Unknown'
  const conditionPatterns = ['New', 'Used', 'Refurbished', 'Open Box', 'For Parts']
  for (const cond of conditionPatterns) {
    if (markdown.toLowerCase().includes(cond.toLowerCase())) {
      condition = cond
      break
    }
  }

  // Extract seller
  const sellerMatch = markdown.match(/(?:seller|sold by)\s*:?\s*([A-Za-z0-9_-]+)/i)
  const seller = sellerMatch ? sellerMatch[1] : ''

  // Extract seller rating
  let sellerRating = 0
  const ratingMatch = markdown.match(/(\d+\.?\d*)%\s*positive/i)
  if (ratingMatch) {
    sellerRating = parseFloat(ratingMatch[1])
  }

  // Extract shipping cost
  let shippingCost = 0
  const shippingMatch = markdown.match(/shipping[:\s]*\$?(\d+\.?\d*)/i)
  if (shippingMatch) {
    shippingCost = parseFloat(shippingMatch[1])
  }
  const freeShipping = markdown.toLowerCase().includes('free shipping')
  if (freeShipping) shippingCost = 0

  // Extract location
  const locationMatch = markdown.match(/(?:located|ships from|from)\s*:?\s*([A-Za-z,\s]+)/i)
  const location = locationMatch ? locationMatch[1].trim() : ''

  // Extract images
  const images: string[] = []
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+(?:ebayimg)[^"']+)["']/gi)
  for (const match of imgMatches) {
    if (match[1] && !match[1].includes('icon') && images.length < 5) {
      images.push(match[1])
    }
  }

  // Extract bids (for auction items)
  let bids = 0
  const bidsMatch = markdown.match(/(\d+)\s*bids?/i)
  if (bidsMatch) {
    bids = parseInt(bidsMatch[1])
  }

  // Extract watchers
  let watchers = 0
  const watchersMatch = markdown.match(/(\d+)\s*watch(?:ers?|ing)/i)
  if (watchersMatch) {
    watchers = parseInt(watchersMatch[1])
  }

  // Check if Buy It Now
  const buyItNow = markdown.toLowerCase().includes('buy it now')

  return {
    item_id: itemId,
    title,
    price,
    currency,
    condition,
    seller,
    seller_rating: sellerRating,
    shipping_cost: shippingCost,
    location,
    images,
    category: extractCategory(markdown, title),
    description: markdown.substring(0, 500),
    bids,
    watchers,
    time_left: '',
    buy_it_now: buyItNow,
    url
  }
}

function extractEbayFromSearch(result: any, site: string): Partial<EbayProduct> {
  const url = result.url || ''
  const title = result.title || ''
  const markdown = result.markdown || ''

  const itemIdMatch = url.match(/\/itm\/(\d+)/)
  const itemId = itemIdMatch ? itemIdMatch[1] : ''

  let price = 0
  const priceMatch = markdown.match(/\$(\d+\.?\d*)/) || markdown.match(/€(\d+\.?\d*)/)
  if (priceMatch) {
    price = parseFloat(priceMatch[1])
  }

  return {
    item_id: itemId,
    title: title.replace(/\s*\|\s*eBay.*$/i, '').trim(),
    price,
    currency: 'USD',
    condition: 'Unknown',
    seller: '',
    seller_rating: 0,
    shipping_cost: 0,
    location: '',
    images: [],
    category: 'General',
    description: '',
    bids: 0,
    watchers: 0,
    time_left: '',
    buy_it_now: true,
    url
  }
}

function extractCategory(markdown: string, title: string): string {
  const categories = [
    'Electronics', 'Collectibles', 'Clothing', 'Home & Garden', 'Toys',
    'Sporting Goods', 'Motors', 'Jewelry', 'Crafts', 'Health'
  ]
  
  const lowerText = (markdown + title).toLowerCase()
  
  for (const cat of categories) {
    if (lowerText.includes(cat.toLowerCase())) {
      return cat
    }
  }
  
  return 'General'
}
