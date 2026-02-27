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

    const { productData, videoStyle = 'tiktok', duration = 15 } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('🎬 Generating TikTok-style video frames for product:', productData.name);

    // Generate video script with AI
    const scriptPrompt = `Create a ${duration}-second TikTok video script for this product:
Product: ${productData.name}
Description: ${productData.description}
Price: ${productData.price}

Generate a hook-driven script with:
1. Hook (first 3 seconds) - attention grabber
2. Problem (3-5 seconds) - pain point
3. Solution (5-10 seconds) - product benefits
4. CTA (last 2-5 seconds) - call to action

Return JSON:
{
  "hook": "",
  "problem": "",
  "solution": "",
  "cta": "",
  "visualCues": ["scene 1 description", "scene 2 description", ...],
  "captions": ["text 1", "text 2", ...]
}`;

    const scriptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'You are a viral TikTok content strategist specializing in product videos.' },
          { role: 'user', content: scriptPrompt }
        ],
      }),
    });

    if (!scriptResponse.ok) {
      throw new Error(`Script generation failed: ${scriptResponse.status}`);
    }

    const scriptData = await scriptResponse.json();
    const scriptContent = scriptData.choices[0].message.content;
    const jsonMatch = scriptContent.match(/```json\n([\s\S]*?)\n```/) || scriptContent.match(/\{[\s\S]*\}/);
    const videoScript = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(scriptContent);

    // Generate key frames for the video (3-5 frames)
    const keyFrames = [];
    const framesToGenerate = Math.min(videoScript.visualCues?.length || 3, 5);

    for (let i = 0; i < framesToGenerate; i++) {
      const cue = videoScript.visualCues?.[i] || `Scene ${i + 1} showing ${productData.name}`;
      const framePrompt = `Professional product video frame for TikTok: ${cue}. ${productData.name}. High quality, vibrant, trending style, vertical 9:16 format, eye-catching composition.`;

      try {
        const frameResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{ role: 'user', content: framePrompt }],
            modalities: ['image', 'text']
          }),
        });

        if (frameResponse.ok) {
          const frameData = await frameResponse.json();
          const frameUrl = frameData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (frameUrl) {
            keyFrames.push({
              frame: i + 1,
              timestamp: (duration / framesToGenerate) * i,
              imageUrl: frameUrl,
              caption: videoScript.captions?.[i] || '',
              description: cue
            });
          }
        }
      } catch (err) {
        console.error(`Error generating frame ${i}:`, err);
      }
    }

    // Log the AI task
    await supabaseClient.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'video_generation',
      status: 'completed',
      input_data: { productData, videoStyle, duration },
      output_data: { videoScript, keyFrames, framesGenerated: keyFrames.length }
    });

    return new Response(
      JSON.stringify({
        success: true,
        videoScript,
        keyFrames,
        duration,
        format: '9:16 vertical',
        platform: videoStyle,
        metadata: {
          framesGenerated: keyFrames.length,
          totalDuration: duration,
          captionsCount: videoScript.captions?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-video-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
