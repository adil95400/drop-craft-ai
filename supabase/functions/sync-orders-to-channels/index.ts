import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OrderSyncRequest {
  user_id: string
  integration_id?: string
  platform?: string
  direction?: 'import' | 'export' | 'bidirectional'
  order_ids?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { user_id, integration_id, platform, direction = 'bidirectional', order_ids } = await req.json() as OrderSyncRequest

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`📋 Order sync starting for user ${user_id}, direction: ${direction}`)

    const results: any = {
      imported: 0,
      exported: 0,
      errors: []
    }

    // Get integrations
    let intQuery = supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (integration_id) {
      intQuery = intQuery.eq('id', integration_id)
    }
    if (platform) {
      intQuery = intQuery.eq('platform', platform)
    }

    const { data: integrations, error: intError } = await intQuery
    if (intError) throw intError

    for (const integration of integrations || []) {
      const platformName = integration.platform

      // IMPORT: Get orders from store
      if (direction === 'import' || direction === 'bidirectional') {
        try {
          const importResult = await importOrdersFromChannel(supabase, integration, user_id)
          results.imported += importResult.count
          if (importResult.errors.length > 0) {
            results.errors.push(...importResult.errors)
          }
        } catch (e) {
          results.errors.push({ platform: platformName, type: 'import', error: e.message })
        }
      }

      // EXPORT: Push fulfillment/tracking to store
      if (direction === 'export' || direction === 'bidirectional') {
        try {
          const exportResult = await exportOrderUpdatesToChannel(supabase, integration, user_id, order_ids)
          results.exported += exportResult.count
          if (exportResult.errors.length > 0) {
            results.errors.push(...exportResult.errors)
          }
        } catch (e) {
          results.errors.push({ platform: platformName, type: 'export', error: e.message })
        }
      }
    }

    // Log sync
    await supabase.from('unified_sync_logs').insert({
      user_id,
      sync_type: 'orders',
      platform: platform || 'multiple',
      entity_type: 'orders',
      action: direction,
      status: results.errors.length === 0 ? 'success' : 'partial',
      items_processed: results.imported + results.exported,
      items_succeeded: results.imported + results.exported - results.errors.length,
      items_failed: results.errors.length,
      metadata: results
    })

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Order sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function importOrdersFromChannel(supabase: any, integration: any, userId: string) {
  const platform = integration.platform
  const result = { count: 0, errors: [] as any[] }

  console.log(`Importing orders from ${platform}`)

  try {
    let orders: any[] = []

    switch (platform.toLowerCase()) {
      case 'shopify':
        orders = await fetchShopifyOrders(integration)
        break
      case 'woocommerce':
        orders = await fetchWooCommerceOrders(integration)
        break
      case 'prestashop':
        orders = await fetchPrestaShopOrders(integration)
        break
      default:
        console.log(`Order import not implemented for ${platform}`)
        return result
    }

    // Upsert orders
    for (const order of orders) {
      const { error } = await supabase
        .from('orders')
        .upsert({
          user_id: userId,
          external_id: order.id.toString(),
          order_number: order.order_number || order.name || `#${order.id}`,
          status: mapOrderStatus(order.status || order.financial_status, platform),
          fulfillment_status: order.fulfillment_status || 'unfulfilled',
          total_amount: parseFloat(order.total_price || order.total || 0),
          currency: order.currency || 'EUR',
          customer_email: order.email || order.customer?.email,
          customer_name: order.customer?.first_name 
            ? `${order.customer.first_name} ${order.customer.last_name || ''}`
            : order.billing?.first_name || 'Client',
          source_platform: platform,
          source_order_id: order.id.toString(),
          shipping_address: order.shipping_address || order.shipping,
          items: order.line_items || order.items || [],
          metadata: { raw: order }
        }, {
          onConflict: 'user_id,external_id'
        })

      if (error) {
        result.errors.push({ order_id: order.id, error: error.message })
      } else {
        result.count++
      }
    }

  } catch (e) {
    result.errors.push({ error: e.message })
  }

  return result
}

