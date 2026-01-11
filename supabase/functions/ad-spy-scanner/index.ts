import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdSpyResult {
  id: string;
  platform: string;
  advertiser_name: string;
  product_name: string;
  product_image: string;
  ad_creative: string;
  landing_page: string;
  first_seen: string;
  last_seen: string;
  days_running: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  estimated_daily_spend: number;
  target_countries: string[];
  target_demographics: string;
  ad_copy: string;
  cta_type: string;
  winning_score: number;
  saturation_level: string;
  profit_potential: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      keyword, 
      platform = 'all',
      category = '',
      min_days_running = 0,
      sort_by = 'engagement',
      limit = 20 
    } = await req.json();
    
    console.log('Ad spy action:', action, { keyword, platform, category });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Check cache first
    const cacheKey = `adspy_${action}_${keyword}_${platform}_${category}`;
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, created_at')
      .eq('cache_key', cacheKey)
      .single();

    if (cached && new Date(cached.created_at).getTime() > Date.now() - 30 * 60 * 1000) {
      console.log('Returning cached ad spy data');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result;

    switch (action) {
      case 'search_ads':
        result = await searchAds(keyword, platform, category, limit, lovableApiKey, supabase);
        break;
      case 'trending_ads':
        result = await getTrendingAds(platform, category, limit, lovableApiKey, supabase);
        break;
      case 'analyze_competitor':
        result = await analyzeCompetitor(keyword, lovableApiKey, supabase);
        break;
      case 'spy_product':
        result = await spyProduct(keyword, lovableApiKey, supabase);
        break;
      default:
        throw new Error('Unknown action');
    }

    // Cache the result
    await supabase.from('api_cache').upsert({
      cache_key: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ad-spy-scanner:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchAds(keyword: string, platform: string, category: string, limit: number, apiKey: string, supabase: any) {
  const platformFilter = platform !== 'all' ? ` sur ${platform}` : ' sur Facebook, Instagram et TikTok';
  
  const prompt = `Tu es un expert en ad spy et analyse publicitaire comme Minea. Génère ${limit} résultats de publicités réalistes pour "${keyword}"${category ? ` dans la catégorie ${category}` : ''}${platformFilter}.

Pour chaque publicité, fournis:
- advertiser_name: nom de l'annonceur/marque
- product_name: nom du produit
- platform: Facebook, Instagram, ou TikTok
- ad_copy: texte publicitaire complet (2-3 phrases)
- cta_type: Shop Now, Learn More, Get Offer, etc.
- first_seen: date (YYYY-MM-DD) quand l'annonce a été vue pour la première fois
- days_running: nombre de jours d'activité (7-180)
- likes: nombre de likes (100-500000)
- comments: nombre de commentaires (10-50000)  
- shares: nombre de partages (5-20000)
- engagement_rate: taux d'engagement (1-15%)
- estimated_daily_spend: dépense quotidienne estimée en EUR (50-5000)
- target_countries: pays ciblés (array)
- target_demographics: démographie cible
- product_price: prix estimé du produit (10-200 EUR)
- profit_potential: marge bénéficiaire estimée (30-80%)
- saturation_level: low, medium, ou high
- winning_score: score de 60 à 98 (basé sur engagement et durée)

Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "ads": [...]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un outil d\'ad spy professionnel. Tu génères des données publicitaires réalistes et structurées basées sur les tendances actuelles du marché.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error('AI API error');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { ads: [] };

  // Transform and enhance ads
  const ads: AdSpyResult[] = (parsed.ads || []).map((ad: any, i: number) => ({
    id: `ad_${Date.now()}_${i}`,
    platform: ad.platform || 'Facebook',
    advertiser_name: ad.advertiser_name || 'Unknown Advertiser',
    product_name: ad.product_name || `Product ${i + 1}`,
    product_image: `https://picsum.photos/400/400?random=${Date.now() + i}`,
    ad_creative: ad.ad_copy || '',
    landing_page: `https://shop.example.com/products/${i}`,
    first_seen: ad.first_seen || new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    last_seen: new Date().toISOString().split('T')[0],
    days_running: ad.days_running || Math.floor(Math.random() * 90) + 7,
    likes: ad.likes || Math.floor(Math.random() * 50000) + 100,
    comments: ad.comments || Math.floor(Math.random() * 5000) + 10,
    shares: ad.shares || Math.floor(Math.random() * 2000) + 5,
    engagement_rate: ad.engagement_rate || 2 + Math.random() * 8,
    estimated_daily_spend: ad.estimated_daily_spend || Math.floor(Math.random() * 2000) + 100,
    target_countries: ad.target_countries || ['FR', 'BE', 'CH'],
    target_demographics: ad.target_demographics || '25-54 years',
    ad_copy: ad.ad_copy || '',
    cta_type: ad.cta_type || 'Shop Now',
    winning_score: ad.winning_score || 70 + Math.floor(Math.random() * 25),
    saturation_level: ad.saturation_level || 'medium',
    profit_potential: ad.profit_potential || 40 + Math.floor(Math.random() * 35)
  }));

  // Sort by winning score
  ads.sort((a, b) => b.winning_score - a.winning_score);

  return {
    ads,
    meta: {
      total: ads.length,
      keyword,
      platform,
      category,
      timestamp: new Date().toISOString(),
      source: 'ai_ad_spy'
    },
    insights: {
      avg_engagement: ads.reduce((sum, ad) => sum + ad.engagement_rate, 0) / ads.length,
      avg_days_running: ads.reduce((sum, ad) => sum + ad.days_running, 0) / ads.length,
      top_platforms: getTopPlatforms(ads),
      top_ctas: getTopCTAs(ads)
    }
  };
}

