/**
 * AI Assistant Edge Function - Powered by Lovable AI Gateway
 * Conversational AI for product analysis, strategy, and e-commerce guidance
 * Uses OpenAI GPT-5-nano for fast, intelligent responses
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedMessages = messages.slice(-30).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: typeof msg.content === "string" ? msg.content.substring(0, 6000) : "",
    }));

    const systemPrompt = `Tu es l'Assistant IA de Drop Craft AI, expert en e-commerce et dropshipping. Tu aides les utilisateurs à optimiser leur business.

🎯 TES CAPACITÉS:
1. **Analyse Produit**: Évalue le potentiel d'un produit (marge, demande, concurrence)
2. **Stratégie Pricing**: Recommande des prix optimaux basés sur les marges et le marché
3. **Optimisation SEO**: Génère des titres, descriptions et mots-clés optimisés
4. **Analyse Concurrentielle**: Compare les offres et identifie les opportunités
5. **Conseil Marketing**: Suggère des stratégies publicitaires et de contenu
6. **Gestion Stock**: Conseille sur les seuils de réapprovisionnement
7. **Analyse de Tendances**: Identifie les produits et niches en croissance

📊 CONTEXTE UTILISATEUR:
${context ? JSON.stringify(context) : "Aucun contexte spécifique fourni."}

📝 RÈGLES:
- Réponds en français par défaut (adapte-toi à la langue de l'utilisateur)
- Sois concis et actionnable
- Utilise des emojis pour structurer visuellement
- Fournis des chiffres et des données quand possible
- Propose toujours 2-3 actions concrètes
- Si tu ne sais pas, dis-le honnêtement
- Utilise le markdown pour formater tes réponses`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Rechargez vos crédits dans les paramètres." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
