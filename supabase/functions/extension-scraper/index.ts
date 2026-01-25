import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Firecrawl API key
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

function parsePrice(priceInput: unknown): number {
  if (typeof priceInput === 'number') return priceInput
  if (!priceInput || typeof priceInput !== 'string') return 0
  
  let cleanPrice = priceInput
    .replace(/[€$£¥₹₽CHF₿฿₫₭₦₲₵₡₢₠₩₮₰₪]/gi, '')
    .replace(/\s+/g, '')
    .replace(/EUR|USD|GBP|JPY|CNY|CAD|AUD/gi, '')
    .trim()
  
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

function validateImageUrl(url: unknown): string {
  if (!url || typeof url !== 'string') return ''
  
  const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 'loader', 'loading', 'spacer', '1x1', 'blank', 'empty', 'data:image', 'svg+xml', 'icon', 'logo', 'favicon', 'spinner', 'badge', 'button', 'flag', 'nav-', 'menu-', 'header-', 'footer-']
  
  const urlLower = url.toLowerCase()
  for (const pattern of invalidPatterns) {
    if (urlLower.includes(pattern)) return ''
  }
  
  if (/[._-](50|40|30|20|10|16|24|32|48)x/i.test(url)) return ''
  if (/SS(40|50|60|70|80|100)_/i.test(url)) return ''
  
  if (!url.startsWith('http')) {
    if (url.startsWith('//')) return 'https:' + url
    return ''
  }
  
  return url
}

// ============================================
// HIGH-RES IMAGE NORMALIZATION (ENHANCED)
// ============================================

function normalizeToHighRes(imageUrl: string, platform: string): string {
  if (!imageUrl) return ''
  
  let normalized = imageUrl
  
  if (platform === 'amazon') {
    // Convert ALL Amazon images to maximum resolution SL1500
    normalized = normalized.replace(/_AC_[A-Z]{2}\d+_/g, '_AC_SL1500_')
    normalized = normalized.replace(/_S[XYL]\d+_/g, '_SL1500_')
    normalized = normalized.replace(/\._[A-Z]{2}\d+_\./g, '._SL1500_.')
    normalized = normalized.replace(/\._SS\d+_\./g, '._SL1500_.')
    normalized = normalized.replace(/\._SR\d+,\d+_\./g, '._SL1500_.')
    normalized = normalized.replace(/\._AC_US\d+_\./g, '._AC_SL1500_.')
    normalized = normalized.replace(/\._UX\d+_\./g, '._SL1500_.')
    normalized = normalized.replace(/\._UY\d+_\./g, '._SL1500_.')
    normalized = normalized.replace(/_CR\d+,\d+,\d+,\d+_/g, '')
    normalized = normalized.replace(/_SY\d+_/g, '_SL1500_')
    normalized = normalized.replace(/_SX\d+_/g, '_SL1500_')
    // Remove any remaining size constraints
    normalized = normalized.replace(/\._[A-Z]+\d+[_,]\d*_?\./g, '._SL1500_.')
  }
  
  if (platform === 'aliexpress') {
    // Remove all size transforms to get original
    normalized = normalized.replace(/_\d+x\d+\./g, '.')
    normalized = normalized.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg')
    normalized = normalized.replace(/_Q\d+\.jpg/g, '.jpg')
    normalized = normalized.replace(/\?.*$/g, '') // Remove query params
    // Ensure https
    if (normalized.startsWith('//')) normalized = 'https:' + normalized
  }
  
  if (platform === 'shopify') {
    // Remove Shopify CDN size transforms
    normalized = normalized.replace(/_\d+x\d*\./g, '.')
    normalized = normalized.replace(/_[a-z]+\.(?=jpg|png|webp)/gi, '.')
    normalized = normalized.replace(/\?.*$/g, '') // Remove query params
  }
  
  // Generic size transform removal
  normalized = normalized.replace(/_100x100\./g, '.')
  normalized = normalized.replace(/_200x200\./g, '.')
  normalized = normalized.replace(/_300x300\./g, '.')
  normalized = normalized.replace(/_400x400\./g, '.')
  normalized = normalized.replace(/_500x500\./g, '.')
  
  return normalized
}

// ============================================
// AMAZON EXTRACTION (ENHANCED)
// ============================================

