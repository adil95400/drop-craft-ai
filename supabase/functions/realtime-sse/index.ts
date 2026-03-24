import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claimsData.claims.sub;
  const url = new URL(req.url);
  const channels = (url.searchParams.get("channels") || "metrics").split(",");

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { closed = true; }
      };

      // Send initial heartbeat
      send("connected", { channels, userId, timestamp: new Date().toISOString() });

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        send("heartbeat", { t: Date.now() });
      }, 30_000);

      // Subscribe to requested channels
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const subscriptions: ReturnType<typeof serviceClient.channel>[] = [];

      if (channels.includes("metrics")) {
        const ch = serviceClient
          .channel("metrics-" + userId)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "analytics_insights",
            filter: `user_id=eq.${userId}`,
          }, (payload) => send("metric", payload))
          .subscribe();
        subscriptions.push(ch);
      }

      if (channels.includes("alerts")) {
        const ch = serviceClient
          .channel("alerts-" + userId)
          .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "active_alerts",
            filter: `user_id=eq.${userId}`,
          }, (payload) => send("alert", payload))
          .subscribe();
        subscriptions.push(ch);
      }

      if (channels.includes("orders")) {
        const ch = serviceClient
          .channel("orders-" + userId)
          .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          }, (payload) => send("order", payload))
          .subscribe();
        subscriptions.push(ch);
      }

      // Periodic metrics snapshot every 60s
      const metricsInterval = setInterval(async () => {
        if (closed) return;
        try {
          const { data } = await serviceClient
            .from("analytics_insights")
            .select("metric_name, metric_value, trend, trend_percentage")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(10);
          send("snapshot", { metrics: data, timestamp: new Date().toISOString() });
        } catch { /* silent */ }
      }, 60_000);

      // Cleanup on close
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(metricsInterval);
        subscriptions.forEach((s) => s.unsubscribe());
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
