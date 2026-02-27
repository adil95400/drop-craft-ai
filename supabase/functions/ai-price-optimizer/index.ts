import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      productName,
      currentPrice,
      costPrice,
      category,
      competitorPrices,
      salesData,
      marketConditions
    } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Analyze pricing strategy for: ${productName}

Current Data:
- Current Price: $${currentPrice}
- Cost Price: $${costPrice}
- Category: ${category}
- Competitor Prices: ${competitorPrices?.join(', ') || 'N/A'}
- Recent Sales: ${salesData?.totalSales || 0} units in last 30 days
- Market Conditions: ${marketConditions || 'Normal'}

Analyze and provide:
1. Recommended optimal price
2. Pricing strategy (penetration, skimming, competitive, value-based)
3. Expected profit margin %
4. Price elasticity analysis
5. Discount recommendations
6. Bundle pricing suggestions
7. Seasonal pricing adjustments
8. Confidence level (0-100)

Return as JSON:
{
  "recommendedPrice": number,
  "strategy": string,
  "profitMargin": number,
  "priceElasticity": "elastic" | "inelastic",
  "discountRecommendation": {
    "suggested": number,
    "timing": string,
    "expectedImpact": string
  },
  "bundlePricing": [{"products": [], "price": number}],
  "seasonalAdjustments": [{"period": string, "adjustment": string}],
  "confidence": number,
  "reasoning": string,
  "risks": [string],
  "opportunities": [string]
}`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are an expert pricing strategist with deep knowledge of e-commerce, behavioral economics, and data-driven pricing optimization.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('JSON parsing error:', e);
      throw new Error('Failed to parse pricing analysis');
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: parsedContent,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
