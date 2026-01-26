import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface TrackingSyncRequest {
  user_id: string
  integration_id?: string
  platform?: string
  order_ids?: string[]
  direction?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Support both body params and auth header for user_id
    const body = await req.json() as TrackingSyncRequest
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

    const { integration_id, platform, order_ids } = body

    console.log(`🚚 Tracking sync starting for user ${userId}`)

    const results: any = {
      synced: 0,
      errors: []
    }

    // Get pending tracking sync items from queue
    let queueQuery = supabase
      .from('unified_sync_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_type', 'tracking')
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .limit(50)

    const { data: queueItems, error: queueError } = await queueQuery
    if (queueError) throw queueError

    // Also get orders with tracking that haven't been synced
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .not('tracking_number', 'is', null)
      .neq('fulfillment_status', 'fulfilled')
      .limit(100)

    if (ordersError) throw ordersError

    // Get integrations
    let intQuery = supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (integration_id) {
      intQuery = intQuery.eq('id', integration_id)
    }

    const { data: integrations, error: intError } = await intQuery
    if (intError) throw intError

    // Process queue items
    for (const item of queueItems || []) {
      try {
        await supabase
          .from('unified_sync_queue')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', item.id)

        const channels = item.channels as any[]
        const payload = item.payload as any

        for (const channel of channels) {
          const integration = integrations?.find(i => i.id === channel.integration_id)
          if (!integration) continue

          const syncResult = await syncTrackingToChannel(
            integration,
            item.entity_id,
            payload.tracking_number,
            payload.carrier,
            payload.order_number
          )

          if (syncResult.success) {
            results.synced++
          } else {
            results.errors.push(syncResult)
          }
        }

        await supabase
          .from('unified_sync_queue')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', item.id)

      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
        
        const newRetryCount = (item.retry_count || 0) + 1
        await supabase
          .from('unified_sync_queue')
          .update({
            status: newRetryCount >= item.max_retries ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_message: error.message
          })
          .eq('id', item.id)

        results.errors.push({ queue_id: item.id, error: error.message })
      }
    }

    // Process orders with tracking not yet synced
    for (const order of orders || []) {
      if (!order.source_order_id) continue

      const integration = integrations?.find(i => 
        i.platform.toLowerCase() === order.source_platform?.toLowerCase()
      )
      if (!integration) continue

      try {
        const syncResult = await syncTrackingToChannel(
          integration,
          order.id,
          order.tracking_number,
          order.shipping_carrier,
          order.order_number
        )

        if (syncResult.success) {
          // Mark order as fulfilled
          await supabase
            .from('orders')
            .update({ fulfillment_status: 'fulfilled' })
            .eq('id', order.id)

          results.synced++
        } else {
          results.errors.push(syncResult)
        }

      } catch (e) {
        results.errors.push({ order_id: order.id, error: e.message })
      }
    }

    // Log sync
    await supabase.from('unified_sync_logs').insert({
      user_id,
      sync_type: 'tracking',
      platform: platform || 'multiple',
      entity_type: 'orders',
      action: 'sync',
      status: results.errors.length === 0 ? 'success' : 'partial',
      items_processed: (queueItems?.length || 0) + (orders?.length || 0),
      items_succeeded: results.synced,
      items_failed: results.errors.length,
      metadata: results
    })

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Tracking sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function syncTrackingToChannel(
  integration: any,
  orderId: string,
  trackingNumber: string,
  carrier: string,
  orderNumber: string
): Promise<any> {
  const platform = integration.platform

  console.log(`Syncing tracking ${trackingNumber} to ${platform} for order ${orderNumber}`)

  try {
    switch (platform.toLowerCase()) {
      case 'shopify':
        return await syncTrackingToShopify(integration, orderId, trackingNumber, carrier)
      case 'woocommerce':
        return await syncTrackingToWooCommerce(integration, orderId, trackingNumber, carrier)
      case 'prestashop':
        return await syncTrackingToPrestaShop(integration, orderId, trackingNumber, carrier)
      default:
        return { success: false, platform, error: `Platform ${platform} not supported` }
    }
  } catch (e) {
    return { success: false, platform, error: e.message }
  }
}

async function syncTrackingToShopify(
  integration: any,
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<any> {
  const shopDomain = integration.store_url
  const accessToken = integration.credentials_encrypted?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain) {
    return { success: false, platform: 'shopify', error: 'Missing credentials' }
  }

  // Get order from Shopify to get line items for fulfillment
  // First try to get the order by our internal ID (need source_order_id)
  // For now, we assume orderId is the Shopify order ID

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/orders/${orderId}/fulfillments.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fulfillment: {
          tracking_number: trackingNumber,
          tracking_company: mapCarrierToShopify(carrier),
          notify_customer: true
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    // Check if already fulfilled
    if (errorText.includes('already been fulfilled') || errorText.includes('no fulfillment_order_line_items')) {
      return { success: true, platform: 'shopify', note: 'Already fulfilled' }
    }
    return { success: false, platform: 'shopify', error: errorText }
  }

  return { success: true, platform: 'shopify' }
}

async function syncTrackingToWooCommerce(
  integration: any,
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<any> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.consumer_key || !credentials?.consumer_secret) {
    return { success: false, platform: 'woocommerce', error: 'Missing credentials' }
  }

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)

  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/orders/${orderId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        meta_data: [
          { key: '_tracking_number', value: trackingNumber },
          { key: '_tracking_provider', value: carrier }
        ]
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, platform: 'woocommerce', error: errorText }
  }

  return { success: true, platform: 'woocommerce' }
}

async function syncTrackingToPrestaShop(
  integration: any,
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<any> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.api_key) {
    return { success: false, platform: 'prestashop', error: 'Missing credentials' }
  }

  // PrestaShop tracking sync requires order carrier update
  const response = await fetch(
    `${storeUrl}/api/order_carriers/${orderId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${btoa(credentials.api_key + ':')}`,
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
          <order_carrier>
            <tracking_number>${trackingNumber}</tracking_number>
          </order_carrier>
        </prestashop>`
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, platform: 'prestashop', error: errorText }
  }

  return { success: true, platform: 'prestashop' }
}

function mapCarrierToShopify(carrier: string): string {
  const carrierMap: Record<string, string> = {
    'colissimo': 'La Poste',
    'chronopost': 'Chronopost',
    'mondial_relay': 'Mondial Relay',
    'ups': 'UPS',
    'fedex': 'FedEx',
    'dhl': 'DHL',
    'usps': 'USPS',
    'dpd': 'DPD',
    'gls': 'GLS',
    'tnt': 'TNT',
    '17track': 'Other',
    'cainiao': 'Cainiao',
    'yanwen': 'Yanwen'
  }
  return carrierMap[carrier?.toLowerCase()] || carrier || 'Other'
}
