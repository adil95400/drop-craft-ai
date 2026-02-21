import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  productId: string;
  productSource?: 'products' | 'imported_products' | 'supplier_products';
  optimizationType?: 'title' | 'description' | 'attributes' | 'seo_meta' | 'category' | 'full';
  tone?: 'professional' | 'casual' | 'luxury' | 'technical';
  currentData?: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    [key: string]: any;
  };
  // Legacy support
  name?: string;
  description?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
      console.error('[AI-OPTIMIZER] No valid authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Validate JWT token
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
    console.log('[AI-OPTIMIZER] Authenticated user:', userId);

    const requestBody: OptimizeRequest = await req.json();
    
    // Support both old and new request formats
    const productId = requestBody.productId;
    const productSource = requestBody.productSource || 'products';
    const optimizationType = requestBody.optimizationType || 'seo_meta';
    const tone = requestBody.tone || 'professional';
    const currentData = requestBody.currentData || {
      name: requestBody.name,
      description: requestBody.description,
      category: requestBody.category,
    };

    console.log(`[AI-OPTIMIZER] Optimizing ${optimizationType} for product ${productId}`);

    let systemPrompt = '';
    let userPrompt = '';

    // Build prompts based on optimization type
    if (optimizationType === 'title' || optimizationType === 'full') {
      systemPrompt = `Tu es un expert en copywriting e-commerce. Ton rôle est d'optimiser les titres de produits pour maximiser le SEO et les conversions.`;
      
      userPrompt = `Optimise ce titre de produit e-commerce:

Titre actuel: ${currentData.name || 'Sans titre'}
Catégorie: ${currentData.category || 'Non catégorisé'}
Prix: ${currentData.price || 0}€
Ton souhaité: ${tone}

Règles:
- 50-80 caractères maximum
- Inclure le bénéfice principal
- Mots-clés SEO naturels
- Clair et descriptif
- Tone ${tone}

Retourne UNIQUEMENT le nouveau titre optimisé, sans guillemets ni explications.`;
    } else if (optimizationType === 'description') {
      systemPrompt = `Tu es un expert en copywriting e-commerce. Ton rôle est d'optimiser les descriptions de produits pour maximiser le SEO et les conversions.`;
      
      userPrompt = `Optimise cette description de produit e-commerce:

Produit: ${currentData.name || 'Sans titre'}
Description actuelle: ${currentData.description || 'Sans description'}
Catégorie: ${currentData.category || 'Non catégorisé'}
Prix: ${currentData.price || 0}€
Ton souhaité: ${tone}

Règles:
- 150-300 mots
- Structure: Hook engageant → Caractéristiques → Bénéfices → Call-to-action
- Paragraphes courts et aérés
- Points forts en listes à puces
- Ton ${tone}
- Optimisée pour la conversion et le SEO

Retourne UNIQUEMENT la nouvelle description optimisée en markdown.`;
    } else if (optimizationType === 'attributes') {
      systemPrompt = `Tu es un expert en catégorisation et attributs produits e-commerce. Tu génères des attributs structurés précis.`;
      
      userPrompt = `Génère des attributs structurés pour ce produit:

Nom: ${currentData.name || 'Sans nom'}
Description: ${currentData.description || 'Sans description'}
Catégorie: ${currentData.category || 'Non catégorisé'}

Génère et retourne UNIQUEMENT un JSON avec cette structure:
{
  "material": "...",
  "color": "...",
  "style": "...",
  "brand": "...",
  "target_audience": "...",
  "season": "...",
  "features": ["...", "..."]
}`;
    } else if (optimizationType === 'category') {
      systemPrompt = `Tu es un expert en catégorisation e-commerce. Tu analyses les produits et suggères les catégories les plus pertinentes parmi les catégories standard du e-commerce.`;
      
      userPrompt = `Catégorise ce produit e-commerce:

Nom: ${currentData.name || 'Sans nom'}
Description: ${currentData.description || 'Sans description'}
Prix: ${currentData.price || 0}€

Retourne UNIQUEMENT un JSON avec cette structure exacte (pas de texte autour):
{
  "suggestions": [
    { "category": "Catégorie principale", "subcategory": "Sous-catégorie", "confidence": 0.95 },
    { "category": "Catégorie alternative", "subcategory": "Sous-catégorie", "confidence": 0.80 }
  ]
}

Donne 2 à 3 suggestions avec des scores de confiance réalistes.`;
    } else {
      // Default: seo_meta
      systemPrompt = `Tu es un expert SEO e-commerce. Tu optimises les meta tags pour le référencement.`;
      
      userPrompt = `Génère des meta tags SEO optimisés pour ce produit:

Titre: ${currentData.name || 'Sans titre'}
Description: ${currentData.description || 'Sans description'}
Catégorie: ${currentData.category || 'Non catégorisé'}

Génère et retourne UNIQUEMENT un JSON avec:
{
  "meta_title": "... (max 60 caractères, inclure mots-clés)",
  "meta_description": "... (max 160 caractères, incitatif)",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"]
}`;
    }

    // Call Lovable AI Gateway (free, no API key needed from user)
    console.log('[AI-OPTIMIZER] Calling Lovable AI Gateway...');
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
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-OPTIMIZER] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes IA atteinte. Réessayez dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA insuffisants. Contactez le support.' }),
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

    console.log('[AI-OPTIMIZER] Generated content length:', generatedContent.length);

    // Parse response based on type
    let optimizedResult: any = {};
    
    if (optimizationType === 'title') {
      optimizedResult = { optimized_title: generatedContent };
    } else if (optimizationType === 'description') {
      optimizedResult = { optimized_description: generatedContent };
    } else if (optimizationType === 'attributes' || optimizationType === 'seo_meta' || optimizationType === 'category') {
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          optimizedResult = JSON.parse(jsonMatch[0]);
        } else {
          optimizedResult = { raw_response: generatedContent };
        }
      } catch (e) {
        console.error('[AI-OPTIMIZER] JSON parsing error:', e);
        optimizedResult = { raw_response: generatedContent };
      }
    } else if (optimizationType === 'full') {
      optimizedResult = {
        optimized_title: generatedContent,
        note: 'Full optimization requires multiple API calls - use specific types for best results'
      };
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
    console.error('[AI-OPTIMIZER] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur inattendue est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
