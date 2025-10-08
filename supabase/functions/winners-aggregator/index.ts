import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WinnerProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  source: string;
  url: string;
  reviews?: number;
  rating?: number;
  sales?: number;
  trending_score: number;
  market_demand: number;
  final_score?: number;
  category?: string;
  tags?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { q, category = '', limit = 30, sources = ['trends', 'amazon'], min_score, max_price } = await req.json();

    console.log('Winners aggregator called:', { q, category, limit, sources, min_score, max_price });

    // Check cache first
    const cacheKey = `winners:${q}:${category}:${sources.join(',')}`;
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('Returning cached data');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from multiple sources in parallel
    const sourceCalls = [];
    
    if (sources.includes('trends')) {
      sourceCalls.push(
        supabase.functions.invoke('winners-trends', {
          body: { q, category, limit: Math.floor(limit / sources.length) }
        }).then(r => ({ source: 'trends', data: r.data }))
      );
    }
    
    if (sources.includes('amazon')) {
      sourceCalls.push(
        supabase.functions.invoke('winners-amazon', {
          body: { q, category, limit: Math.floor(limit / sources.length) }
        }).then(r => ({ source: 'amazon', data: r.data }))
      );
    }

    const results = await Promise.all(sourceCalls);
    console.log('Source results:', results.map(r => ({ source: r.source, count: r.data?.products?.length })));

    // Aggregate and score products
    let allProducts: WinnerProduct[] = [];
    const sourceStats: Record<string, any> = {};

    for (const result of results) {
      if (result.data?.products) {
        sourceStats[result.source] = {
          count: result.data.products.length,
          avgScore: result.data.products.reduce((sum: number, p: WinnerProduct) => sum + p.trending_score, 0) / result.data.products.length
        };
        allProducts = allProducts.concat(result.data.products);
      }
    }

    // Calculate final scores with AI-enhanced ranking
    allProducts = allProducts.map(p => {
      const baseScore = p.trending_score || 0;
      const demandScore = p.market_demand || 0;
      const socialScore = (p.reviews || 0) * 0.1 + (p.rating || 0) * 10;
      const priceScore = Math.max(0, 100 - (p.price / 10));
      
      const final_score = (
        baseScore * 0.4 +
        demandScore * 0.3 +
        socialScore * 0.2 +
        priceScore * 0.1
      );

      return { ...p, final_score };
    });

    // Filter by criteria
    allProducts = allProducts.filter(p => {
      if (min_score && (p.final_score || 0) < min_score) return false;
      if (max_price && p.price > max_price) return false;
      return true;
    });

    // Sort by final score and deduplicate
    allProducts.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    
    const uniqueProducts: WinnerProduct[] = [];
    const seenTitles = new Set<string>();
    
    for (const product of allProducts) {
      const normalizedTitle = product.title.toLowerCase().substring(0, 30);
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueProducts.push(product);
      }
    }

    const response = {
      products: uniqueProducts.slice(0, limit),
      meta: {
        total: uniqueProducts.length,
        sources_used: sources,
        query: q,
        category,
        timestamp: new Date().toISOString(),
        scoring_algorithm: 'ai_enhanced_v1'
      },
      stats: {
        avg_score: uniqueProducts.reduce((sum, p) => sum + (p.final_score || 0), 0) / uniqueProducts.length,
        total_sources: sources.length,
        products_per_source: Object.values(sourceStats).map((s: any) => s.count)
      },
      sources: sourceStats
    };

    // Cache for 5 minutes
    await supabase.from('api_cache').insert({
      cache_key: cacheKey,
      data: response,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });

    console.log('Returning aggregated data:', { totalProducts: response.products.length, avgScore: response.stats.avg_score });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Winners aggregator error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      products: [],
      meta: { total: 0, timestamp: new Date().toISOString() }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
