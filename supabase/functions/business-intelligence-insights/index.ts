import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { userId, analysisType = 'full', timeRange = '30d' } = await req.json();

    console.log('Business Intelligence Insights - Generating for user:', { userId, analysisType, timeRange });

    // Récupérer les données business
    const businessData = await gatherBusinessData(supabase, userId, timeRange);
    
    // Générer les insights IA
    const insights = await generateAIInsights(businessData);
    
    // Identifier les anomalies
    const anomalies = await detectAnomalies(businessData);
    
    // Créer des recommandations d'optimisation
    const optimizations = await generateOptimizationRecommendations(businessData, insights);

    // Sauvegarder tous les insights générés
    const savedInsights = [];
    for (const insight of [...insights, ...anomalies, ...optimizations]) {
      const { data: savedInsight, error } = await supabase
        .from('business_intelligence_insights')
        .insert({
          user_id: userId,
          insight_type: insight.type,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          confidence_score: insight.confidence,
          impact_score: insight.impact,
          actionable_recommendations: insight.recommendations || [],
          supporting_data: insight.supportingData || {},
          ai_analysis: insight.aiAnalysis || {},
          priority: insight.priority || 5,
          expires_at: insight.expiresAt
        })
        .select()
        .single();

      if (!error) {
        savedInsights.push(savedInsight);
      }
    }

    // Générer un rapport consolidé
    const consolidatedReport = await generateConsolidatedReport(businessData, insights, anomalies, optimizations);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalInsights: savedInsights.length,
        criticalIssues: savedInsights.filter(i => i.severity === 'critical').length,
        opportunities: savedInsights.filter(i => i.severity === 'opportunity').length,
        averageConfidence: savedInsights.reduce((acc, i) => acc + i.confidence_score, 0) / savedInsights.length
      },
      insights: savedInsights,
      report: consolidatedReport,
      businessMetrics: businessData.metrics,
      lastAnalysis: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in business intelligence insights:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gatherBusinessData(supabase: any, userId: string, timeRange: string) {
  // Calculer la date de début basée sur timeRange
  const daysBack = parseInt(timeRange.replace('d', ''));
  const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  // Récupérer les ventes
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());

  // Récupérer les produits
  const { data: products } = await supabase
    .from('imported_products')
    .select('*')
    .eq('user_id', userId);

  // Récupérer les clients
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId);

  // Récupérer les inventaires
  const { data: inventory } = await supabase
    .from('smart_inventory')
    .select('*')
    .eq('user_id', userId);

  // Calculer les métriques
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0;
  const totalProducts = products?.length || 0;
  const activeCustomers = customers?.filter(c => c.status === 'active').length || 0;

  return {
    orders: orders || [],
    products: products || [],
    customers: customers || [],
    inventory: inventory || [],
    timeRange,
    metrics: {
      totalRevenue,
      totalOrders: orders?.length || 0,
      avgOrderValue,
      totalProducts,
      activeCustomers,
      conversionRate: activeCustomers / totalProducts * 100
    }
  };
}

async function generateAIInsights(businessData: any) {
  const prompt = `
Analysez ces données business e-commerce et identifiez les insights stratégiques:

Métriques: ${JSON.stringify(businessData.metrics)}
Nombre de commandes: ${businessData.orders.length}
Nombre de produits: ${businessData.products.length}
Période: ${businessData.timeRange}

Identifiez 3-5 insights principaux sur:
1. Performance des ventes
2. Comportement clients
3. Performance produits
4. Opportunités de croissance

Pour chaque insight, fournissez: type, category, title, description, severity, confidence (0-100), impact (0-100), recommendations[]

Répondez en JSON array d'insights.
`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un expert en business intelligence e-commerce. Analyse les données et identifie des insights actionnables précis.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1500,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content) || [];
  } catch {
    return [{
      type: 'trend',
      category: 'sales',
      title: 'Analyse des ventes',
      description: `Chiffre d'affaires de ${businessData.metrics.totalRevenue}€ sur ${businessData.timeRange}`,
      severity: 'info',
      confidence: 70,
      impact: 50,
      recommendations: ['Analyser en détail les données']
    }];
  }
}