async function getTrendingAds(platform: string, category: string, limit: number, apiKey: string, supabase: any) {
  const prompt = `Génère ${limit} publicités tendance actuelles${platform !== 'all' ? ` sur ${platform}` : ''}${category ? ` dans la catégorie ${category}` : ''}.

Ces publicités doivent représenter les meilleures campagnes actuelles avec des métriques élevées.
Focus sur les produits dropshipping qui fonctionnent bien en ce moment.

Retourne un JSON avec:
{
  "trending_ads": [
    {
      "advertiser_name": "...",
      "product_name": "...",
      "platform": "...",
      "ad_copy": "...",
      "days_running": ...,
      "engagement_rate": ...,
      "estimated_daily_spend": ...,
      "winning_score": ...,
      "trend_velocity": ... (croissance en %)
    }
  ]
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un expert en veille publicitaire et tendances marketing.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { trending_ads: [] };

  return {
    ads: (parsed.trending_ads || []).map((ad: any, i: number) => ({
      ...ad,
      id: `trend_ad_${Date.now()}_${i}`,
      product_image: `https://picsum.photos/400/400?random=${Date.now() + i + 500}`,
    })),
    meta: {
      total: parsed.trending_ads?.length || 0,
      platform,
      category,
      timestamp: new Date().toISOString(),
      type: 'trending'
    }
  };
}

async function analyzeCompetitor(advertiserName: string, apiKey: string, supabase: any) {
  const prompt = `Analyse le profil publicitaire de l'annonceur/marque "${advertiserName}".

Fournis une analyse détaillée incluant:
- company_name: nom de l'entreprise
- industry: secteur d'activité
- estimated_monthly_spend: budget publicitaire mensuel estimé
- active_ads_count: nombre de publicités actives
- platforms_used: plateformes utilisées
- top_products: produits les plus promus
- target_audience: audience cible principale
- ad_strategy: stratégie publicitaire identifiée
- strengths: points forts
- weaknesses: points faibles
- opportunities: opportunités à exploiter

Retourne un JSON structuré avec "competitor_analysis".`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un analyste compétitif expert en marketing digital.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { competitor_analysis: {} };
}

async function spyProduct(productName: string, apiKey: string, supabase: any) {
  const prompt = `Analyse complète du produit "${productName}" pour le dropshipping.

Fournis:
- product_overview: description et caractéristiques
- market_presence: présence sur le marché (aliexpress, amazon, etc.)
- competition_level: niveau de concurrence (1-10)
- pricing_analysis: analyse des prix (achat/vente recommandés)
- ad_performance: performance publicitaire observée
- best_platforms: meilleures plateformes pour vendre
- target_audience: audience cible recommandée
- selling_points: arguments de vente clés
- potential_issues: problèmes potentiels
- profit_analysis: analyse de rentabilité
- recommendation: recommandation finale (go/no-go)

Retourne un JSON avec "product_spy".`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un expert en analyse de produits dropshipping et veille concurrentielle.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { product_spy: {} };
}

function getTopPlatforms(ads: AdSpyResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  ads.forEach(ad => {
    counts[ad.platform] = (counts[ad.platform] || 0) + 1;
  });
  return counts;
}

function getTopCTAs(ads: AdSpyResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  ads.forEach(ad => {
    counts[ad.cta_type] = (counts[ad.cta_type] || 0) + 1;
  });
  return counts;
}
