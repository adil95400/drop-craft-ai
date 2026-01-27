import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    console.log('Starting integration health monitoring...')

    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('integrations')
      .select('*')
      .neq('connection_status', 'disconnected')

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`)
    }

    const healthResults = []

    for (const integration of integrations || []) {
      console.log(`Checking health for integration ${integration.id} (${integration.platform})`)
      
      try {
        const healthCheck = await checkIntegrationHealth(integration)
        
        if (healthCheck.status !== integration.connection_status) {
          await supabaseClient
            .from('integrations')
            .update({ 
              connection_status: healthCheck.status,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', integration.id)
        }

        await supabaseClient
          .from('health_logs')
          .insert({
            integration_id: integration.id,
            status: healthCheck.status,
            response_time: healthCheck.response_time,
            details: healthCheck.details,
            created_at: new Date().toISOString()
          })

        healthResults.push({
          integration_id: integration.id,
          platform: integration.platform_type,
          status: healthCheck.status,
          response_time: healthCheck.response_time
        })

      } catch (error) {
        console.error(`Health check failed for integration ${integration.id}:`, error)
        
        await supabaseClient
          .from('integrations')
          .update({ 
            connection_status: 'error',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration.id)

        healthResults.push({
          integration_id: integration.id,
          platform: integration.platform_type,
          status: 'error',
          error: error.message
        })
      }
    }

    const healthy = healthResults.filter(r => r.status === 'healthy').length
    const unhealthy = healthResults.filter(r => r.status !== 'healthy').length

    console.log(`Health monitoring completed. Checked ${healthResults.length} integrations`)

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        checked_integrations: healthResults.length,
        healthy: healthy,
        unhealthy: unhealthy,
        total: integrations.length,
        results: healthResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Health monitoring error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function checkIntegrationHealth(integration: any) {
  const startTime = Date.now()
  
  try {
    let healthStatus = 'healthy'
    let details = {}

    switch (integration.platform_type) {
      case 'shopify':
        details = await checkShopifyHealth(integration)
        break
      case 'woocommerce':
        details = await checkWooCommerceHealth(integration)
        break
      case 'amazon':
        details = await checkAmazonHealth(integration)
        break
      case 'prestashop':
        details = await checkPrestaShopHealth(integration)
        break
      default:
        details = await checkGenericHealth(integration)
    }

    const responseTime = Date.now() - startTime

    if (responseTime > 10000) {
      healthStatus = 'slow'
    } else if (details.error) {
      healthStatus = 'error'
    }

    return {
      status: healthStatus,
      response_time: responseTime,
      details
    }

  } catch (error) {
    return {
      status: 'error',
      response_time: Date.now() - startTime,
      details: { error: error.message }
    }
  }
}

async function checkShopifyHealth(integration: any) {
  const config = integration.config || {}
  const credentials = config.credentials || {}
  const shopDomain = credentials.shop_domain || integration.store_url
  const accessToken = credentials.access_token

  if (!shopDomain || !accessToken) {
    return { error: 'Missing Shopify credentials', status: 'unconfigured' }
  }

  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { error: `Shopify API error: ${response.status}`, details: errorText }
    }

    const data = await response.json()
    return {
      shop_name: data.shop?.name || 'Unknown',
      plan: data.shop?.plan_name || 'Unknown',
      api_version: '2024-01',
      status: 'connected'
    }
  } catch (error) {
    return { error: error.message, status: 'connection_failed' }
  }
}

async function checkWooCommerceHealth(integration: any) {
  const config = integration.config || {}
  const credentials = config.credentials || {}
  const storeUrl = credentials.store_url || integration.store_url
  const consumerKey = credentials.consumer_key
  const consumerSecret = credentials.consumer_secret

  if (!storeUrl || !consumerKey || !consumerSecret) {
    return { error: 'Missing WooCommerce credentials', status: 'unconfigured' }
  }

  try {
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const response = await fetch(`${storeUrl}/wp-json/wc/v3/system_status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return { error: `WooCommerce API error: ${response.status}`, status: 'api_error' }
    }

    const data = await response.json()
    return {
      version: data.environment?.version || 'Unknown',
      php_version: data.environment?.php_version || 'Unknown',
      wordpress_version: data.environment?.wp_version || 'Unknown',
      status: 'connected'
    }
  } catch (error) {
    return { error: error.message, status: 'connection_failed' }
  }
}

async function checkAmazonHealth(integration: any) {
  const config = integration.config || {}
  const credentials = config.credentials || {}
  
  if (!credentials.refresh_token || !credentials.client_id) {
    return { error: 'Missing Amazon SP-API credentials', status: 'unconfigured' }
  }

  // Amazon SP-API requires OAuth token refresh - just verify credentials exist
  return {
    marketplace: credentials.marketplace || 'Unknown',
    status: 'credentials_configured',
    last_sync: integration.last_sync_at,
    note: 'Full health check requires active session'
  }
}

async function checkPrestaShopHealth(integration: any) {
  const config = integration.config || {}
  const credentials = config.credentials || {}
  const storeUrl = credentials.store_url || integration.store_url
  const apiKey = credentials.api_key

  if (!storeUrl || !apiKey) {
    return { error: 'Missing PrestaShop credentials', status: 'unconfigured' }
  }

  try {
    const auth = btoa(`${apiKey}:`)
    const response = await fetch(`${storeUrl}/api/`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Output-Format': 'JSON',
      },
    })

    if (!response.ok) {
      return { error: `PrestaShop API error: ${response.status}`, status: 'api_error' }
    }

    return {
      status: 'connected',
      webservice: 'active',
      last_activity: integration.last_sync_at
    }
  } catch (error) {
    return { error: error.message, status: 'connection_failed' }
  }
}

async function checkGenericHealth(integration: any) {
  const config = integration.config || {}
  const hasCredentials = config.credentials && Object.keys(config.credentials).length > 0

  return {
    platform: integration.platform_type,
    status: hasCredentials ? 'credentials_configured' : 'unconfigured',
    last_activity: integration.last_sync_at || integration.created_at,
    note: 'Platform-specific health check not implemented'
  }
}
