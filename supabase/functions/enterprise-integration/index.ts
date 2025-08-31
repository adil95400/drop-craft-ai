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
    console.log('[ENTERPRISE] Action:', action, 'Params:', params);

    switch (action) {
      case 'sync_integration':
        return await syncEnterpriseIntegration(supabaseClient, params);
      
      case 'test_connection':
        return await testIntegrationConnection(supabaseClient, params);
      
      case 'manage_settings':
        return await manageEnterpriseSettings(supabaseClient, params);
      
      case 'get_sync_status':
        return await getSyncStatus(supabaseClient, params);
      
      case 'configure_webhook':
        return await configureWebhook(supabaseClient, params);
      
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[ENTERPRISE] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function syncEnterpriseIntegration(supabase: any, params: any) {
  const { user_id, integration_id, sync_type = 'full' } = params;

  // Get integration configuration
  const { data: integration, error: integrationError } = await supabase
    .from('enterprise_integrations')
    .select('*')
    .eq('id', integration_id)
    .eq('user_id', user_id)
    .single();

  if (integrationError) throw integrationError;

  console.log(`[ENTERPRISE] Starting ${sync_type} sync for ${integration.provider_name}`);

  let syncResults = { success: false, errors: [], synced_records: 0 };

  try {
    // Simulate different integration types
    switch (integration.integration_type) {
      case 'erp':
        syncResults = await syncERPIntegration(integration, sync_type);
        break;
      case 'crm':
        syncResults = await syncCRMIntegration(integration, sync_type);
        break;
      case 'analytics':
        syncResults = await syncAnalyticsIntegration(integration, sync_type);
        break;
      case 'inventory':
        syncResults = await syncInventoryIntegration(integration, sync_type);
        break;
      case 'accounting':
        syncResults = await syncAccountingIntegration(integration, sync_type);
        break;
      default:
        syncResults = await genericSync(integration, sync_type);
    }

    // Update integration status
    const { error: updateError } = await supabase
      .from('enterprise_integrations')
      .update({
        sync_status: syncResults.success ? 'synced' : 'error',
        last_sync_at: new Date().toISOString(),
        error_logs: syncResults.errors.length > 0 ? syncResults.errors : [],
        performance_metrics: {
          last_sync_duration_ms: Math.floor(Math.random() * 5000 + 1000),
          records_synced: syncResults.synced_records,
          success_rate: syncResults.success ? 100 : 85,
          last_sync_type: sync_type
        }
      })
      .eq('id', integration_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ 
      success: true, 
      sync_results: syncResults,
      integration: integration.provider_name 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Log sync error
    await supabase
      .from('enterprise_integrations')
      .update({
        sync_status: 'error',
        error_logs: [{ 
          timestamp: new Date().toISOString(), 
          error: error.message,
          sync_type 
        }]
      })
      .eq('id', integration_id);

    throw error;
  }
}

async function testIntegrationConnection(supabase: any, params: any) {
  const { user_id, integration_type, provider_name, configuration } = params;

  console.log(`[ENTERPRISE] Testing connection to ${provider_name}`);

  // Simulate connection test
  const testResults = {
    connection_status: Math.random() > 0.2 ? 'successful' : 'failed',
    response_time_ms: Math.floor(Math.random() * 1000 + 100),
    api_version: '2.1.0',
    available_endpoints: getAvailableEndpoints(integration_type),
    authentication_status: Math.random() > 0.1 ? 'valid' : 'invalid',
    rate_limits: {
      requests_per_minute: 100,
      daily_quota: 10000,
      current_usage: Math.floor(Math.random() * 1000)
    },
    supported_features: getSupportedFeatures(integration_type)
  };

  // If connection test is successful, create or update integration
  if (testResults.connection_status === 'successful') {
    const { data: integration, error } = await supabase
      .from('enterprise_integrations')
      .upsert({
        user_id,
        integration_type,
        provider_name,
        configuration,
        sync_status: 'connected',
        is_active: true,
        performance_metrics: {
          connection_test_results: testResults
        }
      }, {
        onConflict: 'user_id,provider_name',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true, 
      test_results: testResults,
      integration 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    test_results: testResults 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function manageEnterpriseSettings(supabase: any, params: any) {
  const { user_id, action, setting_category, setting_key, setting_value, access_level = 'user' } = params;

  console.log(`[ENTERPRISE] Managing setting: ${action} ${setting_category}.${setting_key}`);

  switch (action) {
    case 'set':
      const { data: setting, error: setError } = await supabase
        .from('enterprise_settings')
        .upsert({
          user_id,
          setting_category,
          setting_key,
          setting_value,
          access_level,
          is_encrypted: shouldEncryptSetting(setting_category, setting_key)
        }, {
          onConflict: 'user_id,setting_category,setting_key',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (setError) throw setError;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'set',
        setting 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'get':
      const { data: getSetting, error: getError } = await supabase
        .from('enterprise_settings')
        .select('*')
        .eq('user_id', user_id)
        .eq('setting_category', setting_category)
        .eq('setting_key', setting_key)
        .single();

      if (getError && getError.code !== 'PGRST116') throw getError;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'get',
        setting: getSetting 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'list':
      const { data: settings, error: listError } = await supabase
        .from('enterprise_settings')
        .select('*')
        .eq('user_id', user_id)
        .eq('setting_category', setting_category)
        .order('setting_key', { ascending: true });

      if (listError) throw listError;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'list',
        settings 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    case 'delete':
      const { error: deleteError } = await supabase
        .from('enterprise_settings')
        .delete()
        .eq('user_id', user_id)
        .eq('setting_category', setting_category)
        .eq('setting_key', setting_key);

      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'delete' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    default:
      throw new Error(`Unknown settings action: ${action}`);
  }
}

async function getSyncStatus(supabase: any, params: any) {
  const { user_id, integration_id } = params;

  const { data: integration, error } = await supabase
    .from('enterprise_integrations')
    .select('*')
    .eq('id', integration_id)
    .eq('user_id', user_id)
    .single();

  if (error) throw error;

  const syncStatus = {
    current_status: integration.sync_status,
    last_sync_at: integration.last_sync_at,
    next_sync_at: calculateNextSyncTime(integration.sync_frequency),
    sync_frequency: integration.sync_frequency,
    performance_metrics: integration.performance_metrics || {},
    recent_errors: integration.error_logs?.slice(-5) || [],
    health_score: calculateHealthScore(integration)
  };

  return new Response(JSON.stringify({ 
    success: true, 
    sync_status: syncStatus 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function configureWebhook(supabase: any, params: any) {
  const { user_id, integration_id, webhook_config } = params;

  console.log('[ENTERPRISE] Configuring webhook for integration:', integration_id);

  // Simulate webhook configuration
  const webhookEndpoint = `https://api.your-app.com/webhooks/enterprise/${integration_id}`;
  const webhookSecret = generateWebhookSecret();

  const { data: integration, error } = await supabase
    .from('enterprise_integrations')
    .update({
      configuration: {
        webhook_endpoint: webhookEndpoint,
        webhook_secret: webhookSecret,
        webhook_events: webhook_config.events || ['data_sync', 'error_notification'],
        ...webhook_config
      }
    })
    .eq('id', integration_id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({ 
    success: true, 
    webhook_config: {
      endpoint: webhookEndpoint,
      events: webhook_config.events || ['data_sync', 'error_notification'],
      status: 'configured'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper functions
async function syncERPIntegration(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Syncing ERP integration');
  
  // Simulate ERP sync
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return {
    success: Math.random() > 0.1,
    errors: Math.random() > 0.8 ? [{ message: 'Connection timeout', code: 'TIMEOUT' }] : [],
    synced_records: Math.floor(Math.random() * 1000 + 100),
    data_types: ['products', 'inventory', 'orders', 'customers']
  };
}

async function syncCRMIntegration(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Syncing CRM integration');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: Math.random() > 0.05,
    errors: [],
    synced_records: Math.floor(Math.random() * 500 + 50),
    data_types: ['contacts', 'leads', 'opportunities', 'activities']
  };
}

async function syncAnalyticsIntegration(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Syncing Analytics integration');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    errors: [],
    synced_records: Math.floor(Math.random() * 10000 + 1000),
    data_types: ['events', 'metrics', 'segments', 'funnels']
  };
}

async function syncInventoryIntegration(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Syncing Inventory integration');
  
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    success: Math.random() > 0.15,
    errors: Math.random() > 0.7 ? [{ message: 'Stock level mismatch', code: 'DATA_CONFLICT' }] : [],
    synced_records: Math.floor(Math.random() * 2000 + 200),
    data_types: ['stock_levels', 'warehouses', 'transfers', 'adjustments']
  };
}

async function syncAccountingIntegration(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Syncing Accounting integration');
  
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  return {
    success: Math.random() > 0.2,
    errors: Math.random() > 0.9 ? [{ message: 'Authentication expired', code: 'AUTH_ERROR' }] : [],
    synced_records: Math.floor(Math.random() * 300 + 30),
    data_types: ['invoices', 'payments', 'expenses', 'taxes']
  };
}

async function genericSync(integration: any, syncType: string) {
  console.log('[ENTERPRISE] Generic sync for', integration.provider_name);
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: Math.random() > 0.1,
    errors: [],
    synced_records: Math.floor(Math.random() * 500 + 50),
    data_types: ['generic_data']
  };
}

function getAvailableEndpoints(integrationType: string) {
  const endpoints = {
    erp: ['/products', '/orders', '/inventory', '/customers', '/suppliers'],
    crm: ['/contacts', '/leads', '/deals', '/activities', '/campaigns'],
    analytics: ['/events', '/metrics', '/reports', '/segments', '/funnels'],
    inventory: ['/stock', '/warehouses', '/transfers', '/adjustments'],
    accounting: ['/invoices', '/payments', '/expenses', '/accounts', '/taxes']
  };
  
  return endpoints[integrationType as keyof typeof endpoints] || ['/data'];
}

function getSupportedFeatures(integrationType: string) {
  const features = {
    erp: ['real_time_sync', 'bulk_operations', 'webhooks', 'custom_fields'],
    crm: ['contact_sync', 'lead_scoring', 'pipeline_management', 'email_integration'],
    analytics: ['event_tracking', 'custom_metrics', 'real_time_dashboard', 'data_export'],
    inventory: ['stock_tracking', 'low_stock_alerts', 'multi_warehouse', 'barcode_scanning'],
    accounting: ['invoice_automation', 'expense_tracking', 'tax_calculation', 'financial_reporting']
  };
  
  return features[integrationType as keyof typeof features] || ['basic_sync'];
}

function shouldEncryptSetting(category: string, key: string) {
  const encryptedSettings = [
    'security.api_keys',
    'security.tokens',
    'security.passwords',
    'payment.credentials',
    'integration.secrets'
  ];
  
  return encryptedSettings.some(setting => {
    const [cat, k] = setting.split('.');
    return category === cat && (k === key || k === 'credentials' || k === 'secrets');
  });
}

function calculateNextSyncTime(frequency: string) {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateHealthScore(integration: any) {
  let score = 100;
  
  // Deduct points for errors
  if (integration.error_logs && integration.error_logs.length > 0) {
    score -= integration.error_logs.length * 10;
  }
  
  // Deduct points for failed sync status
  if (integration.sync_status === 'error') {
    score -= 30;
  } else if (integration.sync_status === 'warning') {
    score -= 15;
  }
  
  // Deduct points for old last sync
  if (integration.last_sync_at) {
    const lastSync = new Date(integration.last_sync_at);
    const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync > 48) {
      score -= 20;
    } else if (hoursSinceSync > 24) {
      score -= 10;
    }
  }
  
  return Math.max(0, score);
}

function generateWebhookSecret() {
  return 'whsec_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}