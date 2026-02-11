import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(`[PLAN-GATE] ${step}${details ? ` – ${JSON.stringify(details)}` : ""}`);
};

/**
 * enforce-plan-gate
 * 
 * Called by other edge functions (or directly) to check whether a user
 * is allowed to perform an action based on their current plan and quotas.
 * 
 * POST body:
 *   { "action": "products:import" | "ai:generate" | "api:call" | ... ,
 *     "quantity": 1  (optional, defaults to 1) }
 * 
 * Returns:
 *   { "allowed": true/false, "remaining": number, "limit": number,
 *     "plan": string, "upgrade_required": string | null }
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
    // 1. Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("UNAUTHORIZED");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("UNAUTHORIZED");
    const userId = userData.user.id;
    log("Authenticated", { userId });

    // 2. Parse request
    const { action, quantity = 1 } = await req.json();
    if (!action) throw new Error("MISSING_ACTION");

    // Map action → quota_key + limit_key
    const ACTION_MAP: Record<string, { quota_key: string; limit_key: string }> = {
      "products:import":   { quota_key: "products_imported", limit_key: "max_products" },
      "products:create":   { quota_key: "products_imported", limit_key: "max_products" },
      "ai:generate":       { quota_key: "ai_generations",    limit_key: "max_ai_tasks" },
      "ai:enrich":         { quota_key: "ai_generations",    limit_key: "max_ai_tasks" },
      "api:call":          { quota_key: "api_calls",         limit_key: "max_api_calls" },
      "orders:create":     { quota_key: "orders_created",    limit_key: "max_orders" },
      "stores:connect":    { quota_key: "stores_connected",  limit_key: "max_stores" },
      "bulk:import":       { quota_key: "products_imported", limit_key: "max_products" },
      "exports:create":    { quota_key: "exports_created",   limit_key: "max_exports" },
    };

    const mapping = ACTION_MAP[action];
    if (!mapping) {
      log("Unknown action, allowing by default", { action });
      return respond({ allowed: true, remaining: -1, limit: -1, plan: "unknown", upgrade_required: null });
    }

    // 3. Get user plan from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_plan, subscription_status")
      .eq("id", userId)
      .single();

    const plan = profile?.subscription_plan || profile?.plan || "free";
    const subStatus = profile?.subscription_status;
    log("User plan", { plan, subStatus });

    // If subscription is past_due or canceled, treat as free
    const effectivePlan = (subStatus === "past_due" || subStatus === "canceled") ? "free" : plan;

    // 4. Get limit from plan_limits table
    const { data: limitRow } = await supabase
      .from("plan_limits")
      .select("limit_value")
      .eq("plan_name", effectivePlan)
      .eq("limit_key", mapping.limit_key)
      .maybeSingle();

    const limit = limitRow?.limit_value ?? 0;
    // -1 = unlimited
    if (limit === -1) {
      log("Unlimited for this plan", { action, plan: effectivePlan });
      return respond({ allowed: true, remaining: -1, limit: -1, plan: effectivePlan, upgrade_required: null });
    }

    // 5. Get current usage from quota_usage
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: usageRow } = await supabase
      .from("quota_usage")
      .select("current_usage, id")
      .eq("user_id", userId)
      .eq("quota_key", mapping.quota_key)
      .gte("period_start", periodStart)
      .maybeSingle();

    const currentUsage = usageRow?.current_usage ?? 0;
    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage + quantity <= limit;

    log("Quota check", { action, currentUsage, limit, quantity, allowed, remaining });

    // 6. Determine upgrade suggestion
    let upgradeRequired: string | null = null;
    if (!allowed) {
      const PLAN_ORDER = ["free", "starter", "standard", "pro", "enterprise"];
      const currentIdx = PLAN_ORDER.indexOf(effectivePlan);
      upgradeRequired = currentIdx < PLAN_ORDER.length - 1 ? PLAN_ORDER[currentIdx + 1] : null;
    }

    // 7. If allowed, increment usage
    if (allowed) {
      if (usageRow?.id) {
        await supabase
          .from("quota_usage")
          .update({ current_usage: currentUsage + quantity, updated_at: now.toISOString() })
          .eq("id", usageRow.id);
      } else {
        await supabase
          .from("quota_usage")
          .insert({
            user_id: userId,
            quota_key: mapping.quota_key,
            current_usage: quantity,
            period_start: periodStart,
            period_end: periodEnd,
          });
      }
      log("Usage incremented", { quota_key: mapping.quota_key, newUsage: currentUsage + quantity });
    }

    return respond({
      allowed,
      remaining: allowed ? remaining - quantity : remaining,
      limit,
      plan: effectivePlan,
      upgrade_required: upgradeRequired,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });

    if (msg === "UNAUTHORIZED") {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: msg } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function respond(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
