import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, keyword, category, url, niche } = await req.json();
    console.log('Product research action:', action);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Utilisateur non authentifié');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    let result;

    switch (action) {
      case 'scan_trends':
        result = await scanTrends(keyword, category, lovableApiKey, supabase, user.id);
        break;
      case 'analyze_viral':
        result = await analyzeViralProduct(url, lovableApiKey, supabase, user.id);
        break;
      case 'analyze_saturation':
        result = await analyzeSaturation(niche, lovableApiKey, supabase, user.id);
        break;
      default:
        throw new Error('Action non reconnue');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in product-research-scanner:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scanTrends(keyword: string, category: string, apiKey: string, supabase: any, userId: string) {
  console.log('Scanning trends for:', keyword, category);

  const prompt = `Analyse les tendances produits pour le mot-clé "${keyword}" dans la catégorie "${category}".

Retourne un JSON avec cette structure EXACTE (3-5 produits):
{
  "trends": [
    {
      "product_name": "nom du produit tendance",
      "category": "catégorie",
      "trend_score": 85,
      "search_volume": 45000,
      "growth_rate": 125,
      "saturation_level": "low|medium|high",
      "platforms": ["TikTok", "Instagram", "Google"]
    }
  ]
}

Critères:
- trend_score: 0-100 basé sur la popularité actuelle
- search_volume: nombre de recherches mensuelles estimé
- growth_rate: pourcentage de croissance sur 30 jours
- saturation_level: low (excellent), medium (bon), high (risqué)
- platforms: où le produit est tendance

Fournis des produits RÉELS et actuels avec des données plausibles.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un expert en recherche de produits dropshipping et analyse de tendances e-commerce. Tu réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    if (response.status === 429) throw new Error('Limite de requêtes atteinte, réessayez dans quelques instants');
    if (response.status === 402) throw new Error('Crédits IA épuisés, veuillez recharger');
    throw new Error('Erreur lors de l\'analyse AI');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const trends = jsonMatch ? JSON.parse(jsonMatch[0]) : { trends: [] };

  // Save to database
  for (const trend of trends.trends) {
    const winningScore = calculateWinningScore(trend);
    await supabase.from('product_research_results').insert({
      user_id: userId,
      product_name: trend.product_name,
      category: trend.category,
      winning_score: winningScore,
      trend_score: trend.trend_score,
      search_volume: trend.search_volume,
      saturation_level: trend.saturation_level,
      source_platform: 'Google Trends',
      raw_data: trend
    });
  }

  return trends;
}

async function analyzeViralProduct(url: string, apiKey: string, supabase: any, userId: string) {
  console.log('Analyzing viral product from:', url);

  const platform = detectPlatform(url);
  
  const prompt = `Analyse ce produit viral à partir de l'URL: ${url}

Retourne un JSON avec cette structure EXACTE:
{
  "product": {
    "product_name": "nom du produit",
    "source_platform": "${platform}",
    "source_url": "${url}",
    "viral_score": 88,
    "views": 2500000,
    "engagement_rate": 8.5,
    "estimated_price": 29.99,
    "profit_margin": 65,
    "description": "description courte du produit",
    "hashtags": ["tag1", "tag2", "tag3"]
  }
}

Critères:
- viral_score: 0-100 (viralité du contenu)
- views: nombre de vues estimé
- engagement_rate: taux d'engagement en %
- estimated_price: prix de vente estimé
- profit_margin: marge bénéficiaire estimée en %

Fournis des estimations réalistes basées sur le type de produit.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un expert en analyse de produits viraux sur les réseaux sociaux. Tu réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Limite de requêtes atteinte, réessayez dans quelques instants');
    if (response.status === 402) throw new Error('Crédits IA épuisés, veuillez recharger');
    throw new Error('Erreur lors de l\'analyse AI');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { product: {} };

  // Save to database
  const product = result.product;
  const winningScore = calculateWinningScore({
    trend_score: product.viral_score,
    search_volume: product.views / 100,
    profit_margin: product.profit_margin,
    saturation_level: 'medium'
  });

  await supabase.from('product_research_results').insert({
    user_id: userId,
    product_name: product.product_name,
    category: 'Viral Product',
    winning_score: winningScore,
    trend_score: product.viral_score || 0,
    viral_score: product.viral_score,
    profit_margin: product.profit_margin,
    source_platform: platform,
    source_url: url,
    raw_data: product
  });

  return result;
}

async function analyzeSaturation(niche: string, apiKey: string, supabase: any, userId: string) {
  console.log('Analyzing market saturation for:', niche);

  const prompt = `Analyse la saturation du marché pour la niche "${niche}".

Retourne un JSON avec cette structure EXACTE:
{
  "saturation": {
    "niche": "${niche}",
    "saturation_level": "low|medium|high",
    "saturation_score": 65,
    "competitor_count": 1250,
    "active_ads": 3400,
    "search_demand": 125000,
    "recommendation": "recommandation détaillée basée sur le niveau de saturation",
    "alternative_niches": ["alternative1", "alternative2", "alternative3"]
  }
}

Critères:
- saturation_score: 0-100 (0=opportunité, 100=très saturé)
- saturation_level: low (<40), medium (40-70), high (>70)
- competitor_count: nombre de concurrents actifs estimé
- active_ads: nombre d'annonces actives estimé
- search_demand: volume de recherche mensuel
- recommendation: conseil stratégique
- alternative_niches: 3 niches similaires moins saturées

Fournis une analyse réaliste du marché.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Tu es un expert en analyse de marché e-commerce et saturation de niche. Tu réponds UNIQUEMENT en JSON valide.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('Limite de requêtes atteinte, réessayez dans quelques instants');
    if (response.status === 402) throw new Error('Crédits IA épuisés, veuillez recharger');
    throw new Error('Erreur lors de l\'analyse AI');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { saturation: {} };

  return result;
}

function detectPlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('aliexpress.com')) return 'AliExpress';
  if (url.includes('amazon.com')) return 'Amazon';
  return 'Unknown';
}

function calculateWinningScore(data: any): number {
  const trendScore = data.trend_score || 0;
  const searchVolume = data.search_volume || 0;
  const profitMargin = data.profit_margin || 50;
  const saturationPenalty = data.saturation_level === 'high' ? 0.7 : 
                           data.saturation_level === 'medium' ? 0.85 : 1;

  const volumeScore = Math.min((searchVolume / 10000) * 20, 30);
  const profitScore = Math.min((profitMargin / 100) * 20, 20);

  const rawScore = (trendScore * 0.5) + volumeScore + profitScore;
  const finalScore = Math.round(rawScore * saturationPenalty);

  return Math.min(Math.max(finalScore, 0), 100);
}
