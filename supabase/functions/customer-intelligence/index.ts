import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerData {
  customer_id: string;
  customer_email: string;
  customer_name?: string;
  total_orders?: number;
  total_spent?: number;
  avg_order_value?: number;
  last_order_date?: string;
  first_order_date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://dtozyrmmekdnvekissuh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { customerData } = await req.json() as { customerData: CustomerData };

    // Build AI analysis prompt
    const prompt = `Analyze this customer's behavior and provide insights:

Customer: ${customerData.customer_name || customerData.customer_email}
Total Orders: ${customerData.total_orders || 0}
Total Spent: $${customerData.total_spent || 0}
Average Order Value: $${customerData.avg_order_value || 0}
Last Order: ${customerData.last_order_date || 'Never'}
First Order: ${customerData.first_order_date || 'Never'}

Based on this data, provide:
1. Behavioral Score (0-100): Overall customer value and engagement
2. Engagement Level: low, medium, high, or very_high
3. Customer Segment: vip, loyal, at_risk, new, dormant, or champion
4. Segment Confidence (0-100): How confident you are in this segmentation
5. Purchase Frequency: Description of purchase pattern
6. Lifetime Value Prediction: Estimated total value
7. Predicted Next Purchase Days: Days until likely next purchase
8. Churn Probability (0-100): Likelihood customer will stop buying
9. Churn Risk Level: low, medium, high, or critical
10. Key Insights: 3-5 actionable insights about this customer
11. Recommended Actions: 3-5 specific actions to take
12. Preferences: Inferred customer preferences

Respond in JSON format with these exact fields:
{
  "behavioral_score": number,
  "engagement_level": string,
  "customer_segment": string,
  "segment_confidence": number,
  "purchase_frequency": string,
  "lifetime_value": number,
  "predicted_next_purchase_days": number,
  "churn_probability": number,
  "churn_risk_level": string,
  "key_insights": [string],
  "recommended_actions": [string],
  "preferences": [string]
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://api.lovable.app/v1/ai/chat-completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: 'You are a customer analytics expert. Provide accurate, actionable insights based on customer data. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('AI API Error:', error);
      throw new Error('Failed to generate AI analysis');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '{}';
    
    // Parse AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('customer_behavior_analytics')
      .insert({
        customer_id: customerData.customer_id,
        customer_email: customerData.customer_email,
        customer_name: customerData.customer_name,
        behavioral_score: analysis.behavioral_score,
        engagement_level: analysis.engagement_level,
        purchase_frequency: analysis.purchase_frequency,
        avg_order_value: customerData.avg_order_value,
        total_orders: customerData.total_orders,
        total_spent: customerData.total_spent,
        customer_segment: analysis.customer_segment,
        segment_confidence: analysis.segment_confidence,
        lifetime_value: analysis.lifetime_value,
        predicted_next_purchase_days: analysis.predicted_next_purchase_days,
        churn_probability: analysis.churn_probability,
        churn_risk_level: analysis.churn_risk_level,
        key_insights: analysis.key_insights,
        recommended_actions: analysis.recommended_actions,
        preferences: analysis.preferences,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Database error:', saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis: savedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});