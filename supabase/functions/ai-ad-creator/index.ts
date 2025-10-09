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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { productData, platform, campaignType, targetAudience, generateVariants = false } = await req.json();

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert advertising copywriter and creative strategist specializing in ${platform} ads for e-commerce products. Generate high-converting ad copy and creative suggestions.`;

    const userPrompt = `Create a compelling ${campaignType} ad campaign for ${platform} for the following product:

Product: ${productData.name}
Description: ${productData.description}
Price: ${productData.price} ${productData.currency}
Target Audience: ${JSON.stringify(targetAudience)}

Generate:
1. Primary headline (max 40 chars for ${platform})
2. Body copy (125 chars for ${platform})
3. Call-to-action text
4. Image/video suggestions
5. Targeting recommendations
${generateVariants ? '6. 3 A/B test variants with different angles (scarcity, social proof, benefit-focused)' : ''}

Return as JSON with structure:
{
  "primary": { "headline": "", "body": "", "cta": "" },
  "creative": { "imageStyle": "", "videoIdea": "" },
  "targeting": {},
  "variants": [{ "name": "", "angle": "", "headline": "", "body": "", "cta": "" }]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0].message.content;

    // Parse AI response
    let adCreative;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      adCreative = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI-generated ad creative');
    }

    // Log the AI generation
    await supabaseClient.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'ad_creation',
      status: 'completed',
      input_data: { productData, platform, campaignType },
      output_data: adCreative
    });

    return new Response(
      JSON.stringify({
        success: true,
        adCreative,
        platform,
        aiGenerated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-ad-creator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
