/**
 * System Monitoring — Real metrics, persisted alerts, Slack notifications
 * Actions: get_health_status, get_performance_metrics, get_business_metrics, run_full_check
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const headers = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run_full_check';

    switch (action) {
      case 'get_health_status':
        return new Response(JSON.stringify(await getHealthStatus(supabaseAdmin)), { headers });
      case 'get_performance_metrics':
        return new Response(JSON.stringify(await getPerformanceMetrics(supabaseAdmin)), { headers });
      case 'get_business_metrics':
        return new Response(JSON.stringify(await getBusinessMetrics(supabaseAdmin)), { headers });
      case 'run_full_check':
        return new Response(JSON.stringify(await runFullCheck(supabaseAdmin)), { headers });
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers });
  }
});

// ── Health Status (real latency measurements) ──
async function getHealthStatus(db: any) {
  const dbStart = Date.now();
  const { error: dbError } = await db.from('profiles').select('id').limit(1);
  const dbLatency = Date.now() - dbStart;

  const authStart = Date.now();
  await db.auth.getSession();
  const authLatency = Date.now() - authStart;

  const { data: integrations } = await db
    .from('integrations')
    .select('id, provider, status, last_sync_at, is_active')
    .eq('is_active', true);

  const healthy = integrations?.filter((i: any) => i.status === 'connected').length || 0;
  const degraded = integrations?.filter((i: any) => i.status === 'warning').length || 0;
  const critical = integrations?.filter((i: any) => i.status === 'error').length || 0;

  const overallStatus = dbError || dbLatency > 5000 ? 'critical'
    : dbLatency > 2000 || critical > 0 ? 'degraded'
    : 'healthy';

  return {
    status: overallStatus,
    database: { status: dbError ? 'down' : dbLatency > 2000 ? 'degraded' : 'healthy', latency_ms: dbLatency },
    auth: { status: authLatency > 2000 ? 'degraded' : 'healthy', latency_ms: authLatency },
    integrations: { total: integrations?.length || 0, healthy, degraded, critical },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Performance Metrics (real data from api_logs & activity_logs) ──
async function getPerformanceMetrics(db: any) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [logsRes, errorsRes, errors24Res] = await Promise.all([
    db.from('api_logs').select('response_time_ms, created_at').gte('created_at', oneHourAgo).limit(500),
    db.from('activity_logs').select('id', { count: 'exact', head: true }).eq('severity', 'error').gte('created_at', oneHourAgo),
    db.from('activity_logs').select('id', { count: 'exact', head: true }).eq('severity', 'error').gte('created_at', twentyFourHoursAgo),
  ]);

  const logs = logsRes.data || [];
  const responseTimes = logs.map((l: any) => l.response_time_ms || 0).filter((v: number) => v > 0);
  responseTimes.sort((a: number, b: number) => a - b);

  const avg = responseTimes.length > 0 ? Math.round(responseTimes.reduce((s: number, v: number) => s + v, 0) / responseTimes.length) : 0;
  const p95 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
  const p99 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;

  return {
    responseTime: { current: avg, average24h: avg, p95, p99 },
    throughput: { current: logs.length, average24h: logs.length * 24 },
    errorRate: {
      current1h: errorsRes.count ?? 0,
      current24h: errors24Res.count ?? 0,
      percentage: logs.length > 0 ? Math.round(((errorsRes.count ?? 0) / logs.length) * 10000) / 100 : 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Business Metrics (real aggregations) ──
async function getBusinessMetrics(db: any) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [orders7d, orders30d, customers7d, profiles] = await Promise.all([
    db.from('orders').select('total_amount, status').gte('created_at', sevenDaysAgo),
    db.from('orders').select('total_amount, status').gte('created_at', thirtyDaysAgo),
    db.from('customers').select('id').gte('created_at', sevenDaysAgo),
    db.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const rev7d = (orders7d.data || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const rev30d = (orders30d.data || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const count7d = orders7d.data?.length || 0;
  const count30d = orders30d.data?.length || 0;
  const aov = count7d > 0 ? rev7d / count7d : 0;

  return {
    revenue: { total7d: Math.round(rev7d * 100) / 100, total30d: Math.round(rev30d * 100) / 100 },
    orders: { total7d: count7d, total30d: count30d, averageValue: Math.round(aov * 100) / 100 },
    customers: { new7d: customers7d.data?.length || 0, totalUsers: profiles.count || 0 },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Full Check (health + persist + alert) ──
async function runFullCheck(db: any) {
  const health = await getHealthStatus(db);
  const perf = await getPerformanceMetrics(db);
  const biz = await getBusinessMetrics(db);

  // Persist snapshot
  await db.from('analytics_insights').insert({
    metric_name: 'system_health',
    metric_type: 'infrastructure',
    metric_value: health.status === 'healthy' ? 100 : health.status === 'degraded' ? 50 : 0,
    category: 'monitoring',
    metadata: { health, performance: perf },
    recorded_at: new Date().toISOString(),
  });

  // Create alert if not healthy
  if (health.status !== 'healthy') {
    const severity = health.status === 'critical' ? 'critical' : 'warning';
    const title = severity === 'critical' ? '🔴 Système critique' : '🟡 Dégradation détectée';

    await db.from('active_alerts').insert({
      alert_type: 'system_health',
      severity,
      title,
      message: `DB: ${health.database.latency_ms}ms | Auth: ${health.auth.latency_ms}ms | Errors/h: ${perf.errorRate.current1h}`,
      metadata: { health, performance: perf },
      status: 'active',
    });

    // Slack notification
    const slackUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    if (slackUrl) {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${title}\n• DB: ${health.database.latency_ms}ms\n• Errors/h: ${perf.errorRate.current1h}\n• Revenue 7d: ${biz.revenue.total7d}€`,
        }),
      }).catch(() => {});
    }
  }

  return {
    success: true,
    health,
    performance: perf,
    business: biz,
    alert_triggered: health.status !== 'healthy',
    computed_at: new Date().toISOString(),
  };
}
