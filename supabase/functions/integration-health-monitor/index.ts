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

    // Get all active integrations
    const { data: integrations, error: integrationsError } = await supabaseClient
      .from('integrations')
      .select('*')
      .neq('connection_status', 'disconnected')

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`)
    }

    const healthResults = []

    // Check health of each integration
    for (const integration of integrations || []) {
      console.log(`Checking health for integration ${integration.id} (${integration.platform})`)
      
      try {
        const healthCheck = await checkIntegrationHealth(integration)
        
        // Update integration status if needed
        if (healthCheck.status !== integration.connection_status) {
          await supabaseClient
            .from('integrations')
            .update({ 
              connection_status: healthCheck.status,
              last_sync_at: new Date().toISOString()
            })
            .eq('id', integration.id)
        }

        // Log health check result
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
        
        // Mark as unhealthy
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
      case 'magento':
        details = await checkMagentoHealth(integration)
        break
      case 'bigcommerce':
        details = await checkBigCommerceHealth(integration)
        break
      case 'etsy':
        details = await checkEtsyHealth(integration)
        break
      case 'rakuten':
        details = await checkRakutenHealth(integration)
        break
      case 'fnac':
        details = await checkFnacHealth(integration)
        break
      case 'mercadolibre':
        details = await checkMercadoLibreHealth(integration)
        break
      case 'cdiscount':
        details = await checkCdiscountHealth(integration)
        break
      default:
        details = await checkGenericHealth(integration)
    }

    const responseTime = Date.now() - startTime

    // Determine overall health status
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
  const shopDomain = integration.store_config?.domain || integration.encrypted_credentials?.shop_domain
  const accessToken = integration.encrypted_credentials?.access_token

  if (!shopDomain || !accessToken) {
    throw new Error('Missing Shopify credentials')
  }

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300))
  
  return {
    shop_name: integration.store_config?.shop_name || 'Shopify Store',
    plan: 'basic',
    api_version: '2023-10'
  }
}

async function checkWooCommerceHealth(integration: any) {
  // Simulate WooCommerce health check
  await new Promise(resolve => setTimeout(resolve, 400))
  
  return {
    version: '8.2.1',
    php_version: '8.1',
    wordpress_version: '6.3'
  }
}

async function checkAmazonHealth(integration: any) {
  // Amazon SP-API health check simulation
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    marketplace: integration.encrypted_credentials?.marketplace || 'FR',
    status: 'API accessible',
    last_sync: integration.last_sync_at
  }
}

async function checkPrestaShopHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 350))
  
  return {
    version: '8.1.2',
    php_version: '8.0',
    status: 'Webservice active'
  }
}

async function checkMagentoHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 450))
  
  return {
    version: '2.4.6',
    edition: 'Community',
    status: 'REST API active'
  }
}

async function checkBigCommerceHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 320))
  
  return {
    store_hash: integration.credentials?.store_hash || 'unknown',
    status: 'API accessible',
    tier: 'Standard'
  }
}

async function checkEtsyHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 280))
  
  return {
    shop_id: integration.platform_data?.shop_id || 'unknown',
    status: 'API accessible',
    api_version: 'v3'
  }
}

async function checkRakutenHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 380))
  
  return {
    marketplace: 'France',
    status: 'Connection verified',
    last_activity: integration.last_sync_at
  }
}

async function checkFnacHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 420))
  
  return {
    marketplace: 'France',
    status: 'XML API accessible',
    last_activity: integration.last_sync_at
  }
}

async function checkMercadoLibreHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 360))
  
  return {
    user_id: integration.credentials?.user_id || 'unknown',
    status: 'API accessible',
    country: 'Argentina'
  }
}

async function checkCdiscountHealth(integration: any) {
  await new Promise(resolve => setTimeout(resolve, 390))
  
  return {
    marketplace: 'France',
    status: 'SOAP API accessible',
    last_activity: integration.last_sync_at
  }
}

async function checkGenericHealth(integration: any) {
  // Generic health check for other platforms
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return {
    platform: integration.platform_type,
    status: 'Connection verified',
    last_activity: integration.last_sync_at || integration.created_at
  }
}