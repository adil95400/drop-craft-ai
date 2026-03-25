import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface SupplierResult {
  supplierId: string
  supplierName: string
  price: number
  stock: number
  shippingTime: number
  currency: string
  url: string
  image?: string
  isBestPrice?: boolean
  isFastest?: boolean
}

function extractPrice(text: string): number | null {
  // Match common price patterns: $19.99, €29,99, 19.99€, US $5.50
  const patterns = [
    /(?:US\s*)?\$\s*(\d+[.,]\d{2})/i,
    /€\s*(\d+[.,]\d{2})/i,
    /(\d+[.,]\d{2})\s*(?:€|\$|USD|EUR)/i,
    /(\d+[.,]\d{2})/,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return parseFloat(m[1].replace(',', '.'))
  }
  return null
}

function extractRating(text: string): number | null {
  const m = text.match(/(\d+[.,]\d)\s*(?:\/\s*5|stars?|étoiles?)/i)
  if (m) return parseFloat(m[1].replace(',', '.'))
  return null
}

function scoreSupplier(result: SupplierResult): number {
  let score = 50
  // Price competitiveness (lower = better)
  if (result.price < 10) score += 20
  else if (result.price < 30) score += 15
  else if (result.price < 60) score += 10
  // Shipping speed
  if (result.shippingTime <= 3) score += 20
  else if (result.shippingTime <= 7) score += 10
  else if (result.shippingTime <= 14) score += 5
  // Stock availability
  if (result.stock > 100) score += 10
  else if (result.stock > 0) score += 5
  return Math.min(100, score)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { query, productTitle, sources } = await req.json()
    const searchTerm = query || productTitle
    if (!searchTerm) {
      return new Response(JSON.stringify({ error: 'query or productTitle required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY')
    if (!FIRECRAWL_KEY) {
      return new Response(JSON.stringify({ error: 'Firecrawl not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const marketplaces = sources || [
      { id: 'aliexpress', name: 'AliExpress', site: 'aliexpress.com', shippingDays: 12 },
      { id: 'amazon', name: 'Amazon', site: 'amazon.com', shippingDays: 3 },
      { id: 'ebay', name: 'eBay', site: 'ebay.com', shippingDays: 7 },
      { id: 'temu', name: 'Temu', site: 'temu.com', shippingDays: 10 },
    ]

    // Search all marketplaces in parallel via Firecrawl
    const searchPromises = marketplaces.map(async (mp: any) => {
      try {
        const resp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${FIRECRAWL_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `site:${mp.site} ${searchTerm}`,
            limit: 3,
          }),
        })

        if (!resp.ok) {
          console.error(`Firecrawl search for ${mp.name} failed:`, resp.status)
          return []
        }

        const data = await resp.json()
        const results: SupplierResult[] = (data.data || []).map((item: any, idx: number) => {
          const text = `${item.title || ''} ${item.description || ''}`
          const price = extractPrice(text) || 0
          return {
            supplierId: `${mp.id}-${idx}`,
            supplierName: mp.name,
            price,
            stock: price > 0 ? 100 : 0, // If we found a price, assume in stock
            shippingTime: mp.shippingDays,
            currency: '€',
            url: item.url || '',
            image: item.metadata?.ogImage || item.metadata?.image || undefined,
          }
        }).filter((r: SupplierResult) => r.price > 0)

        return results
      } catch (e) {
        console.error(`Search error for ${mp.name}:`, e)
        return []
      }
    })

    const allResults = (await Promise.all(searchPromises)).flat()

    // Mark best price and fastest
    if (allResults.length > 0) {
      const minPrice = Math.min(...allResults.map(r => r.price))
      const minShipping = Math.min(...allResults.map(r => r.shippingTime))
      for (const r of allResults) {
        r.isBestPrice = r.price === minPrice
        r.isFastest = r.shippingTime === minShipping
      }
    }

    // Sort by score
    const scored = allResults
      .map(r => ({ ...r, score: scoreSupplier(r) }))
      .sort((a, b) => b.score - a.score)

    return new Response(JSON.stringify({
      comparisons: scored,
      query: searchTerm,
      totalResults: scored.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('supplier-compare error:', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
