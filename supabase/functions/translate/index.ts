import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-extension-token",
};

interface TranslationRequest {
  text: string;
  source_lang?: string;
  target_lang: string;
  preserve_formatting?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, source_lang, target_lang, preserve_formatting } = await req.json() as TranslationRequest;

    if (!text || !target_lang) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text and target_lang" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Translate] Translating to ${target_lang}, source: ${source_lang || 'auto'}, length: ${text.length}`);

    // Use Lovable AI for translation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[Translate] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build translation prompt
    const sourceInfo = source_lang ? `from ${source_lang}` : '';
    const formattingNote = preserve_formatting 
      ? 'Preserve all HTML tags, line breaks, and formatting exactly as in the original.'
      : 'Clean up the text but preserve essential formatting.';

    const systemPrompt = `You are a professional translator specializing in e-commerce product content.
Translate the following text ${sourceInfo} to ${target_lang}.
${formattingNote}

Guidelines:
- Maintain the original meaning and tone
- Keep product names, brand names, and technical terms if appropriate
- Adapt units and measurements for the target market if needed
- Make the text sound natural in the target language
- For color names, size labels, and common terms, use the standard translations

Return ONLY the translated text, no explanations or additional text.`;

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
          { role: "user", content: text }
        ],
        max_tokens: Math.max(text.length * 2, 1000),
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Translate] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Translation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const translatedText = aiResponse.choices?.[0]?.message?.content?.trim();

    if (!translatedText) {
      console.error("[Translate] No translation returned from AI");
      return new Response(
        JSON.stringify({ error: "No translation generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Translate] Success, output length: ${translatedText.length}`);

    return new Response(
      JSON.stringify({
        translated_text: translatedText,
        source_lang: source_lang || 'auto',
        target_lang: target_lang,
        original_length: text.length,
        translated_length: translatedText.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Translate] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