async function detectAnomalies(businessData: any) {
  const anomalies = [];

  // Détecter les anomalies dans les ventes
  if (businessData.orders.length > 0) {
    const recentOrders = businessData.orders.slice(0, 7);
    const olderOrders = businessData.orders.slice(7, 14);
    
    const recentAvg = recentOrders.reduce((sum, o) => sum + o.total_amount, 0) / recentOrders.length;
    const olderAvg = olderOrders.length > 0 ? olderOrders.reduce((sum, o) => sum + o.total_amount, 0) / olderOrders.length : recentAvg;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (Math.abs(change) > 20) {
      anomalies.push({
        type: 'anomaly',
        category: 'sales',
        title: change > 0 ? 'Pic de ventes détecté' : 'Chute de ventes détectée',
        description: `Variation de ${change.toFixed(1)}% dans la valeur moyenne des commandes`,
        severity: Math.abs(change) > 50 ? 'critical' : 'warning',
        confidence: 85,
        impact: Math.min(Math.abs(change), 100),
        recommendations: [
          change > 0 ? 'Analyser les facteurs de succès' : 'Identifier les causes de la baisse',
          'Ajuster la stratégie marketing'
        ],
        supportingData: { recentAvg, olderAvg, change }
      });
    }
  }

  // Détecter les problèmes d'inventaire
  const lowStockProducts = businessData.inventory.filter(i => i.stock_risk_level === 'high');
  if (lowStockProducts.length > 0) {
    anomalies.push({
      type: 'risk',
      category: 'inventory',
      title: 'Risques de rupture de stock',
      description: `${lowStockProducts.length} produits présentent un risque élevé de rupture`,
      severity: 'warning',
      confidence: 90,
      impact: 75,
      recommendations: [
        'Réapprovisionner immédiatement',
        'Revoir les seuils de sécurité'
      ],
      supportingData: { affectedProducts: lowStockProducts.length }
    });
  }

  return anomalies;
}

async function generateOptimizationRecommendations(businessData: any, insights: any[]) {
  const optimizations = [];

  // Optimisation des prix
  if (businessData.metrics.avgOrderValue < 50) {
    optimizations.push({
      type: 'opportunity',
      category: 'financial',
      title: 'Opportunité d\'augmentation du panier moyen',
      description: `Panier moyen actuel: ${businessData.metrics.avgOrderValue.toFixed(2)}€`,
      severity: 'opportunity',
      confidence: 80,
      impact: 60,
      recommendations: [
        'Mettre en place des ventes croisées',
        'Offrir la livraison gratuite à partir d\'un seuil',
        'Créer des bundles de produits'
      ]
    });
  }

  // Optimisation produits
  const totalProducts = businessData.products.length;
  if (totalProducts > 0 && businessData.metrics.conversionRate < 5) {
    optimizations.push({
      type: 'opportunity',
      category: 'marketing',
      title: 'Amélioration du taux de conversion',
      description: `Taux de conversion actuel: ${businessData.metrics.conversionRate.toFixed(1)}%`,
      severity: 'opportunity',
      confidence: 75,
      impact: 70,
      recommendations: [
        'Optimiser les descriptions produits',
        'Améliorer les images produits',
        'Revoir la stratégie de prix'
      ]
    });
  }

  return optimizations;
}

async function generateConsolidatedReport(businessData: any, insights: any[], anomalies: any[], optimizations: any[]) {
  const prompt = `
Créez un rapport consolidé d'intelligence d'affaires basé sur:

Données business: ${JSON.stringify(businessData.metrics)}
Insights: ${insights.length} identifiés
Anomalies: ${anomalies.length} détectées  
Opportunités: ${optimizations.length} identifiées

Générez un rapport exécutif avec:
1. Résumé exécutif
2. Points clés d'attention
3. Recommandations prioritaires
4. Prochaines étapes

Répondez en JSON avec: executiveSummary, keyPoints[], priorityRecommendations[], nextSteps[]
`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-nano',
      messages: [
        { 
          role: 'system', 
          content: 'Tu es un consultant en stratégie e-commerce. Crée un rapport concis et actionnable.' 
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
      executiveSummary: 'Analyse complète des performances business réalisée',
      keyPoints: ['Performance analysée', 'Recommandations générées'],
      priorityRecommendations: ['Suivre les insights générés'],
      nextSteps: ['Implémenter les recommandations']
    };
  }
}