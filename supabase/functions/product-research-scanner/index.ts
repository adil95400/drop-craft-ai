import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    console.log('Product research action:', action);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Utilisateur non authentifié');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Utilisateur non authentifié');

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY non configurée');

    let result;

    switch (action) {
      case 'scan_trends':
        result = await scanTrends(body.keyword, body.category, lovableApiKey, supabase, user.id);
        break;
      case 'analyze_viral':
        result = await analyzeViralProduct(body.url, lovableApiKey, supabase, user.id);
        break;
      case 'analyze_saturation':
        result = await analyzeSaturation(body.niche, lovableApiKey, supabase, user.id);
        break;
      case 'daily_feed':
        result = await dailyFeed(body, lovableApiKey, supabase, user.id);
        break;
      case 'ads_spy':
        result = await adsSpy(body, lovableApiKey, supabase, user.id);
        break;
      default:
        throw new Error('Action non reconnue');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in product-research-scanner:', error);
    const status = error.message?.includes('429') ? 429 : error.message?.includes('402') ? 402 : 400;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── DAILY FEED ──────────────────────────────────────────────────
async function dailyFeed(params: any, apiKey: string, supabase: any, userId: string) {
  const { country = 'FR', platform = 'all', category = 'all', dateRange = '7d', sortBy = 'score', limit = 20 } = params;
  console.log('Daily feed:', { country, platform, category, dateRange });

  const countryLabel = { FR: 'France', US: 'États-Unis', UK: 'Royaume-Uni', DE: 'Allemagne', ES: 'Espagne', IT: 'Italie', CA: 'Canada', AU: 'Australie', BR: 'Brésil' }[country] || country;
  const platformFilter = platform !== 'all' ? `Concentre-toi sur la plateforme ${platform}.` : '';
  const categoryFilter = category !== 'all' ? `Catégorie ciblée: ${category}.` : '';
  const dateLabel = { '24h': 'dernières 24 heures', '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '3 derniers mois' }[dateRange] || '7 derniers jours';

  const prompt = `Tu es un expert en dropshipping et produits gagnants. Génère un flux de ${limit} produits gagnants pour le marché "${countryLabel}" sur les ${dateLabel}.
${platformFilter} ${categoryFilter}

Pour chaque produit, fournis ces données EXACTES en JSON:
{
  "products": [
    {
      "product_name": "Nom produit (en anglais/original)",
      "category": "catégorie",
      "image_url": "",
      "supplier_url": "https://aliexpress.com/item/...",
      "platform": "TikTok|Facebook|Instagram|Amazon|AliExpress",
      "country": "${country}",
      "cost_price": 8.50,
      "selling_price": 29.99,
      "margin_percent": 72,
      "winner_score": 88,
      "trend_score": 85,
      "demand_score": 90,
      "competition_score": 35,
      "viral_score": 78,
      "saturation": "low|medium|high",
      "estimated_daily_orders": 45,
      "estimated_monthly_revenue": 40500,
      "views": 2500000,
      "engagement_rate": 6.5,
      "ad_count": 120,
      "first_seen": "2025-02-15",
      "tags": ["gadget", "viral", "trending"],
      "description": "Description courte du produit et pourquoi il est gagnant"
    }
  ]
}

IMPORTANT:
- winner_score: 0-100 composite (trend 30% + demand 25% + margin 20% + viralité 15% + competition inverse 10%)
- Produits RÉELS actuellement viraux/tendance
- Données plausibles basées sur le marché réel
- Variété de catégories si "all"
- Trie par ${sortBy === 'score' ? 'winner_score décroissant' : sortBy === 'trending' ? 'trend_score décroissant' : sortBy === 'profit' ? 'margin_percent décroissant' : sortBy === 'recent' ? 'first_seen le plus récent' : 'winner_score décroissant'}`;

  const response = await callAI(apiKey, 
    'Tu es un expert en recherche de produits gagnants dropshipping, e-commerce et analyse de tendances. Tu réponds UNIQUEMENT en JSON valide.',
    prompt
  );

  const parsed = await parseAIResponse(response);
  const products = parsed.products || [];

  // Persist to DB
  for (const p of products.slice(0, limit)) {
    await supabase.from('product_research_results').insert({
      user_id: userId,
      product_name: p.product_name,
      category: p.category,
      winning_score: p.winner_score || 0,
      trend_score: p.trend_score || 0,
      viral_score: p.viral_score || 0,
      profit_margin: p.margin_percent,
      search_volume: p.views || 0,
      saturation_level: p.saturation,
      source_platform: p.platform,
      raw_data: p,
    }).then(() => {}).catch((e: any) => console.error('Insert error:', e));
  }

  return { products, meta: { country, platform, category, dateRange, count: products.length, timestamp: new Date().toISOString() } };
}

// ─── ADS SPY ─────────────────────────────────────────────────────
async function adsSpy(params: any, apiKey: string, supabase: any, userId: string) {
  const { platform = 'tiktok', country = 'FR', category = 'all', dateRange = '7d', keyword = '', limit = 15 } = params;
  console.log('Ads Spy:', { platform, country, keyword });

  const countryLabel = { FR: 'France', US: 'États-Unis', UK: 'Royaume-Uni', DE: 'Allemagne' }[country] || country;
  const keywordFilter = keyword ? `Mot-clé ciblé: "${keyword}".` : '';

  const prompt = `Tu es un expert en veille publicitaire e-commerce (Ads Spy). Analyse les publicités actuellement actives sur ${platform} pour le marché ${countryLabel}.
${keywordFilter} ${category !== 'all' ? `Catégorie: ${category}` : ''}

Retourne un JSON avec cette structure EXACTE:
{
  "ads": [
    {
      "ad_id": "ad_unique_id",
      "product_name": "Nom du produit",
      "advertiser": "Nom de la boutique/marque",
      "platform": "${platform}",
      "country": "${country}",
      "ad_type": "video|image|carousel",
      "creative_url": "",
      "landing_page": "https://...",
      "category": "catégorie",
      "cost_price_estimate": 8.00,
      "selling_price": 34.99,
      "margin_estimate": 77,
      "impressions": 850000,
      "likes": 45000,
      "comments": 1200,
      "shares": 3400,
      "engagement_rate": 5.8,
      "running_days": 14,
      "first_seen": "2025-02-10",
      "last_seen": "2025-02-18",
      "ad_copy": "Texte de la pub",
      "cta": "Shop Now",
      "score": 85,
      "tags": ["dropshipping", "viral"],
      "trend": "rising|stable|declining"
    }
  ],
  "stats": {
    "total_ads_found": 15,
    "avg_engagement": 5.2,
    "top_category": "Beauté",
    "avg_running_days": 12
  }
}

IMPORTANT:
- Données réalistes de publicités e-commerce actuelles
- Score: 0-100 composite (durée active + engagement + impressions)
- Inclure des publicités de dropshippers et marques DTC
- ${limit} résultats maximum`;

  const response = await callAI(apiKey, 
    'Tu es un expert en veille publicitaire (Ads Spy) spécialisé en dropshipping et e-commerce. Tu réponds UNIQUEMENT en JSON valide.',
    prompt
  );

  const parsed = await parseAIResponse(response);
  return { ads: parsed.ads || [], stats: parsed.stats || {}, meta: { platform, country, category, keyword, timestamp: new Date().toISOString() } };
}

// ─── EXISTING ACTIONS (refactored) ──────────────────────────────
async function scanTrends(keyword: string, category: string, apiKey: string, supabase: any, userId: string) {
  console.log('Scanning trends for:', keyword, category);

  const prompt = `Analyse les tendances produits pour le mot-clé "${keyword}" dans la catégorie "${category}".

Retourne un JSON avec cette structure EXACTE (5-8 produits):
{
  "trends": [
    {
      "product_name": "nom du produit tendance",
      "category": "catégorie",
      "trend_score": 85,
      "search_volume": 45000,
      "growth_rate": 125,
      "saturation_level": "low|medium|high",
      "platforms": ["TikTok", "Instagram", "Google"],
      "estimated_price": 29.99,
      "cost_price": 8.50,
      "margin_percent": 72,
      "ad_count": 45,
      "country": "FR"
    }
  ]
}

Critères:
- trend_score: 0-100 basé sur la popularité actuelle
- search_volume: recherches mensuelles estimées
- growth_rate: % croissance sur 30 jours
- saturation_level: low (excellent), medium (bon), high (risqué)
- Produits RÉELS et actuels avec données plausibles`;

  const response = await callAI(apiKey, 
    'Tu es un expert en recherche de produits dropshipping et analyse de tendances e-commerce. Tu réponds UNIQUEMENT en JSON valide.',
    prompt
  );

  const trends = await parseAIResponse(response);

  for (const trend of (trends.trends || [])) {
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
      raw_data: trend,
    }).catch((e: any) => console.error('Insert error:', e));
  }

  return trends;
}

