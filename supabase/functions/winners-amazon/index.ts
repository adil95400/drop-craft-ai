import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const query = url.searchParams.get('q') || 'trending'
    const category = url.searchParams.get('category') || ''
    const limit = parseInt(url.searchParams.get('limit') || '20')

    console.log(`Fetching Amazon products for query: ${query}`)

    // Check cache first
    const cacheKey = `amazon_${query}_${category}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 20 * 60 * 1000) {
      console.log('Returning cached Amazon data')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const amazonApiKey = Deno.env.get('AMAZON_PA_API_KEY')
    
    let amazonProducts: WinnerItem[] = []

    if (amazonApiKey) {
      // TODO: Implement real Amazon PA-API 5.0 integration
      // Requires: Access Key, Secret Key, Associate Tag, and proper signature
      console.log('Amazon PA-API integration not yet implemented - using simulation')
    }

    // Simulated Amazon data (replace with real API when keys available)
    amazonProducts = Array.from({ length: limit }, (_, i) => ({
      id: `amazon_sim_${Date.now()}_${i}`,
      title: `${query} ${['Amazon Choice', 'Best Seller', 'Prime', 'Recommended', 'Top Rated'][i % 5]} ${i + 1}`,
      price: Math.floor(Math.random() * 250) + 25,
      currency: 'EUR',
      image: `https://picsum.photos/300/300?random=${200 + i}`,
      source: 'amazon_simulation',
      url: `https://amazon.com/dp/B${String(i).padStart(9, '0')}`,
      reviews: Math.floor(Math.random() * 15000) + 1000,
      rating: 4.0 + Math.random() * 1,
      sales: Math.floor(Math.random() * 50000) + 2000,
      trending_score: 75 + Math.random() * 25,
      market_demand: Math.floor(Math.random() * 100) + 1
    }))

    const response = {
      products: amazonProducts,
      meta: {
        total: amazonProducts.length,
        query,
        category,
        timestamp: new Date().toISOString(),
        source: amazonApiKey ? 'amazon_api' : 'amazon_simulation',
        note: amazonApiKey ? 'Real Amazon PA-API (TODO: implement)' : 'Simulated data - add Amazon PA-API keys to activate'
      }
    }

    // Cache the response
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
    })

    console.log(`Generated ${amazonProducts.length} Amazon products`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in winners-amazon:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})