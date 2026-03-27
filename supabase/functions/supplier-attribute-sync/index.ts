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

    // Ensure tables exist
    await ensureTables(supabase);

    switch (action) {
      case "check_changes": return await checkChanges(supabase, params);
      case "apply_change": return await applyChange(supabase, params);
      case "dismiss_change": return await dismissChange(supabase, params);
      case "apply_all": return await applyAll(supabase, params);
      case "get_config": return await getConfig(supabase, params);
      case "save_config": return await saveConfig(supabase, params);
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

let tablesEnsured = false;
async function ensureTables(supabase: any) {
  if (tablesEnsured) return;
  // Quick check if tables exist
  const { error: e1 } = await supabase.from("attribute_sync_configs").select("id").limit(1);
  const { error: e2 } = await supabase.from("attribute_sync_changes").select("id").limit(1);
  
  if (e1 || e2) {
    // Tables don't exist - create via raw SQL using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS public.attribute_sync_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        attribute_name TEXT NOT NULL,
        sync_enabled BOOLEAN DEFAULT true,
        auto_apply BOOLEAN DEFAULT false,
        threshold_percent NUMERIC(5,2) DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(user_id, attribute_name)
      )`,
      `CREATE TABLE IF NOT EXISTS public.attribute_sync_changes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        link_id UUID,
        product_id UUID,
        attribute_name TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        change_percent NUMERIC(8,2) DEFAULT NULL,
        status TEXT DEFAULT 'pending',
        detected_at TIMESTAMPTZ DEFAULT now(),
        applied_at TIMESTAMPTZ DEFAULT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_attr_sync_changes_user_status ON public.attribute_sync_changes(user_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_attr_sync_changes_product ON public.attribute_sync_changes(product_id)`,
      `ALTER TABLE public.attribute_sync_configs ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE public.attribute_sync_changes ENABLE ROW LEVEL SECURITY`,
    ];
    
    for (const sql of sqlStatements) {
      try {
        const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "apikey": serviceKey,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.warn("Table setup query failed:", err);
      }
    }
  }
  tablesEnsured = true;
}

/**
 * Check for attribute changes by re-scraping supplier URLs
 */
async function checkChanges(supabase: any, params: { user_id: string; link_ids?: string[] }) {
  const { user_id, link_ids } = params;

  // Get product-supplier links with supplier URLs
  let query = supabase
    .from("product_supplier_links")
    .select("id, product_id, supplier_url, supplier_name, supplier_sku, last_seen_price, last_seen_stock, metadata, user_id")
    .eq("user_id", user_id)
    .not("supplier_url", "is", null);

  if (link_ids?.length) {
    query = query.in("id", link_ids);
  }

  const { data: links, error: linksErr } = await query.limit(50);
  if (linksErr) throw linksErr;
  if (!links?.length) return json({ changes: 0, message: "No supplier links with URLs" });

  // Get products for these links
  const productIds = [...new Set(links.map((l: any) => l.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, title, description, price, cost_price, stock_quantity, images, source_url")
    .in("id", productIds);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  // Get user's sync config
  const { data: configs } = await supabase
    .from("attribute_sync_configs")
    .select("*")
    .eq("user_id", user_id);

  const configMap = new Map((configs || []).map((c: any) => [c.attribute_name, c]));

  let changesDetected = 0;

  for (const link of links) {
    const product = productMap.get(link.product_id);
    if (!product) continue;

    try {
      // Try to scrape supplier page
      const scraped = await scrapeSupplierUrl(link.supplier_url, supabase);
      if (!scraped) continue;

      // Compare attributes
      const changes: any[] = [];

      // Price check
      if (scraped.price != null && product.price != null) {
        const priceDiff = Math.abs(scraped.price - (link.last_seen_price ?? product.cost_price ?? product.price));
        if (priceDiff > 0.01) {
          changes.push({
            attribute_name: "price",
            old_value: String(link.last_seen_price ?? product.cost_price ?? product.price),
            new_value: String(scraped.price),
            change_percent: link.last_seen_price ? ((scraped.price - link.last_seen_price) / link.last_seen_price * 100).toFixed(1) : null,
          });
        }
      }

      // Stock check
      if (scraped.stock != null) {
        const oldStock = link.last_seen_stock ?? product.stock_quantity ?? 0;
        if (scraped.stock !== oldStock) {
          changes.push({
            attribute_name: "stock",
            old_value: String(oldStock),
            new_value: String(scraped.stock),
          });
        }
      }

      // Title check
      if (scraped.title && product.title && scraped.title !== product.title) {
        changes.push({
          attribute_name: "title",
          old_value: product.title,
          new_value: scraped.title,
        });
      }

      // Description check
      if (scraped.description && product.description) {
        // Only flag if significantly different (>20% change)
        const similarity = textSimilarity(scraped.description, product.description);
        if (similarity < 0.8) {
          changes.push({
            attribute_name: "description",
            old_value: product.description?.substring(0, 500),
            new_value: scraped.description.substring(0, 500),
          });
        }
      }

      // Images check
      if (scraped.images?.length && product.images?.length) {
        const currentImages = Array.isArray(product.images) ? product.images : [];
        const newImages = scraped.images.filter((img: string) => !currentImages.includes(img));
        if (newImages.length > 0) {
          changes.push({
            attribute_name: "images",
            old_value: JSON.stringify(currentImages.length + " images"),
            new_value: JSON.stringify(currentImages.length + newImages.length + " images"),
            metadata: { new_images: newImages },
          });
        }
      }

      // Update last_checked_at
      await supabase
        .from("product_supplier_links")
        .update({
          last_checked_at: new Date().toISOString(),
          last_seen_price: scraped.price ?? link.last_seen_price,
          last_seen_stock: scraped.stock ?? link.last_seen_stock,
        })
        .eq("id", link.id);

      // Insert changes
      for (const change of changes) {
        const config = configMap.get(change.attribute_name);
        const autoApply = config?.auto_apply ?? false;
        const status = autoApply ? "auto_applied" : "pending";

        // Check for duplicate pending changes
        const { data: existing } = await supabase
          .from("attribute_sync_changes")
          .select("id")
          .eq("link_id", link.id)
          .eq("attribute_name", change.attribute_name)
          .eq("status", "pending")
          .limit(1);

        if (existing?.length) {
          // Update existing pending change
          await supabase
            .from("attribute_sync_changes")
            .update({ new_value: change.new_value, detected_at: new Date().toISOString() })
            .eq("id", existing[0].id);
        } else {
          await supabase
            .from("attribute_sync_changes")
            .insert({
              user_id,
              link_id: link.id,
              product_id: link.product_id,
              attribute_name: change.attribute_name,
              old_value: change.old_value,
              new_value: change.new_value,
              change_percent: change.change_percent ? parseFloat(change.change_percent) : null,
              status,
              metadata: change.metadata || {},
            });
        }

        // Auto-apply if configured
        if (autoApply) {
          await applyChangeToProduct(supabase, link.product_id, change.attribute_name, change.new_value, change.metadata);
        }

        changesDetected++;
      }
    } catch (err) {
      console.error(`Error checking link ${link.id}:`, err);
    }
  }

  return json({ changes: changesDetected, links_checked: links.length });
}

/**
 * Apply a single pending change
 */
async function applyChange(supabase: any, params: { change_id: string }) {
  const { data: change } = await supabase
    .from("attribute_sync_changes")
    .select("*")
    .eq("id", params.change_id)
    .single();

  if (!change) return json({ error: "Change not found" }, 404);
  if (change.status !== "pending") return json({ error: "Change already processed" }, 400);

  await applyChangeToProduct(supabase, change.product_id, change.attribute_name, change.new_value, change.metadata);

  await supabase
    .from("attribute_sync_changes")
    .update({ status: "applied", applied_at: new Date().toISOString() })
    .eq("id", params.change_id);

  return json({ success: true });
}

/**
 * Dismiss a pending change
 */
async function dismissChange(supabase: any, params: { change_id: string }) {
  await supabase
    .from("attribute_sync_changes")
    .update({ status: "dismissed", applied_at: new Date().toISOString() })
    .eq("id", params.change_id);

  return json({ success: true });
}

/**
 * Apply all pending changes for a user
 */
async function applyAll(supabase: any, params: { user_id: string; attribute_name?: string }) {
  let query = supabase
    .from("attribute_sync_changes")
    .select("*")
    .eq("user_id", params.user_id)
    .eq("status", "pending");

  if (params.attribute_name) {
    query = query.eq("attribute_name", params.attribute_name);
  }

  const { data: changes } = await query;
  if (!changes?.length) return json({ applied: 0 });

  let applied = 0;
  for (const change of changes) {
    try {
      await applyChangeToProduct(supabase, change.product_id, change.attribute_name, change.new_value, change.metadata);
      await supabase
        .from("attribute_sync_changes")
        .update({ status: "applied", applied_at: new Date().toISOString() })
        .eq("id", change.id);
      applied++;
    } catch (err) {
      console.error(`Failed to apply change ${change.id}:`, err);
    }
  }

  return json({ applied, total: changes.length });
}

/**
 * Get sync config for a user
 */
async function getConfig(supabase: any, params: { user_id: string }) {
  const { data } = await supabase
    .from("attribute_sync_configs")
    .select("*")
    .eq("user_id", params.user_id);

  return json({ configs: data || [] });
}

/**
 * Save sync config
 */
async function saveConfig(supabase: any, params: { user_id: string; configs: any[] }) {
  for (const config of params.configs) {
    await supabase
      .from("attribute_sync_configs")
      .upsert({
        user_id: params.user_id,
        attribute_name: config.attribute_name,
        sync_enabled: config.sync_enabled ?? true,
        auto_apply: config.auto_apply ?? false,
        threshold_percent: config.threshold_percent ?? null,
      }, { onConflict: "user_id,attribute_name" });
  }

  return json({ success: true });
}

// ---------- Helpers ----------

async function scrapeSupplierUrl(url: string, supabase: any): Promise<any> {
  try {
    // Try Firecrawl first
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
          formats: [{ type: "json", prompt: "Extract: product title, price (number), stock/quantity available (number), description, image URLs array" }],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const extracted = data?.data?.json || data?.json;
        if (extracted) {
          return {
            title: extracted.title || extracted.product_title || extracted.name,
            price: parseFloat(extracted.price) || null,
            stock: extracted.stock != null ? parseInt(extracted.stock) : (extracted.quantity != null ? parseInt(extracted.quantity) : null),
            description: extracted.description,
            images: extracted.images || extracted.image_urls || [],
          };
        }
      }
    }

    // Fallback: basic fetch
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!resp.ok) return null;

    const html = await resp.text();
    return extractFromHtml(html);
  } catch {
    return null;
  }
}

function extractFromHtml(html: string): any {
  // Try JSON-LD
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

  // Try OpenGraph
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/)?.[ 1];
  const ogPrice = html.match(/price["\s:]*(\d+[\.,]\d{2})/i)?.[1];

  if (ogTitle) {
    return {
      title: ogTitle,
      price: ogPrice ? parseFloat(ogPrice.replace(",", ".")) : null,
      stock: null,
      description: html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/)?.[ 1] || null,
      images: [],
    };
  }

  return null;
}

function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 1;
}

async function applyChangeToProduct(supabase: any, productId: string, attribute: string, newValue: string, metadata?: any) {
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
      if (metadata?.new_images?.length) {
        const { data: product } = await supabase
          .from("products")
          .select("images")
          .eq("id", productId)
          .single();
        const existing = Array.isArray(product?.images) ? product.images : [];
        updateData.images = [...existing, ...metadata.new_images];
      }
      break;
  }

  if (Object.keys(updateData).length > 0) {
    await supabase.from("products").update(updateData).eq("id", productId);
  }
}
