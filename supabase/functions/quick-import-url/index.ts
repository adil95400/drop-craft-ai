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

// Scrape les données du produit via l'URL
async function scrapeProductData(url: string, platform: string): Promise<any> {
  console.log(`📦 Scraping product from ${platform}: ${url}`)
  
  try {
    // Utilise un user-agent réaliste
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extraction basique des données selon la plateforme
    let productData: any = {
      source_url: url,
      platform,
      scraped_at: new Date().toISOString()
    }
    
    // Extraction du titre (balises communes)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/og:title"[^>]*content="([^"]+)"/i) ||
                       html.match(/product-title[^>]*>([^<]+)</i)
    productData.title = titleMatch?.[1]?.trim().replace(/\s*[-|].*$/, '') || 'Produit importé'
    
    // Extraction du prix
    const priceMatch = html.match(/price[^>]*>[\s]*[€$£¥]?\s*([\d,.]+)/i) ||
                       html.match(/og:price:amount"[^>]*content="([\d,.]+)"/i) ||
                       html.match(/product:price:amount"[^>]*content="([\d,.]+)"/i)
    productData.price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0
    
    // Extraction de la devise
    const currencyMatch = html.match(/product:price:currency"[^>]*content="([^"]+)"/i) ||
                          html.match(/og:price:currency"[^>]*content="([^"]+)"/i)
    productData.currency = currencyMatch?.[1] || (platform === 'aliexpress' ? 'USD' : 'EUR')
    
    // Extraction de la description
    const descMatch = html.match(/og:description"[^>]*content="([^"]+)"/i) ||
                      html.match(/meta[^>]*name="description"[^>]*content="([^"]+)"/i)
    productData.description = descMatch?.[1]?.trim() || ''
    
    // Extraction des images
    const imageMatches = html.matchAll(/og:image"[^>]*content="([^"]+)"/gi)
    const images: string[] = []
    for (const match of imageMatches) {
      if (match[1] && !match[1].includes('logo') && !match[1].includes('icon')) {
        images.push(match[1])
      }
    }
    // Images additionnelles depuis data-src ou src dans contexte produit
    const imgMatches = html.matchAll(/(?:data-src|src)="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)
    for (const match of imgMatches) {
      if (match[1] && !images.includes(match[1]) && images.length < 10) {
        images.push(match[1])
      }
    }
    productData.images = images.slice(0, 10)
    
    // Extraction du SKU/ID si possible
    const skuMatch = html.match(/sku[^>]*>([^<]+)</i) ||
                     html.match(/product-id[^>]*>([^<]+)</i)
    productData.sku = skuMatch?.[1]?.trim() || `IMPORT-${Date.now()}`
    
    // Extraction de la marque/vendeur
    const brandMatch = html.match(/brand[^>]*>([^<]+)</i) ||
                       html.match(/og:brand"[^>]*content="([^"]+)"/i) ||
                       html.match(/seller-name[^>]*>([^<]+)</i)
    productData.brand = brandMatch?.[1]?.trim() || platform
    
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
    
    // Détecte la plateforme
    const { platform, productId } = detectPlatform(url)
    console.log(`📍 Platform detected: ${platform}, Product ID: ${productId}`)
    
    if (platform === 'unknown') {
      throw new Error('Plateforme non reconnue. Plateformes supportées: AliExpress, Amazon, eBay, Temu, Wish, CJ Dropshipping, BigBuy, Banggood, DHgate, Shein, Etsy, Walmart, Shopify, WooCommerce')
    }

    // Scrape les données du produit
    const productData = await scrapeProductData(url, platform)
    
    // Si c'est juste un preview, retourne les données
    if (action === 'preview') {
      const suggestedPrice = Math.ceil(productData.price * price_multiplier * 100) / 100
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'preview',
          data: {
            ...productData,
            suggested_price: suggestedPrice,
            profit_margin: Math.round(((suggestedPrice - productData.price) / suggestedPrice) * 100),
            platform_detected: platform,
            product_id: productId
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Si action = 'import', enregistre le produit
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
          stock_quantity: 999, // Stock par défaut
          category: 'Importé',
          brand: productData.brand,
          sku: productData.sku,
          image_urls: productData.images,
          status: 'draft',
          source_url: url,
          sync_status: 'synced',
          metadata: {
            platform,
            original_price: productData.price,
            original_currency: productData.currency,
            scraped_at: productData.scraped_at,
            price_multiplier
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
          message: `Produit "${productData.title}" importé avec succès`
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
