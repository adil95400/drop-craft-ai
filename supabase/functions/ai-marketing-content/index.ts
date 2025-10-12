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
    const { contentType, productInfo, platform, campaignGoal } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const contentPrompts = {
      email: `Create a compelling email marketing campaign for ${productInfo.name}.
      
Goal: ${campaignGoal}
Platform: ${platform}

Generate:
1. Subject line (attention-grabbing, 50 characters max)
2. Preview text (complement subject, 100 characters max)
3. Email body (HTML-friendly, 200-300 words)
4. Call-to-action (clear and actionable)

Return as JSON with structure: {"subject", "previewText", "body", "cta"}`,

      social: `Create engaging social media posts for ${productInfo.name}.

Goal: ${campaignGoal}
Platform: ${platform}

Generate 3 variations:
1. Short punchy post (280 characters)
2. Story-driven post (with emoji)
3. Question/engagement post

Include hashtag suggestions. Return as JSON array: [{"text", "hashtags", "callToAction"}]`,

      ad: `Create paid advertising copy for ${productInfo.name}.

Goal: ${campaignGoal}
Platform: ${platform}

Generate:
1. Headline (30 characters)
2. Description (90 characters)
3. Long description (if applicable)
4. Display URL suggestions

Return as JSON: {"headline", "description", "longDescription", "displayUrl"}`,

      blog: `Write a blog post outline about ${productInfo.name}.

Goal: ${campaignGoal}

Generate:
1. SEO-optimized title
2. Meta description
3. Introduction (100 words)
4. 3-5 main section headings with brief descriptions
5. Conclusion summary
6. CTA

Return as JSON with structure: {"title", "metaDescription", "intro", "sections", "conclusion", "cta"}`
    };

    const prompt = contentPrompts[contentType] || contentPrompts.social;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert digital marketing content creator with expertise in conversion optimization.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_completion_tokens: 1500,
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
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { content };
    } catch (e) {
      console.error('JSON parsing error:', e);
      parsedContent = { content };
    }

    return new Response(JSON.stringify({
      success: true,
      contentType,
      data: parsedContent
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
