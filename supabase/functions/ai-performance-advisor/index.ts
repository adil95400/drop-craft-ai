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
    const { snapshot } = await req.json();

    const prompt = `Tu es un expert en performance web. Analyse ces métriques et donne exactement 3 à 6 recommandations JSON.

Métriques:
${JSON.stringify(snapshot, null, 2)}

Réponds UNIQUEMENT avec un JSON array:
[
  {
    "title": "titre court",
    "description": "explication détaillée avec chiffres",
    "impact": "critical|high|medium|low",
    "category": "Bundle|Images|Réseau|Mémoire|Rendu|Cache",
    "effort": "Faible|Moyen|Élevé"
  }
]`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY_CHAT") || Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, recommendations: [] }), {
      status: 200, // Return 200 so frontend can use fallback
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
