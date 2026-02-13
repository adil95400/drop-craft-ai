import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DuplicateGroup {
  groupId: string;
  primary: ProductInfo;
  duplicates: Array<ProductInfo & { similarity: number; reasons: string[] }>;
  matchType: "exact_sku" | "title_similarity";
}

interface ProductInfo {
  id: string;
  title: string;
  sku: string | null;
  price: number | null;
  images: string[] | null;
  category: string | null;
  brand: string | null;
  source_url: string | null;
  supplier_url: string | null;
  supplier_product_id: string | null;
  created_at: string;
}

function normalizeText(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function levenshteinSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  const len1 = s1.length, len2 = s2.length;
  const matrix: number[][] = Array.from({ length: len2 + 1 }, (_, i) => [i]);
  for (let j = 0; j <= len1; j++) matrix[0][j] = j;
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      matrix[i][j] = s2[i - 1] === s1[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return 1 - matrix[len2][len1] / Math.max(len1, len2);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action || "scan";

    // ---- SCAN for duplicates ----
    if (action === "scan") {
      const threshold = body.threshold || 0.75;
      const startTime = Date.now();

      const { data: job } = await supabase
        .from("background_jobs")
        .insert({
          user_id: user.id, job_type: "deduplication", status: "running",
          name: "Scan de doublons", started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, title, sku, price, images, category, brand, source_url, supplier_url, supplier_product_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (productsError) throw productsError;
      if (!products || products.length < 2) {
        if (job) {
          await supabase.from("background_jobs").update({
            status: "completed", completed_at: new Date().toISOString(),
            items_total: products?.length || 0, progress_percent: 100,
            progress_message: "Pas assez de produits",
          }).eq("id", job.id);
        }
        return new Response(JSON.stringify({ success: true, groups: [], stats: { totalProducts: products?.length || 0, duplicateGroups: 0, totalDuplicates: 0 } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const groups: DuplicateGroup[] = [];
      const processed = new Set<string>();
      let groupCounter = 0;

      // Phase 1: Exact SKU matches
      const skuMap = new Map<string, ProductInfo[]>();
      for (const p of products) {
        if (p.sku) {
          const key = p.sku.trim().toLowerCase();
          if (!skuMap.has(key)) skuMap.set(key, []);
          skuMap.get(key)!.push(p as ProductInfo);
        }
      }
      for (const [, prods] of skuMap) {
        if (prods.length < 2) continue;
        const primary = prods[0];
        processed.add(primary.id);
        groups.push({
          groupId: `dup-${++groupCounter}`, primary,
          duplicates: prods.slice(1).map((p) => { processed.add(p.id); return { ...p, similarity: 1.0, reasons: ["SKU identique"] }; }),
          matchType: "exact_sku",
        });
      }

      // Phase 1b: URL source matches (same supplier_url or source_url)
      function normalizeUrl(url: string): string {
        if (!url) return "";
        try {
          const u = new URL(url);
          // Remove tracking params, keep path
          return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/+$/, "");
        } catch { return url.toLowerCase().trim(); }
      }

      const urlMap = new Map<string, ProductInfo[]>();
      for (const p of products) {
        if (processed.has(p.id)) continue;
        const url = (p as ProductInfo).supplier_url || (p as ProductInfo).source_url;
        if (url) {
          const key = normalizeUrl(url);
          if (!urlMap.has(key)) urlMap.set(key, []);
          urlMap.get(key)!.push(p as ProductInfo);
        }
      }
      for (const [, prods] of urlMap) {
        if (prods.length < 2) continue;
        const primary = prods[0];
        processed.add(primary.id);
        groups.push({
          groupId: `dup-${++groupCounter}`, primary,
          duplicates: prods.slice(1).map((p) => { processed.add(p.id); return { ...p, similarity: 1.0, reasons: ["URL source identique"] }; }),
          matchType: "exact_sku", // reuse type for exact matches
        });
      }

      // Phase 2: Title similarity
      const remaining = products.filter((p) => !processed.has(p.id));
      for (let i = 0; i < remaining.length; i++) {
        if (processed.has(remaining[i].id)) continue;
        const current = remaining[i] as ProductInfo;
        const currentTitle = normalizeText(current.title);
        const matches: Array<ProductInfo & { similarity: number; reasons: string[] }> = [];

        for (let j = i + 1; j < remaining.length; j++) {
          if (processed.has(remaining[j].id)) continue;
          const compare = remaining[j] as ProductInfo;
          const titleSim = levenshteinSimilarity(currentTitle, normalizeText(compare.title));
          if (titleSim < threshold) continue;

          const reasons: string[] = [`Titre similaire (${(titleSim * 100).toFixed(0)}%)`];
          let totalSim = titleSim * 0.6;

          if (current.price && compare.price) {
            const priceDiff = Math.abs(current.price - compare.price) / Math.max(current.price, compare.price);
            if (priceDiff < 0.1) { totalSim += 0.2; reasons.push("Prix similaire"); }
          }
          if (current.brand && compare.brand && normalizeText(current.brand) === normalizeText(compare.brand)) {
            totalSim += 0.1; reasons.push("Même marque");
          }
          if (current.category && compare.category && normalizeText(current.category) === normalizeText(compare.category)) {
            totalSim += 0.1; reasons.push("Même catégorie");
          }

          if (totalSim >= threshold) {
            matches.push({ ...compare, similarity: Math.min(totalSim, 1), reasons });
            processed.add(compare.id);
          }
        }

        if (matches.length > 0) {
          processed.add(current.id);
          groups.push({ groupId: `dup-${++groupCounter}`, primary: current, duplicates: matches, matchType: "title_similarity" });
        }

        if (job && i % 50 === 0) {
          await supabase.from("background_jobs").update({
            progress_percent: Math.round((i / remaining.length) * 100),
            progress_message: `${i}/${remaining.length} produits comparés`,
          }).eq("id", job.id);
        }
      }

      const totalDuplicates = groups.reduce((sum, g) => sum + g.duplicates.length, 0);
      if (job) {
        await supabase.from("background_jobs").update({
          status: "completed", completed_at: new Date().toISOString(),
          items_total: products.length, items_processed: products.length,
          items_succeeded: totalDuplicates, progress_percent: 100,
          progress_message: `${totalDuplicates} doublons dans ${groups.length} groupes`,
          output_data: { groups_count: groups.length, duplicates_count: totalDuplicates },
        }).eq("id", job.id);
      }

      return new Response(JSON.stringify({
        success: true, groups,
        stats: { totalProducts: products.length, duplicateGroups: groups.length, totalDuplicates, executionMs: Date.now() - startTime,
          byType: { exact_sku: groups.filter((g) => g.matchType === "exact_sku").length, title_similarity: groups.filter((g) => g.matchType === "title_similarity").length } },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---- MERGE duplicates ----
    if (action === "merge") {
      const { keepId, removeIds } = body;
      if (!keepId || !removeIds?.length) {
        return new Response(JSON.stringify({ error: "keepId and removeIds required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: keepProduct } = await supabase.from("products").select("*").eq("id", keepId).eq("user_id", user.id).maybeSingle();
      if (!keepProduct) {
        return new Response(JSON.stringify({ error: "Product not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: dupsToRemove } = await supabase.from("products").select("*").in("id", removeIds).eq("user_id", user.id);

      const mergedImages = new Set<string>(keepProduct.images || []);
      const mergedTags = new Set<string>(keepProduct.tags || []);
      let bestDesc = keepProduct.description || "";

      for (const dup of dupsToRemove || []) {
        (dup.images || []).forEach((img: string) => mergedImages.add(img));
        (dup.tags || []).forEach((tag: string) => mergedTags.add(tag));
        if (dup.description && dup.description.length > bestDesc.length) bestDesc = dup.description;
      }

      await supabase.from("products").update({
        images: [...mergedImages], tags: [...mergedTags], description: bestDesc,
        sku: keepProduct.sku || dupsToRemove?.[0]?.sku,
      }).eq("id", keepId).eq("user_id", user.id);

      await supabase.from("products").delete().in("id", removeIds).eq("user_id", user.id);

      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "duplicate_merge", entity_type: "product", entity_id: keepId,
        description: `Fusion de ${removeIds.length} doublon(s)`, details: { kept: keepId, removed: removeIds },
      });

      return new Response(JSON.stringify({ success: true, merged: removeIds.length, keptId: keepId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- DISMISS group ----
    if (action === "dismiss") {
      await supabase.from("activity_logs").insert({
        user_id: user.id, action: "duplicate_dismiss", entity_type: "product",
        description: `Groupe ignoré: ${body.groupId}`, details: { groupId: body.groupId, productIds: body.productIds },
      });
      return new Response(JSON.stringify({ success: true, dismissed: body.groupId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[detect-duplicates] error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
