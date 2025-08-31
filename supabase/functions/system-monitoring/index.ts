import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { action, ...params } = await req.json();
    console.log('[MONITORING] Action:', action, 'Params:', params);

    switch (action) {
      case 'get_system_health':
        return await getSystemHealth(supabaseClient, params);
      
      case 'get_metrics':
        return await getPerformanceMetrics(supabaseClient, params);
      
      case 'create_alert':
        return await createSystemAlert(supabaseClient, params);
      
      case 'get_alerts':
        return await getSystemAlerts(supabaseClient, params);
      
      case 'update_component_health':
        return await updateComponentHealth(supabaseClient, params);
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[MONITORING] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getSystemHealth(supabaseClient: any, params: any) {
  const { user_id } = params;

  console.log('[MONITORING] Getting system health for user:', user_id);

  // Get current system health data
  const { data: healthData, error } = await supabaseClient
    .from('system_health_monitoring')
    .select('*')
    .eq('user_id', user_id)
    .order('last_check_at', { ascending: false });

  if (error) throw error;

  // Simulate real-time health checks if no recent data
  let currentHealthData = healthData;
  if (!healthData || healthData.length === 0) {
    currentHealthData = await generateSystemHealthChecks(supabaseClient, user_id);
  }

  // Calculate overall system health
  const overallHealth = calculateOverallHealth(currentHealthData);

  // Get recent alerts
  const recentAlerts = await getRecentAlerts(currentHealthData);

  // Performance trends
  const performanceTrends = calculatePerformanceTrends(currentHealthData);

  return new Response(JSON.stringify({
    success: true,
    system_health: {
      overall_score: overallHealth.score,
      status: overallHealth.status,
      components: currentHealthData,
      recent_alerts: recentAlerts,
      performance_trends: performanceTrends,
      last_updated: new Date().toISOString()
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getPerformanceMetrics(supabaseClient: any, params: any) {
  const { user_id, metric_type = 'all', timeframe = '24h' } = params;

  console.log('[MONITORING] Getting metrics:', { user_id, metric_type, timeframe });

  let query = supabaseClient
    .from('performance_metrics')
    .select('*')
    .eq('user_id', user_id);

  if (metric_type !== 'all') {
    query = query.eq('metric_type', metric_type);
  }

  // Add time filtering
  const timeRange = getTimeRangeFromTimeframe(timeframe);
  if (timeRange) {
    query = query.gte('collected_at', timeRange);
  }

  const { data: metrics, error } = await query
    .order('collected_at', { ascending: false })
    .limit(1000);

  if (error) throw error;

  // Generate sample metrics if none exist
  if (!metrics || metrics.length === 0) {
    const sampleMetrics = await generateSampleMetrics(supabaseClient, user_id, timeframe);
    return new Response(JSON.stringify({
      success: true,
      metrics: sampleMetrics,
      aggregated: aggregateMetrics(sampleMetrics, timeframe)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    metrics,
    aggregated: aggregateMetrics(metrics, timeframe)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createSystemAlert(supabaseClient: any, params: any) {
  const { user_id, alert_type, severity, message, component_name, metadata = {} } = params;

  console.log('[MONITORING] Creating alert:', { alert_type, severity, component_name });

  // Create alert in system health monitoring
  const alertData = {
    type: alert_type,
    severity,
    message,
    component: component_name,
    timestamp: new Date().toISOString(),
    metadata
  };

  // Get or create component health record
  const { data: component, error: componentError } = await supabaseClient
    .from('system_health_monitoring')
    .select('*')
    .eq('user_id', user_id)
    .eq('component_name', component_name)
    .single();

  if (componentError && componentError.code !== 'PGRST116') throw componentError;

  if (component) {
    // Update existing component with new alert
    const updatedAlerts = [...(component.alerts_triggered || []), alertData];
    
    const { error: updateError } = await supabaseClient
      .from('system_health_monitoring')
      .update({
        alerts_triggered: updatedAlerts,
        health_status: severity === 'critical' ? 'critical' : 
                       severity === 'high' ? 'warning' : component.health_status,
        last_check_at: new Date().toISOString()
      })
      .eq('id', component.id);

    if (updateError) throw updateError;
  } else {
    // Create new component health record
    const { error: createError } = await supabaseClient
      .from('system_health_monitoring')
      .insert({
        user_id,
        component_type: 'system',
        component_name,
        health_status: severity === 'critical' ? 'critical' : 
                       severity === 'high' ? 'warning' : 'healthy',
        performance_score: severity === 'critical' ? 50 : 
                          severity === 'high' ? 70 : 90,
        alerts_triggered: [alertData],
        metrics_data: metadata
      });

    if (createError) throw createError;
  }

  return new Response(JSON.stringify({
    success: true,
    alert: alertData
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getSystemAlerts(supabaseClient: any, params: any) {
  const { user_id, severity_filter, component_filter, limit = 50 } = params;

  const { data: healthData, error } = await supabaseClient
    .from('system_health_monitoring')
    .select('*')
    .eq('user_id', user_id)
    .order('last_check_at', { ascending: false });

  if (error) throw error;

  // Extract and filter alerts
  let allAlerts: any[] = [];
  healthData.forEach((component: any) => {
    if (component.alerts_triggered && component.alerts_triggered.length > 0) {
      const componentAlerts = component.alerts_triggered.map((alert: any) => ({
        ...alert,
        component_name: component.component_name,
        component_type: component.component_type
      }));
      allAlerts = allAlerts.concat(componentAlerts);
    }
  });

  // Apply filters
  if (severity_filter) {
    allAlerts = allAlerts.filter(alert => alert.severity === severity_filter);
  }

  if (component_filter) {
    allAlerts = allAlerts.filter(alert => alert.component_name === component_filter);
  }

  // Sort by timestamp (most recent first)
  allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit results
  allAlerts = allAlerts.slice(0, limit);

  return new Response(JSON.stringify({
    success: true,
    alerts: allAlerts,
    total_count: allAlerts.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function updateComponentHealth(supabaseClient: any, params: any) {
  const { 
    user_id, 
    component_name, 
    health_status, 
    performance_score, 
    error_rate,
    response_time_ms,
    uptime_percentage,
    metrics_data = {}
  } = params;

  const { data: component, error } = await supabaseClient
    .from('system_health_monitoring')
    .upsert({
      user_id,
      component_type: 'system',
      component_name,
      health_status,
      performance_score,
      error_rate,
      response_time_ms,
      uptime_percentage,
      metrics_data,
      last_check_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,component_name',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    component
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper functions
async function generateSystemHealthChecks(supabaseClient: any, userId: string) {
  const components = [
    { name: 'database', type: 'infrastructure' },
    { name: 'api_server', type: 'application' },
    { name: 'file_storage', type: 'storage' },
    { name: 'payment_processing', type: 'external' },
    { name: 'email_service', type: 'external' },
    { name: 'cdn', type: 'infrastructure' }
  ];

  const healthChecks = components.map(component => {
    const performanceScore = Math.random() * 30 + 70; // 70-100
    const errorRate = Math.random() * 5; // 0-5%
    const responseTime = Math.floor(Math.random() * 300 + 50); // 50-350ms
    const uptime = Math.random() * 10 + 90; // 90-100%

    let healthStatus = 'healthy';
    const alerts = [];

    if (performanceScore < 80 || errorRate > 2 || uptime < 95) {
      healthStatus = 'warning';
      if (performanceScore < 80) {
        alerts.push({
          type: 'performance_degradation',
          severity: 'medium',
          message: `Performance score below threshold: ${performanceScore.toFixed(1)}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (performanceScore < 60 || errorRate > 5 || uptime < 90) {
      healthStatus = 'critical';
      alerts.push({
        type: 'system_critical',
        severity: 'critical',
        message: `Critical system state detected for ${component.name}`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      user_id: userId,
      component_type: component.type,
      component_name: component.name,
      health_status: healthStatus,
      performance_score: performanceScore,
      error_rate: errorRate,
      response_time_ms: responseTime,
      uptime_percentage: uptime,
      alerts_triggered: alerts,
      metrics_data: {
        cpu_usage: Math.random() * 60 + 10,
        memory_usage: Math.random() * 80 + 10,
        disk_usage: Math.random() * 50 + 10,
        network_io: Math.random() * 100 + 50
      },
      last_check_at: new Date().toISOString()
    };
  });

  // Save health checks to database
  const { data, error } = await supabaseClient
    .from('system_health_monitoring')
    .upsert(healthChecks, {
      onConflict: 'user_id,component_name',
      ignoreDuplicates: false
    })
    .select();

  if (error) {
    console.error('Error saving health checks:', error);
    return healthChecks;
  }

  return data;
}

async function generateSampleMetrics(supabaseClient: any, userId: string, timeframe: string) {
  const now = new Date();
  const metrics = [];
  const metricTypes = ['performance', 'availability', 'throughput', 'error_rate', 'user_engagement'];

  // Generate metrics based on timeframe
  let intervals = 24; // hours
  let intervalMs = 60 * 60 * 1000; // 1 hour

  if (timeframe === '7d') {
    intervals = 7 * 24;
  } else if (timeframe === '30d') {
    intervals = 30;
    intervalMs = 24 * 60 * 60 * 1000; // 1 day
  }

  for (let i = intervals; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * intervalMs);

    metricTypes.forEach(type => {
      const baseValue = getBaseMetricValue(type);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const value = Math.max(0, baseValue * (1 + variation));

      metrics.push({
        user_id: userId,
        metric_type: type,
        metric_name: getMetricName(type),
        metric_value: value,
        metric_unit: getMetricUnit(type),
        dimensions: {
          source: 'system_monitoring',
          interval: timeframe === '30d' ? 'daily' : 'hourly'
        },
        metadata: {
          generated: true,
          baseline: baseValue
        },
        collected_at: timestamp.toISOString()
      });
    });
  }

  // Save sample metrics
  const { data, error } = await supabaseClient
    .from('performance_metrics')
    .insert(metrics)
    .select();

  if (error) {
    console.error('Error saving sample metrics:', error);
    return metrics;
  }

  return data;
}

function calculateOverallHealth(healthData: any[]) {
  if (!healthData || healthData.length === 0) {
    return { score: 100, status: 'healthy' };
  }

  const totalScore = healthData.reduce((sum, component) => sum + (component.performance_score || 100), 0);
  const averageScore = totalScore / healthData.length;

  const criticalComponents = healthData.filter(c => c.health_status === 'critical').length;
  const warningComponents = healthData.filter(c => c.health_status === 'warning').length;

  let status = 'healthy';
  let finalScore = averageScore;

  if (criticalComponents > 0) {
    status = 'critical';
    finalScore -= criticalComponents * 20;
  } else if (warningComponents > 0) {
    status = 'warning';
    finalScore -= warningComponents * 10;
  }

  return {
    score: Math.max(0, Math.round(finalScore)),
    status
  };
}

function getRecentAlerts(healthData: any[]) {
  const alerts: any[] = [];

  healthData.forEach(component => {
    if (component.alerts_triggered && component.alerts_triggered.length > 0) {
      component.alerts_triggered.forEach((alert: any) => {
        alerts.push({
          ...alert,
          component_name: component.component_name
        });
      });
    }
  });

  return alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
}

function calculatePerformanceTrends(healthData: any[]) {
  if (!healthData || healthData.length === 0) {
    return { trend: 'stable', change: 0 };
  }

  const avgPerformance = healthData.reduce((sum, c) => sum + (c.performance_score || 100), 0) / healthData.length;
  const avgErrorRate = healthData.reduce((sum, c) => sum + (c.error_rate || 0), 0) / healthData.length;
  const avgUptime = healthData.reduce((sum, c) => sum + (c.uptime_percentage || 100), 0) / healthData.length;

  // Simple trend calculation (would be more sophisticated with historical data)
  let trend = 'stable';
  let change = 0;

  if (avgPerformance > 85 && avgErrorRate < 2 && avgUptime > 98) {
    trend = 'improving';
    change = 5;
  } else if (avgPerformance < 70 || avgErrorRate > 5 || avgUptime < 90) {
    trend = 'declining';
    change = -10;
  }

  return { trend, change };
}

function aggregateMetrics(metrics: any[], timeframe: string) {
  const aggregated: { [key: string]: any } = {};

  metrics.forEach(metric => {
    const key = metric.metric_type;
    if (!aggregated[key]) {
      aggregated[key] = {
        values: [],
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE,
        sum: 0,
        count: 0
      };
    }

    aggregated[key].values.push({
      value: metric.metric_value,
      timestamp: metric.collected_at
    });
    aggregated[key].min = Math.min(aggregated[key].min, metric.metric_value);
    aggregated[key].max = Math.max(aggregated[key].max, metric.metric_value);
    aggregated[key].sum += metric.metric_value;
    aggregated[key].count++;
  });

  // Calculate averages and trends
  Object.keys(aggregated).forEach(key => {
    const data = aggregated[key];
    data.average = data.sum / data.count;
    
    // Simple trend calculation
    if (data.values.length > 1) {
      const recent = data.values.slice(-Math.min(5, data.values.length));
      const older = data.values.slice(0, Math.min(5, data.values.length));
      
      const recentAvg = recent.reduce((sum: number, v: any) => sum + v.value, 0) / recent.length;
      const olderAvg = older.reduce((sum: number, v: any) => sum + v.value, 0) / older.length;
      
      data.trend_direction = recentAvg > olderAvg ? 'increasing' : 
                            recentAvg < olderAvg ? 'decreasing' : 'stable';
      data.trend_percentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(2) : 0;
    }
  });

  return aggregated;
}

function getTimeRangeFromTimeframe(timeframe: string) {
  const now = new Date();
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

function getBaseMetricValue(type: string) {
  const baseValues = {
    performance: 85,
    availability: 99.5,
    throughput: 1000,
    error_rate: 1.5,
    user_engagement: 75
  };
  return baseValues[type as keyof typeof baseValues] || 100;
}

function getMetricName(type: string) {
  const names = {
    performance: 'System Performance Score',
    availability: 'Service Availability',
    throughput: 'Requests per Hour',
    error_rate: 'Error Rate Percentage',
    user_engagement: 'User Engagement Score'
  };
  return names[type as keyof typeof names] || type;
}

function getMetricUnit(type: string) {
  const units = {
    performance: 'score',
    availability: 'percentage',
    throughput: 'requests/hour',
    error_rate: 'percentage',
    user_engagement: 'score'
  };
  return units[type as keyof typeof units] || 'units';
}