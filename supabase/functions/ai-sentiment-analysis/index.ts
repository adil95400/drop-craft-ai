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
    const { reviews, productId, analysisType = 'detailed' } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const reviewTexts = reviews.map((r: any) => `Rating: ${r.rating}/5\nReview: ${r.text}`).join('\n\n---\n\n');

    const prompt = `Analyze customer reviews and provide actionable insights:

${reviewTexts}

Provide comprehensive analysis:
1. Overall sentiment (positive, neutral, negative) with percentage
2. Key themes mentioned (quality, delivery, value, customer service, etc.)
3. Top 5 positive aspects
4. Top 5 concerns/complaints
5. Product improvement suggestions
6. Customer satisfaction score (0-100)
7. Emotional tone analysis
8. Urgency level for addressing issues
9. Competitor comparison mentions
10. Recommended response strategy

Return as JSON:
{
  "overallSentiment": {"label": string, "score": number, "distribution": {"positive": number, "neutral": number, "negative": number}},
  "themes": [{"theme": string, "count": number, "sentiment": string}],
  "positiveAspects": [{"aspect": string, "mentions": number}],
  "concerns": [{"issue": string, "severity": "low" | "medium" | "high", "mentions": number}],
  "improvements": [{"suggestion": string, "priority": "low" | "medium" | "high", "expectedImpact": string}],
  "satisfactionScore": number,
  "emotionalTone": {"primary": string, "secondary": string},
  "urgency": "low" | "medium" | "high",
  "competitorMentions": [{"competitor": string, "context": string}],
  "responseStrategy": string,
  "summary": string
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
          { role: 'system', content: 'You are an expert in sentiment analysis and customer feedback interpretation for e-commerce. Provide data-driven, actionable insights.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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
      throw new Error('Failed to parse sentiment analysis');
    }

    return new Response(JSON.stringify({
      success: true,
      productId,
      reviewCount: reviews.length,
      analysis: parsedContent,
      analyzedAt: new Date().toISOString()
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
