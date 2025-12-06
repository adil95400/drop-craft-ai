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
    console.log('[SALES-FORECAST] Starting sales forecast analysis');

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { productId, timePeriod, analysisType } = await req.json();

    // Get historical data
    const { data: orders } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    const { data: customers } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('user_id', user.id);

    const { data: products } = await supabaseClient
      .from('imported_products')
      .select('*')
      .eq('user_id', user.id);

    console.log('[SALES-FORECAST] Retrieved historical data', { 
      orders: orders?.length, 
      customers: customers?.length, 
      products: products?.length 
    });

    // Prepare AI analysis prompt
    const prompt = `
Vous êtes un expert en analyse prédictive des ventes e-commerce. Analysez les données suivantes et fournissez des prédictions précises.

DONNÉES HISTORIQUES:
- Commandes: ${orders?.length || 0} commandes sur 12 mois
- Clients: ${customers?.length || 0} clients totaux
- Produits: ${products?.length || 0} produits

ANALYSE DEMANDÉE:
- Type: ${analysisType}
- Période: ${timePeriod}
- Produit spécifique: ${productId || 'Tous les produits'}

Fournissez une analyse structurée avec:
1. Prédictions de ventes pour les 3, 6 et 12 prochains mois
2. Score de confiance (0-100)
3. Facteurs d'influence identifiés
4. Actions recommandées pour optimiser les ventes
5. Analyse des tendances saisonnières
6. Recommandations de prix et de stock

Répondez UNIQUEMENT en JSON valide avec cette structure:
{
  "predictions": {
    "3_months": { "revenue": number, "orders": number, "growth_rate": number },
    "6_months": { "revenue": number, "orders": number, "growth_rate": number },
    "12_months": { "revenue": number, "orders": number, "growth_rate": number }
  },
  "confidence_score": number,
  "market_insights": {
    "seasonal_trends": string,
    "demand_patterns": string,
    "competitive_position": string
  },
  "recommended_actions": [
    { "priority": "high|medium|low", "action": string, "impact": string }
  ],
  "risk_factors": [string],
  "opportunities": [string]
}
`;

    console.log('[SALES-FORECAST] Calling OpenAI for analysis');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
      }),
    });

    const aiResponse = await openAIResponse.json();
    const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);

    console.log('[SALES-FORECAST] AI analysis completed', { confidence: aiAnalysis.confidence_score });

    // Store results in database
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: savedAnalysis } = await supabaseService
      .from('sales_intelligence')
      .insert({
        user_id: user.id,
        product_id: productId,
        analysis_type: 'forecast',
        time_period: timePeriod,
        predictions: aiAnalysis.predictions,
        confidence_score: aiAnalysis.confidence_score,
        market_insights: aiAnalysis.market_insights,
        recommended_actions: aiAnalysis.recommended_actions
      })
      .select()
      .single();

    console.log('[SALES-FORECAST] Results saved to database', { id: savedAnalysis?.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      analysisId: savedAnalysis?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SALES-FORECAST] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});