function extractAmazonProductId(url: string): string | null {
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

function filterAmazonProductImages(images: string[], asin: string | null): string[] {
  if (!asin) return images
  
  return images.filter(url => {
    if (url.includes(asin)) return true
    if (url.includes(`/images/I/`) && !url.includes('sprite') && !url.includes('logo')) {
      return true
    }
    return false
  })
}

// Extract ALL Amazon variants with prices and stock
function extractAmazonVariantsEnhanced(html: string): any[] {
  const variants: any[] = []
  const seenVariants = new Set<string>()
  
  // Strategy 1: colorImages with hiRes
  const colorImagesMatch = html.match(/'colorImages'\s*:\s*(\{[\s\S]*?\})\s*,\s*'/m) ||
                           html.match(/"colorImages"\s*:\s*(\{[\s\S]*?\})\s*(?:,|})/m)
  if (colorImagesMatch) {
    try {
      const colorData = JSON.parse(colorImagesMatch[1].replace(/'/g, '"'))
      for (const [colorName, images] of Object.entries(colorData)) {
        const key = `color:${colorName}`
        if (!seenVariants.has(key) && Array.isArray(images) && images.length > 0) {
          seenVariants.add(key)
          variants.push({
            name: colorName,
            type: 'color',
            image: (images[0] as any)?.hiRes || (images[0] as any)?.large || null,
            images: (images as any[]).slice(0, 5).map(i => i.hiRes || i.large).filter(Boolean),
            available: true
          })
        }
      }
    } catch (e) {}
  }
  
  // Strategy 2: dimensionToAsinMap for variant ASINs
  const dimensionMatch = html.match(/"dimensionToAsinMap"\s*:\s*(\{[^}]+\})/m)
  if (dimensionMatch) {
    try {
      const map = JSON.parse(dimensionMatch[1])
      for (const [key, asin] of Object.entries(map)) {
        const variantKey = `asin:${asin}`
        if (!seenVariants.has(variantKey)) {
          seenVariants.add(variantKey)
          variants.push({
            name: key.replace(/ /g, ' - '),
            type: 'variant',
            sku: asin as string,
            available: true
          })
        }
      }
    } catch (e) {}
  }
  
  // Strategy 3: dimensionValuesDisplayData for size/option combinations
  const displayDataMatch = html.match(/"dimensionValuesDisplayData"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/m)
  if (displayDataMatch) {
    try {
      const sizeData = JSON.parse(displayDataMatch[1])
      for (const [asin, values] of Object.entries(sizeData)) {
        if (Array.isArray(values)) {
          const key = `display:${asin}`
          if (!seenVariants.has(key)) {
            seenVariants.add(key)
            variants.push({
              sku: asin,
              name: values.join(' - '),
              type: 'option',
              available: true
            })
          }
        }
      }
    } catch (e) {}
  }
  
  // Strategy 4: asinVariationValues for detailed variant data with prices
  const variationValuesMatch = html.match(/"asinVariationValues"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/m)
  if (variationValuesMatch) {
    try {
      const variationData = JSON.parse(variationValuesMatch[1])
      for (const [asin, data] of Object.entries(variationData)) {
        const varData = data as any
        const key = `variation:${asin}`
        if (!seenVariants.has(key)) {
          seenVariants.add(key)
          variants.push({
            sku: asin,
            name: varData.title || asin,
            type: 'variant',
            price: parsePrice(varData.priceAmount),
            image: varData.mainImageUrl || null,
            available: varData.availability !== 'OUT_OF_STOCK'
          })
        }
      }
    } catch (e) {}
  }
  
  // Strategy 5: twisterSlotData for comprehensive variant info
  const twisterMatch = html.match(/"twisterSlotData"\s*:\s*(\{[\s\S]*?\})\s*,\s*"/m)
  if (twisterMatch) {
    try {
      const twisterData = JSON.parse(twisterMatch[1])
      if (twisterData.variations) {
        for (const variation of twisterData.variations) {
          const key = `twister:${variation.asin || variation.id}`
          if (!seenVariants.has(key)) {
            seenVariants.add(key)
            variants.push({
              sku: variation.asin || variation.id,
              name: variation.title || variation.name || 'Variant',
              type: 'product',
              price: parsePrice(variation.price),
              stock: variation.stockLevel,
              available: variation.isAvailable !== false
            })
          }
        }
      }
    } catch (e) {}
  }
  
  return variants
}

// Extract ALL Amazon videos
function extractAmazonVideosEnhanced(html: string): string[] {
  const videos: string[] = []
  const seenVideos = new Set<string>()
  
  const patterns = [
    /"videoUrl"\s*:\s*"([^"]+)"/g,
    /"url"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
    /"manifest"\s*:\s*"([^"]+\.m3u8[^"]*)"/g,
    /https:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
    /"hlsUrl"\s*:\s*"([^"]+)"/g,
    /"dashUrl"\s*:\s*"([^"]+)"/g
  ]
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      let url = (match[1] || match[0])
        .replace(/\\u002F/g, '/')
        .replace(/\\/g, '')
      
      // Skip preview/thumbnail videos
      if (url.includes('preview') || url.includes('thumb') || url.includes('poster')) continue
      
      if (!seenVideos.has(url) && (url.includes('.mp4') || url.includes('.m3u8'))) {
        seenVideos.add(url)
        videos.push(url)
      }
    }
  }
  
  // Also check for video IDs to construct URLs
  const videoIdMatch = html.match(/"videoId"\s*:\s*"([^"]+)"/g)
  if (videoIdMatch) {
    // Amazon video IDs can be used to construct streaming URLs
    console.log(`Found ${videoIdMatch.length} video IDs`)
  }
  
  return videos.slice(0, 20)
}

// Extract DETAILED Amazon reviews (not just summary)
function extractAmazonReviewsEnhanced(html: string): { rating: number, count: number, reviews: any[], distribution: any } {
  let rating = 0
  let count = 0
  const reviews: any[] = []
  const distribution: any = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  
  // Rating
  const ratingPatterns = [
    /([0-9][.,][0-9])\s*(?:sur|out of|de)\s*5/i,
    /data-hook="rating-out-of-text"[^>]*>([0-9][.,][0-9])/i,
    /"aggregateRating"[^}]*"ratingValue"\s*:\s*"?([0-9.]+)"?/i,
    /class="[^"]*averageStarRating[^"]*"[^>]*>([0-9][.,][0-9])/i
  ]
  
  for (const pattern of ratingPatterns) {
    const match = html.match(pattern)
    if (match) {
      rating = parseFloat(match[1].replace(',', '.'))
      if (rating > 0) break
    }
  }
  
  // Count
  const countPatterns = [
    /(\d[\d\s,.]*)\s*(?:évaluations?|ratings?|avis|reviews?|notes?|commentaires?|global)/i,
    /"reviewCount"\s*:\s*"?(\d+)"?/i,
    /"ratingCount"\s*:\s*"?(\d+)"?/i
  ]
  
  for (const pattern of countPatterns) {
    const match = html.match(pattern)
    if (match) {
      count = parseInt(match[1].replace(/[\s,.]/g, ''), 10) || 0
      if (count > 0) break
    }
  }
  
  // Rating distribution (percentage bars)
  const distPatterns = [
    /(\d+)%\s*(?:de|of)?\s*(?:5|cinq|five)\s*(?:étoiles?|stars?)/gi,
    /5\s*(?:étoiles?|stars?)[^%]*(\d+)%/gi
  ]
  
  for (let star = 5; star >= 1; star--) {
    const regex = new RegExp(`${star}\\s*(?:étoiles?|stars?)[^%]*?(\\d+)%|aria-label="[^"]*${star}[^"]*"[^>]*>\\s*(\\d+)%`, 'i')
    const match = html.match(regex)
    if (match) {
      distribution[star.toString()] = parseInt(match[1] || match[2], 10)
    }
  }
  
  // Extract individual reviews (top reviews section)
  const reviewMatches = html.matchAll(/data-hook="review"[^>]*>([\s\S]*?)(?=data-hook="review"|<\/div>\s*<\/div>\s*<\/div>\s*$)/gi)
  
  for (const match of reviewMatches) {
    const reviewHtml = match[1]
    
    // Extract review rating
    const reviewRatingMatch = reviewHtml.match(/([1-5])[.,]?0?\s*(?:sur|out of|de)\s*5/i) ||
                              reviewHtml.match(/a-icon-star-[^"]*"[^>]*><span[^>]*>([1-5])/i)
    
    // Extract review title
    const titleMatch = reviewHtml.match(/data-hook="review-title"[^>]*>[\s\S]*?<span[^>]*>([^<]+)</i) ||
                       reviewHtml.match(/review-title[^>]*>([^<]+)</i)
    
    // Extract review body
    const bodyMatch = reviewHtml.match(/data-hook="review-body"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i) ||
                      reviewHtml.match(/review-text[^>]*>([\s\S]*?)<\/(?:span|div)/i)
    
    // Extract reviewer name
    const authorMatch = reviewHtml.match(/profile-name[^>]*>([^<]+)</i) ||
                        reviewHtml.match(/a-profile-name[^>]*>([^<]+)</i)
    
    // Extract date
    const dateMatch = reviewHtml.match(/data-hook="review-date"[^>]*>([^<]+)</i) ||
                      reviewHtml.match(/review-date[^>]*>([^<]+)</i)
    
    // Extract verified purchase
    const isVerified = /avp-badge|verified/i.test(reviewHtml)
    
    if (titleMatch || bodyMatch) {
      reviews.push({
        rating: reviewRatingMatch ? parseInt(reviewRatingMatch[1], 10) : 5,
        title: (titleMatch?.[1] || '').trim().substring(0, 200),
        content: (bodyMatch?.[1] || '').replace(/<[^>]+>/g, '').trim().substring(0, 2000),
        author: (authorMatch?.[1] || 'Anonymous').trim(),
        date: (dateMatch?.[1] || '').trim(),
        verified: isVerified
      })
    }
    
    if (reviews.length >= 50) break
  }
  
  return { rating, count, reviews, distribution }
}

