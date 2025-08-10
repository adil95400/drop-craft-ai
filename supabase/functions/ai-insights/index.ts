import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      analysisType,
      data,
      timeRange = '30d',
      metrics = ['sales', 'conversion', 'traffic']
    } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'sales_trends':
        systemPrompt = `Tu es un analyste commercial expert en e-commerce, spécialisé dans l'analyse de données de vente et l'identification de tendances.`;
        userPrompt = `Analyse les tendances de vente sur ${timeRange}:
        
        Données de vente: ${JSON.stringify(data.salesData)}
        Produits: ${JSON.stringify(data.products)}
        Périodes: ${JSON.stringify(data.periods)}
        
        Fournis:
        1. Tendances principales identifiées
        2. Produits en croissance vs déclin
        3. Saisonnalité détectée
        4. Prédictions pour les prochaines périodes
        5. Recommandations d'actions commerciales
        6. Alertes sur les performances anormales`;
        break;

      case 'customer_behavior':
        systemPrompt = `Tu es un expert en analyse comportementale client et en CRM, spécialisé dans l'e-commerce et l'optimisation de l'expérience utilisateur.`;
        userPrompt = `Analyse le comportement client:
        
        Données clients: ${JSON.stringify(data.customers)}
        Sessions: ${JSON.stringify(data.sessions)}
        Conversions: ${JSON.stringify(data.conversions)}
        
        Fournis:
        1. Profils types de clients identifiés
        2. Parcours d'achat principaux
        3. Points de friction détectés
        4. Opportunités d'amélioration UX
        5. Segmentation clientèle recommandée
        6. Stratégies de rétention personnalisées`;
        break;

      case 'inventory_optimization':
        systemPrompt = `Tu es un expert en gestion des stocks et supply chain pour l'e-commerce, spécialisé dans l'optimisation des inventaires.`;
        userPrompt = `Optimise la gestion des stocks:
        
        Stocks actuels: ${JSON.stringify(data.inventory)}
        Historique des ventes: ${JSON.stringify(data.salesHistory)}
        Délais fournisseurs: ${JSON.stringify(data.supplierLeadTimes)}
        
        Fournis:
        1. Niveaux de stock optimaux par produit
        2. Alertes de réapprovisionnement
        3. Produits en surstockage
        4. Prédictions de demande
        5. Stratégies de liquidation des stocks
        6. Optimisation des commandes fournisseurs`;
        break;

      case 'conversion_optimization':
        systemPrompt = `Tu es un expert en optimisation de conversion e-commerce (CRO), spécialisé dans l'analyse de performance et l'amélioration des taux de conversion.`;
        userPrompt = `Analyse et optimise les conversions:
        
        Taux de conversion: ${JSON.stringify(data.conversionRates)}
        Entonnoir de vente: ${JSON.stringify(data.funnel)}
        Pages produits: ${JSON.stringify(data.productPages)}
        
        Fournis:
        1. Analyse des taux de conversion par segment
        2. Goulots d'étranglement identifiés
        3. Recommandations d'amélioration UX
        4. Tests A/B suggérés
        5. Optimisations prioritaires
        6. Estimation d'impact sur le CA`;
        break;

      case 'fraud_detection':
        systemPrompt = `Tu es un expert en détection de fraudes e-commerce et en cybersécurité, spécialisé dans l'analyse de patterns suspects.`;
        userPrompt = `Analyse les risques de fraude:
        
        Transactions: ${JSON.stringify(data.transactions)}
        Commandes suspectes: ${JSON.stringify(data.suspiciousOrders)}
        Comportements: ${JSON.stringify(data.userBehaviors)}
        
        Fournis:
        1. Score de risque par transaction
        2. Patterns de fraude détectés
        3. Recommandations de sécurité
        4. Règles de prévention suggérées
        5. Analyse des faux positifs
        6. Plan d'action préventif`;
        break;

      default:
        throw new Error(`Analysis type '${analysisType}' not supported`);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;

    // Generate actionable insights
    const insightsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Tu es un consultant e-commerce expert. Transforme cette analyse en recommandations concrètes et priorisées avec des indicateurs de ROI estimés.' 
          },
          { 
            role: 'user', 
            content: `Basé sur cette analyse: ${analysis}\n\nCrée des recommandations SMART avec priorités et ROI estimé.` 
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    const insightsData = await insightsResponse.json();
    const actionableInsights = insightsData.choices[0].message.content;

    return new Response(JSON.stringify({ 
      analysis,
      actionableInsights,
      analysisType,
      timeRange,
      metrics,
      generatedAt: new Date().toISOString(),
      usage: {
        analysisTokens: aiResponse.usage,
        insightsTokens: insightsData.usage
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process AI insights request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});