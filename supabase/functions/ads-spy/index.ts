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

async function searchAds(supabase: ReturnType<typeof createClient>, userId: string, params: AdSearchParams) {
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

  // Return only real data from database - no simulated fallback
  return new Response(
    JSON.stringify({ 
      success: true, 
      ads: ads || [],
      total: ads?.length || 0,
      source: 'database',
      message: ads?.length === 0 ? 'No ads found. Use the scraper to import competitor ads.' : undefined
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function analyzeAd(supabase: ReturnType<typeof createClient>, userId: string, adId: string) {
  const { data: ad, error } = await supabase
    .from('competitor_ads')
    .select('*')
    .eq('id', adId)
    .eq('user_id', userId)
    .single()

  if (error || !ad) {
    throw new Error('Ad not found')
  }

  // Perform real analysis based on ad content
  const analysis: AdAnalysisResult = {
    hook_analysis: analyzeHook(ad.ad_text),
    cta_effectiveness: analyzeCta(ad.ad_cta),
    visual_strategy: analyzeVisualStrategy(ad),
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
  if (text.includes('FREE') || text.includes('free')) return "Free offer hook - high click-through potential"
  if (text.includes('LIMITED') || text.includes('limited')) return "Scarcity hook - creates urgency"
  return "Standard promotional hook"
}

function analyzeCta(cta: string): string {
  if (!cta) return "No CTA detected"
  const ctaMap: Record<string, string> = {
    'Shop Now': "Direct action CTA - high intent conversion",
    'Learn More': "Educational CTA - good for consideration stage",
    'Get Yours': "Ownership CTA - creates desire",
    'Limited Offer': "Urgency CTA - drives immediate action",
    'Buy Now': "Direct purchase CTA - maximum conversion intent",
    'Sign Up': "Lead generation CTA - builds email list",
    'Get Started': "Onboarding CTA - low friction entry"
  }
  return ctaMap[cta] || "Standard CTA"
}

function analyzeVisualStrategy(ad: Record<string, unknown>): string {
  const imageCount = (ad.image_urls as string[] | undefined)?.length || 0
  const hasVideo = !!(ad.video_url as string)
  
  if (hasVideo) return "Video-first strategy - high engagement potential"
  if (imageCount > 3) return "Multi-image carousel - product showcase"
  if (imageCount === 1) return "Single image focus - clear product highlight"
  return "Standard visual approach"
}

function generateSuggestions(ad: Record<string, unknown>): string[] {
  const suggestions = []
  const adText = ad.ad_text as string | undefined
  const runningDays = ad.running_days as number | undefined
  const engagementScore = ad.engagement_score as number | undefined
  const countries = ad.countries as string[] | undefined
  
  if (!adText?.includes('🔥') && !adText?.includes('⚡')) {
    suggestions.push("Add attention-grabbing emojis to increase scroll-stop rate")
  }
  
  if (!adText?.includes('%') && !adText?.includes('OFF')) {
    suggestions.push("Consider adding a discount or limited-time offer")
  }
  
  if ((runningDays || 0) > 30 && (engagementScore || 0) < 70) {
    suggestions.push("Ad may be experiencing fatigue - consider creative refresh")
  }
  
  if ((countries?.length || 0) < 3) {
    suggestions.push("Expand geographic targeting for broader reach")
  }
  
  suggestions.push("A/B test different headlines for improved CTR")
  
  return suggestions.slice(0, 4)
}

function identifyWinningElements(ad: Record<string, unknown>): string[] {
  const elements = []
  const engagementScore = ad.engagement_score as number | undefined
  const runningDays = ad.running_days as number | undefined
  const estimatedReach = ad.estimated_reach as number | undefined
  const isActive = ad.is_active as boolean | undefined
  
  if ((engagementScore || 0) >= 80) elements.push("High engagement score")
  if ((runningDays || 0) >= 14) elements.push("Proven longevity (running 14+ days)")
  if ((estimatedReach || 0) >= 500000) elements.push("Large reach indicates scalability")
  if (isActive) elements.push("Currently active - validated by platform")
  
  return elements.length > 0 ? elements : ["Standard ad performance"]
}

function estimatePerformance(score: number | null | undefined): 'low' | 'medium' | 'high' | 'viral' {
  const s = score || 0
  if (s >= 90) return 'viral'
  if (s >= 75) return 'high'
  if (s >= 50) return 'medium'
  return 'low'
}

async function saveToCollection(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  adId: string, 
  collectionId: string, 
  notes?: string
) {
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

  // Update collection count manually
  const { data: countData } = await supabase
    .from('ad_collection_items')
    .select('id', { count: 'exact' })
    .eq('collection_id', collectionId)
  
  await supabase
    .from('ad_collections')
    .update({ ad_count: countData?.length || 0, updated_at: new Date().toISOString() })
    .eq('id', collectionId)

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createCollection(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  name: string, 
  description?: string, 
  color?: string
) {
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

async function getCollections(supabase: ReturnType<typeof createClient>, userId: string) {
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

async function getTrendingAds(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  platform?: string, 
  limit: number = 10
) {
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
    JSON.stringify({ success: true, ads: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function scrapeCompetitor(
  supabase: ReturnType<typeof createClient>, 
  userId: string, 
  url: string, 
  platform: string
) {
  // Use Firecrawl API for real scraping
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
  
  if (!firecrawlKey) {
    throw new Error('Scraping service not configured. Please add FIRECRAWL_API_KEY.')
  }

  try {
    // Call Firecrawl to scrape the page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        pageOptions: {
          onlyMainContent: true,
          includeImages: true
        }
      })
    })

    if (!scrapeResponse.ok) {
      throw new Error(`Scraping failed: ${scrapeResponse.status}`)
    }

    const scrapeData = await scrapeResponse.json()
    
    // Parse scraped data into ad format
    const hostname = new URL(url).hostname.replace('www.', '').split('.')[0]
    
    const adData = {
      user_id: userId,
      platform,
      ad_id: `scraped_${Date.now()}`,
      advertiser_name: hostname.charAt(0).toUpperCase() + hostname.slice(1),
      ad_text: scrapeData.data?.content?.substring(0, 500) || '',
      ad_headline: scrapeData.data?.metadata?.title || `Product from ${hostname}`,
      landing_page_url: url,
      image_urls: scrapeData.data?.metadata?.ogImage ? [scrapeData.data.metadata.ogImage] : [],
      engagement_score: 50, // Default score, will be updated with real data
      is_active: true,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('competitor_ads')
      .insert(adData)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, ad: data, source: 'firecrawl' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Scraping error:', err)
    throw new Error(`Failed to scrape: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}