function extractAmazonBrand(html: string): string {
  const patterns = [
    /id="bylineInfo"[^>]*>(?:.*?)?(?:Marque\s*:\s*|Brand:\s*|Visiter le Store |Visit the )?([^<]+)</i,
    /"brand"\s*:\s*"([^"]+)"/i,
    /id="brand"[^>]*>([^<]+)</i,
    /"byline"[^>]*>([^<]+)</i
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) {
      return match[1].trim().replace(/^(by|par|de)\s+/i, '').substring(0, 100)
    }
  }
  return ''
}

// Complete Amazon extraction
function extractAmazonProduct(html: string, metadata: any, url: string, requestId: string): any {
  const asin = extractAmazonProductId(url)
  
  let title = metadata.title || metadata.ogTitle || ''
  title = title.replace(/\|.*$/, '').replace(/-\s*Amazon.*$/i, '').replace(/:\s*Amazon.*$/i, '').trim()
  
  // Price extraction - multiple strategies
  let price = 0
  let compareAtPrice = 0
  
  const pricePatterns = [
    /class="[^"]*a-price[^"]*"[^>]*>[\s\S]*?<span[^>]*>([€$£]\s*[\d,.]+)</i,
    /"price"\s*:\s*"?([€$£]?\s*[\d,.]+)"?/i,
    /id="priceblock[^"]*"[^>]*>([€$£]?\s*[\d,.]+)/i,
    /class="[^"]*apexPriceToPay[^"]*"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i,
    /class="[^"]*priceToPay[^"]*"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i,
    /data-a-color="price"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i,
    /"lowPrice"\s*:\s*"?([0-9.]+)"?/i
  ]
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match) {
      price = parsePrice(match[1])
      if (price > 0) break
    }
  }
  
  // Compare at price (was price)
  const wasMatch = html.match(/class="[^"]*a-text-strike[^"]*"[^>]*>([€$£]?\s*[\d,.]+)/i) ||
                   html.match(/class="[^"]*basisPrice[^"]*"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i)
  if (wasMatch) {
    compareAtPrice = parsePrice(wasMatch[1])
  }
  
  // Images - get ALL high-res images
  const images: string[] = []
  const seenImages = new Set<string>()
  
  // OG Image first
  const ogImage = validateImageUrl(metadata.ogImage)
  if (ogImage) {
    const normalized = normalizeToHighRes(ogImage, 'amazon')
    if (!seenImages.has(normalized)) {
      images.push(normalized)
      seenImages.add(normalized)
    }
  }
  
  // hiRes images (highest priority)
  const hiResMatches = html.matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)
  for (const match of hiResMatches) {
    const cleanUrl = validateImageUrl(match[1])
    if (cleanUrl) {
      const normalized = normalizeToHighRes(cleanUrl, 'amazon')
      if (!seenImages.has(normalized)) {
        images.push(normalized)
        seenImages.add(normalized)
      }
    }
  }
  
  // Large images (fallback)
  const largeMatches = html.matchAll(/"large"\s*:\s*"([^"]+)"/g)
  for (const match of largeMatches) {
    const cleanUrl = validateImageUrl(match[1])
    if (cleanUrl) {
      const normalized = normalizeToHighRes(cleanUrl, 'amazon')
      if (!seenImages.has(normalized)) {
        images.push(normalized)
        seenImages.add(normalized)
      }
    }
  }
  
  // Main images from imageGalleryData
  const galleryMatch = html.match(/"imageGalleryData"\s*:\s*\[([\s\S]*?)\]/m)
  if (galleryMatch) {
    const imgMatches = galleryMatch[1].matchAll(/"mainUrl"\s*:\s*"([^"]+)"/g)
    for (const match of imgMatches) {
      const cleanUrl = validateImageUrl(match[1])
      if (cleanUrl) {
        const normalized = normalizeToHighRes(cleanUrl, 'amazon')
        if (!seenImages.has(normalized)) {
          images.push(normalized)
          seenImages.add(normalized)
        }
      }
    }
  }
  
  const filteredImages = filterAmazonProductImages(images, asin)
  const variants = extractAmazonVariantsEnhanced(html)
  const videos = extractAmazonVideosEnhanced(html)
  const reviewsInfo = extractAmazonReviewsEnhanced(html)
  const brand = extractAmazonBrand(html)
  
  // SKU - prefer model number
  let sku = asin || ''
  const modelPatterns = [
    /(?:Modèle|Model|Référence|Item model number|Numéro de modèle)[^\w]*:?\s*([A-Z0-9-]{5,30})/i,
    /(?:MPN|Part Number|Numéro de pièce)[^\w]*:?\s*([A-Z0-9-]{5,30})/i
  ]
  
  for (const pattern of modelPatterns) {
    const match = html.match(pattern)
    if (match) {
      sku = match[1]
      break
    }
  }
  
  // Stock status
  let stockQuantity = 100
  const stockPatterns = [
    /En stock/i,
    /In Stock/i,
    /Disponible/i,
    /(\d+)\s*(?:en stock|disponibles?|left in stock|available)/i
  ]
  
  const outOfStockPatterns = [
    /Rupture de stock/i,
    /Out of Stock/i,
    /Indisponible/i,
    /Currently unavailable/i
  ]
  
  for (const pattern of outOfStockPatterns) {
    if (pattern.test(html)) {
      stockQuantity = 0
      break
    }
  }
  
  const stockMatch = html.match(/(\d+)\s*(?:en stock|disponibles?|left in stock|available)/i)
  if (stockMatch) {
    stockQuantity = parseInt(stockMatch[1], 10)
  }
  
  console.log(`[${requestId}] ✅ Amazon: ${title.substring(0, 50)} | Images: ${filteredImages.length} | Variants: ${variants.length} | Videos: ${videos.length} | Reviews: ${reviewsInfo.reviews.length}`)
  
  return {
    title: title.substring(0, 500),
    price,
    compare_at_price: compareAtPrice > price ? compareAtPrice : null,
    description: (metadata.description || metadata.ogDescription || '').substring(0, 5000),
    images: filteredImages.slice(0, 50),
    variants,
    videos,
    brand,
    sku,
    stock_quantity: stockQuantity,
    rating: reviewsInfo.rating,
    reviews_count: reviewsInfo.count,
    reviews: reviewsInfo.reviews,
    reviews_distribution: reviewsInfo.distribution,
    source_url: url
  }
}

