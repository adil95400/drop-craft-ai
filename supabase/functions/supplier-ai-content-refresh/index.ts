import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case "refresh_on_change": return await refreshOnChange(supabase, params);
      case "refresh_batch": return await refreshBatch(supabase, params);
      case "preview_refresh": return await previewRefresh(supabase, params);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("ai-content-refresh error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * When a supplier attribute change is detected (from supplier-attribute-sync),
 * automatically regenerate SEO title & description incorporating the new data.
 */
async function refreshOnChange(supabase: any, params: {
  product_id: string;
  changed_attributes: { attribute: string; old_value: string; new_value: string }[];
  language?: string;
}) {
  const { product_id, changed_attributes, language = "fr" } = params;

  const { data: product } = await supabase
    .from("products")
    .select("id, title, description, price, cost_price, category, brand, images, seo_title, seo_description")
    .eq("id", product_id)
    .single();

  if (!product) return json({ error: "Product not found" }, 404);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return json({ error: "AI not configured" }, 500);
  }

  // Build context about changes
  const changesContext = changed_attributes
    .map((c) => `- ${c.attribute}: "${c.old_value}" → "${c.new_value}"`)
    .join("\n");

  const systemPrompt = `Tu es un expert SEO e-commerce. Tu dois régénérer le titre et la description d'un produit suite à des changements détectés chez le fournisseur. 
Le contenu doit être optimisé SEO, naturel, persuasif et en ${language === "fr" ? "français" : language === "es" ? "espagnol" : language === "de" ? "allemand" : "anglais"}.
Ne jamais mentionner le fournisseur ou les prix fournisseur. Cibler le client final.`;

  const userPrompt = `Produit actuel:
- Titre: ${product.title}
- Description: ${product.description?.substring(0, 500) || "Aucune"}
- Catégorie: ${product.category || "Non défini"}
- Marque: ${product.brand || "Non défini"}
- Prix: ${product.price}€

Changements fournisseur détectés:
${changesContext}

Génère un nouveau titre SEO (max 70 chars) et une nouvelle description SEO (150-300 chars) qui intègrent ces changements de manière naturelle. Le titre doit contenir le mot-clé principal du produit.`;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "update_seo_content",
            description: "Update product SEO title and description",
            parameters: {
              type: "object",
              properties: {
                seo_title: { type: "string", description: "New SEO-optimized title (max 70 chars)" },
                seo_description: { type: "string", description: "New SEO meta description (150-300 chars)" },
                optimized_title: { type: "string", description: "New product display title" },
                optimized_description: { type: "string", description: "New product description (marketing copy, 200-500 chars)" },
                changes_incorporated: { type: "array", items: { type: "string" }, description: "List of supplier changes incorporated" },
              },
              required: ["seo_title", "seo_description", "optimized_title", "optimized_description"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "update_seo_content" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return json({ error: "Rate limit exceeded" }, 429);
      if (aiResponse.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: "AI generation failed" }, 500);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "AI did not return structured output" }, 500);

    const generated = JSON.parse(toolCall.function.arguments);

    // Update product
    await supabase.from("products").update({
      seo_title: generated.seo_title,
      seo_description: generated.seo_description,
    }).eq("id", product_id);

    // Log generation
    await supabase.from("ai_generated_content").insert({
      user_id: product.user_id || params.user_id,
      product_id,
      content_type: "seo_refresh",
      original_content: JSON.stringify({ title: product.title, seo_title: product.seo_title }),
      generated_content: JSON.stringify(generated),
      status: "applied",
      applied_at: new Date().toISOString(),
    }).catch(() => {}); // Non-blocking

    return json({
      success: true,
      product_id,
      generated,
      changes_trigger: changed_attributes.map((c) => c.attribute),
    });
  } catch (err) {
    console.error("AI refresh error:", err);
    return json({ error: "AI processing failed" }, 500);
  }
}

/**
 * Batch refresh: find products with recent supplier changes and regenerate content
 */
async function refreshBatch(supabase: any, params: { user_id: string; limit?: number }) {
  const { user_id, limit = 10 } = params;

  // Find links with recent applied changes
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("product_id, metadata")
    .eq("user_id", user_id)
    .not("metadata", "is", null);

  if (!links?.length) return json({ refreshed: 0 });

  // Find products that had changes applied recently
  const recentlyChanged: Map<string, any[]> = new Map();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  for (const link of links) {
    const history = link.metadata?.change_history || [];
    const recentApplied = history.filter(
      (h: any) => h.status === "applied" && h.applied_at > oneDayAgo
    );
    if (recentApplied.length > 0 && !recentlyChanged.has(link.product_id)) {
      recentlyChanged.set(link.product_id, recentApplied);
    }
  }

  let refreshed = 0;
  const productIds = [...recentlyChanged.keys()].slice(0, limit);

  for (const productId of productIds) {
    const changes = recentlyChanged.get(productId)!;
    try {
      const result = await refreshOnChange(supabase, {
        product_id: productId,
        changed_attributes: changes.map((c: any) => ({
          attribute: c.attribute,
          old_value: c.old_value,
          new_value: c.new_value,
        })),
        user_id,
      });
      const body = await result.json();
      if (body.success) refreshed++;
    } catch {}
  }

  return json({ refreshed, total: productIds.length });
}

/**
 * Preview what the AI would generate without applying
 */
async function previewRefresh(supabase: any, params: {
  product_id: string;
  user_id: string;
  language?: string;
}) {
  const { product_id, language = "fr" } = params;

  const { data: product } = await supabase
    .from("products")
    .select("id, title, description, price, category, brand, seo_title, seo_description")
    .eq("id", product_id)
    .single();

  if (!product) return json({ error: "Product not found" }, 404);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "AI not configured" }, 500);

  const lang = language === "fr" ? "français" : language === "es" ? "espagnol" : language === "de" ? "allemand" : "anglais";

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `Tu es un expert SEO e-commerce. Optimise le contenu produit en ${lang}. Sois persuasif et naturel.` },
        { role: "user", content: `Produit: ${product.title}\nDescription: ${product.description?.substring(0, 500) || "Aucune"}\nCatégorie: ${product.category || "?"}\nPrix: ${product.price}€\n\nGénère un titre SEO optimisé et une meta description.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "seo_preview",
          description: "Preview SEO content",
          parameters: {
            type: "object",
            properties: {
              seo_title: { type: "string" },
              seo_description: { type: "string" },
              optimized_title: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
            },
            required: ["seo_title", "seo_description", "optimized_title"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "seo_preview" } },
    }),
  });

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) return json({ error: "Rate limit" }, 429);
    if (aiResponse.status === 402) return json({ error: "Credits exhausted" }, 402);
    return json({ error: "AI failed" }, 500);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return json({ error: "No AI output" }, 500);

  const preview = JSON.parse(toolCall.function.arguments);

  return json({
    current: {
      title: product.title,
      seo_title: product.seo_title,
      seo_description: product.seo_description,
    },
    preview,
    is_preview: true,
  });
}
