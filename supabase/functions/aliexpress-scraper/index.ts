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
  video_urls: string[]
  category: string
  tags: string[]
  supplier_name: string
  shipping_time: string
  min_order_quantity: number
  description?: string
  source_url: string
  stock_quantity?: number
  sku: string
  specifications: Record<string, string>
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
          onlyMainContent: false,
          waitFor: 5000,
        }),
      })

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text()
        console.error('[ALIEXPRESS-SCRAPER] Firecrawl error:', errorText)
        throw new Error(`Failed to scrape: ${firecrawlResponse.status}`)
      }

      const firecrawlData = await firecrawlResponse.json()
      const product = extractProductFromPage(firecrawlData, url)

      // Sauvegarder le produit avec toutes les données
      const { data: savedProduct, error: saveError } = await supabase
        .from('imported_products')
        .insert({
          user_id: user.id,
          source_platform: 'aliexpress',
          source_url: url,
          title: product.title,
          description: product.description,
          category: product.category,
          price: product.price,
          compare_at_price: product.original_price > product.price ? product.original_price : null,
          images: product.image_urls,
          sku: product.sku,
          supplier_name: product.supplier_name,
          rating: product.rating,
          review_count: product.review_count,
          shipping_time: product.shipping_time,
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
        metadata: { url, product_id: product.product_id, sku: product.sku }
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
              onlyMainContent: false,
              waitFor: 3000,
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
          title: p.title,
          description: p.description,
          category: p.category,
          price: p.price,
          compare_at_price: p.original_price > p.price ? p.original_price : null,
          images: p.image_urls,
          sku: p.sku,
          supplier_name: p.supplier_name,
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

// ============= OPTIMIZED EXTRACTION FUNCTIONS =============

// Extract price with multiple strategies
function extractAliExpressPrice(html: string, markdown: string): { price: number; originalPrice: number; discountRate: number } {
  let price = 0
  let originalPrice = 0
  let discountRate = 0

  // Strategy 1: JSON data patterns (most reliable)
  const jsonPricePatterns = [
    /"formattedActivityPrice":\s*"[€$£US\s]*([\d,\.]+)"/i,
    /"actPrice":\s*"[€$£US\s]*([\d,\.]+)"/i,
    /"minPrice":\s*"?([\d\.]+)"?/,
    /"salePrice":\s*{\s*"value":\s*"?([\d\.]+)"?/,
    /"discountPrice":\s*{\s*"value":\s*"?([\d\.]+)"?/,
    /"formattedPrice":\s*"[€$£US\s]*([\d,\.]+)"/i,
  ]

  for (const pattern of jsonPricePatterns) {
    const match = html.match(pattern)
    if (match) {
      const parsed = parseEuroPrice(match[1])
      if (parsed > 0 && parsed < 10000) {
        price = parsed
        console.log('[ALIEXPRESS] Price from JSON:', price)
        break
      }
    }
  }

  // Strategy 2: Visible price elements
  if (price === 0) {
    const visiblePatterns = [
      /class="[^"]*price[^"]*"[^>]*>[^<]*[€$£US\s]*([\d,\.]+)/i,
      /uniform-banner-box-price[^>]*>[^<]*[€$£US\s]*([\d,\.]+)/i,
      /snow-price[^>]*[€$£US\s]*([\d,\.]+)/i,
      /product-price-value[^>]*>[^<]*[€$£US\s]*([\d,\.]+)/i,
    ]

    for (const pattern of visiblePatterns) {
      const match = html.match(pattern)
      if (match) {
        const parsed = parseEuroPrice(match[1])
        if (parsed > 0 && parsed < 10000) {
          price = parsed
          console.log('[ALIEXPRESS] Price from HTML:', price)
          break
        }
      }
    }
  }

  // Strategy 3: Markdown price patterns
  if (price === 0) {
    const mdPatterns = [
      /[€$£]\s*([\d]{1,3}(?:[,\.]?\d{2,3})*(?:[,\.]\d{2})?)/,
      /US\s*\$\s*([\d,\.]+)/i,
      /([\d]+[,\.]\d{2})\s*(?:€|EUR)/i,
    ]

    for (const pattern of mdPatterns) {
      const matches = markdown.match(new RegExp(pattern, 'g')) || []
      for (const m of matches) {
        const numMatch = m.match(pattern)
        if (numMatch) {
          const parsed = parseEuroPrice(numMatch[1])
          if (parsed > 0 && parsed < 10000) {
            price = parsed
            console.log('[ALIEXPRESS] Price from markdown:', price)
            break
          }
        }
      }
      if (price > 0) break
    }
  }

  // Extract original price
  const originalPatterns = [
    /"originalPrice":\s*{\s*"value":\s*"?([\d\.]+)"?/,
    /"oriPrice":\s*"[€$£US\s]*([\d,\.]+)"/i,
    /class="[^"]*(?:original|was|del)[^"]*"[^>]*>[^<]*[€$£US\s]*([\d,\.]+)/i,
  ]

  for (const pattern of originalPatterns) {
    const match = html.match(pattern)
    if (match) {
      const parsed = parseEuroPrice(match[1])
      if (parsed > price && parsed < 50000) {
        originalPrice = parsed
        break
      }
    }
  }

  // Calculate or extract discount
  if (originalPrice > 0 && price > 0) {
    discountRate = Math.round(((originalPrice - price) / originalPrice) * 100)
  } else {
    const discountMatch = html.match(/-\s*(\d{1,2})\s*%/) || markdown.match(/-\s*(\d{1,2})\s*%/)
    if (discountMatch) {
      discountRate = parseInt(discountMatch[1])
      if (originalPrice === 0 && price > 0) {
        originalPrice = Math.round(price / (1 - discountRate / 100) * 100) / 100
      }
    }
  }

  return { price, originalPrice, discountRate }
}

// Parse price with euro/USD format handling
function parseEuroPrice(priceStr: string): number {
  if (!priceStr) return 0
  
  // Clean the string
  let clean = priceStr.replace(/[^\d,\.]/g, '')
  
  // Handle "1.234,56" (European) vs "1,234.56" (US) format
  const commaPos = clean.lastIndexOf(',')
  const dotPos = clean.lastIndexOf('.')
  
  if (commaPos > dotPos && commaPos > clean.length - 4) {
    // European format: 1.234,56 -> 1234.56
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else if (dotPos > commaPos && dotPos > clean.length - 4) {
    // US format: 1,234.56 -> 1234.56
    clean = clean.replace(/,/g, '')
  } else {
    // Ambiguous - remove non-final separators
    clean = clean.replace(/[,\.]/g, '')
  }
  
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

// Extract SKU/Model number
function extractAliExpressSKU(html: string, markdown: string, productId: string): string {
  // Strategy 1: Look for model number in product details
  const skuPatterns = [
    /(?:Model\s*(?:Number)?|Modèle|Item\s*No|SKU)[:\s]*([A-Z0-9][\w\-]{2,20})/i,
    /"skuId":\s*"(\d+)"/,
    /"skuAttr":\s*"[^"]*;(\d+)"/,
    /data-sku-id="(\d+)"/,
  ]

  for (const pattern of skuPatterns) {
    const match = html.match(pattern) || markdown.match(pattern)
    if (match && match[1] && match[1].length >= 3) {
      const sku = match[1].trim()
      // Filter out invalid SKUs (too long or just numbers)
      if (sku.length <= 20 && !/^\d{10,}$/.test(sku)) {
        console.log('[ALIEXPRESS] Found SKU:', sku)
        return sku
      }
    }
  }

  // Strategy 2: Look in specifications table
  const specMatch = html.match(/Item\s*Type[^<]*<[^>]*>([^<]+)/i) ||
                    markdown.match(/Item\s*Type[:\s]*([^\n]+)/i)
  if (specMatch && specMatch[1]) {
    const itemType = specMatch[1].trim().substring(0, 15).replace(/\s+/g, '-')
    return `AE-${itemType}`
  }

  // Fallback: Generate from product ID
  return `AE-${productId.substring(0, 10)}`
}

// Extract video URLs
function extractAliExpressVideos(html: string): string[] {
  const videos: string[] = []
  const seen = new Set<string>()

  // Strategy 1: JSON video data
  const jsonPatterns = [
    /"videoUrl":\s*"([^"]+)"/g,
    /"videoUid":\s*"([^"]+)"/g,
    /"videoId":\s*"([^"]+)"/g,
  ]

  for (const pattern of jsonPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null && videos.length < 10) {
      let url = match[1]
      
      // Convert video ID to full URL if needed
      if (!url.startsWith('http') && url.length > 10) {
        url = `https://cloud.video.taobao.com/play/u/0/p/1/e/6/t/1/${url}.mp4`
      }
      
      if (url.startsWith('http') && !seen.has(url)) {
        seen.add(url)
        videos.push(url)
        console.log('[ALIEXPRESS] Found video:', url)
      }
    }
  }

  // Strategy 2: Direct video URLs
  const directPatterns = [
    /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
    /https?:\/\/cloud\.video\.taobao\.com\/[^"'\s]+/g,
    /https?:\/\/video\.aliexpress[^"'\s]+/g,
  ]

  for (const pattern of directPatterns) {
    let match
    while ((match = pattern.exec(html)) !== null && videos.length < 10) {
      const url = match[0].replace(/["'\\]/g, '')
      if (!seen.has(url)) {
        seen.add(url)
        videos.push(url)
      }
    }
  }

  return videos
}

// Extract images
function extractAliExpressImages(html: string, markdown: string): string[] {
  const images: string[] = []
  const seen = new Set<string>()

  // Strategy 1: JSON image data
  const jsonPatterns = [
    /"imageUrl":\s*"([^"]+)"/g,
    /"imagePathList":\s*\[([^\]]+)\]/,
  ]

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern)
    if (match) {
      if (match[1] && match[1].includes(',')) {
        // Array format
        const urls = match[1].match(/"([^"]+)"/g)
        if (urls) {
          urls.forEach(u => {
            const url = u.replace(/"/g, '')
            if (url.startsWith('http') && !seen.has(url) && images.length < 15) {
              seen.add(url)
              images.push(url)
            }
          })
        }
      } else if (match[1] && match[1].startsWith('http')) {
        if (!seen.has(match[1])) {
          seen.add(match[1])
          images.push(match[1])
        }
      }
    }
  }

  // Strategy 2: HTML img tags with alicdn
  const imgPattern = /<img[^>]+src=["']([^"']+alicdn[^"']+)["']/gi
  let imgMatch
  while ((imgMatch = imgPattern.exec(html)) !== null && images.length < 15) {
    const url = imgMatch[1]
    if (!seen.has(url) && !url.includes('avatar') && !url.includes('icon')) {
      seen.add(url)
      images.push(url)
    }
  }

  // Strategy 3: Markdown images
  const mdImgPattern = /!\[[^\]]*\]\(([^)]+)\)/g
  let mdMatch
  while ((mdMatch = mdImgPattern.exec(markdown)) !== null && images.length < 15) {
    const url = mdMatch[1]
    if (url.startsWith('http') && !seen.has(url)) {
      seen.add(url)
      images.push(url)
    }
  }

  return images
}

