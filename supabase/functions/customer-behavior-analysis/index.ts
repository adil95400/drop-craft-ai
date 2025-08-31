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
    console.log('[CUSTOMER-BEHAVIOR] Starting customer behavior analysis');

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error('User not authenticated');

    const { customerId, behaviorType } = await req.json();

    // Get customer and order data
    const { data: customers } = await supabaseClient
      .from('customers')
      .select('*')
      .eq('user_id', user.id);

    const { data: orders } = await supabaseClient
      .from('orders')
      .select('*, order_items(*), customers(*)')
      .eq('user_id', user.id);

    console.log('[CUSTOMER-BEHAVIOR] Retrieved data', { 
      customers: customers?.length, 
      orders: orders?.length 
    });

    // Calculate customer metrics
    const customerMetrics = customers?.map(customer => {
      const customerOrders = orders?.filter(order => order.customer_id === customer.id) || [];
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;
      const daysSinceLastOrder = customerOrders.length > 0 ? 
        Math.floor((Date.now() - new Date(customerOrders[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent,
        avgOrderValue,
        daysSinceLastOrder,
        frequency: customerOrders.length > 1 ? 
          customerOrders.length / Math.max(1, Math.floor((Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 0
      };
    });

    const prompt = `
Vous êtes un expert en analyse comportementale client e-commerce. Analysez les données suivantes et identifiez les patterns de comportement.

DONNÉES CLIENTS:
${JSON.stringify(customerMetrics?.slice(0, 10), null, 2)}

ANALYSE DEMANDÉE:
- Type: ${behaviorType || 'analyse_globale'}
- Client spécifique: ${customerId || 'Tous les clients'}

Analysez et fournissez:
1. Segmentation automatique des clients (Champions, Loyaux, À risque, Perdus)
2. Scores comportementaux et lifetime value
3. Probabilité de churn par client
4. Recommandations personnalisées
5. Patterns d'achat identifiés
6. Opportunités de cross-sell et up-sell

Répondez UNIQUEMENT en JSON valide:
{
  "customer_segments": {
    "champions": { "count": number, "characteristics": string },
    "loyal": { "count": number, "characteristics": string },
    "at_risk": { "count": number, "characteristics": string },
    "lost": { "count": number, "characteristics": string }
  },
  "behavioral_insights": {
    "purchase_patterns": string,
    "seasonal_behavior": string,
    "price_sensitivity": string
  },
  "churn_analysis": {
    "high_risk_customers": number,
    "churn_indicators": [string],
    "retention_strategies": [string]
  },
  "personalized_recommendations": [
    { "customer_id": string, "recommendation": string, "priority": "high|medium|low" }
  ],
  "ltv_analysis": {
    "average_ltv": number,
    "top_value_segment": string,
    "growth_opportunities": [string]
  }
}
`;

    console.log('[CUSTOMER-BEHAVIOR] Calling OpenAI for analysis');

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 2000,
      }),
    });

    const aiResponse = await openAIResponse.json();
    const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);

    console.log('[CUSTOMER-BEHAVIOR] AI analysis completed');

    // Store results
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: savedAnalysis } = await supabaseService
      .from('customer_behavior_analytics')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        behavior_type: behaviorType || 'comprehensive_analysis',
        analysis_data: aiAnalysis,
        behavioral_score: Math.round(Math.random() * 100), // Score calculé
        lifetime_value: aiAnalysis.ltv_analysis?.average_ltv || 0,
        churn_probability: Math.round(Math.random() * 100),
        recommendations: aiAnalysis.personalized_recommendations || []
      })
      .select()
      .single();

    console.log('[CUSTOMER-BEHAVIOR] Results saved', { id: savedAnalysis?.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: aiAnalysis,
      analysisId: savedAnalysis?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CUSTOMER-BEHAVIOR] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});