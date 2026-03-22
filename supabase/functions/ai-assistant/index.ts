/**
 * AI Assistant — Streaming via Unified AI Client
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callOpenAI } from '../_shared/ai-client.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitizedMessages = messages.slice(-30).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" as const : "user" as const,
      content: typeof msg.content === "string" ? msg.content.substring(0, 6000) : "",
    }));

    const systemPrompt = `Tu es l'Assistant IA de Drop Craft AI, expert en e-commerce et dropshipping.

🎯 TES CAPACITÉS:
1. Analyse Produit: Évalue le potentiel d'un produit
2. Stratégie Pricing: Recommande des prix optimaux
3. Optimisation SEO: Génère des titres, descriptions optimisés
4. Analyse Concurrentielle: Compare et identifie les opportunités
5. Conseil Marketing: Stratégies publicitaires et de contenu
6. Gestion Stock: Seuils de réapprovisionnement
7. Analyse de Tendances: Produits et niches en croissance

📊 CONTEXTE: ${context ? JSON.stringify(context) : "Aucun contexte spécifique."}

📝 RÈGLES:
- Français par défaut
- Concis et actionnable avec emojis
- Chiffres et données quand possible
- 2-3 actions concrètes toujours
- Markdown pour le formatage`;

    const response = await callOpenAI(
      [{ role: 'system', content: systemPrompt }, ...sanitizedMessages],
      { module: 'chat', stream: true }
    );

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    const status = (e as any).status || 500;
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (status === 429) {
      return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