// ============================================
// ALIEXPRESS EXTRACTION (ENHANCED)
// ============================================

function extractAliExpressProduct(html: string, metadata: any, url: string, requestId: string): any {
  let title = metadata.title || metadata.ogTitle || ''
  title = title.replace(/\|.*$/, '').replace(/-.*AliExpress.*$/i, '').trim()
  
  // Price extraction - comprehensive strategies
  let price = 0
  let minPrice = 0
  let maxPrice = 0
  
  const pricePatterns = [
    /"formatedActivityPrice"\s*:\s*"([^"]+)"/i,
    /"formatedPrice"\s*:\s*"([^"]+)"/i,
    /"minPrice"\s*:\s*"?(\d+\.?\d*)"/i,
    /"maxPrice"\s*:\s*"?(\d+\.?\d*)"/i,
    /"discountPrice"\s*:\s*"?(\d+\.?\d*)"/i,
    /"salePrice"\s*:\s*"?(\d+\.?\d*)"/i,
    /US\s*\$\s*([\d,.]+)/i,
    /EUR\s*([\d,.]+)/i,
    /class="[^"]*product-price[^"]*"[^>]*>[\s\S]*?([€$]\s*[\d,.]+)/i
  ]
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match) {
      const parsed = parsePrice(match[1])
      if (parsed > 0 && price === 0) price = parsed
    }
  }
  
  // Min/Max prices
  const minMatch = html.match(/"minPrice"\s*:\s*"?(\d+\.?\d*)"/i)
  const maxMatch = html.match(/"maxPrice"\s*:\s*"?(\d+\.?\d*)"/i)
  if (minMatch) minPrice = parsePrice(minMatch[1])
  if (maxMatch) maxPrice = parsePrice(maxMatch[1])
  if (minPrice > 0 && price === 0) price = minPrice
  
  // Images - comprehensive extraction
  const images: string[] = []
  const seenImages = new Set<string>()
  
  // OG Image
  const ogImage = validateImageUrl(metadata.ogImage)
  if (ogImage) {
    const normalized = normalizeToHighRes(ogImage, 'aliexpress')
    if (!seenImages.has(normalized)) {
      images.push(normalized)
      seenImages.add(normalized)
    }
  }
  
  // imagePathList (main product images)
  const imageListPatterns = [
    /"imagePathList"\s*:\s*\[([\s\S]*?)\]/i,
    /"imageBigViewURL"\s*:\s*\[([\s\S]*?)\]/i,
    /"productImagePathList"\s*:\s*\[([\s\S]*?)\]/i
  ]
  
  for (const pattern of imageListPatterns) {
    const match = html.match(pattern)
    if (match) {
      const imageUrls = match[1].matchAll(/"([^"]+\.(?:jpg|png|jpeg|webp)[^"]*)"/gi)
      for (const imgMatch of imageUrls) {
        const cleanUrl = validateImageUrl(imgMatch[1].replace(/\\/g, ''))
        if (cleanUrl) {
          const normalized = normalizeToHighRes(cleanUrl, 'aliexpress')
          if (!seenImages.has(normalized)) {
            images.push(normalized)
            seenImages.add(normalized)
          }
        }
      }
    }
  }
  
  // Variants with price and stock
  const variants: any[] = []
  const seenVariants = new Set<string>()
  
  // skuPropertyList extraction
  const skuMatch = html.match(/"skuPropertyList"\s*:\s*(\[[\s\S]*?\])\s*(?:,|$)/m)
  if (skuMatch) {
    try {
      const skuData = JSON.parse(skuMatch[1])
      for (const skuProp of skuData) {
        const propName = skuProp.skuPropertyName || 'Option'
        for (const value of (skuProp.skuPropertyValues || [])) {
          const variantKey = `${propName}:${value.propertyValueDisplayName || value.propertyValueId}`
          if (!seenVariants.has(variantKey)) {
            seenVariants.add(variantKey)
            
            // Get image for this variant
            let variantImage = value.skuPropertyImagePath || null
            if (variantImage) {
              variantImage = normalizeToHighRes(variantImage.replace(/\\/g, ''), 'aliexpress')
            }
            
            variants.push({
              name: `${propName}: ${value.propertyValueDisplayName || value.propertyValueName || ''}`,
              type: propName.toLowerCase().includes('color') ? 'color' : 
                    propName.toLowerCase().includes('size') ? 'size' : 'option',
              sku: value.skuPropertyValueId?.toString() || '',
              image: variantImage,
              available: true
            })
          }
        }
      }
    } catch (e) {}
  }
  
  // skuPriceList for prices per variant
  const priceListMatch = html.match(/"skuPriceList"\s*:\s*(\[[\s\S]*?\])\s*(?:,|$)/m)
  if (priceListMatch) {
    try {
      const priceList = JSON.parse(priceListMatch[1])
      for (const priceItem of priceList) {
        const skuId = priceItem.skuId || priceItem.skuAttr
        const variant = variants.find(v => v.sku === skuId?.toString())
        if (variant) {
          variant.price = parsePrice(priceItem.skuVal?.skuActivityAmount?.value || 
                                     priceItem.skuVal?.skuAmount?.value || 0)
          variant.stock = priceItem.skuVal?.availQuantity || 100
        }
      }
    } catch (e) {}
  }
  
  // Videos
  const videos: string[] = []
  const videoPatterns = [
    /"videoUrl"\s*:\s*"([^"]+)"/gi,
    /"videoId"\s*:\s*"([^"]+)"/gi,
    /https:\/\/[^"'\s]+\.mp4[^"'\s]*/gi
  ]
  
  for (const pattern of videoPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const url = (match[1] || match[0]).replace(/\\/g, '')
      if (url.includes('.mp4') || url.includes('video')) {
        if (!videos.includes(url)) videos.push(url)
      }
    }
  }
  
  // Reviews
  let rating = 0
  let reviewsCount = 0
  const reviews: any[] = []
  
  const ratingMatch = html.match(/"averageStarRate"\s*:\s*"?(\d+\.?\d*)"/i) ||
                      html.match(/"evarageStar"\s*:\s*"?(\d+\.?\d*)"/i) ||
                      html.match(/"averageStar"\s*:\s*"?(\d+\.?\d*)"/i)
  if (ratingMatch) rating = parseFloat(ratingMatch[1])
  
  const countMatch = html.match(/"totalValidNum"\s*:\s*(\d+)/i) ||
                     html.match(/"totalCount"\s*:\s*(\d+)/i) ||
                     html.match(/(\d+)\s*(?:Reviews?|Avis|évaluations?)/i)
  if (countMatch) reviewsCount = parseInt(countMatch[1], 10)
  
  // Extract review highlights
  const reviewTextMatch = html.match(/"reviewContent"\s*:\s*"([^"]{20,})"/gi)
  if (reviewTextMatch) {
    for (const match of reviewTextMatch.slice(0, 20)) {
      const contentMatch = match.match(/"reviewContent"\s*:\s*"([^"]+)"/)
      if (contentMatch) {
        reviews.push({
          content: contentMatch[1].substring(0, 500),
          verified: true
        })
      }
    }
  }
  
  // SKU/Product ID
  let sku = ''
  const skuIdMatch = url.match(/\/item\/(\d+)\.html/i) || 
                     url.match(/\/i\/(\d+)/i) ||
                     html.match(/"productId"\s*:\s*"?(\d+)"?/i)
  if (skuIdMatch) sku = skuIdMatch[1]
  
  // Shipping info
  let shippingTime = ''
  const shippingMatch = html.match(/"deliveryDays"\s*:\s*"?(\d+)"?/i) ||
                        html.match(/(\d+)\s*(?:jours?|days?)/i)
  if (shippingMatch) shippingTime = `${shippingMatch[1]} jours`
  
  console.log(`[${requestId}] ✅ AliExpress: ${title.substring(0, 50)} | Images: ${images.length} | Variants: ${variants.length} | Videos: ${videos.length}`)
  
  return {
    title: title.substring(0, 500),
    price,
    min_price: minPrice,
    max_price: maxPrice,
    description: (metadata.description || metadata.ogDescription || '').substring(0, 5000),
    images: images.slice(0, 50),
    variants,
    videos: videos.slice(0, 10),
    sku,
    rating,
    reviews_count: reviewsCount,
    reviews,
    shipping_time: shippingTime,
    source_url: url
  }
}

