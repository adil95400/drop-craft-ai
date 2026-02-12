import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Versioned prompts (stored in code) ─────────────────────────────────
const PROMPT_VERSION = "1.3.0";
const MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `Tu es un expert en e-commerce et SEO. Tu enrichis les fiches produits pour maximiser les conversions et le référencement naturel. Tu retournes uniquement du JSON valide structuré.`;

function buildUserPrompt(product: any, language: string, tone: string): string {
  const imageCount = Array.isArray(product.images) ? product.images.length : 0;
  return `Enrichis ce produit pour le rendre attractif et SEO-optimisé.

Produit actuel:
- Titre: ${product.title || "N/A"}
- Description: ${product.description || "N/A"}
- Catégorie: ${product.category || "N/A"}
- Prix: ${product.price || "N/A"}
- Nombre d'images: ${imageCount}

Langue cible: ${language}
Ton de marque: ${tone}

Génère un JSON avec:
- title: titre optimisé (max 80 caractères, avec mots-clés pertinents)
- description: description enrichie (150-300 mots, persuasive, SEO-friendly)
- category: catégorie suggérée si manquante ou améliorée
- seo_title: balise title SEO (max 60 caractères)
- seo_description: meta description (max 160 caractères)
- tags: tableau de 5-8 tags pertinents
- image_alt_texts: tableau de ${Math.max(1, imageCount)} textes alternatifs SEO pour les images (descriptifs, incluant le nom du produit et des mots-clés, max 125 caractères chacun)`;
}

const OPENAI_TOOL = {
  type: "function" as const,
  function: {
    name: "enrich_product",
    description: "Enrichit un produit e-commerce avec du contenu optimisé SEO",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        seo_title: { type: "string" },
        seo_description: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        image_alt_texts: { type: "array", items: { type: "string" }, description: "SEO alt texts for product images" },
      },
      required: ["title", "description"],
      additionalProperties: false,
    },
  },
};

