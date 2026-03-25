/**
 * AI Review Analysis — Unified AI Client
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { callOpenAI } from '../_shared/ai-client.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action, review_ids, target_language } = await req.json();

    let query = admin.from("product_reviews").select("id, text, author, rating, verified_purchase, source_platform, country, helpful_count, review_date, images").eq("user_id", user.id);
    if (review_ids?.length) query = query.in("id", review_ids);
    const { data: reviews, error: fetchError } = await query.limit(30);
    if (fetchError) throw fetchError;
    if (!reviews?.length) return new Response(JSON.stringify({ results: [], summary: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let systemPrompt = "", userPrompt = "";

    if (action === "fake_detection") {
      systemPrompt = `You are a review fraud detection expert. For each review, return JSON with: id, fake_score (0-100), sentiment, flags array, confidence, summary (French). Also global summary.`;
      userPrompt = `Analyze ${reviews.length} reviews:\n\n${reviews.map((r, i) => `[${i+1}] ID:${r.id} Author:${r.author} Rating:${r.rating}/5 Verified:${r.verified_purchase} Text:"${r.text?.substring(0,300)}"`).join("\n")}`;
    } else if (action === "sentiment_analysis") {
      systemPrompt = `You are a sentiment analysis expert. Return JSON with reviews array and summary.`;
      userPrompt = `Analyze sentiment for ${reviews.length} reviews:\n\n${reviews.map((r, i) => `[${i+1}] ID:${r.id} Rating:${r.rating}/5 Text:"${r.text?.substring(0,300)}"`).join("\n")}`;
    } else if (action === "translate") {
      systemPrompt = `Translate review texts to ${target_language || "en"}. Return JSON array of {id, original_text, translated_text}.`;
      userPrompt = `Translate:\n\n${reviews.map((r, i) => `[${i+1}] ID:${r.id} Text:"${r.text?.substring(0,500)}"`).join("\n")}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiResult = await callOpenAI(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      {
        module: 'product',
        tools: [{
          type: 'function',
          function: {
            name: 'return_analysis',
            description: 'Return the analysis results',
            parameters: {
              type: 'object',
              properties: {
                reviews: { type: 'array', items: { type: 'object', additionalProperties: true } },
                summary: { type: 'object', additionalProperties: true },
              },
              required: ['reviews'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_analysis' } },
        enableCache: false,
      }
    );

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    let result = { reviews: [], summary: null };
    if (toolCall?.function?.arguments) {
      try { result = JSON.parse(toolCall.function.arguments); } catch { /* fallback */ }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const status = (error as any).status || 500;
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
