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
    const { product_id, warehouse_id, prediction_days = 30 } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get historical stock movements
    const { data: movements, error: movementsError } = await supabaseClient
      .from('stock_movements')
      .select('*')
      .eq('product_id', product_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (movementsError) throw movementsError;

    // Get current stock level
    const { data: currentStock, error: stockError } = await supabaseClient
      .from('stock_levels')
      .select('*')
      .eq('product_id', product_id)
      .eq('warehouse_id', warehouse_id)
      .single();

    if (stockError) throw stockError;

    // Prepare data for AI analysis
    const historicalData = movements?.map(m => ({
      date: m.created_at,
      quantity: m.quantity,
      movement_type: m.movement_type,
      reason: m.reason
    })) || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI expert in inventory management and demand forecasting. 
Analyze the historical stock movement data and provide accurate predictions for future stock needs.
Consider seasonal patterns, trends, and business context.
Return your analysis in JSON format with the following structure:
{
  "predictions": [
    {
      "date": "YYYY-MM-DD",
      "predicted_quantity": number,
      "confidence": number (0-1),
      "trend": "increasing" | "decreasing" | "stable"
    }
  ],
  "reorder_point": number,
  "optimal_quantity": number,
  "risk_level": "low" | "medium" | "high",
  "insights": [
    "insight text"
  ],
  "recommendations": [
    "recommendation text"
  ]
}`;

    const userPrompt = `Analyze this stock data and provide predictions for the next ${prediction_days} days:

Current Stock: ${currentStock?.quantity || 0} units
Warehouse: ${warehouse_id}
Product: ${product_id}

Historical Movements (last 100 transactions):
${JSON.stringify(historicalData, null, 2)}

Provide detailed predictions, reorder recommendations, and actionable insights.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const predictionData = JSON.parse(aiResponse.choices[0].message.content);

    // Store predictions in database
    const { error: insertError } = await supabaseClient
      .from('stock_predictions')
      .insert({
        product_id,
        warehouse_id,
        prediction_data: predictionData,
        confidence_score: predictionData.predictions?.[0]?.confidence || 0.5,
        predicted_reorder_date: predictionData.predictions?.find(p => 
          p.predicted_quantity < predictionData.reorder_point
        )?.date,
        valid_until: new Date(Date.now() + prediction_days * 24 * 60 * 60 * 1000).toISOString()
      });

    if (insertError) {
      console.error('Error storing prediction:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        prediction: predictionData,
        current_stock: currentStock?.quantity || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stock prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
