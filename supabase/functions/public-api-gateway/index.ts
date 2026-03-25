import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

const API_VERSION = "v1";
const RATE_LIMITS: Record<string, { rpm: number; daily: number }> = {
  free: { rpm: 60, daily: 1000 },
  pro: { rpm: 300, daily: 10000 },
  ultra_pro: { rpm: 1000, daily: 50000 },
  enterprise: { rpm: 5000, daily: 200000 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate via API key or JWT
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("Authorization");
    let userId: string;
    let plan = "free";

    if (apiKey) {
      const { data: keyData } = await supabase.rpc("validate_api_key", { input_key: apiKey });
      if (!keyData || keyData.length === 0) {
        return jsonResponse({ error: "Invalid API key", code: "INVALID_API_KEY" }, 401);
      }
      userId = keyData[0].user_id;
      const { data: profile } = await supabase.from("profiles").select("subscription_plan").eq("id", userId).single();
      plan = profile?.subscription_plan || "free";
    } else if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return jsonResponse({ error: "Unauthorized" }, 401);
      userId = user.id;
      const { data: profile } = await supabase.from("profiles").select("subscription_plan").eq("id", userId).single();
      plan = profile?.subscription_plan || "free";
    } else {
      return jsonResponse({ error: "Authentication required. Use x-api-key header or Bearer token." }, 401);
    }

    const { action, ...params } = await req.json();

    let result;
    switch (action) {
      case "openapi_spec":
        result = getOpenApiSpec();
        break;
      case "list_products":
        result = await listProducts(supabase, userId, params);
        break;
      case "get_product":
        result = await getProduct(supabase, userId, params);
        break;
      case "list_orders":
        result = await listOrders(supabase, userId, params);
        break;
      case "get_order":
        result = await getOrder(supabase, userId, params);
        break;
      case "list_customers":
        result = await listCustomers(supabase, userId, params);
        break;
      case "api_usage":
        result = await getApiUsage(supabase, userId);
        break;
      case "rate_limits":
        result = { plan, limits: RATE_LIMITS[plan] || RATE_LIMITS.free };
        break;
      default:
        return jsonResponse({ error: `Unknown endpoint: ${action}`, available_endpoints: Object.keys(ENDPOINT_DOCS) }, 400);
    }

    // Log API usage
    const duration = Date.now() - startTime;
    await supabase.from("api_logs").insert({
      user_id: userId,
      endpoint: action,
      method: req.method,
      status_code: 200,
      duration_ms: duration,
    }).then(() => {});

    return jsonResponse({
      success: true,
      api_version: API_VERSION,
      data: result,
      meta: { request_duration_ms: duration, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    const status = error.message?.includes("rate limit") ? 429 : 500;
    return jsonResponse({ success: false, error: error.message, api_version: API_VERSION }, status);
  }
});

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ENDPOINT_DOCS: Record<string, any> = {
  list_products: { method: "POST", params: { limit: "number", offset: "number", status: "string" } },
  get_product: { method: "POST", params: { product_id: "string (required)" } },
  list_orders: { method: "POST", params: { limit: "number", offset: "number", status: "string" } },
  get_order: { method: "POST", params: { order_id: "string (required)" } },
  list_customers: { method: "POST", params: { limit: "number", offset: "number" } },
  api_usage: { method: "POST", params: {} },
  rate_limits: { method: "POST", params: {} },
  openapi_spec: { method: "POST", params: {} },
};

function getOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: { title: "ShopOpti Public API", version: "1.0.0", description: "E-commerce management API" },
    servers: [{ url: "https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/public-api-gateway" }],
    security: [{ apiKey: [] }, { bearerAuth: [] }],
    paths: Object.fromEntries(
      Object.entries(ENDPOINT_DOCS).map(([key, doc]) => [
        `/${key}`,
        { post: { summary: key.replace(/_/g, " "), parameters: doc.params, responses: { "200": { description: "Success" } } } },
      ])
    ),
    components: {
      securitySchemes: {
        apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
  };
}

async function listProducts(supabase: any, userId: string, params: any) {
  const { limit = 50, offset = 0, status } = params;
  let query = supabase.from("products")
    .select("id, title, price, compare_at_price, sku, stock_quantity, status, category, image_url, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId).range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { products: data || [], total: count || 0, limit, offset };
}

async function getProduct(supabase: any, userId: string, params: any) {
  if (!params.product_id) throw new Error("product_id is required");
  const { data, error } = await supabase.from("products").select("*").eq("id", params.product_id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  return { product: data };
}

async function listOrders(supabase: any, userId: string, params: any) {
  const { limit = 50, offset = 0, status } = params;
  let query = supabase.from("orders")
    .select("id, order_number, status, total_amount, currency, customer_name, customer_email, created_at", { count: "exact" })
    .eq("user_id", userId).range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return { orders: data || [], total: count || 0, limit, offset };
}

async function getOrder(supabase: any, userId: string, params: any) {
  if (!params.order_id) throw new Error("order_id is required");
  const { data, error } = await supabase.from("orders").select("*").eq("id", params.order_id).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  return { order: data };
}

async function listCustomers(supabase: any, userId: string, params: any) {
  const { limit = 50, offset = 0 } = params;
  const { data, count, error } = await supabase.from("customers")
    .select("id, first_name, last_name, email, total_orders, total_spent, created_at", { count: "exact" })
    .eq("user_id", userId).range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return { customers: data || [], total: count || 0, limit, offset };
}

async function getApiUsage(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase.from("api_analytics")
    .select("*").eq("user_id", userId).eq("date", today).single();
  
  const { data: keys } = await supabase.from("api_keys")
    .select("id, name, key_prefix, is_active, last_used_at, created_at")
    .eq("user_id", userId);

  return {
    today: data || { total_requests: 0, failed_requests: 0, avg_response_time_ms: 0 },
    api_keys: keys || [],
  };
}
