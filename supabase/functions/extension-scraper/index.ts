import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Firecrawl API key
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

// Detect platform from URL
function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('amazon.')) return 'amazon'
  if (urlLower.includes('aliexpress.')) return 'aliexpress'
  if (urlLower.includes('ebay.')) return 'ebay'
  if (urlLower.includes('temu.com')) return 'temu'
  if (urlLower.includes('shein.com') || urlLower.includes('shein.fr')) return 'shein'
  if (urlLower.includes('cjdropshipping.com')) return 'cjdropshipping'
  if (urlLower.includes('banggood.com')) return 'banggood'
  if (urlLower.includes('dhgate.com')) return 'dhgate'
  if (urlLower.includes('wish.com')) return 'wish'
  if (urlLower.includes('cdiscount.com')) return 'cdiscount'
  if (urlLower.includes('fnac.com')) return 'fnac'
  if (urlLower.includes('etsy.com')) return 'etsy'
  if (urlLower.includes('walmart.com')) return 'walmart'
  if (urlLower.includes('/products/') || urlLower.includes('.myshopify.com')) return 'shopify'
  return 'generic'
}

// Parse price from various formats
function parsePrice(priceInput: unknown): number {
  if (typeof priceInput === 'number') return priceInput
  if (!priceInput || typeof priceInput !== 'string') return 0
  
  let cleanPrice = priceInput
    .replace(/[€$£¥₹₽CHF₿฿₫₭₦₲₵₡₢₠₩₮₰₪]/gi, '')
    .replace(/\s+/g, '')
    .replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '')
    .trim()
  
  // Handle European format (1.234,56 or 1234,56)
  if (cleanPrice.includes(',') && !cleanPrice.includes('.')) {
    cleanPrice = cleanPrice.replace(',', '.')
  } else if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
    cleanPrice = cleanPrice.replace(/\./g, '').replace(',', '.')
  }
  
  const match = cleanPrice.match(/[\d]+[.,]?[\d]*/)
  if (match) {
    const parsed = parseFloat(match[0].replace(',', '.'))
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

// Validate and clean image URL
function validateImageUrl(url: unknown): string {
  if (!url || typeof url !== 'string') return ''
  
  const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 'loader', 'loading', 'spacer', '1x1', 'blank', 'empty', 'data:image', 'svg+xml', 'icon', 'logo', 'favicon', 'spinner', 'badge', 'button', 'flag']
  
  const urlLower = url.toLowerCase()
  for (const pattern of invalidPatterns) {
    if (urlLower.includes(pattern)) return ''
  }
  
  // Filter out tiny images by URL patterns
  if (/[._-](50|40|30|20|10|16|24|32|48)x/i.test(url)) return ''
  if (/SS(40|50|60|70|80|100)_/i.test(url)) return ''
  
  if (!url.startsWith('http')) {
    if (url.startsWith('//')) return 'https:' + url
    return ''
  }
  
  return url
}

// High-res image normalization for Amazon
function normalizeToHighRes(imageUrl: string, platform: string): string {
  if (!imageUrl) return ''
  
  let normalized = imageUrl
  
  if (platform === 'amazon') {
    // Convert all Amazon images to high-res SL1500 format
    normalized = normalized.replace(/_AC_[A-Z]{2}\d+_/, '_AC_SL1500_')
    normalized = normalized.replace(/_S[XYL]\d+_/, '_SL1500_')
    normalized = normalized.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.')
    normalized = normalized.replace(/\._SS\d+_\./, '._SL1500_.')
    normalized = normalized.replace(/\._SR\d+,\d+_\./, '._SL1500_.')
    normalized = normalized.replace(/\._AC_US\d+_\./, '._AC_SL1500_.')
    // Remove size constraints
    normalized = normalized.replace(/_CR\d+,\d+,\d+,\d+_/, '')
  }
  
  if (platform === 'aliexpress') {
    normalized = normalized.replace(/_\d+x\d+\./g, '.')
    normalized = normalized.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg')
    // Get original size
    normalized = normalized.replace(/_Q\d+\.jpg/g, '.jpg')
  }
  
  // Generic size transforms
  normalized = normalized.replace(/_100x100\./g, '.')
  normalized = normalized.replace(/_200x200\./g, '.')
  normalized = normalized.replace(/_300x300\./g, '.')
  
  return normalized
}

