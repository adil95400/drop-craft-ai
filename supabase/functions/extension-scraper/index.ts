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
  
  const invalidPatterns = ['sprite', 'pixel', 'grey', 'transparent', 'placeholder', 'loader', 'loading', 'spacer', '1x1', 'blank', 'empty', 'data:image', 'svg+xml']
  
  const urlLower = url.toLowerCase()
  for (const pattern of invalidPatterns) {
    if (urlLower.includes(pattern)) return ''
  }
  
  if (!url.startsWith('http')) {
    if (url.startsWith('//')) return 'https:' + url
    return ''
  }
  
  return url
}

// High-res image normalization
function normalizeToHighRes(imageUrl: string): string {
  if (!imageUrl) return ''
  
  let normalized = imageUrl
  
  // Amazon
  normalized = normalized.replace(/_AC_[A-Z]{2}\d+_/, '_AC_SL1500_')
  normalized = normalized.replace(/_S[XY]\d+_/, '_SL1500_')
  normalized = normalized.replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.')
  
  // AliExpress
  normalized = normalized.replace(/_\d+x\d+\./g, '.')
  normalized = normalized.replace(/\.jpg_\d+x\d+\.jpg/g, '.jpg')
  
  // Generic size transforms
  normalized = normalized.replace(/_100x100\./g, '.')
  normalized = normalized.replace(/_200x200\./g, '.')
  normalized = normalized.replace(/_300x300\./g, '.')
  
  return normalized
}

// Scrape using Firecrawl
async function scrapeWithFirecrawl(url: string, requestId: string): Promise<any> {
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
        formats: ['markdown', 'html'],
        waitFor: 2000,
        timeout: 30000
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
    const html = data.data.html || ''
    
    // Extract title
    let title = metadata.title || metadata.ogTitle || ''
    title = title.replace(/\|.*$/, '').replace(/-\s*Amazon.*$/i, '').trim()
    
    // Extract price from markdown/html
    let price = 0
    const priceMatch = markdown.match(/(?:€|EUR|\$|USD|£|GBP)\s*([\d,.]+)/) || 
                       markdown.match(/([\d,.]+)\s*(?:€|EUR|\$|USD|£|GBP)/) ||
                       html.match(/class="[^"]*price[^"]*"[^>]*>[\s\S]*?([\d,.]+\s*(?:€|\$|£))/)
    if (priceMatch) {
      price = parsePrice(priceMatch[1] || priceMatch[0])
    }
    
    // Extract images
    const images: string[] = []
    const ogImage = validateImageUrl(metadata.ogImage)
    if (ogImage) images.push(normalizeToHighRes(ogImage))
    
    // Extract from srcset and img tags
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
    for (const match of imgMatches) {
      const cleanUrl = validateImageUrl(match[1])
      if (cleanUrl && !images.includes(cleanUrl)) {
        images.push(normalizeToHighRes(cleanUrl))
      }
    }
    
    // Extract description
    let description = metadata.description || metadata.ogDescription || ''
    
    console.log(`[${requestId}] ✅ Product: ${title} (firecrawl)`)
    
    return {
      title: title.substring(0, 500),
      price,
      description: description.substring(0, 5000),
      images: images.slice(0, 20),
      source_url: url
    }
  } catch (error) {
    console.error(`[${requestId}] Firecrawl exception:`, error)
    return null
  }
}

// Scrape using direct fetch + JSON-LD
async function scrapeWithFetch(url: string, requestId: string): Promise<any> {
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
            const images = Array.isArray(product.image) ? product.image : (product.image ? [product.image] : [])
            
            console.log(`[${requestId}] ✅ Product: ${product.name} (json-ld)`)
            
            return {
              title: (product.name || '').substring(0, 500),
              price: parsePrice(offer?.price || offer?.lowPrice || 0),
              description: (product.description || '').substring(0, 5000),
              images: images.map((img: string) => normalizeToHighRes(validateImageUrl(img))).filter(Boolean).slice(0, 20),
              sku: product.sku || offer?.sku || '',
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
      console.log(`[${requestId}] ✅ Product: ${ogTitle} (meta tags)`)
      
      return {
        title: ogTitle.substring(0, 500),
        price: 0,
        description: (ogDescription || '').substring(0, 5000),
        images: ogImage ? [normalizeToHighRes(validateImageUrl(ogImage))] : [],
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
    
    const { action, url } = await req.json()
    
    if (action !== 'scrape_and_import' || !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Action ou URL manquante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] 🔍 Scraping: ${url}`)
    
    const platform = detectPlatform(url)
    
    // Try Firecrawl first, then fallback to direct fetch
    let productData = await scrapeWithFirecrawl(url, requestId)
    
    if (!productData || !productData.title) {
      productData = await scrapeWithFetch(url, requestId)
    }
    
    if (!productData || !productData.title) {
      console.error(`[${requestId}] Failed to extract product data`)
      return new Response(
        JSON.stringify({ success: false, error: 'Impossible d\'extraire les données du produit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into imported_products
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
        metadata: {
          imported_via: 'chrome_extension',
          imported_at: new Date().toISOString(),
          brand: productData.brand || null,
          rating: productData.rating || null,
          reviews_count: productData.reviews_count || 0,
          variants_count: productData.variants?.length || 0
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
        name: variant.name || `Variant ${idx + 1}`,
        sku: `${insertedProduct.sku}-V${idx + 1}`,
        price: productData.price || 0,
        stock_quantity: 100,
        attributes: {
          type: variant.type || 'option',
          image: variant.image || null,
          available: variant.available !== false
        },
        is_active: true
      }))

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
    }

    // Update token usage
    await supabase
      .from('extension_auth_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', authData.id)

    // Log analytics (never fail the import if analytics insert fails)
    try {
      const { error: analyticsError } = await supabase.from('extension_analytics').insert({
        user_id: authData.user_id,
        event_type: 'product_import',
        event_data: {
          product_id: insertedProduct.id,
          title: productData.title.substring(0, 100),
          platform,
          price: productData.price,
        },
        source_url: url,
      })

      if (analyticsError) {
        console.warn(`[${requestId}] Analytics insert warning:`, analyticsError.message)
      }
    } catch (e) {
      console.warn(`[${requestId}] Analytics insert exception:`, e)
    }

    console.log(`[${requestId}] ✅ Product imported: ${insertedProduct.id} | Variants: ${variantsInserted}`)

    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: insertedProduct.id,
          name: insertedProduct.name,
          price: insertedProduct.price,
          status: insertedProduct.status,
          variants_count: variantsInserted,
          images_count: productData.images?.length || 0
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