async function exportOrderUpdatesToChannel(supabase: any, integration: any, userId: string, orderIds?: string[]) {
  const platform = integration.platform
  const result = { count: 0, errors: [] as any[] }

  // Get orders with pending updates (tracking number added, status changed)
  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('source_platform', platform)
    .not('tracking_number', 'is', null)

  if (orderIds) {
    query = query.in('id', orderIds)
  }

  const { data: orders, error } = await query
  if (error) throw error

  for (const order of orders || []) {
    try {
      let success = false

      switch (platform.toLowerCase()) {
        case 'shopify':
          success = await updateShopifyFulfillment(integration, order)
          break
        case 'woocommerce':
          success = await updateWooCommerceOrder(integration, order)
          break
        case 'prestashop':
          success = await updatePrestaShopOrder(integration, order)
          break
      }

      if (success) {
        result.count++
      } else {
        result.errors.push({ order_id: order.id, error: 'Update failed' })
      }

    } catch (e) {
      result.errors.push({ order_id: order.id, error: e.message })
    }
  }

  return result
}

// Shopify
async function fetchShopifyOrders(integration: any): Promise<any[]> {
  const shopDomain = integration.store_url
  const accessToken = integration.credentials_encrypted?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain) return []

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/orders.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}&limit=250`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken }
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.orders || []
}

async function updateShopifyFulfillment(integration: any, order: any): Promise<boolean> {
  const shopDomain = integration.store_url
  const accessToken = integration.credentials_encrypted?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain || !order.source_order_id) return false

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/orders/${order.source_order_id}/fulfillments.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fulfillment: {
          tracking_number: order.tracking_number,
          tracking_company: order.shipping_carrier || 'Other',
          notify_customer: true
        }
      })
    }
  )

  return response.ok
}

// WooCommerce
async function fetchWooCommerceOrders(integration: any): Promise<any[]> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.consumer_key || !credentials?.consumer_secret) return []

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/orders?per_page=100`,
    {
      headers: { 'Authorization': `Basic ${auth}` }
    }
  )

  if (!response.ok) return []
  return await response.json()
}

async function updateWooCommerceOrder(integration: any, order: any): Promise<boolean> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.consumer_key || !credentials?.consumer_secret) return false

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/orders/${order.source_order_id}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: mapOrderStatusReverse(order.status),
        meta_data: [
          { key: 'tracking_number', value: order.tracking_number },
          { key: 'shipping_carrier', value: order.shipping_carrier }
        ]
      })
    }
  )

  return response.ok
}

// PrestaShop
async function fetchPrestaShopOrders(integration: any): Promise<any[]> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.api_key) return []

  const response = await fetch(
    `${storeUrl}/api/orders?output_format=JSON&display=full&limit=100`,
    {
      headers: { 'Authorization': `Basic ${btoa(credentials.api_key + ':')}` }
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.orders || []
}

async function updatePrestaShopOrder(integration: any, order: any): Promise<boolean> {
  // PrestaShop order update is more complex - placeholder
  console.log(`PrestaShop order update for ${order.id}`)
  return true
}

function mapOrderStatus(status: string, platform: string): string {
  const statusMap: Record<string, string> = {
    // Shopify
    'paid': 'processing',
    'pending': 'pending',
    'partially_refunded': 'processing',
    'refunded': 'refunded',
    'fulfilled': 'shipped',
    'unfulfilled': 'processing',
    // WooCommerce
    'processing': 'processing',
    'on-hold': 'pending',
    'completed': 'delivered',
    'cancelled': 'cancelled',
    // General
    'shipped': 'shipped',
    'delivered': 'delivered'
  }
  return statusMap[status?.toLowerCase()] || 'pending'
}

function mapOrderStatusReverse(status: string): string {
  const reverseMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'processing',
    'shipped': 'completed',
    'delivered': 'completed',
    'cancelled': 'cancelled',
    'refunded': 'refunded'
  }
  return reverseMap[status] || 'processing'
}
