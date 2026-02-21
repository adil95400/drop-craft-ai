import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Détecte le type de plateforme à partir de l'URL
function detectPlatform(url: string): { platform: string; productId: string | null } {
  const urlLower = url.toLowerCase()
  
  // AliExpress
  if (urlLower.includes('aliexpress.com') || urlLower.includes('aliexpress.fr') || urlLower.includes('aliexpress.us') || urlLower.includes('ali.ski') || urlLower.includes('s.click.aliexpress')) {
    const match = url.match(/item\/(\d+)\.html/) || url.match(/\/(\d+)\.html/) || url.match(/productId=(\d+)/) || url.match(/item\/(\d+)/)
    return { platform: 'aliexpress', productId: match?.[1] || null }
  }
  
  // Amazon (toutes régions)
  if (urlLower.includes('amazon.')) {
    const match = url.match(/\/dp\/([A-Z0-9]+)/i) || url.match(/\/gp\/product\/([A-Z0-9]+)/i) || url.match(/\/product\/([A-Z0-9]+)/i) || url.match(/asin=([A-Z0-9]+)/i)
    return { platform: 'amazon', productId: match?.[1] || null }
  }
  
  // eBay
  if (urlLower.includes('ebay.')) {
    const match = url.match(/\/itm\/(\d+)/) || url.match(/item=(\d+)/) || url.match(/itm\/[^\/]+\/(\d+)/)
    return { platform: 'ebay', productId: match?.[1] || null }
  }
  
  // Temu
  if (urlLower.includes('temu.com') || urlLower.includes('share.temu')) {
    const match = url.match(/goods\/(\d+)/) || url.match(/g-(\d+)/) || url.match(/goods_id=(\d+)/)
    return { platform: 'temu', productId: match?.[1] || null }
  }
  
  // Wish
  if (urlLower.includes('wish.com')) {
    const match = url.match(/product\/([a-zA-Z0-9]+)/) || url.match(/c\/([a-zA-Z0-9]+)/)
    return { platform: 'wish', productId: match?.[1] || null }
  }
  
  // CJ Dropshipping
  if (urlLower.includes('cjdropshipping.com') || urlLower.includes('cjdrop')) {
    const match = url.match(/product\/([^\/\?]+)/) || url.match(/pid=([^&]+)/)
    return { platform: 'cjdropshipping', productId: match?.[1] || null }
  }
  
  // BigBuy
  if (urlLower.includes('bigbuy.eu') || urlLower.includes('bigbuy.com')) {
    const match = url.match(/\/([^\/]+)\.html/) || url.match(/sku=([^&]+)/)
    return { platform: 'bigbuy', productId: match?.[1] || null }
  }
  
  // Banggood
  if (urlLower.includes('banggood.com')) {
    const match = url.match(/-p-(\d+)\.html/) || url.match(/products\/(\d+)/)
    return { platform: 'banggood', productId: match?.[1] || null }
  }
  
  // DHgate
  if (urlLower.includes('dhgate.com')) {
    const match = url.match(/product\/([^\/\.]+)/) || url.match(/\/(\d+)\.html/)
    return { platform: 'dhgate', productId: match?.[1] || null }
  }
  
  // Shein
  if (urlLower.includes('shein.com') || urlLower.includes('shein.fr')) {
    const match = url.match(/-p-(\d+)/) || url.match(/productId=(\d+)/)
    return { platform: 'shein', productId: match?.[1] || null }
  }
  
  // Shopify stores (generic detection) - Also check for .myshopify.com domains
  if ((urlLower.includes('/products/') || urlLower.includes('.myshopify.com')) && !urlLower.includes('amazon') && !urlLower.includes('ebay') && !urlLower.includes('aliexpress')) {
    const match = url.match(/\/products\/([^\/\?#]+)/)
    return { platform: 'shopify', productId: match?.[1] || null }
  }
  
  // WooCommerce (generic detection)
  if (urlLower.includes('/product/') && !urlLower.includes('amazon') && !urlLower.includes('ebay')) {
    const match = url.match(/\/product\/([^\/\?]+)/)
    return { platform: 'woocommerce', productId: match?.[1] || null }
  }
  
  // Etsy
  if (urlLower.includes('etsy.com')) {
    const match = url.match(/listing\/(\d+)/)
    return { platform: 'etsy', productId: match?.[1] || null }
  }
  
  // Made in China
  if (urlLower.includes('made-in-china.com')) {
    const match = url.match(/product\/([^\/\?]+)/)
    return { platform: 'made-in-china', productId: match?.[1] || null }
  }
  
  // Walmart
  if (urlLower.includes('walmart.com')) {
    const match = url.match(/\/ip\/[^\/]+\/(\d+)/) || url.match(/\/(\d+)\?/)
    return { platform: 'walmart', productId: match?.[1] || null }
  }
  
  // Cdiscount
  if (urlLower.includes('cdiscount.com')) {
    // URL patterns: /f-xxx.html, /mp-xxx.html, /fpd/xxx.html
    const match = url.match(/\/([mf]p?d?)-([^\/\.]+)\.html/i) || 
                  url.match(/\/dp\/([^\/\?]+)/) ||
                  url.match(/productId=([^&]+)/)
    return { platform: 'cdiscount', productId: match?.[2] || match?.[1] || null }
  }
  
  // Fnac
  if (urlLower.includes('fnac.com')) {
    const match = url.match(/\/a(\d+)\//) || url.match(/\/(\d+)\.aspx/)
    return { platform: 'fnac', productId: match?.[1] || null }
  }
  
  // Rakuten
  if (urlLower.includes('rakuten.com') || urlLower.includes('rakuten.fr')) {
    const match = url.match(/\/product\/(\d+)/) || url.match(/\/offer\/buy\/(\d+)/)
    return { platform: 'rakuten', productId: match?.[1] || null }
  }
  
  // Darty
  if (urlLower.includes('darty.com')) {
    const match = url.match(/\/([^\/]+)_([^\/]+)\.html/) || url.match(/fp\/(\d+)/)
    return { platform: 'darty', productId: match?.[2] || match?.[1] || null }
  }
  
  // Boulanger
  if (urlLower.includes('boulanger.com')) {
    const match = url.match(/ref\/(\d+)/) || url.match(/\/c(\d+)/)
    return { platform: 'boulanger', productId: match?.[1] || null }
  }
  
  // Home Depot
  if (urlLower.includes('homedepot.com')) {
    const match = url.match(/\/p\/[^\/]+\/(\d+)/) || url.match(/\/(\d+)$/)
    return { platform: 'homedepot', productId: match?.[1] || null }
  }
  
  // Lowe's
  if (urlLower.includes('lowes.com')) {
    const match = url.match(/\/pd\/[^\/]+\/(\d+)/) || url.match(/\/productId=(\d+)/)
    return { platform: 'lowes', productId: match?.[1] || null }
  }
  
  // Costco
  if (urlLower.includes('costco.com')) {
    const match = url.match(/\.product\.(\d+)\.html/) || url.match(/productId=(\d+)/)
    return { platform: 'costco', productId: match?.[1] || null }
  }
  
  // Manomano
  if (urlLower.includes('manomano.')) {
    const match = url.match(/\/p\/([^\/\?]+)/) || url.match(/\/(\d+)$/)
    return { platform: 'manomano', productId: match?.[1] || null }
  }
  
  // Leroy Merlin
  if (urlLower.includes('leroymerlin.')) {
    const match = url.match(/\/p\/[^\/]+-(\d+)\.html/) || url.match(/\/(\d+)\.html/)
    return { platform: 'leroymerlin', productId: match?.[1] || null }
  }
  
  return { platform: 'unknown', productId: null }
}

function canonicalizeAmazonUrl(url: string, asin: string | null): string {
  if (!asin) return url
  // Prefer canonical dp URL; keep basic params to show correct variant
  const u = new URL(url)
  const base = `${u.protocol}//${u.host}/dp/${asin}`
  const params = new URLSearchParams()
  if (u.searchParams.get('th')) params.set('th', u.searchParams.get('th')!)
  if (u.searchParams.get('psc')) params.set('psc', u.searchParams.get('psc')!)
  // Some mobile links use "?th=1&psc=1" to surface variations
  if (!params.has('th')) params.set('th', '1')
  if (!params.has('psc')) params.set('psc', '1')
  return `${base}?${params.toString()}`
}

function isBlockedOrErrorHtml(html: string): boolean {
  const h = html.toLowerCase()
  return (
    h.includes('robot check') ||
    h.includes('enter the characters you see below') ||
    h.includes('automated access') ||
    h.includes('captcha') ||
    h.includes('main-frame-error') || // Chrome offline / DNS
    h.includes('this site can\’t be reached') ||
    h.includes('this site can\'t be reached') ||
    h.includes('dino') && h.includes('offline')
  )
}

// Extract high quality images from various sources
function extractHQImages(html: string, platform: string, markdown: string = ''): string[] {
  const images: string[] = []
  const seenUrls = new Set<string>()
  const seenAmazonImageKeys = new Set<string>()
  const normalizeAmazonImageUrl = (url: string) => {
    // Convert various Amazon image hosts/sizes to the cleanest possible URL.
    let u = url

    // Prefer m.media-amazon.com when we can
    u = u.replace(
      /^https?:\/\/images-[a-z0-9-]+\.ssl-images-amazon\.com\//i,
      'https://m.media-amazon.com/'
    )

    // Strip query/hash
    try {
      const parsed = new URL(u)
      parsed.search = ''
      parsed.hash = ''
      u = parsed.toString()
    } catch {
      // keep original
    }

    // Remove size/transform segments (keep original asset)
    // Examples: ._AC_UL165_SR165,165_.jpg  /  ._SX679_.jpg  /  ._AC_SX679_.jpg
    u = u
      // generic "._SOMETHING_." pattern
      .replace(/\._[^.]+_\./g, '.')
      // extra safety for some AC_UL/SR shapes
      .replace(/\._AC_UL\d+_SR\d+,\d+_\./g, '.')
      .replace(/\._AC_UL\d+_\./g, '.')

    return u
  }
  const addImage = (url: string) => {
    if (!url || images.length >= 30) return

    // Clean up URL
    let cleanUrl = url.replace(/\\u002F/g, '/').replace(/\\/g, '')

    if (platform === 'amazon') {
      cleanUrl = normalizeAmazonImageUrl(cleanUrl)

      // De-duplicate by the underlying asset id (avoid 10 thumbnails of the same photo)
      const m = cleanUrl.match(/\/images\/I\/([^._/]+)(?:\._[^.]+_)?\./i)
      const key = m?.[1]
      if (key && seenAmazonImageKeys.has(key)) return
      if (key) seenAmazonImageKeys.add(key)
    }

    if (!cleanUrl.startsWith('http')) return
    if (seenUrls.has(cleanUrl)) return
    // Filter out non-product images
    if (cleanUrl.includes('icon') || cleanUrl.includes('sprite')) return
    if (platform === 'amazon') {
      // Skip Amazon UI/nav/badge/logo images
      if (/\/images\/G\//i.test(cleanUrl)) return  // Amazon global UI assets
      if (/\/images\/S\//i.test(cleanUrl)) return  // Amazon static UI assets  
      if (/prime[_-]?logo|badge|banner|award|certification|stamp|trust|guarantee/i.test(cleanUrl)) return
      if (/loading|placeholder|transparent|pixel|spacer|blank/i.test(cleanUrl)) return
      if (/nav[_-]|header[_-]|footer[_-]|sidebar/i.test(cleanUrl)) return
      // Skip very small utility images (1x1, 2x2, etc.)
      if (/[._]1x1[._]|[._]2x2[._]|[._]SR1,1[._]/i.test(cleanUrl)) return
    }

    images.push(cleanUrl)
    seenUrls.add(cleanUrl)
  }
  // Platform-specific high-quality image extraction
  if (platform === 'amazon') {
    console.log('🔍 Extracting Amazon images...')
    
    // Try colorImages JSON data first (most reliable)
    const colorImagesMatch = html.match(/colorImages['"]\s*:\s*({[^}]+\[[^\]]+\][^}]*})/s) ||
                             html.match(/'colorImages'\s*:\s*({.+?})\s*,\s*'color/s)
    if (colorImagesMatch) {
      console.log('📷 Found colorImages data')
      const hiResMatches = colorImagesMatch[1].matchAll(/"hiRes"\s*:\s*"([^"]+)"/g)
      for (const m of hiResMatches) {
        addImage(m[1])
      }
      const largeMatches = colorImagesMatch[1].matchAll(/"large"\s*:\s*"([^"]+)"/g)
      for (const m of largeMatches) {
        addImage(m[1])
      }
    }
    
    // Try imageGalleryData
    const galleryMatch = html.match(/imageGalleryData['"]\s*:\s*\[([^\]]+)\]/s)
    if (galleryMatch) {
      console.log('📷 Found imageGalleryData')
      const imgMatches = galleryMatch[1].matchAll(/"mainUrl"\s*:\s*"([^"]+)"/g)
      for (const m of imgMatches) {
        addImage(m[1])
      }
    }
    
    // Try data-old-hires or data-a-dynamic-image
    const dynamicImgMatches = html.matchAll(/data-(?:old-hires|a-dynamic-image)=["']([^"']+)["']/gi)
    for (const m of dynamicImgMatches) {
      // data-a-dynamic-image contains JSON
      if (m[1].includes('{')) {
        try {
          const imgJson = JSON.parse(m[1].replace(/&quot;/g, '"'))
          for (const url of Object.keys(imgJson)) {
            addImage(url)
          }
        } catch (e) {}
      } else {
        addImage(m[1])
      }
    }
    
    // Amazon image URLs from HTML — only from product-relevant sections
    // Skip if we already have enough from colorImages/gallery (those are most accurate)
    if (images.length < 5) {
      const amazonImgMatches = html.matchAll(/(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s]+\.(?:jpg|png|webp))/gi)
      for (const m of amazonImgMatches) {
        let imgUrl = m[1]
          .replace(/\._[A-Z]{2}\d+_\./, '.')
          .replace(/\._S[LXSMXY]\d+_\./, '.')
          .replace(/\._AC_[^.]+\./, '.')
        addImage(imgUrl)
      }
    }
    
    // Markdown fallback — only if very few images found (avoid sponsored/related product images)
    if (images.length < 3 && markdown) {
      const mdImgMatches = markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/gi)
      for (const m of mdImgMatches) {
        if (m[1].includes('media-amazon') && m[1].includes('/images/I/')) {
          addImage(m[1])
        }
      }
    }
  }
  
  if (platform === 'aliexpress') {
    // AliExpress uses imagePathList in JSON
    const jsonMatch = html.match(/imagePathList['"]\s*:\s*\[(.*?)\]/s)
    if (jsonMatch) {
      const imgMatches = jsonMatch[1].matchAll(/"(https?:\/\/[^"]+)"/g)
      for (const m of imgMatches) {
        // Convert to high quality by removing size modifiers
        let imgUrl = m[1].replace(/_\d+x\d+\.[a-z]+$/i, '.jpg')
          .replace(/\.jpg_\d+x\d+\.jpg$/i, '.jpg')
          .replace(/_\d+x\d+xz\.jpg$/i, '.jpg')
        addImage(imgUrl)
      }
    }
    
    // Also check for data-zoom-image
    const zoomMatches = html.matchAll(/data-zoom-image="([^"]+)"/gi)
    for (const m of zoomMatches) {
      addImage(m[1])
    }
  }
  
  if (platform === 'shopify') {
    console.log('🛍️ Extracting Shopify images...')
    
    // Strategy 1: Product JSON (most reliable for Shopify)
    const productJsonMatch = html.match(/var\s+meta\s*=\s*({[\s\S]*?});/i) ||
                              html.match(/"product"\s*:\s*({[\s\S]*?}),\s*"/i)
    if (productJsonMatch) {
      try {
        const productData = JSON.parse(productJsonMatch[1])
        const images = productData?.product?.images || productData?.images || []
        for (const img of images) {
          const src = img?.src || img?.url || img
          if (typeof src === 'string') {
            // Get the best quality by removing size modifiers
            const hqUrl = src.replace(/_\d+x(\d+)?\./, '.').replace(/\?.*$/, '')
            addImage(hqUrl)
          }
        }
      } catch (e) {
        console.log('Could not parse Shopify product JSON')
      }
    }
    
    // Strategy 2: featured_image and images in script tags
    const imgUrlMatches = html.matchAll(/"(?:featured_image|src|url)"\s*:\s*"(https?:\/\/cdn\.shopify\.com\/[^"]+)"/gi)
    for (const m of imgUrlMatches) {
      // Remove size modifiers for max quality
      const hqUrl = m[1].replace(/_\d+x(\d+)?\./, '.').replace(/\?.*$/, '')
      addImage(hqUrl)
    }
    
    // Strategy 3: product-image or product__media elements
    const productImgMatches = html.matchAll(/(?:data-src|data-srcset|src)=["'](https?:\/\/cdn\.shopify\.com\/[^"'\s]+)["']/gi)
    for (const m of productImgMatches) {
      const hqUrl = m[1].replace(/_\d+x(\d+)?\./, '.').replace(/\?.*$/, '')
      addImage(hqUrl)
    }
    
    // Strategy 4: og:image meta tags
    const ogShopifyImgs = html.matchAll(/og:image"[^>]*content="(https?:\/\/cdn\.shopify\.com\/[^"]+)"/gi)
    for (const m of ogShopifyImgs) {
      addImage(m[1])
    }
  }
  
  // Cdiscount image extraction
  if (platform === 'cdiscount') {
    console.log('🛒 Extracting Cdiscount images...')
    
    // Strategy 1: JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
        try {
          const data = JSON.parse(jsonContent)
          if (data.image) {
            if (Array.isArray(data.image)) {
              for (const img of data.image) {
                addImage(typeof img === 'string' ? img : img.url || img)
              }
            } else {
              addImage(typeof data.image === 'string' ? data.image : data.image.url || data.image)
            }
          }
        } catch (e) {}
      }
    }
    
    // Strategy 2: Product gallery images
    const galleryMatches = html.matchAll(/(?:data-src|data-lazy|data-original|data-zoom-image)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
    for (const m of galleryMatches) {
      addImage(m[1])
    }
    
    // Strategy 3: Cdiscount CDN images
    const cdnMatches = html.matchAll(/(https?:\/\/(?:f\.lp\.cnd|cd[0-9]+|static\.cdiscount)[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi)
    for (const m of cdnMatches) {
      // Clean up size modifiers and get full resolution
      let imgUrl = m[1]
        .replace(/_\d+x\d+\./, '.')
        .replace(/\/[a-z]_\d+_\d+\//, '/')
        .replace(/&w=\d+&h=\d+/, '')
      addImage(imgUrl)
    }
    
    // Strategy 4: Product image container
    const imgSrcMatches = html.matchAll(/class=["'][^"']*(?:product-image|gallery|zoom|main-image)[^"']*["'][^>]*>[\s\S]{0,500}?src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi)
    for (const m of imgSrcMatches) {
      addImage(m[1])
    }
  }
  
  // Fnac image extraction
  if (platform === 'fnac') {
    console.log('📚 Extracting Fnac images...')
    
    // Fnac uses static.fnac-static.com
    const fnacImgMatches = html.matchAll(/(https?:\/\/static\.fnac-static\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi)
    for (const m of fnacImgMatches) {
      let imgUrl = m[1].replace(/\/\d+_\d+\//, '/').replace(/_\d+\./, '.')
      addImage(imgUrl)
    }
    
    // JSON-LD
    const jsonLdFnac = html.match(/"image"\s*:\s*"([^"]+)"/i)
    if (jsonLdFnac) addImage(jsonLdFnac[1])
  }
  
  // Darty / Boulanger extraction
  if (platform === 'darty' || platform === 'boulanger') {
    console.log(`🏠 Extracting ${platform} images...`)
    
    const productImgMatches = html.matchAll(/(https?:\/\/(?:assets|media|images)\.[^"'\s]+\.(?:jpg|jpeg|png|webp)[^"'\s]*)/gi)
    for (const m of productImgMatches) {
      addImage(m[1])
    }
  }
  
  // Home Depot / Lowe's extraction
  if (platform === 'homedepot' || platform === 'lowes') {
    console.log(`🏪 Extracting ${platform} images...`)
    
    // They often use similar CDN patterns
    const productImgMatches = html.matchAll(/(https?:\/\/[^"'\s]*(?:images|media|assets)[^"'\s]+\.(?:jpg|jpeg|png|webp))/gi)
    for (const m of productImgMatches) {
      let imgUrl = m[1]
        .replace(/_\d+\./, '.')
        .replace(/\?.*$/, '')
      addImage(imgUrl)
    }
  }
  
  // Generic high quality extraction
  // Only use generic fallbacks if we don't already have enough images from platform-specific extraction
  if (images.length < 3) {
    const ogImages = html.matchAll(/og:image"[^>]*content="([^"]+)"/gi)
    for (const m of ogImages) {
      const imgUrl = m[1]
      if (!imgUrl.includes('logo')) {
        addImage(imgUrl)
      }
    }
    
    // Data-src with high resolution
    const dataSrcMatches = html.matchAll(/data-(?:src|original|zoom|large-src|big-src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)
    for (const m of dataSrcMatches) {
      addImage(m[1])
    }
    
    // Standard src with quality indicators
    const srcMatches = html.matchAll(/src="(https?:\/\/[^"]*(?:product|goods|item|main|large|original|zoom)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)
    for (const m of srcMatches) {
      addImage(m[1])
    }
  }
  
  console.log(`📸 Extracted ${images.length} images`)
  return images.slice(0, 20)
}

// Extract videos from the page
function extractVideos(html: string, platform: string): string[] {
  const videos: string[] = []
  const seenUrls = new Set<string>()
  
  // Helper to add video
  const addVideo = (url: string) => {
    if (!url) return

    const cleanUrl = String(url).replace(/\\u002F/g, '/').replace(/\\/g, '').trim()

    // Blob URLs come from browser runtime and are not usable outside Amazon page
    if (!cleanUrl.startsWith('http')) return
    if (cleanUrl.includes('blank') || cleanUrl.includes('placeholder')) return

    if (!seenUrls.has(cleanUrl) && videos.length < 10) {
      videos.push(cleanUrl)
      seenUrls.add(cleanUrl)
    }
  }
  // Platform-specific video extraction
  if (platform === 'amazon') {
    // Strategy 1: Look for Amazon video JSON data (BEST for Amazon)
    // Pattern: "url":"https://...mp4" or "videoUrl":"https://..."
    const jsonVideoMatches = html.matchAll(/"(?:url|videoUrl|video_url|videoSrc|src|streamingUrl)"[^:]*:\s*"(https?:\/\/[^"]+(?:\.mp4|\.webm|\.m3u8|m3u8)[^"]*)"/gi)
    for (const m of jsonVideoMatches) {
      addVideo(m[1])
    }
    
    // Strategy 2: Look for Amazon video data structure
    const videoDataMatch = html.match(/"videos?":\s*\[([\s\S]*?)\]/i)
    if (videoDataMatch) {
      const urlMatches = videoDataMatch[1].matchAll(/"(?:url|src|videoUrl)":\s*"([^"]+)"/gi)
      for (const m of urlMatches) {
        if (m[1].includes('mp4') || m[1].includes('webm') || m[1].includes('m3u8')) {
          addVideo(m[1])
        }
      }
    }
    
    // Strategy 3: Direct mp4/webm URLs
    const directVideoMatches = html.matchAll(/["'](https?:\/\/[^"']*(?:cloudfront\.net|amazonvideo|images-amazon|m\.media-amazon)[^"']*\.(?:mp4|webm)[^"']*)["']/gi)
    for (const m of directVideoMatches) {
      addVideo(m[1])
    }
    
    // Strategy 4: HLS streaming URLs
    const hlsMatches = html.matchAll(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/gi)
    for (const m of hlsMatches) {
      addVideo(m[1])
    }
  }
  
  if (platform === 'aliexpress') {
    // AliExpress video URLs
    const videoMatches = html.matchAll(/["'](https?:\/\/[^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi)
    for (const m of videoMatches) {
      addVideo(m[1])
    }
    
    // Video poster or data
    const videoJsonMatch = html.match(/videoUrl['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/i)
    if (videoJsonMatch) {
      addVideo(videoJsonMatch[1])
    }
  }
  
  if (platform === 'shopify') {
    console.log('🎬 Extracting Shopify videos...')
    
    // Shopify product media (videos are often in JSON)
    const mediaMatches = html.matchAll(/"(?:sources|preview_video|video_url|external_video)"\s*:\s*\[\s*{[^}]*"url"\s*:\s*"([^"]+)"/gi)
    for (const m of mediaMatches) {
      if (m[1].includes('.mp4') || m[1].includes('.webm') || m[1].includes('youtube') || m[1].includes('vimeo')) {
        addVideo(m[1])
      }
    }
    
    // Video tags with Shopify CDN
    const videoTagMatches = html.matchAll(/<video[^>]*>[\s\S]*?<source[^>]*src=["']([^"']+\.(?:mp4|webm))["']/gi)
    for (const m of videoTagMatches) {
      addVideo(m[1])
    }
    
    // YouTube/Vimeo embeds
    const embedMatches = html.matchAll(/(?:youtube\.com\/embed\/|vimeo\.com\/video\/)([^"'?\s]+)/gi)
    for (const m of embedMatches) {
      if (m[0].includes('youtube')) {
        addVideo(`https://www.youtube.com/embed/${m[1]}`)
      } else if (m[0].includes('vimeo')) {
        addVideo(`https://player.vimeo.com/video/${m[1]}`)
      }
    }
    
    // External video URLs in data attributes
    const externalVideoMatches = html.matchAll(/data-(?:video|media)-url=["']([^"']+)["']/gi)
    for (const m of externalVideoMatches) {
      addVideo(m[1])
    }
  }
  
  // Generic video extraction
  const genericVideoMatches = html.matchAll(/(?:src|data-src|data-video-url|videoUrl|video_url)=["'](https?:\/\/[^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi)
  for (const m of genericVideoMatches) {
    addVideo(m[1])
  }
  
  // Video tags
  const videoTagMatches = html.matchAll(/<video[^>]*src=["']([^"']+)["']/gi)
  for (const m of videoTagMatches) {
    addVideo(m[1])
  }
  
  // Source tags within video
  const sourceMatches = html.matchAll(/<source[^>]*src=["']([^"']+\.(?:mp4|webm))["']/gi)
  for (const m of sourceMatches) {
    addVideo(m[1])
  }
  
  console.log(`🎬 Found ${videos.length} videos`)
  return videos.slice(0, 10)
}

// Extract product variants for Amazon
function extractAmazonVariants(html: string, markdown: string = ''): any[] {
  const variants: any[] = []
  const seen = new Set<string>()

  console.log('🎨 Extracting Amazon variants...')

  const safeJsonParse = (str: string) => {
    try {
      return JSON.parse(str)
    } catch {
      return null
    }
  }

  const extractJsonValueByKey = (key: string): any => {
    // Finds the first occurrence of "<key>": and attempts to extract the following JSON object/array/string
    const idx = html.indexOf(`"${key}"`)
    if (idx === -1) return null

    const colonIdx = html.indexOf(':', idx)
    if (colonIdx === -1) return null

    // Skip whitespace
    let i = colonIdx + 1
    while (i < html.length && /\s/.test(html[i])) i++

    const first = html[i]
    if (first !== '{' && first !== '[' && first !== '"') return null

    if (first === '"') {
      const end = html.indexOf('"', i + 1)
      if (end === -1) return null
      return html.slice(i + 1, end)
    }

    const open = first
    const close = open === '{' ? '}' : ']'
    let depth = 0
    let inStr = false
    let escaped = false

    for (let j = i; j < html.length; j++) {
      const ch = html[j]
      if (inStr) {
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === '"') {
          inStr = false
        }
        continue
      }

      if (ch === '"') {
        inStr = true
        continue
      }

      if (ch === open) depth++
      if (ch === close) {
        depth--
        if (depth === 0) {
          const raw = html.slice(i, j + 1)
          return safeJsonParse(raw)
        }
      }
    }

    return null
  }

  const pushVariant = (attrs: Record<string, any>, asin?: string) => {
    const key = JSON.stringify({ asin: asin || '', attrs })
    if (seen.has(key)) return
    seen.add(key)
    variants.push({
      sku: asin || '',
      name: Object.values(attrs).filter(Boolean).join(' / ') || 'Variante',
      price: 0,
      stock: 0,
      image: null,
      attributes: attrs,
    })
  }

  // 1) Best case: dimensionToAsinMap + dimensionValuesDisplayData
  // This can give real combinations (color+size, etc.).
  const dimensionToAsinMap = extractJsonValueByKey('dimensionToAsinMap')
  const dimensionValuesDisplayData = extractJsonValueByKey('dimensionValuesDisplayData')
  const asinToDimensionValuesMap = extractJsonValueByKey('asinToDimensionValuesMap')

  if (asinToDimensionValuesMap && typeof asinToDimensionValuesMap === 'object') {
    console.log('📋 Found asinToDimensionValuesMap')
    for (const [asin, dim] of Object.entries(asinToDimensionValuesMap as Record<string, any>)) {
      if (dim && typeof dim === 'object') {
        // Replace internal ids with display names when available
        const attrs: Record<string, any> = {}
        for (const [k, v] of Object.entries(dim)) {
          const display = dimensionValuesDisplayData?.[k]?.[v as any]
          attrs[k] = display || v
        }
        pushVariant(attrs, asin)
      }
    }
  } else if (dimensionToAsinMap && typeof dimensionToAsinMap === 'object') {
    console.log('📋 Found dimensionToAsinMap')
    // Example keys can be like "color_name:Black,size_name:M" or dimension ids.
    for (const [k, asin] of Object.entries(dimensionToAsinMap as Record<string, any>)) {
      const attrs: Record<string, any> = {}
      const parts = String(k).split(',')
      for (const p of parts) {
        const [rawKey, rawVal] = p.split(':')
        if (!rawKey || rawVal == null) continue
        const key = rawKey.trim()
        const val = rawVal.trim()
        attrs[key] = dimensionValuesDisplayData?.[key]?.[val] || val
      }
      pushVariant(attrs, typeof asin === 'string' ? asin : undefined)
    }
  }

  // 2) Fallbacks (single-dimension lists)
  // variationValues / asinVariationValues
  const variationValues = extractJsonValueByKey('variationValues')
  if (variationValues && typeof variationValues === 'object') {
    console.log('📋 Found variationValues')
    for (const [key, values] of Object.entries(variationValues as Record<string, any>)) {
      if (Array.isArray(values)) {
        for (const v of values) pushVariant({ [key]: v })
      }
    }
  }

  const asinVariationValues = extractJsonValueByKey('asinVariationValues')
  if (asinVariationValues && typeof asinVariationValues === 'object') {
    console.log('📋 Found asinVariationValues')
    for (const [asin, attrs] of Object.entries(asinVariationValues as Record<string, any>)) {
      if (attrs && typeof attrs === 'object') pushVariant(attrs as Record<string, any>, asin)
    }
  }

  // 3) HTML extraction (color swatches + size dropdown)
  const colorMatches = html.matchAll(/id="color_name_(\d+)"[^>]*>[\s\S]{0,800}?alt="([^"]+)"/gis)
  for (const m of colorMatches) {
    const colorName = m[2].trim()
    if (colorName) pushVariant({ color_name: colorName })
  }

  // Sizes are often in <select> or buttons; try a broad pattern
  const sizeOptionMatches = html.matchAll(/id="native_dropdown_selected_size_name"[\s\S]{0,6000}?<option[^>]*>([^<]{1,40})<\/option>/gis)
  for (const m of sizeOptionMatches) {
    const v = m[1].trim()
    if (!v || /^taille$/i.test(v)) continue
    pushVariant({ size_name: v })
  }

  // 4) Markdown fallback
  if (markdown && variants.length === 0) {
    const mdColor = markdown.matchAll(/(?:couleur|color)[:\s]+([^\n,]+)/gi)
    for (const m of mdColor) pushVariant({ color_name: m[1].trim() })

    const mdSize = markdown.matchAll(/(?:taille|size)[:\s]+([^\n,]+)/gi)
    for (const m of mdSize) pushVariant({ size_name: m[1].trim() })
  }

  console.log(`🎨 Variants extracted: ${variants.length}`)
  return variants.slice(0, 200)
}

// Extract Shopify variants from product JSON
function extractShopifyVariants(html: string): any[] {
  const variants: any[] = []
  const seen = new Set<string>()
  
  console.log('🛍️ Extracting Shopify variants...')
  
  try {
    // Strategy 1: Look for product JSON data (most reliable)
    const productJsonPatterns = [
      /var\s+product\s*=\s*({[\s\S]*?});(?=\s*(?:var|const|let|function|<|$))/i,
      /window\.ShopifyProduct\s*=\s*({[\s\S]*?});(?=\s*(?:var|const|let|function|<|$))/i,
      /ShopifyAnalytics\.meta\.product\s*=\s*({[\s\S]*?});(?=\s*(?:var|const|let|function|<|$))/i,
    ]
    
    for (const pattern of productJsonPatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          // Clean up common JSON issues before parsing
          let jsonStr = match[1]
            .replace(/,\s*}/g, '}')  // Remove trailing commas
            .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
            .replace(/\\'/g, "'")    // Fix escaped quotes
          
          const data = JSON.parse(jsonStr)
          const productVariants = data.variants || data.product?.variants || []
          
          // Get options names safely
          const optionNames = Array.isArray(data.options) 
            ? data.options.map((o: any) => typeof o === 'string' ? o : o?.name || o)
            : []
          
          for (const v of productVariants) {
            const key = v.id?.toString() || v.sku || JSON.stringify(v)
            if (seen.has(key)) continue
            seen.add(key)
            
            // Build attributes from option values
            const attributes: Record<string, string> = {}
            if (v.option1) attributes[optionNames[0] || 'Option 1'] = v.option1
            if (v.option2) attributes[optionNames[1] || 'Option 2'] = v.option2
            if (v.option3) attributes[optionNames[2] || 'Option 3'] = v.option3
            
            // Handle price - can be in cents or already in decimal
            let price = 0
            if (typeof v.price === 'number') {
              price = v.price > 1000 ? v.price / 100 : v.price // If > 1000, likely in cents
            } else if (typeof v.price === 'string') {
              const parsed = parseFloat(v.price.replace(/[^0-9.,]/g, '').replace(',', '.'))
              price = parsed > 1000 ? parsed / 100 : parsed
            }
            
            variants.push({
              sku: v.sku || v.id?.toString() || '',
              name: v.title || v.name || Object.values(attributes).join(' / ') || 'Variant',
              price,
              stock: typeof v.inventory_quantity === 'number' ? v.inventory_quantity : (v.available ? 99 : 0),
              available: v.available ?? true,
              image: v.featured_image?.src || v.image || null,
              attributes,
              variant_id: v.id?.toString()
            })
          }
          
          if (variants.length > 0) {
            console.log(`📋 Found ${variants.length} Shopify variants from JSON`)
            break
          }
        } catch (e) {
          // Silent fail - try next pattern
        }
      }
    }
    
    // Strategy 2: Look for variants in script tags with specific patterns
    if (variants.length === 0) {
      const variantArrayMatch = html.match(/"variants"\s*:\s*(\[[^\]]+\])/i)
      if (variantArrayMatch) {
        try {
          const variantData = JSON.parse(variantArrayMatch[1])
          for (const v of variantData) {
            const key = v.id?.toString() || v.sku || JSON.stringify(v)
            if (seen.has(key)) continue
            seen.add(key)
            
            variants.push({
              sku: v.sku || v.id?.toString() || '',
              name: v.title || v.name || 'Variant',
              price: parseFloat(v.price) / 100 || 0,
              stock: v.inventory_quantity ?? (v.available ? 99 : 0),
              available: v.available ?? true,
              image: v.featured_image?.src || v.image || null,
              attributes: {}
            })
          }
        } catch (e) {
          console.log('Could not parse variant array')
        }
      }
    }
    
    // Strategy 3: Extract from select elements (fallback)
    if (variants.length === 0) {
      const optionMatches = html.matchAll(/data-variant-id=["'](\d+)["'][^>]*>([^<]+)</gi)
      for (const m of optionMatches) {
        if (!seen.has(m[1])) {
          seen.add(m[1])
          variants.push({
            sku: m[1],
            name: m[2].trim(),
            price: 0,
            stock: 99,
            available: true,
            image: null,
            attributes: {},
            variant_id: m[1]
          })
        }
      }
    }
  } catch (error) {
    console.error('Error extracting Shopify variants:', error)
  }
  
  console.log(`🎨 Shopify variants extracted: ${variants.length}`)
  return variants.slice(0, 100)
}

// Extract product variants
function extractVariants(html: string, platform: string, markdown: string = ''): any[] {
  if (platform === 'amazon') {
    return extractAmazonVariants(html, markdown)
  }
  
  if (platform === 'shopify') {
    return extractShopifyVariants(html)
  }
  
  const variants: any[] = []
  
  try {
    if (platform === 'aliexpress') {
      // AliExpress skuProducts or skuPropertyList
      const skuMatch = html.match(/skuProducts['"]\s*:\s*(\[[^\]]+\])/s) ||
                       html.match(/"skuModule"[^}]*"skuPriceList"\s*:\s*(\[[^\]]*\])/s)
      if (skuMatch) {
        try {
          const skuData = JSON.parse(skuMatch[1].replace(/'/g, '"'))
          for (const sku of skuData.slice(0, 50)) {
            variants.push({
              sku: sku.skuId || sku.id || '',
              name: sku.skuAttr || sku.name || '',
              price: parseFloat(sku.skuVal?.skuAmount?.value || sku.price || 0),
              stock: sku.skuVal?.availQuantity || sku.stock || 0,
              image: sku.skuVal?.image || sku.image || null,
              attributes: sku.propertyValueName || sku.attributes || {}
            })
          }
        } catch (e) {
          console.log('Error parsing AliExpress variants:', e)
        }
      }
      
      // Also try skuPropertyList for attributes
      const propMatch = html.match(/skuPropertyList['"]\s*:\s*(\[[^\]]+\])/s)
      if (propMatch && variants.length === 0) {
        try {
          const propData = JSON.parse(propMatch[1].replace(/'/g, '"'))
          for (const prop of propData) {
            for (const val of (prop.skuPropertyValues || [])) {
              variants.push({
                sku: val.propertyValueId || '',
                name: `${prop.skuPropertyName}: ${val.propertyValueDisplayName}`,
                price: 0,
                stock: 0,
                image: val.skuPropertyImagePath || null,
                attributes: {
                  [prop.skuPropertyName]: val.propertyValueDisplayName
                }
              })
            }
          }
        } catch (e) {
          console.log('Error parsing AliExpress properties:', e)
        }
      }
    }
    
    // Generic variant extraction using common patterns
    if (variants.length === 0) {
      // Look for variant selectors
      const selectMatches = html.matchAll(/<option[^>]*value=["']([^"']+)["'][^>]*>([^<]+)</gi)
      for (const m of selectMatches) {
        if (m[2] && !m[2].toLowerCase().includes('select') && !m[2].toLowerCase().includes('choisir')) {
          variants.push({
            sku: m[1],
            name: m[2].trim(),
            price: 0,
            stock: 0,
            image: null,
            attributes: {}
          })
        }
      }
      
      // Look for variant buttons
      const buttonMatches = html.matchAll(/data-(?:variant|option|sku)=["']([^"']+)["'][^>]*>([^<]*)</gi)
      for (const m of buttonMatches) {
        if (m[2]?.trim()) {
          variants.push({
            sku: m[1],
            name: m[2].trim(),
            price: 0,
            stock: 0,
            image: null,
            attributes: {}
          })
        }
      }
    }
  } catch (error) {
    console.error('Error extracting variants:', error)
  }
  
  return variants.slice(0, 100)
}

// Extract specifications/attributes
function extractSpecifications(html: string, platform: string = ''): Record<string, string> {
  const specs: Record<string, string> = {}
  
  try {
    if (platform === 'amazon') {
      // Amazon product details table
      const detailsMatch = html.match(/id="productDetails_techSpec_section_1"[^>]*>([\s\S]*?)<\/table>/i) ||
                           html.match(/id="technicalSpecifications_section_1"[^>]*>([\s\S]*?)<\/table>/i)
      if (detailsMatch) {
        const rowMatches = detailsMatch[1].matchAll(/<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([^<]+)<\/td>/gi)
        for (const m of rowMatches) {
          const key = m[1].trim()
          const value = m[2].trim()
          if (key && value) {
            specs[key] = value
          }
        }
      }
      
      // Amazon detail bullets
      const bulletMatches = html.matchAll(/<li[^>]*>\s*<span[^>]*class="[^"]*a-list-item[^"]*"[^>]*>([^<]+)<\/span>/gi)
      let bulletNum = 1
      for (const m of bulletMatches) {
        const text = m[1].trim()
        if (text && text.length > 10 && bulletNum <= 10) {
          specs[`Détail ${bulletNum}`] = text
          bulletNum++
        }
      }
    }
    
    // Common spec table patterns
    const specMatches = html.matchAll(/<tr[^>]*>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>\s*<t[hd][^>]*>([^<]+)<\/t[hd]>/gi)
    for (const m of specMatches) {
      const key = m[1].trim().replace(/:$/, '')
      const value = m[2].trim()
      if (key && value && key.length < 50 && value.length < 200) {
        specs[key] = value
      }
    }
    
    // DL/DT/DD patterns
    const dlMatches = html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/gi)
    for (const m of dlMatches) {
      const key = m[1].trim().replace(/:$/, '')
      const value = m[2].trim()
      if (key && value && key.length < 50 && value.length < 200) {
        specs[key] = value
      }
    }
  } catch (error) {
    console.error('Error extracting specifications:', error)
  }
  
  return specs
}

// Extract shipping info
function extractShippingInfo(html: string, platform: string): any {
  const shipping: any = {
    methods: [],
    estimated_delivery: null,
    free_shipping: false
  }
  
  try {
    // Check for free shipping
    if (/free\s*(?:shipping|delivery)|livraison\s*gratuite|envoi\s*gratuit|retours?\s*gratuit/i.test(html)) {
      shipping.free_shipping = true
    }
    
    // Amazon Prime
    if (platform === 'amazon' && /prime/i.test(html)) {
      shipping.methods.push('prime')
      shipping.free_shipping = true
    }
    
    // Extract delivery estimates
    const deliveryMatch = html.match(/(?:delivered?|livr[ée]|arrival?|arriv[ée])[^<]*?(\d{1,2}[-–]\d{1,2})\s*(?:days?|jours?|business days?)/i) ||
                          html.match(/(\d{1,2}[-–]\d{1,2})\s*(?:days?|jours?|business days?)[^<]*?(?:shipping|delivery|livraison)/i) ||
                          html.match(/livraison[^<]*?(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d+/i)
    if (deliveryMatch) {
      shipping.estimated_delivery = deliveryMatch[1] + (deliveryMatch[1].includes('-') ? ' jours' : '')
    }
    
    // Extract shipping methods
    const methodMatches = html.matchAll(/(?:shipping|livraison)[^<]*?(standard|express|fast|priority|économique|rapide)[^<]*/gi)
    for (const m of methodMatches) {
      if (!shipping.methods.includes(m[1].toLowerCase())) {
        shipping.methods.push(m[1].toLowerCase())
      }
    }
  } catch (error) {
    console.error('Error extracting shipping info:', error)
  }
  
  return shipping
}

// Extract individual reviews from the page
function extractReviews(html: string, platform: string, markdown: string = ''): any[] {
  const reviews: any[] = []
  const maxReviews = 20
  
  try {
    if (platform === 'amazon') {
      // Amazon review blocks - multiple patterns
      // Pattern 1: review-id based blocks
      const reviewBlockMatches = html.matchAll(/id="customer_review-([^"]+)"[\s\S]*?(?=id="customer_review-|$)/gi)
      for (const match of reviewBlockMatches) {
        if (reviews.length >= maxReviews) break
        
        const block = match[0]
        const reviewId = match[1]
        
        // Extract reviewer name
        const nameMatch = block.match(/class="[^"]*a-profile-name[^"]*"[^>]*>([^<]+)</i)
        const customerName = nameMatch?.[1]?.trim() || 'Client Amazon'
        
        // Extract rating
        const ratingMatch = block.match(/(\d+(?:[,.]?\d*)?)\s*(?:out of|sur|\/)\s*5/i) ||
                           block.match(/class="[^"]*a-star-(\d)[^"]*"/i)
        const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 5
        
        // Extract title
        const titleMatch = block.match(/data-hook="review-title"[^>]*>(?:<span[^>]*>)?([^<]+)/i) ||
                          block.match(/review-title[^>]*>([^<]+)</i)
        const title = titleMatch?.[1]?.trim() || ''
        
        // Extract comment/body
        const bodyMatch = block.match(/data-hook="review-body"[^>]*>[\s\S]*?<span[^>]*>([^<]+(?:<br[^>]*>)?[^<]*)</i) ||
                         block.match(/review-text[^>]*>([^<]+)</i)
        let comment = bodyMatch?.[1]?.trim() || ''
        comment = comment.replace(/<br\s*\/?>/gi, '\n').slice(0, 2000)
        
        // Extract date
        const dateMatch = block.match(/data-hook="review-date"[^>]*>([^<]+)</i) ||
                         block.match(/review-date[^>]*>([^<]+)</i)
        let reviewDate = null
        if (dateMatch) {
          const dateStr = dateMatch[1]
          const parsed = Date.parse(dateStr.replace(/le\s*/i, '').replace(/Reviewed\s*in\s*[^on]+on\s*/i, ''))
          if (!isNaN(parsed)) {
            reviewDate = new Date(parsed).toISOString()
          }
        }
        
        // Check verified purchase
        const verifiedPurchase = /achat\s*v[ée]rifi[ée]|verified\s*purchase/i.test(block)
        
        // Extract helpful count
        const helpfulMatch = block.match(/(\d+)\s*(?:personnes?|people?)\s*(?:ont\s*trouv|found\s*this\s*helpful)/i)
        const helpfulCount = helpfulMatch ? parseInt(helpfulMatch[1]) : 0
        
        // Extract images in review
        const images: string[] = []
        const imgMatches = block.matchAll(/review-image-tile[^>]*>\s*<img[^>]*src="([^"]+)"/gi)
        for (const im of imgMatches) {
          if (images.length < 5) images.push(im[1])
        }
        
        if (comment || title) {
          reviews.push({
            customer_name: customerName,
            rating: Math.min(5, Math.max(0, rating)),
            title,
            comment,
            verified_purchase: verifiedPurchase,
            helpful_count: helpfulCount,
            review_date: reviewDate,
            images,
            source_review_id: reviewId
          })
        }
      }
      
      // Pattern 2: cr-review-list based (alternative Amazon layout)
      if (reviews.length === 0) {
        const altReviewMatches = html.matchAll(/class="[^"]*review[^"]*"[^>]*data-hook="review"[\s\S]*?(?=class="[^"]*review[^"]*"[^>]*data-hook="review"|<\/div>\s*<\/div>\s*<\/div>\s*$)/gi)
        for (const match of altReviewMatches) {
          if (reviews.length >= maxReviews) break
          const block = match[0]
          
          const nameMatch = block.match(/class="[^"]*a-profile-name[^"]*"[^>]*>([^<]+)</i)
          const ratingMatch = block.match(/(\d+(?:[,.]?\d*)?)\s*(?:out of|sur|\/)\s*5/i)
          const bodyMatch = block.match(/review-text[^>]*>([^<]+)</i)
          
          if (bodyMatch || nameMatch) {
            reviews.push({
              customer_name: nameMatch?.[1]?.trim() || 'Client Amazon',
              rating: ratingMatch ? Math.min(5, parseFloat(ratingMatch[1].replace(',', '.'))) : 5,
              title: '',
              comment: bodyMatch?.[1]?.trim().slice(0, 2000) || '',
              verified_purchase: /achat\s*v[ée]rifi[ée]|verified/i.test(block),
              helpful_count: 0,
              review_date: null,
              images: []
            })
          }
        }
      }

      // Pattern 3: Amazon "top reviews" section with a-section blocks
      if (reviews.length === 0) {
        const topReviewBlocks = html.matchAll(/class="[^"]*a-section\s+review\s+aok-relative[^"]*"[\s\S]*?(?=class="[^"]*a-section\s+review\s+aok-relative|id="reviewsMedley"|$)/gi)
        for (const match of topReviewBlocks) {
          if (reviews.length >= maxReviews) break
          const block = match[0]
          const nameMatch = block.match(/a-profile-name[^>]*>([^<]+)</i)
          const ratingMatch = block.match(/a-star-(\d)/i) || block.match(/(\d+(?:[,.]?\d*))\s*(?:sur|out of)\s*5/i)
          const titleMatch = block.match(/review-title[^>]*>(?:<span[^>]*>)*\s*([^<]+)/i)
          const bodyMatch = block.match(/reviewText[^>]*>[\s\S]*?<span[^>]*>([^<]+)/i) ||
                           block.match(/review-text-content[^>]*>[\s\S]*?<span[^>]*>([^<]+)/i)
          const comment = bodyMatch?.[1]?.trim().replace(/<br\s*\/?>/gi, '\n').slice(0, 2000) || ''
          const title = titleMatch?.[1]?.trim() || ''
          if (comment || title) {
            reviews.push({
              customer_name: nameMatch?.[1]?.trim() || 'Client Amazon',
              rating: ratingMatch ? Math.min(5, parseFloat(ratingMatch[1].replace(',', '.'))) : 5,
              title,
              comment,
              verified_purchase: /achat\s*v[ée]rifi[ée]|verified/i.test(block),
              helpful_count: 0,
              review_date: null,
              images: []
            })
          }
        }
      }

      // Pattern 4: Extract from Firecrawl markdown content (reviews rendered by JS)
      if (reviews.length === 0 && markdown) {
        console.log('📝 Trying markdown-based Amazon review extraction...')
        // Markdown often renders reviews as star blocks followed by text
        // Common patterns: "★★★★★" or "5.0 out of 5 stars" followed by review text
        const mdReviewBlocks = markdown.split(/(?=\d+[.,]\d*\s*(?:out of|sur)\s*5\s*(?:stars?|étoiles?))/gi)
        for (let i = 1; i < mdReviewBlocks.length && reviews.length < maxReviews; i++) {
          const block = mdReviewBlocks[i]
          const ratingMatch = block.match(/^(\d+[.,]?\d*)\s*(?:out of|sur)\s*5/i)
          if (!ratingMatch) continue
          
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
          // Skip the rating line itself
          let title = ''
          let comment = ''
          let customerName = 'Client Amazon'
          let verified = false
          
          for (let j = 1; j < lines.length && j < 10; j++) {
            const line = lines[j]
            if (/achat\s*v[ée]rifi[ée]|verified\s*purchase/i.test(line)) { verified = true; continue }
            if (/Reviewed\s*in|Commenté\s*en/i.test(line)) continue
            if (/personnes?\s*ont\s*trouv|people?\s*found/i.test(line)) continue
            if (/Signaler/i.test(line)) continue
            if (!title && line.length < 100 && line.length > 3) { title = line; continue }
            if (line.length > 20) { comment = (comment ? comment + '\n' : '') + line }
          }
          
          // Try to find author name (often "By AuthorName" or just a name before the rating)
          if (i > 0) {
            const prevBlock = mdReviewBlocks[i - 1]
            const prevLines = prevBlock.split('\n').map(l => l.trim()).filter(Boolean)
            const lastLine = prevLines[prevLines.length - 1]
            if (lastLine && lastLine.length < 40 && !/\d{2,}/.test(lastLine)) {
              customerName = lastLine.replace(/^By\s+/i, '').trim() || customerName
            }
          }
          
          if (comment || title) {
            reviews.push({
              customer_name: customerName,
              rating: Math.min(5, parseFloat(ratingMatch[1].replace(',', '.'))),
              title,
              comment: comment.slice(0, 2000),
              verified_purchase: verified,
              helpful_count: 0,
              review_date: null,
              images: []
            })
          }
        }
      }
    }
    
    if (platform === 'aliexpress') {
      // AliExpress reviews from feedback JSON
      const feedbackMatch = html.match(/feedbackList['"]\s*:\s*(\[[^\]]+\])/s) ||
                           html.match(/"reviews?"\s*:\s*(\[[^\]]+\])/si)
      if (feedbackMatch) {
        try {
          const feedbacks = JSON.parse(feedbackMatch[1])
          for (const fb of feedbacks) {
            if (reviews.length >= maxReviews) break
            reviews.push({
              customer_name: fb.buyerName || fb.buyer_name || fb.anonymous ? 'Client AliExpress' : (fb.name || 'Anonyme'),
              rating: Math.min(5, Math.max(0, fb.star || fb.rating || fb.buyerEval || 5)),
              title: '',
              comment: (fb.content || fb.feedback || fb.buyerFeedback || '').slice(0, 2000),
              verified_purchase: true,
              helpful_count: 0,
              review_date: fb.evalDate || fb.date ? new Date(fb.evalDate || fb.date).toISOString() : null,
              images: fb.images || []
            })
          }
        } catch (e) {
          console.error('Error parsing AliExpress reviews:', e)
        }
      }
    }
    
    // Generic review extraction for other platforms
    if (reviews.length === 0) {
      // Try schema.org Review markup
      const reviewSchemaMatches = html.matchAll(/"@type"\s*:\s*"Review"[\s\S]*?(?="@type"|$)/gi)
      for (const match of reviewSchemaMatches) {
        if (reviews.length >= maxReviews) break
        const block = match[0]
        
        const authorMatch = block.match(/"author"[^}]*"name"\s*:\s*"([^"]+)"/i)
        const ratingMatch = block.match(/"ratingValue"\s*:\s*"?(\d+(?:\.\d+)?)"?/i)
        const bodyMatch = block.match(/"reviewBody"\s*:\s*"([^"]+)"/i)
        const dateMatch = block.match(/"datePublished"\s*:\s*"([^"]+)"/i)
        
        if (bodyMatch || ratingMatch) {
          reviews.push({
            customer_name: authorMatch?.[1] || 'Client',
            rating: ratingMatch ? Math.min(5, parseFloat(ratingMatch[1])) : 5,
            title: '',
            comment: (bodyMatch?.[1] || '').slice(0, 2000),
            verified_purchase: false,
            helpful_count: 0,
            review_date: dateMatch ? new Date(dateMatch[1]).toISOString() : null,
            images: []
          })
        }
      }
    }
    
  } catch (error) {
    console.error('Error extracting reviews:', error)
  }
  
  return reviews
}

// Extract seller info
function extractSellerInfo(html: string, platform: string): any {
  const seller: any = {
    name: null,
    rating: null,
    reviews_count: null,
    url: null
  }
  
  try {
    if (platform === 'amazon') {
      // Amazon seller
      const sellerMatch = html.match(/id="sellerProfileTriggerId"[^>]*>([^<]+)</i) ||
                          html.match(/sold\s*by[^<]*<a[^>]*>([^<]+)</i) ||
                          html.match(/Vendu\s*par[^<]*<a[^>]*>([^<]+)</i)
      if (sellerMatch) {
        seller.name = sellerMatch[1].trim()
      } else {
        seller.name = 'Amazon'
      }
    } else {
      // Generic seller extraction
      const sellerMatch = html.match(/(?:sold\s*by|vendeur|seller|shop)[^<]*?[>:]([^<]{2,50})</i) ||
                          html.match(/store-name[^>]*>([^<]+)</i) ||
                          html.match(/shop-name[^>]*>([^<]+)</i)
      if (sellerMatch) {
        seller.name = sellerMatch[1].trim()
      }
    }
    
    // Seller rating
    const ratingMatch = html.match(/(?:seller|store|shop)[^<]*?(\d+\.?\d*)\s*%?\s*(?:positive|feedback)/i) ||
                        html.match(/(\d+\.?\d*)\s*(?:star|étoile|★)/i)
    if (ratingMatch) {
      seller.rating = parseFloat(ratingMatch[1])
    }
    
    // Reviews count
    const reviewsMatch = html.match(/(\d+(?:[,.\s]\d+)?[kKmM]?)\s*(?:reviews?|avis|évaluations?|ratings?)/i)
    if (reviewsMatch) {
      let count = reviewsMatch[1].replace(/[,\s]/g, '')
      if (count.toLowerCase().includes('k')) {
        count = String(parseFloat(count) * 1000)
      } else if (count.toLowerCase().includes('m')) {
        count = String(parseFloat(count) * 1000000)
      }
      seller.reviews_count = parseInt(count)
    }
  } catch (error) {
    console.error('Error extracting seller info:', error)
  }
  
  return seller
}

// Extract title specifically for Amazon
function extractAmazonTitle(html: string, markdown: string = ''): string {
  // Try productTitle span
  const titleMatch = html.match(/id="productTitle"[^>]*>([^<]+)</i)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // Try title from JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<\/?script[^>]*>/gi, '')
        const data = JSON.parse(jsonContent)
        if (data.name) return data.name
        if (data['@graph']) {
          for (const item of data['@graph']) {
            if (item.name) return item.name
          }
        }
      } catch (e) {}
    }
  }
  
  // Try og:title
  const ogMatch = html.match(/og:title"[^>]*content="([^"]+)"/i)
  if (ogMatch) {
    return ogMatch[1].replace(/\s*[-|:].*Amazon.*$/i, '').trim()
  }
  
  // Try <title>
  const htmlTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (htmlTitleMatch) {
    return htmlTitleMatch[1].replace(/\s*[-|:].*Amazon.*$/i, '').trim()
  }
  
  // Try markdown
  if (markdown) {
    const mdTitleMatch = markdown.match(/^#\s+(.+)$/m)
    if (mdTitleMatch) {
      return mdTitleMatch[1].trim()
    }
  }
  
  return 'Produit importé'
}

// Extract brand from product page (Amazon-optimized)
function extractBrand(html: string, markdown: string, platform: string): string {
  if (platform === 'amazon') {
    // Strategy 1: bylineInfo — Amazon FR: "Visiter la boutique BRAND" or "Marque : BRAND"
    // The link may contain inner spans, so grab the whole inner text
    const bylineBlock = html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i)
    if (bylineBlock) {
      // Strip inner HTML tags to get pure text
      const text = bylineBlock[1].replace(/<[^>]+>/g, '').trim()
      // Remove "Visiter la boutique" / "Visit the BRAND Store" prefix
      const cleaned = text
        .replace(/^Visiter\s*la\s*boutique\s*/i, '')
        .replace(/^Visit\s*the\s*/i, '')
        .replace(/\s*Store$/i, '')
        .replace(/^Marque\s*:\s*/i, '')
        .trim()
      if (cleaned && cleaned.length > 1 && cleaned.length < 80) {
        console.log(`✓ Brand from bylineInfo: ${cleaned}`)
        return cleaned
      }
    }

    // Strategy 2: "Marque" row in detail table
    const marqueMatch = html.match(/>\s*Marque\s*<\/t[hd]>\s*<td[^>]*>([^<]+)/i) ||
                        html.match(/>\s*Brand\s*<\/t[hd]>\s*<td[^>]*>([^<]+)/i)
    if (marqueMatch) {
      const brand = marqueMatch[1].trim()
      if (brand.length > 1 && brand.length < 80) {
        console.log(`✓ Brand from detail table: ${brand}`)
        return brand
      }
    }

    // Strategy 3: JSON-LD brand
    const jsonLdBrand = html.match(/"brand"\s*:\s*\{\s*"@type"\s*:\s*"Brand"\s*,\s*"name"\s*:\s*"([^"]+)"/i) ||
                        html.match(/"brand"\s*:\s*"([^"]+)"/i)
    if (jsonLdBrand) {
      const brand = jsonLdBrand[1].trim()
      if (brand.length > 1 && brand.length < 80 && brand.toLowerCase() !== 'amazon') {
        console.log(`✓ Brand from JSON-LD: ${brand}`)
        return brand
      }
    }

    // Strategy 4: Markdown
    if (markdown) {
      const mdBrand = markdown.match(/Marque\s*[:|]\s*([^\n|]+)/i) ||
                      markdown.match(/Brand\s*[:|]\s*([^\n|]+)/i)
      if (mdBrand) {
        const brand = mdBrand[1].trim()
        if (brand.length > 1 && brand.length < 80) {
          console.log(`✓ Brand from markdown: ${brand}`)
          return brand
        }
      }
    }
  }

  // Generic extraction for other platforms
  const genericBrand = html.match(/og:brand"[^>]*content="([^"]+)"/i) ||
                       html.match(/"brand"\s*:\s*\{\s*"name"\s*:\s*"([^"]+)"/i) ||
                       html.match(/"brand"\s*:\s*"([^"]+)"/i)
  if (genericBrand) {
    const brand = genericBrand[1].trim()
    if (brand.length > 1 && brand.length < 80) return brand
  }

  return platform
}

// Extract price specifically for Amazon (with markdown fallback)
function extractAmazonPrice(html: string, markdown?: string): { price: number; currency: string; originalPrice: number | null } {
  let price = 0
  let originalPrice: number | null = null
  let currency = 'EUR'

  // Helpers: parse European-format prices (149,00 € or 149.00€)
  const parseMoney = (raw: string): number => {
    if (!raw) return 0
    // Remove everything except digits, commas, dots
    let cleaned = raw.replace(/[^\d,\.]/g, '').trim()
    if (!cleaned) return 0
    
    // Handle European format: 149,00 or 1.499,00
    const commaCount = (cleaned.match(/,/g) || []).length
    const dotCount = (cleaned.match(/\./g) || []).length
    
    if (commaCount === 1 && dotCount === 0) {
      cleaned = cleaned.replace(',', '.')
    } else if (dotCount === 1 && commaCount === 0) {
      // Already 149.00
    } else if (commaCount === 1 && dotCount >= 1) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (dotCount === 1 && commaCount >= 1) {
      cleaned = cleaned.replace(/,/g, '')
    }
    
    const result = parseFloat(cleaned)
    return (!isNaN(result) && result > 0 && result < 50000) ? result : 0
  }

  // Detect currency
  if (html.includes('£')) currency = 'GBP'
  else if (html.includes('$') && !html.includes('€')) currency = 'USD'

  console.log('🔍 Searching for Amazon price...')

  // Strategy 1: Display price — prioritize corePriceDisplay / priceToPay container
  const coreBlock = html.match(/id="corePriceDisplay[^"]*"[\s\S]{0,2000}/i) ||
                    html.match(/id="corePrice[^"]*"[\s\S]{0,2000}/i)
  if (coreBlock) {
    const corePriceMatch = coreBlock[0].match(/(\d{1,5})[,\.](\d{2})\s*€/) ||
                           coreBlock[0].match(/class="[^"]*priceToPay[^"]*"[\s\S]*?(\d{1,5})[,\.](\d{2})/)
    if (corePriceMatch) {
      const whole = parseInt(corePriceMatch[1]) || 0
      const fraction = parseInt(corePriceMatch[2]) || 0
      if (whole > 0 && whole < 50000) {
        price = whole + fraction / 100
        console.log(`✓ Found core display price: ${price}`)
      }
    }
  }

  // Strategy 1b: priceToPay class directly
  if (price === 0) {
    const payMatch = html.match(/class="[^"]*priceToPay[^"]*"[^>]*>[\s\S]*?(\d{1,5})[,\.](\d{2})\s*€/i)
    if (payMatch) {
      const whole = parseInt(payMatch[1]) || 0
      const fraction = parseInt(payMatch[2]) || 0
      if (whole > 0 && whole < 50000) {
        price = whole + fraction / 100
        console.log(`✓ Found priceToPay: ${price}`)
      }
    }
  }

  // Strategy 3: Look for a-price-whole + a-price-fraction
  if (price === 0) {
    const wholeMatch = html.match(/class="[^"]*a-price-whole[^"]*"[^>]*>(\d+)/i)
    const fractionMatch = html.match(/class="[^"]*a-price-fraction[^"]*"[^>]*>(\d+)/i)
    if (wholeMatch) {
      const whole = parseInt(wholeMatch[1]) || 0
      const fraction = fractionMatch ? parseInt(fractionMatch[1]) || 0 : 0
      if (whole > 0 && whole < 10000) {
        price = whole + fraction / 100
        console.log(`✓ Found whole+fraction: ${price}`)
      }
    }
  }

  // Strategy 4: Search in markdown for price pattern (very reliable fallback)
  if (price === 0 && markdown) {
    // Match patterns like "149,00€" or "149.00 €" or "**149,00€**"
    const mdPriceMatch = markdown.match(/\*?\*?(\d{1,4})[,\.](\d{2})\s*€\*?\*?/i) ||
                         markdown.match(/€\s*(\d{1,4})[,\.](\d{2})/i) ||
                         markdown.match(/Prix\s*:?\s*(\d{1,4})[,\.](\d{2})/i)
    if (mdPriceMatch) {
      const whole = parseInt(mdPriceMatch[1]) || 0
      const fraction = parseInt(mdPriceMatch[2]) || 0
      if (whole > 0 && whole < 10000) {
        price = whole + fraction / 100
        console.log(`✓ Found markdown price: ${price}`)
      }
    }
  }

  // Strategy 5: a-offscreen prices (filter out installments)
  if (price === 0) {
    const offscreenMatches = [...html.matchAll(/<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([^<]{1,30})</gi)]
    for (const match of offscreenMatches) {
      const context = html.slice(Math.max(0, html.indexOf(match[0]) - 200), html.indexOf(match[0]) + match[0].length + 50)
      const isInstallment = /mois|month|mensuel|paiement|4x|3x|abonnement|subscription|\/mois/i.test(context)
      
      if (!isInstallment) {
        const extracted = parseMoney(match[1])
        if (extracted > 0 && extracted < 5000) {
          price = extracted
          console.log(`✓ Found a-offscreen price: ${price}`)
          break
        }
      }
    }
  }

  // Strategy 6: Meta tags
  if (price === 0) {
    const metaMatch = html.match(/product:price:amount"[^>]*content="([\d,\.]+)"/i) ||
                      html.match(/itemprop="price"[^>]*content="([\d,\.]+)"/i)
    if (metaMatch) {
      const extracted = parseMoney(metaMatch[1])
      if (extracted > 0) {
        price = extracted
        console.log(`✓ Found meta price: ${price}`)
      }
    }
  }

  // Strategy 7: JSON-LD
  if (price === 0) {
    const jsonLdMatch = html.match(/"price"\s*:\s*"?(\d+(?:[,\.]\d+)?)"?/i)
    if (jsonLdMatch) {
      const extracted = parseMoney(jsonLdMatch[1])
      if (extracted > 0 && extracted < 10000) {
        price = extracted
        console.log(`✓ Found JSON-LD price: ${price}`)
      }
    }
  }

  // Extract original/strike-through price
  const oldPricePatterns = [
    /class="[^"]*a-text-price[^"]*"[^>]*>[\s\S]{0,100}?<span[^>]*>([^<]{1,20})</i,
    /class="[^"]*a-text-strike[^"]*"[^>]*>([^<]{1,20})</i,
    /Ancien\s*prix[^:]*:\s*([^<\n]{1,20})/i,
  ]
  
  for (const pattern of oldPricePatterns) {
    const match = html.match(pattern)
    if (match) {
      const extracted = parseMoney(match[1])
      if (extracted > 0 && extracted > price) {
        originalPrice = extracted
        console.log(`✓ Found original price: ${originalPrice}`)
        break
      }
    }
  }

  console.log(`💰 Amazon price: ${price} ${currency} (original: ${originalPrice})`)
  return { price, currency, originalPrice }
}

// Extract SKU from product page (model number, not ASIN)
function extractAmazonSKU(html: string, markdown: string, asin: string): string {
  // Strategy 1: Look for model number in details table
  const modelPatterns = [
    /Numéro\s*de\s*modèle[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i,
    /Numéro\s*du\s*modèle[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i,
    /Model\s*Number[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i,
    /Modèle[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i,
    />Numéro\s*de\s*modèle[^<]*<[^>]*>([A-Z0-9][\w-]{2,20})</i,
    /data-hook="dp-product-meta"[\s\S]*?([A-Z]{2,}-\d+[\w-]*)/i,
  ]
  
  for (const pattern of modelPatterns) {
    const match = html.match(pattern)
    if (match && match[1] && match[1] !== asin) {
      console.log(`✓ Found model SKU: ${match[1]}`)
      return match[1].trim()
    }
  }
  
  // Strategy 2: Look in markdown for model pattern
  if (markdown) {
    const mdModelMatch = markdown.match(/Numéro\s*d[eu]\s*modèle[^:|\n]*[:|]\s*([A-Z0-9][\w-]{2,20})/i) ||
                         markdown.match(/Model[^:|\n]*[:|]\s*([A-Z0-9][\w-]{2,20})/i) ||
                         markdown.match(/Modèle[^:|\n]*[:|]\s*([A-Z0-9][\w-]{2,20})/i)
    if (mdModelMatch && mdModelMatch[1] && mdModelMatch[1] !== asin) {
      console.log(`✓ Found model from markdown: ${mdModelMatch[1]}`)
      return mdModelMatch[1].trim()
    }
  }
  
  // Strategy 3: Try to find part number
  const partMatch = html.match(/Part\s*Number[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i) ||
                    html.match(/Référence[^:]*:\s*<[^>]*>([A-Z0-9][\w-]{2,20})</i)
  if (partMatch && partMatch[1] && partMatch[1] !== asin) {
    console.log(`✓ Found part number: ${partMatch[1]}`)
    return partMatch[1].trim()
  }
  
  // Fallback to ASIN with prefix
  return `AMZ-${asin}`
}

// Scrape Shopify product using the public JSON API (most reliable method)
async function scrapeShopifyProduct(url: string, productHandle: string | null): Promise<any | null> {
  console.log('🛍️ Attempting Shopify JSON API scraping...')
  
  try {
    // Build the JSON API URL
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`
    
    // If we have a handle, use it directly
    let jsonUrl = ''
    if (productHandle) {
      jsonUrl = `${baseUrl}/products/${productHandle}.json`
    } else {
      // Try to extract handle from URL
      const handleMatch = url.match(/\/products\/([^\/\?#]+)/)
      if (handleMatch) {
        jsonUrl = `${baseUrl}/products/${handleMatch[1]}.json`
      }
    }
    
    if (!jsonUrl) {
      console.log('Could not build Shopify JSON URL')
      return null
    }
    
    console.log(`📡 Fetching Shopify JSON: ${jsonUrl}`)
    
    const response = await fetch(jsonUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    })
    
    if (!response.ok) {
      console.log(`Shopify JSON API returned ${response.status}`)
      return null
    }
    
    const data = await response.json()
    const product = data.product
    
    if (!product) {
      console.log('No product found in Shopify JSON response')
      return null
    }
    
    console.log(`✅ Shopify JSON API success: "${product.title}"`)
    
    // Extract all images (high quality)
    const images = (product.images || []).map((img: any) => {
      // Remove size modifiers for max quality
      return (img.src || img.url || '').replace(/_\d+x(\d+)?\./, '.').replace(/\?.*$/, '')
    }).filter(Boolean)
    
    // Extract variants with full details
    const variants = (product.variants || []).map((v: any) => {
      const attributes: Record<string, string> = {}
      if (v.option1) attributes[product.options?.[0]?.name || 'Option 1'] = v.option1
      if (v.option2) attributes[product.options?.[1]?.name || 'Option 2'] = v.option2
      if (v.option3) attributes[product.options?.[2]?.name || 'Option 3'] = v.option3
      
      return {
        sku: v.sku || v.id?.toString() || '',
        name: v.title || Object.values(attributes).join(' / '),
        price: parseFloat(v.price) || 0,
        compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
        stock: v.inventory_quantity ?? (v.available ? 99 : 0),
        available: v.available ?? true,
        image: v.featured_image?.src || (v.image_id && images[0]) || null,
        attributes,
        variant_id: v.id?.toString(),
        weight: v.weight,
        weight_unit: v.weight_unit
      }
    })
    
    // Get the best price (lowest variant price)
    const prices = variants.map((v: any) => v.price).filter((p: number) => p > 0)
    const price = prices.length > 0 ? Math.min(...prices) : 0
    
    // Get compare_at_price if available
    const compareAtPrices = variants.map((v: any) => v.compare_at_price).filter((p: number | null) => p && p > 0)
    const originalPrice = compareAtPrices.length > 0 ? Math.max(...compareAtPrices) : null
    
    // Safely handle tags - can be string or array
    const tagsArray = Array.isArray(product.tags) 
      ? product.tags 
      : typeof product.tags === 'string' 
        ? product.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []
    
    return {
      title: product.title || 'Produit Shopify',
      description: product.body_html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '',
      price,
      original_price: originalPrice,
      currency: 'EUR', // Shopify JSON doesn't include currency, default to EUR
      sku: product.variants?.[0]?.sku || product.handle || `SHOPIFY-${product.id}`,
      brand: product.vendor || 'Shopify Store',
      images,
      videos: [], // Will be populated from HTML if needed
      variants,
      specifications: {
        'Type': product.product_type || '',
        'Vendeur': product.vendor || '',
        'Tags': tagsArray.join(', ')
      },
      handle: product.handle,
      product_type: product.product_type,
      tags: tagsArray,
      created_at: product.created_at,
      updated_at: product.updated_at
    }
  } catch (error) {
    console.error('Shopify JSON API error:', error)
    return null
  }
}

// Scrape product data using Firecrawl if available, otherwise fallback
async function scrapeProductData(url: string, platform: string, externalProductId?: string | null): Promise<any> {
  // Amazon links with many params often lead to bot/error/offline pages; canonicalize early.
  const { productId: detectedProductId } = detectPlatform(url)
  const productId = externalProductId || detectedProductId
  const effectiveUrl = platform === 'amazon' ? canonicalizeAmazonUrl(url, productId) : url

  console.log(`📦 Scraping product from ${platform}: ${effectiveUrl}`)
  
  // Special handling for Shopify - try JSON API first (most reliable)
  if (platform === 'shopify') {
    const shopifyData = await scrapeShopifyProduct(url, productId)
    if (shopifyData) {
      // Shopify JSON API worked, return the data
      return {
        source_url: url,
        platform,
        scraped_at: new Date().toISOString(),
        ...shopifyData
      }
    }
    console.log('⚠️ Shopify JSON API failed, falling back to HTML scraping')
  }

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  let html = ''
  let markdown = ''
  
  try {
    if (firecrawlKey) {
      console.log('🔥 Using Firecrawl for enhanced scraping')
      
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['html', 'markdown', 'rawHtml'],
          onlyMainContent: false,
          waitFor: 5000, // Wait for JS rendering (increased for Amazon)
        }),
      })
      
      if (firecrawlResponse.ok) {
        const firecrawlData = await firecrawlResponse.json()
        html = firecrawlData.data?.rawHtml || firecrawlData.data?.html || firecrawlData.rawHtml || firecrawlData.html || ''
        markdown = firecrawlData.data?.markdown || firecrawlData.markdown || ''
        console.log(`✅ Firecrawl returned ${html.length} chars HTML, ${markdown.length} chars markdown`)
      } else {
        const errorText = await firecrawlResponse.text()
        console.log('⚠️ Firecrawl failed:', errorText)
      }
    }
    
    // Fallback to direct fetch
    if (!html || html.length < 5000) {
      console.log('📡 Using direct fetch...')
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        }
      })
      
      if (response.ok) {
        const fetchedHtml = await response.text()
        console.log(`📡 Direct fetch returned ${fetchedHtml.length} chars`)
        // Only use if better than Firecrawl
        if (fetchedHtml.length > html.length) {
          html = fetchedHtml
        }
      }
    }
    
    // Extract all product data
    let productData: any = {
      source_url: url,
      platform,
      scraped_at: new Date().toISOString()
    }
    
    // Platform-specific extraction
    if (platform === 'amazon') {
      productData.title = extractAmazonTitle(html, markdown)
      const priceData = extractAmazonPrice(html, markdown)
      productData.price = priceData.price
      productData.currency = priceData.currency
      productData.original_price = priceData.originalPrice
      // Amazon SKU extraction with model number
      productData.sku = extractAmazonSKU(html, markdown, productId || '')
    } else {
      // Generic title extraction
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                         html.match(/og:title"[^>]*content="([^"]+)"/i) ||
                         html.match(/product-title[^>]*>([^<]+)</i) ||
                         html.match(/<h1[^>]*>([^<]+)</i)
      productData.title = titleMatch?.[1]?.trim()
        .replace(/\s*[-|].*$/, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .slice(0, 500) || 'Produit importé'
      
      // Generic price extraction
      const priceMatch = html.match(/product:price:amount"[^>]*content="([\d,.]+)"/i) ||
                         html.match(/og:price:amount"[^>]*content="([\d,.]+)"/i) ||
                         html.match(/price[^>]*>[\s]*[€$£¥]?\s*([\d,.]+)/i) ||
                         html.match(/class="[^"]*price[^"]*"[^>]*>[\s€$£¥]*([\d,.]+)/i)
      productData.price = priceMatch ? parseFloat(priceMatch[1].replace(/[,\s]/g, '.').replace(/\.(?=.*\.)/g, '')) : 0
      
      // Currency
      const currencyMatch = html.match(/product:price:currency"[^>]*content="([^"]+)"/i) ||
                            html.match(/og:price:currency"[^>]*content="([^"]+)"/i)
      productData.currency = currencyMatch?.[1]?.toUpperCase() || (platform === 'aliexpress' ? 'USD' : 'EUR')
      
      // Generic SKU
      const skuMatch = html.match(/sku[^>]*>([^<]+)</i) ||
                       html.match(/product-id[^>]*>([^<]+)</i) ||
                       html.match(/"sku"\s*:\s*"([^"]+)"/i) ||
                       html.match(/data-sku="([^"]+)"/i)
      productData.sku = skuMatch?.[1]?.trim() || `IMPORT-${Date.now()}`
    }
    
    // Description
    const descMatch = html.match(/og:description"[^>]*content="([^"]+)"/i) ||
                      html.match(/meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                      html.match(/product-description[^>]*>([^<]{10,500})</i)
    productData.description = descMatch?.[1]?.trim()
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .slice(0, 5000) || ''
    
    // Brand — improved extraction for Amazon FR/US
    productData.brand = extractBrand(html, markdown, platform)
    
    // Extract HQ images
    productData.images = extractHQImages(html, platform, markdown)
    console.log(`📸 Found ${productData.images.length} high-quality images`)
    
    // Extract videos
    productData.videos = extractVideos(html, platform)
    console.log(`🎬 Found ${productData.videos.length} videos`)
    
    // Extract variants
    productData.variants = extractVariants(html, platform, markdown)
    console.log(`🎨 Found ${productData.variants.length} variants`)
    
    // Extract specifications
    productData.specifications = extractSpecifications(html, platform)
    console.log(`📋 Found ${Object.keys(productData.specifications).length} specifications`)
    
    // Extract shipping info
    productData.shipping = extractShippingInfo(html, platform)
    
    // Extract seller info
    productData.seller = extractSellerInfo(html, platform)
    
// Extract reviews summary
    const ratingMatch = html.match(/(\d+[,.]?\d*)\s*(?:out of|sur|\/)\s*5/i) ||
                        html.match(/class="[^"]*rating[^"]*"[^>]*>(\d+[,.]?\d*)/i) ||
                        html.match(/(\d+[,.]?\d*)\s*★/i)
    const reviewCountMatch = html.match(/(\d+(?:[,.\s]\d+)?)\s*(?:reviews?|avis|évaluations?|notes?)/i)
    productData.reviews = {
      rating: ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null,
      count: reviewCountMatch ? parseInt(reviewCountMatch[1].replace(/[,.\s]/g, '')) : null
    }
    
    // Extract individual reviews
    productData.extracted_reviews = extractReviews(html, platform, markdown)
    console.log(`⭐ Extracted ${productData.extracted_reviews.length} reviews`)
    
    console.log(`✅ Scraped: "${productData.title}" - ${productData.price} ${productData.currency}`)
    
    return productData
    
  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error(`Impossible de récupérer les données du produit: ${error.message}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // SECURITY: Extract user_id from JWT token, NOT from body
    const authHeader = req.headers.get('authorization')
    let userId: string | null = null
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: userData, error: authError } = await supabaseClient.auth.getUser(token)
      if (!authError && userData?.user) {
        userId = userData.user.id
      }
    }

    const body = await req.json()
    const { url, action = 'preview', target_store_id, price_multiplier = 1.5 } = body
    
    // Backward compat: accept user_id from body only if no JWT (extension calls)
    const user_id = userId || body.user_id
    
    if (!url) {
      throw new Error('URL requise')
    }
    
    if (!user_id) {
      throw new Error('Authentification requise')
    }

    console.log(`🔗 Quick Import from URL: ${url}`)
    
    // Detect platform
    const { platform, productId } = detectPlatform(url)
    console.log(`📍 Platform detected: ${platform}, Product ID: ${productId}`)
    
    if (platform === 'unknown') {
      throw new Error('Plateforme non reconnue. Plateformes supportées: AliExpress, Amazon, eBay, Temu, Wish, CJ Dropshipping, BigBuy, Banggood, DHgate, Shein, Etsy, Walmart, Shopify, WooCommerce')
    }

    // Scrape product data
    const productData = await scrapeProductData(url, platform, productId)
    
    // Preview mode
    if (action === 'preview') {
      const suggestedPrice = Math.ceil(productData.price * price_multiplier * 100) / 100
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'preview',
          data: {
            ...productData,
            suggested_price: suggestedPrice,
            profit_margin: productData.price > 0 ? Math.round(((suggestedPrice - productData.price) / suggestedPrice) * 100) : 0,
            platform_detected: platform,
            product_id: productId,
            has_variants: productData.variants?.length > 0,
            has_videos: productData.videos?.length > 0,
            has_reviews: productData.extracted_reviews?.length > 0,
            images_count: productData.images?.length || 0,
            variants_count: productData.variants?.length || 0,
            videos_count: productData.videos?.length || 0,
            reviews_count: productData.extracted_reviews?.length || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Import mode
    if (action === 'import') {
      const overrideData = body.override_data || {}
      const finalTitle = overrideData.title || productData.title
      const finalDescription = overrideData.description || productData.description
      const finalImages = overrideData.images || productData.images
      const finalBrand = overrideData.brand || productData.brand
      const finalSku = overrideData.sku || productData.sku
      const finalStatus = overrideData.status || 'draft'
      const finalCategory = overrideData.category || 'Importé'
      const finalVariants = overrideData.variants || productData.variants
      const finalVideos = overrideData.videos || productData.videos
      const suggestedPrice = overrideData.suggested_price || Math.ceil(productData.price * price_multiplier * 100) / 100
      const costPrice = overrideData.price || productData.price
      const importReviews = productData.extracted_reviews?.length > 0
      
      // 1) Insert into imported_products
      const { data: importedProduct, error: insertError } = await supabaseClient
        .from('imported_products')
        .insert({
          user_id,
          supplier_name: platform,
          supplier_product_id: productId || `${platform}-${Date.now()}`,
          name: finalTitle,
          description: finalDescription,
          price: suggestedPrice,
          cost_price: costPrice,
          currency: productData.currency === 'USD' ? 'EUR' : productData.currency,
          stock_quantity: 999,
          category: finalCategory,
          brand: finalBrand,
          sku: finalSku,
          image_urls: finalImages,
          original_images: productData.images,
          video_urls: finalVideos,
          variants: finalVariants,
          specifications: productData.specifications,
          shipping_info: productData.shipping,
          reviews_summary: productData.reviews,
          seller_info: productData.seller,
          status: finalStatus,
          source_url: url,
          sync_status: 'synced',
          metadata: {
            platform,
            original_price: productData.price,
            original_currency: productData.currency,
            scraped_at: productData.scraped_at,
            price_multiplier,
            has_variants: finalVariants?.length > 0,
            has_videos: finalVideos?.length > 0,
            has_reviews: importReviews,
            images_count: finalImages?.length || 0,
            variants_count: finalVariants?.length || 0,
            videos_count: finalVideos?.length || 0,
            reviews_count: productData.extracted_reviews?.length || 0
          }
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      console.log(`✅ Product imported to imported_products: ${importedProduct.id}`)

      // 2) Mirror insert into products table so it appears in /products
      const { error: productsInsertError } = await supabaseClient
        .from('products')
        .insert({
          user_id,
          title: finalTitle,
          name: finalTitle,
          description: finalDescription,
          price: suggestedPrice,
          cost_price: costPrice,
          sku: finalSku,
          brand: finalBrand,
          category: finalCategory,
          status: finalStatus,
          stock_quantity: 999,
          images: finalImages,
          image_url: finalImages?.[0] || null,
          primary_image_url: finalImages?.[0] || null,
          variants: finalVariants || null,
          supplier: platform,
          supplier_url: url,
          supplier_product_id: productId || null,
          vendor: finalBrand || platform,
        })

      if (productsInsertError) {
        console.error('⚠️ Mirror insert into products failed:', productsInsertError)
      } else {
        console.log(`✅ Product also inserted into products table`)
      }
      
      // Import reviews if available
      let reviewsImported = 0
      if (importReviews && productData.extracted_reviews.length > 0) {
        console.log(`📝 Importing ${productData.extracted_reviews.length} reviews...`)
        
        const reviewsToInsert = productData.extracted_reviews.map((review: any) => ({
          user_id,
          imported_product_id: importedProduct.id,
          product_name: finalTitle,
          product_sku: finalSku,
          customer_name: review.customer_name || 'Client',
          rating: review.rating || 5,
          title: review.title || '',
          comment: review.comment || '',
          verified_purchase: review.verified_purchase || false,
          helpful_count: review.helpful_count || 0,
          review_date: review.review_date || null,
          source: platform,
          source_url: url,
          images: review.images || [],
          metadata: {
            source_review_id: review.source_review_id,
            imported_at: new Date().toISOString()
          }
        }))
        
        const { data: insertedReviews, error: reviewsError } = await supabaseClient
          .from('imported_reviews')
          .insert(reviewsToInsert)
          .select()
        
        if (reviewsError) {
          console.error('Error importing reviews:', reviewsError)
        } else {
          reviewsImported = insertedReviews?.length || 0
          console.log(`✅ Imported ${reviewsImported} reviews`)
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'imported',
          data: importedProduct,
          message: `Produit "${finalTitle}" importé avec succès${reviewsImported > 0 ? ` avec ${reviewsImported} avis` : ''}`,
          summary: {
            images: finalImages?.length || 0,
            videos: finalVideos?.length || 0,
            variants: finalVariants?.length || 0,
            reviews: reviewsImported
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Action non reconnue')

  } catch (error) {
    console.error('Quick import error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
