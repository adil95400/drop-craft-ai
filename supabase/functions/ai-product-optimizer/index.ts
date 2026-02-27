import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/secure-cors.ts';
import { handleError, ValidationError } from '../_shared/error-handler.ts';

// Allowed optimization types
const VALID_OPTIMIZATION_TYPES = ['title', 'description', 'attributes', 'seo_meta', 'category', 'brand', 'full'] as const;
const VALID_TONES = ['professional', 'casual', 'luxury', 'technical'] as const;
const VALID_SOURCES = ['products', 'imported_products', 'supplier_products'] as const;

function validateRequest(body: any) {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a JSON object');
  }

  // productId is optional for legacy support but must be string if present
  if (body.productId !== undefined && typeof body.productId !== 'string') {
    throw new ValidationError('productId must be a string');
  }

  if (body.optimizationType && !VALID_OPTIMIZATION_TYPES.includes(body.optimizationType)) {
    throw new ValidationError(`optimizationType must be one of: ${VALID_OPTIMIZATION_TYPES.join(', ')}`);
  }

  if (body.tone && !VALID_TONES.includes(body.tone)) {
    throw new ValidationError(`tone must be one of: ${VALID_TONES.join(', ')}`);
  }

  if (body.productSource && !VALID_SOURCES.includes(body.productSource)) {
    throw new ValidationError(`productSource must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  // Validate currentData if present
  if (body.currentData) {
    if (typeof body.currentData !== 'object') {
      throw new ValidationError('currentData must be an object');
    }
    if (body.currentData.name && typeof body.currentData.name !== 'string') {
      throw new ValidationError('currentData.name must be a string');
    }
    if (body.currentData.name && body.currentData.name.length > 500) {
      throw new ValidationError('currentData.name must be less than 500 characters');
    }
    if (body.currentData.description && typeof body.currentData.description !== 'string') {
      throw new ValidationError('currentData.description must be a string');
    }
    if (body.currentData.description && body.currentData.description.length > 10000) {
      throw new ValidationError('currentData.description must be less than 10000 characters');
    }
    if (body.currentData.price !== undefined && (typeof body.currentData.price !== 'number' || body.currentData.price < 0)) {
      throw new ValidationError('currentData.price must be a non-negative number');
    }
  }

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req);
  }

  const corsHeaders = getSecureCorsHeaders(req);

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[AI-OPTIMIZER] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate auth header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ValidationError('Authentication required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[AI-OPTIMIZER] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Validate and parse request
    const rawBody = await req.json();
    const { productId, productSource, optimizationType, tone, currentData } = validateRequest(rawBody);

    console.log(`[AI-OPTIMIZER] Optimizing ${optimizationType} for user ${userId}`);

    let systemPrompt = '';
    let userPrompt = '';

    // Build prompts based on optimization type
    if (optimizationType === 'title' || optimizationType === 'full') {
      systemPrompt = `Tu es un expert en copywriting e-commerce. Ton rôle est d'optimiser les titres de produits pour maximiser le SEO et les conversions.`;
      userPrompt = `Optimise ce titre de produit e-commerce:\n\nTitre actuel: ${currentData.name || 'Sans titre'}\nCatégorie: ${currentData.category || 'Non catégorisé'}\nPrix: ${currentData.price || 0}€\nTon souhaité: ${tone}\n\nRègles:\n- 50-80 caractères maximum\n- Inclure le bénéfice principal\n- Mots-clés SEO naturels\n- Clair et descriptif\n- Tone ${tone}\n\nRetourne UNIQUEMENT le nouveau titre optimisé, sans guillemets ni explications.`;
    } else if (optimizationType === 'description') {
      systemPrompt = `Tu es un expert en copywriting e-commerce.`;
      userPrompt = `Optimise cette description de produit e-commerce:\n\nProduit: ${currentData.name || 'Sans titre'}\nDescription actuelle: ${currentData.description || 'Sans description'}\nCatégorie: ${currentData.category || 'Non catégorisé'}\nPrix: ${currentData.price || 0}€\nTon souhaité: ${tone}\n\nRègles:\n- 150-300 mots\n- Structure: Hook → Caractéristiques → Bénéfices → CTA\n- Ton ${tone}\n\nRetourne UNIQUEMENT la nouvelle description optimisée en markdown.`;
    } else if (optimizationType === 'attributes') {
      systemPrompt = `Tu es un expert en catégorisation et attributs produits e-commerce.`;
      userPrompt = `Génère des attributs structurés pour ce produit:\n\nNom: ${currentData.name || 'Sans nom'}\nDescription: ${currentData.description || 'Sans description'}\nCatégorie: ${currentData.category || 'Non catégorisé'}\n\nRetourne UNIQUEMENT un JSON: {"material":"...","color":"...","style":"...","brand":"...","target_audience":"...","season":"...","features":["...","..."]}`;
    } else if (optimizationType === 'brand') {
      systemPrompt = `Tu es un expert en identification de marques e-commerce.`;
      userPrompt = `Identifie la marque pour ce produit:\n\nNom: ${currentData.name || 'Sans nom'}\nDescription: ${currentData.description || 'Sans description'}\nCatégorie: ${currentData.category || 'Non catégorisé'}\n\nRetourne UNIQUEMENT le nom de la marque.`;
    } else if (optimizationType === 'category') {
      systemPrompt = `Tu es un expert en catégorisation e-commerce.`;
      userPrompt = `Catégorise ce produit:\n\nNom: ${currentData.name || 'Sans nom'}\nDescription: ${currentData.description || 'Sans description'}\nPrix: ${currentData.price || 0}€\n\nRetourne UNIQUEMENT un JSON: {"suggestions":[{"category":"...","subcategory":"...","confidence":0.95}]}`;
    } else {
      systemPrompt = `Tu es un expert SEO e-commerce.`;
      userPrompt = `Génère des meta tags SEO pour:\n\nTitre: ${currentData.name || 'Sans titre'}\nDescription: ${currentData.description || 'Sans description'}\nCatégorie: ${currentData.category || 'Non catégorisé'}\n\nRetourne UNIQUEMENT un JSON: {"meta_title":"...","meta_description":"...","keywords":["..."]}`;
    }

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('[AI-OPTIMIZER] AI Gateway error:', response.status);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes IA atteinte.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA insuffisants.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Service IA temporairement indisponible' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices?.[0]?.message?.content?.trim() || '';

    let optimizedResult: any = {};
    
    if (optimizationType === 'title' || optimizationType === 'full') {
      optimizedResult = { optimized_title: generatedContent };
    } else if (optimizationType === 'description') {
      optimizedResult = { optimized_description: generatedContent };
    } else if (optimizationType === 'brand') {
      optimizedResult = { optimized_brand: generatedContent };
    } else if (['attributes', 'seo_meta', 'category'].includes(optimizationType)) {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          optimizedResult = JSON.parse(jsonMatch[0]);
        } else {
          optimizedResult = { raw_response: generatedContent };
        }
      } catch {
        optimizedResult = { raw_response: generatedContent };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        productId,
        optimizationType,
        result: optimizedResult,
        message: 'Optimization completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return handleError(error, corsHeaders);
  }
});