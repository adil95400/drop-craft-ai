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
    console.log('[MARKETING-OPTIMIZATION] Starting marketing optimization analysis');

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { campaignId, channel, attributionModel } = await req.json();

    // Get marketing and sales data
    const { data: campaigns } = await supabaseClient
      .from('marketing_campaigns')
      .select('*')
      .eq('user_id', user.id);

    const { data: segments } = await supabaseClient
      .from('marketing_segments')
      .select('*')
      .eq('user_id', user.id);

    const { data: orders } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    console.log('[MARKETING-OPTIMIZATION] Retrieved data', { 
      campaigns: campaigns?.length, 
      segments: segments?.length,
      recentOrders: orders?.length
    });

    const prompt = `
Vous êtes un expert en optimisation marketing et attribution multi-touch. Analysez les données suivantes pour optimiser les performances marketing.

DONNÉES MARKETING:
- Campagnes: ${campaigns?.length || 0} campagnes actives
- Segments: ${segments?.length || 0} segments clients
- Commandes récentes (90j): ${orders?.length || 0}

PARAMÈTRES D'ANALYSE:
- Canal: ${channel || 'Tous les canaux'}
- Modèle d'attribution: ${attributionModel || 'last_click'}
- Campagne spécifique: ${campaignId || 'Analyse globale'}

Fournissez une analyse complète avec:
1. Attribution multi-touch et ROI par canal
2. Optimisation des audiences et segments
3. Recommandations de budget et de bidding
4. Analyse de la customer journey
5. Opportunités de cross-channel
6. Prédictions de performance

Répondez UNIQUEMENT en JSON valide:
{
  "channel_performance": {
    "social": { "roi": number, "conversions": number, "cost_per_acquisition": number },
    "search": { "roi": number, "conversions": number, "cost_per_acquisition": number },
    "email": { "roi": number, "conversions": number, "cost_per_acquisition": number },
    "display": { "roi": number, "conversions": number, "cost_per_acquisition": number }
  },
  "attribution_analysis": {
    "first_touch": { "weight": number, "value": number },
    "last_touch": { "weight": number, "value": number },
    "linear": { "weight": number, "value": number },
    "time_decay": { "weight": number, "value": number }
  },
  "audience_insights": {
    "best_performing_segments": [string],
    "underperforming_segments": [string],
    "expansion_opportunities": [string]
  },
  "optimization_recommendations": [
    { 
      "channel": string, 
      "recommendation": string, 
      "expected_impact": string,
      "priority": "high|medium|low"
    }
  ],
  "budget_allocation": {
    "recommended_distribution": { "social": number, "search": number, "email": number, "display": number },
    "rationale": string
  },
  "performance_predictions": {
    "30_days": { "conversions": number, "revenue": number, "roi": number },
    "60_days": { "conversions": number, "revenue": number, "roi": number },
    "90_days": { "conversions": number, "revenue": number, "roi": number }
  }
}
`;

    console.log('[MARKETING-OPTIMIZATION] Calling OpenAI for analysis');

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

    console.log('[MARKETING-OPTIMIZATION] AI analysis completed');

    // Calculate performance score
    const avgROI = Object.values(aiAnalysis.channel_performance).reduce((sum, ch: any) => sum + ch.roi, 0) / 4;
    const performanceScore = Math.min(100, Math.max(0, avgROI));

    // Store results
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: savedAnalysis } = await supabaseService
      .from('marketing_intelligence')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        channel: channel || 'multi_channel',
        attribution_model: attributionModel || 'last_click',
        conversion_data: aiAnalysis.channel_performance,
        roi_analysis: aiAnalysis.attribution_analysis,
        audience_insights: aiAnalysis.audience_insights,
        optimization_suggestions: aiAnalysis.optimization_recommendations,
        performance_score: performanceScore
      })
      .select()
      .single();

    console.log('[MARKETING-OPTIMIZATION] Results saved', { id: savedAnalysis?.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      analysisId: savedAnalysis?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MARKETING-OPTIMIZATION] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});