// ============================================
// SHOPIFY EXTRACTION (ENHANCED - WITH JSON API)
// ============================================

async function fetchShopifyJsonApi(url: string, requestId: string): Promise<any> {
  try {
    // Convert product URL to JSON endpoint
    const jsonUrl = url.replace(/\/products\/([^/?#]+).*$/, '/products/$1.json')
    
    console.log(`[${requestId}] 📡 Fetching Shopify JSON API: ${jsonUrl}`)
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.product || null
    }
  } catch (e) {
    console.log(`[${requestId}] Shopify JSON API not available`)
  }
  return null
}

function extractShopifyProduct(html: string, metadata: any, url: string, requestId: string): any {
  let title = metadata.title || metadata.ogTitle || ''
  title = title.replace(/\s*[-–|].*$/, '').trim()
  
  // Try to find Shopify product JSON in page
  let shopifyProduct: any = null
  
  const productJsonPatterns = [
    /var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\});?/m,
    /"product"\s*:\s*(\{[\s\S]*?\})\s*(?:,\s*"|}$)/m,
    /ShopifyAnalytics\.meta\s*=\s*(\{[\s\S]*?\});?/m,
    /window\.ShopifyAnalytics\.meta\s*=\s*(\{[\s\S]*?\});?/m
  ]
  
  for (const pattern of productJsonPatterns) {
    const match = html.match(pattern)
    if (match) {
      try {
        const parsed = JSON.parse(match[1])
        shopifyProduct = parsed.product || parsed
        if (shopifyProduct?.title) break
      } catch (e) {}
    }
  }
  
  // Price
  let price = 0
  let compareAtPrice = 0
  
  if (shopifyProduct?.variants?.[0]) {
    const firstVariant = shopifyProduct.variants[0]
    price = parseFloat(firstVariant.price) / 100 || parseFloat(firstVariant.price) || 0
    if (firstVariant.compare_at_price) {
      compareAtPrice = parseFloat(firstVariant.compare_at_price) / 100 || parseFloat(firstVariant.compare_at_price) || 0
    }
  }
  
  if (price === 0) {
    const priceMatch = html.match(/"price"\s*:\s*(\d+)/i) ||
                       html.match(/class="[^"]*price[^"]*"[^>]*>[\s\S]*?([€$£]\s*[\d,.]+)/i)
    if (priceMatch) price = parsePrice(priceMatch[1])
  }
  
  // Images - comprehensive extraction
  const images: string[] = []
  const seenImages = new Set<string>()
  
  const ogImage = validateImageUrl(metadata.ogImage)
  if (ogImage) {
    const normalized = normalizeToHighRes(ogImage, 'shopify')
    if (!seenImages.has(normalized)) {
      images.push(normalized)
      seenImages.add(normalized)
    }
  }
  
  // From product JSON
  if (shopifyProduct?.images) {
    for (const img of shopifyProduct.images) {
      const imgUrl = typeof img === 'string' ? img : (img?.src || img?.url)
      const cleanUrl = validateImageUrl(imgUrl)
      if (cleanUrl) {
        const normalized = normalizeToHighRes(cleanUrl, 'shopify')
        if (!seenImages.has(normalized)) {
          images.push(normalized)
          seenImages.add(normalized)
        }
      }
    }
  }
  
  // From HTML data attributes
  const imgPatterns = [
    /data-src=["']([^"']+cdn\.shopify\.com[^"']+)["']/gi,
    /data-zoom=["']([^"']+cdn\.shopify\.com[^"']+)["']/gi,
    /data-srcset=["']([^"']+cdn\.shopify\.com[^"'\s,]+)/gi,
    /srcset=["']([^"']+cdn\.shopify\.com[^"'\s,]+)/gi
  ]
  
  for (const pattern of imgPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const cleanUrl = validateImageUrl(match[1])
      if (cleanUrl) {
        const normalized = normalizeToHighRes(cleanUrl, 'shopify')
        if (!seenImages.has(normalized)) {
          images.push(normalized)
          seenImages.add(normalized)
        }
      }
    }
  }
  
  // Variants with full details
  const variants: any[] = []
  
  if (shopifyProduct?.variants) {
    for (const v of shopifyProduct.variants) {
      const variantPrice = v.price ? (parseFloat(v.price) / 100 || parseFloat(v.price)) : price
      const variantCompareAt = v.compare_at_price ? 
        (parseFloat(v.compare_at_price) / 100 || parseFloat(v.compare_at_price)) : null
      
      variants.push({
        id: v.id?.toString(),
        name: v.title || v.name || 'Variant',
        sku: v.sku || v.id?.toString() || '',
        price: variantPrice,
        compare_at_price: variantCompareAt,
        stock: v.inventory_quantity,
        available: v.available !== false,
        type: 'variant',
        options: {
          option1: v.option1,
          option2: v.option2,
          option3: v.option3
        },
        image: v.featured_image?.src || null,
        weight: v.weight,
        barcode: v.barcode
      })
    }
  }
  
  // Videos from Shopify media
  const videos: string[] = []
  const videoPatterns = [
    /"sources"\s*:\s*\[[\s\S]*?"url"\s*:\s*"([^"]+\.mp4[^"]*)"/gi,
    /data-video-url=["']([^"']+)["']/gi,
    /"embedUrl"\s*:\s*"([^"]+youtube[^"]+)"/gi,
    /"embedUrl"\s*:\s*"([^"]+vimeo[^"]+)"/gi
  ]
  
  for (const pattern of videoPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (!videos.includes(match[1])) {
        videos.push(match[1])
      }
    }
  }
  
  // Reviews
  let rating = 0
  let reviewsCount = 0
  const reviews: any[] = []
  
  // Common Shopify review apps
  const ratingMatch = html.match(/"ratingValue"\s*:\s*"?(\d+\.?\d*)"?/i) ||
                      html.match(/data-rating=["'](\d+\.?\d*)["']/i) ||
                      html.match(/itemprop="ratingValue"[^>]*content=["'](\d+\.?\d*)["']/i)
  if (ratingMatch) rating = parseFloat(ratingMatch[1])
  
  const countMatch = html.match(/"reviewCount"\s*:\s*"?(\d+)"?/i) ||
                     html.match(/(\d+)\s*(?:reviews?|avis)/i)
  if (countMatch) reviewsCount = parseInt(countMatch[1], 10)
  
  // Extract review snippets
  const reviewPatterns = [
    /class="[^"]*review-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /itemprop="reviewBody"[^>]*>([\s\S]*?)<\//gi
  ]
  
  for (const pattern of reviewPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const content = match[1].replace(/<[^>]+>/g, '').trim()
      if (content.length > 20) {
        reviews.push({ content: content.substring(0, 500), verified: true })
      }
      if (reviews.length >= 20) break
    }
    if (reviews.length >= 20) break
  }
  
  // SKU
  let sku = shopifyProduct?.variants?.[0]?.sku || ''
  if (!sku) {
    const handleMatch = url.match(/\/products\/([^/?#]+)/i)
    if (handleMatch) sku = handleMatch[1].toUpperCase()
  }
  
  // Brand/Vendor
  const brand = shopifyProduct?.vendor || ''
  
  // Tags
  const tags = shopifyProduct?.tags || []
  
  console.log(`[${requestId}] ✅ Shopify: ${title.substring(0, 50)} | Images: ${images.length} | Variants: ${variants.length} | Videos: ${videos.length}`)
  
  return {
    title: title.substring(0, 500),
    price,
    compare_at_price: compareAtPrice > price ? compareAtPrice : null,
    description: (shopifyProduct?.body_html || shopifyProduct?.description || metadata.description || '').substring(0, 5000),
    images: images.slice(0, 50),
    variants,
    videos: videos.slice(0, 10),
    sku,
    brand,
    tags,
    rating,
    reviews_count: reviewsCount,
    reviews,
    source_url: url
  }
}

// ============================================
// GENERIC EXTRACTION
// ============================================

function extractGenericProduct(html: string, metadata: any, markdown: string, url: string, requestId: string, platform: string): any {
  let title = metadata.title || metadata.ogTitle || ''
  title = title.replace(/\s*[-–|].*$/, '').trim()
  
  let price = 0
  const priceMatch = markdown.match(/(?:€|EUR|\$|USD|£|GBP)\s*([\d,.]+)/) || 
                     markdown.match(/([\d,.]+)\s*(?:€|EUR|\$|USD|£|GBP)/)
  if (priceMatch) price = parsePrice(priceMatch[1] || priceMatch[0])
  
  const images: string[] = []
  const seenImages = new Set<string>()
  
  const ogImage = validateImageUrl(metadata.ogImage)
  if (ogImage) {
    const normalized = normalizeToHighRes(ogImage, platform)
    if (!seenImages.has(normalized)) {
      images.push(normalized)
      seenImages.add(normalized)
    }
  }
  
  const imgMatches = html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)
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
  
  console.log(`[${requestId}] ✅ ${platform}: ${title.substring(0, 50)} | Images: ${images.length}`)
  
  return {
    title: title.substring(0, 500),
    price,
    description: (metadata.description || metadata.ogDescription || '').substring(0, 5000),
    images: images.slice(0, 50),
    variants: [],
    videos: [],
    reviews: [],
    source_url: url
  }
}

// ============================================
// MAIN FIRECRAWL SCRAPER
// ============================================

async function scrapeWithFirecrawl(url: string, requestId: string, platform: string): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    console.log(`[${requestId}] No Firecrawl API key configured`)
    return null
  }

  console.log(`[${requestId}] 🔥 Firecrawl high-fidelity extraction for ${platform}...`)
  
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
        waitFor: 5000,
        timeout: 90000
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
    
    // Platform-specific extraction
    if (platform === 'amazon') {
      return extractAmazonProduct(html, metadata, url, requestId)
    } else if (platform === 'aliexpress') {
      return extractAliExpressProduct(html, metadata, url, requestId)
    } else if (platform === 'shopify') {
      // Try JSON API first for Shopify
      const jsonProduct = await fetchShopifyJsonApi(url, requestId)
      if (jsonProduct) {
        // Merge JSON data with HTML extracted data
        const htmlData = extractShopifyProduct(html, metadata, url, requestId)
        return {
          ...htmlData,
          title: jsonProduct.title || htmlData.title,
          description: jsonProduct.body_html || htmlData.description,
          variants: jsonProduct.variants?.map((v: any) => ({
            id: v.id?.toString(),
            name: v.title,
            sku: v.sku || '',
            price: parseFloat(v.price) || 0,
            compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
            stock: v.inventory_quantity,
            available: v.available,
            options: { option1: v.option1, option2: v.option2, option3: v.option3 },
            image: v.featured_image?.src || null,
            barcode: v.barcode
          })) || htmlData.variants,
          images: jsonProduct.images?.map((i: any) => 
            normalizeToHighRes(typeof i === 'string' ? i : i.src, 'shopify')
          ) || htmlData.images,
          brand: jsonProduct.vendor || htmlData.brand,
          tags: jsonProduct.tags || htmlData.tags
        }
      }
      return extractShopifyProduct(html, metadata, url, requestId)
    } else {
      return extractGenericProduct(html, metadata, markdown, url, requestId, platform)
    }
  } catch (error) {
    console.error(`[${requestId}] Firecrawl exception:`, error)
    return null
  }
}

