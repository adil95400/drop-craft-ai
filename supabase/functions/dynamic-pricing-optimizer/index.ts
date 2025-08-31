import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { productId, userId, marketData } = await req.json();

    console.log('Dynamic Pricing Optimizer - Processing product:', { productId, userId });

    // Récupérer les données produit
    const { data: product, error: productError } = await supabase
      .from('imported_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Analyser le marché et la concurrence
    const marketAnalysis = await analyzeMarketData(product, marketData);
    
    // Optimiser le prix avec l'IA
    const pricingRecommendation = await generatePricingRecommendation(product, marketAnalysis);
    
    // Calculer l'impact prévu
    const impactAnalysis = await calculatePricingImpact(product, pricingRecommendation);

    // Enregistrer la recommandation
    const { data: pricingRecord, error: insertError } = await supabase
      .from('dynamic_pricing')
      .insert({
        user_id: userId,
        product_id: productId,
        current_price: product.price,
        suggested_price: pricingRecommendation.suggestedPrice,
        original_price: product.price,
        price_change_reason: pricingRecommendation.reasoning,
        ai_confidence: pricingRecommendation.confidence,
        market_factors: marketAnalysis,
        competitor_analysis: pricingRecommendation.competitorAnalysis,
        demand_forecast: impactAnalysis.demandForecast,
        profit_impact: impactAnalysis.profitImpact,
        expected_sales_impact: impactAnalysis.salesImpact,
        performance_data: {
          marketConditions: marketAnalysis.conditions,
          confidence: pricingRecommendation.confidence,
          riskLevel: pricingRecommendation.riskLevel
        }
      })
      .select()
      .single();

    if (insertError) {
      throw new Error('Failed to save pricing recommendation');
    }

    return new Response(JSON.stringify({
      success: true,
      currentPrice: product.price,
      suggestedPrice: pricingRecommendation.suggestedPrice,
      priceChange: ((pricingRecommendation.suggestedPrice - product.price) / product.price * 100).toFixed(2),
      confidence: pricingRecommendation.confidence,
      reasoning: pricingRecommendation.reasoning,
      marketAnalysis: marketAnalysis,
      impactAnalysis: impactAnalysis,
      recommendationId: pricingRecord.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in dynamic pricing optimizer:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeMarketData(product: any, marketData: any) {
  const prompt = `
Analysez les données de marché pour le produit "${product.name}" dans la catégorie "${product.category}":

Prix actuel: ${product.price} ${product.currency}
Données de marché: ${JSON.stringify(marketData)}

Analysez:
1. Positionnement concurrentiel
2. Élasticité de la demande
3. Tendances saisonnières
4. Facteurs de marché actuels
5. Opportunités de prix

Répondez en JSON avec: competitivePosition, demandElasticity, seasonalTrends, marketFactors, pricingOpportunities
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en pricing dynamique et analyse de marché e-commerce. Analyse précisément les données et fournis des insights actionnables en JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1200,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      competitivePosition: 'unknown',
      demandElasticity: 'medium',
      seasonalTrends: [],
      marketFactors: {},
      pricingOpportunities: []
    };
  }
}

async function generatePricingRecommendation(product: any, marketAnalysis: any) {
  const prompt = `
Basé sur l'analyse de marché, recommandez un prix optimal pour:

Produit: ${product.name}
Prix actuel: ${product.price} ${product.currency}
Coût: ${product.cost_price || 'Non spécifié'} ${product.currency}
Analyse de marché: ${JSON.stringify(marketAnalysis)}

Considérations:
- Maximiser le profit
- Maintenir la compétitivité
- Optimiser les volumes de vente
- Gérer les risques

Répondez en JSON avec: suggestedPrice, confidence (0-100), reasoning, competitorAnalysis, riskLevel (low/medium/high)
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en stratégie de prix e-commerce. Recommande des prix optimaux basés sur des données de marché précises.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      suggestedPrice: product.price,
      confidence: 0,
      reasoning: 'Erreur dans l\'analyse IA',
      competitorAnalysis: {},
      riskLevel: 'high'
    };
  }
}

async function calculatePricingImpact(product: any, pricingRecommendation: any) {
  const priceChange = (pricingRecommendation.suggestedPrice - product.price) / product.price;
  
  // Simulation d'impact basée sur l'élasticité prix
  const elasticity = -1.5; // Élasticité prix typique e-commerce
  const salesImpact = -elasticity * priceChange * 100;
  
  const currentProfit = (product.price - (product.cost_price || 0));
  const newProfit = (pricingRecommendation.suggestedPrice - (product.cost_price || 0));
  const profitImpact = ((newProfit - currentProfit) / currentProfit) * 100;

  return {
    demandForecast: {
      expectedSalesChange: salesImpact,
      elasticity: elasticity,
      confidence: pricingRecommendation.confidence
    },
    profitImpact: profitImpact,
    salesImpact: salesImpact,
    revenueImpact: (priceChange * 100) + salesImpact,
    riskFactors: {
      competitorResponse: pricingRecommendation.riskLevel,
      demandSensitivity: Math.abs(salesImpact) > 20 ? 'high' : 'low'
    }
  };
}