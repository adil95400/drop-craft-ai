import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, name, adType, headline, description, callToAction, aiPrompt } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating creative with AI...');

    let imageUrl = '';

    // Generate image if prompt is provided
    if (aiPrompt && adType === 'image') {
      const imagePrompt = `Create a professional advertising image: ${aiPrompt}. 
High quality, suitable for ${adType} format, eye-catching and engaging.`;

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            { role: 'user', content: imagePrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
      }
    }

    // Calculate performance score with AI
    const scorePrompt = `Analyze this ad creative and rate it 0-100:
Headline: ${headline}
Description: ${description}
CTA: ${callToAction}
Type: ${adType}

Consider: clarity, engagement, call-to-action strength, visual appeal.
Return only a number between 0-100.`;

    const scoreResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: 'You are an advertising expert. Return only numbers.' },
          { role: 'user', content: scorePrompt }
        ],
      }),
    });

    let performanceScore = 85;
    if (scoreResponse.ok) {
      const scoreData = await scoreResponse.json();
      const scoreText = scoreData.choices[0].message.content;
      const scoreMatch = scoreText.match(/\d+/);
      if (scoreMatch) {
        performanceScore = parseInt(scoreMatch[0]);
      }
    }

    // Save creative to database
    const { data: creative, error: creativeError } = await supabase
      .from('ad_creatives')
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        name,
        ad_type: adType,
        headline,
        description,
        call_to_action: callToAction,
        image_url: imageUrl,
        is_ai_generated: true,
        ai_prompt: aiPrompt,
        performance_score: performanceScore
      })
      .select()
      .single();

    if (creativeError) throw creativeError;

    console.log('Creative generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        creative: creative,
        imageUrl: imageUrl,
        performanceScore: performanceScore
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in ads-creative-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
