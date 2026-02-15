import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[MONITORING] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    const { action, metric_type, timeframe } = await req.json();

    logStep('Request details', { action, metric_type, timeframe });

    let result;
    switch (action) {
      case 'get_metrics':
        result = await getMetrics(metric_type, timeframe, supabase, user.id);
        break;
      case 'get_system_health':
        result = await getSystemHealth(supabase, user.id);
        break;
      case 'get_api_usage':
        result = await getApiUsage(timeframe, supabase, user.id);
        break;
      case 'get_error_logs':
        result = await getErrorLogs(timeframe, supabase, user.id);
        break;
      case 'get_performance_stats':
        result = await getPerformanceStats(timeframe, supabase, user.id);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Error', { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function getMetrics(metricType: string, timeframe: string, supabase: any, userId: string) {
  logStep('Getting metrics', { metricType, timeframe });

  const timeFilter = getTimeFilter(timeframe);
  const metrics = {};

  switch (metricType) {
    case 'imports':
      metrics = await getImportMetrics(timeFilter, supabase, userId);
      break;
    case 'sync':
      metrics = await getSyncMetrics(timeFilter, supabase, userId);
      break;
    case 'orders':
      metrics = await getOrderMetrics(timeFilter, supabase, userId);
      break;
    case 'products':
      metrics = await getProductMetrics(timeFilter, supabase, userId);
      break;
    case 'all':
      metrics = {
        imports: await getImportMetrics(timeFilter, supabase, userId),
        sync: await getSyncMetrics(timeFilter, supabase, userId),
        orders: await getOrderMetrics(timeFilter, supabase, userId),
        products: await getProductMetrics(timeFilter, supabase, userId)
      };
      break;
    default:
      throw new Error('Invalid metric type');
  }

  return {
    success: true,
    metric_type: metricType,
    timeframe,
    data: metrics
  };
}

async function getImportMetrics(timeFilter: string, supabase: any, userId: string) {
  const { data: imports, error } = await supabase
    .from('jobs')
    .select('status, created_at, total_rows, success_rows, error_rows')
    .eq('user_id', userId)
    .gte('created_at', timeFilter);

  if (error) throw error;

  const total = imports.length;
  const successful = imports.filter(i => i.status === 'completed').length;
  const failed = imports.filter(i => i.status === 'failed').length;
  const totalProducts = imports.reduce((sum, i) => sum + (i.total_rows || 0), 0);
  const successfulProducts = imports.reduce((sum, i) => sum + (i.success_rows || 0), 0);

  return {
    total_imports: total,
    successful_imports: successful,
    failed_imports: failed,
    success_rate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
    total_products_processed: totalProducts,
    successful_products: successfulProducts,
    product_success_rate: totalProducts > 0 ? (successfulProducts / totalProducts * 100).toFixed(2) : 0
  };
}

async function getSyncMetrics(timeFilter: string, supabase: any, userId: string) {
  const { data: syncs, error } = await supabase
    .from('platform_integrations')
    .select('platform_name, sync_status, last_sync_at, error_message')
    .eq('user_id', userId)
    .gte('last_sync_at', timeFilter);

  if (error) throw error;

  const total = syncs.length;
  const successful = syncs.filter(s => s.sync_status === 'success').length;
  const failed = syncs.filter(s => s.sync_status === 'error').length;

  const platformStats = syncs.reduce((acc, sync) => {
    if (!acc[sync.platform_name]) {
      acc[sync.platform_name] = { total: 0, successful: 0, failed: 0 };
    }
    acc[sync.platform_name].total++;
    if (sync.sync_status === 'success') acc[sync.platform_name].successful++;
    if (sync.sync_status === 'error') acc[sync.platform_name].failed++;
    return acc;
  }, {});

  return {
    total_syncs: total,
    successful_syncs: successful,
    failed_syncs: failed,
    success_rate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
    platform_stats: platformStats
  };
}

async function getOrderMetrics(timeFilter: string, supabase: any, userId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('status, total_amount, currency, created_at')
    .eq('user_id', userId)
    .gte('created_at', timeFilter);

  if (error) throw error;

  const total = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const avgOrderValue = total > 0 ? (totalRevenue / total).toFixed(2) : 0;

  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total_orders: total,
    total_revenue: totalRevenue.toFixed(2),
    average_order_value: avgOrderValue,
    status_breakdown: statusBreakdown
  };
}