// Extract supplier info
function extractSupplierInfo(html: string, markdown: string): { name: string; rating: number; reviewCount: number } {
  let name = 'AliExpress Seller'
  let rating = 0
  let reviewCount = 0

  // Supplier name
  const namePatterns = [
    /"storeName":\s*"([^"]+)"/,
    /"sellerName":\s*"([^"]+)"/,
    /class="[^"]*store-name[^"]*"[^>]*>([^<]+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      name = match[1].trim()
      break
    }
  }

  // Rating
  const ratingPatterns = [
    /"averageStar":\s*"?([\d\.]+)"?/,
    /"score":\s*"?([\d\.]+)"?/,
    /(\d+\.?\d*)\s*(?:étoiles?|stars?)/i,
  ]

  for (const pattern of ratingPatterns) {
    const match = html.match(pattern) || markdown.match(pattern)
    if (match) {
      const parsed = parseFloat(match[1])
      if (parsed > 0 && parsed <= 5) {
        rating = parsed
        break
      }
    }
  }

  // Review count / Orders
  const reviewPatterns = [
    /"totalReviewNum":\s*(\d+)/,
    /"tradeCount":\s*"?(\d+)"?/,
    /(\d+(?:,\d+)*)\s*(?:reviews?|avis|orders?|commandes?|sold)/i,
  ]

  for (const pattern of reviewPatterns) {
    const match = html.match(pattern) || markdown.match(pattern)
    if (match) {
      reviewCount = parseInt(match[1].replace(/,/g, ''))
      break
    }
  }

  return { name, rating, reviewCount }
}

