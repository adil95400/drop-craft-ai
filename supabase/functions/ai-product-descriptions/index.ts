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

    const { productName, category, features, tone = 'professional', length = 'medium' } = await req.json();

    const lengthMapping = {
      short: '50-100 words',
      medium: '100-200 words',
      long: '200-300 words'
    };

    const systemPrompt = `You are an expert e-commerce copywriter specializing in product descriptions. 
Create compelling, SEO-optimized product descriptions that drive conversions.`;

    const userPrompt = `Generate a ${tone} product description for:
Product: ${productName}
Category: ${category}
Key Features: ${features.join(', ')}
Length: ${lengthMapping[length as keyof typeof lengthMapping]}

Include:
- Attention-grabbing headline
- Key benefits and features
- Call-to-action
- SEO keywords naturally integrated`;

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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('AI Gateway error:', error);
      throw new Error('Failed to generate description');
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    // Log AI task
    await supabase.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'product_description',
      input_data: { productName, category, features, tone, length },
      output_data: { description },
      status: 'completed',
      tokens_used: data.usage?.total_tokens || 0,
    });

    return new Response(JSON.stringify({ description, tokensUsed: data.usage?.total_tokens || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-product-descriptions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
