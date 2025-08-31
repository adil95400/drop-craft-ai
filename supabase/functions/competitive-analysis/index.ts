import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    console.log('[COMPETITIVE-ANALYSIS] Starting competitive analysis');

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { competitorName, productId, analysisType } = await req.json();

    // Get product and market data
    const { data: products } = await supabaseClient
      .from('imported_products')
      .select('*')
      .eq('user_id', user.id);

    const { data: catalogProducts } = await supabaseClient
      .from('catalog_products')
      .select('*')
      .limit(50);

    console.log('[COMPETITIVE-ANALYSIS] Retrieved data', { 
      userProducts: products?.length, 
      marketProducts: catalogProducts?.length 
    });

    const prompt = `
Vous êtes un expert en intelligence compétitive e-commerce. Analysez le marché et la concurrence pour identifier les opportunités et menaces.

DONNÉES PRODUITS UTILISATEUR:
${JSON.stringify(products?.slice(0, 5), null, 2)}

DONNÉES MARCHÉ (échantillon):
${JSON.stringify(catalogProducts?.slice(0, 10), null, 2)}

ANALYSE DEMANDÉE:
- Concurrent: ${competitorName || 'Analyse globale du marché'}
- Produit: ${productId || 'Tous les produits'}
- Type: ${analysisType || 'competitive_positioning'}

Analysez et fournissez:
1. Positionnement concurrentiel par prix et qualité
2. Analyse des gaps de marché et opportunités
3. Benchmark des prix et features
4. Stratégies de différenciation recommandées
5. Niveau de menace concurrentielle
6. Recommandations d'actions stratégiques

Répondez UNIQUEMENT en JSON valide:
{
  "competitive_positioning": {
    "market_position": "leader|challenger|follower|niche",
    "price_position": "premium|competitive|budget",
    "quality_score": number,
    "differentiation_factors": [string]
  },
  "price_analysis": {
    "user_avg_price": number,
    "market_avg_price": number,
    "price_gap_percentage": number,
    "pricing_recommendations": [string]
  },
  "market_opportunities": [
    {
      "category": string,
      "opportunity": string,
      "potential_revenue": number,
      "difficulty": "low|medium|high"
    }
  ],
  "competitive_threats": [
    {
      "competitor": string,
      "threat_level": "low|medium|high|critical",
      "description": string,
      "mitigation_strategy": string
    }
  ],
  "feature_gaps": [
    {
      "missing_feature": string,
      "competitor_advantage": string,
      "implementation_priority": "high|medium|low"
    }
  ],
  "strategic_recommendations": [
    {
      "strategy": string,
      "rationale": string,
      "expected_outcome": string,
      "timeframe": "short|medium|long"
    }
  ],
  "market_trends": {
    "emerging_categories": [string],
    "declining_segments": [string],
    "growth_opportunities": [string]
  }
}
`;

    console.log('[COMPETITIVE-ANALYSIS] Calling OpenAI for analysis');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 2500,
      }),
    });

    const aiResponse = await openAIResponse.json();
    const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);

    console.log('[COMPETITIVE-ANALYSIS] AI analysis completed');

    // Determine threat level
    const threatLevels = aiAnalysis.competitive_threats?.map(t => t.threat_level) || [];
    const hasCriticalThreat = threatLevels.includes('critical');
    const hasHighThreat = threatLevels.includes('high');
    const overallThreatLevel = hasCriticalThreat ? 'critical' : hasHighThreat ? 'high' : 'medium';

    // Store results
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: savedAnalysis } = await supabaseService
      .from('competitive_intelligence')
      .insert({
        user_id: user.id,
        competitor_name: competitorName || 'Market Analysis',
        product_id: productId,
        competitive_data: aiAnalysis.competitive_positioning,
        price_analysis: aiAnalysis.price_analysis,
        market_position: aiAnalysis.market_opportunities,
        gap_opportunities: aiAnalysis.feature_gaps,
        threat_level: overallThreatLevel
      })
      .select()
      .single();

    console.log('[COMPETITIVE-ANALYSIS] Results saved', { id: savedAnalysis?.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      analysisId: savedAnalysis?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[COMPETITIVE-ANALYSIS] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});