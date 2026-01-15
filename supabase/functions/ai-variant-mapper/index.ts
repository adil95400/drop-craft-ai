import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-extension-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceValues, targetLanguage = 'fr', variantType } = await req.json();

    if (!sourceValues || !Array.isArray(sourceValues) || sourceValues.length === 0) {
      return new Response(
        JSON.stringify({ error: "sourceValues array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageNames: Record<string, string> = {
      fr: "French",
      en: "English",
      de: "German",
      es: "Spanish",
      it: "Italian"
    };

    const targetLang = languageNames[targetLanguage] || "French";

    const systemPrompt = `You are an expert e-commerce variant mapper. Your task is to map product variant values from supplier formats to clean, customer-friendly formats.

Rules:
1. Translate values to ${targetLang} if they are in another language
2. Expand abbreviations (S → Small, M → Medium, L → Large, XL → Extra Large, XXL → Double Extra Large)
3. Standardize size formats with EU/US equivalents when appropriate
4. Clean up color names to be professional and appealing
5. Keep the original value recognizable but improved

Return ONLY a JSON array of mappings, no explanation.`;

    const userPrompt = `Map these variant values to clean ${targetLang} customer-friendly versions:

${JSON.stringify(sourceValues)}

Return format: [{"source": "original", "target": "mapped"}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let mappings = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        mappings = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: create basic mappings
      mappings = sourceValues.map((val: string) => ({
        source: val,
        target: val
      }));
    }

    // Validate and clean mappings
    mappings = mappings.filter((m: any) => m.source && m.target).map((m: any) => ({
      source: String(m.source).trim(),
      target: String(m.target).trim()
    }));

    console.log(`AI Variant Mapper: Mapped ${mappings.length} variants to ${targetLanguage}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        mappings,
        language: targetLanguage,
        count: mappings.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Variant Mapper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
