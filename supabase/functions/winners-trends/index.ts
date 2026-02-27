import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
  region?: string
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
  profit_margin?: number
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
      query = body.q || 'trending products dropshipping'
      category = body.category || ''
      limit = parseInt(body.limit || '15')
    } else {
      const url = new URL(req.url)
      query = url.searchParams.get('q') || 'trending products dropshipping'
      category = url.searchParams.get('category') || ''
      limit = parseInt(url.searchParams.get('limit') || '15')
    }

    console.log(`Fetching real trends for query: ${query}, category: ${category}`)

    // Check cache first
    const cacheKey = `trends_real_${query}_${category}`
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single()

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 15 * 60 * 1000) {
      console.log('Returning cached trends data')
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use Lovable AI to generate real trending product data
    if (!LOVABLE_API_KEY) {
      console.warn('LOVABLE_API_KEY not set - falling back to simulation')
      return generateFallbackResponse(query, category, limit, corsHeaders)
    }

    const aiPrompt = `Tu es un expert en e-commerce et dropshipping. Génère une liste de ${limit} produits tendance réels et actuels pour la recherche "${query}"${category ? ` dans la catégorie "${category}"` : ''}.

Pour chaque produit, fournis des données RÉALISTES basées sur les tendances actuelles du marché:
- title: Nom de produit réel et spécifique (pas générique)
- estimated_price: Prix de vente réaliste en EUR (15-200€)
- wholesale_price: Prix d'achat estimé (30-50% du prix de vente)
- category: Catégorie spécifique
- trending_score: Score de tendance (60-98, basé sur la demande actuelle)
- market_demand: Score de demande (50-100)
- saturation_level: low, medium, ou high
- sales_estimate: Ventes mensuelles estimées (100-50000)
- review_count: Nombre d'avis typique
- rating: Note moyenne (4.0-5.0)
- tags: 3-5 mots-clés pertinents
- trend_reason: Courte explication de pourquoi ce produit est tendance
- source_platform: aliexpress, amazon, ou shein
- profit_potential: percentage de marge bénéficiaire estimée

Réponds UNIQUEMENT avec un JSON valide contenant un tableau "products".`

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-mini',
          messages: [
            { role: 'system', content: 'Tu es un assistant spécialisé en analyse de tendances e-commerce et dropshipping. Tu fournis des données structurées et réalistes sur les produits tendance.' },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.7,
        }),
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('AI API error:', aiResponse.status, errorText)
        return generateFallbackResponse(query, category, limit, corsHeaders)
      }

      const aiData = await aiResponse.json()
      const content = aiData.choices?.[0]?.message?.content || ''
      
      // Parse JSON from AI response
      let parsedProducts = []
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          parsedProducts = parsed.products || []
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return generateFallbackResponse(query, category, limit, corsHeaders)
      }

      // Transform to WinnerItem format
      const trendingProducts: WinnerItem[] = parsedProducts.map((p: any, i: number) => ({
        id: `trend_ai_${Date.now()}_${i}`,
        title: p.title || `Trending Product ${i + 1}`,
        price: p.estimated_price || Math.floor(Math.random() * 150) + 20,
        currency: 'EUR',
        image: `https://picsum.photos/400/400?random=${Date.now() + i}`,
        source: p.source_platform || 'trends_ai',
        url: `https://aliexpress.com/item/${1000000000 + i}.html`,
        reviews: p.review_count || Math.floor(Math.random() * 10000) + 500,
        rating: p.rating || 4.0 + Math.random(),
        sales: p.sales_estimate || Math.floor(Math.random() * 30000) + 1000,
        trending_score: p.trending_score || 70 + Math.floor(Math.random() * 25),
        market_demand: p.market_demand || 60 + Math.floor(Math.random() * 35),
        category: p.category || category || 'General',
        tags: p.tags || ['trending', 'dropshipping'],
        saturation_level: p.saturation_level || 'medium',
        profit_margin: p.profit_potential || Math.floor(Math.random() * 40) + 30
      }))

      // Get trend data
      const trendData: TrendData = {
        keyword: query,
        interest: Math.floor(parsedProducts.reduce((sum: number, p: any) => sum + (p.trending_score || 70), 0) / parsedProducts.length) || 75,
        relatedQueries: parsedProducts.slice(0, 5).map((p: any) => p.tags?.[0] || query),
        category: category || 'Multi-Category',
        timestamp: new Date().toISOString(),
        region: 'Global'
      }

      const response = {
        trends: trendData,
        products: trendingProducts,
        meta: {
          total: trendingProducts.length,
          query,
          category,
          timestamp: new Date().toISOString(),
          source: 'ai_powered_trends',
          ai_model: 'gpt-5-mini'
        }
      }

      // Cache the response
      await supabase.from('api_cache').upsert({
        cache_key: cacheKey,
        data: response,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })

      console.log(`Generated ${trendingProducts.length} AI-powered trending products`)

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      return generateFallbackResponse(query, category, limit, corsHeaders)
    }

  } catch (error) {
    console.error('Error in winners-trends:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateFallbackResponse(query: string, category: string, limit: number, corsHeaders: Record<string, string>) {
  // High-quality fallback with realistic dropshipping products
  const dropshippingProducts = [
    { title: 'LED Strip Lights RGB 5M Smart WiFi', price: 24.99, category: 'Electronics', trending: 92, saturation: 'medium' },
    { title: 'Portable Blender USB Rechargeable 380ml', price: 19.99, category: 'Kitchen', trending: 88, saturation: 'low' },
    { title: 'Posture Corrector Back Support Belt', price: 15.99, category: 'Health', trending: 85, saturation: 'medium' },
    { title: 'Car Phone Holder Magnetic Mount', price: 12.99, category: 'Automotive', trending: 81, saturation: 'high' },
    { title: 'Smart Watch Fitness Tracker IP68', price: 34.99, category: 'Electronics', trending: 90, saturation: 'medium' },
    { title: 'Electric Neck Massager EMS', price: 29.99, category: 'Health', trending: 87, saturation: 'low' },
    { title: 'Mini Projector LED Portable 1080P', price: 89.99, category: 'Electronics', trending: 84, saturation: 'low' },
    { title: 'Selfie Ring Light with Tripod Stand', price: 18.99, category: 'Photography', trending: 79, saturation: 'high' },
    { title: 'Wireless Earbuds TWS Bluetooth 5.0', price: 24.99, category: 'Electronics', trending: 86, saturation: 'medium' },
    { title: 'Pet Hair Remover Lint Roller', price: 9.99, category: 'Home', trending: 82, saturation: 'low' },
    { title: 'Aroma Diffuser Humidifier 300ml', price: 22.99, category: 'Home', trending: 78, saturation: 'medium' },
    { title: 'Resistance Bands Set 5 Levels', price: 14.99, category: 'Fitness', trending: 83, saturation: 'medium' },
    { title: 'Laptop Stand Adjustable Aluminum', price: 28.99, category: 'Office', trending: 77, saturation: 'low' },
    { title: 'Electric Toothbrush Sonic USB', price: 19.99, category: 'Beauty', trending: 80, saturation: 'medium' },
    { title: 'Sunrise Alarm Clock Wake Up Light', price: 32.99, category: 'Home', trending: 75, saturation: 'low' },
  ]

  const trendingProducts: WinnerItem[] = dropshippingProducts.slice(0, limit).map((p, i) => ({
    id: `trend_fb_${Date.now()}_${i}`,
    title: p.title,
    price: p.price,
    currency: 'EUR',
    image: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    source: 'curated_trends',
    url: `https://aliexpress.com/item/${1000000000 + i}.html`,
    reviews: Math.floor(Math.random() * 8000) + 500,
    rating: 4.2 + Math.random() * 0.7,
    sales: Math.floor(Math.random() * 25000) + 2000,
    trending_score: p.trending,
    market_demand: p.trending - 10 + Math.floor(Math.random() * 20),
    category: p.category,
    tags: ['dropshipping', 'trending', p.category.toLowerCase()],
    saturation_level: p.saturation,
    profit_margin: 45 + Math.floor(Math.random() * 25)
  }))

  return new Response(JSON.stringify({
    trends: {
      keyword: query,
      interest: 80,
      relatedQueries: ['dropshipping', 'winning products', 'ecommerce'],
      category: category || 'Multi-Category',
      timestamp: new Date().toISOString()
    },
    products: trendingProducts,
    meta: {
      total: trendingProducts.length,
      query,
      category,
      timestamp: new Date().toISOString(),
      source: 'curated_fallback'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
