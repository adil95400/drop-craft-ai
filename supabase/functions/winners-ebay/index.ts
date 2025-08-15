import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EbayItem {
  itemId: string
  title: string
  price: {
    value: number
    currency: string
  }
  image: {
    imageUrl: string
  }
  itemWebUrl: string
  seller: {
    feedbackPercentage: number
  }
  condition: string
  buyingOptions: string[]
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
    const category = url.searchParams.get('category_id') || ''
    const limit = parseInt(url.searchParams.get('limit') || '20')

    console.log(`Fetching eBay products for query: ${query}`)

    // Check cache first
    const cacheKey = `ebay_${query}_${category}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 15 * 60 * 1000) {
      console.log('Returning cached eBay data')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ebayClientId = Deno.env.get('EBAY_CLIENT_ID')
    
    let ebayProducts: WinnerItem[] = []

    if (ebayClientId) {
      try {
        // Get OAuth token first
        const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${ebayClientId}:${Deno.env.get('EBAY_CLIENT_SECRET')}`)}`,
          },
          body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
        })

        const tokenData = await tokenResponse.json()
        
        if (tokenData.access_token) {
          // Search eBay products
          const searchUrl = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}&sort=newlyListed`
          
          const response = await fetch(searchUrl, {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json',
            }
          })

          const data = await response.json()
          
          if (data.itemSummaries) {
            ebayProducts = data.itemSummaries.map((item: EbayItem, index: number) => ({
              id: item.itemId || `ebay_${Date.now()}_${index}`,
              title: item.title,
              price: item.price?.value || 0,
              currency: item.price?.currency || 'USD',
              image: item.image?.imageUrl || `https://picsum.photos/300/300?random=${index}`,
              source: 'ebay',
              url: item.itemWebUrl || '',
              rating: item.seller?.feedbackPercentage ? item.seller.feedbackPercentage / 20 : 4.0,
              trending_score: 70 + Math.random() * 30,
              market_demand: Math.floor(Math.random() * 100) + 1
            }))
          }
        }
      } catch (error) {
        console.error('eBay API error:', error)
      }
    }

    // Fallback to simulated data if no API key or API fails
    if (ebayProducts.length === 0) {
      console.log('Using simulated eBay data')
      ebayProducts = Array.from({ length: limit }, (_, i) => ({
        id: `ebay_sim_${Date.now()}_${i}`,
        title: `${query} ${['Bundle', 'Set', 'Kit', 'Collection', 'Pack'][i % 5]} ${i + 1}`,
        price: Math.floor(Math.random() * 300) + 15,
        currency: 'EUR',
        image: `https://picsum.photos/300/300?random=${100 + i}`,
        source: 'ebay_simulation',
        url: `https://ebay.com/item/${i}`,
        reviews: Math.floor(Math.random() * 2000) + 50,
        rating: 3.5 + Math.random() * 1.5,
        sales: Math.floor(Math.random() * 5000) + 200,
        trending_score: 60 + Math.random() * 40,
        market_demand: Math.floor(Math.random() * 100) + 1
      }))
    }

    const response = {
      products: ebayProducts,
      meta: {
        total: ebayProducts.length,
        query,
        category,
        timestamp: new Date().toISOString(),
        source: ebayClientId ? 'ebay_api' : 'ebay_simulation'
      }
    }

    // Cache the response
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    })

    console.log(`Retrieved ${ebayProducts.length} eBay products`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in winners-ebay:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})