async function getProductMetrics(timeFilter: string, supabase: any, userId: string) {
  const { data: products, error } = await supabase
    .from('imported_products')
    .select('status, review_status, ai_optimized, created_at')
    .eq('user_id', userId)
    .gte('created_at', timeFilter);

  if (error) throw error;

  const total = products.length;
  const published = products.filter(p => p.status === 'published').length;
  const aiOptimized = products.filter(p => p.ai_optimized === true).length;

  const statusBreakdown = products.reduce((acc, product) => {
    acc[product.status] = (acc[product.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total_products: total,
    published_products: published,
    ai_optimized_products: aiOptimized,
    publish_rate: total > 0 ? (published / total * 100).toFixed(2) : 0,
    ai_optimization_rate: total > 0 ? (aiOptimized / total * 100).toFixed(2) : 0,
    status_breakdown: statusBreakdown
  };
}

async function getSystemHealth(supabase: any, userId: string) {
  logStep('Getting system health');

  // Check various system components
  const health = {
    database: 'healthy',
    api: 'healthy',
    integrations: await checkIntegrationsHealth(supabase, userId),
    quotas: await checkQuotaHealth(supabase, userId),
    overall: 'healthy'
  };

  // Determine overall health
  const components = Object.values(health).filter(v => typeof v === 'string');
  if (components.some(status => status === 'critical')) {
    health.overall = 'critical';
  } else if (components.some(status => status === 'warning')) {
    health.overall = 'warning';
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    health
  };
}

async function checkIntegrationsHealth(supabase: any, userId: string) {
  const { data: integrations, error } = await supabase
    .from('platform_integrations')
    .select('sync_status, error_message')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) return 'critical';

  const failedIntegrations = integrations.filter(i => i.sync_status === 'error').length;
  const totalIntegrations = integrations.length;

  if (totalIntegrations === 0) return 'healthy';
  if (failedIntegrations === 0) return 'healthy';
  if (failedIntegrations / totalIntegrations > 0.5) return 'critical';
  return 'warning';
}

async function checkQuotaHealth(supabase: any, userId: string) {
  const { data: quotas, error } = await supabase
    .from('user_quotas')
    .select('quota_key, current_count, reset_date')
    .eq('user_id', userId);

  if (error) return 'critical';

  // Check if any quotas are near limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  if (!profile) return 'warning';

  const { data: limits } = await supabase
    .from('plans_limits')
    .select('limit_key, limit_value')
    .eq('plan', profile.plan);

  if (!limits) return 'warning';

  let status = 'healthy';
  for (const quota of quotas) {
    const limit = limits.find(l => l.limit_key === quota.quota_key);
    if (limit && limit.limit_value > 0) {
      const usage = quota.current_count / limit.limit_value;
      if (usage > 0.9) status = 'critical';
      else if (usage > 0.8) status = 'warning';
    }
  }

  return status;
}

async function getApiUsage(timeframe: string, supabase: any, userId: string) {
  // Mock API usage data - in production, this would come from actual API logs
  return {
    success: true,
    timeframe,
    data: {
      total_requests: 1245,
      successful_requests: 1200,
      failed_requests: 45,
      average_response_time: 125,
      requests_by_endpoint: {
        '/api/products': 450,
        '/api/orders': 320,
        '/api/sync': 275,
        '/api/import': 200
      }
    }
  };
}

async function getErrorLogs(timeframe: string, supabase: any, userId: string) {
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('action, description, severity, created_at, metadata')
    .eq('user_id', userId)
    .in('severity', ['error', 'critical'])
    .gte('created_at', getTimeFilter(timeframe))
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const errorsByType = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  return {
    success: true,
    timeframe,
    data: {
      total_errors: logs.length,
      errors_by_type: errorsByType,
      recent_errors: logs.slice(0, 10)
    }
  };
}

async function getPerformanceStats(timeframe: string, supabase: any, userId: string) {
  // Mock performance data - in production, this would come from actual metrics
  return {
    success: true,
    timeframe,
    data: {
      average_import_time: 15.5, // seconds
      average_sync_time: 8.2, // seconds
      database_query_time: 45, // ms
      api_response_time: 125, // ms
      memory_usage: 67, // percentage
      cpu_usage: 23, // percentage
      cache_hit_rate: 94.2 // percentage
    }
  };
}

function getTimeFilter(timeframe: string): string {
  const now = new Date();
  let pastDate: Date;

  switch (timeframe) {
    case '1h':
      pastDate = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '24h':
      pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return pastDate.toISOString();
}