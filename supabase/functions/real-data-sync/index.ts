import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SyncRequest {
  platforms: string[]
  syncType: 'products' | 'orders' | 'inventory' | 'all'
  batchSize?: number
  userId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { platforms, syncType, batchSize = 100, userId }: SyncRequest = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log(`Starting real-time sync for platforms: ${platforms.join(', ')}`)
    
    const results: any[] = []
    
    // Parallel sync for all platforms
    const syncPromises = platforms.map(async (platform) => {
      const isEnabled = Deno.env.get(`${platform.toUpperCase()}_ENABLED`) === 'true'
      
      if (!isEnabled) {
        return {
          platform,
          status: 'disabled',
          message: `${platform} integration is disabled`
        }
      }

      try {
        let syncResult
        
        switch (platform.toLowerCase()) {
          case 'aliexpress':
            syncResult = await syncAliExpressData(supabase, syncType, batchSize, userId)
            break
          case 'bigbuy':
            syncResult = await syncBigBuyData(supabase, syncType, batchSize, userId)
            break
          case 'shopify':
            syncResult = await syncShopifyData(supabase, syncType, batchSize, userId)
            break
          case 'amazon':
            syncResult = await syncAmazonData(supabase, syncType, batchSize, userId)
            break
          default:
            throw new Error(`Platform ${platform} not supported`)
        }
        
        return {
          platform,
          status: 'success',
          ...syncResult
        }
      } catch (error) {
        console.error(`${platform} sync error:`, error)
        return {
          platform,
          status: 'error',
          error: error.message
        }
      }
    })

    const syncResults = await Promise.all(syncPromises)
    
    // Log sync activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId || 'system',
        action: 'real_time_sync',
        description: `Synchronized data from ${platforms.join(', ')}`,
        entity_type: 'sync',
        metadata: {
          platforms,
          sync_type: syncType,
          results: syncResults,
          timestamp: new Date().toISOString()
        }
      })

    return new Response(JSON.stringify({
      success: true,
      results: syncResults,
      summary: {
        total_platforms: platforms.length,
        successful: syncResults.filter(r => r.status === 'success').length,
        failed: syncResults.filter(r => r.status === 'error').length,
        disabled: syncResults.filter(r => r.status === 'disabled').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Real-time sync error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function syncAliExpressData(supabase: any, syncType: string, batchSize: number, userId?: string) {
  const apiKey = Deno.env.get('ALIEXPRESS_API_KEY')
  if (!apiKey) throw new Error('AliExpress API key not configured')

  const { data, error } = await supabase.functions.invoke('aliexpress-integration', {
    body: {
      importType: 'trending_products',
      filters: { limit: batchSize },
      userId: userId || 'sync'
    }
  })

  if (error) throw error
  
  return {
    imported_products: data.data?.imported_count || 0,
    total_processed: data.data?.total_products || 0
  }
}

async function syncBigBuyData(supabase: any, syncType: string, batchSize: number, userId?: string) {
  const apiKey = Deno.env.get('BIGBUY_API_KEY')
  if (!apiKey) throw new Error('BigBuy API key not configured')

  // Get products from BigBuy
  const response = await fetch('https://api.bigbuy.eu/rest/catalog/products.json', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`BigBuy API error: ${response.status}`)
  }

  const products = await response.json()
  const batch = products.slice(0, batchSize)

  // Import to catalog
  let imported = 0
  for (const product of batch) {
    const { error } = await supabase
      .from('catalog_products')
      .upsert({
        external_id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: parseFloat(product.retailPrice),
        cost_price: parseFloat(product.wholesalePrice),
        supplier_id: 'bigbuy',
        supplier_name: 'BigBuy',
        category: product.category?.name,
        stock_quantity: product.stock || 0,
        availability_status: product.stock > 0 ? 'in_stock' : 'out_of_stock'
      }, { onConflict: 'external_id,supplier_id' })

    if (!error) imported++
  }

  return {
    imported_products: imported,
    total_processed: batch.length
  }
}

async function syncShopifyData(supabase: any, syncType: string, batchSize: number, userId?: string) {
  // Get active Shopify integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('platform_name', 'shopify')
    .eq('is_active', true)

  if (!integrations?.length) {
    throw new Error('No active Shopify integrations found')
  }

  let totalImported = 0
  let totalProcessed = 0

  for (const integration of integrations) {
    const { data, error } = await supabase.functions.invoke('shopify-integration', {
      body: {
        action: syncType === 'products' ? 'sync_products' : 'sync_orders',
        integration_id: integration.id
      }
    })

    if (!error && data.success) {
      totalImported += data.imported || 0
      totalProcessed += data.total || 0
    }
  }

  return {
    imported_products: totalImported,
    total_processed: totalProcessed
  }
}

async function syncAmazonData(supabase: any, syncType: string, batchSize: number, userId?: string) {
  const apiKey = Deno.env.get('AMAZON_ACCESS_KEY_ID')
  const secretKey = Deno.env.get('AMAZON_SECRET_ACCESS_KEY')
  
  if (!apiKey || !secretKey) {
    throw new Error('Amazon credentials not configured')
  }

  // Amazon SP-API integration would go here
  // For now, return placeholder data
  return {
    imported_products: 0,
    total_processed: 0,
    message: 'Amazon integration not yet implemented'
  }
}