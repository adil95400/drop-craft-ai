import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  category?: string
  tags?: string[]
  saturation_level?: string
  asin?: string
  best_seller_rank?: number
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    
    let query: string, category: string, limit: number
    
    // Handle both GET and POST requests
    if (req.method === 'POST') {
      const body = await req.json()
      query = body.q || 'bestseller products'
      category = body.category || ''
      limit = parseInt(body.limit || '15')
    } else {
      const url = new URL(req.url)
      query = url.searchParams.get('q') || 'bestseller products'
      category = url.searchParams.get('category') || ''
      limit = parseInt(url.searchParams.get('limit') || '15')
    }

    console.log(`Fetching Amazon-style products for query: ${query}`)

    // Check cache first
    const cacheKey = `amazon_real_${query}_${category}`
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

    if (!LOVABLE_API_KEY) {
      console.warn('LOVABLE_API_KEY not set - using curated Amazon products')
      return generateAmazonFallback(query, category, limit, corsHeaders)
    }

    const aiPrompt = `Tu es un expert en analyse de produits Amazon et e-commerce. Génère une liste de ${limit} produits bestseller réalistes pour la recherche "${query}"${category ? ` dans la catégorie "${category}"` : ''}.

Ces produits doivent ressembler à de vrais produits Amazon avec:
- title: Nom de produit complet et réaliste style Amazon
- price: Prix en EUR réaliste (10-300€)
- wholesale_cost: Coût d'achat estimé (20-40% du prix)
- asin: Code ASIN fictif mais réaliste (B + 9 caractères)
- category: Catégorie Amazon
- best_seller_rank: Rang dans les bestsellers (1-100000)
- review_count: Nombre d'avis (50-50000)
- rating: Note (3.5-5.0)
- monthly_sales_estimate: Estimation ventes mensuelles
- trending_score: Score tendance (50-95)
- market_demand: Demande marché (40-100)
- saturation_level: low, medium, ou high
- tags: Mots-clés de recherche pertinents
- prime_eligible: true/false
- brand: Marque du produit

Réponds UNIQUEMENT avec un JSON valide contenant un tableau "products".`

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Tu es un assistant expert en analyse de produits Amazon. Tu génères des données de produits réalistes et structurées.' },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.7,
        }),
      })

      if (!aiResponse.ok) {
        console.error('AI API error:', aiResponse.status)
        return generateAmazonFallback(query, category, limit, corsHeaders)
      }

      const aiData = await aiResponse.json()
      const content = aiData.choices?.[0]?.message?.content || ''
      
      let parsedProducts = []
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          parsedProducts = parsed.products || []
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return generateAmazonFallback(query, category, limit, corsHeaders)
      }

      const amazonProducts: WinnerItem[] = parsedProducts.map((p: any, i: number) => ({
        id: `amazon_ai_${Date.now()}_${i}`,
        title: p.title || `Amazon Product ${i + 1}`,
        price: p.price || Math.floor(Math.random() * 200) + 20,
        currency: 'EUR',
        image: `https://picsum.photos/400/400?random=${Date.now() + i + 100}`,
        source: 'amazon_ai',
        url: `https://amazon.com/dp/${p.asin || 'B' + Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        reviews: p.review_count || Math.floor(Math.random() * 20000) + 100,
        rating: p.rating || 4.0 + Math.random(),
        sales: p.monthly_sales_estimate || Math.floor(Math.random() * 40000) + 500,
        trending_score: p.trending_score || 65 + Math.floor(Math.random() * 30),
        market_demand: p.market_demand || 55 + Math.floor(Math.random() * 40),
        category: p.category || category || 'General',
        tags: p.tags || ['amazon', 'bestseller'],
        saturation_level: p.saturation_level || 'medium',
        asin: p.asin || 'B' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        best_seller_rank: p.best_seller_rank || Math.floor(Math.random() * 50000) + 1
      }))

      const response = {
        products: amazonProducts,
        meta: {
          total: amazonProducts.length,
          query,
          category,
          timestamp: new Date().toISOString(),
          source: 'amazon_ai_powered'
        }
      }

      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: response,
        expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
      })

      console.log(`Generated ${amazonProducts.length} AI-powered Amazon products`)

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      return generateAmazonFallback(query, category, limit, corsHeaders)
    }

  } catch (error) {
    console.error('Error in winners-amazon:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateAmazonFallback(query: string, category: string, limit: number, corsHeaders: Record<string, string>) {
  // Curated list of real Amazon-style bestseller products
  const amazonBestsellers = [
    { title: 'Echo Dot (5th Gen) Smart Speaker with Alexa', price: 59.99, category: 'Electronics', rating: 4.7, reviews: 245000, trending: 95, asin: 'B09B8V1LZ3' },
    { title: 'Fire TV Stick 4K Streaming Device', price: 49.99, category: 'Electronics', rating: 4.6, reviews: 890000, trending: 93, asin: 'B079QHML21' },
    { title: 'Apple AirPods Pro (2nd Generation)', price: 249.00, category: 'Electronics', rating: 4.7, reviews: 125000, trending: 91, asin: 'B0D1XD1ZV3' },
    { title: 'Anker PowerCore 10000 Portable Charger', price: 25.99, category: 'Electronics', rating: 4.6, reviews: 156000, trending: 88, asin: 'B019GJLER8' },
    { title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker', price: 89.95, category: 'Kitchen', rating: 4.7, reviews: 178000, trending: 87, asin: 'B00FLYWNYQ' },
    { title: 'Lodge Cast Iron Skillet 10.25 Inch', price: 24.90, category: 'Kitchen', rating: 4.7, reviews: 89000, trending: 85, asin: 'B00006JSUB' },
    { title: 'Kindle Paperwhite (16 GB) E-Reader', price: 139.99, category: 'Electronics', rating: 4.6, reviews: 67000, trending: 86, asin: 'B09TMN58KL' },
    { title: 'Blink Mini Indoor Smart Security Camera', price: 29.99, category: 'Electronics', rating: 4.4, reviews: 234000, trending: 84, asin: 'B07X6C9RMF' },
    { title: 'JBL Flip 6 Waterproof Bluetooth Speaker', price: 99.95, category: 'Electronics', rating: 4.7, reviews: 45000, trending: 83, asin: 'B09GYTKRNN' },
    { title: 'Ninja Professional Countertop Blender', price: 89.99, category: 'Kitchen', rating: 4.7, reviews: 78000, trending: 82, asin: 'B06XNWD3PB' },
    { title: 'Ring Video Doorbell Wired', price: 59.99, category: 'Smart Home', rating: 4.5, reviews: 156000, trending: 81, asin: 'B08CKHPP52' },
    { title: 'Fitbit Inspire 3 Health & Fitness Tracker', price: 99.95, category: 'Fitness', rating: 4.4, reviews: 23000, trending: 80, asin: 'B0B5F9SDDL' },
    { title: 'COSORI Air Fryer Pro 5.8 Quart', price: 119.99, category: 'Kitchen', rating: 4.7, reviews: 89000, trending: 79, asin: 'B07GJBBGHG' },
    { title: 'Philips Sonicare Electric Toothbrush', price: 49.95, category: 'Health', rating: 4.6, reviews: 67000, trending: 78, asin: 'B078GVDB19' },
    { title: 'Roku Express HD Streaming Device', price: 29.00, category: 'Electronics', rating: 4.6, reviews: 234000, trending: 77, asin: 'B0BC4R7TP4' },
  ]

  const amazonProducts: WinnerItem[] = amazonBestsellers.slice(0, limit).map((p, i) => ({
    id: `amazon_fb_${Date.now()}_${i}`,
    title: p.title,
    price: p.price,
    currency: 'EUR',
    image: `https://picsum.photos/400/400?random=${Date.now() + i + 200}`,
    source: 'amazon_curated',
    url: `https://amazon.com/dp/${p.asin}`,
    reviews: p.reviews,
    rating: p.rating,
    sales: Math.floor(p.reviews * 0.15) + Math.floor(Math.random() * 5000),
    trending_score: p.trending,
    market_demand: p.trending - 5 + Math.floor(Math.random() * 15),
    category: p.category,
    tags: ['amazon', 'bestseller', p.category.toLowerCase()],
    saturation_level: p.trending > 85 ? 'medium' : 'low',
    asin: p.asin,
    best_seller_rank: Math.floor(Math.random() * 1000) + 1
  }))

  return new Response(JSON.stringify({
    products: amazonProducts,
    meta: {
      total: amazonProducts.length,
      query,
      category,
      timestamp: new Date().toISOString(),
      source: 'amazon_curated'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
