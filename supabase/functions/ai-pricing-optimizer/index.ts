import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { productId, currentPrice, costPrice, competitorPrices, salesHistory, marketData } = await req.json();

    const systemPrompt = `You are an AI pricing strategist expert. Analyze market data and provide optimal pricing recommendations based on:
- Cost structure and desired margins
- Competitor pricing
- Historical sales data
- Market trends and demand`;

    const userPrompt = `Analyze this product and recommend optimal pricing:

Current Price: €${currentPrice}
Cost Price: €${costPrice}
Competitor Prices: ${competitorPrices.map((p: any) => `€${p.price} (${p.competitor})`).join(', ')}
Recent Sales: ${salesHistory.length} units
Market Demand: ${marketData.demand}

Provide:
1. Recommended price with reasoning
2. Price range (min-max)
3. Expected margin and profit
4. Competitive positioning
5. Dynamic pricing strategy recommendations

Format as JSON with: recommendedPrice, minPrice, maxPrice, reasoning, margin, strategy`;

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
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('AI Gateway error:', error);
      throw new Error('Failed to generate pricing recommendation');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse JSON from response
    let pricingData;
    try {
      pricingData = JSON.parse(content);
    } catch {
      pricingData = {
        recommendedPrice: currentPrice,
        reasoning: content,
        minPrice: costPrice * 1.2,
        maxPrice: currentPrice * 1.3
      };
    }

    // Log AI task
    await supabase.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'pricing_optimization',
      input_data: { productId, currentPrice, costPrice, competitorPrices },
      output_data: pricingData,
      status: 'completed',
      tokens_used: data.usage?.total_tokens || 0,
    });

    return new Response(JSON.stringify({ 
      pricing: pricingData, 
      tokensUsed: data.usage?.total_tokens || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-pricing-optimizer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
