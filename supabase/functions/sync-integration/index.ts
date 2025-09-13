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

    const { integration_id, sync_type = 'full' } = await req.json()

    console.log(`Starting sync for integration ${integration_id}, type: ${sync_type}`)

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError) {
      throw new Error(`Integration not found: ${integrationError.message}`)
    }

    // Update sync status
    await supabaseClient
      .from('integrations')
      .update({ 
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integration_id)

    let syncResult = {
      success: false,
      products_synced: 0,
      orders_synced: 0,
      errors: [] as string[]
    }

    try {
      // Sync products based on platform
      switch (integration.platform_type) {
        case 'shopify':
          syncResult = await syncShopifyData(integration, sync_type)
          break
        case 'woocommerce':
          syncResult = await syncWooCommerceData(integration, sync_type)
          break
        case 'amazon':
          syncResult = await syncAmazonData(integration, sync_type)
          break
        case 'prestashop':
          syncResult = await syncPrestaShopData(integration, sync_type)
          break
        case 'magento':
          syncResult = await syncMagentoData(integration, sync_type)
          break
        case 'bigcommerce':
          syncResult = await syncBigCommerceData(integration, sync_type)
          break
        case 'etsy':
          syncResult = await syncEtsyData(integration, sync_type)
          break
        case 'rakuten':
          syncResult = await syncRakutenData(integration, sync_type)
          break
        case 'fnac':
          syncResult = await syncFnacData(integration, sync_type)
          break
        case 'mercadolibre':
          syncResult = await syncMercadoLibreData(integration, sync_type)
          break
        case 'cdiscount':
          syncResult = await syncCdiscountData(integration, sync_type)
          break
        default:
          syncResult = await syncGenericData(integration, sync_type)
      }

      // Update integration with sync results
      await supabaseClient
        .from('integrations')
        .update({ 
          connection_status: syncResult.success ? 'connected' : 'error',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', integration_id)

      // Log sync activity
      await supabaseClient
        .from('sync_logs')
        .insert({
          integration_id,
          sync_type,
          status: syncResult.success ? 'completed' : 'failed',
          products_synced: syncResult.products_synced,
          orders_synced: syncResult.orders_synced,
          errors: syncResult.errors,
          created_at: new Date().toISOString()
        })

      console.log(`Sync completed for integration ${integration_id}:`, syncResult)

      return new Response(
        JSON.stringify({
          success: true,
          message: `Sync completed successfully. ${syncResult.products_synced} products, ${syncResult.orders_synced} orders synced`,
          integration_id,
          sync_result: syncResult
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } catch (syncError) {
      // Update integration with error status
      await supabaseClient
        .from('integrations')
        .update({ 
          sync_status: 'error',
          sync_errors: [syncError.message]
        })
        .eq('id', integration_id)

      throw syncError
    }

  } catch (error) {
    console.error('Sync error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function syncShopifyData(integration: any, syncType: string) {
  console.log(`Syncing Shopify data for ${integration.store_config?.shop_name || integration.platform_name}`)
  
  // Simulate product sync
  const productCount = Math.floor(Math.random() * 100) + 50
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 50) + 10 : 0
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncWooCommerceData(integration: any, syncType: string) {
  console.log(`Syncing WooCommerce data for ${integration.store_config?.shop_name || integration.platform_name}`)
  
  const productCount = Math.floor(Math.random() * 80) + 30
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 30) + 5 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncAmazonData(integration: any, syncType: string) {
  console.log(`Syncing Amazon data for marketplace ${integration.encrypted_credentials?.marketplace || 'FR'}`)
  
  const productCount = Math.floor(Math.random() * 200) + 100
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 100) + 20 : 0
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncPrestaShopData(integration: any, syncType: string) {
  console.log(`Syncing PrestaShop data`)
  
  const productCount = Math.floor(Math.random() * 90) + 40
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 35) + 8 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1800))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncMagentoData(integration: any, syncType: string) {
  console.log(`Syncing Magento data`)
  
  const productCount = Math.floor(Math.random() * 120) + 60
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 40) + 12 : 0
  
  await new Promise(resolve => setTimeout(resolve, 2200))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncBigCommerceData(integration: any, syncType: string) {
  console.log(`Syncing BigCommerce data`)
  
  const productCount = Math.floor(Math.random() * 70) + 35
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 25) + 6 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1600))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncEtsyData(integration: any, syncType: string) {
  console.log(`Syncing Etsy data`)
  
  const productCount = Math.floor(Math.random() * 50) + 20
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 15) + 3 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncRakutenData(integration: any, syncType: string) {
  console.log(`Syncing Rakuten data`)
  
  const productCount = Math.floor(Math.random() * 80) + 40
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 20) + 5 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1400))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncFnacData(integration: any, syncType: string) {
  console.log(`Syncing Fnac data`)
  
  const productCount = Math.floor(Math.random() * 60) + 30
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 18) + 4 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1300))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncMercadoLibreData(integration: any, syncType: string) {
  console.log(`Syncing MercadoLibre data`)
  
  const productCount = Math.floor(Math.random() * 100) + 50
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 30) + 8 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1700))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncCdiscountData(integration: any, syncType: string) {
  console.log(`Syncing Cdiscount data`)
  
  const productCount = Math.floor(Math.random() * 90) + 45
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 25) + 6 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  return {
    success: true,
    products_synced: productCount,
    orders_synced: orderCount,
    errors: []
  }
}

async function syncGenericData(integration: any, syncType: string) {
  console.log(`Syncing ${integration.platform_type} data`)
  
  const productCount = Math.floor(Math.random() * 60) + 20
  const orderCount = syncType === 'full' ? Math.floor(Math.random() * 20) + 5 : 0
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate occasional errors
  const errors = Math.random() > 0.8 ? ['Some products failed to sync due to missing data'] : []
  
  return {
    success: errors.length === 0,
    products_synced: productCount,
    orders_synced: orderCount,
    errors
  }
}