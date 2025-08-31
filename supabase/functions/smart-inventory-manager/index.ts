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
    const { productId, userId, analysisType = 'full' } = await req.json();

    console.log('Smart Inventory Manager - Processing:', { productId, userId, analysisType });

    // Récupérer les données produit et historique
    const productData = await getProductInventoryData(supabase, productId, userId);
    
    // Analyser la demande et les tendances
    const demandAnalysis = await analyzeDemandPatterns(productData);
    
    // Calculer les niveaux optimaux
    const inventoryOptimization = await calculateOptimalLevels(productData, demandAnalysis);
    
    // Générer des recommandations intelligentes
    const recommendations = await generateInventoryRecommendations(productData, demandAnalysis, inventoryOptimization);

    // Mettre à jour ou créer l'enregistrement d'inventaire intelligent
    const { data: smartInventory, error: upsertError } = await supabase
      .from('smart_inventory')
      .upsert({
        user_id: userId,
        product_id: productId,
        current_stock: productData.currentStock,
        optimal_stock: inventoryOptimization.optimalStock,
        minimum_threshold: inventoryOptimization.minimumThreshold,
        maximum_threshold: inventoryOptimization.maximumThreshold,
        reorder_point: inventoryOptimization.reorderPoint,
        reorder_quantity: inventoryOptimization.reorderQuantity,
        demand_forecast: demandAnalysis.forecast,
        seasonality_data: demandAnalysis.seasonality,
        supplier_performance: productData.supplierPerformance,
        cost_optimization: inventoryOptimization.costAnalysis,
        stock_risk_level: recommendations.riskLevel,
        next_reorder_prediction: recommendations.nextReorderDate,
        performance_metrics: {
          accuracy: demandAnalysis.accuracy,
          confidence: recommendations.confidence,
          lastAnalysis: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (upsertError) {
      throw new Error('Failed to save inventory analysis');
    }

    return new Response(JSON.stringify({
      success: true,
      currentStock: productData.currentStock,
      optimalLevels: inventoryOptimization,
      demandForecast: demandAnalysis.forecast,
      recommendations: recommendations,
      riskAssessment: {
        stockoutRisk: recommendations.stockoutRisk,
        overstockRisk: recommendations.overstockRisk,
        overall: recommendations.riskLevel
      },
      nextActions: recommendations.actions,
      inventoryId: smartInventory.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart inventory manager:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getProductInventoryData(supabase: any, productId: string, userId: string) {
  // Récupérer les données produit
  const { data: product } = await supabase
    .from('imported_products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  // Récupérer l'historique des commandes (simulé)
  const { data: orders } = await supabase
    .from('order_items')
    .select('*, orders!inner(*)')
    .eq('product_id', productId)
    .eq('orders.user_id', userId)
    .order('orders.created_at', { ascending: false })
    .limit(100);

  return {
    product,
    currentStock: product?.stock_quantity || 0,
    orderHistory: orders || [],
    supplierPerformance: {
      leadTime: 7, // jours
      reliability: 95, // %
      minOrderQty: 10
    }
  };
}

async function analyzeDemandPatterns(productData: any) {
  const prompt = `
Analysez les patterns de demande pour ce produit:

Historique des commandes: ${JSON.stringify(productData.orderHistory.slice(0, 20))}
Stock actuel: ${productData.currentStock}

Analysez:
1. Tendance de la demande (croissante/stable/décroissante)
2. Saisonnalité et cycles
3. Variabilité de la demande
4. Prédiction pour les 30 prochains jours

Répondez en JSON avec: 
{
  "trend": "string",
  "avgDemandPerDay": number,
  "seasonality": {...},
  "forecast": {
    "next7Days": number,
    "next30Days": number
  },
  "variability": "low|medium|high",
  "accuracy": number
}
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
          content: 'Tu es un expert en gestion de stock et prévision de demande. Analyse les patterns de vente et fournis des prédictions précises.' 
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
      trend: 'stable',
      avgDemandPerDay: 1,
      seasonality: {},
      forecast: {
        next7Days: 7,
        next30Days: 30
      },
      variability: 'medium',
      accuracy: 70
    };
  }
}

async function calculateOptimalLevels(productData: any, demandAnalysis: any) {
  const leadTime = productData.supplierPerformance.leadTime;
  const avgDemandPerDay = demandAnalysis.avgDemandPerDay;
  const demandVariability = demandAnalysis.variability === 'high' ? 2 : 
                           demandAnalysis.variability === 'medium' ? 1.5 : 1;

  // Calcul du stock de sécurité
  const safetyStock = Math.ceil(avgDemandPerDay * leadTime * demandVariability);
  
  // Point de réapprovisionnement
  const reorderPoint = Math.ceil((avgDemandPerDay * leadTime) + safetyStock);
  
  // Quantité de réapprovisionnement (EOQ simplifié)
  const reorderQuantity = Math.max(
    Math.ceil(avgDemandPerDay * 14), // 2 semaines de demande
    productData.supplierPerformance.minOrderQty
  );
  
  // Stock optimal (point de réappro + quantité de réappro)
  const optimalStock = reorderPoint + reorderQuantity;
  
  // Seuils
  const minimumThreshold = safetyStock;
  const maximumThreshold = optimalStock * 1.5;

  return {
    optimalStock: Math.ceil(optimalStock),
    minimumThreshold: Math.ceil(minimumThreshold),
    maximumThreshold: Math.ceil(maximumThreshold),
    reorderPoint: Math.ceil(reorderPoint),
    reorderQuantity: Math.ceil(reorderQuantity),
    safetyStock: Math.ceil(safetyStock),
    costAnalysis: {
      holdingCost: optimalStock * (productData.product?.cost_price || 0) * 0.02, // 2% par mois
      stockoutCost: avgDemandPerDay * (productData.product?.price || 0) * 0.1 // 10% de perte de vente
    }
  };
}

async function generateInventoryRecommendations(productData: any, demandAnalysis: any, optimization: any) {
  const currentStock = productData.currentStock;
  const reorderPoint = optimization.reorderPoint;
  const actions = [];
  
  // Calculer le risque de rupture
  const daysUntilStockout = currentStock / demandAnalysis.avgDemandPerDay;
  const stockoutRisk = daysUntilStockout < 7 ? 'high' : 
                      daysUntilStockout < 14 ? 'medium' : 'low';
  
  // Calculer le risque de surstock
  const overstockRatio = currentStock / optimization.optimalStock;
  const overstockRisk = overstockRatio > 1.5 ? 'high' :
                       overstockRatio > 1.2 ? 'medium' : 'low';
  
  // Générer des actions recommandées
  if (currentStock <= reorderPoint) {
    actions.push({
      type: 'reorder',
      priority: 'high',
      message: `Réapprovisionner ${optimization.reorderQuantity} unités`,
      quantity: optimization.reorderQuantity
    });
  }
  
  if (stockoutRisk === 'high') {
    actions.push({
      type: 'urgent_reorder',
      priority: 'critical',
      message: 'Risque de rupture élevé - commande urgente recommandée'
    });
  }
  
  if (overstockRisk === 'high') {
    actions.push({
      type: 'reduce_price',
      priority: 'medium',
      message: 'Surstock détecté - considérer une promotion'
    });
  }

  // Déterminer le niveau de risque global
  const riskLevel = stockoutRisk === 'high' || overstockRisk === 'high' ? 'high' :
                   stockoutRisk === 'medium' || overstockRisk === 'medium' ? 'medium' : 'low';

  // Prédire la prochaine date de réapprovisionnement
  const daysUntilReorder = Math.max(0, (currentStock - reorderPoint) / demandAnalysis.avgDemandPerDay);
  const nextReorderDate = new Date(Date.now() + daysUntilReorder * 24 * 60 * 60 * 1000);

  return {
    riskLevel,
    stockoutRisk,
    overstockRisk,
    actions,
    nextReorderDate: nextReorderDate.toISOString(),
    confidence: demandAnalysis.accuracy,
    daysUntilStockout: Math.ceil(daysUntilStockout),
    recommendations: actions.map(a => a.message)
  };
}