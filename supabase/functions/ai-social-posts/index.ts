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

    const { productData, platforms, tone = 'professional', includeHashtags = true, generateImages = true } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('📱 Generating social media posts for:', platforms);

    const socialPosts = [];

    // Platform-specific content generation
    const platformConfigs = {
      instagram: { maxChars: 2200, style: 'visual-first', hashtagLimit: 30 },
      facebook: { maxChars: 63206, style: 'conversational', hashtagLimit: 10 },
      twitter: { maxChars: 280, style: 'concise', hashtagLimit: 5 },
      linkedin: { maxChars: 3000, style: 'professional', hashtagLimit: 5 },
      tiktok: { maxChars: 300, style: 'trendy', hashtagLimit: 10 }
    };

    for (const platform of platforms) {
      const config = platformConfigs[platform as keyof typeof platformConfigs] || platformConfigs.instagram;

      // Generate post text
      const textPrompt = `Create a ${config.style} ${platform} post for this product:
Product: ${productData.name}
Description: ${productData.description}
Price: ${productData.price}
Tone: ${tone}
Max characters: ${config.maxChars}

Generate engaging post copy ${includeHashtags ? `with ${config.hashtagLimit} trending hashtags` : 'without hashtags'}.

Return JSON:
{
  "caption": "",
  "hashtags": [],
  "hook": "",
  "emojis": ""
}`;

      const textResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            { role: 'system', content: `You are a social media expert for ${platform}.` },
            { role: 'user', content: textPrompt }
          ],
        }),
      });

      if (!textResponse.ok) continue;

      const textData = await textResponse.json();
      const textContent = textData.choices[0].message.content;
      const textMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || textContent.match(/\{[\s\S]*\}/);
      const postText = textMatch ? JSON.parse(textMatch[1] || textMatch[0]) : JSON.parse(textContent);

      // Generate image for post if requested
      let postImage = null;
      if (generateImages) {
        const imagePrompt = `Professional ${platform} post image for ${productData.name}. ${config.style} style, optimized for ${platform}, vibrant colors, product-focused, high engagement potential.`;

        try {
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: imagePrompt }],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            postImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          }
        } catch (imgError) {
          console.error(`Error generating image for ${platform}:`, imgError);
        }
      }

      socialPosts.push({
        platform,
        content: postText,
        image: postImage,
        config,
        bestTimeToPost: getBestPostingTime(platform),
        engagement: {
          expectedReach: 'medium',
          viralPotential: calculateViralScore(postText)
        }
      });
    }

    // Log the AI task
    await supabaseClient.from('ai_tasks').insert({
      user_id: user.id,
      task_type: 'social_posts_generation',
      status: 'completed',
      input_data: { productData, platforms, tone },
      output_data: { posts: socialPosts, platformsCount: socialPosts.length }
    });

    return new Response(
      JSON.stringify({
        success: true,
        posts: socialPosts,
        generatedCount: socialPosts.length,
        platforms: platforms
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-social-posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getBestPostingTime(platform: string): string {
  const times = {
    instagram: '11:00 AM - 1:00 PM',
    facebook: '1:00 PM - 3:00 PM',
    twitter: '8:00 AM - 10:00 AM',
    linkedin: '10:00 AM - 12:00 PM',
    tiktok: '7:00 PM - 9:00 PM'
  };
  return times[platform as keyof typeof times] || '12:00 PM';
}

function calculateViralScore(content: any): number {
  let score = 50;
  if (content.hook) score += 15;
  if (content.hashtags?.length >= 5) score += 15;
  if (content.emojis) score += 10;
  if (content.caption?.length > 50) score += 10;
  return Math.min(score, 100);
}
