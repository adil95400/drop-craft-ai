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

    const { integration_id } = await req.json()

    if (!integration_id) {
      throw new Error('Integration ID is required')
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single()

    if (integrationError) {
      throw new Error(`Integration not found: ${integrationError.message}`)
    }

    // Check cache first
    const cacheKey = `shopify_stats_${integration_id}`
    const { data: cachedData } = await supabaseClient
      .from('api_cache')
      .select('data')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cachedData) {
      console.log('Returning cached Shopify stats')
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        ...cachedData.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const credentials = integration.encrypted_credentials || {}
    
    if (!credentials.access_token || !integration.shop_domain) {
      throw new Error('Shopify credentials missing')
    }

    const shopifyDomain = integration.shop_domain
    const accessToken = credentials.access_token

    // Get basic shop info
    const shopResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!shopResponse.ok) {
      throw new Error(`Shopify API error: ${shopResponse.status}`)
    }

    const shopData = await shopResponse.json()

    // Get products count
    const productsCountResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/products/count.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    let productsCount = 0
    if (productsCountResponse.ok) {
      const productsCountData = await productsCountResponse.json()
      productsCount = productsCountData.count || 0
    }

    // Get orders count (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const ordersCountResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/orders/count.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    let ordersCount = 0
    if (ordersCountResponse.ok) {
      const ordersCountData = await ordersCountResponse.json()
      ordersCount = ordersCountData.count || 0
    }

    // Get recent orders for revenue calculation
    const ordersResponse = await fetch(`https://${shopifyDomain}/admin/api/2023-10/orders.json?limit=250&status=any&created_at_min=${thirtyDaysAgo.toISOString()}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    let revenue = 0
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json()
      const orders = ordersData.orders || []
      revenue = orders.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total_price || '0')
      }, 0)
    }

    const stats = {
      products: productsCount,
      orders: ordersCount,
      revenue: revenue,
      shop_info: {
        name: shopData.shop?.name,
        domain: shopData.shop?.domain,
        email: shopData.shop?.email,
        currency: shopData.shop?.currency,
        timezone: shopData.shop?.timezone,
        plan_name: shopData.shop?.plan_name
      }
    }

    // Cache the results for 15 minutes
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    await supabaseClient
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        data: stats,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      })

    console.log(`Retrieved Shopify stats: ${productsCount} products, ${ordersCount} orders, ${revenue} revenue`)

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      ...stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Shopify stats error:', error)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})