/**
 * AI Hub — Consolidated AI Edge Function
 * Routes all AI actions through a single endpoint via `action` parameter.
 * Replaces: ai-assistant, ai-optimizer, ai-content-generator, ai-seo-optimizer,
 *           ai-product-description, ai-pricing-optimizer, ai-sentiment-analysis,
 *           ai-recommendations-engine, ai-trend-predictor, ai-review-analysis
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from "https://esm.sh/zod@3.22.4";
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from "../_shared/secure-cors.ts";

// ─── Action Schema ───────────────────────────────────────────────────────────
const ActionSchema = z.object({
  action: z.enum([
    "chat",
    "optimize-seo",
    "optimize-pricing",
    "generate-description",
    "generate-content",
    "analyze-sentiment",
    "recommend",
    "predict-trends",
    "analyze-reviews",
    "score-product",
  ]),
  payload: z.record(z.unknown()),
});

type Action = z.infer<typeof ActionSchema>["action"];

// ─── Logging ─────────────────────────────────────────────────────────────────
const log = (action: string, step: string, details?: Record<string, unknown>) => {
  const safe = details ? { ...details } : undefined;
  if (safe?.email) safe.email = "***";
  console.log(`[AI-HUB:${action}] ${step}${safe ? ` — ${JSON.stringify(safe)}` : ""}`);
};

// ─── AI Gateway Call ─────────────────────────────────────────────────────────
async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048,
): Promise<string> {
  const res = await fetch("https://ai.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error [${res.status}]: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Action Handlers ─────────────────────────────────────────────────────────
const handlers: Record<Action, (payload: Record<string, unknown>, apiKey: string, userId: string) => Promise<unknown>> = {

  async "chat"(payload, apiKey) {
    const messages = (payload.messages as Array<{ role: string; content: string }>) ?? [];
    const context = payload.context ?? {};
    const sanitized = messages.slice(-30).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: typeof m.content === "string" ? m.content.substring(0, 6000) : "",
    }));

    const systemPrompt = `Tu es l'assistant IA de ShopOpti+, expert e-commerce et dropshipping. Réponds en français, sois concis et actionnable.\nContexte: ${JSON.stringify(context)}`;

    const res = await fetch("https://ai.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-nano",
        messages: [{ role: "system", content: systemPrompt }, ...sanitized],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!res.ok) throw new Error(`AI error [${res.status}]: ${await res.text()}`);
    const data = await res.json();
    return { response: data.choices?.[0]?.message?.content ?? "", model: "gpt-5-nano" };
  },

  async "optimize-seo"(payload, apiKey) {
    const { title, description, category } = payload as { title?: string; description?: string; category?: string };
    const prompt = `Optimize this product for SEO:\nTitle: ${title}\nDescription: ${description}\nCategory: ${category}\n\nReturn JSON: { "title": "...", "description": "...", "metaTitle": "...", "metaDescription": "...", "keywords": ["..."], "score": 0-100 }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash", "You are an e-commerce SEO expert. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "optimize-pricing"(payload, apiKey) {
    const { cost, currentPrice, competitorPrices, category } = payload as any;
    const prompt = `Optimize pricing:\nCost: ${cost}\nCurrent price: ${currentPrice}\nCompetitor prices: ${JSON.stringify(competitorPrices)}\nCategory: ${category}\n\nReturn JSON: { "recommendedPrice": number, "minPrice": number, "maxPrice": number, "margin": number, "reasoning": "..." }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash", "You are an e-commerce pricing strategist. Return only valid JSON.", prompt, 1000);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "generate-description"(payload, apiKey) {
    const { title, features, tone, language } = payload as any;
    const prompt = `Generate a compelling product description:\nTitle: ${title}\nFeatures: ${JSON.stringify(features)}\nTone: ${tone ?? "professional"}\nLanguage: ${language ?? "fr"}\n\nReturn JSON: { "shortDescription": "...", "longDescription": "...", "bulletPoints": ["..."] }`;
    const result = await callAI(apiKey, "openai/gpt-5-mini", "You are a conversion-focused e-commerce copywriter. Return only valid JSON.", prompt, 2000);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "generate-content"(payload, apiKey) {
    const { type, topic, keywords, tone, language } = payload as any;
    const prompt = `Generate ${type ?? "blog post"} content:\nTopic: ${topic}\nKeywords: ${JSON.stringify(keywords)}\nTone: ${tone ?? "professional"}\nLanguage: ${language ?? "fr"}\n\nReturn JSON: { "title": "...", "content": "...", "excerpt": "...", "seoTitle": "...", "seoDescription": "..." }`;
    const result = await callAI(apiKey, "openai/gpt-5-mini", "You are an expert content marketer. Return only valid JSON.", prompt, 3000);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "analyze-sentiment"(payload, apiKey) {
    const { reviews } = payload as { reviews?: string[] };
    const prompt = `Analyze sentiment of these customer reviews:\n${JSON.stringify(reviews?.slice(0, 50))}\n\nReturn JSON: { "overallSentiment": "positive|neutral|negative", "score": 0-100, "themes": [{ "topic": "...", "sentiment": "...", "count": number }], "summary": "..." }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash-lite", "You are a sentiment analysis expert. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "recommend"(payload, apiKey) {
    const { products, userBehavior, type } = payload as any;
    const prompt = `Generate product recommendations:\nType: ${type ?? "similar"}\nProducts: ${JSON.stringify(products?.slice(0, 20))}\nUser behavior: ${JSON.stringify(userBehavior)}\n\nReturn JSON: { "recommendations": [{ "productId": "...", "reason": "...", "confidence": 0-1 }] }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash", "You are a recommendation engine. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "predict-trends"(payload, apiKey) {
    const { category, historicalData, market } = payload as any;
    const prompt = `Predict e-commerce trends:\nCategory: ${category}\nMarket: ${market ?? "global"}\nHistorical data: ${JSON.stringify(historicalData)}\n\nReturn JSON: { "trends": [{ "trend": "...", "direction": "up|down|stable", "confidence": 0-1, "timeframe": "..." }], "opportunities": ["..."] }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash", "You are a market trends analyst. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "analyze-reviews"(payload, apiKey) {
    const { reviews, productTitle } = payload as any;
    const prompt = `Analyze these reviews for "${productTitle}":\n${JSON.stringify(reviews?.slice(0, 30))}\n\nReturn JSON: { "averageRating": number, "commonPraises": ["..."], "commonComplaints": ["..."], "productStrengths": ["..."], "improvementAreas": ["..."], "buyerPersona": "..." }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash-lite", "You are a product review analyst. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },

  async "score-product"(payload, apiKey) {
    const { title, description, price, category, images, reviews } = payload as any;
    const prompt = `Score this product's potential:\nTitle: ${title}\nDescription: ${description}\nPrice: ${price}\nCategory: ${category}\nImages: ${images?.length ?? 0}\nReview count: ${reviews ?? 0}\n\nReturn JSON: { "overallScore": 0-100, "scores": { "market_fit": 0-100, "pricing": 0-100, "listing_quality": 0-100, "competition": 0-100 }, "verdict": "winner|promising|risky|avoid", "suggestions": ["..."] }`;
    const result = await callAI(apiKey, "google/gemini-2.5-flash", "You are an e-commerce product analyst. Return only valid JSON.", prompt, 1500);
    try { return JSON.parse(result); } catch { return { raw: result }; }
  },
};

// ─── Main Handler ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightSecure(req);

  const corsHeaders = getSecureCorsHeaders(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), { status: 401, headers: jsonHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: jsonHeaders });
    }

    const userId = claimsData.claims.sub as string;

    // Parse & validate
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const { action, payload } = parsed.data;
    log(action, "start", { userId: userId.slice(0, 8) });

    // Check LOVABLE_API_KEY
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 503, headers: jsonHeaders });
    }

    // Execute
    const result = await handlers[action](payload, apiKey, userId);
    log(action, "complete");

    return new Response(JSON.stringify({ success: true, action, data: result }), { status: 200, headers: jsonHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI-HUB] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: jsonHeaders });
  }
});
