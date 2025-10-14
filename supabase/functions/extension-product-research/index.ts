import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { action, criteria } = await req.json();

    if (action === 'find_winners') {
      const {
        category,
        minProfitMargin = 20,
        maxCompetition = 5,
        minRating = 4.0,
        minOrders = 100
      } = criteria || {};

      // Rechercher dans le catalogue de produits
      let query = supabase
        .from('catalog_products')
        .select('*')
        .gte('rating', minRating)
        .gte('sales_count', minOrders);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: products, error: productsError } = await query.limit(100);

      if (productsError) {
        throw new Error('Error fetching products: ' + productsError.message);
      }

      // Analyser et scorer chaque produit
      const analyzedProducts = products.map(product => {
        const profitMargin = product.cost_price 
          ? ((product.price - product.cost_price) / product.price) * 100 
          : 30;

        const competitionScore = product.competition_score || 5;
        const trendScore = product.trend_score || 50;
        
        // Score de produit gagnant (0-100)
        const winnerScore = (
          (profitMargin / 100 * 30) +
          ((10 - competitionScore) / 10 * 25) +
          (product.rating / 5 * 20) +
          (trendScore / 100 * 15) +
          (Math.min(product.sales_count / 1000, 1) * 10)
        );

        return {
          ...product,
          analysis: {
            profit_margin: profitMargin,
            competition_level: competitionScore,
            trend_score: trendScore,
            winner_score: Math.round(winnerScore),
            estimated_monthly_revenue: product.price * product.sales_count,
            recommendation: winnerScore > 70 ? 'Excellent' : winnerScore > 50 ? 'Good' : 'Average'
          }
        };
      });

      // Filtrer selon les critères
      const winners = analyzedProducts
        .filter(p => 
          p.analysis.profit_margin >= minProfitMargin &&
          p.analysis.competition_level <= maxCompetition
        )
        .sort((a, b) => b.analysis.winner_score - a.analysis.winner_score)
        .slice(0, 50);

      // Logger la recherche
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'product_research',
        entity_type: 'catalog',
        description: `Found ${winners.length} winning products`,
        metadata: {
          criteria,
          total_analyzed: products.length,
          winners_found: winners.length
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          total_analyzed: products.length,
          winners_found: winners.length,
          products: winners,
          message: `Found ${winners.length} winning products matching your criteria`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'analyze_product') {
      const { productId } = criteria;

      const { data: product } = await supabase
        .from('catalog_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Analyse approfondie
      const analysis = {
        profit_potential: product.cost_price 
          ? ((product.price - product.cost_price) / product.price) * 100 
          : 30,
        market_demand: product.sales_count > 500 ? 'High' : product.sales_count > 100 ? 'Medium' : 'Low',
        competition_level: product.competition_score > 7 ? 'High' : product.competition_score > 4 ? 'Medium' : 'Low',
        trend_analysis: product.trend_score > 70 ? 'Rising' : product.trend_score > 40 ? 'Stable' : 'Declining',
        rating_quality: product.rating >= 4.5 ? 'Excellent' : product.rating >= 4.0 ? 'Good' : 'Average',
        estimated_monthly_sales: Math.round(product.sales_count / 6),
        estimated_monthly_revenue: Math.round(product.price * product.sales_count / 6),
        risks: [],
        opportunities: []
      };

      if (product.competition_score > 7) {
        analysis.risks.push('High competition in this niche');
      }
      if (product.rating < 4.0) {
        analysis.risks.push('Lower customer satisfaction');
      }
      if (product.trend_score < 40) {
        analysis.risks.push('Declining trend');
      }

      if (analysis.profit_potential > 40) {
        analysis.opportunities.push('High profit margin');
      }
      if (product.trend_score > 70) {
        analysis.opportunities.push('Rising trend - early opportunity');
      }
      if (product.competition_score < 4) {
        analysis.opportunities.push('Low competition niche');
      }

      return new Response(
        JSON.stringify({
          success: true,
          product,
          analysis
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
