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

    const { hashtags = ['tiktokmademebuyit', 'amazonfinds', 'dropshipping', 'productreview'], limit = 20 } = await req.json()

    console.log(`Scraping TikTok for hashtags: ${hashtags.join(', ')}`)

    // Simulation de scraping TikTok (en production, utiliser TikTok API v2)
    // Pour l'instant, on génère des données de démonstration
    const products: TikTokProduct[] = []
    
    for (const hashtag of hashtags) {
      // Ici, vous intégreriez l'API TikTok réelle
      // Pour la démo, on génère des données simulées
      const demoProducts = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        product_name: `Produit tendance ${hashtag} #${i + 1}`,
        url: `https://www.tiktok.com/@demo/video/${Math.random().toString(36).substr(2, 9)}`,
        viral_score: Math.floor(Math.random() * 40) + 60, // Score 60-100
        views: Math.floor(Math.random() * 1000000) + 100000,
        likes: Math.floor(Math.random() * 50000) + 10000,
        comments: Math.floor(Math.random() * 5000) + 1000,
        shares: Math.floor(Math.random() * 10000) + 2000,
        engagement_rate: parseFloat((Math.random() * 5 + 2).toFixed(2)), // 2-7%
        price: parseFloat((Math.random() * 50 + 10).toFixed(2)),
        thumbnail_url: `https://picsum.photos/seed/${i}/400/600`,
        video_url: `https://www.tiktok.com/@demo/video/${Math.random().toString(36).substr(2, 9)}`,
        hashtags: [hashtag, 'trending', 'viral'],
        creator_username: `creator_${Math.floor(Math.random() * 1000)}`,
        creator_followers: Math.floor(Math.random() * 1000000) + 10000,
        posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }))
      
      products.push(...demoProducts)
    }

    // Sauvegarder dans la base de données
    const { data: savedProducts, error: insertError } = await supabaseClient
      .from('viral_products')
      .insert(
        products.map(p => ({
          user_id: user.id,
          platform: 'tiktok',
          ...p,
          estimated_margin: p.price ? parseFloat((p.price * 1.5).toFixed(2)) : null
        }))
      )
      .select()

    if (insertError) {
      console.error('Error saving products:', insertError)
      throw insertError
    }

    // Mettre à jour les tendances
    for (const hashtag of hashtags) {
      const hashtagProducts = products.filter(p => p.hashtags?.includes(hashtag))
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
