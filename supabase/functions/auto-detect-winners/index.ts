import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('[AUTO-DETECT-WINNERS] Starting automatic detection for user:', user.id);

    // Simuler la détection automatique de produits gagnants
    const detectedProducts = await detectWinningProducts();
    
    // Stocker les résultats
    const { error: insertError } = await supabaseClient
      .from('winner_products')
      .upsert(
        detectedProducts.map(product => ({
          ...product,
          user_id: user.id,
          detected_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })),
        { onConflict: 'product_url' }
      );

    if (insertError) {
      console.error('[AUTO-DETECT-WINNERS] Error storing products:', insertError);
      throw insertError;
    }

    console.log('[AUTO-DETECT-WINNERS] Successfully detected and stored', detectedProducts.length, 'products');

    return new Response(
      JSON.stringify({
        success: true,
        count: detectedProducts.length,
        products: detectedProducts
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[AUTO-DETECT-WINNERS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function detectWinningProducts() {
  // Simulation de l'agrégation depuis différentes sources
  const sources = [
    { platform: 'tiktok', weight: 0.4 },
    { platform: 'facebook', weight: 0.3 },
    { platform: 'instagram', weight: 0.2 },
    { platform: 'aliexpress', weight: 0.1 }
  ];

  const products = [];
  
  for (let i = 1; i <= 20; i++) {
    const platform = sources[Math.floor(Math.random() * sources.length)];
    const engagement = Math.floor(Math.random() * 1000000) + 100000;
    const orders = Math.floor(Math.random() * 50000) + 5000;
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1);
    
    // Calcul du score de viralité
    const viralityScore = calculateViralityScore({
      engagement,
      orders,
      rating: parseFloat(rating),
      platform: platform.platform,
      weight: platform.weight
    });

    // Calcul du trending score
    const trendingScore = calculateTrendingScore({
      engagement,
      timeframe: '7d',
      growthRate: Math.random() * 200 + 50
    });

    products.push({
      product_name: `Produit Tendance ${i} (${platform.platform})`,
      product_url: `https://${platform.platform}.com/product/${i}`,
      source_platform: platform.platform,
      virality_score: viralityScore,
      trending_score: trendingScore,
      engagement_count: engagement,
      orders_count: orders,
      rating: parseFloat(rating),
      price: (Math.random() * 80 + 20).toFixed(2),
      estimated_profit_margin: (Math.random() * 40 + 30).toFixed(1),
      competition_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      social_proof: {
        tiktok_views: platform.platform === 'tiktok' ? engagement : Math.floor(engagement * 0.3),
        tiktok_likes: platform.platform === 'tiktok' ? Math.floor(engagement * 0.1) : Math.floor(engagement * 0.03),
        facebook_shares: platform.platform === 'facebook' ? Math.floor(engagement * 0.05) : Math.floor(engagement * 0.01),
        instagram_likes: platform.platform === 'instagram' ? Math.floor(engagement * 0.08) : Math.floor(engagement * 0.02)
      },
      trend_analysis: {
        trend_direction: Math.random() > 0.3 ? 'up' : 'down',
        growth_rate: (Math.random() * 200 + 50).toFixed(1) + '%',
        peak_detected: Math.random() > 0.7,
        seasonality: ['none', 'summer', 'winter', 'christmas'][Math.floor(Math.random() * 4)]
      },
      competitor_analysis: {
        competitor_count: Math.floor(Math.random() * 50) + 10,
        avg_competitor_price: (Math.random() * 100 + 30).toFixed(2),
        market_saturation: (Math.random() * 100).toFixed(0) + '%',
        difficulty_score: Math.floor(Math.random() * 10) + 1
      },
      detection_signals: [
        'Engagement élevé',
        'Croissance rapide',
        'Faible compétition',
        'Bon ratio prix/marge'
      ].filter(() => Math.random() > 0.5),
      metadata: {
        detected_date: new Date().toISOString(),
        last_check: new Date().toISOString(),
        confidence_level: (Math.random() * 30 + 70).toFixed(0) + '%'
      }
    });
  }

  return products.sort((a, b) => b.virality_score - a.virality_score);
}

function calculateViralityScore(params: {
  engagement: number;
  orders: number;
  rating: number;
  platform: string;
  weight: number;
}) {
  const { engagement, orders, rating, weight } = params;
  
  // Normalisation des métriques (0-100)
  const engagementScore = Math.min((engagement / 1000000) * 100, 100);
  const ordersScore = Math.min((orders / 50000) * 100, 100);
  const ratingScore = (rating / 5) * 100;
  
  // Score pondéré
  const baseScore = (
    engagementScore * 0.4 +
    ordersScore * 0.4 +
    ratingScore * 0.2
  );
  
  // Bonus selon la plateforme
  const platformBonus = weight * 10;
  
  return Math.min(Math.round(baseScore + platformBonus), 100);
}

function calculateTrendingScore(params: {
  engagement: number;
  timeframe: string;
  growthRate: number;
}) {
  const { engagement, growthRate } = params;
  
  // Score basé sur l'engagement
  const engagementScore = Math.min((engagement / 500000) * 50, 50);
  
  // Score basé sur la croissance
  const growthScore = Math.min((growthRate / 200) * 50, 50);
  
  return Math.round(engagementScore + growthScore);
}
