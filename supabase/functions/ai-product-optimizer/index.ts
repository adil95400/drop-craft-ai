import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizeRequest {
  productId: string;
  productSource: 'products' | 'imported_products' | 'supplier_products';
  optimizationType: 'title' | 'description' | 'attributes' | 'seo_meta' | 'full';
  tone?: 'professional' | 'casual' | 'luxury' | 'technical';
  currentData: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    [key: string]: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Validate auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[AI-OPTIMIZER] No valid authorization header');
      throw new Error('User not authenticated');
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

    // Validate user authentication using getUser()
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('[AI-OPTIMIZER] Auth error:', authError);
      throw new Error('User not authenticated');
    }

    const userId = user.id;
    console.log('[AI-OPTIMIZER] Authenticated user:', userId);

    const {
      productId,
      productSource,
      optimizationType,
      tone = 'professional',
      currentData
    }: OptimizeRequest = await req.json();

    console.log(`[AI-OPTIMIZER] Optimizing ${optimizationType} for product ${productId}`);

    let systemPrompt = '';
    let userPrompt = '';
    let optimizedResult: any = {};

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
    }

    if (optimizationType === 'description' || optimizationType === 'full') {
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
    }

    if (optimizationType === 'attributes') {
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
    }

    if (optimizationType === 'seo_meta') {
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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content.trim();

    console.log('[AI-OPTIMIZER] Generated content:', generatedContent);

    // Parse response based on type
    if (optimizationType === 'title') {
      optimizedResult = { optimized_title: generatedContent };
    } else if (optimizationType === 'description') {
      optimizedResult = { optimized_description: generatedContent };
    } else if (optimizationType === 'attributes' || optimizationType === 'seo_meta') {
      try {
        // Extract JSON from response
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          optimizedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from AI');
        }
      } catch (e) {
        console.error('JSON parsing error:', e);
        optimizedResult = { raw_response: generatedContent };
      }
    } else if (optimizationType === 'full') {
      // For full optimization, make multiple calls (simplified for now)
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
    console.error('Error in ai-product-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
