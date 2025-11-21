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
    const { productName, category, features, targetAudience, tone = 'professional' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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
          { 
            role: 'system', 
            content: 'Tu es un expert en rédaction de descriptions produits e-commerce. Fournis des descriptions persuasives et optimisées SEO.' 
          },
          { 
            role: 'user', 
            content: `Génère une description produit complète pour un produit e-commerce.

Nom du produit: ${productName}
Catégorie: ${category}
Caractéristiques: ${features?.join(', ') || 'N/A'}
Public cible: ${targetAudience || 'Grand public'}
Ton: ${tone}

Fournis une réponse structurée avec:
- Un titre accrocheur et optimisé SEO
- Une courte description (50-60 caractères) pour attirer l'attention
- Une description complète (150-200 mots) persuasive
- 3-5 points clés/bénéfices du produit
- 3-5 mots-clés SEO pertinents` 
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_product_description",
              description: "Génère une description produit structurée",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Titre optimisé du produit"
                  },
                  shortDescription: {
                    type: "string",
                    description: "Description courte accrocheuse"
                  },
                  fullDescription: {
                    type: "string",
                    description: "Description complète persuasive"
                  },
                  bulletPoints: {
                    type: "array",
                    items: { type: "string" },
                    description: "Points clés et bénéfices"
                  },
                  seoKeywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "Mots-clés SEO"
                  }
                },
                required: ["title", "shortDescription", "fullDescription", "bulletPoints", "seoKeywords"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_product_description" } }
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
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error('Erreur Lovable AI');
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    let parsedContent;
    if (toolCall?.function?.arguments) {
      parsedContent = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback si pas de tool call
      const content = data.choices[0].message.content;
      parsedContent = {
        title: productName,
        shortDescription: content.substring(0, 100),
        fullDescription: content,
        bulletPoints: features || [],
        seoKeywords: [category, productName]
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
