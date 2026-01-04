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
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Support both old and new API format
    const { 
      type, 
      prompt, 
      language = "fr", 
      keywords = [],
      // New format params
      action,
      content,
      tone,
      contentType 
    } = body;

    let systemPrompt = "";
    let userPrompt = "";

    // Handle new format (from AIContentAssistant)
    if (action) {
      const langName = language === 'fr' ? 'français' : 
                       language === 'en' ? 'anglais' : 
                       language === 'es' ? 'espagnol' : 
                       language === 'de' ? 'allemand' : 'italien';
      
      systemPrompt = `Tu es un expert en création de contenu marketing et SEO. Tu réponds toujours en ${langName}.`;
      
      const toneInstructions: Record<string, string> = {
        professional: 'Utilise un ton professionnel et sérieux.',
        casual: 'Utilise un ton décontracté et accessible.',
        enthusiastic: 'Utilise un ton enthousiaste et dynamique.',
        persuasive: 'Utilise un ton persuasif et convaincant.',
        informative: 'Utilise un ton informatif et éducatif.',
        friendly: 'Utilise un ton amical et chaleureux.'
      };

      systemPrompt += ` ${toneInstructions[tone] || toneInstructions.professional}`;

      const contentTypeInstructions: Record<string, string> = {
        blog: 'Crée du contenu optimisé pour les articles de blog avec des titres, sous-titres et paragraphes bien structurés.',
        description: 'Crée des descriptions de produits engageantes qui mettent en avant les bénéfices.',
        social: 'Crée du contenu adapté aux réseaux sociaux, concis et engageant avec des emojis appropriés.',
        email: 'Crée du contenu pour emails marketing avec un objet accrocheur et un call-to-action clair.',
        seo: 'Crée du contenu optimisé pour le référencement naturel avec les mots-clés appropriés.'
      };

      systemPrompt += ` ${contentTypeInstructions[contentType] || ''}`;

      switch (action) {
        case 'generate':
          userPrompt = `Génère du contenu basé sur ces instructions: ${prompt}`;
          break;
        case 'improve':
          userPrompt = `Améliore ce texte en le rendant plus engageant et professionnel:\n\n${content}\n\nInstructions supplémentaires: ${prompt || 'Améliore la clarté et l\'impact.'}`;
          break;
        case 'expand':
          userPrompt = `Développe et enrichis ce contenu avec plus de détails:\n\n${content}\n\nPoints à développer: ${prompt || 'Ajoute des exemples, des données et des arguments.'}`;
          break;
        case 'summarize':
          userPrompt = `Résume ce contenu de manière concise tout en gardant l'essentiel:\n\n${content}\n\nInstructions: ${prompt || 'Garde les points clés.'}`;
          break;
        case 'translate':
          userPrompt = `Traduis ce contenu en ${langName}:\n\n${content}`;
          break;
        case 'ideas':
          userPrompt = `Génère 5 idées de contenu créatives sur ce sujet: ${prompt || content || 'marketing digital'}. Pour chaque idée, donne un titre accrocheur et une brève description.`;
          break;
        default:
          userPrompt = prompt || 'Génère du contenu marketing engageant.';
      }
    } else {
      // Handle old format (from ProductDescriptionGenerator etc.)
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
      type: type || action,
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
