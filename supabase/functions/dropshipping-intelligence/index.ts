import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, productId, data } = await req.json();
    console.log(`[dropshipping-intelligence] Action: ${action}, User: ${user.id}`);

    switch (action) {
      case 'analyze_stock': {
        // Analyser l'historique des ventes et prédire les ruptures
        const result = await analyzeStockPredictions(supabase, user.id, productId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_predictions': {
        // Récupérer les prédictions existantes
        const { data: predictions, error } = await supabase
          .from('stock_predictions')
          .select(`
            *,
            products:product_id (id, title, sku, stock_quantity, price)
          `)
          .eq('user_id', user.id)
          .order('days_until_stockout', { ascending: true });

        if (error) throw error;
        return new Response(JSON.stringify({ predictions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_alerts': {
        // Récupérer les alertes
        const { data: alerts, error } = await supabase
          .from('stock_alerts')
          .select(`
            *,
            products:product_id (id, title, sku)
          `)
          .eq('user_id', user.id)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return new Response(JSON.stringify({ alerts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'dismiss_alert': {
        const { alertId } = data;
        const { error } = await supabase
          .from('stock_alerts')
          .update({ is_dismissed: true })
          .eq('id', alertId)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'optimize_prices': {
        // Analyser et optimiser les prix
        const result = await optimizePrices(supabase, user.id, productId);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_optimizations': {
        const { data: optimizations, error } = await supabase
          .from('price_optimizations')
          .select(`
            *,
            products:product_id (id, title, sku, price, compare_at_price)
          `)
          .eq('user_id', user.id)
          .in('status', ['pending', 'applied'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ optimizations }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'apply_optimization': {
        const { optimizationId } = data;
        
        // Récupérer l'optimisation
        const { data: opt, error: optError } = await supabase
          .from('price_optimizations')
          .select('*')
          .eq('id', optimizationId)
          .eq('user_id', user.id)
          .single();

        if (optError || !opt) throw new Error('Optimisation non trouvée');

        // Appliquer le nouveau prix
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            price: opt.suggested_price,
            compare_at_price: opt.original_price 
          })
          .eq('id', opt.product_id)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Marquer comme appliqué
        await supabase
          .from('price_optimizations')
          .update({ status: 'applied', applied_at: new Date().toISOString() })
          .eq('id', optimizationId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create_ab_test': {
        const { productId: pId, variantAPrice, variantBPrice, testName } = data;
        
        const { data: test, error } = await supabase
          .from('price_ab_tests')
          .insert({
            user_id: user.id,
            product_id: pId,
            test_name: testName || `Test A/B - ${new Date().toLocaleDateString('fr-FR')}`,
            variant_a_price: variantAPrice,
            variant_b_price: variantBPrice,
            status: 'draft'
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ test }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_ab_tests': {
        const { data: tests, error } = await supabase
          .from('price_ab_tests')
          .select(`
            *,
            products:product_id (id, title, sku, price)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify({ tests }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'start_ab_test': {
        const { testId } = data;
        const { error } = await supabase
          .from('price_ab_tests')
          .update({ 
            status: 'running', 
            started_at: new Date().toISOString() 
          })
          .eq('id', testId)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stop_ab_test': {
        const { testId } = data;
        
        // Récupérer le test
        const { data: test, error: fetchError } = await supabase
          .from('price_ab_tests')
          .select('*')
          .eq('id', testId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !test) throw new Error('Test non trouvé');

        // Déterminer le gagnant
        const crA = test.variant_a_views > 0 ? test.variant_a_conversions / test.variant_a_views : 0;
        const crB = test.variant_b_views > 0 ? test.variant_b_conversions / test.variant_b_views : 0;
        const winner = crA > crB ? 'A' : crB > crA ? 'B' : null;

        const { error } = await supabase
          .from('price_ab_tests')
          .update({ 
            status: 'completed', 
            ended_at: new Date().toISOString(),
            winner 
          })
          .eq('id', testId);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, winner }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_settings': {
        let { data: settings } = await supabase
          .from('price_optimization_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!settings) {
          // Créer les paramètres par défaut
          const { data: newSettings } = await supabase
            .from('price_optimization_settings')
            .insert({ user_id: user.id })
            .select()
            .single();
          settings = newSettings;
        }

        return new Response(JSON.stringify({ settings }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_settings': {
        const { settings } = data;
        const { error } = await supabase
          .from('price_optimization_settings')
          .upsert({ 
            ...settings, 
            user_id: user.id,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Action non reconnue' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[dropshipping-intelligence] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Analyser les prédictions de stock
async function analyzeStockPredictions(supabase: any, userId: string, productId?: string) {
  console.log('[analyzeStockPredictions] Starting analysis for user:', userId);

  // Récupérer les produits à analyser
  let query = supabase
    .from('products')
    .select('id, title, sku, stock_quantity, price, cost_price')
    .eq('user_id', userId);

  if (productId) {
    query = query.eq('id', productId);
  }

  const { data: products, error: productsError } = await query;
  if (productsError) throw productsError;

  const predictions = [];
  const alerts = [];

  for (const product of products || []) {
    // Récupérer l'historique des ventes (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: salesData } = await supabase
      .from('sales_history')
      .select('*')
      .eq('product_id', product.id)
      .gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('sale_date', { ascending: true });

    // Calculer les métriques
    const totalSold = salesData?.reduce((sum: number, s: any) => sum + s.quantity_sold, 0) || 0;
    const avgDailySales = salesData?.length ? totalSold / 30 : 0;
    
    // Déterminer la tendance
    let salesTrend = 'stable';
    if (salesData?.length >= 7) {
      const firstWeek = salesData.slice(0, 7).reduce((sum: number, s: any) => sum + s.quantity_sold, 0);
      const lastWeek = salesData.slice(-7).reduce((sum: number, s: any) => sum + s.quantity_sold, 0);
      if (lastWeek > firstWeek * 1.2) salesTrend = 'increasing';
      else if (lastWeek < firstWeek * 0.8) salesTrend = 'decreasing';
    }

    // Prédire la date de rupture
    const currentStock = product.stock_quantity || 0;
    const daysUntilStockout = avgDailySales > 0 ? Math.floor(currentStock / avgDailySales) : 999;
    const stockoutDate = new Date();
    stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);

    // Recommandation de réapprovisionnement
    const safetyStock = Math.ceil(avgDailySales * 7); // 7 jours de sécurité
    const reorderQty = Math.ceil(avgDailySales * 30) + safetyStock; // 30 jours + sécurité
    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysUntilStockout - 14)); // 14 jours avant rupture

    // Score de confiance basé sur les données disponibles
    const confidenceScore = Math.min(100, (salesData?.length || 0) * 3);

    // Upsert la prédiction
    const { data: prediction, error: predError } = await supabase
      .from('stock_predictions')
      .upsert({
        user_id: userId,
        product_id: product.id,
        current_stock: currentStock,
        predicted_stockout_date: daysUntilStockout < 999 ? stockoutDate.toISOString().split('T')[0] : null,
        days_until_stockout: daysUntilStockout < 999 ? daysUntilStockout : null,
        average_daily_sales: avgDailySales,
        sales_trend: salesTrend,
        confidence_score: confidenceScore,
        recommended_reorder_qty: reorderQty,
        recommended_reorder_date: reorderDate.toISOString().split('T')[0],
        last_analyzed_at: new Date().toISOString()
      }, { onConflict: 'user_id,product_id' })
      .select()
      .single();

    if (!predError) predictions.push(prediction);

    // Créer des alertes si nécessaire
    if (daysUntilStockout <= 3 && daysUntilStockout >= 0) {
      alerts.push({
        user_id: userId,
        product_id: product.id,
        prediction_id: prediction?.id,
        alert_type: 'stockout',
        alert_level: 'critical',
        title: `Rupture imminente: ${product.title}`,
        message: `Stock actuel: ${currentStock}. Rupture estimée dans ${daysUntilStockout} jour(s).`,
        days_until_stockout: daysUntilStockout
      });
    } else if (daysUntilStockout <= 7) {
      alerts.push({
        user_id: userId,
        product_id: product.id,
        prediction_id: prediction?.id,
        alert_type: 'low_stock',
        alert_level: 'high',
        title: `Stock faible: ${product.title}`,
        message: `Réapprovisionnement recommandé. ${daysUntilStockout} jours de stock restant.`,
        days_until_stockout: daysUntilStockout
      });
    } else if (daysUntilStockout <= 14) {
      alerts.push({
        user_id: userId,
        product_id: product.id,
        prediction_id: prediction?.id,
        alert_type: 'reorder_soon',
        alert_level: 'medium',
        title: `Réapprovisionnement à prévoir: ${product.title}`,
        message: `Pensez à commander. ${daysUntilStockout} jours de stock restant.`,
        days_until_stockout: daysUntilStockout
      });
    }
  }

  // Insérer les alertes
  if (alerts.length > 0) {
    await supabase.from('stock_alerts').insert(alerts);
  }

  console.log(`[analyzeStockPredictions] Generated ${predictions.length} predictions and ${alerts.length} alerts`);
  return { predictions, alerts, analyzed: products?.length || 0 };
}

// Optimiser les prix
async function optimizePrices(supabase: any, userId: string, productId?: string) {
  console.log('[optimizePrices] Starting optimization for user:', userId);

  // Récupérer les paramètres
  const { data: settings } = await supabase
    .from('price_optimization_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  const minMargin = settings?.min_margin_percent || 15;
  const maxMargin = settings?.max_margin_percent || 50;
  const targetMargin = settings?.target_margin_percent || 30;

  // Récupérer les produits
  let query = supabase
    .from('products')
    .select('id, title, sku, price, cost_price, compare_at_price, stock_quantity')
    .eq('user_id', userId)
    .not('cost_price', 'is', null);

  if (productId) {
    query = query.eq('id', productId);
  }

  const { data: products, error: productsError } = await query;
  if (productsError) throw productsError;

  const optimizations = [];

  for (const product of products || []) {
    const costPrice = product.cost_price || 0;
    const currentPrice = product.price || 0;
    const currentMargin = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;

    // Récupérer l'historique des ventes
    const { data: salesData } = await supabase
      .from('sales_history')
      .select('quantity_sold, revenue')
      .eq('product_id', product.id)
      .order('sale_date', { ascending: false })
      .limit(30);

    // Score de demande (basé sur les ventes récentes)
    const totalSold = salesData?.reduce((sum: number, s: any) => sum + s.quantity_sold, 0) || 0;
    const demandScore = Math.min(100, totalSold * 5);

    // Récupérer les prix concurrentiels
    const { data: competitorData } = await supabase
      .from('competitor_prices')
      .select('competitor_price')
      .eq('product_id', product.id)
      .order('last_checked_at', { ascending: false })
      .limit(5);

    const avgCompetitorPrice = competitorData?.length
      ? competitorData.reduce((sum: number, c: any) => sum + c.competitor_price, 0) / competitorData.length
      : null;

    // Score de compétition
    let competitionScore = 50;
    if (avgCompetitorPrice) {
      competitionScore = currentPrice <= avgCompetitorPrice ? 70 : 30;
    }

    // Calculer le prix suggéré
    let suggestedPrice = costPrice * (1 + targetMargin / 100);
    let reason = 'Optimisation vers la marge cible';

    // Ajuster selon la demande
    if (demandScore > 70) {
      suggestedPrice = Math.min(suggestedPrice * 1.1, costPrice * (1 + maxMargin / 100));
      reason = 'Forte demande - prix augmenté';
    } else if (demandScore < 30 && currentMargin > minMargin) {
      suggestedPrice = Math.max(suggestedPrice * 0.95, costPrice * (1 + minMargin / 100));
      reason = 'Faible demande - prix réduit pour stimuler les ventes';
    }

    // Ajuster selon la concurrence
    if (avgCompetitorPrice && suggestedPrice > avgCompetitorPrice * 1.1) {
      suggestedPrice = avgCompetitorPrice * 1.05;
      reason = 'Alignement concurrentiel';
    }

    suggestedPrice = Math.round(suggestedPrice * 100) / 100;
    const suggestedMargin = costPrice > 0 ? ((suggestedPrice - costPrice) / costPrice) * 100 : 0;

    // Créer l'optimisation si le changement est significatif
    if (Math.abs(suggestedPrice - currentPrice) > 0.5) {
      const { data: opt } = await supabase
        .from('price_optimizations')
        .insert({
          user_id: userId,
          product_id: product.id,
          original_price: currentPrice,
          suggested_price: suggestedPrice,
          current_price: currentPrice,
          original_margin_percent: currentMargin,
          suggested_margin_percent: suggestedMargin,
          optimization_reason: reason,
          demand_score: demandScore,
          competition_score: competitionScore,
          confidence_score: Math.round((demandScore + competitionScore) / 2),
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .single();

      if (opt) optimizations.push(opt);
    }
  }

  console.log(`[optimizePrices] Generated ${optimizations.length} optimizations`);
  return { optimizations, analyzed: products?.length || 0 };
}
