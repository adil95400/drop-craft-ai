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
    const { productName, category, features, targetAudience, tone = 'professional' } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Generate a compelling product description for an e-commerce platform.

Product Name: ${productName}
Category: ${category}
Key Features: ${features?.join(', ') || 'N/A'}
Target Audience: ${targetAudience || 'General consumers'}
Tone: ${tone}

Requirements:
- Create an engaging, SEO-optimized description (150-200 words)
- Highlight unique selling points
- Include emotional appeal
- Use persuasive language
- Format with short paragraphs for readability

Return the response as JSON with this structure:
{
  "title": "Optimized product title",
  "shortDescription": "1-2 sentence hook (50-60 characters)",
  "fullDescription": "Complete product description",
  "bulletPoints": ["Key feature 1", "Key feature 2", "Key feature 3"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert e-commerce copywriter specializing in product descriptions that convert.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('JSON parsing error:', e);
      parsedContent = {
        title: productName,
        shortDescription: content.substring(0, 100),
        fullDescription: content,
        bulletPoints: features || [],
        seoKeywords: [category, productName]
      };
    }

    return new Response(JSON.stringify(parsedContent), {
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
