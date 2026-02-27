import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!LOVABLE_API_KEY) {
  console.error('LOVABLE_API_KEY is not set');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

serve(async (req) => {
  console.log('AI Powerhouse Function called:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const body = await req.json();
    const { authorization } = Object.fromEntries(req.headers);

    console.log('Processing AI endpoint:', endpoint, 'with body keys:', Object.keys(body));

    // Verify user authentication
    if (!authorization) {
      throw new Error('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('Authenticated user:', user.id);

    switch (endpoint) {
      case 'smart-assistant':
        return await handleSmartAssistant(body, user);
      
      case 'content-generator':
        return await handleContentGenerator(body, user);
      
      case 'predictive-analyzer':
        return await handlePredictiveAnalyzer(body, user);
      
      case 'auto-optimizer':
        return await handleAutoOptimizer(body, user);
      
      case 'business-intelligence':
        return await handleBusinessIntelligence(body, user);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown AI endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in AI Powerhouse:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSmartAssistant(body: any, user: any) {
  console.log('Processing Smart Assistant request for user:', user.id);
  
  const { message, context, conversationHistory = [] } = body;
  
  if (!message) {
    throw new Error('Message is required');
  }

  // Construire le contexte de conversation
  const systemPrompt = `Tu es un assistant IA avancé spécialisé dans l'e-commerce et la gestion d'entreprise. 
  Tu aides les utilisateurs avec:
  - Analyse de données business
  - Optimisation des performances
  - Recommandations stratégiques
  - Gestion des fournisseurs et produits
  - Automatisation des processus
  
  Contexte utilisateur: ${context || 'Pas de contexte spécifique'}
  
  Réponds de manière concise et actionnable en français.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10), // Garder les 10 derniers messages
    { role: 'user', content: message }
  ];

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages,
      stream: false
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0].message.content;

  // Logger la conversation dans la base de données
  try {
    await supabase.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'smart_assistant',
      input_data: { message, context },
      output_data: { response: assistantMessage },
      status: 'completed',
      processing_time_ms: Date.now(),
      tokens_used: data.usage?.total_tokens || 0
    });
  } catch (dbError) {
    console.error('Error logging AI task:', dbError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      response: assistantMessage,
      usage: data.usage,
      timestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleContentGenerator(body: any, user: any) {
  console.log('Processing Content Generator request for user:', user.id);
  
  const { contentType, parameters, tone = 'professional', language = 'fr' } = body;
  
  if (!contentType || !parameters) {
    throw new Error('contentType and parameters are required');
  }

  let systemPrompt = '';
  let userPrompt = '';

  switch (contentType) {
    case 'product_description':
      systemPrompt = `Tu es un expert en rédaction de fiches produits e-commerce. 
      Crée des descriptions attirantes, SEO-friendly et persuasives.
      Ton: ${tone}, Langue: ${language}`;
      userPrompt = `Crée une description pour ce produit:
      Nom: ${parameters.productName || 'Non spécifié'}
      Catégorie: ${parameters.category || 'Non spécifiée'}
      Caractéristiques: ${parameters.features || 'Non spécifiées'}
      Prix: ${parameters.price || 'Non spécifié'}
      Public cible: ${parameters.targetAudience || 'Grand public'}`;
      break;

    case 'marketing_email':
      systemPrompt = `Tu es un expert en marketing par email. 
      Crée des emails engageants qui convertissent.
      Ton: ${tone}, Langue: ${language}`;
      userPrompt = `Crée un email marketing pour:
      Sujet: ${parameters.subject || 'Non spécifié'}
      Objectif: ${parameters.objective || 'Engagement'}
      Audience: ${parameters.audience || 'Clients existants'}
      Appel à l'action: ${parameters.cta || 'En savoir plus'}
      Contenu spécial: ${parameters.specialContent || 'Aucun'}`;
      break;

    case 'blog_article':
      systemPrompt = `Tu es un rédacteur expert en contenu web et SEO.
      Crée des articles de blog informatifs et optimisés.
      Ton: ${tone}, Langue: ${language}`;
      userPrompt = `Rédige un article de blog sur:
      Titre: ${parameters.title || 'Non spécifié'}
      Mots-clés: ${parameters.keywords || 'Non spécifiés'}
      Longueur cible: ${parameters.wordCount || '800'} mots
      Angle: ${parameters.angle || 'Informatif'}
      Public: ${parameters.audience || 'Professionnels'}`;
      break;

    case 'social_media':
      systemPrompt = `Tu es un expert en réseaux sociaux.
      Crée du contenu viral et engageant.
      Ton: ${tone}, Langue: ${language}`;
      userPrompt = `Crée un post pour:
      Plateforme: ${parameters.platform || 'LinkedIn'}
      Message: ${parameters.message || 'Non spécifié'}
      Hashtags: ${parameters.hashtags || 'À générer'}
      Objectif: ${parameters.goal || 'Engagement'}`;
      break;

    default:
      throw new Error(`Content type ${contentType} not supported`);
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 2000
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedContent = data.choices[0].message.content;

  // Logger la génération de contenu
  try {
    await supabase.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'content_generation',
      input_data: { contentType, parameters, tone, language },
      output_data: { content: generatedContent },
      status: 'completed',
      processing_time_ms: Date.now(),
      tokens_used: data.usage?.total_tokens || 0
    });
  } catch (dbError) {
    console.error('Error logging AI task:', dbError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      content: generatedContent,
      contentType,
      metadata: {
        tone,
        language,
        wordCount: generatedContent.split(' ').length,
        generatedAt: new Date().toISOString()
      },
      usage: data.usage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePredictiveAnalyzer(body: any, user: any) {
  console.log('Processing Predictive Analyzer request for user:', user.id);
  
  const { analysisType, data, timeframe = '3months', confidence = 'medium' } = body;
  
  if (!analysisType || !data) {
    throw new Error('analysisType and data are required');
  }

  const systemPrompt = `Tu es un expert en analyse prédictive et data science.
  Tu analyses les données business pour identifier les tendances et faire des prédictions.
  
  Niveau de confiance requis: ${confidence}
  Période d'analyse: ${timeframe}
  
  Fournis des insights actionnables avec:
  - Tendances identifiées
  - Prédictions chiffrées
  - Recommandations stratégiques
  - Niveau de confiance pour chaque prédiction
  - Actions recommandées
  
  Réponds en français avec des données structurées.`;

  let analysisPrompt = '';
  
  switch (analysisType) {
    case 'sales_forecast':
      analysisPrompt = `Analyse ces données de ventes et fais des prédictions:
      Données: ${JSON.stringify(data, null, 2)}
      
      Analyse:
      - Tendances des ventes
      - Saisonnalité
      - Prédictions pour ${timeframe}
      - Produits les plus prometteurs
      - Risques identifiés`;
      break;

    case 'customer_behavior':
      analysisPrompt = `Analyse le comportement client avec ces données:
      Données: ${JSON.stringify(data, null, 2)}
      
      Analyse:
      - Segments clients
      - Patterns d'achat
      - Churn prediction
      - Opportunités d'upselling
      - Recommandations de rétention`;
      break;

    case 'market_trends':
      analysisPrompt = `Analyse les tendances marché:
      Données: ${JSON.stringify(data, null, 2)}
      
      Analyse:
      - Évolution du marché
      - Opportunités émergentes
      - Menaces concurrentielles
      - Positionnement recommandé
      - Stratégies d'adaptation`;
      break;

    case 'inventory_optimization':
      analysisPrompt = `Optimise la gestion des stocks:
      Données: ${JSON.stringify(data, null, 2)}
      
      Analyse:
      - Rotation des stocks
      - Produits à risque de rupture
      - Surstocks identifiés
      - Optimisation des commandes
      - Prédictions de demande`;
      break;

    default:
      throw new Error(`Analysis type ${analysisType} not supported`);
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisPrompt }
      ],
      max_completion_tokens: 3000
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const analysis = aiResponse.choices[0].message.content;

  // Sauvegarder l'analyse
  try {
    await supabase.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'predictive_analysis',
      input_data: { analysisType, data, timeframe, confidence },
      output_data: { analysis },
      status: 'completed',
      processing_time_ms: Date.now(),
      tokens_used: aiResponse.usage?.total_tokens || 0
    });
  } catch (dbError) {
    console.error('Error logging AI task:', dbError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      analysis,
      analysisType,
      metadata: {
        timeframe,
        confidence,
        dataPoints: Array.isArray(data) ? data.length : Object.keys(data).length,
        generatedAt: new Date().toISOString()
      },
      usage: aiResponse.usage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAutoOptimizer(body: any, user: any) {
  console.log('Processing Auto Optimizer request for user:', user.id);
  
  const { optimizationType, currentData, goals, constraints = {} } = body;
  
  if (!optimizationType || !currentData || !goals) {
    throw new Error('optimizationType, currentData, and goals are required');
  }

  const systemPrompt = `Tu es un expert en optimisation business et performance.
  Tu analyses les données actuelles et proposes des optimisations concrètes.
  
  Objectifs: ${JSON.stringify(goals)}
  Contraintes: ${JSON.stringify(constraints)}
  
  Fournis des recommandations:
  - Priorité (Haute/Moyenne/Basse)
  - Impact estimé (%)
  - Effort requis (Faible/Moyen/Élevé)
  - Actions concrètes
  - Métriques de suivi
  - Timeline d'implémentation
  
  Réponds en français avec des recommandations actionnables.`;

  let optimizationPrompt = '';
  
  switch (optimizationType) {
    case 'conversion_optimization':
      optimizationPrompt = `Optimise le taux de conversion:
      Données actuelles: ${JSON.stringify(currentData, null, 2)}
      
      Analyse et optimise:
      - Tunnel de conversion
      - Points de friction
      - Opportunités d'amélioration
      - Tests A/B recommandés
      - Quick wins identifiés`;
      break;

    case 'pricing_optimization':
      optimizationPrompt = `Optimise la stratégie tarifaire:
      Données actuelles: ${JSON.stringify(currentData, null, 2)}
      
      Recommandations:
      - Prix optimaux par produit
      - Stratégies de pricing
      - Élasticité prix-demande
      - Positionnement concurrentiel
      - Impact sur la marge`;
      break;

    case 'operational_efficiency':
      optimizationPrompt = `Optimise l'efficacité opérationnelle:
      Données actuelles: ${JSON.stringify(currentData, null, 2)}
      
      Optimisations:
      - Processus à automatiser
      - Goulots d'étranglement
      - Allocation des ressources
      - Gains de productivité
      - ROI des améliorations`;
      break;

    case 'marketing_performance':
      optimizationPrompt = `Optimise les performances marketing:
      Données actuelles: ${JSON.stringify(currentData, null, 2)}
      
      Recommandations:
      - Canaux les plus performants
      - Réallocation du budget
      - Optimisation des campagnes
      - Targeting amélioré
      - Métriques prioritaires`;
      break;

    default:
      throw new Error(`Optimization type ${optimizationType} not supported`);
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: optimizationPrompt }
      ],
      max_completion_tokens: 2500
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const optimizations = aiResponse.choices[0].message.content;

  // Sauvegarder les optimisations
  try {
    await supabase.from('ai_optimization_jobs').insert({
      user_id: user.id,
      job_type: optimizationType,
      input_data: { currentData, goals, constraints },
      output_data: { optimizations },
      status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    });
  } catch (dbError) {
    console.error('Error logging optimization job:', dbError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      optimizations,
      optimizationType,
      metadata: {
        goals,
        constraints,
        generatedAt: new Date().toISOString(),
        estimatedImpact: 'À mesurer après implémentation'
      },
      usage: aiResponse.usage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleBusinessIntelligence(body: any, user: any) {
  console.log('Processing Business Intelligence request for user:', user.id);
  
  const { reportType, dataSource, period = 'last_30_days', metrics = [] } = body;
  
  if (!reportType || !dataSource) {
    throw new Error('reportType and dataSource are required');
  }

  const systemPrompt = `Tu es un expert en Business Intelligence et analyse de données.
  Tu crées des rapports insights détaillés et actionnables.
  
  Période d'analyse: ${period}
  Métriques demandées: ${metrics.join(', ') || 'Toutes les métriques pertinentes'}
  
  Structure ton rapport avec:
  - Résumé exécutif
  - KPIs principaux
  - Tendances identifiées
  - Analyses comparatives
  - Recommandations stratégiques
  - Actions prioritaires
  
  Utilise des données chiffrées et des insights concrets.`;

  let reportPrompt = '';
  
  switch (reportType) {
    case 'performance_dashboard':
      reportPrompt = `Crée un dashboard de performance business:
      Source de données: ${JSON.stringify(dataSource, null, 2)}
      
      Dashboard incluant:
      - Vue d'ensemble des performances
      - Évolution des KPIs
      - Comparaisons période précédente
      - Alertes et anomalies
      - Prochaines actions recommandées`;
      break;

    case 'competitive_analysis':
      reportPrompt = `Analyse la position concurrentielle:
      Données disponibles: ${JSON.stringify(dataSource, null, 2)}
      
      Rapport incluant:
      - Positionnement vs concurrents
      - Avantages concurrentiels
      - Menaces identifiées
      - Opportunités de différenciation
      - Stratégies recommandées`;
      break;

    case 'customer_insights':
      reportPrompt = `Analyse approfondie des clients:
      Données clients: ${JSON.stringify(dataSource, null, 2)}
      
      Insights incluant:
      - Segmentation client
      - Parcours client optimaux
      - Valeur vie client (LTV)
      - Opportunités de croissance
      - Stratégies de rétention`;
      break;

    case 'market_opportunity':
      reportPrompt = `Identifie les opportunités marché:
      Données marché: ${JSON.stringify(dataSource, null, 2)}
      
      Analyse incluant:
      - Taille de marché adressable
      - Segments porteurs
      - Barrières à l'entrée
      - Timing optimal
      - Plan d'approche recommandé`;
      break;

    default:
      throw new Error(`Report type ${reportType} not supported`);
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reportPrompt }
      ],
      max_completion_tokens: 3500
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  const report = aiResponse.choices[0].message.content;

  // Sauvegarder le rapport BI
  try {
    await supabase.from('business_intelligence_insights').insert({
      user_id: user.id,
      title: `Rapport ${reportType} - ${new Date().toLocaleDateString()}`,
      description: `Rapport généré automatiquement pour la période ${period}`,
      insight_type: reportType,
      category: 'ai_generated_report',
      ai_analysis: { report, dataSource, period },
      supporting_data: dataSource,
      confidence_score: 0.85,
      priority: 7,
      status: 'new'
    });
  } catch (dbError) {
    console.error('Error saving BI report:', dbError);
  }

  return new Response(
    JSON.stringify({
      success: true,
      report,
      reportType,
      metadata: {
        period,
        metrics,
        generatedAt: new Date().toISOString(),
        dataPoints: Array.isArray(dataSource) ? dataSource.length : Object.keys(dataSource).length
      },
      usage: aiResponse.usage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}