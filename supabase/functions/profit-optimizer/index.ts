import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, sellingPrice, productCost, netProfit, profitMargin } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Analyze this product profit data and provide 5 actionable suggestions to optimize profitability:

Product: ${productName}
Selling Price: ${sellingPrice}€
Product Cost: ${productCost}€
Net Profit: ${netProfit}€
Profit Margin: ${profitMargin.toFixed(1)}%

Provide specific, data-driven recommendations focusing on:
1. Price optimization
2. Cost reduction strategies
3. Margin improvement tactics
4. Market positioning
5. Operational efficiency

Return ONLY a JSON array of strings (no markdown, no code blocks):
["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]`;

    console.log('Calling AI for profit optimization...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a profit optimization expert for e-commerce. Provide concise, actionable advice. Return only valid JSON arrays.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI optimization failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;
    
    console.log('AI Response received:', generatedText.substring(0, 200));

    // Parse JSON response
    let suggestions: string[];
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*?\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [
        "Augmentez légèrement le prix pour améliorer la marge",
        "Négociez avec vos fournisseurs pour réduire les coûts",
        "Optimisez vos campagnes publicitaires pour un meilleur ROI",
        "Créez des bundles pour augmenter le panier moyen",
        "Analysez la concurrence pour ajuster votre positionnement"
      ];
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      suggestions = [
        "Augmentez légèrement le prix pour améliorer la marge",
        "Négociez avec vos fournisseurs pour réduire les coûts",
        "Optimisez vos campagnes publicitaires pour un meilleur ROI",
        "Créez des bundles pour augmenter le panier moyen",
        "Analysez la concurrence pour ajuster votre positionnement"
      ];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in profit-optimizer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        suggestions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
