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
      case "enrich_product": return await enrichProduct(supabase, params);
      case "enrich_batch": return await enrichBatch(supabase, params);
      case "get_sources": return await getSources(supabase, params);
      case "merge_sources": return await mergeSources(supabase, params);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("multi-source-enrich error:", e);
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
 * Enrich a single product by scraping all its supplier links
 * and merging the best content from each source
 */
async function enrichProduct(supabase: any, params: { product_id: string; user_id: string }) {
  const { product_id, user_id } = params;

  // Get all supplier links for this product
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("*")
    .eq("product_id", product_id)
    .eq("user_id", user_id);

  if (!links?.length) return json({ error: "No supplier links found" }, 404);

  // Get current product
  const { data: product } = await supabase
    .from("products")
    .select("id, title, description, images, price, cost_price, stock_quantity")
    .eq("id", product_id)
    .single();

  if (!product) return json({ error: "Product not found" }, 404);

  // Scrape all supplier URLs in parallel
  const scrapedSources = await Promise.allSettled(
    links
      .filter((l: any) => l.supplier_url)
      .map(async (link: any) => {
        const data = await scrapeUrl(link.supplier_url);
        return {
          link_id: link.id,
          supplier_name: link.supplier_name || "Unknown",
          supplier_url: link.supplier_url,
          is_primary: link.is_primary,
          scraped: data,
        };
      })
  );

  const sources = scrapedSources
    .filter((r) => r.status === "fulfilled" && r.value.scraped)
    .map((r: any) => r.value);

  if (!sources.length) return json({ sources: [], message: "No data scraped from any source" });

  // Score and rank sources
  const rankedSources = sources.map((src: any) => ({
    ...src,
    quality_score: calculateSourceQuality(src.scraped),
  })).sort((a: any, b: any) => b.quality_score - a.quality_score);

  // Store enrichment data in product metadata
  const enrichmentData = {
    sources: rankedSources.map((s: any) => ({
      supplier_name: s.supplier_name,
      supplier_url: s.supplier_url,
      is_primary: s.is_primary,
      quality_score: s.quality_score,
      scraped_at: new Date().toISOString(),
      data: {
        title: s.scraped.title,
        description_length: s.scraped.description?.length || 0,
        image_count: s.scraped.images?.length || 0,
        price: s.scraped.price,
        has_stock: s.scraped.stock != null,
      },
    })),
    last_enriched_at: new Date().toISOString(),
    best_source: rankedSources[0]?.supplier_name,
  };

  // Update links metadata with scraped data
  for (const src of rankedSources) {
    const meta = links.find((l: any) => l.id === src.link_id)?.metadata || {};
    await supabase.from("product_supplier_links").update({
      metadata: {
        ...meta,
        last_scraped: src.scraped,
        last_scraped_at: new Date().toISOString(),
        quality_score: src.quality_score,
      },
    }).eq("id", src.link_id);
  }

  return json({
    product_id,
    sources_found: rankedSources.length,
    sources: rankedSources.map((s: any) => ({
      supplier_name: s.supplier_name,
      quality_score: s.quality_score,
      title: s.scraped.title,
      image_count: s.scraped.images?.length || 0,
      description_preview: s.scraped.description?.substring(0, 150),
      price: s.scraped.price,
    })),
    enrichment: enrichmentData,
  });
}

/**
 * Enrich multiple products in batch
 */
async function enrichBatch(supabase: any, params: { user_id: string; limit?: number }) {
  const { user_id, limit = 10 } = params;

  // Get products with multiple supplier links
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("product_id")
    .eq("user_id", user_id)
    .not("supplier_url", "is", null);

  if (!links?.length) return json({ enriched: 0, message: "No products with supplier links" });

  // Group by product and prioritize products with multiple sources
  const productCounts = new Map<string, number>();
  for (const l of links) {
    productCounts.set(l.product_id, (productCounts.get(l.product_id) || 0) + 1);
  }

  const sortedProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  let enriched = 0;
  const results = [];

  for (const productId of sortedProducts) {
    try {
      const result = await enrichProduct(supabase, { product_id: productId, user_id });
      const body = await result.json();
      if (body.sources_found > 0) {
        enriched++;
        results.push({ product_id: productId, sources: body.sources_found });
      }
    } catch (err) {
      console.error(`Enrich error for ${productId}:`, err);
    }
  }

  return json({ enriched, total: sortedProducts.length, results });
}

/**
 * Get all scraped sources for a product
 */
