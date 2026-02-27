import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "insights") {
      systemPrompt = `Tu es un expert en analyse de données e-commerce et dropshipping. 
Tu analyses les prédictions fournies et génères des insights actionnables.
Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.`;

      userPrompt = `Analyse ces prédictions et génère 3-5 insights stratégiques:
${JSON.stringify(context?.predictions || [], null, 2)}

Réponds avec ce format JSON exact:
{
  "insights": [
    {
      "category": "Opportunité|Risque|Optimisation",
      "priority": "high|medium|low",
      "title": "Titre court",
      "description": "Description détaillée",
      "impact": "Impact chiffré estimé",
      "action": "Action recommandée"
    }
  ]
}`;
    } else {
      systemPrompt = `Tu es un système de prédiction e-commerce. 
Génère des prédictions réalistes basées sur des tendances typiques du dropshipping.
Réponds UNIQUEMENT avec un JSON valide.`;

      userPrompt = `Génère 4 prédictions pour les 30 prochains jours:
1. Chiffre d'affaires (revenue)
2. Nombre de commandes (orders)  
3. Nouveaux clients (customers)
4. Risques de rupture de stock (inventory)

Format JSON:
{
  "predictions": [
    {
      "id": "1",
      "type": "revenue|orders|customers|inventory",
      "title": "Titre",
      "currentValue": number,
      "predictedValue": number,
      "changePercent": number,
      "confidence": number (60-95),
      "timeframe": "30 jours",
      "insight": "Analyse courte",
      "recommendation": "Action recommandée"
    }
  ]
}`;
    }

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-predictions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
