import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, language = "fr", keywords = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "product_description":
        systemPrompt = `Tu es un expert en rédaction de descriptions produits pour le e-commerce en dropshipping. Crée des descriptions persuasives, optimisées SEO et qui convertissent. Utilise un ton professionnel mais accessible en ${language}.`;
        userPrompt = `Écris une description produit complète pour: ${prompt}\n\nMots-clés à inclure: ${keywords.join(", ")}\n\nInclus:\n- Titre accrocheur\n- Description détaillée (200-300 mots)\n- Points clés/bénéfices\n- Appel à l'action\n- Balises SEO suggestions`;
        break;

      case "blog_article":
        systemPrompt = `Tu es un rédacteur expert en contenu de blog pour le e-commerce et dropshipping. Crée des articles informatifs, engaging et optimisés SEO en ${language}.`;
        userPrompt = `Écris un article de blog complet sur: ${prompt}\n\nMots-clés: ${keywords.join(", ")}\n\nStructure:\n- Titre SEO (H1)\n- Introduction accrocheuse\n- Sous-titres (H2, H3)\n- Contenu détaillé (800-1200 mots)\n- Conclusion avec CTA\n- Meta description`;
        break;

      case "seo_content":
        systemPrompt = `Tu es un spécialiste SEO. Génère du contenu optimisé pour les moteurs de recherche en ${language}, avec une densité de mots-clés naturelle.`;
        userPrompt = `Crée du contenu SEO pour: ${prompt}\n\nMots-clés principaux: ${keywords.join(", ")}\n\nFournis:\n- Titre SEO optimisé\n- Meta description (155 caractères max)\n- Contenu principal (500-800 mots)\n- Suggestions de mots-clés longue traîne\n- Structure Hn recommandée`;
        break;

      case "ad_copy":
        systemPrompt = `Tu es un copywriter spécialisé en publicités e-commerce. Crée des textes publicitaires qui convertissent pour Facebook Ads, Google Ads en ${language}.`;
        userPrompt = `Crée plusieurs versions de copy publicitaire pour: ${prompt}\n\nMots-clés: ${keywords.join(", ")}\n\nInclus:\n- 3 headlines accrocheurs\n- 2 descriptions courtes (90 caractères)\n- 2 descriptions longues (200 caractères)\n- CTA suggérés\n- Angles marketing différents`;
        break;

      case "email_marketing":
        systemPrompt = `Tu es un expert en email marketing pour le e-commerce. Crée des emails qui engagent et convertissent en ${language}.`;
        userPrompt = `Crée une série d'emails marketing pour: ${prompt}\n\nMots-clés: ${keywords.join(", ")}\n\nFournis:\n- Objet email accrocheur\n- Email de bienvenue\n- Email promotionnel\n- Email de relance panier abandonné\n- Personnalisation suggérée`;
        break;

      default:
        systemPrompt = `Tu es un assistant IA spécialisé en contenu e-commerce et marketing digital en ${language}.`;
        userPrompt = prompt;
    }

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
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit atteint. Veuillez réessayer plus tard.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Crédits insuffisants. Veuillez recharger votre compte.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const error = await response.text();
      console.error('Lovable AI error:', response.status, error);
      throw new Error('Erreur Lovable AI');
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      content: generatedContent,
      type,
      language,
      keywords,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in AI content generator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
