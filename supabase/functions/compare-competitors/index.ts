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
    console.log('[COMPARE-COMPETITORS] Starting comparison');

    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { competitorIds } = await req.json();

    if (!competitorIds || competitorIds.length < 2) {
      throw new Error('At least 2 competitor IDs required for comparison');
    }

    // Get all analyses
    const { data: analyses } = await supabaseClient
      .from('competitive_intelligence')
      .select('*')
      .in('id', competitorIds)
      .eq('user_id', user.id);

    if (!analyses || analyses.length < 2) {
      throw new Error('Not enough valid analyses found');
    }

    console.log('[COMPARE-COMPETITORS] Retrieved analyses', { count: analyses.length });

    const prompt = `
Vous êtes un expert en intelligence compétitive. Comparez les concurrents suivants et générez un rapport comparatif détaillé.

ANALYSES CONCURRENTIELLES:
${JSON.stringify(analyses, null, 2)}

Générez un rapport comparatif incluant:
1. Tableau de comparaison des forces/faiblesses
2. Positionnement relatif de chaque concurrent
3. Analyse des écarts de prix et de qualité
4. Recommandations stratégiques spécifiques
5. Opportunités de différenciation

Répondez UNIQUEMENT en JSON valide:
{
  "comparison_summary": {
    "total_competitors": number,
    "market_leader": string,
    "price_leader": string,
    "quality_leader": string
  },
  "comparative_matrix": [
    {
      "competitor": string,
      "strengths": [string],
      "weaknesses": [string],
      "market_position": string,
      "threat_level": string,
      "overall_score": number
    }
  ],
  "price_comparison": {
    "highest": { "name": string, "price": number },
    "lowest": { "name": string, "price": number },
    "average": number,
    "user_position": string
  },
  "gap_analysis": {
    "user_advantages": [string],
    "user_disadvantages": [string],
    "quick_wins": [string],
    "long_term_investments": [string]
  },
  "strategic_recommendations": [
    {
      "action": string,
      "priority": "high|medium|low",
      "expected_impact": string,
      "timeframe": string
    }
  ]
}
`;

    console.log('[COMPARE-COMPETITORS] Calling AI Gateway for comparison');

    const openAIResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiResponse = await openAIResponse.json();
    const comparison = JSON.parse(aiResponse.choices[0].message.content);

    console.log('[COMPARE-COMPETITORS] Comparison completed');

    return new Response(JSON.stringify({
      success: true,
      comparison,
      analyzedCompetitors: analyses.map(a => ({
        id: a.id,
        name: a.competitor_name
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[COMPARE-COMPETITORS] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