async function getSources(supabase: any, params: { product_id: string; user_id: string }) {
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, supplier_name, supplier_url, is_primary, priority, metadata")
    .eq("product_id", params.product_id)
    .eq("user_id", params.user_id);

  const sources = (links || []).map((l: any) => ({
    link_id: l.id,
    supplier_name: l.supplier_name,
    supplier_url: l.supplier_url,
    is_primary: l.is_primary,
    priority: l.priority,
    quality_score: l.metadata?.quality_score || 0,
    last_scraped_at: l.metadata?.last_scraped_at,
    scraped_data: l.metadata?.last_scraped ? {
      title: l.metadata.last_scraped.title,
      description_preview: l.metadata.last_scraped.description?.substring(0, 200),
      image_count: l.metadata.last_scraped.images?.length || 0,
      images: (l.metadata.last_scraped.images || []).slice(0, 6),
      price: l.metadata.last_scraped.price,
      stock: l.metadata.last_scraped.stock,
    } : null,
  }));

  return json({ sources });
}

/**
 * Merge the best content from multiple sources into the product
 */
async function mergeSources(supabase: any, params: {
  product_id: string;
  user_id: string;
  merge_config: {
    title_from?: string; // link_id
    description_from?: string;
    images_from?: string[]; // link_ids to collect images from
    price_from?: string;
  };
}) {
  const { product_id, user_id, merge_config } = params;

  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, supplier_name, metadata")
    .eq("product_id", product_id)
    .eq("user_id", user_id);

  if (!links?.length) return json({ error: "No links found" }, 404);

  const linkMap = new Map(links.map((l: any) => [l.id, l]));
  const updateData: any = {};
  const mergedFrom: string[] = [];

  // Title
  if (merge_config.title_from) {
    const link = linkMap.get(merge_config.title_from);
    const title = link?.metadata?.last_scraped?.title;
    if (title) {
      updateData.title = title;
      mergedFrom.push(`title:${link.supplier_name}`);
    }
  }

  // Description
  if (merge_config.description_from) {
    const link = linkMap.get(merge_config.description_from);
    const desc = link?.metadata?.last_scraped?.description;
    if (desc) {
      updateData.description = desc;
      mergedFrom.push(`description:${link.supplier_name}`);
    }
  }

  // Images — collect from multiple sources, deduplicate
  if (merge_config.images_from?.length) {
    const allImages: string[] = [];
    const seen = new Set<string>();
    for (const linkId of merge_config.images_from) {
      const link = linkMap.get(linkId);
      const imgs = link?.metadata?.last_scraped?.images || [];
      for (const img of imgs) {
        if (!seen.has(img)) {
          seen.add(img);
          allImages.push(img);
        }
      }
      mergedFrom.push(`images:${link?.supplier_name}`);
    }
    if (allImages.length) updateData.images = allImages;
  }

  // Price
  if (merge_config.price_from) {
    const link = linkMap.get(merge_config.price_from);
    const price = link?.metadata?.last_scraped?.price;
    if (price != null) {
      updateData.cost_price = price;
      mergedFrom.push(`price:${link.supplier_name}`);
    }
  }

  if (Object.keys(updateData).length === 0) {
    return json({ error: "No data to merge" }, 400);
  }

  await supabase.from("products").update(updateData).eq("id", product_id);

  return json({
    success: true,
    merged_fields: Object.keys(updateData),
    merged_from: mergedFrom,
  });
}

// ---------- Helpers ----------

async function scrapeUrl(url: string): Promise<any> {
  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (firecrawlKey) {
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: [
            { type: "json", prompt: "Extract product: title, price (number), stock (number), description (full text), all image URLs" },
          ],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const extracted = data?.data?.json || data?.json;
        if (extracted) {
          return {
            title: extracted.title || extracted.product_title || extracted.name,
            price: extracted.price != null ? parseFloat(String(extracted.price).replace(/[^0-9.,]/g, "").replace(",", ".")) : null,
            stock: extracted.stock != null ? parseInt(String(extracted.stock)) : null,
            description: extracted.description,
            images: extracted.images || extracted.image_urls || [],
          };
        }
      }
    }

    // Fallback: basic fetch
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36" },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        const product = ld["@type"] === "Product" ? ld : ld["@graph"]?.find?.((i: any) => i["@type"] === "Product");
        if (product) {
          return {
            title: product.name,
            price: parseFloat(product.offers?.price || product.offers?.[0]?.price) || null,
            stock: product.offers?.availability?.includes("InStock") ? 999 : 0,
            description: product.description,
            images: Array.isArray(product.image) ? product.image : product.image ? [product.image] : [],
          };
        }
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

function calculateSourceQuality(scraped: any): number {
  if (!scraped) return 0;
  let score = 0;
  if (scraped.title) score += 15;
  if (scraped.description) {
    score += Math.min(30, (scraped.description.length / 100) * 10);
  }
  if (scraped.images?.length) {
    score += Math.min(25, scraped.images.length * 5);
  }
  if (scraped.price != null) score += 15;
  if (scraped.stock != null) score += 15;
  return Math.round(score);
}