// ── Main handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_ids, language = "fr", tone = "professionnel" } = await req.json();

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return new Response(JSON.stringify({ error: "product_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create background job
    const { data: job, error: jobError } = await supabase
      .from("background_jobs")
      .insert({
        user_id: user.id,
        job_type: "ai_enrich",
        status: "running",
        items_total: product_ids.length,
        items_processed: 0,
        items_succeeded: 0,
        items_failed: 0,
        progress_percent: 0,
        name: `Enrichissement IA OpenAI (${product_ids.length} produits)`,
        started_at: new Date().toISOString(),
        metadata: { prompt_version: PROMPT_VERSION, model: MODEL, language, tone },
      })
      .select("id")
      .single();

    if (jobError) throw jobError;

    // ── Background processing ──────────────────────────────────────────
    const processProducts = async () => {
      let succeeded = 0;
      let failed = 0;

      for (let i = 0; i < product_ids.length; i++) {
        const productId = product_ids[i];
        const startTime = Date.now();

        try {
          const { data: product } = await supabase
            .from("products")
            .select("title, description, category, price, images")
            .eq("id", productId)
            .eq("user_id", user.id)
            .single();

          if (!product) {
            // Persist failure
            await supabase.from("product_ai_enrichments").insert({
              product_id: productId,
              job_id: job.id,
              user_id: user.id,
              status: "failed",
              error_message: "Product not found",
              model: MODEL,
              prompt_version: PROMPT_VERSION,
              language,
              tone,
            });
            failed++;
            continue;
          }

          const userPrompt = buildUserPrompt(product, language, tone);

          const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MODEL,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              tools: [OPENAI_TOOL],
              tool_choice: { type: "function", function: { name: "enrich_product" } },
              temperature: 0.7,
            }),
          });

          const durationMs = Date.now() - startTime;

          if (!aiResponse.ok) {
            const errBody = await aiResponse.text();
            console.error(`OpenAI error for ${productId}: ${aiResponse.status} ${errBody}`);
            await supabase.from("product_ai_enrichments").insert({
              product_id: productId,
              job_id: job.id,
              user_id: user.id,
              original_title: product.title,
              original_description: product.description,
              original_category: product.category,
              status: "failed",
              error_message: `OpenAI ${aiResponse.status}: ${errBody.substring(0, 500)}`,
              model: MODEL,
              prompt_version: PROMPT_VERSION,
              language,
              tone,
              generation_time_ms: durationMs,
            });
            failed++;
            continue;
          }

          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          let enriched: any = {};

          if (toolCall?.function?.arguments) {
            enriched = JSON.parse(toolCall.function.arguments);
          }

          const tokensUsed = aiData.usage?.total_tokens || null;

          // ── Persist enrichment result in product_ai_enrichments ───────
          await supabase.from("product_ai_enrichments").insert({
            product_id: productId,
            job_id: job.id,
            user_id: user.id,
            original_title: product.title,
            original_description: product.description,
            original_category: product.category,
            enriched_title: enriched.title || null,
            enriched_description: enriched.description || null,
            enriched_category: enriched.category || null,
            enriched_seo_title: enriched.seo_title || null,
            enriched_seo_description: enriched.seo_description || null,
            enriched_tags: enriched.tags || null,
            model: MODEL,
            prompt_version: PROMPT_VERSION,
            language,
            tone,
            tokens_used: tokensUsed,
            generation_time_ms: durationMs,
            status: "generated",
          });

          // ── Apply to product ─────────────────────────────────────────
          const updateData: any = {};
          if (enriched.title) updateData.title = enriched.title;
          if (enriched.description) updateData.description = enriched.description;
          if (enriched.category) updateData.category = enriched.category;
          if (enriched.seo_title) updateData.seo_title = enriched.seo_title;
          if (enriched.seo_description) updateData.seo_description = enriched.seo_description;
          if (enriched.tags) updateData.tags = enriched.tags;

          // Apply alt texts to images array
          if (enriched.image_alt_texts && Array.isArray(product.images) && product.images.length > 0) {
            const updatedImages = product.images.map((img: any, idx: number) => {
              const altText = enriched.image_alt_texts[idx] || enriched.image_alt_texts[0] || enriched.title;
              if (typeof img === "string") {
                return { url: img, alt: altText };
              }
              return { ...img, alt: altText };
            });
            updateData.images = updatedImages;
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from("products")
              .update(updateData)
              .eq("id", productId)
              .eq("user_id", user.id);

            // Mark enrichment as applied
            // (we just inserted it, update the latest one)
            await supabase
              .from("product_ai_enrichments")
              .update({ status: "applied", applied_at: new Date().toISOString() })
              .eq("product_id", productId)
              .eq("job_id", job.id)
              .eq("status", "generated");

            succeeded++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error(`Error enriching ${productId}:`, err);
          failed++;
        }

        // Update job progress
        const processed = i + 1;
        const progress = Math.round((processed / product_ids.length) * 100);
        await supabase
          .from("background_jobs")
          .update({
            items_processed: processed,
            items_succeeded: succeeded,
            items_failed: failed,
            progress_percent: progress,
            progress_message: `${processed}/${product_ids.length} produits traités`,
          })
          .eq("id", job.id);
      }

      await supabase
        .from("background_jobs")
        .update({
          status: failed === product_ids.length ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          progress_percent: 100,
          progress_message: `Terminé: ${succeeded} enrichis, ${failed} échecs`,
          error_message: failed > 0 ? `${failed} produit(s) non enrichi(s)` : null,
        })
        .eq("id", job.id);
    };

    processProducts().catch((err) =>
      console.error("[ai-enrich-import] background error:", err)
    );

    return new Response(
      JSON.stringify({ success: true, job_id: job.id, message: "Enrichissement IA OpenAI démarré" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-enrich-import] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
