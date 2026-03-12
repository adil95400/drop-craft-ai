import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, review_ids, target_language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reviews
    let query = admin
      .from("product_reviews")
      .select("id, text, author, rating, verified_purchase, source_platform, country, helpful_count, review_date, images")
      .eq("user_id", user.id);

    if (review_ids && review_ids.length > 0) {
      query = query.in("id", review_ids);
    }

    const { data: reviews, error: fetchError } = await query.limit(30);
    if (fetchError) throw fetchError;
    if (!reviews || reviews.length === 0) {
      return new Response(JSON.stringify({ results: [], summary: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "fake_detection") {
      systemPrompt = `You are a review fraud detection expert. Analyze reviews and detect potential fake ones.
For each review, return a JSON object with:
- id: the review ID
- fake_score: 0-100 (0=genuine, 100=definitely fake)
- sentiment: "positive" | "neutral" | "negative"  
- flags: array of detected issues (e.g. "generic_language", "no_product_details", "suspicious_pattern", "copy_paste", "incentivized", "competitor_attack")
- confidence: 0-100
- summary: short explanation in French

Also return a global summary object with:
- total_analyzed: number
- suspicious_count: number (score > 60)
- average_fake_score: number
- recommendation: string in French`;

      userPrompt = `Analyze these ${reviews.length} reviews for authenticity:\n\n${reviews.map((r, i) => 
        `[${i + 1}] ID: ${r.id}\nAuthor: ${r.author}\nRating: ${r.rating}/5\nVerified: ${r.verified_purchase}\nPlatform: ${r.source_platform}\nText: "${r.text?.substring(0, 300)}"\n`
      ).join("\n")}`;

    } else if (action === "sentiment_analysis") {
      systemPrompt = `You are a sentiment analysis expert for product reviews. Analyze the sentiment and extract key themes.
Return JSON with:
- reviews: array of { id, sentiment: "positive"|"neutral"|"negative", emotion: string, key_themes: string[], actionable_insight: string (in French) }
- summary: { positive_pct, neutral_pct, negative_pct, top_themes: [{theme, count, sentiment}], overall_mood: string, recommendations: string[] (in French) }`;

      userPrompt = `Analyze sentiment for these ${reviews.length} reviews:\n\n${reviews.map((r, i) =>
        `[${i + 1}] ID: ${r.id}\nRating: ${r.rating}/5\nText: "${r.text?.substring(0, 300)}"\n`
      ).join("\n")}`;

    } else if (action === "translate") {
      const lang = target_language || "en";
      systemPrompt = `You are a professional translator. Translate review texts to ${lang}. Return JSON array of { id, original_text, translated_text }.`;
      userPrompt = `Translate these reviews:\n\n${reviews.map((r, i) =>
        `[${i + 1}] ID: ${r.id}\nText: "${r.text?.substring(0, 500)}"\n`
      ).join("\n")}`;

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use: fake_detection, sentiment_analysis, translate" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_analysis",
              description: "Return the analysis results",
              parameters: {
                type: "object",
                properties: {
                  reviews: {
                    type: "array",
                    items: { type: "object", additionalProperties: true },
                  },
                  summary: { type: "object", additionalProperties: true },
                },
                required: ["reviews"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite IA atteinte. Réessayez dans quelques minutes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { reviews: [], summary: null };

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse AI response");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-review-analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
