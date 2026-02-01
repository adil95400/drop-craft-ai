import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'

/**
 * Real Data Sync - Enterprise-Safe
 * 
 * Security:
 * - JWT authentication required
 * - Rate limiting per user
 * - User data scoping
 * - CORS allowlist
 */

interface SyncRequest {
  platforms: string[]
  syncType: 'products' | 'orders' | 'inventory' | 'all'
  batchSize?: number
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Authenticate user
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // Rate limit
    const rateLimitResult = await checkRateLimit(
      supabase, 
      userId, 
      'real_data_sync', 
      RATE_LIMITS.SYNC
    )
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    const { platforms, syncType, batchSize = 100 }: SyncRequest = await req.json()

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'platforms array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting real-time sync for platforms: ${platforms.join(', ')} for user: ${userId}`)
    
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
          error: (error as Error).message
        }
      }
    })

    const syncResults = await Promise.all(syncPromises)
    
    // Log sync activity - SCOPED TO USER
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'real_time_sync',
        description: `Synchronized data from ${platforms.join(', ')}`,
        entity_type: 'sync',
        details: {
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
      error: (error as Error).message
    }), {
      status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function syncAliExpressData(supabase: any, syncType: string, batchSize: number, userId: string) {
  const apiKey = Deno.env.get('ALIEXPRESS_API_KEY')
  if (!apiKey) throw new Error('AliExpress API key not configured')

  // Invoke with authenticated context - the child function handles its own auth
  const { data, error } = await supabase.functions.invoke('aliexpress-integration', {
    body: {
      action: 'search_products',
      keywords: 'trending',
      limit: batchSize
    }
  })

  if (error) throw error
  
  // Import products - SCOPED TO USER
  const products = data?.products || []
  let imported = 0
  
  for (const product of products.slice(0, batchSize)) {
    const { error: insertError } = await supabase
      .from('imported_products')
      .upsert({
        user_id: userId,
        external_id: product.id || product.external_id,
        name: product.title || product.name,
        description: product.description,
        price: product.price,
        cost_price: product.original_price || product.cost_price,
        supplier_name: 'AliExpress',
        image_urls: product.images || [],
        status: 'draft',
        updated_at: new Date().toISOString()
      }, { onConflict: 'external_id,user_id' })
    
    if (!insertError) imported++
  }
  
  return {
    imported_products: imported,
    total_processed: products.length
  }
}

async function syncBigBuyData(supabase: any, syncType: string, batchSize: number, userId: string) {
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

  // Import to catalog - SCOPED TO USER
  let imported = 0
  for (const product of batch) {
    const { error } = await supabase
      .from('catalog_products')
      .upsert({
        user_id: userId,
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
      }, { onConflict: 'external_id,user_id' })

    if (!error) imported++
  }

  return {
    imported_products: imported,
    total_processed: batch.length
  }
}

async function syncShopifyData(supabase: any, syncType: string, batchSize: number, userId: string) {
  // Get active Shopify integrations - SCOPED TO USER
  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
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

async function syncAmazonData(supabase: any, syncType: string, batchSize: number, userId: string) {
  const apiKey = Deno.env.get('AMAZON_ACCESS_KEY_ID')
  const secretKey = Deno.env.get('AMAZON_SECRET_ACCESS_KEY')
  
  if (!apiKey || !secretKey) {
    throw new Error('Amazon credentials not configured')
  }

  // Amazon SP-API integration would go here
  return {
    imported_products: 0,
    total_processed: 0,
    message: 'Amazon integration not yet implemented'
  }
}