async function analyzeViralProduct(url: string, apiKey: string, supabase: any, userId: string) {
  const platform = detectPlatform(url);
  
  const prompt = `Analyse ce produit viral à partir de l'URL: ${url}

Retourne un JSON:
{
  "product": {
    "product_name": "nom du produit",
    "source_platform": "${platform}",
    "source_url": "${url}",
    "viral_score": 88,
    "views": 2500000,
    "engagement_rate": 8.5,
    "estimated_price": 29.99,
    "cost_price": 8.50,
    "profit_margin": 65,
    "description": "description courte",
    "hashtags": ["tag1", "tag2", "tag3"],
    "ad_count": 34,
    "competitor_count": 12
  }
}`;

  const response = await callAI(apiKey, 
    'Tu es un expert en analyse de produits viraux sur les réseaux sociaux. Tu réponds UNIQUEMENT en JSON valide.',
    prompt
  );

  const result = await parseAIResponse(response);
  const product = result.product || {};
  const winningScore = calculateWinningScore({
    trend_score: product.viral_score,
    search_volume: (product.views || 0) / 100,
    profit_margin: product.profit_margin,
    saturation_level: 'medium',
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
    raw_data: product,
  }).catch((e: any) => console.error('Insert error:', e));

  return result;
}

async function analyzeSaturation(niche: string, apiKey: string, supabase: any, userId: string) {
  const prompt = `Analyse la saturation du marché pour la niche "${niche}".

Retourne un JSON:
{
  "saturation": {
    "niche": "${niche}",
    "saturation_level": "low|medium|high",
    "saturation_score": 65,
    "competitor_count": 1250,
    "active_ads": 3400,
    "search_demand": 125000,
    "recommendation": "recommandation stratégique",
    "alternative_niches": ["alt1", "alt2", "alt3"]
  }
}`;

  const response = await callAI(apiKey, 
    'Tu es un expert en analyse de marché e-commerce. Tu réponds UNIQUEMENT en JSON valide.',
    prompt
  );

  return await parseAIResponse(response);
}

// ─── HELPERS ─────────────────────────────────────────────────────
async function callAI(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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

  return response;
}

async function parseAIResponse(response: Response): Promise<any> {
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
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
  const saturationPenalty = data.saturation_level === 'high' ? 0.7 : data.saturation_level === 'medium' ? 0.85 : 1;

  const volumeScore = Math.min((searchVolume / 10000) * 20, 30);
  const profitScore = Math.min((profitMargin / 100) * 20, 20);

  const rawScore = (trendScore * 0.5) + volumeScore + profitScore;
  return Math.min(Math.max(Math.round(rawScore * saturationPenalty), 0), 100);
}
