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
    const { jobId, jobType, inputData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update job status to processing
    await supabase
      .from('bulk_content_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId);

    const products = inputData.products || [];
    const results: any[] = [];
    const errorLog: any[] = [];
    let completedCount = 0;

    console.log(`Starting bulk generation: ${jobType} for ${products.length} products`);

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Check if job was cancelled
        const { data: jobCheck } = await supabase
          .from('bulk_content_jobs')
          .select('status')
          .eq('id', jobId)
          .single();

        if (jobCheck?.status === 'cancelled') {
          console.log('Job cancelled by user');
          break;
        }

        let result: any = {};

        if (jobType === 'videos') {
          // Generate video script
          const videoPrompt = `Create a ${inputData.duration}-second ${inputData.videoStyle} video script for:
Product: ${product.name}
Description: ${product.description}
Price: ${product.price}

Return a JSON with: hook, problem, solution, cta`;

          const videoResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are a viral video script creator. Return only valid JSON.' },
                { role: 'user', content: videoPrompt }
              ],
            }),
          });

          if (!videoResponse.ok) {
            throw new Error(`Video generation failed: ${videoResponse.status}`);
          }

          const videoData = await videoResponse.json();
          const scriptText = videoData.choices[0].message.content;
          
          let script;
          try {
            const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
            script = jsonMatch ? JSON.parse(jsonMatch[0]) : { 
              hook: scriptText.substring(0, 100),
              problem: '',
              solution: '',
              cta: ''
            };
          } catch {
            script = { 
              hook: scriptText.substring(0, 100),
              problem: '',
              solution: '',
              cta: ''
            };
          }

          result = {
            name: product.name,
            type: 'video',
            script,
            duration: inputData.duration,
            style: inputData.videoStyle
          };

        } else if (jobType === 'images') {
          // Generate image with Gemini 2.5 Flash Image Preview
          const imagePrompt = `Create a professional ${inputData.imageStyle} product image:
Product: ${product.name}
Description: ${product.description}
Visual prompt: ${product.visualPrompt}
Aspect ratio: ${inputData.aspectRatio}

Generate a clean, professional product photo suitable for e-commerce.`;

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

          if (!imageResponse.ok) {
            throw new Error(`Image generation failed: ${imageResponse.status}`);
          }

          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          result = {
            name: product.name,
            type: 'image',
            imageUrl: imageUrl || '',
            style: inputData.imageStyle,
            aspectRatio: inputData.aspectRatio
          };
        }

        results.push(result);
        completedCount++;

        // Update progress
        await supabase
          .from('bulk_content_jobs')
          .update({ 
            completed_items: completedCount,
            results: results
          })
          .eq('id', jobId);

        console.log(`Completed ${completedCount}/${products.length}: ${product.name}`);

      } catch (error: any) {
        console.error(`Error processing ${product.name}:`, error.message);
        errorLog.push({
          product: product.name,
          message: error.message
        });

        // Update failed count
        await supabase
          .from('bulk_content_jobs')
          .update({ 
            failed_items: errorLog.length,
            error_log: errorLog
          })
          .eq('id', jobId);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final update
    const finalStatus = completedCount === products.length ? 'completed' : 
                       completedCount === 0 ? 'failed' : 'completed';

    await supabase
      .from('bulk_content_jobs')
      .update({ 
        status: finalStatus,
        completed_items: completedCount,
        failed_items: errorLog.length,
        results: results,
        error_log: errorLog,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`Bulk job completed: ${completedCount}/${products.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true,
        jobId,
        completed: completedCount,
        failed: errorLog.length,
        total: products.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in bulk-content-generator:', error);
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
