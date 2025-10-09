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

    const { productData, platform, campaignType, targetAudience, generateVariants = false, generateVisuals = true } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Generate ad copy with AI
    const textSystemPrompt = `You are an expert advertising copywriter specializing in ${platform} ads for e-commerce products.`;
    const textUserPrompt = `Create a compelling ${campaignType} ad campaign for ${platform}:

Product: ${productData.name}
Description: ${productData.description}
Price: ${productData.price} ${productData.currency}
Target Audience: ${JSON.stringify(targetAudience)}

Generate:
1. Primary headline (max 40 chars)
2. Body copy (125 chars)
3. Call-to-action text
4. Visual description for image generation
${generateVariants ? '5. 3 A/B test variants' : ''}

Return as JSON:
{
  "primary": { "headline": "", "body": "", "cta": "", "visualPrompt": "" },
  "variants": []
}`;

    const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: textSystemPrompt },
          { role: 'user', content: textUserPrompt }
        ],
      }),
    });

    if (!textResponse.ok) {
      throw new Error(`Text generation failed: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const content = textData.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const adCreative = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(content);

    // Step 2: Generate visual with AI if enabled
    let generatedImage = null;
    if (generateVisuals && adCreative.primary.visualPrompt) {
      const imagePrompt = `Professional ${platform} ad image for ${productData.name}. ${adCreative.primary.visualPrompt}. High quality, eye-catching, commercial photography style, product-focused, vibrant colors.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: imagePrompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      }
    }

    // Step 3: Create Canva design with generated content
    let canvaDesign = null;
    if (generatedImage) {
      try {
        const canvaResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/canva-design-optimizer`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization')!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_ad_visual',
            content: {
              headline: adCreative.primary.headline,
              body: adCreative.primary.body,
              cta: adCreative.primary.cta,
              generatedImage: generatedImage,
              platform: platform
            },
            brandColors: {
              primary: '#7C3AED',
              secondary: '#EC4899'
            }
          }),
        });

        if (canvaResponse.ok) {
          canvaDesign = await canvaResponse.json();
        }
      } catch (canvaError) {
        console.error('Canva integration error:', canvaError);
      }
    }

    // Log the AI task
    await supabaseClient.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'ad_creation_complete',
      status: 'completed',
      input_data: { productData, platform, campaignType, generateVisuals },
      output_data: {
        adCreative,
        hasImage: !!generatedImage,
        hasCanvaDesign: !!canvaDesign
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        adCreative,
        generatedImage,
        canvaDesign,
        platform,
        aiGenerated: true,
        visualsGenerated: !!generatedImage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-ad-creator-complete:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
