import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TikTokProduct {
  product_name: string
  url: string
  viral_score: number
  views: number
  likes: number
  comments: number
  shares: number
  engagement_rate: number
  price?: number
  thumbnail_url?: string
  video_url?: string
  hashtags?: string[]
  creator_username?: string
  creator_followers?: number
  posted_at?: string
}

// Fetch TikTok data using Firecrawl API
async function fetchTikTokData(hashtag: string, firecrawlApiKey: string): Promise<TikTokProduct[]> {
  const searchUrl = `https://www.tiktok.com/tag/${encodeURIComponent(hashtag)}`
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'html'],
        waitFor: 3000
      })
    })

    if (!response.ok) {
      console.error('Firecrawl API error:', await response.text())
      return []
    }

    const result = await response.json()
    const products: TikTokProduct[] = []
    
    if (result.success && result.data) {
      const content = result.data.markdown || result.data.html || ''
      
      // Parse video data from scraped content
      const videoMatches = content.match(/video\/(\d+)/g) || []
      const viewMatches = content.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:views|vues)/gi) || []
      const likeMatches = content.match(/(\d+(?:\.\d+)?[KMB]?)\s*(?:likes|j'aime)/gi) || []
      
      for (let i = 0; i < Math.min(videoMatches.length, 10); i++) {
        const videoId = videoMatches[i]?.replace('video/', '') || `${Date.now()}_${i}`
        const viewsStr = viewMatches[i] || '0'
        const likesStr = likeMatches[i] || '0'
        
        const views = parseMetricValue(viewsStr)
        const likes = parseMetricValue(likesStr)
        const comments = Math.floor(likes * 0.1) // Estimate
        const shares = Math.floor(likes * 0.05) // Estimate
        
        const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0
        const viralScore = Math.min(100, Math.floor(engagementRate * 15 + (views > 100000 ? 20 : 0)))
        
        products.push({
          product_name: `Trending #${hashtag} Product`,
          url: `https://www.tiktok.com/@discover/video/${videoId}`,
          viral_score: viralScore,
          views,
          likes,
          comments,
          shares,
          engagement_rate: parseFloat(engagementRate.toFixed(2)),
          hashtags: [hashtag],
          posted_at: new Date().toISOString()
        })
      }
    }
    
    return products
  } catch (error) {
    console.error(`Error fetching TikTok data for #${hashtag}:`, error)
    return []
  }
}

function parseMetricValue(str: string): number {
  const num = parseFloat(str.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return 0
  
  const upperStr = str.toUpperCase()
  if (upperStr.includes('B')) return num * 1000000000
  if (upperStr.includes('M')) return num * 1000000
  if (upperStr.includes('K')) return num * 1000
  return num
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { hashtags = ['tiktokmademebuyit', 'amazonfinds', 'dropshipping'], limit = 20 } = await req.json()
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')

    console.log(`Scraping TikTok for hashtags: ${hashtags.join(', ')}`)

    let products: TikTokProduct[] = []

    if (firecrawlApiKey) {
      // Use real Firecrawl API
      for (const hashtag of hashtags) {
        const hashtagProducts = await fetchTikTokData(hashtag, firecrawlApiKey)
        products.push(...hashtagProducts.slice(0, Math.ceil(limit / hashtags.length)))
      }
    }

    if (products.length === 0) {
      // Check for existing viral products in database as fallback
      const { data: existingProducts } = await supabaseClient
        .from('viral_products')
        .select('*')
        .eq('platform', 'tiktok')
        .order('viral_score', { ascending: false })
        .limit(limit)

      if (existingProducts && existingProducts.length > 0) {
        return new Response(
          JSON.stringify({
            success: true,
            products: existingProducts,
            count: existingProducts.length,
            source: 'cache',
            message: `${existingProducts.length} produits TikTok récupérés depuis le cache`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      throw new Error('FIRECRAWL_API_KEY non configurée et aucun cache disponible. Veuillez configurer la clé API pour le scraping TikTok.')
    }

    // Save to database
    const productsToInsert = products.map(p => ({
      user_id: user.id,
      platform: 'tiktok',
      ...p,
      estimated_margin: p.price ? parseFloat((p.price * 1.5).toFixed(2)) : null,
      analyzed_at: new Date().toISOString()
    }))

    const { data: savedProducts, error: insertError } = await supabaseClient
      .from('viral_products')
      .insert(productsToInsert)
      .select()

    if (insertError) {
      console.error('Error saving products:', insertError)
      throw insertError
    }

    // Update trend data
    for (const hashtag of hashtags) {
      const hashtagProducts = products.filter(p => p.hashtags?.includes(hashtag))
      if (hashtagProducts.length === 0) continue
      
      const totalViews = hashtagProducts.reduce((sum, p) => sum + p.views, 0)
      const avgEngagement = hashtagProducts.reduce((sum, p) => sum + p.engagement_rate, 0) / hashtagProducts.length
      
      await supabaseClient
        .from('social_trends')
        .upsert({
          hashtag,
          platform: 'tiktok',
          trend_score: Math.min(100, Math.floor(avgEngagement * 10)),
          total_views: totalViews,
          product_count: hashtagProducts.length,
          trend_status: avgEngagement > 5 ? 'rising' : avgEngagement > 3 ? 'peak' : 'stable',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'hashtag,platform'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        products: savedProducts,
        count: savedProducts?.length || 0,
        source: 'live',
        message: `${savedProducts?.length || 0} produits viraux TikTok trouvés et sauvegardés`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in tiktok-product-scraper:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
