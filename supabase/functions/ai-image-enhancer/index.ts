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

    const { imageUrl, enhancementType = 'quality', productContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🎨 Enhancing product image with AI:', enhancementType);

    // Enhancement instructions based on type
    const enhancementInstructions = {
      quality: 'Enhance image quality: improve sharpness, color vibrancy, lighting balance, remove noise, professional photography look',
      background: 'Professional product photography: clean white background, perfect lighting, studio quality, remove distractions',
      lighting: 'Optimize lighting: balanced exposure, natural highlights, professional studio lighting, enhance product details',
      style: 'Transform to e-commerce style: clean, professional, product-focused, optimized for sales, appealing composition',
      upscale: 'Upscale and enhance: increase resolution, sharpen details, improve clarity, professional quality'
    };

    const instruction = enhancementInstructions[enhancementType as keyof typeof enhancementInstructions] 
      || enhancementInstructions.quality;

    const enhancePrompt = `${instruction}. Product: ${productContext || 'e-commerce product'}. Maintain product authenticity.`;

    // Enhance image using AI
    const enhanceResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: [
              { type: 'text', text: enhancePrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!enhanceResponse.ok) {
      throw new Error(`Image enhancement failed: ${enhanceResponse.status}`);
    }

    const enhanceData = await enhanceResponse.json();
    const enhancedImage = enhanceData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!enhancedImage) {
      throw new Error('No enhanced image returned');
    }

    // Generate quality score analysis
    const analysisPrompt = `Analyze this product image quality. Return JSON:
{
  "qualityScore": 0-100,
  "improvements": ["improvement 1", "improvement 2"],
  "strengths": ["strength 1", "strength 2"],
  "recommendations": ["recommendation 1"]
}`;

    let qualityAnalysis = null;
    try {
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: analysisPrompt },
                { type: 'image_url', image_url: { url: enhancedImage } }
              ]
            }
          ]
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const analysisContent = analysisData.choices[0].message.content;
        const analysisMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || analysisContent.match(/\{[\s\S]*\}/);
        qualityAnalysis = analysisMatch ? JSON.parse(analysisMatch[1] || analysisMatch[0]) : JSON.parse(analysisContent);
      }
    } catch (err) {
      console.error('Error analyzing quality:', err);
    }

    // Log the AI task
    await supabaseClient.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'image_enhancement',
      status: 'completed',
      input_data: { imageUrl, enhancementType, productContext },
      output_data: { enhanced: true, qualityAnalysis }
    });

    return new Response(
      JSON.stringify({
        success: true,
        originalImage: imageUrl,
        enhancedImage,
        enhancementType,
        qualityAnalysis,
        processing: {
          model: 'google/gemini-2.5-flash-image-preview',
          method: 'ai-enhancement'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-image-enhancer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