function extractProductFromPage(firecrawlData: any, url: string): AliExpressProduct {
  const markdown = firecrawlData.data?.markdown || ''
  const html = firecrawlData.data?.html || ''
  const metadata = firecrawlData.data?.metadata || {}

  // Extract product ID from URL
  const productIdMatch = url.match(/\/item\/(\d+)\.html/) || 
                          url.match(/\/i\/(\d+)\.html/) ||
                          url.match(/\/(\d{10,})/)
  const productId = productIdMatch ? productIdMatch[1] : `ae-${Date.now()}`

  // Extract title
  let title = metadata.title || ''
  title = title.replace(/\s*[-|]\s*AliExpress.*$/i, '').trim()
  if (!title) {
    const titleMatch = markdown.match(/^#\s*(.+)$/m)
    title = titleMatch ? titleMatch[1] : 'Unknown Product'
  }

  // Extract price, SKU, videos, images using optimized functions
  const { price, originalPrice, discountRate } = extractAliExpressPrice(html, markdown)
  const sku = extractAliExpressSKU(html, markdown, productId)
  const videoUrls = extractAliExpressVideos(html)
  const imageUrls = extractAliExpressImages(html, markdown)
  const supplier = extractSupplierInfo(html, markdown)

  // Extract specifications
  const specifications: Record<string, string> = {}
  const specPattern = /"attrName":\s*"([^"]+)"[^}]*"attrValue":\s*"([^"]+)"/g
  let specMatch
  while ((specMatch = specPattern.exec(html)) !== null) {
    specifications[specMatch[1]] = specMatch[2]
  }

  console.log('[ALIEXPRESS] Extracted product:', {
    title: title.substring(0, 50),
    price,
    originalPrice,
    sku,
    images: imageUrls.length,
    videos: videoUrls.length
  })

  return {
    product_id: productId,
    title,
    price,
    original_price: originalPrice,
    discount_rate: discountRate,
    rating: supplier.rating,
    review_count: supplier.reviewCount,
    image_urls: imageUrls,
    video_urls: videoUrls,
    category: extractCategory(markdown, title),
    tags: extractTags(markdown, title),
    supplier_name: supplier.name,
    shipping_time: extractShippingTime(markdown),
    min_order_quantity: 1,
    description: markdown.substring(0, 500),
    source_url: url,
    stock_quantity: 999,
    sku,
    specifications
  }
}

function extractProductFromSearch(result: any): Partial<AliExpressProduct> {
  const url = result.url || ''
  const title = result.title || ''
  const markdown = result.markdown || ''

  let price = 0
  const priceMatch = markdown.match(/[€$£]\s*([\d,\.]+)/) || title.match(/\$\s*([\d,\.]+)/)
  if (priceMatch) {
    price = parseEuroPrice(priceMatch[1])
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
    video_urls: [],
    category: 'General',
    tags: [],
    supplier_name: 'AliExpress',
    shipping_time: '15-30 days',
    min_order_quantity: 1,
    source_url: url,
    stock_quantity: 999,
    sku: `AE-${productId.substring(0, 10)}`
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
  const shippingMatch = markdown.match(/(\d+)\s*-\s*(\d+)\s*(?:days?|jours?)/i)
  if (shippingMatch) {
    return `${shippingMatch[1]}-${shippingMatch[2]} days`
  }
  return '15-30 days'
}
