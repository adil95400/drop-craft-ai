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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { itemId, salesHistory, currentStock, reorderPoint } = await req.json();

    console.log('Generating prediction for item:', itemId);

    // Build AI prompt with sales data
    const prompt = `Analyze this inventory data and provide stock predictions:

Product Stock Info:
- Current Stock: ${currentStock}
- Reorder Point: ${reorderPoint}
- Sales History (last 30 days): ${JSON.stringify(salesHistory)}

Based on this data, provide:
1. Predicted demand for next 30 days
2. Confidence score (0-1)
3. Days until stockout
4. Recommended reorder date
5. Seasonal factor (0-2, where 1 is normal)
6. Trend direction (up/down/stable)
7. Recommended reorder quantity
8. Priority level (low/medium/high/urgent)
9. Reasoning for the recommendation

Return ONLY valid JSON in this exact format:
{
  "predictedDemand": number,
  "confidenceScore": number,
  "daysUntilStockout": number,
  "recommendedReorderDate": "YYYY-MM-DD",
  "seasonalFactor": number,
  "trendDirection": "up" | "down" | "stable",
  "recommendedQuantity": number,
  "priority": "low" | "medium" | "high" | "urgent",
  "reasoning": "string"
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are an expert inventory analyst. Always return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI prediction failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let prediction;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Save prediction to database
    const { data: predictionData, error: predError } = await supabase
      .from('inventory_predictions')
      .insert({
        user_id: user.id,
        item_id: itemId,
        predicted_demand: prediction.predictedDemand,
        confidence_score: prediction.confidenceScore,
        days_until_stockout: prediction.daysUntilStockout,
        recommended_reorder_date: prediction.recommendedReorderDate,
        seasonal_factor: prediction.seasonalFactor,
        trend_direction: prediction.trendDirection,
      })
      .select()
      .single();

    if (predError) {
      console.error('Error saving prediction:', predError);
      throw predError;
    }

    // Calculate estimated cost from real product data
    let unitCost = 10; // Default fallback
    
    // Try to get real cost from products table
    const { data: productData } = await supabase
      .from('products')
      .select('cost_price, price')
      .eq('id', itemId)
      .single();
    
    if (productData?.cost_price) {
      unitCost = productData.cost_price;
    } else if (productData?.price) {
      // Estimate cost as 60% of selling price if cost not available
      unitCost = productData.price * 0.6;
    } else {
      // Try supplier_products table
      const { data: supplierProduct } = await supabase
        .from('supplier_products')
        .select('cost_price, selling_price')
        .eq('id', itemId)
        .single();
      
      if (supplierProduct?.cost_price) {
        unitCost = supplierProduct.cost_price;
      } else if (supplierProduct?.selling_price) {
        unitCost = supplierProduct.selling_price * 0.6;
      }
    }

    const estimatedCost = prediction.recommendedQuantity * unitCost;
    
    const { data: suggestionData, error: suggError } = await supabase
      .from('restock_suggestions')
      .insert({
        user_id: user.id,
        item_id: itemId,
        suggested_quantity: prediction.recommendedQuantity,
        suggested_date: prediction.recommendedReorderDate,
        estimated_cost: estimatedCost,
        priority: prediction.priority,
        reasoning: prediction.reasoning,
      })
      .select()
      .single();

    if (suggError) {
      console.error('Error creating suggestion:', suggError);
    }

    // Create alert if stock is low
    if (prediction.daysUntilStockout <= 7 && currentStock <= reorderPoint) {
      const severity = prediction.daysUntilStockout <= 3 ? 'critical' : 
                      prediction.daysUntilStockout <= 5 ? 'high' : 'medium';
      
      await supabase.from('stock_alerts').insert({
        user_id: user.id,
        item_id: itemId,
        alert_type: currentStock === 0 ? 'out_of_stock' : 'low_stock',
        severity: severity,
        message: `Stock will run out in ${prediction.daysUntilStockout} days. Current: ${currentStock} units`,
      });
    }

    return new Response(
      JSON.stringify({
        prediction: predictionData,
        suggestion: suggestionData,
        unit_cost_used: unitCost,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inventory-predictor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
