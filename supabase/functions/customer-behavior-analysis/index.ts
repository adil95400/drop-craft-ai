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

    // Calculate REAL customer metrics from database
    const customerMetrics = customers?.map(customer => {
      const customerOrders = orders?.filter(order => order.customer_id === customer.id) || [];
      const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const avgOrderValue = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0;
      
      // Calculate days since last order
      let daysSinceLastOrder = 999;
      if (customerOrders.length > 0) {
        const sortedOrders = customerOrders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        daysSinceLastOrder = Math.floor(
          (Date.now() - new Date(sortedOrders[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      
      // Calculate order frequency
      const customerLifetimeDays = Math.max(1, Math.floor(
        (Date.now() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ));
      const ordersPerDay = customerOrders.length / customerLifetimeDays;
      
      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent,
        avgOrderValue,
        daysSinceLastOrder,
        frequency: ordersPerDay,
        customerLifetimeDays
      };
    }) || [];

    // Calculate REAL behavioral scores and segments
    const totalCustomers = customerMetrics.length;
    
    // RFM Segmentation based on real data
    const champions = customerMetrics.filter(c => 
      c.orderCount >= 3 && c.daysSinceLastOrder < 30 && c.totalSpent > 100
    );
    const loyal = customerMetrics.filter(c => 
      c.orderCount >= 2 && c.daysSinceLastOrder < 60 && !champions.includes(c)
    );
    const atRisk = customerMetrics.filter(c => 
      c.orderCount >= 1 && c.daysSinceLastOrder >= 60 && c.daysSinceLastOrder < 120
    );
    const lost = customerMetrics.filter(c => 
      c.daysSinceLastOrder >= 120 || (c.orderCount === 0 && c.customerLifetimeDays > 90)
    );

    // Calculate REAL LTV from actual data
    const avgLTV = totalCustomers > 0 
      ? customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers 
      : 0;

    // Identify high-risk churn customers
    const highRiskCustomers = customerMetrics.filter(c => 
      (c.daysSinceLastOrder > 45 && c.orderCount > 0) ||
      (c.frequency < 0.01 && c.orderCount === 1)
    );

    // Generate personalized recommendations based on REAL data
    const recommendations = customerMetrics
      .filter(c => c.daysSinceLastOrder > 30 && c.orderCount > 0)
      .slice(0, 10)
      .map(c => ({
        customer_id: c.id,
        customer_email: c.email,
        recommendation: c.daysSinceLastOrder > 90 
          ? `Campagne de réactivation urgente - ${c.daysSinceLastOrder} jours sans achat`
          : c.avgOrderValue > avgLTV * 1.5
            ? `Client haute valeur - Offrir programme VIP`
            : `Email de rappel avec offre personnalisée`,
        priority: c.daysSinceLastOrder > 90 ? 'high' : c.totalSpent > avgLTV ? 'medium' : 'low'
      }));

    // Build REAL analysis result (no AI needed for basic analytics)
    const realAnalysis = {
      customer_segments: {
        champions: { 
          count: champions.length, 
          characteristics: `${champions.length} clients avec 3+ commandes, actifs (<30j), dépenses >100€`,
          percentage: totalCustomers > 0 ? Math.round((champions.length / totalCustomers) * 100) : 0
        },
        loyal: { 
          count: loyal.length, 
          characteristics: `${loyal.length} clients avec 2+ commandes, actifs (<60j)`,
          percentage: totalCustomers > 0 ? Math.round((loyal.length / totalCustomers) * 100) : 0
        },
        at_risk: { 
          count: atRisk.length, 
          characteristics: `${atRisk.length} clients inactifs depuis 60-120 jours`,
          percentage: totalCustomers > 0 ? Math.round((atRisk.length / totalCustomers) * 100) : 0
        },
        lost: { 
          count: lost.length, 
          characteristics: `${lost.length} clients inactifs 120+ jours ou sans achat`,
          percentage: totalCustomers > 0 ? Math.round((lost.length / totalCustomers) * 100) : 0
        }
      },
      behavioral_insights: {
        purchase_patterns: totalCustomers > 0 
          ? `Moyenne de ${(customerMetrics.reduce((s, c) => s + c.orderCount, 0) / totalCustomers).toFixed(1)} commandes/client`
          : 'Aucune donnée disponible',
        avg_order_value: avgLTV > 0 
          ? `${avgLTV.toFixed(2)}€ panier moyen`
          : 'Aucune commande',
        retention_rate: totalCustomers > 0 
          ? `${Math.round(((champions.length + loyal.length) / totalCustomers) * 100)}% de clients actifs`
          : '0%'
      },
      churn_analysis: {
        high_risk_customers: highRiskCustomers.length,
        churn_indicators: [
          'Inactivité supérieure à 45 jours',
          'Une seule commande et fréquence faible',
          'Baisse du panier moyen sur les dernières commandes'
        ],
        retention_strategies: [
          'Campagnes email personnalisées pour clients à risque',
          'Programme de fidélité pour augmenter la rétention',
          'Offres exclusives pour réactiver les clients perdus'
        ]
      },
      personalized_recommendations: recommendations,
      ltv_analysis: {
        average_ltv: Math.round(avgLTV * 100) / 100,
        total_revenue: customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0),
        top_value_segment: champions.length > 0 ? 'Champions' : loyal.length > 0 ? 'Loyal' : 'New',
        growth_opportunities: [
          atRisk.length > 5 ? `Réactiver ${atRisk.length} clients à risque` : null,
          champions.length > 0 ? `Programme VIP pour ${champions.length} champions` : null,
          'Augmenter le panier moyen avec des offres groupées'
        ].filter(Boolean)
      }
    };

    console.log('[CUSTOMER-BEHAVIOR] Analysis completed with real data');

    // Calculate REAL behavioral score based on actual metrics
    const behavioralScore = totalCustomers > 0 
      ? Math.round(
          ((champions.length + loyal.length) / totalCustomers) * 50 + // 50% weight on active customers
          Math.min(50, avgLTV / 10) // 50% weight on LTV (capped at 50)
        )
      : 0;

    // Calculate REAL churn probability
    const churnProbability = totalCustomers > 0
      ? Math.round(((atRisk.length + lost.length) / totalCustomers) * 100)
      : 0;

    // Store results with REAL metrics
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
        analysis_data: realAnalysis,
        behavioral_score: behavioralScore,
        lifetime_value: avgLTV,
        churn_probability: churnProbability,
        recommendations: recommendations
      })
      .select()
      .single();

    console.log('[CUSTOMER-BEHAVIOR] Results saved', { id: savedAnalysis?.id });

    return new Response(JSON.stringify({
      success: true,
      analysis: realAnalysis,
      analysisId: savedAnalysis?.id,
      metrics: {
        total_customers: totalCustomers,
        behavioral_score: behavioralScore,
        churn_probability: churnProbability,
        average_ltv: avgLTV
      }
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
