import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, filters = {}, limit = 50, include_intelligence = true, sort_by = 'ai_score' } = await req.json();

    console.log('[WINNING-PRODUCTS-AGGREGATOR] Request:', { action, filters, limit, sort_by });

    if (action === 'get_top_winners') {
      // Check cache first
      const cacheKey = `top_winners:${JSON.stringify(filters)}:${limit}:${sort_by}`;
      const { data: cached } = await supabaseClient
        .from('api_cache')
        .select('data')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached?.data) {
        console.log('[WINNING-PRODUCTS-AGGREGATOR] Cache hit');
        return new Response(
          JSON.stringify(cached.data),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Fetch from winner_products table
      let query = supabaseClient
        .from('winner_products')
        .select('*');

      // Apply filters
      if (filters.category) {
        query = query.ilike('product_name', `%${filters.category}%`);
      }
      if (filters.minScore) {
        query = query.gte('virality_score', filters.minScore);
      }
      if (filters.maxRisk) {
        const riskLevels = { 'low': ['low'], 'medium': ['low', 'medium'], 'high': ['low', 'medium', 'high'] };
        query = query.in('competition_level', riskLevels[filters.maxRisk] || ['low', 'medium', 'high']);
      }
      if (filters.priceRange) {
        if (filters.priceRange.min) query = query.gte('price', filters.priceRange.min);
        if (filters.priceRange.max) query = query.lte('price', filters.priceRange.max);
      }
      if (filters.socialTrending) {
        query = query.gte('trending_score', 70);
      }

      // Apply sorting
      const sortColumn = sort_by === 'ai_score' ? 'virality_score' : sort_by;
      query = query.order(sortColumn, { ascending: false }).limit(limit);

      const { data: products, error } = await query;

      if (error) {
        console.error('[WINNING-PRODUCTS-AGGREGATOR] Query error:', error);
        throw error;
      }

      // Enhance with intelligence data if requested
      let enrichedProducts = products || [];
      
      if (include_intelligence && enrichedProducts.length > 0) {
        enrichedProducts = enrichedProducts.map(product => ({
          ...product,
          product_id: product.id,
          name: product.product_name,
          ai_score: product.virality_score,
          profit_potential: product.estimated_profit_margin,
          risk_level: product.competition_level,
          market_demand: product.trending_score,
          competition_level: product.orders_count / 10000,
          saturation_score: product.competition_level === 'high' ? 80 : product.competition_level === 'medium' ? 50 : 20,
          trend_momentum: product.trending_score,
          social_proof: product.social_proof || {},
          projected_roi: product.estimated_profit_margin * 2,
          estimated_daily_sales: Math.floor(product.orders_count / 30),
          break_even_point: 100,
          market_opportunity_size: product.engagement_count,
          competitor_count: product.competitor_analysis?.competitor_count || 0,
          price_positioning: product.price < 30 ? 'budget' : product.price < 80 ? 'mid' : 'premium',
          differentiation_score: product.virality_score,
          recommended_actions: product.detection_signals || [],
          optimal_launch_timing: 'immediate',
          suggested_pricing: {
            min: product.price * 0.8,
            optimal: product.price,
            max: product.price * 1.3
          },
          last_analyzed: product.detected_at || new Date().toISOString(),
          data_sources: [product.source_platform],
          confidence_level: 95
        }));
      }

      const response = {
        success: true,
        products: enrichedProducts,
        meta: {
          total: enrichedProducts.length,
          filters_applied: filters,
          sort_by,
          timestamp: new Date().toISOString()
        }
      };

      // Cache the response
      await supabaseClient
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          data: response,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });

      console.log('[WINNING-PRODUCTS-AGGREGATOR] Success:', enrichedProducts.length, 'products');

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Unknown action: ' + action);

  } catch (error) {
    console.error('[WINNING-PRODUCTS-AGGREGATOR] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
