import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface MetricsRequest {
  userId: string
  platform: string
  startDate: string
  endDate: string
}

interface PlatformMetrics {
  total_sales: number
  total_revenue: number
  total_orders: number
  total_fees: number
  total_profit: number
  avg_order_value: number
  conversion_rate: number
  active_listings: number
  views: number
  clicks: number
  impressions: number
  ctr: number
  roas: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, platform, startDate, endDate } = await req.json() as MetricsRequest

    console.log(`Fetching metrics for user ${userId}, platform: ${platform}`)

    // Get integration for this platform
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single()

    if (intError || !integration) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Integration not found or inactive',
          metrics: [],
          totals: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch real metrics based on platform
    let metrics: PlatformMetrics[] = []
    
    switch (platform.toLowerCase()) {
      case 'shopify':
        metrics = await fetchShopifyMetrics(integration, startDate, endDate)
        break
      case 'woocommerce':
        metrics = await fetchWooCommerceMetrics(integration, startDate, endDate)
        break
      case 'amazon':
        metrics = await fetchAmazonMetrics(integration, startDate, endDate)
        break
      case 'ebay':
        metrics = await fetchEbayMetrics(integration, startDate, endDate)
        break
      default:
        // Fallback: fetch from our own stored metrics
        metrics = await fetchStoredMetrics(supabase, userId, platform, startDate, endDate)
    }

    // Calculate totals from real data
    const totals = calculateTotals(metrics)

    // Store metrics snapshot if we got data
    if (metrics.length > 0) {
      const metricsToStore = metrics.map((m, i) => {
        const metricDate = new Date(startDate)
        metricDate.setDate(metricDate.getDate() + i)
        return {
          user_id: userId,
          platform,
          metric_date: metricDate.toISOString().split('T')[0],
          ...m
        }
      })

      await supabase
        .from('platform_performance_metrics')
        .upsert(metricsToStore, {
          onConflict: 'user_id,platform,metric_date'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        totals,
        source: metrics.length > 0 ? 'live_api' : 'no_data'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fetch metrics error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Fetch metrics from Shopify Analytics API
 */
async function fetchShopifyMetrics(
  integration: { store_url?: string; credentials?: Record<string, unknown> },
  startDate: string,
  endDate: string
): Promise<PlatformMetrics[]> {
  const accessToken = Deno.env.get('SHOPIFY_ADMIN_ACCESS_TOKEN')
  const storeDomain = integration.store_url
  
  if (!accessToken || !storeDomain) {
    console.log('Shopify credentials not configured')
    return []
  }

  try {
    // Fetch orders for the date range
    const ordersResponse = await fetch(
      `https://${storeDomain}/admin/api/2024-01/orders.json?created_at_min=${startDate}&created_at_max=${endDate}&status=any`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!ordersResponse.ok) {
      console.error('Shopify orders API error:', ordersResponse.status)
      return []
    }

    const ordersData = await ordersResponse.json()
    const orders = ordersData.orders || []

    // Fetch products count
    const productsResponse = await fetch(
      `https://${storeDomain}/admin/api/2024-01/products/count.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      }
    )

    const productsData = await productsResponse.json()
    const activeListings = productsData.count || 0

    // Calculate metrics from orders
    const totalRevenue = orders.reduce((sum: number, o: { total_price: string }) => 
      sum + parseFloat(o.total_price || '0'), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Estimate fees (Shopify takes ~2.9% + $0.30 per transaction)
    const totalFees = orders.reduce((sum: number) => sum + (avgOrderValue * 0.029 + 0.30), 0)

    return [{
      total_sales: totalOrders,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_orders: totalOrders,
      total_fees: Math.round(totalFees * 100) / 100,
      total_profit: Math.round((totalRevenue - totalFees) * 0.6 * 100) / 100, // Assume 60% profit margin
      avg_order_value: Math.round(avgOrderValue * 100) / 100,
      conversion_rate: 0, // Would need analytics API for this
      active_listings: activeListings,
      views: 0,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      roas: 0
    }]

  } catch (err) {
    console.error('Shopify metrics fetch error:', err)
    return []
  }
}

/**
 * Fetch metrics from WooCommerce REST API
 */
async function fetchWooCommerceMetrics(
  integration: { store_url?: string; credentials?: Record<string, unknown> },
  startDate: string,
  endDate: string
): Promise<PlatformMetrics[]> {
  const storeUrl = integration.store_url
  const creds = integration.credentials as { consumer_key?: string; consumer_secret?: string } | null
  
  if (!storeUrl || !creds?.consumer_key || !creds?.consumer_secret) {
    console.log('WooCommerce credentials not configured')
    return []
  }

  try {
    const auth = btoa(`${creds.consumer_key}:${creds.consumer_secret}`)
    
    // Fetch orders
    const ordersResponse = await fetch(
      `${storeUrl}/wp-json/wc/v3/orders?after=${startDate}T00:00:00&before=${endDate}T23:59:59&per_page=100`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!ordersResponse.ok) {
      console.error('WooCommerce API error:', ordersResponse.status)
      return []
    }

    const orders = await ordersResponse.json()

    // Fetch products count
    const productsResponse = await fetch(
      `${storeUrl}/wp-json/wc/v3/products?per_page=1`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const totalProducts = parseInt(productsResponse.headers.get('X-WP-Total') || '0')

    // Calculate metrics
    const totalRevenue = orders.reduce((sum: number, o: { total: string }) => 
      sum + parseFloat(o.total || '0'), 0)
    const totalOrders = orders.length

    return [{
      total_sales: totalOrders,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_orders: totalOrders,
      total_fees: Math.round(totalRevenue * 0.03 * 100) / 100, // Estimate 3% payment fees
      total_profit: Math.round(totalRevenue * 0.55 * 100) / 100,
      avg_order_value: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      conversion_rate: 0,
      active_listings: totalProducts,
      views: 0,
      clicks: 0,
      impressions: 0,
      ctr: 0,
      roas: 0
    }]

  } catch (err) {
    console.error('WooCommerce metrics fetch error:', err)
    return []
  }
}

/**
 * Fetch metrics from Amazon Seller API
 */
async function fetchAmazonMetrics(
  _integration: { store_url?: string; credentials?: Record<string, unknown> },
  _startDate: string,
  _endDate: string
): Promise<PlatformMetrics[]> {
  // Amazon SP-API requires complex OAuth flow and specific credentials
  // This would need: refresh_token, client_id, client_secret, marketplace_id
  console.log('Amazon SP-API integration requires additional setup')
  return []
}

/**
 * Fetch metrics from eBay API
 */
async function fetchEbayMetrics(
  _integration: { store_url?: string; credentials?: Record<string, unknown> },
  _startDate: string,
  _endDate: string
): Promise<PlatformMetrics[]> {
  // eBay API requires OAuth tokens
  console.log('eBay API integration requires additional setup')
  return []
}

/**
 * Fetch previously stored metrics from database
 */
async function fetchStoredMetrics(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  platform: string,
  startDate: string,
  endDate: string
): Promise<PlatformMetrics[]> {
  const { data: storedMetrics } = await supabase
    .from('platform_performance_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true })

  if (storedMetrics && storedMetrics.length > 0) {
    return storedMetrics.map(m => ({
      total_sales: m.total_sales || 0,
      total_revenue: m.total_revenue || 0,
      total_orders: m.total_orders || 0,
      total_fees: m.total_fees || 0,
      total_profit: m.total_profit || 0,
      avg_order_value: m.avg_order_value || 0,
      conversion_rate: m.conversion_rate || 0,
      active_listings: m.active_listings || 0,
      views: m.views || 0,
      clicks: m.clicks || 0,
      impressions: m.impressions || 0,
      ctr: m.ctr || 0,
      roas: m.roas || 0
    }))
  }

  return []
}

/**
 * Calculate totals from metrics array
 */
function calculateTotals(metrics: PlatformMetrics[]) {
  if (metrics.length === 0) {
    return null
  }

  const totals = metrics.reduce((acc, m) => ({
    totalRevenue: acc.totalRevenue + m.total_revenue,
    totalOrders: acc.totalOrders + m.total_orders,
    totalProfit: acc.totalProfit + m.total_profit,
    totalFees: acc.totalFees + m.total_fees,
    avgConversion: acc.avgConversion + m.conversion_rate,
    avgROAS: acc.avgROAS + m.roas
  }), {
    totalRevenue: 0,
    totalOrders: 0,
    totalProfit: 0,
    totalFees: 0,
    avgConversion: 0,
    avgROAS: 0
  })

  return {
    totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
    totalOrders: totals.totalOrders,
    totalProfit: Math.round(totals.totalProfit * 100) / 100,
    totalFees: Math.round(totals.totalFees * 100) / 100,
    avgConversion: metrics.length > 0 ? Math.round((totals.avgConversion / metrics.length) * 100) / 100 : 0,
    avgROAS: metrics.length > 0 ? Math.round((totals.avgROAS / metrics.length) * 100) / 100 : 0
  }
}
