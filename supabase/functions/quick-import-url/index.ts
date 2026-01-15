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
  
  // Shopify stores (generic detection)
  if (urlLower.includes('/products/') && !urlLower.includes('amazon') && !urlLower.includes('ebay')) {
    const match = url.match(/\/products\/([^\/\?]+)/)
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
  
  return { platform: 'unknown', productId: null }
}

// Extract high quality images from various sources
function extractHQImages(html: string, platform: string, markdown: string = ''): string[] {
  const images: string[] = []
  const seenUrls = new Set<string>()
  
  // Helper to add unique image
  const addImage = (url: string) => {
    if (url && !seenUrls.has(url) && url.startsWith('http') && images.length < 30) {
      // Clean up URL
      const cleanUrl = url.replace(/\\u002F/g, '/').replace(/\\/g, '')
      if (!seenUrls.has(cleanUrl) && !cleanUrl.includes('icon') && !cleanUrl.includes('sprite')) {
        images.push(cleanUrl)
        seenUrls.add(cleanUrl)
      }
    }
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
    
    // Amazon image URLs with specific patterns
    const amazonImgMatches = html.matchAll(/(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s]+\.(?:jpg|png|webp))/gi)
    for (const m of amazonImgMatches) {
      // Convert to high quality by replacing size indicators
      let imgUrl = m[1]
        .replace(/\._[A-Z]{2}\d+_\./, '.')
        .replace(/\._S[LXSMXY]\d+_\./, '.')
        .replace(/\._AC_[^.]+\./, '.')
      addImage(imgUrl)
    }
    
    // Fallback: extract from markdown (Firecrawl often puts images here)
    if (markdown) {
      const mdImgMatches = markdown.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+\.(?:jpg|jpeg|png|webp)[^)]*)\)/gi)
      for (const m of mdImgMatches) {
        if (m[1].includes('amazon') || m[1].includes('media-amazon')) {
          addImage(m[1])
        }
      }
      
      // Also raw URLs
      const rawUrlMatches = markdown.matchAll(/(https?:\/\/m\.media-amazon\.com\/images\/I\/[^\s"'\)]+\.(?:jpg|png|webp))/gi)
      for (const m of rawUrlMatches) {
        addImage(m[1])
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
  
  // Generic high quality extraction
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
  
  console.log(`📸 Extracted ${images.length} images`)
  return images.slice(0, 20)
}

// Extract videos from the page
function extractVideos(html: string, platform: string): string[] {
  const videos: string[] = []
  const seenUrls = new Set<string>()
  
  // Platform-specific video extraction
  if (platform === 'amazon') {
    // Amazon video URLs
    const videoMatches = html.matchAll(/["'](https?:\/\/[^"']*\.(?:mp4|webm|m3u8)[^"']*)["']/gi)
    for (const m of videoMatches) {
      if (!seenUrls.has(m[1]) && !m[1].includes('blank')) {
        videos.push(m[1])
        seenUrls.add(m[1])
      }
    }
    
    // Amazon video data
    const videoDataMatch = html.match(/videoUrl['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/i)
    if (videoDataMatch && !seenUrls.has(videoDataMatch[1])) {
      videos.push(videoDataMatch[1])
      seenUrls.add(videoDataMatch[1])
    }
  }
  
  if (platform === 'aliexpress') {
    // AliExpress video URLs
    const videoMatches = html.matchAll(/["'](https?:\/\/[^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi)
    for (const m of videoMatches) {
      if (!seenUrls.has(m[1])) {
        videos.push(m[1])
        seenUrls.add(m[1])
      }
    }
    
    // Video poster or data
    const videoJsonMatch = html.match(/videoUrl['"]\s*:\s*['"](https?:\/\/[^'"]+)['"]/i)
    if (videoJsonMatch && !seenUrls.has(videoJsonMatch[1])) {
      videos.push(videoJsonMatch[1])
      seenUrls.add(videoJsonMatch[1])
    }
  }
  
  // Generic video extraction
  const genericVideoMatches = html.matchAll(/(?:src|data-src|data-video-url|videoUrl|video_url)=["'](https?:\/\/[^"']+\.(?:mp4|webm|m3u8)[^"']*)["']/gi)
  for (const m of genericVideoMatches) {
    if (!seenUrls.has(m[1]) && videos.length < 5) {
      videos.push(m[1])
      seenUrls.add(m[1])
    }
  }
  
  // Video tags
  const videoTagMatches = html.matchAll(/<video[^>]*src=["']([^"']+)["']/gi)
  for (const m of videoTagMatches) {
    if (!seenUrls.has(m[1]) && videos.length < 5) {
      videos.push(m[1])
      seenUrls.add(m[1])
    }
  }
  
  // Source tags within video
  const sourceMatches = html.matchAll(/<source[^>]*src=["']([^"']+\.(?:mp4|webm))["']/gi)
  for (const m of sourceMatches) {
    if (!seenUrls.has(m[1]) && videos.length < 5) {
      videos.push(m[1])
      seenUrls.add(m[1])
    }
  }
  
  return videos.slice(0, 5)
}

// Extract product variants for Amazon
function extractAmazonVariants(html: string, markdown: string = ''): any[] {
  const variants: any[] = []
  const seenVariants = new Set<string>()
  
  console.log('🎨 Extracting Amazon variants...')
  
  // Try to find twister/variation data
  const twisterMatch = html.match(/variationValues['"]\s*:\s*({[^}]+})/s) ||
                       html.match(/"twister-plus-js-data"[^>]*>([^<]+)</s)
  if (twisterMatch) {
    console.log('📋 Found twister/variation data')
    try {
      const data = JSON.parse(twisterMatch[1])
      for (const [key, values] of Object.entries(data)) {
        if (Array.isArray(values)) {
          for (const val of values) {
            const varId = `${key}:${val}`
            if (!seenVariants.has(varId)) {
              variants.push({
                sku: '',
                name: `${key}: ${val}`,
                price: 0,
                stock: 0,
                image: null,
                attributes: { [key]: val }
              })
              seenVariants.add(varId)
            }
          }
        }
      }
    } catch (e) {
      console.log('Error parsing twister data:', e)
    }
  }
  
  // Try asinVariationValues
  const asinMatch = html.match(/asinVariationValues['"]\s*:\s*({[^}]+})/s)
  if (asinMatch) {
    console.log('📋 Found asinVariationValues')
    try {
      const data = JSON.parse(asinMatch[1])
      for (const [asin, values] of Object.entries(data)) {
        if (typeof values === 'object' && values !== null) {
          const attrs = values as Record<string, string>
          const name = Object.values(attrs).join(' / ')
          if (!seenVariants.has(name)) {
            variants.push({
              sku: asin,
              name,
              price: 0,
              stock: 0,
              image: null,
              attributes: attrs
            })
            seenVariants.add(name)
          }
        }
      }
    } catch (e) {
      console.log('Error parsing asin data:', e)
    }
  }
  
  // Extract color/size options from HTML
  const colorMatches = html.matchAll(/id="color_name_(\d+)"[^>]*>.*?alt="([^"]+)"/gis)
  for (const m of colorMatches) {
    const colorName = m[2].trim()
    if (!seenVariants.has(`color:${colorName}`)) {
      variants.push({
        sku: m[1],
        name: `Couleur: ${colorName}`,
        price: 0,
        stock: 0,
        image: null,
        attributes: { color: colorName }
      })
      seenVariants.add(`color:${colorName}`)
    }
  }
  
  // Extract sizes from dropdown or buttons
  const sizeMatches = html.matchAll(/data-csa-c-item-id="([^"]*size[^"]*)"[^>]*>([^<]+)</gi) ||
                      html.matchAll(/id="size_name_(\d+)"[^>]*>.*?class="[^"]*swatch[^"]*"[^>]*>([^<]+)</gis)
  for (const m of sizeMatches) {
    const sizeName = m[2].trim()
    if (sizeName && !seenVariants.has(`size:${sizeName}`)) {
      variants.push({
        sku: m[1],
        name: `Taille: ${sizeName}`,
        price: 0,
        stock: 0,
        image: null,
        attributes: { size: sizeName }
      })
      seenVariants.add(`size:${sizeName}`)
    }
  }
  
  // Try select dropdowns
  const selectMatches = html.matchAll(/dropdown_selected_size_name[^>]*>([^<]+)</gi)
  for (const m of selectMatches) {
    const sizeName = m[1].trim()
    if (sizeName && sizeName !== 'Taille' && !seenVariants.has(`size:${sizeName}`)) {
      variants.push({
        sku: '',
        name: `Taille: ${sizeName}`,
        price: 0,
        stock: 0,
        image: null,
        attributes: { size: sizeName }
      })
      seenVariants.add(`size:${sizeName}`)
    }
  }
  
  // Extract from markdown if available
  if (markdown && variants.length === 0) {
    // Look for color/size mentions in markdown
    const mdColorMatches = markdown.matchAll(/(?:couleur|color)[:\s]+([^\n,]+)/gi)
    for (const m of mdColorMatches) {
      const colorName = m[1].trim()
      if (!seenVariants.has(`color:${colorName}`)) {
        variants.push({
          sku: '',
          name: `Couleur: ${colorName}`,
          price: 0,
          stock: 0,
          image: null,
          attributes: { color: colorName }
        })
        seenVariants.add(`color:${colorName}`)
      }
    }
    
    const mdSizeMatches = markdown.matchAll(/(?:taille|size)[:\s]+([^\n,]+)/gi)
    for (const m of mdSizeMatches) {
      const sizeName = m[1].trim()
      if (!seenVariants.has(`size:${sizeName}`)) {
        variants.push({
          sku: '',
          name: `Taille: ${sizeName}`,
          price: 0,
          stock: 0,
          image: null,
          attributes: { size: sizeName }
        })
        seenVariants.add(`size:${sizeName}`)
      }
    }
  }
  
  return variants.slice(0, 100)
}

// Extract product variants
function extractVariants(html: string, platform: string, markdown: string = ''): any[] {
  if (platform === 'amazon') {
    return extractAmazonVariants(html, markdown)
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

// Extract price specifically for Amazon
function extractAmazonPrice(html: string): { price: number; currency: string; originalPrice: number | null } {
  let price = 0
  let originalPrice: number | null = null
  let currency = 'EUR'
  
  // Try corePrice container
  const corePriceMatch = html.match(/id="corePrice[^"]*"[\s\S]*?class="[^"]*a-price[^"]*"[\s\S]*?aria-hidden="true"[^>]*>\s*<span[^>]*>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/i)
  if (corePriceMatch) {
    const priceStr = (corePriceMatch[1] + corePriceMatch[2]).replace(/[^\d,]/g, '').replace(',', '.')
    price = parseFloat(priceStr) || 0
  }
  
  // Try priceblock
  if (price === 0) {
    const priceBlockMatch = html.match(/id="priceblock_[^"]*price"[^>]*>([^<]*[\d,]+[^<]*)</i)
    if (priceBlockMatch) {
      const priceStr = priceBlockMatch[1].replace(/[^\d,]/g, '').replace(',', '.')
      price = parseFloat(priceStr) || 0
    }
  }
  
  // Try a-price-whole and a-price-fraction
  if (price === 0) {
    const wholeMatch = html.match(/class="[^"]*a-price-whole[^"]*"[^>]*>(\d+)/i)
    const fractionMatch = html.match(/class="[^"]*a-price-fraction[^"]*"[^>]*>(\d+)/i)
    if (wholeMatch) {
      price = parseFloat(`${wholeMatch[1]}.${fractionMatch?.[1] || '00'}`) || 0
    }
  }
  
  // Try generic price patterns
  if (price === 0) {
    const genericMatch = html.match(/(\d+)[,.](\d{2})\s*[€$£]/i) ||
                         html.match(/[€$£]\s*(\d+)[,.](\d{2})/i)
    if (genericMatch) {
      price = parseFloat(`${genericMatch[1]}.${genericMatch[2]}`) || 0
    }
  }
  
  // Extract original price (before discount)
  const oldPriceMatch = html.match(/class="[^"]*a-text-price[^"]*"[^>]*>[\s\S]*?<span[^>]*>([^<]+)</i) ||
                        html.match(/Ancien\s*prix[^<]*:\s*([\d,]+)/i)
  if (oldPriceMatch) {
    const oldPriceStr = oldPriceMatch[1].replace(/[^\d,]/g, '').replace(',', '.')
    originalPrice = parseFloat(oldPriceStr) || null
  }
  
  // Detect currency
  if (/[£]/.test(html)) currency = 'GBP'
  else if (/[$]/.test(html) && !/€/.test(html)) currency = 'USD'
  
  console.log(`💰 Amazon price: ${price} ${currency} (original: ${originalPrice})`)
  return { price, currency, originalPrice }
}

// Scrape product data using Firecrawl if available, otherwise fallback
async function scrapeProductData(url: string, platform: string): Promise<any> {
  console.log(`📦 Scraping product from ${platform}: ${url}`)
  
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
      const priceData = extractAmazonPrice(html)
      productData.price = priceData.price
      productData.currency = priceData.currency
      productData.original_price = priceData.originalPrice
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
    
    // SKU
    const skuMatch = html.match(/sku[^>]*>([^<]+)</i) ||
                     html.match(/product-id[^>]*>([^<]+)</i) ||
                     html.match(/"sku"\s*:\s*"([^"]+)"/i) ||
                     html.match(/data-sku="([^"]+)"/i)
    productData.sku = skuMatch?.[1]?.trim() || `IMPORT-${Date.now()}`
    
    // Brand
    const brandMatch = html.match(/id="bylineInfo"[^>]*>([^<]+)</i) ||
                       html.match(/Visiter\s*la\s*boutique\s*([^<]+)</i) ||
                       html.match(/brand[^>]*>([^<]+)</i) ||
                       html.match(/og:brand"[^>]*content="([^"]+)"/i) ||
                       html.match(/"brand"\s*:\s*"([^"]+)"/i)
    productData.brand = brandMatch?.[1]?.trim().replace(/^Visiter\s*la\s*boutique\s*/i, '').slice(0, 100) || platform
    
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

    const { url, user_id, action = 'preview', target_store_id, price_multiplier = 1.5 } = await req.json()

    if (!url || !user_id) {
      throw new Error('URL et user_id requis')
    }

    console.log(`🔗 Quick Import from URL: ${url}`)
    
    // Detect platform
    const { platform, productId } = detectPlatform(url)
    console.log(`📍 Platform detected: ${platform}, Product ID: ${productId}`)
    
    if (platform === 'unknown') {
      throw new Error('Plateforme non reconnue. Plateformes supportées: AliExpress, Amazon, eBay, Temu, Wish, CJ Dropshipping, BigBuy, Banggood, DHgate, Shein, Etsy, Walmart, Shopify, WooCommerce')
    }

    // Scrape product data
    const productData = await scrapeProductData(url, platform)
    
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
            images_count: productData.images?.length || 0,
            variants_count: productData.variants?.length || 0,
            videos_count: productData.videos?.length || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Import mode
    if (action === 'import') {
      const suggestedPrice = Math.ceil(productData.price * price_multiplier * 100) / 100
      
      const { data: importedProduct, error: insertError } = await supabaseClient
        .from('imported_products')
        .insert({
          user_id,
          supplier_name: platform,
          supplier_product_id: productId || `${platform}-${Date.now()}`,
          name: productData.title,
          description: productData.description,
          price: suggestedPrice,
          cost_price: productData.price,
          currency: productData.currency === 'USD' ? 'EUR' : productData.currency,
          stock_quantity: 999,
          category: 'Importé',
          brand: productData.brand,
          sku: productData.sku,
          image_urls: productData.images,
          original_images: productData.images,
          video_urls: productData.videos,
          variants: productData.variants,
          specifications: productData.specifications,
          shipping_info: productData.shipping,
          reviews_summary: productData.reviews,
          seller_info: productData.seller,
          status: 'draft',
          source_url: url,
          sync_status: 'synced',
          metadata: {
            platform,
            original_price: productData.price,
            original_currency: productData.currency,
            scraped_at: productData.scraped_at,
            price_multiplier,
            has_variants: productData.variants?.length > 0,
            has_videos: productData.videos?.length > 0,
            images_count: productData.images?.length || 0,
            variants_count: productData.variants?.length || 0,
            videos_count: productData.videos?.length || 0
          }
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      console.log(`✅ Product imported: ${importedProduct.id}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'imported',
          data: importedProduct,
          message: `Produit "${productData.title}" importé avec succès`,
          summary: {
            images: productData.images?.length || 0,
            videos: productData.videos?.length || 0,
            variants: productData.variants?.length || 0
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
