import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { jobId, jobType, inputData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Update job status to processing
    await supabase
      .from('ai_optimization_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId);

    const products = inputData.products || [];
    const results: any[] = [];
    const errorLog: any[] = [];
    let completedCount = 0;

    console.log(`Starting bulk generation: ${jobType} for ${products.length} products`);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Check if job was cancelled
        const { data: jobCheck } = await supabase
          .from('ai_optimization_jobs')
          .select('status')
          .eq('id', jobId)
          .single();

        if (jobCheck?.status === 'cancelled') {
          console.log('Job cancelled by user');
          break;
        }

        let result: any = {};

        if (jobType === 'descriptions') {
          // Bulk text content generation (descriptions, titles, SEO)
          const contentTypes = inputData.contentTypes || ['description', 'title', 'seo'];
          const tone = inputData.tone || 'professional';
          const language = inputData.language || 'fr';
          const templatePrompt = inputData.templatePrompt || '';

          const systemPrompt = `Tu es un expert copywriter e-commerce. Génère du contenu de haute qualité, optimisé SEO, dans un ton ${tone}. Langue: ${language}.`;

          const userPrompt = `Génère le contenu suivant pour ce produit:\nNom: ${product.name}\n${product.description ? `Description actuelle: ${product.description}` : ''}\n${product.category ? `Catégorie: ${product.category}` : ''}\n${product.price ? `Prix: ${product.price}€` : ''}\n${product.sku ? `SKU: ${product.sku}` : ''}\n${product.features ? `Caractéristiques: ${product.features}` : ''}\n${templatePrompt ? `Instructions supplémentaires: ${templatePrompt}` : ''}\n\nTypes de contenu demandés: ${contentTypes.join(', ')}`;

          const toolParams: Record<string, any> = {};
          if (contentTypes.includes('description')) {
            toolParams.description = { type: "string", description: "Description produit persuasive et optimisée SEO (150-250 mots)" };
          }
          if (contentTypes.includes('title')) {
            toolParams.title = { type: "string", description: "Titre produit accrocheur et optimisé SEO (max 70 caractères)" };
          }
          if (contentTypes.includes('seo')) {
            toolParams.meta_title = { type: "string", description: "Meta title SEO (max 60 caractères)" };
            toolParams.meta_description = { type: "string", description: "Meta description SEO (max 155 caractères)" };
            toolParams.seo_keywords = { type: "array", items: { type: "string" }, description: "5 mots-clés SEO pertinents" };
          }
          if (contentTypes.includes('bullet_points')) {
            toolParams.bullet_points = { type: "array", items: { type: "string" }, description: "5-7 points clés/bénéfices produit" };
          }
          if (contentTypes.includes('alt_text')) {
            toolParams.alt_text = { type: "string", description: "Texte alternatif descriptif et optimisé SEO pour l'image principale du produit (max 125 caractères)" };
            toolParams.alt_text_variants = { type: "array", items: { type: "string" }, description: "3 variantes de texte alternatif pour les images secondaires du produit" };
          }

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-5-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 1500,
              tools: [{
                type: "function",
                function: {
                  name: "generate_product_content",
                  description: "Génère le contenu textuel pour un produit",
                  parameters: {
                    type: "object",
                    properties: toolParams,
                    required: Object.keys(toolParams),
                    additionalProperties: false
                  }
                }
              }],
              tool_choice: { type: "function", function: { name: "generate_product_content" } }
            }),
          });

          if (!response.ok) {
            if (response.status === 429) throw new Error('Rate limit atteint');
            if (response.status === 402) throw new Error('Crédits insuffisants');
            throw new Error(`AI error: ${response.status}`);
          }

          const data = await response.json();
          const toolCall = data.choices[0].message.tool_calls?.[0];
          let generated: any;

          if (toolCall?.function?.arguments) {
            generated = JSON.parse(toolCall.function.arguments);
          } else {
            const content = data.choices[0].message.content || '';
            generated = { description: content };
          }

          // Store in ai_generated_content for each content type
          for (const contentType of contentTypes) {
            const contentValue = contentType === 'seo' 
              ? JSON.stringify({ meta_title: generated.meta_title, meta_description: generated.meta_description, seo_keywords: generated.seo_keywords })
              : contentType === 'bullet_points'
              ? JSON.stringify(generated.bullet_points)
              : contentType === 'alt_text'
              ? JSON.stringify({ main: generated.alt_text, variants: generated.alt_text_variants })
              : generated[contentType] || '';

            if (contentValue) {
              await supabase.from('ai_generated_content').insert({
                user_id: userId,
                product_id: product.id || null,
                content_type: contentType,
                original_content: product.description || product.name,
                generated_content: contentValue,
                variables_used: { tone, language, template: templatePrompt ? 'custom' : 'default' },
                quality_score: 0.85,
                status: 'draft',
                tokens_used: data.usage?.total_tokens || 0,
              });
            }
          }

          result = {
            name: product.name,
            type: 'descriptions',
            generated,
            contentTypes,
          };

        } else if (jobType === 'videos') {
          const videoPrompt = `Create a ${inputData.duration}-second ${inputData.videoStyle} video script for:\nProduct: ${product.name}\nDescription: ${product.description}\nPrice: ${product.price}\n\nReturn a JSON with: hook, problem, solution, cta`;

          const videoResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-5-mini',
              messages: [
                { role: 'system', content: 'You are a viral video script creator. Return only valid JSON.' },
                { role: 'user', content: videoPrompt }
              ],
            }),
          });

          if (!videoResponse.ok) throw new Error(`Video generation failed: ${videoResponse.status}`);

          const videoData = await videoResponse.json();
          const scriptText = videoData.choices[0].message.content;
          
          let script;
          try {
            const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
            script = jsonMatch ? JSON.parse(jsonMatch[0]) : { hook: scriptText.substring(0, 100) };
          } catch {
            script = { hook: scriptText.substring(0, 100) };
          }

          result = { name: product.name, type: 'video', script, duration: inputData.duration, style: inputData.videoStyle };

        } else if (jobType === 'images') {
          const imagePrompt = `Create a professional ${inputData.imageStyle} product image:\nProduct: ${product.name}\nDescription: ${product.description}\nVisual prompt: ${inputData.visualPrompt}\nAspect ratio: ${inputData.aspectRatio}\n\nGenerate a clean, professional product photo suitable for e-commerce.`;

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

          if (!imageResponse.ok) throw new Error(`Image generation failed: ${imageResponse.status}`);

          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          result = { name: product.name, type: 'image', imageUrl: imageUrl || '', style: inputData.imageStyle, aspectRatio: inputData.aspectRatio };
        }

        results.push(result);
        completedCount++;

        // Update progress
        await supabase
          .from('ai_optimization_jobs')
          .update({ 
            metrics: { completed: completedCount, failed: errorLog.length },
            output_data: { results }
          })
          .eq('id', jobId);

        console.log(`Completed ${completedCount}/${products.length}: ${product.name}`);

      } catch (error: any) {
        console.error(`Error processing ${product.name}:`, error.message);
        errorLog.push({ product: product.name, message: error.message });

        await supabase
          .from('ai_optimization_jobs')
          .update({ metrics: { completed: completedCount, failed: errorLog.length } })
          .eq('id', jobId);
      }

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const finalStatus = completedCount === products.length ? 'completed' : 
                       completedCount === 0 ? 'failed' : 'completed';

    await supabase
      .from('ai_optimization_jobs')
      .update({ 
        status: finalStatus,
        metrics: { completed: completedCount, failed: errorLog.length },
        output_data: { results, error_log: errorLog },
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return new Response(
      JSON.stringify({ success: true, jobId, completed: completedCount, failed: errorLog.length, total: products.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in bulk-content-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