// Extract product identifier from Amazon URL
function extractAmazonProductId(url: string): string | null {
  // Match ASIN from various Amazon URL formats
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /\?.*asin=([A-Z0-9]{10})/i
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Filter Amazon images to only include product images (same ASIN)
function filterAmazonProductImages(images: string[], asin: string | null): string[] {
  if (!asin) return images
  
  return images.filter(url => {
    // Keep images that contain the ASIN
    if (url.includes(asin)) return true
    
    // Keep images from the same product path
    if (url.includes(`/images/I/`) && !url.includes('sprite') && !url.includes('logo')) {
      return true
    }
    
    return false
  })
}

// Extract Amazon variants from HTML
function extractAmazonVariants(html: string): any[] {
  const variants: any[] = []
  
  // Try to extract from colorImages or other variant data
  const colorImagesMatch = html.match(/"colorImages"\s*:\s*(\{[\s\S]*?\})\s*(?:,|$)/m)
  if (colorImagesMatch) {
    try {
      const colorData = JSON.parse(colorImagesMatch[1].replace(/'/g, '"'))
      for (const [colorName, images] of Object.entries(colorData)) {
        if (Array.isArray(images) && images.length > 0) {
          variants.push({
            name: colorName,
            type: 'color',
            image: (images[0] as any)?.hiRes || (images[0] as any)?.large || null,
            available: true
          })
        }
      }
    } catch (e) {}
  }
  
  // Try dimensionToAsinMap
  const dimensionMatch = html.match(/"dimensionToAsinMap"\s*:\s*(\{[^}]+\})/m)
  if (dimensionMatch && variants.length === 0) {
    try {
      const map = JSON.parse(dimensionMatch[1])
      for (const [key, asin] of Object.entries(map)) {
        variants.push({
          name: key,
          type: 'variant',
          sku: asin as string,
          available: true
        })
      }
    } catch (e) {}
  }
  
  // Extract size variants
  const sizeMatch = html.match(/"dimensionValuesDisplayData"\s*:\s*(\{[\s\S]*?\})\s*,/m)
  if (sizeMatch) {
    try {
      const sizeData = JSON.parse(sizeMatch[1])
      for (const [asin, values] of Object.entries(sizeData)) {
        if (Array.isArray(values)) {
          variants.push({
            sku: asin,
            name: values.join(' - '),
            type: 'size',
            available: true
          })
        }
      }
    } catch (e) {}
  }
  
  return variants
}

// Extract Amazon videos
function extractAmazonVideos(html: string): string[] {
  const videos: string[] = []
  
  // Look for video URLs in JavaScript data
  const patterns = [
    /"videoUrl"\s*:\s*"([^"]+)"/g,
    /"url"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
    /https:\/\/[^"'\s]+\.mp4/g
  ]
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const url = match[1] || match[0]
      if (url && url.includes('mp4') && !url.includes('preview') && !videos.includes(url)) {
        videos.push(url.replace(/\\u002F/g, '/').replace(/\\/g, ''))
      }
    }
  }
  
  return videos.slice(0, 10)
}

// Extract Amazon reviews summary
function extractAmazonReviews(html: string): { rating: number, count: number } {
  let rating = 0
  let count = 0
  
  // Rating
  const ratingMatch = html.match(/([0-9][.,][0-9])\s*(?:sur|out of|de)\s*5/i) ||
                       html.match(/data-hook="rating-out-of-text"[^>]*>([0-9][.,][0-9])/i)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1].replace(',', '.'))
  }
  
  // Count
  const countMatch = html.match(/(\d[\d\s,.]*)\s*(?:évaluations?|ratings?|avis|reviews?|notes?|commentaires?)/i)
  if (countMatch) {
    count = parseInt(countMatch[1].replace(/[\s,.]/g, ''), 10) || 0
  }
  
  return { rating, count }
}

// Extract brand from Amazon
function extractAmazonBrand(html: string): string {
  const brandMatch = html.match(/id="bylineInfo"[^>]*>(?:.*?)?(?:Marque\s*:\s*|Brand:\s*|Visiter le Store |Visite la tienda de |Visit the )?([^<]+)</i) ||
                      html.match(/"brand"\s*:\s*"([^"]+)"/i)
  if (brandMatch) {
    return brandMatch[1].trim().replace(/^(by|par|de)\s+/i, '')
  }
  return ''
}

