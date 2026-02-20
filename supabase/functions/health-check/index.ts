import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  details?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const services: ServiceHealth[] = [];

  // 1. Database check
  try {
    const dbStart = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { error } = await supabase.from("profiles").select("id").limit(1);
    const dbLatency = Date.now() - dbStart;

    services.push({
      name: "database",
      status: error ? "degraded" : dbLatency > 2000 ? "degraded" : "healthy",
      latency_ms: dbLatency,
      details: error?.message,
    });
  } catch (e) {
    services.push({
      name: "database",
      status: "down",
      latency_ms: Date.now() - start,
      details: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 2. Auth service check
  try {
    const authStart = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { error } = await supabase.auth.getSession();
    const authLatency = Date.now() - authStart;

    services.push({
      name: "auth",
      status: error ? "degraded" : authLatency > 2000 ? "degraded" : "healthy",
      latency_ms: authLatency,
    });
  } catch (e) {
    services.push({
      name: "auth",
      status: "down",
      latency_ms: Date.now() - start,
      details: e instanceof Error ? e.message : "Unknown error",
    });
  }

  // 3. Stripe check (if key available)
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (stripeKey) {
    try {
      const stripeStart = Date.now();
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
      const stripeLatency = Date.now() - stripeStart;

      services.push({
        name: "stripe",
        status: res.ok ? (stripeLatency > 3000 ? "degraded" : "healthy") : "degraded",
        latency_ms: stripeLatency,
        details: res.ok ? undefined : `HTTP ${res.status}`,
      });
    } catch (e) {
      services.push({
        name: "stripe",
        status: "down",
        latency_ms: Date.now() - start,
        details: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  // 4. Edge Functions runtime check (self)
  services.push({
    name: "edge_functions",
    status: "healthy",
    latency_ms: 0,
    details: `Deno ${Deno.version.deno}`,
  });

  // Overall status
  const overallStatus = services.some((s) => s.status === "down")
    ? "down"
    : services.some((s) => s.status === "degraded")
      ? "degraded"
      : "healthy";

  const totalLatency = Date.now() - start;

  return new Response(
    JSON.stringify({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      total_latency_ms: totalLatency,
      services,
      version: "1.0.0",
      environment: Deno.env.get("ENVIRONMENT") || "production",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: overallStatus === "down" ? 503 : 200,
    }
  );
});
