import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntegrationHealthCheck {
  integration_id: string;
  user_id: string;
  platform_name: string;
  endpoint_url?: string;
  api_key_hash?: string;
}

interface HealthMetrics {
  status: 'healthy' | 'warning' | 'error' | 'offline';
  uptime: number;
  response_time: number;
  error_rate: number;
  throughput: number;
  last_sync: string;
  health_score: number;
  predictions: {
    next_failure?: string;
    performance_trend: 'improving' | 'stable' | 'degrading';
    recommended_actions: string[];
  };
  auto_healing: {
    enabled: boolean;
    last_action?: string;
    success_rate: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'monitor';

    if (action === 'monitor') {
      return await handleHealthMonitoring(req, supabase);
    } else if (action === 'heal') {
      return await handleAutoHealing(req, supabase);
    } else if (action === 'predict') {
      return await handlePredictiveAnalysis(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in integration health monitor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Health monitoring failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleHealthMonitoring(req: Request, supabase: any) {
  const { integration_id, user_id } = await req.json() as { integration_id?: string, user_id: string };

  console.log(`Monitoring health for user: ${user_id}, integration: ${integration_id || 'all'}`);

  // Get integrations to monitor
  let query = supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_active', true);

  if (integration_id) {
    query = query.eq('id', integration_id);
  }

  const { data: integrations, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch integrations: ${error.message}`);
  }

  const healthMetrics: Record<string, HealthMetrics> = {};

  for (const integration of integrations) {
    const metrics = await performHealthCheck(integration);
    healthMetrics[integration.id] = metrics;

    // Store metrics in database
    await supabase
      .from('integration_health_metrics')
      .upsert({
        integration_id: integration.id,
        user_id: integration.user_id,
        metrics,
        checked_at: new Date().toISOString()
      });

    // Check if auto-healing is needed
    if (metrics.status === 'error' && metrics.auto_healing.enabled) {
      await triggerAutoHealing(integration, supabase);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      health_metrics: healthMetrics,
      checked_at: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAutoHealing(req: Request, supabase: any) {
  const { integration_id, user_id, issue_type } = await req.json();

  console.log(`Auto-healing integration ${integration_id} for issue: ${issue_type}`);

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integration_id)
    .eq('user_id', user_id)
    .single();

  if (error || !integration) {
    throw new Error('Integration not found');
  }

  const healingResult = await performAutoHealing(integration, issue_type);

  // Log healing attempt
  await supabase
    .from('integration_healing_logs')
    .insert({
      integration_id,
      user_id,
      issue_type,
      healing_action: healingResult.action,
      success: healingResult.success,
      details: healingResult.details,
      performed_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      healing_result: healingResult,
      performed_at: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePredictiveAnalysis(req: Request, supabase: any) {
  const { user_id, integration_id, time_horizon } = await req.json();

  console.log(`Generating predictions for integration ${integration_id}, horizon: ${time_horizon}`);

  // Get historical health data
  const { data: healthHistory, error } = await supabase
    .from('integration_health_metrics')
    .select('*')
    .eq('integration_id', integration_id)
    .eq('user_id', user_id)
    .order('checked_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch health history: ${error.message}`);
  }

  const predictions = await generatePredictions(healthHistory, time_horizon);

  // Store predictions
  await supabase
    .from('integration_predictions')
    .upsert({
      integration_id,
      user_id,
      predictions,
      time_horizon,
      generated_at: new Date().toISOString()
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      predictions,
      generated_at: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function performHealthCheck(integration: any): Promise<HealthMetrics> {
  const startTime = Date.now();
  
  try {
    // Simulate API health check based on platform
    const response = await simulateAPICheck(integration);
    const responseTime = Date.now() - startTime;

    // Calculate health metrics
    const metrics: HealthMetrics = {
      status: response.status,
      uptime: response.uptime,
      response_time: responseTime,
      error_rate: response.error_rate,
      throughput: response.throughput,
      last_sync: integration.last_sync_at || new Date().toISOString(),
      health_score: calculateHealthScore(response),
      predictions: await generateHealthPredictions(integration),
      auto_healing: {
        enabled: true,
        last_action: response.last_healing_action,
        success_rate: response.healing_success_rate || 85
      }
    };

    return metrics;
  } catch (error) {
    console.error(`Health check failed for ${integration.platform_name}:`, error);
    
    return {
      status: 'error',
      uptime: 0,
      response_time: 5000,
      error_rate: 100,
      throughput: 0,
      last_sync: integration.last_sync_at || new Date().toISOString(),
      health_score: 0,
      predictions: {
        performance_trend: 'degrading',
        recommended_actions: ['Reconnexion d\'urgence requise', 'Vérifier credentials']
      },
      auto_healing: {
        enabled: true,
        last_action: 'Connection check failed',
        success_rate: 0
      }
    };
  }
}

async function simulateAPICheck(integration: any) {
  // Simulate different response patterns based on platform
  const platformResponses = {
    'Shopify': { status: 'healthy', uptime: 99.8, error_rate: 0.2, throughput: 1250 },
    'WooCommerce': { status: 'warning', uptime: 97.5, error_rate: 2.1, throughput: 850 },
    'Stripe': { status: 'healthy', uptime: 99.9, error_rate: 0.1, throughput: 2100 },
    'MailChimp': { status: 'error', uptime: 85.2, error_rate: 8.5, throughput: 320 }
  };

  const baseResponse = platformResponses[integration.platform_name as keyof typeof platformResponses] || {
    status: 'healthy',
    uptime: 99.0,
    error_rate: 1.0,
    throughput: 500
  };

  // Add some randomness to simulate real-world variations
  return {
    ...baseResponse,
    uptime: baseResponse.uptime + (Math.random() - 0.5) * 2,
    error_rate: Math.max(0, baseResponse.error_rate + (Math.random() - 0.5) * 1),
    throughput: Math.max(0, baseResponse.throughput + (Math.random() - 0.5) * 200),
    last_healing_action: 'Cache refresh automatique',
    healing_success_rate: 85 + Math.random() * 15
  };
}

function calculateHealthScore(response: any): number {
  const uptimeScore = response.uptime;
  const errorScore = Math.max(0, 100 - response.error_rate * 10);
  const throughputScore = Math.min(100, response.throughput / 20);
  
  return Math.round((uptimeScore + errorScore + throughputScore) / 3);
}

async function generateHealthPredictions(integration: any) {
  // Simple prediction logic based on current state
  const predictions = {
    performance_trend: 'stable' as const,
    recommended_actions: [] as string[]
  };

  // Add platform-specific predictions
  if (integration.platform_name === 'WooCommerce') {
    predictions.performance_trend = 'degrading';
    predictions.recommended_actions = [
      'Redémarrer service',
      'Vérifier quotas API',
      'Mettre à jour credentials'
    ];
  } else if (integration.platform_name === 'MailChimp') {
    predictions.performance_trend = 'degrading';
    predictions.recommended_actions = [
      'Reconnexion d\'urgence requise',
      'Vérifier credentials expirés',
      'Basculer vers backup'
    ];
  } else {
    predictions.recommended_actions = ['Configuration optimale maintenue'];
  }

  return predictions;
}

async function triggerAutoHealing(integration: any, supabase: any) {
  console.log(`Triggering auto-healing for integration: ${integration.platform_name}`);
  
  // Simulate auto-healing actions
  const healingActions = [
    'Refresh API token',
    'Restart connection',
    'Clear cache',
    'Retry failed requests',
    'Switch to backup endpoint'
  ];

  const action = healingActions[Math.floor(Math.random() * healingActions.length)];
  const success = Math.random() > 0.3; // 70% success rate

  await supabase
    .from('integration_healing_logs')
    .insert({
      integration_id: integration.id,
      user_id: integration.user_id,
      issue_type: 'automatic_detection',
      healing_action: action,
      success,
      details: success ? 'Auto-healing completed successfully' : 'Auto-healing failed, manual intervention required',
      performed_at: new Date().toISOString()
    });

  return { action, success };
}

async function performAutoHealing(integration: any, issueType: string) {
  // Simulate healing based on issue type
  const healingStrategies = {
    'connection_timeout': 'Restart connection pool',
    'authentication_error': 'Refresh API tokens',
    'rate_limit': 'Implement exponential backoff',
    'server_error': 'Switch to backup endpoint',
    'data_sync_error': 'Clear cache and retry'
  };

  const action = healingStrategies[issueType as keyof typeof healingStrategies] || 'Generic healing action';
  const success = Math.random() > 0.2; // 80% success rate

  return {
    action,
    success,
    details: success 
      ? `Successfully resolved ${issueType} using ${action}`
      : `Failed to resolve ${issueType}, manual intervention required`
  };
}

async function generatePredictions(healthHistory: any[], timeHorizon: string) {
  // Simple trend analysis
  if (healthHistory.length < 2) {
    return {
      failure_probability: 0.1,
      performance_trend: 'stable',
      recommended_maintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  const recent = healthHistory.slice(0, 10);
  const avgHealthScore = recent.reduce((sum, item) => sum + (item.metrics?.health_score || 50), 0) / recent.length;
  
  return {
    failure_probability: Math.max(0, (100 - avgHealthScore) / 100),
    performance_trend: avgHealthScore > 80 ? 'improving' : avgHealthScore > 60 ? 'stable' : 'degrading',
    recommended_maintenance: new Date(Date.now() + (avgHealthScore > 80 ? 14 : 7) * 24 * 60 * 60 * 1000).toISOString(),
    confidence: Math.min(100, recent.length * 10)
  };
}