// Scrape using Firecrawl with enhanced extraction
async function scrapeWithFirecrawl(url: string, requestId: string, platform: string): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    console.log(`[${requestId}] No Firecrawl API key configured`)
    return null
  }

  console.log(`[${requestId}] 🔥 Trying Firecrawl...`)
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'rawHtml'],
        waitFor: 3000,
        timeout: 45000
      })
    })

    if (!response.ok) {
      console.error(`[${requestId}] Firecrawl error: ${response.status}`)
      return null
    }

    const data = await response.json()
    
    if (!data.success || !data.data) {
      console.error(`[${requestId}] Firecrawl returned no data`)
      return null
    }

    const metadata = data.data.metadata || {}
    const markdown = data.data.markdown || ''
    const html = data.data.html || data.data.rawHtml || ''
    
    // Extract ASIN for Amazon
    const asin = platform === 'amazon' ? extractAmazonProductId(url) : null
    
    // Extract title
    let title = metadata.title || metadata.ogTitle || ''
    title = title.replace(/\|.*$/, '').replace(/-\s*Amazon.*$/i, '').replace(/:\s*Amazon.*$/i, '').trim()
    
    // Extract price
    let price = 0
    if (platform === 'amazon') {
      // Try multiple price patterns for Amazon
      const pricePatterns = [
        /class="[^"]*a-price[^"]*"[^>]*>[\s\S]*?<span[^>]*>([€$£]\s*[\d,.]+)</i,
        /"price"\s*:\s*"?([€$£]?\s*[\d,.]+)"?/i,
        /data-a-color="price"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i,
        /id="priceblock[^"]*"[^>]*>([€$£]?\s*[\d,.]+)/i,
        /class="[^"]*apexPriceToPay[^"]*"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i
      ]
      
      for (const pattern of pricePatterns) {
        const match = html.match(pattern)
        if (match) {
          price = parsePrice(match[1])
          if (price > 0) break
        }
      }
    }
    
    if (price === 0) {
      const priceMatch = markdown.match(/(?:€|EUR|\$|USD|£|GBP)\s*([\d,.]+)/) || 
                         markdown.match(/([\d,.]+)\s*(?:€|EUR|\$|USD|£|GBP)/)
      if (priceMatch) {
        price = parsePrice(priceMatch[1] || priceMatch[0])
      }
    }
    
    // Extract images - platform specific
    const images: string[] = []
    const seenImages = new Set<string>()
    
    // OG Image first
    const ogImage = validateImageUrl(metadata.ogImage)
    if (ogImage) {
      const normalized = normalizeToHighRes(ogImage, platform)
      if (!seenImages.has(normalized)) {
        images.push(normalized)
        seenImages.add(normalized)
      }
    }
    
    if (platform === 'amazon') {
      // Extract Amazon images from hiRes data
      const hiResMatches = html.matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)
      for (const match of hiResMatches) {
        const cleanUrl = validateImageUrl(match[1])
        if (cleanUrl) {
          const normalized = normalizeToHighRes(cleanUrl, platform)
          if (!seenImages.has(normalized)) {
            images.push(normalized)
            seenImages.add(normalized)
          }
        }
      }
      
      // Large images fallback
      const largeMatches = html.matchAll(/"large"\s*:\s*"([^"]+)"/g)
      for (const match of largeMatches) {
        const cleanUrl = validateImageUrl(match[1])
        if (cleanUrl) {
          const normalized = normalizeToHighRes(cleanUrl, platform)
          if (!seenImages.has(normalized)) {
            images.push(normalized)
            seenImages.add(normalized)
          }
        }
      }
    }
    
    // Extract from img tags
    const imgMatches = html.matchAll(/<img[^>]+(?:src|data-src|data-old-hires|data-a-hires)=["']([^"']+)["'][^>]*>/gi)
    for (const match of imgMatches) {
      const cleanUrl = validateImageUrl(match[1])
      if (cleanUrl && cleanUrl.length > 50) {
        const normalized = normalizeToHighRes(cleanUrl, platform)
        if (!seenImages.has(normalized)) {
          images.push(normalized)
          seenImages.add(normalized)
        }
      }
    }
    
    // Filter for correct product (Amazon)
    const filteredImages = platform === 'amazon' ? filterAmazonProductImages(images, asin) : images
    
    // Extract variants
    const variants = platform === 'amazon' ? extractAmazonVariants(html) : []
    
    // Extract videos
    const videos = platform === 'amazon' ? extractAmazonVideos(html) : []
    
    // Extract reviews info
    const reviewsInfo = platform === 'amazon' ? extractAmazonReviews(html) : { rating: 0, count: 0 }
    
    // Extract brand
    const brand = platform === 'amazon' ? extractAmazonBrand(html) : ''
    
    // Extract description
    let description = metadata.description || metadata.ogDescription || ''
    
    // Extract SKU/model number
    let sku = asin || ''
    const modelMatch = html.match(/(?:Modèle|Model|Référence|Item model number)[^\w]*:?\s*([A-Z0-9-]{5,20})/i)
    if (modelMatch) {
      sku = modelMatch[1]
    }
    
    console.log(`[${requestId}] ✅ Product: ${title.substring(0, 50)} | Images: ${filteredImages.length} | Variants: ${variants.length} | Videos: ${videos.length}`)
    
    return {
      title: title.substring(0, 500),
      price,
      description: description.substring(0, 5000),
      images: filteredImages.slice(0, 30),
      variants,
      videos,
      brand,
      sku,
      rating: reviewsInfo.rating,
      reviews_count: reviewsInfo.count,
      source_url: url
    }
  } catch (error) {
    console.error(`[${requestId}] Firecrawl exception:`, error)
    return null
  }
}

