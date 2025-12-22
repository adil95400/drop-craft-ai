import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  action: 'find_winners' | 'analyze_niche' | 'competitor_analysis' | 'suggest_products';
  query?: string;
  niche?: string;
  marketplace?: string;
  budget?: { min: number; max: number };
  filters?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request = await req.json() as ResearchRequest;
    const { action, query, niche, marketplace, budget, filters } = request;

    console.log('AI Product Research:', action, query || niche);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'find_winners':
        systemPrompt = `Tu es un expert en dropshipping spécialisé dans l'identification de produits gagnants. Tu analyses les tendances des marketplaces (Amazon, AliExpress, Temu, CJDropshipping) et des réseaux sociaux (TikTok, Instagram).

Tu identifies les produits avec:
- Fort potentiel viral
- Bonnes marges (>40%)
- Demande croissante
- Faible saturation
- Facilité de sourcing

Réponds UNIQUEMENT avec un JSON valide.`;

        userPrompt = `Trouve 10 produits gagnants pour le dropshipping basé sur:
${query ? `Recherche: ${query}` : ''}
${niche ? `Niche: ${niche}` : ''}
${marketplace ? `Marketplace prioritaire: ${marketplace}` : ''}
${budget ? `Budget cible: ${budget.min}€ - ${budget.max}€` : ''}

Retourne un JSON avec:
{
  "products": [
    {
      "title": "nom du produit",
      "description": "description courte",
      "category": "catégorie",
      "estimated_cost": number,
      "suggested_price": number,
      "profit_margin": number,
      "winning_score": 0-100,
      "trend_score": 0-100,
      "saturation_level": "low" | "medium" | "high",
      "viral_potential": 0-100,
      "source_platforms": ["AliExpress", "CJDropshipping", etc.],
      "target_audience": ["liste des cibles"],
      "marketing_angles": ["3 angles marketing"],
      "hashtags": ["hashtags recommandés"],
      "seasonality": "description ou null",
      "reasons": ["3 raisons de le vendre"]
    }
  ],
  "market_insights": {
    "trending_niches": ["5 niches tendance"],
    "emerging_trends": ["3 tendances émergentes"],
    "avoid_categories": ["catégories à éviter"]
  }
}`;
        break;

      case 'analyze_niche':
        systemPrompt = `Tu es un expert en analyse de marché e-commerce. Tu fournis des analyses détaillées des niches de dropshipping.`;

        userPrompt = `Analyse complète de la niche: ${niche || query}

Fournir un JSON avec:
{
  "niche_name": "${niche || query}",
  "overall_score": 0-100,
  "market_size": "small" | "medium" | "large" | "massive",
  "growth_rate": "declining" | "stable" | "growing" | "explosive",
  "competition_level": "low" | "medium" | "high" | "saturated",
  "profit_potential": 0-100,
  "entry_difficulty": "easy" | "moderate" | "hard" | "expert",
  "average_margins": { "low": number, "high": number },
  "key_players": ["5 acteurs majeurs"],
  "target_demographics": {
    "age_range": "tranche d'âge",
    "gender": "répartition",
    "interests": ["intérêts"],
    "income_level": "niveau de revenu"
  },
  "marketing_channels": [
    { "channel": "nom", "effectiveness": 0-100, "cost_level": "low" | "medium" | "high" }
  ],
  "seasonal_trends": ["tendances saisonnières"],
  "risks": ["risques identifiés"],
  "opportunities": ["opportunités"],
  "recommendations": ["5 recommandations stratégiques"],
  "sub_niches": ["5 sous-niches prometteuses"]
}`;
        break;

      case 'competitor_analysis':
        systemPrompt = `Tu es un expert en veille concurrentielle e-commerce. Tu analyses les concurrents et leurs stratégies.`;

        userPrompt = `Analyse concurrentielle pour: ${query || niche}

Fournir un JSON avec:
{
  "market_overview": {
    "total_competitors": "estimation",
    "market_maturity": "emerging" | "growing" | "mature" | "declining",
    "barrier_to_entry": "low" | "medium" | "high"
  },
  "competitor_profiles": [
    {
      "type": "type de concurrent",
      "strengths": ["forces"],
      "weaknesses": ["faiblesses"],
      "pricing_strategy": "description",
      "marketing_approach": "description"
    }
  ],
  "competitive_advantages": ["avantages possibles"],
  "differentiation_strategies": ["stratégies de différenciation"],
  "price_positioning": {
    "budget": { "range": "fourchette", "positioning": "description" },
    "mid_range": { "range": "fourchette", "positioning": "description" },
    "premium": { "range": "fourchette", "positioning": "description" }
  },
  "gap_analysis": ["opportunités non exploitées"],
  "recommended_positioning": "positionnement recommandé"
}`;
        break;

      case 'suggest_products':
        systemPrompt = `Tu es un expert en curation de produits dropshipping. Tu suggères des produits personnalisés basés sur les critères du vendeur.`;

        userPrompt = `Suggère des produits basés sur:
${JSON.stringify(filters || {}, null, 2)}

Fournir un JSON avec:
{
  "suggestions": [
    {
      "product_name": "nom",
      "category": "catégorie",
      "why_recommended": "raison",
      "estimated_demand": "low" | "medium" | "high" | "very_high",
      "price_range": { "cost": number, "sell": number },
      "match_score": 0-100,
      "quick_tips": ["3 conseils rapides"]
    }
  ],
  "alternative_directions": ["directions alternatives à explorer"]
}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      let jsonStr = content;
      if (content.includes('```json')) {
        jsonStr = content.split('```json')[1].split('```')[0];
      } else if (content.includes('```')) {
        jsonStr = content.split('```')[1].split('```')[0];
      }
      result = JSON.parse(jsonStr.trim());
    } catch {
      console.error('Failed to parse:', content);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        action,
        analyzed_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-product-research:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
