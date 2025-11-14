import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookAd {
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
  creator_username?: string
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

    const { keywords = ['dropshipping', 'trending product', 'must have'], limit = 15 } = await req.json()

    console.log(`Scraping Facebook Ads for keywords: ${keywords.join(', ')}`)

    // Simulation de scraping Facebook Ads (en production, utiliser Facebook Graph API)
    const products: FacebookAd[] = []
    
    for (const keyword of keywords) {
      const demoProducts = Array.from({ length: Math.min(limit / keywords.length, 5) }, (_, i) => ({
        product_name: `Produit pub Facebook ${keyword} #${i + 1}`,
        url: `https://www.facebook.com/ads/library/?id=${Math.random().toString(36).substr(2, 9)}`,
        viral_score: Math.floor(Math.random() * 35) + 65, // Score 65-100
        views: Math.floor(Math.random() * 500000) + 50000,
        likes: Math.floor(Math.random() * 20000) + 5000,
        comments: Math.floor(Math.random() * 2000) + 500,
        shares: Math.floor(Math.random() * 5000) + 1000,
        engagement_rate: parseFloat((Math.random() * 4 + 1.5).toFixed(2)), // 1.5-5.5%
        price: parseFloat((Math.random() * 80 + 15).toFixed(2)),
        thumbnail_url: `https://picsum.photos/seed/fb${i}/800/600`,
        creator_username: `page_${Math.floor(Math.random() * 500)}`
      }))
      
      products.push(...demoProducts)
    }

    // Sauvegarder dans la base de données
    const { data: savedProducts, error: insertError } = await supabaseClient
      .from('viral_products')
      .insert(
        products.map(p => ({
          user_id: user.id,
          platform: 'facebook',
          ...p,
          estimated_margin: p.price ? parseFloat((p.price * 1.8).toFixed(2)) : null,
          analyzed_at: new Date().toISOString()
        }))
      )
      .select()

    if (insertError) {
      console.error('Error saving products:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        products: savedProducts,
        count: savedProducts?.length || 0,
        message: `${savedProducts?.length || 0} produits pub Facebook trouvés et sauvegardés`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in facebook-ad-scraper:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