// Scrape using direct fetch + JSON-LD
async function scrapeWithFetch(url: string, requestId: string, platform: string): Promise<any> {
  console.log(`[${requestId}] 📡 Trying direct fetch...`)
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
      }
    })

    if (!response.ok) {
      console.error(`[${requestId}] Fetch error: ${response.status}`)
      return null
    }

    const html = await response.text()
    const asin = platform === 'amazon' ? extractAmazonProductId(url) : null
    
    // Try JSON-LD first
    const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonContent = match.replace(/<\/?script[^>]*>/gi, '').trim()
          const data = JSON.parse(jsonContent)
          
          // Find product schema
          const product = data['@type'] === 'Product' ? data :
                         (Array.isArray(data['@graph']) ? data['@graph'].find((i: any) => i['@type'] === 'Product') : null)
          
          if (product) {
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
            let images = Array.isArray(product.image) ? product.image : (product.image ? [product.image] : [])
            images = images.map((img: string) => normalizeToHighRes(validateImageUrl(img), platform)).filter(Boolean)
            
            // Filter for correct product
            if (platform === 'amazon' && asin) {
              images = filterAmazonProductImages(images, asin)
            }
            
            const variants = platform === 'amazon' ? extractAmazonVariants(html) : []
            const videos = platform === 'amazon' ? extractAmazonVideos(html) : []
            const reviewsInfo = platform === 'amazon' ? extractAmazonReviews(html) : { rating: 0, count: 0 }
            
            console.log(`[${requestId}] ✅ Product: ${product.name?.substring(0, 50)} (json-ld) | Images: ${images.length}`)
            
            return {
              title: (product.name || '').substring(0, 500),
              price: parsePrice(offer?.price || offer?.lowPrice || 0),
              description: (product.description || '').substring(0, 5000),
              images: images.slice(0, 30),
              sku: product.sku || asin || offer?.sku || '',
              brand: typeof product.brand === 'string' ? product.brand : product.brand?.name || '',
              variants,
              videos,
              rating: reviewsInfo.rating,
              reviews_count: reviewsInfo.count,
              source_url: url
            }
          }
        } catch (e) {
          // Continue to next JSON-LD block
        }
      }
    }
    
    // Fallback: extract from meta tags
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]
    
    if (ogTitle) {
      const variants = platform === 'amazon' ? extractAmazonVariants(html) : []
      const videos = platform === 'amazon' ? extractAmazonVideos(html) : []
      
      console.log(`[${requestId}] ✅ Product: ${ogTitle.substring(0, 50)} (meta tags)`)
      
      return {
        title: ogTitle.substring(0, 500),
        price: 0,
        description: (ogDescription || '').substring(0, 5000),
        images: ogImage ? [normalizeToHighRes(validateImageUrl(ogImage), platform)] : [],
        variants,
        videos,
        source_url: url
      }
    }
    
    return null
  } catch (error) {
    console.error(`[${requestId}] Fetch exception:`, error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const requestId = `scr_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`

  try {
    console.log(`[${requestId}] 🔄 Extension scraper request`)
    
    // Get token from header
    const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')
    
    if (!token || token.length < 10) {
      console.error(`[${requestId}] No valid token provided`)
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] 🔑 Validating extension token...`)
    
    // Validate token
    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !authData) {
      console.error(`[${requestId}] Token validation failed:`, tokenError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check expiration
    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] ✅ Authenticated user: ${authData.user_id}`)
    
    const body = await req.json()
    const { action, url, productData: clientProductData } = body
    
    if (action !== 'scrape_and_import' || !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action ou URL manquante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] 🔍 Scraping: ${url}`)
    
    const platform = detectPlatform(url)
    
    // Use client-provided data if available and complete, otherwise scrape
    let productData = clientProductData
    
    if (!productData || !productData.title || productData.images?.length === 0) {
      // Try Firecrawl first, then fallback to direct fetch
      productData = await scrapeWithFirecrawl(url, requestId, platform)
      
      if (!productData || !productData.title) {
        productData = await scrapeWithFetch(url, requestId, platform)
      }
    } else {
      console.log(`[${requestId}] 📦 Using client-provided product data`)
      // Normalize client images
      if (productData.images) {
        productData.images = productData.images.map((img: string) => normalizeToHighRes(img, platform))
      }
    }
    
    if (!productData || !productData.title) {
      console.error(`[${requestId}] Failed to extract product data`)
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible d\'extraire les données du produit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into imported_products with all extracted data
    const { data: insertedProduct, error: insertError } = await supabase
      .from('imported_products')
      .insert({
        user_id: authData.user_id,
        name: productData.title,
        description: productData.description || '',
        price: productData.price || 0,
        cost_price: productData.price ? productData.price * 0.7 : 0,
        currency: productData.currency || 'EUR',
        sku: productData.sku || `IMP-${Date.now()}`,
        image_urls: productData.images || [],
        source_url: url,
        source_platform: platform,
        status: 'draft',
        sync_status: 'synced',
        stock_quantity: 100,
        video_urls: productData.videos || [],
        metadata: {
          imported_via: 'chrome_extension',
          imported_at: new Date().toISOString(),
          brand: productData.brand || null,
          rating: productData.rating || null,
          reviews_count: productData.reviews_count || 0,
          variants_count: productData.variants?.length || 0,
          has_videos: (productData.videos?.length || 0) > 0
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error(`[${requestId}] Insert error:`, insertError)
      return new Response(
        JSON.stringify({ success: false, error: `Erreur base de données: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert variants if present
    let variantsInserted = 0
    if (productData.variants && productData.variants.length > 0) {
      const variantsToInsert = productData.variants.map((variant: any, idx: number) => ({
        product_id: insertedProduct.id,
        name: variant.name || variant.title || `Variant ${idx + 1}`,
        sku: variant.sku || `${insertedProduct.sku}-V${idx + 1}`,
        price: variant.price || productData.price || 0,
        stock_quantity: variant.stock || 100,
        attributes: {
          type: variant.type || 'option',
          image: variant.image || null,
          available: variant.available !== false,
          options: variant.options || {}
        },
        is_active: variant.available !== false
      }))

      try {
        const { data: insertedVariants, error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)
          .select('id')

        if (variantsError) {
          console.warn(`[${requestId}] Variants insert warning:`, variantsError.message)
        } else {
          variantsInserted = insertedVariants?.length || 0
          console.log(`[${requestId}] ✅ ${variantsInserted} variants inserted`)
        }
      } catch (e) {
        console.warn(`[${requestId}] Variants insert exception:`, e)
      }
    }

    // Insert reviews placeholder if we have review info
    if (productData.reviews_count > 0 || productData.rating > 0) {
      try {
        await supabase.from('product_reviews').insert({
          product_id: insertedProduct.id,
          author_name: 'Amazon Reviews Summary',
          rating: productData.rating || 5,
          content: `Ce produit a ${productData.reviews_count || 0} avis avec une note moyenne de ${productData.rating || 0}/5 étoiles.`,
          is_verified: true,
          metadata: {
            source: platform,
            average_rating: productData.rating,
            total_reviews: productData.reviews_count
          }
        })
      } catch (e) {
        console.warn(`[${requestId}] Reviews insert warning:`, e)
      }
    }

    // Update token usage
    await supabase
      .from('extension_auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', authData.id)

    // Log analytics (never fail the import if analytics insert fails)
    try {
      await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'product_import',
        event_data: {
          product_id: insertedProduct.id,
          title: productData.title.substring(0, 100),
          platform,
          price: productData.price,
          images_count: productData.images?.length || 0,
          variants_count: variantsInserted,
          videos_count: productData.videos?.length || 0
        },
        source_url: url,
      })
    } catch (e) {
      console.warn(`[${requestId}] Analytics insert exception:`, e)
    }

    console.log(`[${requestId}] ✅ Product imported: ${insertedProduct.id} | Variants: ${variantsInserted} | Images: ${productData.images?.length || 0} | Videos: ${productData.videos?.length || 0}`)

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: insertedProduct.id,
          name: insertedProduct.name,
          price: insertedProduct.price,
          status: insertedProduct.status,
          variants_count: variantsInserted,
          images_count: productData.images?.length || 0,
          videos_count: productData.videos?.length || 0,
          rating: productData.rating || null,
          reviews_count: productData.reviews_count || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