// Fallback direct fetch
async function scrapeWithFetch(url: string, requestId: string, platform: string): Promise<any> {
  console.log(`[${requestId}] 📡 Fallback to direct fetch...`)
  
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
    const metadata = {
      title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '',
      ogTitle: html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1],
      ogImage: html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1],
      ogDescription: html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1],
      description: html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
    }
    
    if (platform === 'amazon') {
      return extractAmazonProduct(html, metadata, url, requestId)
    } else if (platform === 'aliexpress') {
      return extractAliExpressProduct(html, metadata, url, requestId)
    } else if (platform === 'shopify') {
      return extractShopifyProduct(html, metadata, url, requestId)
    }
    
    return extractGenericProduct(html, metadata, '', url, requestId, platform)
  } catch (error) {
    console.error(`[${requestId}] Fetch exception:`, error)
    return null
  }
}

// ============================================
// MAIN HANDLER
// ============================================

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
    
    const token = req.headers.get('x-extension-token')?.replace(/[^a-zA-Z0-9-_]/g, '')
    
    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token d\'extension requis' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: authData, error: tokenError } = await supabase
      .from('extension_auth_tokens')
      .select('id, user_id, expires_at')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !authData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (authData.expires_at && new Date(authData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] ✅ Authenticated: ${authData.user_id}`)
    
    const body = await req.json()
    const { action, url, extractedData, options = {}, products } = body
    
    // Bulk import handler
    if (action === 'bulk_import' && Array.isArray(products)) {
      console.log(`[${requestId}] 📦 Bulk import: ${products.length} products`)
      
      const results = []
      let successCount = 0
      let errorCount = 0
      
      for (const product of products.slice(0, 100)) {
        try {
          const productUrl = product.url || product.extractedData?.source_url
          if (!productUrl) {
            results.push({ success: false, error: 'URL manquante' })
            errorCount++
            continue
          }
          
          const productPlatform = detectPlatform(productUrl)
          let productData = product.extractedData
          
          if (!productData || !productData.title || !productData.images?.length) {
            productData = await scrapeWithFirecrawl(productUrl, requestId, productPlatform)
            if (!productData?.title) {
              productData = await scrapeWithFetch(productUrl, requestId, productPlatform)
            }
          }
          
          if (!productData?.title) {
            results.push({ success: false, error: 'Extraction échouée', url: productUrl })
            errorCount++
            continue
          }
          
          const { data: inserted, error: insertErr } = await supabase
            .from('imported_products')
            .insert({
              user_id: authData.user_id,
              name: productData.title,
              description: productData.description || '',
              price: parsePrice(productData.price),
              cost_price: parsePrice(productData.price) * 0.7,
              currency: productData.currency || 'EUR',
              sku: productData.sku || `IMP-${Date.now()}-${successCount}`,
              image_urls: productData.images || [],
              source_url: productUrl,
              source_platform: productPlatform,
              status: 'draft',
              sync_status: 'synced',
              stock_quantity: productData.stock_quantity || 100,
              videos: productData.videos || [],
              metadata: {
                imported_via: 'chrome_extension_bulk',
                imported_at: new Date().toISOString(),
                variants_count: productData.variants?.length || 0,
                reviews_count: productData.reviews_count || 0
              }
            })
            .select('id')
            .single()
          
          if (insertErr) {
            results.push({ success: false, error: insertErr.message, url: productUrl })
            errorCount++
          } else {
            // Insert variants
            if (productData.variants?.length > 0) {
              await supabase.from('product_variants').insert(
                productData.variants.slice(0, 100).map((v: any, idx: number) => ({
                  product_id: inserted.id,
                  name: v.name || `Variant ${idx + 1}`,
                  sku: v.sku || `${inserted.id}-V${idx}`,
                  price: v.price || productData.price || 0,
                  stock_quantity: v.stock || 100,
                  attributes: { type: v.type, image: v.image, options: v.options },
                  is_active: v.available !== false
                }))
              )
            }
            
            results.push({ success: true, productId: inserted.id, title: productData.title })
            successCount++
          }
        } catch (e) {
          results.push({ success: false, error: (e as Error).message })
          errorCount++
        }
      }
      
      console.log(`[${requestId}] ✅ Bulk: ${successCount} success, ${errorCount} errors`)
      
      return new Response(
        JSON.stringify({ success: true, imported: successCount, failed: errorCount, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Single product import
    if (action !== 'scrape_and_import' || !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action ou URL manquante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] 🔍 Scraping: ${url}`)
    
    const platform = detectPlatform(url)
    let productData = extractedData
    
    // Always use Firecrawl for high-fidelity extraction
    console.log(`[${requestId}] 🔥 Using Firecrawl for high-fidelity extraction`)
    const firecrawlData = await scrapeWithFirecrawl(url, requestId, platform)
    
    if (firecrawlData?.title) {
      // Merge: Firecrawl data is primary, client data fills gaps
      productData = {
        ...productData,
        ...firecrawlData,
        images: [
          ...(firecrawlData.images || []),
          ...(productData?.images || []).filter((img: string) => 
            !(firecrawlData.images || []).includes(img)
          )
        ].slice(0, 50),
        variants: firecrawlData.variants?.length ? firecrawlData.variants : (productData?.variants || []),
        videos: [
          ...(firecrawlData.videos || []),
          ...(productData?.videos || [])
        ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20),
        reviews: firecrawlData.reviews || productData?.reviews || []
      }
    }
    
    // Fallback
    if (!productData?.title) {
      productData = await scrapeWithFetch(url, requestId, platform)
    }
    
    if (!productData?.title && extractedData?.title) {
      productData = extractedData
    }
    
    if (!productData?.title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible d\'extraire les données du produit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert product
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
        stock_quantity: productData.stock_quantity || 100,
        video_urls: productData.videos || [],
        variants: productData.variants || [],
        metadata: {
          imported_via: 'chrome_extension',
          imported_at: new Date().toISOString(),
          brand: productData.brand || null,
          rating: productData.rating || null,
          reviews_count: productData.reviews_count || 0,
          variants_count: productData.variants?.length || 0,
          has_videos: (productData.videos?.length || 0) > 0,
          compare_at_price: productData.compare_at_price || null,
          reviews_distribution: productData.reviews_distribution || null,
          tags: productData.tags || []
        }
      })
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ success: false, error: `DB: ${insertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert variants
    let variantsInserted = 0
    if (productData.variants?.length > 0) {
      const variantsToInsert = productData.variants.slice(0, 200).map((v: any, idx: number) => ({
        product_id: insertedProduct.id,
        name: v.name || v.title || `Variant ${idx + 1}`,
        sku: v.sku || `${insertedProduct.sku}-V${idx + 1}`,
        price: v.price || productData.price || 0,
        stock_quantity: v.stock || 100,
        attributes: {
          type: v.type || 'option',
          image: v.image || null,
          available: v.available !== false,
          options: v.options || {},
          compare_at_price: v.compare_at_price,
          barcode: v.barcode
        },
        is_active: v.available !== false
      }))

      try {
        const { data: insertedVariants } = await supabase
          .from('product_variants')
          .insert(variantsToInsert)
          .select('id')

        variantsInserted = insertedVariants?.length || 0
        console.log(`[${requestId}] ✅ ${variantsInserted} variants inserted`)
      } catch (e) {
        console.warn(`[${requestId}] Variants insert warning:`, e)
      }
    }

    // Insert detailed reviews
    if (productData.reviews?.length > 0) {
      try {
        const reviewsToInsert = productData.reviews.slice(0, 50).map((r: any) => ({
          product_id: insertedProduct.id,
          author_name: r.author || 'Verified Buyer',
          rating: r.rating || productData.rating || 5,
          content: r.content || r.title || '',
          is_verified: r.verified !== false,
          metadata: {
            source: platform,
            date: r.date,
            title: r.title
          }
        }))
        
        await supabase.from('product_reviews').insert(reviewsToInsert)
        console.log(`[${requestId}] ✅ ${reviewsToInsert.length} reviews inserted`)
      } catch (e) {
        console.warn(`[${requestId}] Reviews insert warning:`, e)
      }
    } else if (productData.reviews_count > 0 || productData.rating > 0) {
      // Insert summary review
      try {
        await supabase.from('product_reviews').insert({
          product_id: insertedProduct.id,
          author_name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Summary`,
          rating: productData.rating || 5,
          content: `${productData.reviews_count || 0} avis • Note: ${productData.rating || 0}/5`,
          is_verified: true,
          metadata: {
            source: platform,
            average_rating: productData.rating,
            total_reviews: productData.reviews_count,
            distribution: productData.reviews_distribution
          }
        })
      } catch (e) {}
    }

    // Update token usage
    await supabase
      .from('extension_auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', authData.id)

    // Analytics
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
          videos_count: productData.videos?.length || 0,
          reviews_count: productData.reviews?.length || productData.reviews_count || 0
        },
        source_url: url
      })
    } catch (e) {}

    console.log(`[${requestId}] ✅ Import complete: ${insertedProduct.id} | Variants: ${variantsInserted} | Images: ${productData.images?.length} | Videos: ${productData.videos?.length}`)

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
          reviews_count: productData.reviews?.length || productData.reviews_count || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
