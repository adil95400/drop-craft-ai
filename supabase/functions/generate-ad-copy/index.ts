/**
 * Generate Ad Copy — OpenAI Direct (OPENAI_API_KEY_MARKETING)
 * No Lovable AI gateway dependency
 */
import { callOpenAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, tone, platform, objective, language, targetAudience, uniqueSellingPoints } = await req.json();

    if (!productName) {
      return new Response(JSON.stringify({ error: "productName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
${targetAudience ? `- Audience cible: ${targetAudience}` : ''}
${uniqueSellingPoints ? `- Points forts: ${uniqueSellingPoints}` : ''}

Pour chaque variante, fournis: headline (titre accrocheur, max 40 chars), primary_text (texte principal, max 125 chars), description (description complémentaire, max 30 chars), cta_text (bouton CTA, max 20 chars), angle (l'angle utilisé en 1 mot).`;

    const data = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        module: "marketing",
        model: "gpt-4o-mini",
        temperature: 0.8,
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
      }
    );

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
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
    const status = e.message?.includes('429') ? 429 : e.message?.includes('402') ? 402 : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
