import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-wc-webhook-signature, x-wc-webhook-topic",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STORE-WEBHOOK] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);

/**
 * store-webhook
 * 
 * Receives webhooks from Shopify, WooCommerce, etc.
 * Routes events to the correct handler:
 *   - orders/create → auto-fulfill pipeline
 *   - products/update → stock/price sync
 *   - inventory_levels/update → stock sync
 * 
 * POST /store-webhook?platform=shopify&store_id=xxx
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") || detectPlatform(req);
    const storeId = url.searchParams.get("store_id") || "";

    const body = await req.text();
    const payload = JSON.parse(body);

    log("Webhook received", { platform, storeId, bodySize: body.length });

    // Verify webhook signature
    const isValid = await verifySignature(req, body, platform, supabase, storeId);
    if (!isValid) {
      log("INVALID SIGNATURE", { platform, storeId });
      return respond({ error: "Invalid signature" }, 401);
    }

    // Detect topic/event
    const topic = detectTopic(req, platform, payload);
    log("Event topic", { topic, platform });

    // Get store info for routing
    const { data: store } = await supabase
      .from("shops")
      .select("id, user_id, platform, name, credentials_encrypted")
      .eq("id", storeId)
      .maybeSingle();

    if (!store) {
      log("Store not found", { storeId });
      return respond({ error: "Store not found" }, 404);
    }

    // Log the webhook event
    await supabase.from("activity_logs").insert({
      user_id: store.user_id,
      action: `webhook.${platform}.${topic}`,
      entity_type: "store",
      entity_id: storeId,
      source: "webhook",
      details: {
        platform,
        topic,
        payload_keys: Object.keys(payload),
      },
    });

    // Route to handler
    const result = await routeEvent(supabase, store, topic, payload, platform);

    log("Event processed", { topic, result });
    return respond({ success: true, topic, result });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return respond({ error: msg }, 500);
  }
});


// ── Helpers ──

function detectPlatform(req: Request): string {
  if (req.headers.get("x-shopify-hmac-sha256")) return "shopify";
  if (req.headers.get("x-wc-webhook-signature")) return "woocommerce";
  return "unknown";
}

function detectTopic(req: Request, platform: string, payload: any): string {
  if (platform === "shopify") {
    return req.headers.get("x-shopify-topic") || "unknown";
  }
  if (platform === "woocommerce") {
    return req.headers.get("x-wc-webhook-topic") || payload?.action || "unknown";
  }
  return payload?.event || payload?.topic || "unknown";
}

async function verifySignature(
  req: Request, body: string, platform: string,
  supabase: any, storeId: string
): Promise<boolean> {
  // In production, verify HMAC signatures per platform
  // For now, accept if store_id exists
  if (!storeId) return false;

  if (platform === "shopify") {
    const hmac = req.headers.get("x-shopify-hmac-sha256");
    if (!hmac) return false;
    // TODO: Verify HMAC with shared secret from store credentials
    return true;
  }

  if (platform === "woocommerce") {
    const sig = req.headers.get("x-wc-webhook-signature");
    if (!sig) return false;
    // TODO: Verify signature with webhook secret
    return true;
  }

  return true;
}

async function routeEvent(
  supabase: any, store: any, topic: string, payload: any, platform: string
): Promise<Record<string, unknown>> {
  const userId = store.user_id;
  const storeId = store.id;

  // ── Order events ──
  if (topic.startsWith("orders/")) {
    return handleOrderEvent(supabase, userId, storeId, topic, payload, platform);
  }

  // ── Product events ──
  if (topic.startsWith("products/")) {
    return handleProductEvent(supabase, userId, storeId, topic, payload, platform);
  }

  // ── Inventory events ──
  if (topic.includes("inventory")) {
    return handleInventoryEvent(supabase, userId, storeId, payload, platform);
  }

  return { handled: false, topic };
}


async function handleOrderEvent(
  supabase: any, userId: string, storeId: string,
  topic: string, payload: any, platform: string
): Promise<Record<string, unknown>> {
  const externalOrderId = String(payload.id || payload.order_id || "");
  const action = topic.split("/")[1]; // create, update, cancelled, etc.

  if (action === "create" || action === "paid") {
    // Check if order already exists (idempotency)
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("external_order_id", externalOrderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return { action: "skipped", reason: "order_exists", orderId: existing.id };
    }

    // Insert new order
    const orderData = normalizeOrder(payload, platform, storeId);
    const { data: newOrder } = await supabase
      .from("orders")
      .insert({ ...orderData, user_id: userId })
      .select("id")
      .single();

    return { action: "created", orderId: newOrder?.id };
  }

  if (action === "cancelled" || action === "refunded") {
    await supabase
      .from("orders")
      .update({ status: action === "cancelled" ? "cancelled" : "refunded", updated_at: new Date().toISOString() })
      .eq("external_order_id", externalOrderId)
      .eq("user_id", userId);
    return { action: "updated", status: action };
  }

  return { action: "ignored", topic };
}


async function handleProductEvent(
  supabase: any, userId: string, storeId: string,
  topic: string, payload: any, platform: string
): Promise<Record<string, unknown>> {
  const externalId = String(payload.id || "");
  const action = topic.split("/")[1];

  // Find linked product
  const { data: link } = await supabase
    .from("product_store_links")
    .select("id, product_id")
    .eq("external_product_id", externalId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!link) {
    return { action: "skipped", reason: "no_link_found", externalId };
  }

  if (action === "update") {
    // Record sync conflict potential — mark as "outdated" from remote
    await supabase
      .from("product_store_links")
      .update({
        sync_status: "remote_updated",
        last_remote_update: new Date().toISOString(),
        remote_snapshot: { price: payload.variants?.[0]?.price, title: payload.title },
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    return { action: "conflict_flagged", productId: link.product_id };
  }

  if (action === "delete") {
    await supabase
      .from("product_store_links")
      .update({ sync_status: "remote_deleted", updated_at: new Date().toISOString() })
      .eq("id", link.id);
    return { action: "marked_deleted", productId: link.product_id };
  }

  return { action: "ignored", topic };
}


async function handleInventoryEvent(
  supabase: any, userId: string, storeId: string,
  payload: any, platform: string
): Promise<Record<string, unknown>> {
  // Shopify sends inventory_item_id + available
  const available = payload.available ?? payload.stock_quantity;
  if (available === undefined) return { action: "skipped", reason: "no_quantity" };

  // For now, log the event — actual stock reconciliation happens in the sync task
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "inventory.remote_update",
    entity_type: "store",
    entity_id: storeId,
    details: { available, payload_keys: Object.keys(payload) },
    source: "webhook",
  });

  return { action: "logged", available };
}


function normalizeOrder(payload: any, platform: string, storeId: string): Record<string, unknown> {
  if (platform === "shopify") {
    return {
      external_order_id: String(payload.id || ""),
      order_number: payload.name || payload.order_number || "",
      status: "pending",
      total_amount: parseFloat(payload.total_price || "0"),
      currency: payload.currency || "EUR",
      store_id: storeId,
      customer_jsonb: {
        email: payload.email || "",
        name: `${payload.customer?.first_name || ""} ${payload.customer?.last_name || ""}`.trim(),
        phone: payload.phone || "",
      },
      shipping_address_jsonb: payload.shipping_address || {},
      line_items_jsonb: (payload.line_items || []).map((li: any) => ({
        title: li.title,
        quantity: li.quantity,
        price: li.price,
        sku: li.sku,
        external_product_id: String(li.product_id || ""),
        external_variant_id: String(li.variant_id || ""),
      })),
    };
  }

  // WooCommerce
  return {
    external_order_id: String(payload.id || ""),
    order_number: String(payload.number || ""),
    status: "pending",
    total_amount: parseFloat(payload.total || "0"),
    currency: payload.currency || "EUR",
    store_id: storeId,
    customer_jsonb: {
      email: payload.billing?.email || "",
      name: `${payload.billing?.first_name || ""} ${payload.billing?.last_name || ""}`.trim(),
      phone: payload.billing?.phone || "",
    },
    shipping_address_jsonb: payload.shipping || {},
    line_items_jsonb: (payload.line_items || []).map((li: any) => ({
      title: li.name,
      quantity: li.quantity,
      price: li.price,
      sku: li.sku,
      external_product_id: String(li.product_id || ""),
    })),
  };
}


function respond(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
