import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrendData {
  keyword: string
  interest: number
  relatedQueries: string[]
  category: string
  timestamp: string
}

interface WinnerItem {
  id: string
  title: string
  price: number
  currency: string
  image: string
  source: string
  url: string
  reviews?: number
  rating?: number
  sales?: number
  trending_score: number
  market_demand: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const query = url.searchParams.get('q') || 'trending products'
    const category = url.searchParams.get('category') || ''
    const limit = parseInt(url.searchParams.get('limit') || '20')

    console.log(`Fetching trends for query: ${query}`)

    // Check cache first
    const cacheKey = `trends_${query}_${category}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 30 * 60 * 1000) {
      console.log('Returning cached trends data')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Simulate Google Trends data (replace with real API when keys available)
    const trendData: TrendData = {
      keyword: query,
      interest: Math.floor(Math.random() * 100) + 1,
      relatedQueries: [
        `${query} 2024`,
        `best ${query}`,
        `cheap ${query}`,
        `${query} review`,
        `buy ${query}`
      ],
      category: category || 'Electronics',
      timestamp: new Date().toISOString()
    }

    // Generate trending products based on keywords
    const trendingProducts: WinnerItem[] = Array.from({ length: limit }, (_, i) => ({
      id: `trend_${Date.now()}_${i}`,
      title: `${query} ${['Pro', 'Max', 'Elite', 'Premium', 'Smart'][i % 5]} ${i + 1}`,
      price: Math.floor(Math.random() * 200) + 20,
      currency: 'EUR',
      image: `https://picsum.photos/300/300?random=${i}`,
      source: 'google_trends',
      url: `https://example.com/product/${i}`,
      reviews: Math.floor(Math.random() * 5000) + 100,
      rating: 4.0 + Math.random() * 1,
      sales: Math.floor(Math.random() * 10000) + 500,
      trending_score: trendData.interest + Math.random() * 20,
      market_demand: Math.floor(Math.random() * 100) + 1
    }))

    const response = {
      trends: trendData,
      products: trendingProducts,
      meta: {
        total: trendingProducts.length,
        query,
        category,
        timestamp: new Date().toISOString(),
        source: 'trends_simulation'
      }
    }

    // Cache the response
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    })

    console.log(`Generated ${trendingProducts.length} trending products`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in winners-trends:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})