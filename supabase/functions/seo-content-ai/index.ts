/**
 * SEO Content AI Edge Function
 * Uses Lovable AI to generate real SEO content (meta descriptions, titles, H1s, etc.)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TYPE_PROMPTS: Record<string, string> = {
  meta_description: `Generate {variants} unique, SEO-optimized meta descriptions (max 160 chars each) for the given page/topic.
Each must include the target keywords naturally. Return a JSON array of objects: [{text: string, chars: number}].`,

  title: `Generate {variants} unique, SEO-optimized page titles (max 60 chars each) for the given page/topic.
Include the main keyword near the start. Return a JSON array of objects: [{text: string, chars: number}].`,

  h1: `Generate {variants} unique H1 heading suggestions for the given page/topic.
Make them clear, compelling and keyword-rich. Return a JSON array of objects: [{text: string}].`,

  alt_text: `Generate {variants} unique, descriptive alt text suggestions for product images related to the given topic.
Be specific and include relevant keywords. Return a JSON array of objects: [{text: string}].`,

  faq: `Generate {variants} FAQ question-answer pairs related to the given topic.
Make them helpful for SEO with natural keyword inclusion. Return a JSON array of objects: [{question: string, answer: string}].`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, keyword, productName, category, language = 'fr', tone = 'professional', keywords = [], variants = 3 } = await req.json();

    if (!type || (!keyword && keywords.length === 0)) {
      return new Response(JSON.stringify({ error: 'type et keyword/keywords requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const promptTemplate = TYPE_PROMPTS[type] || TYPE_PROMPTS.meta_description;
    const prompt = promptTemplate.replace('{variants}', String(variants));

    const allKeywords = keyword ? [keyword, ...keywords] : keywords;
    const context = [
      `Topic/Keywords: ${allKeywords.join(', ')}`,
      productName && `Product: ${productName}`,
      category && `Category: ${category}`,
      `Language: ${language}`,
      `Tone: ${tone}`,
    ].filter(Boolean).join('\n');

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
            content: `You are an expert SEO content specialist. Generate optimized content for e-commerce and web pages. Always respond with valid JSON only, no markdown or extra text. ${prompt}`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('[SEO-CONTENT-AI] Gateway error:', status, errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '[]';

    // Parse AI response — handle potential markdown wrapping
    let parsed: any;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = [{ text: rawContent }];
    }

    const tokensUsed = aiData.usage?.total_tokens || 0;

    // Store generation in DB for traceability
    await supabase.from('seo_ai_generations').insert({
      user_id: user.id,
      type,
      language,
      tone,
      input: { keyword, keywords: allKeywords, productName, category, variants },
      output: { results: parsed, raw: rawContent },
      tokens_used: tokensUsed,
    });

    console.log(`[SEO-CONTENT-AI] Generated ${type} for user ${user.id}, ${tokensUsed} tokens`);

    return new Response(JSON.stringify({
      type,
      results: parsed,
      tokens_used: tokensUsed,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[SEO-CONTENT-AI] Error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
