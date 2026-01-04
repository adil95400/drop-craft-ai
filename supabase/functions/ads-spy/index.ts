import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdSearchParams {
  query?: string
  platform?: string
  category?: string
  minSpend?: number
  maxSpend?: number
  minEngagement?: number
  countries?: string[]
  limit?: number
}

interface AdAnalysisResult {
  hook_analysis: string
  cta_effectiveness: string
  visual_strategy: string
  targeting_insights: string
  improvement_suggestions: string[]
  winning_elements: string[]
  estimated_performance: 'low' | 'medium' | 'high' | 'viral'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'search_ads':
        return await searchAds(supabase, user.id, params as AdSearchParams)
      
      case 'analyze_ad':
        return await analyzeAd(supabase, user.id, params.adId)
      
      case 'save_to_collection':
        return await saveToCollection(supabase, user.id, params.adId, params.collectionId, params.notes)
      
      case 'create_collection':
        return await createCollection(supabase, user.id, params.name, params.description, params.color)
      
      case 'get_collections':
        return await getCollections(supabase, user.id)
      
      case 'get_trending_ads':
        return await getTrendingAds(supabase, user.id, params.platform, params.limit)
      
      case 'scrape_competitor':
        return await scrapeCompetitor(supabase, user.id, params.url, params.platform)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Ads Spy error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function searchAds(supabase: any, userId: string, params: AdSearchParams) {
  const { query, platform, category, minSpend, maxSpend, minEngagement, countries, limit = 20 } = params

  // Log the search
  await supabase.from('ad_searches').insert({
    user_id: userId,
    query: query || '',
    platform,
    filters: { category, minSpend, maxSpend, minEngagement, countries },
  })

  // Build query
  let dbQuery = supabase
    .from('competitor_ads')
    .select('*')
    .eq('user_id', userId)
    .order('engagement_score', { ascending: false })
    .limit(limit)

  if (platform) {
    dbQuery = dbQuery.eq('platform', platform)
  }

  if (category) {
    dbQuery = dbQuery.eq('product_category', category)
  }

  if (minEngagement) {
    dbQuery = dbQuery.gte('engagement_score', minEngagement)
  }

  if (query) {
    dbQuery = dbQuery.or(`ad_text.ilike.%${query}%,ad_headline.ilike.%${query}%,advertiser_name.ilike.%${query}%`)
  }

  const { data: ads, error } = await dbQuery

  if (error) throw error

  // If no ads in DB, generate simulated data for demo
  const results = ads.length > 0 ? ads : await generateSimulatedAds(supabase, userId, params)

  return new Response(
    JSON.stringify({ 
      success: true, 
      ads: results,
      total: results.length,
      source: ads.length > 0 ? 'database' : 'simulated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateSimulatedAds(supabase: any, userId: string, params: AdSearchParams) {
  const categories = ['Fashion', 'Electronics', 'Beauty', 'Home', 'Fitness', 'Pets']
  const platforms = ['facebook', 'tiktok', 'instagram']
  const ctas = ['Shop Now', 'Learn More', 'Get Yours', 'Limited Offer', 'Buy Now']
  const adTexts = [
    "🔥 Viral product everyone's talking about!",
    "✨ Transform your daily routine with this",
    "💯 Best-selling item - 50% OFF today only",
    "🎁 Perfect gift idea they'll actually love",
    "⚡ Limited stock - selling fast!",
    "🌟 Over 10,000 5-star reviews",
    "💪 The #1 solution for your needs",
    "🚀 New arrival that's breaking the internet"
  ]

  const simulatedAds = Array.from({ length: 12 }, (_, i) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    platform: platforms[i % platforms.length],
    ad_id: `sim_${Date.now()}_${i}`,
    advertiser_name: `Brand ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'][i % 5]} Store`,
    ad_text: adTexts[i % adTexts.length],
    ad_headline: `${categories[i % categories.length]} Must-Have #${i + 1}`,
    ad_cta: ctas[i % ctas.length],
    landing_page_url: `https://example-store-${i}.com/product`,
    image_urls: [`https://picsum.photos/seed/${i}/400/400`],
    estimated_spend_min: Math.floor(Math.random() * 500) + 100,
    estimated_spend_max: Math.floor(Math.random() * 5000) + 1000,
    estimated_reach: Math.floor(Math.random() * 1000000) + 50000,
    engagement_score: Math.floor(Math.random() * 40) + 60,
    running_days: Math.floor(Math.random() * 60) + 1,
    countries: ['US', 'UK', 'CA', 'FR', 'DE'].slice(0, Math.floor(Math.random() * 3) + 1),
    age_range: ['18-24', '25-34', '35-44'][i % 3],
    gender_targeting: ['all', 'female', 'male'][i % 3],
    interests: ['Shopping', 'Lifestyle', 'Technology'].slice(0, Math.floor(Math.random() * 3) + 1),
    first_seen_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: Math.random() > 0.2,
    product_category: categories[i % categories.length],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  // Save to DB for future queries
  await supabase.from('competitor_ads').insert(simulatedAds)

  return simulatedAds
}

async function analyzeAd(supabase: any, userId: string, adId: string) {
  const { data: ad, error } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('id', adId)
    .eq('user_id', userId)
    .single()

  if (error || !ad) {
    throw new Error('Ad not found')
  }

  // Use AI to analyze the ad (simulated for now)
  const analysis: AdAnalysisResult = {
    hook_analysis: analyzeHook(ad.ad_text),
    cta_effectiveness: analyzeCta(ad.ad_cta),
    visual_strategy: "Strong product focus with lifestyle elements",
    targeting_insights: `Targeting ${ad.age_range || '25-44'} ${ad.gender_targeting || 'all genders'} interested in ${(ad.interests || ['general']).join(', ')}`,
    improvement_suggestions: generateSuggestions(ad),
    winning_elements: identifyWinningElements(ad),
    estimated_performance: estimatePerformance(ad.engagement_score)
  }

  // Update ad with analysis
  await supabase
    .from('competitor_ads')
    .update({ ai_analysis: analysis, updated_at: new Date().toISOString() })
    .eq('id', adId)

  return new Response(
    JSON.stringify({ success: true, ad, analysis }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function analyzeHook(text: string): string {
  if (!text) return "No hook detected"
  if (text.includes('🔥') || text.includes('viral')) return "Strong emotional hook with viral potential"
  if (text.includes('OFF') || text.includes('%')) return "Discount-driven hook - high conversion potential"
  if (text.includes('⭐') || text.includes('review')) return "Social proof hook - builds trust"
  return "Standard promotional hook"
}

function analyzeCta(cta: string): string {
  if (!cta) return "No CTA detected"
  const ctaMap: Record<string, string> = {
    'Shop Now': "Direct action CTA - high intent conversion",
    'Learn More': "Educational CTA - good for consideration stage",
    'Get Yours': "Ownership CTA - creates desire",
    'Limited Offer': "Urgency CTA - drives immediate action",
    'Buy Now': "Direct purchase CTA - maximum conversion intent"
  }
  return ctaMap[cta] || "Standard CTA"
}

function generateSuggestions(ad: any): string[] {
  const suggestions = []
  
  if (!ad.ad_text?.includes('🔥') && !ad.ad_text?.includes('⚡')) {
    suggestions.push("Add attention-grabbing emojis to increase scroll-stop rate")
  }
  
  if (!ad.ad_text?.includes('%') && !ad.ad_text?.includes('OFF')) {
    suggestions.push("Consider adding a discount or limited-time offer")
  }
  
  if (ad.running_days > 30 && ad.engagement_score < 70) {
    suggestions.push("Ad may be experiencing fatigue - consider creative refresh")
  }
  
  if ((ad.countries?.length || 0) < 3) {
    suggestions.push("Expand geographic targeting for broader reach")
  }
  
  suggestions.push("A/B test different headlines for improved CTR")
  
  return suggestions.slice(0, 4)
}

function identifyWinningElements(ad: any): string[] {
  const elements = []
  
  if (ad.engagement_score >= 80) elements.push("High engagement score")
  if (ad.running_days >= 14) elements.push("Proven longevity (running 14+ days)")
  if (ad.estimated_reach >= 500000) elements.push("Large reach indicates scalability")
  if (ad.is_active) elements.push("Currently active - validated by platform")
  
  return elements.length > 0 ? elements : ["Standard ad performance"]
}

function estimatePerformance(score: number): 'low' | 'medium' | 'high' | 'viral' {
  if (score >= 90) return 'viral'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

async function saveToCollection(supabase: any, userId: string, adId: string, collectionId: string, notes?: string) {
  // Verify collection ownership
  const { data: collection, error: colError } = await supabase
    .from('ad_collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single()

  if (colError || !collection) {
    throw new Error('Collection not found')
  }

  // Add to collection
  const { error } = await supabase
    .from('ad_collection_items')
    .insert({
      collection_id: collectionId,
      ad_id: adId,
      notes
    })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ad already in collection')
    }
    throw error
  }

  // Update collection count
  await supabase.rpc('increment_collection_count', { collection_id: collectionId })

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createCollection(supabase: any, userId: string, name: string, description?: string, color?: string) {
  const { data, error } = await supabase
    .from('ad_collections')
    .insert({
      user_id: userId,
      name,
      description,
      color: color || '#3B82F6'
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, collection: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCollections(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('ad_collections')
    .select(`
      *,
      items:ad_collection_items(
        id,
        notes,
        added_at,
        ad:competitor_ads(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, collections: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTrendingAds(supabase: any, userId: string, platform?: string, limit: number = 10) {
  let query = supabase
    .from('competitor_ads')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gte('engagement_score', 70)
    .order('engagement_score', { ascending: false })
    .limit(limit)

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data, error } = await query

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, ads: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function scrapeCompetitor(supabase: any, userId: string, url: string, platform: string) {
  // In a real implementation, this would use a scraping service
  // For now, we simulate the result
  const simulatedAd = {
    user_id: userId,
    platform,
    ad_id: `scraped_${Date.now()}`,
    advertiser_name: new URL(url).hostname.replace('www.', '').split('.')[0],
    ad_text: "Scraped ad content would appear here",
    ad_headline: "Product from " + new URL(url).hostname,
    landing_page_url: url,
    engagement_score: Math.floor(Math.random() * 30) + 50,
    is_active: true,
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('competitor_ads')
    .insert(simulatedAd)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, ad: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
