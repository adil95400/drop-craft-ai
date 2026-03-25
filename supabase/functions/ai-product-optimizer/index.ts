/**
 * AI Product Optimizer — Unified AI Client
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';
import { handleError, ValidationError } from '../_shared/error-handler.ts';
import { callOpenAI } from '../_shared/ai-client.ts';

const VALID_OPTIMIZATION_TYPES = ['title', 'description', 'attributes', 'seo_meta', 'category', 'brand', 'full'] as const;
const VALID_TONES = ['professional', 'casual', 'luxury', 'technical'] as const;
const VALID_SOURCES = ['products', 'imported_products', 'supplier_products'] as const;

function validateRequest(body: any) {
  if (!body || typeof body !== 'object') throw new ValidationError('Request body must be JSON');
  if (body.productId !== undefined && typeof body.productId !== 'string') throw new ValidationError('productId must be string');
  if (body.optimizationType && !VALID_OPTIMIZATION_TYPES.includes(body.optimizationType)) throw new ValidationError(`Invalid optimizationType`);
  if (body.tone && !VALID_TONES.includes(body.tone)) throw new ValidationError(`Invalid tone`);
  if (body.productSource && !VALID_SOURCES.includes(body.productSource)) throw new ValidationError(`Invalid productSource`);

  return {
    productId: body.productId || null,
    productSource: body.productSource || 'products',
    optimizationType: body.optimizationType || 'seo_meta',
    tone: body.tone || 'professional',
    currentData: body.currentData || {
      name: typeof body.name === 'string' ? body.name.substring(0, 500) : undefined,
      description: typeof body.description === 'string' ? body.description.substring(0, 10000) : undefined,
      category: typeof body.category === 'string' ? body.category.substring(0, 200) : undefined,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleCorsPreflightSecure(req);
  const corsHeaders = getSecureCorsHeaders(req);

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) throw new ValidationError('Authentication required');

    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const rawBody = await req.json();
    const { productId, optimizationType, tone, currentData } = validateRequest(rawBody);

    const prompts: Record<string, { system: string; user: string }> = {
      title: {
        system: 'Tu es un expert copywriting e-commerce.',
        user: `Optimise ce titre:\nTitre: ${currentData.name || 'Sans titre'}\nCatégorie: ${currentData.category || ''}\nPrix: ${currentData.price || 0}€\nTon: ${tone}\n\nRègles: 50-80 chars, SEO, ton ${tone}.\nRetourne UNIQUEMENT le nouveau titre.`
      },
      description: {
        system: 'Tu es un expert copywriting e-commerce.',
        user: `Optimise la description:\nProduit: ${currentData.name}\nDescription: ${currentData.description || ''}\nTon: ${tone}\n\nRègles: 150-300 mots, Hook→Caractéristiques→Bénéfices→CTA.\nRetourne en markdown.`
      },
      attributes: {
        system: 'Tu es un expert catégorisation produits e-commerce.',
        user: `Génère des attributs pour:\nNom: ${currentData.name}\nDescription: ${currentData.description || ''}\n\nRetourne JSON: {"material","color","style","brand","target_audience","season","features"}`
      },
      brand: {
        system: 'Tu es un expert identification de marques.',
        user: `Identifie la marque:\nNom: ${currentData.name}\nDescription: ${currentData.description || ''}\n\nRetourne UNIQUEMENT le nom de la marque.`
      },
      category: {
        system: 'Tu es un expert catégorisation e-commerce.',
        user: `Catégorise:\nNom: ${currentData.name}\nDescription: ${currentData.description || ''}\n\nRetourne JSON: {"suggestions":[{"category","subcategory","confidence"}]}`
      },
      seo_meta: {
        system: 'Tu es un expert SEO e-commerce.',
        user: `Meta tags SEO pour:\nTitre: ${currentData.name}\nDescription: ${currentData.description || ''}\n\nRetourne JSON: {"meta_title","meta_description","keywords"}`
      },
    };

    const p = prompts[optimizationType] || prompts.seo_meta;

    const aiResult = await callOpenAI(
      [{ role: 'system', content: p.system }, { role: 'user', content: p.user }],
      { module: 'product', temperature: 0.7, maxTokens: 1000, enableCache: true }
    );

    const generatedContent = aiResult.choices?.[0]?.message?.content?.trim() || '';
    let optimizedResult: any = {};

    if (['title', 'full'].includes(optimizationType)) {
      optimizedResult = { optimized_title: generatedContent };
    } else if (optimizationType === 'description') {
      optimizedResult = { optimized_description: generatedContent };
    } else if (optimizationType === 'brand') {
      optimizedResult = { optimized_brand: generatedContent };
    } else {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        optimizedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_response: generatedContent };
      } catch { optimizedResult = { raw_response: generatedContent }; }
    }

    return new Response(JSON.stringify({ success: true, productId, optimizationType, result: optimizedResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleError(error, corsHeaders);
  }
});
