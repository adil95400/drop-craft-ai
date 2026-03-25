import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { action, ...params } = await req.json();

    let result;
    switch (action) {
      case "system_health":
        result = await getSystemHealth(supabase, user.id);
        break;
      case "metrics_snapshot":
        result = await getMetricsSnapshot(supabase, user.id, params);
        break;
      case "alert_rules":
        result = await manageAlertRules(supabase, user.id, params);
        break;
      case "log_aggregation":
        result = await getLogAggregation(supabase, user.id, params);
        break;
      case "uptime_report":
        result = await getUptimeReport(supabase, user.id, params);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error.message?.includes("rate limit") ? 429 : error.message?.includes("credits") ? 402 : 500;
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getSystemHealth(supabase: any, userId: string) {
  // Aggregate real metrics from multiple tables
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

  const [apiLogs, activeAlerts, importJobs, orderCount] = await Promise.all([
    supabase.from("api_logs").select("status_code, duration_ms", { count: "exact" })
      .eq("user_id", userId).gte("created_at", oneHourAgo),
    supabase.from("active_alerts").select("*", { count: "exact" })
      .eq("user_id", userId).eq("status", "active"),
    supabase.from("jobs").select("status", { count: "exact" })
      .eq("user_id", userId).eq("status", "processing"),
    supabase.from("orders").select("id", { count: "exact" })
      .eq("user_id", userId).gte("created_at", oneDayAgo),
  ]);

  const totalRequests = apiLogs.count || 0;
  const errorRequests = (apiLogs.data || []).filter((l: any) => l.status_code >= 500).length;
  const avgLatency = totalRequests > 0
    ? Math.round((apiLogs.data || []).reduce((s: number, l: any) => s + (l.duration_ms || 0), 0) / totalRequests)
    : 0;

  const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

  return {
    status: errorRate > 10 ? "degraded" : errorRate > 5 ? "warning" : "healthy",
    timestamp: now.toISOString(),
    metrics: {
      api: { total_requests_1h: totalRequests, error_rate: Math.round(errorRate * 100) / 100, avg_latency_ms: avgLatency },
      alerts: { active_count: activeAlerts.count || 0 },
      jobs: { processing_count: importJobs.count || 0 },
      orders: { last_24h: orderCount.count || 0 },
    },
    services: [
      { name: "database", status: "operational", latency_ms: avgLatency },
      { name: "edge_functions", status: "operational" },
      { name: "storage", status: "operational" },
      { name: "auth", status: "operational" },
    ],
  };
}

async function getMetricsSnapshot(supabase: any, userId: string, params: any) {
  const { period = "24h", metrics: requestedMetrics = ["api", "orders", "products"] } = params;
  const hours = period === "7d" ? 168 : period === "30d" ? 720 : 24;
  const since = new Date(Date.now() - hours * 3600000).toISOString();

  const snapshots: Record<string, any> = {};

  if (requestedMetrics.includes("api")) {
    const { data } = await supabase.from("api_analytics")
      .select("*").eq("user_id", userId).gte("date", since.split("T")[0]).order("date", { ascending: true });
    snapshots.api = {
      data_points: data || [],
      summary: {
        total_requests: (data || []).reduce((s: number, d: any) => s + (d.total_requests || 0), 0),
        total_errors: (data || []).reduce((s: number, d: any) => s + (d.failed_requests || 0), 0),
        avg_response_time: Math.round(
          (data || []).reduce((s: number, d: any) => s + (d.avg_response_time_ms || 0), 0) / Math.max((data || []).length, 1)
        ),
      },
    };
  }

  if (requestedMetrics.includes("orders")) {
    const { count } = await supabase.from("orders").select("id", { count: "exact" })
      .eq("user_id", userId).gte("created_at", since);
    snapshots.orders = { count: count || 0, period };
  }

  if (requestedMetrics.includes("products")) {
    const { count } = await supabase.from("products").select("id", { count: "exact" }).eq("user_id", userId);
    snapshots.products = { total: count || 0 };
  }

  // Persist snapshot
  await supabase.from("analytics_snapshots").insert({
    user_id: userId,
    snapshot_type: "metrics",
    snapshot_date: new Date().toISOString().split("T")[0],
    metrics: snapshots,
  });

  return snapshots;
}

async function manageAlertRules(supabase: any, userId: string, params: any) {
  const { sub_action = "list", rule } = params;

  if (sub_action === "list") {
    const { data } = await supabase.from("alert_configurations")
      .select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return { rules: data || [] };
  }

  if (sub_action === "upsert" && rule) {
    const { data, error } = await supabase.from("alert_configurations").upsert({
      ...rule,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return { rule: data };
  }

  if (sub_action === "delete" && rule?.id) {
    await supabase.from("alert_configurations").delete().eq("id", rule.id).eq("user_id", userId);
    return { deleted: true };
  }

  return { rules: [] };
}

async function getLogAggregation(supabase: any, userId: string, params: any) {
  const { log_type = "activity", limit = 100, severity, since } = params;
  const table = log_type === "api" ? "api_logs" : log_type === "audit" ? "audit_logs" : "activity_logs";

  let query = supabase.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (severity) query = query.eq("severity", severity);
  if (since) query = query.gte("created_at", since);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Aggregate by severity
  const bySeverity: Record<string, number> = {};
  (data || []).forEach((l: any) => {
    const sev = l.severity || "info";
    bySeverity[sev] = (bySeverity[sev] || 0) + 1;
  });

  return { logs: data || [], aggregation: { by_severity: bySeverity, total: (data || []).length } };
}

async function getUptimeReport(supabase: any, userId: string, params: any) {
  const { days = 30 } = params;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: apiData } = await supabase.from("api_analytics")
    .select("date, total_requests, failed_requests, avg_response_time_ms")
    .eq("user_id", userId).gte("date", since.split("T")[0]).order("date", { ascending: true });

  const totalRequests = (apiData || []).reduce((s: number, d: any) => s + (d.total_requests || 0), 0);
  const totalErrors = (apiData || []).reduce((s: number, d: any) => s + (d.failed_requests || 0), 0);
  const uptimePercent = totalRequests > 0 ? ((1 - totalErrors / totalRequests) * 100).toFixed(3) : "100.000";

  return {
    period_days: days,
    uptime_percent: parseFloat(uptimePercent),
    total_requests: totalRequests,
    total_errors: totalErrors,
    daily_breakdown: (apiData || []).map((d: any) => ({
      date: d.date,
      requests: d.total_requests || 0,
      errors: d.failed_requests || 0,
      avg_latency_ms: d.avg_response_time_ms || 0,
      uptime: d.total_requests > 0
        ? parseFloat(((1 - (d.failed_requests || 0) / d.total_requests) * 100).toFixed(2))
        : 100,
    })),
    sla_status: parseFloat(uptimePercent) >= 99.9 ? "met" : "at_risk",
  };
}
