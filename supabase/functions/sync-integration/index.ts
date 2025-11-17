import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    if (!integration_id) {
      throw new Error('Integration ID is required')
    }

    console.log(`🔄 Starting sync: ${integration_id}`)

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError) {
      throw new Error(`Integration not found: ${integrationError.message}`)
    }

    // Update sync status to syncing
    await supabaseClient
      .from('integrations')
      .update({ 
        sync_status: 'syncing',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integration_id)

    // Background sync function
    const backgroundSync = async () => {
      let syncResult = {
        success: false,
        products_synced: 0,
        orders_synced: 0,
        errors: [] as string[]
      }

      try {
        const platformToSync = integration.platform_name?.toLowerCase() || integration.platform_type?.toLowerCase()
        
        console.log(`📦 Syncing ${platformToSync} platform...`)

        switch (platformToSync) {
          case 'shopify':
            syncResult = await syncShopifyData(supabaseClient, integration, sync_type)
            break
          default:
            syncResult.errors.push(`Platform ${platformToSync} not yet supported`)
        }

        // Update integration with results
        await supabaseClient
          .from('integrations')
          .update({
            sync_status: syncResult.success ? 'synced' : 'error',
            last_sync_at: new Date().toISOString(),
            store_config: {
              ...(integration.store_config || {}),
              last_products_synced: syncResult.products_synced,
              last_orders_synced: syncResult.orders_synced,
              last_sync_errors: syncResult.errors
            }
          })
          .eq('id', integration_id)

        console.log(`✅ Sync completed: ${syncResult.products_synced} products`)
      } catch (error) {
        console.error('❌ Background sync error:', error)
        
        await supabaseClient
          .from('integrations')
          .update({
            sync_status: 'error',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration_id)
      }
    }

    // Start background task (non-blocking)
    EdgeRuntime.waitUntil(backgroundSync())

    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Synchronisation démarrée en arrière-plan',
        integration_id,
        status: 'syncing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 // Accepted
      }
    )

  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Shopify sync functions
async function syncShopifyData(supabaseClient: any, integration: any, sync_type: string) {
  const credentials = integration.credentials || {}
  
  if (!credentials.access_token || !credentials.shop_domain) {
    return {
      success: false,
      products_synced: 0,
      orders_synced: 0,
      errors: ['Missing Shopify credentials']
    }
  }

  const shopifyDomain = credentials.shop_domain
  const accessToken = credentials.access_token

  let productCount = 0
  let orderCount = 0
  const errors: string[] = []

  try {
    // Sync products
    productCount = await syncShopifyProducts(supabaseClient, integration, shopifyDomain, accessToken)
    console.log(`✅ ${productCount} products synced`)

    // Sync orders if full sync
    if (sync_type === 'full') {
      orderCount = await syncShopifyOrders(supabaseClient, integration, shopifyDomain, accessToken)
      console.log(`✅ ${orderCount} orders synced`)
    }

    return {
      success: true,
      products_synced: productCount,
      orders_synced: orderCount,
      errors
    }
  } catch (error) {
    console.error('Sync error:', error)
    errors.push(error.message)
    
    return {
      success: false,
      products_synced: productCount,
      orders_synced: orderCount,
      errors
    }
  }
}

async function syncShopifyProducts(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string): Promise<number> {
  console.log('📦 Starting product sync...')
  
  let totalSynced = 0
  let nextPageInfo: string | null = null
  let hasNextPage = true
  let pageCount = 0
  
  try {
    // Process 10 pages max (250 products) in small batches
    while (hasNextPage && pageCount < 10) {
      pageCount++
      const url = nextPageInfo
        ? `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=25&page_info=${nextPageInfo}`
        : `https://${shopifyDomain}/admin/api/2023-10/products.json?limit=25`
      
      console.log(`   Page ${pageCount}/10...`)
      
      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`   API error: ${response.status}`)
        break
      }

      const data = await response.json()
      const products = data.products || []
      
      if (products.length === 0) break

      // Transform and insert
      const productsToUpsert = products.map((product: any) => ({
        user_id: integration.user_id,
        supplier_name: 'Shopify',
        supplier_product_id: product.id.toString(),
        sku: product.variants?.[0]?.sku || `SHOP-${product.id}`,
        name: product.title,
        description: product.body_html || '',
        price: parseFloat(product.variants?.[0]?.price || '0'),
        cost_price: parseFloat(product.variants?.[0]?.compare_at_price || '0') || null,
        currency: 'EUR',
        stock_quantity: product.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
        category: product.product_type || 'General',
        brand: product.vendor || '',
        tags: product.tags ? product.tags.split(',').map((t: string) => t.trim()) : [],
        image_urls: product.images?.map((img: any) => img.src) || [],
        status: product.status === 'active' ? 'published' : 'draft',
        seo_title: product.title,
        seo_description: product.body_html?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '',
        weight: product.variants?.[0]?.weight || null,
      }))

      const { error } = await supabaseClient
        .from('imported_products')
        .upsert(productsToUpsert, { 
          onConflict: 'user_id,supplier_product_id',
          ignoreDuplicates: false 
        })

      if (!error) {
        totalSynced += productsToUpsert.length
        console.log(`   ✅ ${totalSynced} total`)
      }

      // Check for next page
      const linkHeader = response.headers.get('Link')
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/)
        nextPageInfo = nextMatch ? nextMatch[1] : null
        hasNextPage = !!nextPageInfo
      } else {
        hasNextPage = false
      }
    }
    
    return totalSynced
  } catch (error) {
    console.error('Product sync error:', error)
    return totalSynced
  }
}

async function syncShopifyOrders(supabaseClient: any, integration: any, shopifyDomain: string, accessToken: string): Promise<number> {
  // Simplified order sync - just count for now
  console.log('📋 Skipping order sync for performance')
  return 0
}
