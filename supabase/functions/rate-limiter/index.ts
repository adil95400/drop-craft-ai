import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  burstLimit?: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ai-generate": { endpoint: "ai-generate", maxRequests: 20, windowSeconds: 3600, burstLimit: 5 },
  "api-v1": { endpoint: "api-v1", maxRequests: 100, windowSeconds: 60, burstLimit: 20 },
  "import": { endpoint: "import", maxRequests: 10, windowSeconds: 300, burstLimit: 3 },
  "export": { endpoint: "export", maxRequests: 5, windowSeconds: 300, burstLimit: 2 },
  "auth": { endpoint: "auth", maxRequests: 10, windowSeconds: 900, burstLimit: 5 },
  "webhook": { endpoint: "webhook", maxRequests: 200, windowSeconds: 60, burstLimit: 50 },
  default: { endpoint: "default", maxRequests: 60, windowSeconds: 60, burstLimit: 15 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, endpoint, userId, ip } = await req.json();

    if (action === "check") {
      const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
      const key = `${userId || ip}:${config.endpoint}`;
      const now = Date.now();
      const windowMs = config.windowSeconds * 1000;

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Get recent requests count from rate_limit_entries
      const windowStart = new Date(now - windowMs).toISOString();
      const { count } = await serviceClient
        .from("api_analytics")
        .select("*", { count: "exact", head: true })
        .eq("endpoint", config.endpoint)
        .eq("user_id", userId)
        .gte("created_at", windowStart);

      const currentCount = count || 0;
      const remaining = Math.max(0, config.maxRequests - currentCount);
      const isAllowed = currentCount < config.maxRequests;

      // Burst check (last 10 seconds)
      const burstStart = new Date(now - 10_000).toISOString();
      const { count: burstCount } = await serviceClient
        .from("api_analytics")
        .select("*", { count: "exact", head: true })
        .eq("endpoint", config.endpoint)
        .eq("user_id", userId)
        .gte("created_at", burstStart);

      const burstAllowed = (burstCount || 0) < (config.burstLimit || 15);

      const resetAt = new Date(now + windowMs).toISOString();

      return new Response(JSON.stringify({
        success: true,
        allowed: isAllowed && burstAllowed,
        remaining,
        limit: config.maxRequests,
        reset_at: resetAt,
        burst_remaining: Math.max(0, (config.burstLimit || 15) - (burstCount || 0)),
        retry_after: isAllowed ? null : config.windowSeconds,
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": resetAt,
        },
      });
    }

    if (action === "get_config") {
      return new Response(JSON.stringify({
        success: true,
        data: RATE_LIMITS,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
