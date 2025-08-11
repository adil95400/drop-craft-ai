import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisType, productData, marketData } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer les données produits réelles depuis Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .limit(50);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Construire le prompt selon le type d'analyse
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'product_optimization':
        systemPrompt = 'Tu es un expert en e-commerce et optimisation de catalogue. Analyse les données produits et fournis des recommandations concrètes.';
        userPrompt = `Analyse ces produits e-commerce et fournis des insights d'optimisation:
        
Données produits: ${JSON.stringify(products.slice(0, 10))}

Fournis:
1. Top 3 produits à fort potentiel (avec justification)
2. Recommandations de prix optimaux
3. Suggestions d'amélioration des marges
4. Produits tendance identifiés

Format JSON avec structure claire et métrics précis.`;
        break;

      case 'market_trends':
        systemPrompt = 'Tu es un analyste marché spécialisé en e-commerce. Identifie les tendances et opportunités.';
        userPrompt = `Analyse le marché basé sur ce catalogue produits:
        
Produits: ${JSON.stringify(products.slice(0, 15))}

Identifie:
1. Tendances émergentes par catégorie
2. Opportunités de croissance
3. Gaps de marché à exploiter
4. Prédictions de demande

Réponds en JSON structuré avec données concrètes.`;
        break;

      case 'competitor_analysis':
        systemPrompt = 'Tu es un stratège concurrentiel en e-commerce. Analyse la position competitive.';
        userPrompt = `Analyse competitive basée sur ce portefeuille produits:
        
Portfolio: ${JSON.stringify(products.slice(0, 12))}

Fournis:
1. Forces concurrentielles identifiées
2. Avantages différenciateurs
3. Recommandations positioning
4. Stratégies de prix vs concurrence

Format JSON avec insights actionnables.`;
        break;

      default:
        systemPrompt = 'Tu es un consultant e-commerce expert. Analyse les données et fournis des recommandations.';
        userPrompt = `Analyse ces données e-commerce et fournis des insights:
        
Données: ${JSON.stringify(products.slice(0, 8))}

Fournis des recommandations d'optimisation en JSON.`;
    }

    // Appel à OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices[0].message.content;

    // Parser le JSON si possible
    let structuredAnalysis;
    try {
      structuredAnalysis = JSON.parse(aiAnalysis);
    } catch {
      structuredAnalysis = { 
        analysis: aiAnalysis,
        type: analysisType,
        timestamp: new Date().toISOString()
      };
    }

    // Sauvegarder l'analyse en base (optionnel)
    await supabase
      .from('ai_optimization_jobs')
      .insert([{
        job_type: analysisType,
        status: 'completed',
        input_data: { productCount: products.length },
        output_data: structuredAnalysis,
        completed_at: new Date().toISOString()
      }]);

    return new Response(JSON.stringify({
      success: true,
      analysis: structuredAnalysis,
      timestamp: new Date().toISOString(),
      productsAnalyzed: products.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-catalog-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});