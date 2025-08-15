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
  final_score?: number
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
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const sources = url.searchParams.get('sources')?.split(',') || ['trends', 'ebay', 'amazon']

    console.log(`Aggregating winners from sources: ${sources.join(', ')} for query: ${query}`)

    // Check cache first
    const cacheKey = `aggregated_${query}_${category}_${sources.sort().join('_')}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 10 * 60 * 1000) {
      console.log('Returning cached aggregated data')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const allProducts: WinnerItem[] = []
    const sourceResults: Record<string, any> = {}

    // Fetch from multiple sources in parallel
    const fetchPromises = sources.map(async (source) => {
      try {
        const response = await supabase.functions.invoke(`winners-${source}`, {
          body: { q: query, category, limit: Math.ceil(limit / sources.length) }
        })
        
        if (response.data?.products) {
          sourceResults[source] = response.data
          return response.data.products
        }
        return []
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error)
        return []
      }
    })

    const sourceProducts = await Promise.all(fetchPromises)
    sourceProducts.forEach(products => allProducts.push(...products))

    // Calculate final scores for ranking
    const scoredProducts = allProducts.map(product => {
      const baseScore = product.trending_score || 50
      const reviewsScore = product.reviews ? Math.min(Math.log10(product.reviews) * 10, 30) : 0
      const ratingScore = product.rating ? (product.rating - 3) * 10 : 0
      const demandScore = product.market_demand || 50
      const salesScore = product.sales ? Math.min(Math.log10(product.sales) * 5, 20) : 0
      
      // Price competitiveness (lower prices get slight boost)
      const priceScore = product.price > 0 ? Math.max(5 - Math.log10(product.price), 0) : 0
      
      const final_score = Math.round(
        baseScore * 0.3 +
        reviewsScore * 0.2 +
        ratingScore * 0.2 +
        demandScore * 0.15 +
        salesScore * 0.1 +
        priceScore * 0.05
      )

      return {
        ...product,
        final_score
      }
    })

    // Sort by final score and remove duplicates
    const uniqueProducts = Array.from(
      new Map(
        scoredProducts
          .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
          .map(p => [p.title.toLowerCase().slice(0, 30), p])
      ).values()
    ).slice(0, limit)

    const response = {
      products: uniqueProducts,
      sources: sourceResults,
      meta: {
        total: uniqueProducts.length,
        sources_used: sources,
        query,
        category,
        timestamp: new Date().toISOString(),
        scoring_algorithm: 'weighted_multi_factor'
      },
      stats: {
        avg_score: Math.round(uniqueProducts.reduce((sum, p) => sum + (p.final_score || 0), 0) / uniqueProducts.length),
        total_sources: sources.length,
        products_per_source: sourceProducts.map(arr => arr.length)
      }
    }

    // Cache the response
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    })

    console.log(`Aggregated ${uniqueProducts.length} winning products from ${sources.length} sources`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in winners-aggregator:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})