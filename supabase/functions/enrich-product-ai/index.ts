import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIEnrichmentRequest {
  product_id: string;
  enrichment_id?: string;
}

interface AIOutput {
  optimized_title: string;
  optimized_description: string;
  bullets: string[];
  seo_tags: string[];
  suggested_images: string[];
  attributes_normalized: Record<string, any>;
  meta_title: string;
  meta_description: string;
}

async function generateAIContent(
  product: any,
  enrichmentData: any
): Promise<AIOutput> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return generateFallbackContent(product, enrichmentData);
  }

  const systemPrompt = `Tu es un expert en e-commerce et en optimisation de fiches produits. 
Tu dois générer du contenu optimisé, unique et SEO-friendly pour des produits e-commerce.
Tu dois TOUJOURS répondre en JSON valide avec la structure exacte demandée.
Ne copie jamais le contenu brut, réécris tout de manière originale et optimisée.`;

  const userPrompt = `Analyse ces données et génère une fiche produit optimisée en JSON:

PRODUIT ORIGINAL:
- Nom: ${product.name || 'Non spécifié'}
- Description: ${product.description || 'Non spécifiée'}
- Prix: ${product.price || 'Non spécifié'}€
- Catégorie: ${product.category || 'Non spécifiée'}
- Marque: ${product.vendor || 'Non spécifiée'}

DONNÉES MARKETPLACE (${enrichmentData?.source || 'marketplace'}):
- Titre: ${enrichmentData?.raw_title || 'N/A'}
- Description: ${enrichmentData?.raw_description || 'N/A'}
- Prix marché: ${enrichmentData?.raw_price || 'N/A'}€
- Note: ${enrichmentData?.raw_rating || 'N/A'}/5 (${enrichmentData?.raw_reviews_count || 0} avis)
- Attributs: ${JSON.stringify(enrichmentData?.raw_attributes || {})}

Génère une réponse JSON avec cette structure EXACTE:
{
  "optimized_title": "Titre optimisé SEO (max 80 caractères)",
  "optimized_description": "Description riche et engageante (200-500 mots)",
  "bullets": ["Point fort 1", "Point fort 2", "Point fort 3", "Point fort 4", "Point fort 5"],
  "seo_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggested_images": ["description image 1", "description image 2"],
  "attributes_normalized": {"couleur": "valeur", "taille": "valeur", "matière": "valeur"},
  "meta_title": "Meta title SEO (max 60 caractères)",
  "meta_description": "Meta description SEO (max 160 caractères)"
}`;

  try {
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status, await response.text());
      return generateFallbackContent(product, enrichmentData);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return generateFallbackContent(product, enrichmentData);
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        optimized_title: parsed.optimized_title || product.name,
        optimized_description: parsed.optimized_description || product.description,
        bullets: parsed.bullets || [],
        seo_tags: parsed.seo_tags || [],
        suggested_images: parsed.suggested_images || [],
        attributes_normalized: parsed.attributes_normalized || {},
        meta_title: parsed.meta_title || parsed.optimized_title,
        meta_description: parsed.meta_description || '',
      };
    }

    return generateFallbackContent(product, enrichmentData);
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackContent(product, enrichmentData);
  }
}

function generateFallbackContent(product: any, enrichmentData: any): AIOutput {
  const name = product.name || enrichmentData?.raw_title || 'Produit';
  const category = product.category || 'Général';
  const brand = product.vendor || enrichmentData?.raw_attributes?.brand || 'Marque Premium';
  
  return {
    optimized_title: `${name} | ${brand} - Qualité Premium`,
    optimized_description: `Découvrez le ${name} de ${brand}. ${product.description || enrichmentData?.raw_description || 'Un produit de qualité exceptionnelle.'} Profitez d'une expérience d'achat unique avec notre garantie satisfaction. Livraison rapide et service client dédié.`,
    bullets: [
      '✓ Qualité premium garantie',
      '✓ Livraison rapide sous 48-72h',
      '✓ Service client réactif',
      '✓ Satisfaction garantie ou remboursé',
      '✓ Produit authentique certifié',
    ],
    seo_tags: [category.toLowerCase(), brand.toLowerCase(), 'qualité', 'premium', 'livraison rapide'],
    suggested_images: ['Image principale sur fond blanc', 'Image lifestyle en situation'],
    attributes_normalized: {
      marque: brand,
      catégorie: category,
      ...enrichmentData?.raw_attributes,
    },
    meta_title: `${name} | Achat ${brand} - Livraison Rapide`,
    meta_description: `${name} de ${brand}. Qualité garantie, livraison rapide. Découvrez notre sélection premium et profitez des meilleurs prix.`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { product_id, enrichment_id }: AIEnrichmentRequest = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: 'product_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting AI enrichment for product ${product_id}`);

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch best enrichment data (prioritize by success status and rating)
    let enrichmentData = null;
    
    if (enrichment_id) {
      const { data } = await supabase
        .from('product_enrichment')
        .select('*')
        .eq('id', enrichment_id)
        .single();
      enrichmentData = data;
    } else {
      const { data } = await supabase
        .from('product_enrichment')
        .select('*')
        .eq('product_id', product_id)
        .eq('enrichment_status', 'success')
        .order('raw_rating', { ascending: false, nullsFirst: false })
        .limit(1)
        .single();
      enrichmentData = data;
    }

    // Generate AI content
    const aiOutput = await generateAIContent(product, enrichmentData);

    // Update enrichment record with AI output
    if (enrichmentData?.id) {
      await supabase
        .from('product_enrichment')
        .update({
          ai_output: aiOutput,
          enrichment_status: 'success',
        })
        .eq('id', enrichmentData.id);
    } else {
      // Create new enrichment record with AI output only
      await supabase
        .from('product_enrichment')
        .insert({
          product_id,
          user_id: user.id,
          source: 'ai_only',
          matched_via: 'manual',
          ai_output: aiOutput,
          enrichment_status: 'success',
        });
    }

    return new Response(JSON.stringify({
      success: true,
      product_id,
      ai_output: aiOutput,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI enrichment error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
