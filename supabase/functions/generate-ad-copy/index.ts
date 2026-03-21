import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, tone, platform, objective, language } = await req.json();

    if (!productName) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Tu es un expert en copywriting publicitaire digital avec 15 ans d'expérience sur Meta Ads, Google Ads, TikTok Ads et Instagram.

Tu génères des textes publicitaires hautement convertissants. Tu maîtrises les frameworks AIDA, PAS, BAB et les techniques de persuasion.

Règles:
- Chaque variante doit avoir un angle DIFFÉRENT (émotion, preuve sociale, urgence, bénéfice, curiosité)
- Inclure des emojis pertinents mais pas excessifs
- Respecter les limites de caractères de la plateforme
- Inclure un CTA clair et actionnable
- Adapter le ton demandé
- Répondre en ${language || 'français'}

Retourne exactement le JSON demandé via l'outil, pas de texte autour.`;

    const userPrompt = `Génère 5 variantes de texte publicitaire pour:
- Produit/Offre: ${productName}
- Ton: ${tone || 'Professionnel'}
- Plateforme: ${platform || 'Meta Ads'}
- Objectif: ${objective || 'Conversions'}

Pour chaque variante, fournis: headline (titre accrocheur, max 40 chars), primary_text (texte principal, max 125 chars), description (description complémentaire, max 30 chars), cta_text (bouton CTA, max 20 chars), angle (l'angle utilisé en 1 mot).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_ad_copies",
            description: "Return generated ad copy variants",
            parameters: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headline: { type: "string" },
                      primary_text: { type: "string" },
                      description: { type: "string" },
                      cta_text: { type: "string" },
                      angle: { type: "string" },
                    },
                    required: ["headline", "primary_text", "description", "cta_text", "angle"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variants"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_ad_copies" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants. Ajoutez des crédits dans Paramètres > Workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      // Fallback: try to parse content directly
      const content = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ variants: [], raw: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const variants = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(variants), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ad-copy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
