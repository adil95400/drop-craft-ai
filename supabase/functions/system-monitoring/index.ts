import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYSTEM-MONITORING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("System monitoring function started");

    const { action, ...params } = await req.json();

    switch (action) {
      case 'get_health_status':
        return await getHealthStatus(supabaseClient);
      case 'get_performance_metrics':
        return await getPerformanceMetrics(supabaseClient);
      case 'get_business_metrics':
        return await getBusinessMetrics(supabaseClient);
      case 'log_performance_metric':
        return await logPerformanceMetric(supabaseClient, params);
      case 'create_alert':
        return await createAlert(supabaseClient, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in system-monitoring", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getHealthStatus(supabaseClient: any) {
  logStep("Getting system health status");

  // Check database connectivity
  const { error: dbError } = await supabaseClient
    .from('integrations')
    .select('id')
    .limit(1);

  // Check active integrations
  const { data: activeIntegrations } = await supabaseClient
    .from('integrations')
    .select('id, provider, status, last_sync_at')
    .eq('is_active', true);

  // Calculate system metrics
  const systemHealth = {
    database: !dbError ? 'healthy' : 'degraded',
    integrations: {
      total: activeIntegrations?.length || 0,
      healthy: activeIntegrations?.filter(i => i.status === 'connected').length || 0,
      degraded: activeIntegrations?.filter(i => i.status === 'warning').length || 0,
      critical: activeIntegrations?.filter(i => i.status === 'error').length || 0,
    },
    uptime: 99.9, // This would come from actual monitoring
    responseTime: Math.floor(Math.random() * 100) + 100, // Mock data
    lastUpdated: new Date().toISOString()
  };

  return new Response(JSON.stringify(systemHealth), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getPerformanceMetrics(supabaseClient: any) {
  logStep("Getting performance metrics");

  // In production, these would come from actual monitoring data
  const performanceMetrics = {
    responseTime: {
      current: Math.floor(Math.random() * 100) + 120,
      average24h: Math.floor(Math.random() * 50) + 150,
      p95: Math.floor(Math.random() * 100) + 200,
      p99: Math.floor(Math.random() * 200) + 300,
    },
    throughput: {
      current: Math.floor(Math.random() * 500) + 1000,
      average24h: Math.floor(Math.random() * 300) + 800,
      peak24h: Math.floor(Math.random() * 1000) + 1800,
    },
    errorRate: {
      current: Math.random() * 2,
      average24h: Math.random() * 1.5,
      peak24h: Math.random() * 5,
    },
    cpuUsage: Math.random() * 60 + 20,
    memoryUsage: Math.random() * 70 + 15,
    diskUsage: Math.random() * 50 + 30,
    lastUpdated: new Date().toISOString()
  };

  return new Response(JSON.stringify(performanceMetrics), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function getBusinessMetrics(supabaseClient: any) {
  logStep("Getting business metrics");

  // Get recent orders data
  const { data: orders } = await supabaseClient
    .from('orders')
    .select('total_amount, created_at, status')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Get customer data
  const { data: customers } = await supabaseClient
    .from('customers')
    .select('id, total_spent, total_orders, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Calculate business metrics
  const totalRevenue = orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const newCustomers = customers?.length || 0;

  const businessMetrics = {
    revenue: {
      total7d: totalRevenue,
      total30d: totalRevenue * 4.2, // Estimated
      growth7d: Math.random() * 20 + 5, // Mock growth rate
      growth30d: Math.random() * 15 + 8,
    },
    orders: {
      total7d: totalOrders,
      total30d: totalOrders * 4.1, // Estimated
      averageValue: averageOrderValue,
      conversionRate: Math.random() * 3 + 2,
    },
    customers: {
      new7d: newCustomers,
      new30d: newCustomers * 4.3, // Estimated
      retention7d: Math.random() * 30 + 60,
      lifetimeValue: Math.random() * 500 + 300,
    },
    lastUpdated: new Date().toISOString()
  };

  return new Response(JSON.stringify(businessMetrics), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function logPerformanceMetric(supabaseClient: any, params: any) {
  logStep("Logging performance metric", params);

  const { metric_type, value, metadata } = params;

  // In production, you'd store this in a metrics table
  // For now, we'll just log it
  const performanceLog = {
    metric_type,
    value,
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  logStep("Performance metric logged", performanceLog);

  return new Response(JSON.stringify({ success: true, logged: performanceLog }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function createAlert(supabaseClient: any, params: any) {
  logStep("Creating system alert", params);

  const { 
    alert_type, 
    severity, 
    title, 
    description, 
    metadata 
  } = params;

  // In production, you'd store this in an alerts table and potentially trigger notifications
  const alert = {
    id: crypto.randomUUID(),
    alert_type,
    severity,
    title,
    description,
    metadata: metadata || {},
    status: 'active',
    created_at: new Date().toISOString()
  };

  logStep("Alert created", alert);

  // Here you could trigger notifications (email, Slack, etc.)
  if (severity === 'critical') {
    logStep("CRITICAL ALERT - Notifications should be sent", alert);
  }

  return new Response(JSON.stringify({ success: true, alert }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}