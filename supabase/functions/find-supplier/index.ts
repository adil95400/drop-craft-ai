import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')

interface SupplierResult {
  platform: string
  platform_icon: string
  title: string
  price: number
  currency: string
  url: string
  image: string
  shipping_cost: number
  shipping_time: string
  seller_name: string
  seller_rating: number
  orders_count: number
  similarity_score: number
}

// Search AliExpress via RapidAPI
async function searchAliExpress(query: string, imageUrl: string | null): Promise<SupplierResult[]> {
  if (!RAPIDAPI_KEY) {
    console.log('[find-supplier] No RapidAPI key for AliExpress')
    return []
  }

  const results: SupplierResult[] = []
  
  try {
    const response = await fetch(
      `https://aliexpress-datahub.p.rapidapi.com/item_search?q=${encodeURIComponent(query)}&page=1`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'aliexpress-datahub.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      console.error('[find-supplier] AliExpress search error:', response.status)
      return []
    }

    const data = await response.json()
    const items = data.result?.resultList || []

    for (const item of items.slice(0, 10)) {
      results.push({
        platform: 'AliExpress',
        platform_icon: '🛒',
        title: item.item?.title || 'Product',
        price: parseFloat(item.item?.sku?.def?.promotionPrice || item.item?.sku?.def?.price || '0'),
        currency: 'USD',
        url: `https://www.aliexpress.com/item/${item.item?.itemId}.html`,
        image: item.item?.image || '',
        shipping_cost: 0,
        shipping_time: '15-30 days',
        seller_name: item.item?.store?.storeName || 'AliExpress Seller',
        seller_rating: parseFloat(item.item?.store?.positiveRate || '95') / 100,
        orders_count: parseInt(item.item?.trade?.tradeDesc?.replace(/[^\d]/g, '') || '0'),
        similarity_score: 0.85
      })
    }
  } catch (error) {
    console.error('[find-supplier] AliExpress exception:', error)
  }

  return results
}

