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
      case "check_changes": return await checkChanges(supabase, params);
      case "apply_change": return await applyChange(supabase, params);
      case "dismiss_change": return await dismissChange(supabase, params);
      case "apply_all": return await applyAll(supabase, params);
      case "get_config": return await getConfig(supabase, params);
      case "save_config": return await saveConfig(supabase, params);
      case "get_pending": return await getPending(supabase, params);
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("supplier-attribute-sync error:", e);
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
 * Uses product_supplier_links.metadata to store:
 * - sync_config: per-attribute sync rules
 * - pending_changes: detected attribute changes awaiting review
 * - change_history: applied/dismissed changes
 */

async function checkChanges(supabase: any, params: { user_id: string; link_ids?: string[] }) {
  const { user_id, link_ids } = params;

  let query = supabase
    .from("product_supplier_links")
    .select("id, product_id, supplier_url, supplier_name, supplier_sku, last_seen_price, last_seen_stock, metadata, user_id")
    .eq("user_id", user_id)
    .not("supplier_url", "is", null);

  if (link_ids?.length) query = query.in("id", link_ids);

  const { data: links, error: linksErr } = await query.limit(50);
  if (linksErr) throw linksErr;
  if (!links?.length) return json({ changes: 0, message: "No supplier links with URLs" });

  const productIds = [...new Set(links.map((l: any) => l.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, title, description, price, cost_price, stock_quantity, images, source_url")
    .in("id", productIds);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  // Get global sync config from user's first link's metadata or defaults
  const globalConfig = getGlobalConfig(links);
  let changesDetected = 0;

  for (const link of links) {
    const product = productMap.get(link.product_id);
    if (!product) continue;

    try {
      const scraped = await scrapeSupplierUrl(link.supplier_url);
      if (!scraped) continue;

      const changes: any[] = [];
      const meta = link.metadata || {};
      const pendingChanges = meta.pending_changes || [];

      // Price
      if (scraped.price != null && globalConfig.price?.sync_enabled !== false) {
        const oldPrice = link.last_seen_price ?? product.cost_price ?? product.price;
        if (oldPrice && Math.abs(scraped.price - oldPrice) > 0.01) {
          const pct = ((scraped.price - oldPrice) / oldPrice * 100);
          const threshold = globalConfig.price?.threshold_percent ?? 0;
          if (Math.abs(pct) >= threshold) {
            changes.push({
              id: crypto.randomUUID(),
              attribute: "price",
              old_value: String(oldPrice),
              new_value: String(scraped.price),
              change_percent: +pct.toFixed(1),
              detected_at: new Date().toISOString(),
            });
          }
        }
      }

      // Stock
      if (scraped.stock != null && globalConfig.stock?.sync_enabled !== false) {
        const oldStock = link.last_seen_stock ?? product.stock_quantity ?? 0;
        if (scraped.stock !== oldStock) {
          changes.push({
            id: crypto.randomUUID(),
            attribute: "stock",
            old_value: String(oldStock),
            new_value: String(scraped.stock),
            detected_at: new Date().toISOString(),
          });
        }
      }

      // Title
      if (scraped.title && globalConfig.title?.sync_enabled !== false && product.title) {
        if (scraped.title.trim() !== product.title.trim()) {
          changes.push({
            id: crypto.randomUUID(),
            attribute: "title",
            old_value: product.title,
            new_value: scraped.title,
            detected_at: new Date().toISOString(),
          });
        }
      }

      // Description
      if (scraped.description && globalConfig.description?.sync_enabled !== false && product.description) {
        const similarity = textSimilarity(scraped.description, product.description);
        if (similarity < 0.8) {
          changes.push({
            id: crypto.randomUUID(),
            attribute: "description",
            old_value: product.description?.substring(0, 300),
            new_value: scraped.description.substring(0, 300),
            detected_at: new Date().toISOString(),
          });
        }
      }

      // Images
      if (scraped.images?.length && globalConfig.images?.sync_enabled !== false) {
        const currentImages = Array.isArray(product.images) ? product.images : [];
        const newImages = scraped.images.filter((img: string) => !currentImages.includes(img));
        if (newImages.length > 0) {
          changes.push({
            id: crypto.randomUUID(),
            attribute: "images",
            old_value: `${currentImages.length} images`,
            new_value: `${currentImages.length + newImages.length} images (+${newImages.length})`,
            extra: { new_images: newImages },
            detected_at: new Date().toISOString(),
          });
        }
      }

      // Update link with last_checked info and pending changes
      const updateData: any = {
        last_checked_at: new Date().toISOString(),
        last_seen_price: scraped.price ?? link.last_seen_price,
        last_seen_stock: scraped.stock ?? link.last_seen_stock,
      };

      // Process changes: auto-apply or queue
      const autoApplied: any[] = [];
      const queued: any[] = [...pendingChanges];

      for (const change of changes) {
        const config = globalConfig[change.attribute];
        if (config?.auto_apply) {
          await applyChangeToProduct(supabase, link.product_id, change.attribute, change.new_value, change.extra);
          autoApplied.push({ ...change, status: "auto_applied" });
        } else {
          // Check for duplicate pending
          const existing = queued.findIndex((q: any) => q.attribute === change.attribute);
          if (existing >= 0) {
            queued[existing] = change; // Update
          } else {
            queued.push(change);
          }
        }
        changesDetected++;
      }

      const history = meta.change_history || [];
      updateData.metadata = {
        ...meta,
        pending_changes: queued,
        change_history: [...autoApplied, ...history].slice(0, 50),
        sync_config: meta.sync_config || {},
      };

      await supabase.from("product_supplier_links").update(updateData).eq("id", link.id);
    } catch (err) {
      console.error(`Error checking link ${link.id}:`, err);
    }
  }

  return json({ changes: changesDetected, links_checked: links.length });
}

async function getPending(supabase: any, params: { user_id: string }) {
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, product_id, supplier_name, supplier_url, metadata")
    .eq("user_id", params.user_id)
    .not("supplier_url", "is", null);

  const pending: any[] = [];
  const history: any[] = [];

  for (const link of (links || [])) {
    const meta = link.metadata || {};
    for (const change of (meta.pending_changes || [])) {
      pending.push({
        ...change,
        link_id: link.id,
        product_id: link.product_id,
        supplier_name: link.supplier_name,
      });
    }
    for (const h of (meta.change_history || []).slice(0, 5)) {
      history.push({
        ...h,
        link_id: link.id,
        supplier_name: link.supplier_name,
      });
    }
  }

  return json({ pending, history: history.slice(0, 20) });
}

async function applyChange(supabase: any, params: { link_id: string; change_id: string }) {
  const { data: link } = await supabase
    .from("product_supplier_links")
    .select("id, product_id, metadata")
    .eq("id", params.link_id)
    .single();

  if (!link) return json({ error: "Link not found" }, 404);

  const meta = link.metadata || {};
  const pending = meta.pending_changes || [];
  const change = pending.find((c: any) => c.id === params.change_id);
  if (!change) return json({ error: "Change not found" }, 404);

  await applyChangeToProduct(supabase, link.product_id, change.attribute, change.new_value, change.extra);

  const history = meta.change_history || [];
  await supabase.from("product_supplier_links").update({
    metadata: {
      ...meta,
      pending_changes: pending.filter((c: any) => c.id !== params.change_id),
      change_history: [{ ...change, status: "applied", applied_at: new Date().toISOString() }, ...history].slice(0, 50),
    },
  }).eq("id", params.link_id);

  return json({ success: true });
}

async function dismissChange(supabase: any, params: { link_id: string; change_id: string }) {
  const { data: link } = await supabase
    .from("product_supplier_links")
    .select("id, metadata")
    .eq("id", params.link_id)
    .single();

  if (!link) return json({ error: "Link not found" }, 404);

  const meta = link.metadata || {};
  const pending = meta.pending_changes || [];
  const change = pending.find((c: any) => c.id === params.change_id);
  const history = meta.change_history || [];

  await supabase.from("product_supplier_links").update({
    metadata: {
      ...meta,
      pending_changes: pending.filter((c: any) => c.id !== params.change_id),
      change_history: change ? [{ ...change, status: "dismissed" }, ...history].slice(0, 50) : history,
    },
  }).eq("id", params.link_id);

  return json({ success: true });
}

async function applyAll(supabase: any, params: { user_id: string }) {
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, product_id, metadata")
    .eq("user_id", params.user_id);

  let applied = 0;
  for (const link of (links || [])) {
    const meta = link.metadata || {};
    const pending = meta.pending_changes || [];
    if (!pending.length) continue;

    for (const change of pending) {
      try {
        await applyChangeToProduct(supabase, link.product_id, change.attribute, change.new_value, change.extra);
        applied++;
      } catch {}
    }

    const history = meta.change_history || [];
    await supabase.from("product_supplier_links").update({
      metadata: {
        ...meta,
        pending_changes: [],
        change_history: [...pending.map((c: any) => ({ ...c, status: "applied", applied_at: new Date().toISOString() })), ...history].slice(0, 50),
      },
    }).eq("id", link.id);
  }

  return json({ applied });
}

async function getConfig(supabase: any, params: { user_id: string }) {
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("metadata")
    .eq("user_id", params.user_id)
    .limit(1);

  const config = links?.[0]?.metadata?.sync_config || {};
  return json({ config });
}

async function saveConfig(supabase: any, params: { user_id: string; config: any }) {
  // Save to all links for this user
  const { data: links } = await supabase
    .from("product_supplier_links")
    .select("id, metadata")
    .eq("user_id", params.user_id);

  for (const link of (links || [])) {
    const meta = link.metadata || {};
    await supabase.from("product_supplier_links").update({
      metadata: { ...meta, sync_config: params.config },
    }).eq("id", link.id);
  }

  return json({ success: true });
}

// ---------- Helpers ----------

function getGlobalConfig(links: any[]): Record<string, any> {
  for (const link of links) {
    if (link.metadata?.sync_config && Object.keys(link.metadata.sync_config).length > 0) {
      return link.metadata.sync_config;
    }
  }
  // Defaults
  return {
    price: { sync_enabled: true, auto_apply: false, threshold_percent: 5 },
    stock: { sync_enabled: true, auto_apply: true },
    title: { sync_enabled: true, auto_apply: false },
    description: { sync_enabled: true, auto_apply: false },
    images: { sync_enabled: true, auto_apply: false },
  };
}

async function scrapeSupplierUrl(url: string): Promise<any> {
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
          formats: [{ type: "json", prompt: "Extract product: title, price (number), stock/quantity (number), description, image URLs array" }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const extracted = data?.data?.json || data?.json;
        if (extracted) {
          return {
            title: extracted.title || extracted.product_title || extracted.name,
            price: extracted.price != null ? parseFloat(String(extracted.price).replace(/[^0-9.,]/g, '').replace(',', '.')) : null,
            stock: extracted.stock != null ? parseInt(String(extracted.stock)) : (extracted.quantity != null ? parseInt(String(extracted.quantity)) : null),
            description: extracted.description,
            images: extracted.images || extracted.image_urls || [],
          };
        }
      }
    }

    // Fallback: basic fetch + JSON-LD
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    // JSON-LD
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
    // OG
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[ 1];
    if (ogTitle) {
      const ogPrice = html.match(/price["\s:]*(\d+[\.,]\d{2})/i)?.[1];
      return {
        title: ogTitle,
        price: ogPrice ? parseFloat(ogPrice.replace(",", ".")) : null,
        stock: null,
        description: html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[ 1] || null,
        images: [],
      };
    }
    return null;
  } catch {
    return null;
  }
}

function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 1;
}

async function applyChangeToProduct(supabase: any, productId: string, attribute: string, newValue: string, extra?: any) {
  const updateData: any = {};
  switch (attribute) {
    case "price":
      updateData.cost_price = parseFloat(newValue);
      break;
    case "stock":
      updateData.stock_quantity = parseInt(newValue);
      break;
    case "title":
      updateData.title = newValue;
      break;
    case "description":
      updateData.description = newValue;
      break;
    case "images":
      if (extra?.new_images?.length) {
        const { data: product } = await supabase.from("products").select("images").eq("id", productId).single();
        const existing = Array.isArray(product?.images) ? product.images : [];
        updateData.images = [...existing, ...extra.new_images];
      }
      break;
  }
  if (Object.keys(updateData).length > 0) {
    await supabase.from("products").update(updateData).eq("id", productId);
  }
}
