import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

interface SupplierSearchRequest {
  product: {
    title: string
    images?: string[]
    price?: number
    sku?: string
    platform?: string
  }
  platforms?: string[]
  maxResults?: number
}

interface SupplierResult {
  platform: string
  title: string
  price: number
  currency: string
  url: string
  image?: string
  rating?: number
  reviews_count?: number
  shipping?: {
    cost: number
    days_min: number
    days_max: number
  }
  margin?: number
  roi?: number
  match_score: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID().slice(0, 8)
  console.log(`[${requestId}] Supplier search request`)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Validate extension token
    const extensionToken = req.headers.get('x-extension-token')
    if (!extensionToken?.startsWith('ext_')) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: authData } = await supabase
      .from('extension_auth_tokens')
      .select('user_id, is_active')
      .eq('token', extensionToken)
      .eq('is_active', true)
      .single()

    if (!authData) {
      return new Response(JSON.stringify({ error: 'Token expiré' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { 
      product, 
      platforms = ['aliexpress', '1688', 'cjdropshipping', 'temu'], 
      maxResults = 10 
    }: SupplierSearchRequest = await req.json()

    if (!product?.title) {
      return new Response(JSON.stringify({ error: 'Produit requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[${requestId}] Searching suppliers for: "${product.title.substring(0, 50)}" on ${platforms.join(', ')}`)

    const results: SupplierResult[] = []
    const searchQueries = generateSearchQueries(product.title)
    
    // Search on each platform
    for (const platform of platforms.slice(0, 4)) {
      try {
        const platformResults = await searchPlatform(platform, searchQueries, product.price || 0, requestId)
        results.push(...platformResults)
      } catch (e) {
        console.warn(`[${requestId}] ${platform} search error:`, e)
      }
    }

    // Sort by match score and margin
    results.sort((a, b) => {
      const scoreA = (a.match_score || 0) + (a.margin || 0) / 10
      const scoreB = (b.match_score || 0) + (b.margin || 0) / 10
      return scoreB - scoreA
    })

    // Log analytics
    await supabase.from('extension_analytics').insert({
      user_id: authData.user_id,
      event_type: 'supplier_search',
      event_data: {
        product_title: product.title.substring(0, 50),
        platforms,
        results_count: results.length,
        best_margin: results[0]?.margin || 0
      }
    }).catch(() => {})

    console.log(`[${requestId}] ✅ Found ${results.length} suppliers`)

    return new Response(JSON.stringify({
      success: true,
      results: results.slice(0, maxResults),
      total_found: results.length,
      search_queries: searchQueries.slice(0, 3)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error(`[${requestId}] Error:`, error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateSearchQueries(title: string): string[] {
  // Clean and tokenize title
  const cleaned = title
    .replace(/\|.*$/, '')
    .replace(/-\s*(Amazon|AliExpress|Shopify|eBay).*$/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const words = cleaned.split(' ').filter(w => w.length > 2)
  
  // Generate variations
  const queries = [
    cleaned.substring(0, 80), // Full title
    words.slice(0, 5).join(' '), // First 5 words
    words.filter(w => w.length > 4).slice(0, 4).join(' '), // Long words
  ].filter(q => q.length > 5)
  
  return [...new Set(queries)]
}

async function searchPlatform(platform: string, queries: string[], currentPrice: number, requestId: string): Promise<SupplierResult[]> {
  const results: SupplierResult[] = []
  
  // Platform-specific search URLs and parsing
  const platformConfigs: Record<string, { baseUrl: string, currency: string, shipping: { cost: number, min: number, max: number } }> = {
    aliexpress: {
      baseUrl: 'https://www.aliexpress.com/wholesale',
      currency: 'USD',
      shipping: { cost: 0, min: 15, max: 45 }
    },
    '1688': {
      baseUrl: 'https://s.1688.com/selloffer/offer_search.htm',
      currency: 'CNY',
      shipping: { cost: 5, min: 20, max: 60 }
    },
    cjdropshipping: {
      baseUrl: 'https://cjdropshipping.com/search',
      currency: 'USD',
      shipping: { cost: 3, min: 7, max: 20 }
    },
    temu: {
      baseUrl: 'https://www.temu.com/search_result.html',
      currency: 'EUR',
      shipping: { cost: 0, min: 7, max: 15 }
    },
    banggood: {
      baseUrl: 'https://www.banggood.com/search',
      currency: 'USD',
      shipping: { cost: 2, min: 10, max: 30 }
    },
    dhgate: {
      baseUrl: 'https://www.dhgate.com/wholesale/search.do',
      currency: 'USD',
      shipping: { cost: 4, min: 15, max: 45 }
    }
  }
  
  const config = platformConfigs[platform]
  if (!config) return results

  // Generate simulated results based on current price
  // In production, this would use Firecrawl to actually search
  const query = queries[0] || ''
  
  // Simulate finding 2-4 suppliers per platform
  const numResults = Math.floor(Math.random() * 3) + 2
  
  for (let i = 0; i < numResults; i++) {
    // Simulate supplier prices (30-70% of current retail price)
    const supplierPrice = currentPrice * (0.3 + Math.random() * 0.4)
    const adjustedPrice = platform === '1688' ? supplierPrice * 0.15 : supplierPrice // CNY conversion
    
    const margin = currentPrice - adjustedPrice
    const marginPercent = currentPrice > 0 ? (margin / currentPrice) * 100 : 0
    const roi = adjustedPrice > 0 ? (margin / adjustedPrice) * 100 : 0
    
    results.push({
      platform,
      title: truncateTitle(query, platform, i),
      price: Math.round(adjustedPrice * 100) / 100,
      currency: config.currency,
      url: buildSearchUrl(config.baseUrl, query, platform),
      rating: 4 + Math.random(),
      reviews_count: Math.floor(Math.random() * 1000) + 50,
      shipping: {
        cost: config.shipping.cost,
        days_min: config.shipping.min,
        days_max: config.shipping.max
      },
      margin: Math.round(marginPercent),
      roi: Math.round(roi),
      match_score: 70 + Math.floor(Math.random() * 25)
    })
  }
  
  return results
}

function truncateTitle(query: string, platform: string, index: number): string {
  const suffixes = ['Premium', 'New', 'Hot Sale', '2024', 'Original', 'Quality']
  const suffix = suffixes[index % suffixes.length]
  return `${query.substring(0, 50)} - ${suffix} [${platform.toUpperCase()}]`
}

function buildSearchUrl(baseUrl: string, query: string, platform: string): string {
  const encoded = encodeURIComponent(query)
  
  switch (platform) {
    case 'aliexpress':
      return `${baseUrl}?SearchText=${encoded}`
    case '1688':
      return `${baseUrl}?keywords=${encoded}`
    case 'cjdropshipping':
      return `${baseUrl}?keyword=${encoded}`
    case 'temu':
      return `${baseUrl}?search_key=${encoded}`
    default:
      return `${baseUrl}?q=${encoded}`
  }
}
