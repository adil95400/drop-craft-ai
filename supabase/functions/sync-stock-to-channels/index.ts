import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface StockSyncRequest {
  user_id: string
  integration_id?: string
  platform?: string
  product_ids?: string[]
  direction?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Support both body params and auth header for user_id
    const body = await req.json() as StockSyncRequest
    let userId = body.user_id

    // If no user_id in body, try to get from auth header
    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) userId = user.id
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`📦 Stock sync starting for user ${userId}`)

    // Get pending stock sync items from queue
    let queueQuery = supabase
      .from('unified_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_type', 'stock')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(100)

    const { data: queueItems, error: queueError } = await queueQuery
    if (queueError) throw queueError

    // Also get products with mappings that need sync
    const { data: mappings, error: mappingError } = await supabase
      .from('product_channel_mappings')
      .select(`
        *,
        products:product_id (id, sku, stock_quantity, title)
      `)
      .eq('user_id', userId)
      .eq('sync_status', 'synced')

    if (mappingError) throw mappingError

    const results: any[] = []
    const processedIds: string[] = []

    // Process queue items
    for (const item of queueItems || []) {
      try {
        // Mark as processing
        await supabase
          .from('unified_sync_queue')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', item.id)

        const channels = item.channels as any[]
        const payload = item.payload as any
        
        for (const channel of channels) {
          const syncResult = await syncStockToChannel(
            supabase,
            channel.platform,
            channel.integration_id,
            item.entity_id,
            payload.new_stock,
            payload.sku
          )
          results.push(syncResult)
        }

        // Mark as completed
        await supabase
          .from('unified_sync_queue')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', item.id)

        processedIds.push(item.id)

      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
        
        const newRetryCount = (item.retry_count || 0) + 1
        await supabase
          .from('unified_sync_queue')
          .update({
            status: newRetryCount >= item.max_retries ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_message: error.message,
            scheduled_at: new Date(Date.now() + newRetryCount * 60000).toISOString()
          })
          .eq('id', item.id)
      }
    }

    // Log sync results
    if (results.length > 0) {
      await supabase.from('unified_sync_logs').insert({
        user_id,
        sync_type: 'stock',
        platform: platform || 'multiple',
        entity_type: 'products',
        action: 'sync',
        status: results.every(r => r.success) ? 'success' : 'partial',
        items_processed: results.length,
        items_succeeded: results.filter(r => r.success).length,
        items_failed: results.filter(r => !r.success).length,
        metadata: { results }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedIds.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Stock sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function syncStockToChannel(
  supabase: any,
  platform: string,
  integrationId: string,
  productId: string,
  stockQuantity: number,
  sku: string
): Promise<any> {
  console.log(`Syncing stock to ${platform}: ${sku} = ${stockQuantity}`)

  // Get integration credentials
  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .single()

  if (error || !integration) {
    return { success: false, platform, error: 'Integration not found' }
  }

  // Get product mapping
  const { data: mapping } = await supabase
    .from('product_channel_mappings')
    .select('external_product_id, external_variant_id')
    .eq('product_id', productId)
    .eq('integration_id', integrationId)
    .single()

  if (!mapping?.external_product_id) {
    return { success: false, platform, error: 'Product not mapped to this channel' }
  }

  try {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return await syncStockToShopify(integration, mapping, stockQuantity)
      case 'woocommerce':
        return await syncStockToWooCommerce(integration, mapping, stockQuantity)
      case 'prestashop':
        return await syncStockToPrestaShop(integration, mapping, stockQuantity)
      case 'amazon':
        return await syncStockToAmazon(integration, mapping, stockQuantity, sku)
      case 'ebay':
        return await syncStockToEbay(integration, mapping, stockQuantity)
      default:
        return { success: false, platform, error: `Platform ${platform} not supported` }
    }
  } catch (e) {
    return { success: false, platform, error: e.message }
  }
}

async function syncStockToShopify(integration: any, mapping: any, stock: number) {
  const credentials = integration.credentials_encrypted
  const shopDomain = integration.store_url
  const accessToken = credentials?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain) {
    return { success: false, platform: 'shopify', error: 'Missing Shopify credentials' }
  }

  // First get the inventory item ID
  const variantId = mapping.external_variant_id || mapping.external_product_id
  const variantResponse = await fetch(
    `https://${shopDomain}/admin/api/2024-01/variants/${variantId}.json`,
    {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!variantResponse.ok) {
    return { success: false, platform: 'shopify', error: 'Failed to get variant' }
  }

  const variantData = await variantResponse.json()
  const inventoryItemId = variantData.variant?.inventory_item_id

  if (!inventoryItemId) {
    return { success: false, platform: 'shopify', error: 'No inventory item found' }
  }

  // Get location ID
  const locationsResponse = await fetch(
    `https://${shopDomain}/admin/api/2024-01/locations.json`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken }
    }
  )
  const locationsData = await locationsResponse.json()
  const locationId = locationsData.locations?.[0]?.id

  if (!locationId) {
    return { success: false, platform: 'shopify', error: 'No location found' }
  }

  // Set inventory level
  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/inventory_levels/set.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: stock
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, platform: 'shopify', error: errorText }
  }

  return { success: true, platform: 'shopify', stock_synced: stock }
}

async function syncStockToWooCommerce(integration: any, mapping: any, stock: number) {
  const credentials = integration.credentials_encrypted
  const storeUrl = integration.store_url
  
  if (!credentials?.consumer_key || !credentials?.consumer_secret || !storeUrl) {
    return { success: false, platform: 'woocommerce', error: 'Missing WooCommerce credentials' }
  }

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const productId = mapping.external_product_id

  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/products/${productId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stock_quantity: stock,
        manage_stock: true
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, platform: 'woocommerce', error: errorText }
  }

  return { success: true, platform: 'woocommerce', stock_synced: stock }
}

async function syncStockToPrestaShop(integration: any, mapping: any, stock: number) {
  const credentials = integration.credentials_encrypted
  const storeUrl = integration.store_url
  
  if (!credentials?.api_key || !storeUrl) {
    return { success: false, platform: 'prestashop', error: 'Missing PrestaShop credentials' }
  }

  // PrestaShop uses stock_availables endpoint
  const stockAvailableId = mapping.external_variant_id || mapping.external_product_id

  const response = await fetch(
    `${storeUrl}/api/stock_availables/${stockAvailableId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${btoa(credentials.api_key + ':')}`,
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
          <stock_available>
            <id>${stockAvailableId}</id>
            <quantity>${stock}</quantity>
          </stock_available>
        </prestashop>`
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, platform: 'prestashop', error: errorText }
  }

  return { success: true, platform: 'prestashop', stock_synced: stock }
}

async function syncStockToAmazon(integration: any, mapping: any, stock: number, sku: string) {
  // Amazon SP-API requires OAuth - placeholder for full implementation
  console.log(`Amazon stock sync pending implementation for SKU ${sku}`)
  return { 
    success: false, 
    platform: 'amazon', 
    error: 'Amazon SP-API integration pending - requires OAuth setup' 
  }
}

async function syncStockToEbay(integration: any, mapping: any, stock: number) {
  // eBay API requires OAuth - placeholder for full implementation
  console.log(`eBay stock sync pending implementation`)
  return { 
    success: false, 
    platform: 'ebay', 
    error: 'eBay API integration pending - requires OAuth setup' 
  }
}
