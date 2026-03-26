/**
 * Media Engine — Phase 1: MVP
 * Actions: collect, score, status, search_similar, deduplicate
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Table creation via direct PostgreSQL REST endpoint ───────────────────────
let tablesReady = false;

async function ensureTables() {
  if (tablesReady) return;
  
  const sb = supabaseAdmin();
  // Quick check if tables exist
  const { error } = await sb.from("product_media_sets").select("id").limit(0);
  
  if (!error) {
    tablesReady = true;
    return;
  }
  
  if (error.code !== "42P01") {
    // Some other error, tables probably exist
    tablesReady = true;
    return;
  }

  // Tables don't exist - create them via direct SQL
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const statements = [
    `CREATE TABLE IF NOT EXISTS public.product_media_sets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      total_assets integer DEFAULT 0,
      media_score integer DEFAULT 0,
      score_breakdown jsonb,
      media_status text DEFAULT 'blocked',
      duplicates_removed integer DEFAULT 0,
      last_enriched_at timestamptz,
      scored_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(product_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS public.product_media_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      media_set_id uuid REFERENCES public.product_media_sets(id) ON DELETE CASCADE,
      product_id uuid NOT NULL,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      url text NOT NULL,
      original_url text NOT NULL,
      source text DEFAULT 'supplier',
      asset_type text DEFAULT 'image',
      image_type text,
      is_primary boolean DEFAULT false,
      width integer,
      height integer,
      file_size integer,
      format text,
      position integer DEFAULT 0,
      metadata jsonb,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.media_enrichment_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id uuid NOT NULL,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      job_type text NOT NULL,
      status text DEFAULT 'pending',
      result jsonb,
      error_message text,
      started_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_pms_product ON public.product_media_sets(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pms_user ON public.product_media_sets(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pma_set ON public.product_media_assets(media_set_id)`,
    `CREATE INDEX IF NOT EXISTS idx_pma_product ON public.product_media_assets(product_id)`,
    `ALTER TABLE public.product_media_sets ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.product_media_assets ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.media_enrichment_jobs ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_sets_auth') THEN
        CREATE POLICY "media_sets_auth" ON public.product_media_sets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_assets_auth') THEN
        CREATE POLICY "media_assets_auth" ON public.product_media_assets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'enrichment_jobs_auth') THEN
        CREATE POLICY "enrichment_jobs_auth" ON public.media_enrichment_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
      END IF;
    END $$`,
  ];

  for (const sql of statements) {
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
          "apikey": serviceKey,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ query: sql }),
      });
      // Ignore errors from individual statements — IF NOT EXISTS handles most
    } catch {
      // Continue
    }
  }

  // Retry a simpler approach: use the pg_dump style via exec
  // If RPC doesn't work, tables will need manual creation
  tablesReady = true;
  console.log("Media engine tables initialization attempted");
}

function supabaseAuth(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

async function requireAuth(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const sb = supabaseAuth(authHeader);
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { userId: user.id, sb };
}

// ── Scoring ─────────────────────────────────────────────────────────────────
interface MediaScoreBreakdown {
  imageCount: { score: number; max: number; label: string };
  resolution: { score: number; max: number; label: string };
  diversity: { score: number; max: number; label: string };
  quality: { score: number; max: number; label: string };
}

function computeMediaScore(assets: any[]): { score: number; breakdown: MediaScoreBreakdown; status: string } {
  const imageAssets = assets.filter((a) => a.asset_type === "image");
  const count = imageAssets.length;

  const countScore = Math.min(count * 6, 30);

  const avgWidth = count > 0 ? imageAssets.reduce((s, a) => s + (a.width || 0), 0) / count : 0;
  let resScore = 0;
  if (avgWidth >= 1200) resScore = 25;
  else if (avgWidth >= 800) resScore = 20;
  else if (avgWidth >= 500) resScore = 15;
  else if (avgWidth >= 200) resScore = 8;

  const types = new Set(imageAssets.map((a) => a.image_type || "unknown"));
  const diversityScore = Math.min(types.size * 8, 25);

  const sources = new Set(imageAssets.map((a) => a.source));
  const hasPrimary = imageAssets.some((a) => a.is_primary);
  const qualScore = Math.min(sources.size * 5, 10) + (hasPrimary ? 10 : 0);

  const total = countScore + resScore + diversityScore + qualScore;

  let status = "blocked";
  if (total >= 70) status = "ready_to_publish";
  else if (total >= 40) status = "needs_enrichment";

  return {
    score: total,
    breakdown: {
      imageCount: { score: countScore, max: 30, label: "Nombre d'images" },
      resolution: { score: resScore, max: 25, label: "Résolution moyenne" },
      diversity: { score: diversityScore, max: 25, label: "Diversité des types" },
      quality: { score: qualScore, max: 20, label: "Qualité générale" },
    },
    status,
  };
}

// ── Deduplication ───────────────────────────────────────────────────────────
function deduplicateAssets(assets: any[]): { kept: any[]; removed: string[] } {
  const seen = new Map<string, any>();
  const removed: string[] = [];

  for (const asset of assets) {
    const key = asset.original_url || asset.url;
    if (seen.has(key)) {
      const existing = seen.get(key);
      if ((asset.width || 0) * (asset.height || 0) > (existing.width || 0) * (existing.height || 0)) {
        removed.push(existing.id);
        seen.set(key, asset);
      } else {
        removed.push(asset.id);
      }
    } else {
      seen.set(key, asset);
    }
  }

  return { kept: Array.from(seen.values()), removed };
}

// ── Collect from product data ───────────────────────────────────────────────
async function handleCollect(body: any, userId: string) {
  const sb = supabaseAdmin();
  const { productId } = body;
  if (!productId) throw new Error("productId required");

  // Get product data - use correct column names from schema
  const { data: product, error: pErr } = await sb
    .from("products")
    .select("id, title, images, image_url, main_image_url, primary_image_url, source_url, sku")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (pErr || !product) throw new Error("Product not found");

  // Collect all image URLs from product
  const existingImages: string[] = [];
  
  // Add main/primary images
  if (product.primary_image_url) existingImages.push(product.primary_image_url);
  if (product.main_image_url && !existingImages.includes(product.main_image_url)) existingImages.push(product.main_image_url);
  if (product.image_url && !existingImages.includes(product.image_url)) existingImages.push(product.image_url);
  
  // Add images array
  if (product.images) {
    const imgs = Array.isArray(product.images) ? product.images : [];
    for (const img of imgs) {
      const url = typeof img === "string" ? img : (img as any)?.url || (img as any)?.src;
      if (url && !existingImages.includes(url)) existingImages.push(url);
    }
  }

  if (existingImages.length === 0) {
    return { success: true, totalAssets: 0, newAssetsAdded: 0, score: 0, status: "blocked" };
  }

  // Upsert media_set
  const { data: mediaSet } = await sb
    .from("product_media_sets")
    .upsert(
      { product_id: productId, user_id: userId, total_assets: existingImages.length },
      { onConflict: "product_id,user_id" }
    )
    .select("id")
    .single();

  if (!mediaSet) throw new Error("Failed to create media set");

  // Insert assets (skip existing URLs)
  const { data: existingAssets } = await sb
    .from("product_media_assets")
    .select("original_url")
    .eq("media_set_id", mediaSet.id);

  const existingUrls = new Set((existingAssets || []).map((a: any) => a.original_url));
  const newAssets = existingImages
    .filter((url) => !existingUrls.has(url))
    .map((url, i) => ({
      media_set_id: mediaSet.id,
      user_id: userId,
      product_id: productId,
      original_url: url,
      url: url,
      source: "supplier",
      asset_type: "image",
      is_primary: i === 0 && existingUrls.size === 0,
      position: existingUrls.size + i,
    }));

  if (newAssets.length > 0) {
    await sb.from("product_media_assets").insert(newAssets);
  }

  // Re-fetch all assets for scoring
  const { data: allAssets } = await sb
    .from("product_media_assets")
    .select("*")
    .eq("media_set_id", mediaSet.id);

  const scoreResult = computeMediaScore(allAssets || []);

  await sb
    .from("product_media_sets")
    .update({
      total_assets: (allAssets || []).length,
      media_score: scoreResult.score,
      score_breakdown: scoreResult.breakdown,
      media_status: scoreResult.status,
    })
    .eq("id", mediaSet.id);

  return {
    success: true,
    mediaSetId: mediaSet.id,
    totalAssets: (allAssets || []).length,
    newAssetsAdded: newAssets.length,
    score: scoreResult.score,
    status: scoreResult.status,
    breakdown: scoreResult.breakdown,
  };
}

// ── Score a product ─────────────────────────────────────────────────────────
async function handleScore(body: any, userId: string) {
  const sb = supabaseAdmin();
  const { productId } = body;
  if (!productId) throw new Error("productId required");

  const { data: mediaSet } = await sb
    .from("product_media_sets")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .single();

  if (!mediaSet) {
    return handleCollect(body, userId);
  }

  const { data: assets } = await sb
    .from("product_media_assets")
    .select("*")
    .eq("media_set_id", mediaSet.id);

  const scoreResult = computeMediaScore(assets || []);

  await sb
    .from("product_media_sets")
    .update({
      total_assets: (assets || []).length,
      media_score: scoreResult.score,
      score_breakdown: scoreResult.breakdown,
      media_status: scoreResult.status,
      scored_at: new Date().toISOString(),
    })
    .eq("id", mediaSet.id);

  return {
    success: true,
    score: scoreResult.score,
    status: scoreResult.status,
    breakdown: scoreResult.breakdown,
    totalAssets: (assets || []).length,
  };
}

// ── Search similar images via Firecrawl ─────────────────────────────────────
async function handleSearchSimilar(body: any, userId: string) {
  const sb = supabaseAdmin();
  const { productId } = body;
  if (!productId) throw new Error("productId required");

  const { data: product } = await sb
    .from("products")
    .select("id, title, sku, source_url, category")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (!product) throw new Error("Product not found");

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("FIRECRAWL_API_KEY_1");
  if (!firecrawlKey) throw new Error("Firecrawl not configured. Please connect Firecrawl in Settings.");

  // Search for product images
  const searchQuery = `${product.title || ""} product images high resolution`;
  const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: searchQuery,
      limit: 5,
      scrapeOptions: { formats: ["markdown", "links"] },
    }),
  });

  if (!searchResp.ok) {
    const errData = await searchResp.json().catch(() => ({}));
    throw new Error(`Firecrawl search failed: ${searchResp.status} - ${JSON.stringify(errData)}`);
  }

  const searchData = await searchResp.json();
  const results = searchData.data || [];

  // Extract image URLs from results
  const imageUrls: string[] = [];
  const imagePattern = /https?:\/\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp|avif)/gi;

  for (const result of results) {
    const content = (result.markdown || "") + " " + JSON.stringify(result.links || []);
    const matches = content.match(imagePattern) || [];
    imageUrls.push(...matches);
  }

  // Also try scraping the source URL if available
  if (product.source_url) {
    try {
      const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: product.source_url,
          formats: ["links"],
        }),
      });

      if (scrapeResp.ok) {
        const scrapeData = await scrapeResp.json();
        const links = scrapeData.data?.links || scrapeData.links || [];
        for (const l of links) {
          if (typeof l === "string" && /\.(jpg|jpeg|png|webp|avif)/i.test(l)) {
            imageUrls.push(l);
          }
        }
      }
    } catch {
      // ignore scrape errors
    }
  }

  // Deduplicate found URLs
  const uniqueUrls = [...new Set(imageUrls)].slice(0, 20);

  // Get or create media set
  let { data: mediaSet } = await sb
    .from("product_media_sets")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .single();

  if (!mediaSet) {
    const { data: newSet } = await sb
      .from("product_media_sets")
      .insert({ product_id: productId, user_id: userId, total_assets: 0 })
      .select("id")
      .single();
    mediaSet = newSet;
  }

  if (!mediaSet) throw new Error("Failed to create media set");

  const { data: existingAssets } = await sb
    .from("product_media_assets")
    .select("original_url")
    .eq("media_set_id", mediaSet.id);

  const existingUrlSet = new Set((existingAssets || []).map((a: any) => a.original_url));
  const newUrls = uniqueUrls.filter((u) => !existingUrlSet.has(u));

  if (newUrls.length > 0) {
    const position = existingUrlSet.size;
    const newAssets = newUrls.map((url, i) => ({
      media_set_id: mediaSet!.id,
      user_id: userId,
      product_id: productId,
      original_url: url,
      url: url,
      source: "search",
      asset_type: "image",
      is_primary: false,
      position: position + i,
    }));

    await sb.from("product_media_assets").insert(newAssets);
  }

  // Re-score
  const { data: allAssets } = await sb
    .from("product_media_assets")
    .select("*")
    .eq("media_set_id", mediaSet.id);

  const scoreResult = computeMediaScore(allAssets || []);

  await sb
    .from("product_media_sets")
    .update({
      total_assets: (allAssets || []).length,
      media_score: scoreResult.score,
      score_breakdown: scoreResult.breakdown,
      media_status: scoreResult.status,
      last_enriched_at: new Date().toISOString(),
    })
    .eq("id", mediaSet.id);

  return {
    success: true,
    foundImages: uniqueUrls.length,
    newImagesAdded: newUrls.length,
    totalAssets: (allAssets || []).length,
    score: scoreResult.score,
    status: scoreResult.status,
  };
}

// ── Deduplicate ─────────────────────────────────────────────────────────────
async function handleDeduplicate(body: any, userId: string) {
  const sb = supabaseAdmin();
  const { productId } = body;
  if (!productId) throw new Error("productId required");

  const { data: mediaSet } = await sb
    .from("product_media_sets")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .single();

  if (!mediaSet) throw new Error("No media set found. Run collect first.");

  const { data: assets } = await sb
    .from("product_media_assets")
    .select("*")
    .eq("media_set_id", mediaSet.id)
    .order("position");

  if (!assets || assets.length === 0) return { success: true, removed: 0 };

  const { removed } = deduplicateAssets(assets);

  if (removed.length > 0) {
    await sb.from("product_media_assets").delete().in("id", removed);

    const { data: remaining } = await sb
      .from("product_media_assets")
      .select("*")
      .eq("media_set_id", mediaSet.id);

    const scoreResult = computeMediaScore(remaining || []);
    await sb
      .from("product_media_sets")
      .update({
        total_assets: (remaining || []).length,
        media_score: scoreResult.score,
        score_breakdown: scoreResult.breakdown,
        media_status: scoreResult.status,
        duplicates_removed: removed.length,
      })
      .eq("id", mediaSet.id);
  }

  return { success: true, removed: removed.length };
}

// ── Get media status ────────────────────────────────────────────────────────
async function handleGetStatus(body: any, userId: string) {
  const sb = supabaseAdmin();
  const { productId } = body;
  if (!productId) throw new Error("productId required");

  const { data: mediaSet, error: msErr } = await sb
    .from("product_media_sets")
    .select("*")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .single();

  if (msErr || !mediaSet) {
    return {
      success: true,
      exists: false,
      score: 0,
      status: "blocked",
      totalAssets: 0,
      breakdown: null,
      assets: [],
    };
  }

  const { data: assets } = await sb
    .from("product_media_assets")
    .select("*")
    .eq("media_set_id", mediaSet.id)
    .order("position");

  return {
    success: true,
    exists: true,
    mediaSetId: mediaSet.id,
    score: mediaSet.media_score || 0,
    status: mediaSet.media_status || "blocked",
    totalAssets: mediaSet.total_assets || 0,
    breakdown: mediaSet.score_breakdown,
    assets: assets || [],
    lastEnrichedAt: mediaSet.last_enriched_at,
  };
}

// ── Router ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await requireAuth(req);
    const body = await req.json();
    const { action } = body;

    // Try to ensure tables exist (best-effort)
    await ensureTables().catch((e) => console.warn("ensureTables warning:", e.message));

    let result: any;

    switch (action) {
      case "collect":
        result = await handleCollect(body, userId);
        break;
      case "score":
        result = await handleScore(body, userId);
        break;
      case "search_similar":
        result = await handleSearchSimilar(body, userId);
        break;
      case "deduplicate":
        result = await handleDeduplicate(body, userId);
        break;
      case "get_status":
        result = await handleGetStatus(body, userId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("media-engine error:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: msg === "Unauthorized" ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
