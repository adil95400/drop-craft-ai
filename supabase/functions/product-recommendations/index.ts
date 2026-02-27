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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { action, data: reqData } = await req.json();

    if (action === 'generate_recommendations') {
      // Get user's products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category, price, stock_quantity, profit_margin, description')
        .eq('user_id', user.id)
        .limit(200);

      if (!products || products.length < 2) {
        return new Response(JSON.stringify({ recommendations: [], message: 'Pas assez de produits' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get order history for collaborative filtering
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_items(product_id, quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Build co-purchase matrix
      const coMatrix: Record<string, Record<string, number>> = {};
      for (const order of orders || []) {
        const items = (order as any).order_items || [];
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i].product_id;
            const b = items[j].product_id;
            if (!a || !b) continue;
            if (!coMatrix[a]) coMatrix[a] = {};
            if (!coMatrix[b]) coMatrix[b] = {};
            coMatrix[a][b] = (coMatrix[a][b] || 0) + 1;
            coMatrix[b][a] = (coMatrix[b][a] || 0) + 1;
          }
        }
      }

      // Use AI to generate smart recommendations
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      const productSummary = products.slice(0, 50).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock_quantity,
        margin: p.profit_margin,
      }));

      const topCoPurchases = Object.entries(coMatrix)
        .flatMap(([pid, assoc]) =>
          Object.entries(assoc).map(([aid, count]) => ({ product: pid, associated: aid, count }))
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      let aiRecommendations: any[] = [];
      
      if (LOVABLE_API_KEY) {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5-mini',
            messages: [
              {
                role: 'system',
                content: `You are a product recommendation engine. Analyze product data and co-purchase patterns to generate cross-sell and upsell recommendations. Return JSON only.`
              },
              {
                role: 'user',
                content: `Analyze these products and co-purchase patterns to generate recommendations:

Products: ${JSON.stringify(productSummary)}

Co-purchase patterns: ${JSON.stringify(topCoPurchases)}

Generate recommendations in this format. Return a JSON object with a "recommendations" array:
{
  "recommendations": [
    {
      "source_product_id": "product_id",
      "target_product_id": "recommended_product_id",
      "strategy": "cross_sell|upsell|bundle|similar",
      "title": "Short recommendation title in French",
      "description": "Why this recommendation in French",
      "confidence_score": 0.0-1.0,
      "estimated_revenue_impact": number
    }
  ]
}

Generate 5-10 high-quality recommendations focusing on:
1. Frequently bought together (from co-purchase data)
2. Category-based cross-sell
3. Price-tier upsell (suggest higher-margin alternatives)
4. Bundle opportunities`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'generate_recommendations',
                description: 'Generate product recommendations',
                parameters: {
                  type: 'object',
                  properties: {
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          source_product_id: { type: 'string' },
                          target_product_id: { type: 'string' },
                          strategy: { type: 'string', enum: ['cross_sell', 'upsell', 'bundle', 'similar'] },
                          title: { type: 'string' },
                          description: { type: 'string' },
                          confidence_score: { type: 'number' },
                          estimated_revenue_impact: { type: 'number' }
                        },
                        required: ['source_product_id', 'target_product_id', 'strategy', 'title', 'description', 'confidence_score']
                      }
                    }
                  },
                  required: ['recommendations']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'generate_recommendations' } }
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const parsed = JSON.parse(toolCall.function.arguments);
            aiRecommendations = parsed.recommendations || [];
          }
        }
      }

      // Fallback: category-based recommendations if AI fails
      if (aiRecommendations.length === 0) {
        const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
        for (const cat of categories.slice(0, 3)) {
          const catProducts = products.filter(p => p.category === cat);
          if (catProducts.length >= 2) {
            const sorted = catProducts.sort((a, b) => (b.profit_margin || 0) - (a.profit_margin || 0));
            aiRecommendations.push({
              source_product_id: sorted[sorted.length - 1].id,
              target_product_id: sorted[0].id,
              strategy: 'upsell',
              title: `Upsell ${cat}`,
              description: `Produit à marge supérieure dans ${cat}`,
              confidence_score: 0.7,
              estimated_revenue_impact: (sorted[0].price - sorted[sorted.length - 1].price)
            });
          }
        }
      }

      // Save valid recommendations to ai_recommendations
      const validProductIds = new Set(products.map(p => p.id));
      const validRecs = aiRecommendations.filter(
        r => validProductIds.has(r.source_product_id) && validProductIds.has(r.target_product_id)
      );

      for (const rec of validRecs) {
        await supabase.from('ai_recommendations').upsert({
          user_id: user.id,
          recommendation_type: rec.strategy,
          title: rec.title,
          description: rec.description,
          confidence_score: rec.confidence_score,
          source_product_id: rec.source_product_id,
          target_product_id: rec.target_product_id,
          impact_value: rec.estimated_revenue_impact || 0,
          status: 'pending',
          metadata: { strategy: rec.strategy }
        }, { onConflict: 'id' });
      }

      // Also save co-purchase associations
      for (const pair of topCoPurchases.slice(0, 50)) {
        if (validProductIds.has(pair.product) && validProductIds.has(pair.associated)) {
          await supabase.from('product_associations' as any).upsert({
            user_id: user.id,
            product_id: pair.product,
            associated_product_id: pair.associated,
            association_type: 'frequently_bought_together',
            score: Math.min(pair.count / 10, 1),
            co_purchase_count: pair.count,
          }, { onConflict: 'user_id,product_id,associated_product_id,association_type' });
        }
      }

      return new Response(JSON.stringify({ 
        recommendations: validRecs,
        co_purchases: topCoPurchases.length,
        total_products_analyzed: products.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_stats') {
      // Get recommendation performance stats
      const { data: events } = await supabase
        .from('recommendation_events' as any)
        .select('event_type, strategy, created_at')
        .eq('user_id', user.id);

      const stats = {
        impressions: 0, clicks: 0, add_to_cart: 0, purchases: 0,
        by_strategy: {} as Record<string, { impressions: number; clicks: number; purchases: number; revenue: number }>,
      };

      for (const e of (events || []) as any[]) {
        stats[e.event_type as keyof typeof stats]++;
        if (!stats.by_strategy[e.strategy]) {
          stats.by_strategy[e.strategy] = { impressions: 0, clicks: 0, purchases: 0, revenue: 0 };
        }
        const s = stats.by_strategy[e.strategy];
        if (e.event_type === 'impression') s.impressions++;
        if (e.event_type === 'click') s.clicks++;
        if (e.event_type === 'purchase') s.purchases++;
      }

      const { data: recommendations } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false })
        .limit(20);

      return new Response(JSON.stringify({ stats, recommendations }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