// Search 1688 via Firecrawl (real scraping)
async function search1688(query: string): Promise<SupplierResult[]> {
  const results: SupplierResult[] = []
  
  if (!FIRECRAWL_API_KEY) {
    console.log('[find-supplier] No Firecrawl key for 1688 search')
    return results
  }

  try {
    const searchUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(query)}`
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown'],
        waitFor: 3000,
        timeout: 30000
      })
    })

    if (!response.ok) {
      console.error('[find-supplier] 1688 Firecrawl error:', response.status)
      return results
    }

    const data = await response.json()
    const markdown = data.data?.markdown || ''

    // Extract product info from scraped content
    const priceMatches = markdown.matchAll(/¥\s*([\d.,]+)/g)
    const titleMatches = markdown.matchAll(/\[([^\]]+)\]\([^)]+1688\.com/g)
    
    const prices = Array.from(priceMatches).slice(0, 5)
    const titles = Array.from(titleMatches).slice(0, 5)

    for (let i = 0; i < Math.min(prices.length, 5); i++) {
      const price = parseFloat(prices[i]?.[1]?.replace(',', '') || '0')
      const title = titles[i]?.[1] || `${query} - Factory ${i + 1}`
      
      if (price > 0) {
        results.push({
          platform: '1688.com',
          platform_icon: '🏭',
          title: title.substring(0, 100),
          price,
          currency: 'CNY',
          url: searchUrl,
          image: '',
          shipping_cost: 0,
          shipping_time: 'MOQ varies',
          seller_name: 'Factory Supplier',
          seller_rating: 0.92,
          orders_count: 0,
          similarity_score: 0.75
        })
      }
    }
  } catch (error) {
    console.error('[find-supplier] 1688 exception:', error)
  }

  return results
}

// Search Alibaba via Firecrawl
async function searchAlibaba(query: string): Promise<SupplierResult[]> {
  const results: SupplierResult[] = []

  if (!FIRECRAWL_API_KEY) {
    console.log('[find-supplier] No Firecrawl for Alibaba search')
    return results
  }

  try {
    const searchUrl = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['html', 'markdown'],
        waitFor: 3000,
        timeout: 30000
      })
    })

    if (!response.ok) {
      console.error('[find-supplier] Alibaba Firecrawl error:', response.status)
      return results
    }

    const data = await response.json()
    const html = data.data?.html || ''
    const markdown = data.data?.markdown || ''

    // Extract product listings from HTML
    const productMatches = html.matchAll(/data-content="([^"]+)"[^>]*>[\s\S]*?class="[^"]*price[^"]*"[^>]*>\$?([\d.,]+)/gi)
    
    let count = 0
    for (const match of productMatches) {
      if (count >= 8) break
      
      const title = match[1] || query
      const price = parseFloat(match[2]?.replace(',', '') || '0')
      
      if (price > 0) {
        results.push({
          platform: 'Alibaba',
          platform_icon: '🏪',
          title: title.substring(0, 100),
          price,
          currency: 'USD',
          url: searchUrl,
          image: '',
          shipping_cost: 0,
          shipping_time: 'MOQ varies',
          seller_name: 'Alibaba Supplier',
          seller_rating: 0.88,
          orders_count: 0,
          similarity_score: 0.70
        })
        count++
      }
    }

    // If scraping didn't find products, return empty (no mock data)
    console.log(`[find-supplier] Alibaba: found ${results.length} products`)
  } catch (error) {
    console.error('[find-supplier] Alibaba exception:', error)
  }

  return results
}

// Search via Firecrawl web search
async function reverseImageSearch(imageUrl: string, query: string): Promise<SupplierResult[]> {
  if (!FIRECRAWL_API_KEY) {
    console.log('[find-supplier] No Firecrawl for image search')
    return []
  }

  const results: SupplierResult[] = []

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        query: `${query} aliexpress OR 1688 OR alibaba wholesale supplier`,
        limit: 10,
        lang: 'en',
        scrapeOptions: {
          formats: ['markdown']
        }
      })
    })

    if (!response.ok) {
      console.error('[find-supplier] Firecrawl search error:', response.status)
      return results
    }

    const data = await response.json()
    const searchResults = data.data || []

    for (const item of searchResults) {
      const url = item.url || ''
      let platform = 'Web'
      let platformIcon = '🌐'

      if (url.includes('aliexpress')) {
        platform = 'AliExpress'
        platformIcon = '🛒'
      } else if (url.includes('1688')) {
        platform = '1688.com'
        platformIcon = '🏭'
      } else if (url.includes('alibaba')) {
        platform = 'Alibaba'
        platformIcon = '🏪'
      } else if (url.includes('dhgate')) {
        platform = 'DHgate'
        platformIcon = '📦'
      } else if (url.includes('made-in-china')) {
        platform = 'Made-in-China'
        platformIcon = '🇨🇳'
      }

      const priceMatch = item.markdown?.match(/\$\s*([\d.,]+)/) || 
                        item.markdown?.match(/([\d.,]+)\s*(?:USD|EUR|€|\$)/)
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : 0

      results.push({
        platform,
        platform_icon: platformIcon,
        title: item.title || query,
        price,
        currency: 'USD',
        url,
        image: '',
        shipping_cost: 0,
        shipping_time: 'Varies',
        seller_name: platform + ' Seller',
        seller_rating: 0.80,
        orders_count: 0,
        similarity_score: 0.60
      })
    }
  } catch (error) {
    console.error('[find-supplier] Image search exception:', error)
  }

  return results
}

// Fetch from database cache
async function fetchCachedSuppliers(supabase: any, query: string): Promise<SupplierResult[]> {
  const results: SupplierResult[] = []
  
  try {
    // Search supplier_products for matching items
    const { data: products } = await supabase
      .from('supplier_products')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(10)
    
    for (const product of products || []) {
      results.push({
        platform: product.source || 'Database',
        platform_icon: '💾',
        title: product.title || product.name,
        price: product.cost_price || product.price,
        currency: 'EUR',
        url: product.source_url || '',
        image: product.image_url || '',
        shipping_cost: 0,
        shipping_time: 'In stock',
        seller_name: product.supplier_name || 'Local Supplier',
        seller_rating: 0.95,
        orders_count: product.sales_count || 0,
        similarity_score: 0.90
      })
    }
  } catch (error) {
    console.error('[find-supplier] Cache lookup error:', error)
  }
  
  return results
}

// Calculate margin and savings
function calculateMargins(supplierPrice: number, supplierCurrency: string, retailPrice: number, retailCurrency: string): {
  margin_percent: number
  margin_amount: number
  savings: number
} {
  const rates: Record<string, number> = {
    'USD': 0.92,
    'CNY': 0.13,
    'EUR': 1.0,
    'GBP': 1.16
  }

  const supplierEur = supplierPrice * (rates[supplierCurrency] || 1)
  const retailEur = retailPrice * (rates[retailCurrency] || 1)

  if (retailEur <= 0) {
    return { margin_percent: 0, margin_amount: 0, savings: 0 }
  }

  const margin_amount = retailEur - supplierEur
  const margin_percent = (margin_amount / retailEur) * 100
  const savings = retailEur - supplierEur

  return {
    margin_percent: Math.round(margin_percent * 10) / 10,
    margin_amount: Math.round(margin_amount * 100) / 100,
    savings: Math.round(savings * 100) / 100
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = `fs_${Date.now()}`

  try {
    console.log(`[${requestId}] Find supplier request`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { 
      productTitle, 
      productImage, 
      productPrice, 
      productCurrency,
      searchMethod
    } = await req.json()

    if (!productTitle && !productImage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Titre ou image requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[${requestId}] Searching for: ${productTitle?.substring(0, 50)}...`)

    // Run all searches in parallel
    const searchPromises: Promise<SupplierResult[]>[] = []

    // Always check database cache first
    searchPromises.push(fetchCachedSuppliers(supabase, productTitle || ''))

    // Text-based searches
    if (productTitle && (searchMethod === 'text' || searchMethod === 'both' || !searchMethod)) {
      searchPromises.push(searchAliExpress(productTitle, productImage))
      searchPromises.push(search1688(productTitle))
      searchPromises.push(searchAlibaba(productTitle))
    }

    // Image-based search
    if (productImage && (searchMethod === 'image' || searchMethod === 'both')) {
      searchPromises.push(reverseImageSearch(productImage, productTitle || 'product'))
    }

    const allResults = await Promise.all(searchPromises)
    let suppliers = allResults.flat()

    // If no results from APIs, return empty with message (NO MOCK DATA)
    if (suppliers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          suppliers: [],
          best_deal: null,
          search_query: productTitle,
          retail_price: productPrice || 0,
          retail_currency: productCurrency || 'EUR',
          platforms_searched: ['AliExpress', '1688.com', 'Alibaba', 'Database'],
          message: 'No suppliers found. Try a different search term or configure API keys for better results.',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sort by price (lowest first)
    suppliers.sort((a, b) => {
      const rates: Record<string, number> = { 'USD': 1, 'CNY': 0.14, 'EUR': 1.08 }
      const priceA = a.price * (rates[a.currency] || 1)
      const priceB = b.price * (rates[b.currency] || 1)
      return priceA - priceB
    })

    // Add margin calculations
    const retailPrice = productPrice || 0
    const retailCurrency = productCurrency || 'EUR'

    const suppliersWithMargins = suppliers.map(supplier => ({
      ...supplier,
      ...calculateMargins(supplier.price, supplier.currency, retailPrice, retailCurrency)
    }))

    // Deduplicate by platform + similar price
    const seen = new Set<string>()
    const uniqueSuppliers = suppliersWithMargins.filter(s => {
      const key = `${s.platform}-${Math.round(s.price)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 20)

    console.log(`[${requestId}] Found ${uniqueSuppliers.length} suppliers`)

    const bestDeal = uniqueSuppliers.length > 0 ? uniqueSuppliers[0] : null

    return new Response(
      JSON.stringify({
        success: true,
        suppliers: uniqueSuppliers,
        best_deal: bestDeal,
        search_query: productTitle,
        retail_price: retailPrice,
        retail_currency: retailCurrency,
        platforms_searched: ['AliExpress', '1688.com', 'Alibaba', 'Database'],
        timestamp: new Date().toISOString()
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
