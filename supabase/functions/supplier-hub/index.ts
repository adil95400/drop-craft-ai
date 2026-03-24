/**
 * Supplier Hub — Production-grade supplier operations
 * Actions: connect, test, catalog-sync, compare, health-check,
 *          score, order, track, price-update, stock-monitor, find
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Authorization required' }, 401)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const body = await req.json()
    const action = body.action || new URL(req.url).searchParams.get('action')

    switch (action) {
      case 'connect': return await handleConnect(supabase, user.id, body)
      case 'test': return await handleTest(supabase, user.id, body)
      case 'health-check': return await handleHealthCheck(supabase, user.id)
      case 'compare': return await handleCompare(supabase, user.id, body)
      case 'score': return await handleScore(supabase, user.id, body)
      case 'catalog-sync': return await handleCatalogSync(supabase, user.id, body)
      case 'stock-monitor': return await handleStockMonitor(supabase, user.id)
      case 'price-update': return await handlePriceUpdate(supabase, user.id, body)
      case 'find': return await handleFind(supabase, body)
      case 'order': return await handleOrder(supabase, user.id, body)
      case 'track': return await handleTrack(supabase, user.id, body)
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error) {
    console.error('Supplier hub error:', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Internal error' }, 400)
  }
})

// ─── Connect supplier ────────────────────────────────────────────────
async function handleConnect(supabase: any, userId: string, body: any) {
  const { platform, credentials, store_url, name } = body
  if (!platform) throw new Error('Platform required')

  const { data, error } = await supabase.from('suppliers').insert({
    user_id: userId,
    name: name || `${platform} Supplier`,
    platform,
    api_url: store_url,
    credentials_encrypted: credentials ? JSON.stringify(credentials) : null,
    status: 'pending',
    reliability_score: 0,
  }).select().single()

  if (error) throw error
  return jsonResponse({ supplier: data, message: 'Supplier connected' })
}

// ─── Test supplier connection ────────────────────────────────────────
async function handleTest(supabase: any, userId: string, body: any) {
  const { supplier_id } = body
  if (!supplier_id) throw new Error('supplier_id required')

  const { data: supplier } = await supabase.from('suppliers')
    .select('*').eq('id', supplier_id).eq('user_id', userId).single()
  if (!supplier) throw new Error('Supplier not found')

  // Get credentials
  const { data: creds } = await supabase.from('supplier_credentials_vault')
    .select('*').eq('user_id', userId).eq('supplier_id', supplier_id).maybeSingle()

  let isReachable = false
  let errorMsg = ''

  try {
    isReachable = await testSupplierAPI(supplier.platform, creds)
  } catch (e) {
    errorMsg = e instanceof Error ? e.message : 'Connection failed'
  }

  await supabase.from('suppliers').update({
    status: isReachable ? 'active' : 'error',
    last_sync: new Date().toISOString(),
  }).eq('id', supplier_id)

  return jsonResponse({ success: isReachable, supplier_id, status: isReachable ? 'active' : 'error', error: errorMsg || undefined })
}

async function testSupplierAPI(platform: string, creds: any): Promise<boolean> {
  const oauthData = creds?.oauth_data || {}
  const apiKey = oauthData.apiKey || oauthData.accessToken || creds?.api_key_encrypted

  switch (platform) {
    case 'cjdropshipping': {
      if (!apiKey) return false
      const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=1&pageSize=1', {
        headers: { 'CJ-Access-Token': apiKey }
      })
      return res.ok
    }
    case 'bigbuy': {
      if (!apiKey) return false
      const res = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      return res.ok
    }
    case 'aliexpress': {
      // AliExpress requires OAuth — just check credentials exist
      return !!apiKey
    }
    default:
      return !!creds
  }
}

// ─── Health check ────────────────────────────────────────────────────
async function handleHealthCheck(supabase: any, userId: string) {
  const { data: suppliers } = await supabase.from('suppliers')
    .select('id, name, platform, status, last_sync, reliability_score')
    .eq('user_id', userId)

  const health = (suppliers || []).map((s: any) => ({
    ...s,
    is_healthy: s.status === 'active',
    hours_since_sync: s.last_sync
      ? Math.round((Date.now() - new Date(s.last_sync).getTime()) / 3600000)
      : null
  }))

  return jsonResponse({
    suppliers: health,
    total: health.length,
    healthy: health.filter((s: any) => s.is_healthy).length
  })
}

// ─── Compare suppliers for a product ─────────────────────────────────
async function handleCompare(supabase: any, userId: string, body: any) {
  const { product_id } = body
  let q = supabase.from('supplier_products')
    .select('*, suppliers(name, platform, reliability_score)')
    .eq('user_id', userId)
    .order('price', { ascending: true })
    .limit(50)

  if (product_id) q = q.eq('product_id', product_id)

  const { data } = await q
  return jsonResponse({ comparisons: data || [] })
}

// ─── Score suppliers ─────────────────────────────────────────────────
async function handleScore(supabase: any, userId: string, body: any) {
  const { supplier_id } = body
  let q = supabase.from('suppliers')
    .select('id, name, platform, reliability_score, delivery_time_avg, return_rate, total_orders')
    .eq('user_id', userId)

  if (supplier_id) q = q.eq('id', supplier_id)

  const { data } = await q
  return jsonResponse({ scores: data || [] })
}

// ─── Catalog sync — delegates to supplier-sync-products ──────────────
async function handleCatalogSync(supabase: any, userId: string, body: any) {
  const { supplier_id, limit = 100 } = body
  if (!supplier_id) throw new Error('supplier_id required')

  // Mark sync started
  await supabase.from('suppliers').update({
    last_sync: new Date().toISOString(),
    status: 'syncing'
  }).eq('id', supplier_id).eq('user_id', userId)

  // Create a background job for tracking
  const { data: job } = await supabase.from('jobs').insert({
    user_id: userId,
    job_type: 'sync',
    status: 'running',
    metadata: { supplier_id, limit },
  }).select().single()

  // Delegate to supplier-sync-products (internal call via service_role)
  try {
    const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/supplier-sync-products`
    const res = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ supplierId: supplier_id, limit }),
    })

    const result = await res.json()

    await supabase.from('suppliers').update({ status: 'active' })
      .eq('id', supplier_id).eq('user_id', userId)

    if (job) {
      await supabase.from('jobs').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: result,
      }).eq('id', job.id)
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'catalog_sync_completed',
      entity_type: 'supplier',
      entity_id: supplier_id,
      description: `Catalog sync: ${result?.syncStats?.imported || 0} products imported`,
      source: 'supplier_hub',
      severity: 'info',
    })

    return jsonResponse({ ok: true, job_id: job?.id, result })
  } catch (err) {
    await supabase.from('suppliers').update({ status: 'error' })
      .eq('id', supplier_id).eq('user_id', userId)

    if (job) {
      await supabase.from('jobs').update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Sync failed',
      }).eq('id', job.id)
    }

    throw err
  }
}

// ─── Stock monitor ───────────────────────────────────────────────────
async function handleStockMonitor(supabase: any, userId: string) {
  const { data: lowStock } = await supabase.from('products')
    .select('id, title, stock_quantity, supplier_id')
    .eq('user_id', userId)
    .lt('stock_quantity', 10)
    .order('stock_quantity', { ascending: true })
    .limit(50)

  return jsonResponse({ low_stock_products: lowStock || [], count: lowStock?.length || 0 })
}

// ─── Price update (batch) ────────────────────────────────────────────
async function handlePriceUpdate(supabase: any, userId: string, body: any) {
  const { supplier_id, products } = body
  if (!supplier_id || !products?.length) throw new Error('supplier_id and products required')

  let updated = 0
  for (const p of products.slice(0, 100)) {
    const { error } = await supabase.from('supplier_products')
      .update({ price: p.price, updated_at: new Date().toISOString() })
      .eq('supplier_id', supplier_id)
      .eq('product_id', p.product_id)
      .eq('user_id', userId)
    if (!error) updated++
  }

  return jsonResponse({ updated, total: products.length })
}

// ─── Find suppliers ──────────────────────────────────────────────────
async function handleFind(supabase: any, body: any) {
  const { query, min_score } = body
  let q = supabase.from('suppliers')
    .select('*')
    .order('reliability_score', { ascending: false })
    .limit(20)

  if (query) q = q.ilike('name', `%${query}%`)
  if (min_score) q = q.gte('reliability_score', min_score)

  const { data } = await q
  return jsonResponse({ suppliers: data || [] })
}

// ─── Place order via supplier API ────────────────────────────────────
async function handleOrder(supabase: any, userId: string, body: any) {
  const { supplier_id, items, shipping_address } = body
  if (!supplier_id || !items?.length) throw new Error('supplier_id and items required')

  // Get supplier info + credentials
  const { data: supplier } = await supabase.from('suppliers')
    .select('*').eq('id', supplier_id).eq('user_id', userId).single()
  if (!supplier) throw new Error('Supplier not found')

  const { data: creds } = await supabase.from('supplier_credentials_vault')
    .select('*').eq('user_id', userId).eq('supplier_id', supplier_id).maybeSingle()

  const oauthData = creds?.oauth_data || {}
  const apiKey = oauthData.accessToken || oauthData.apiKey || creds?.api_key_encrypted

  let orderResult: any

  switch (supplier.platform) {
    case 'cjdropshipping': {
      if (!apiKey) throw new Error('CJ Access Token required')
      orderResult = await placeCJOrder(apiKey, items, shipping_address)
      break
    }
    case 'bigbuy': {
      if (!apiKey) throw new Error('BigBuy API key required')
      orderResult = await placeBigBuyOrder(apiKey, items, shipping_address)
      break
    }
    default: {
      // Generic: create internal order record
      orderResult = {
        supplier_order_id: `${supplier.platform.toUpperCase()}-${Date.now()}`,
        status: 'pending_manual',
        method: 'manual',
      }
    }
  }

  // Log
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'supplier_order_placed',
    entity_type: 'supplier_order',
    entity_id: orderResult.supplier_order_id,
    description: `Order placed: ${orderResult.supplier_order_id} via ${supplier.platform}`,
    details: { supplier_id, items_count: items.length, method: orderResult.method || 'api' },
    source: 'supplier_hub',
    severity: 'info',
  })

  return jsonResponse({ ok: true, order: orderResult })
}

// ─── CJ Dropshipping — Real order placement ─────────────────────────
async function placeCJOrder(accessToken: string, items: any[], shipping: any): Promise<any> {
  const orderPayload = {
    products: items.map((item: any) => ({
      vid: item.variant_id || item.sku,
      quantity: item.quantity,
    })),
    shippingAddress: {
      firstName: shipping.first_name || shipping.name?.split(' ')[0] || '',
      lastName: shipping.last_name || shipping.name?.split(' ').slice(1).join(' ') || '',
      address: shipping.address || shipping.address1,
      city: shipping.city,
      zip: shipping.postal_code || shipping.zip,
      countryCode: shipping.country_code || shipping.country || 'FR',
      province: shipping.state || shipping.province || '',
      phone: shipping.phone || '',
      email: shipping.email || '',
    },
    shippingMethodId: shipping.shipping_method || 'CJ_PACKET_B',
  }

  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': accessToken,
    },
    body: JSON.stringify(orderPayload),
  })

  const data = await res.json()

  if (data.code !== 200) {
    throw new Error(`CJ order failed: ${data.message || data.code}`)
  }

  return {
    supplier_order_id: data.data?.orderId || data.data?.orderNum,
    status: 'confirmed',
    method: 'api',
    platform: 'cjdropshipping',
    raw: data.data,
  }
}

// ─── BigBuy — Real order placement ───────────────────────────────────
async function placeBigBuyOrder(apiKey: string, items: any[], shipping: any): Promise<any> {
  const orderPayload = {
    delivery: {
      firstName: shipping.first_name || shipping.name?.split(' ')[0] || '',
      lastName: shipping.last_name || shipping.name?.split(' ').slice(1).join(' ') || '',
      address: shipping.address || shipping.address1,
      postcode: shipping.postal_code || shipping.zip,
      town: shipping.city,
      country: shipping.country_code || 'ES',
      phone: shipping.phone || '',
      email: shipping.email || '',
    },
    products: items.map((item: any) => ({
      reference: item.sku,
      quantity: item.quantity,
    })),
    internalReference: `SO-${Date.now()}`,
  }

  const res = await fetch('https://api.bigbuy.eu/rest/order/create.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(orderPayload),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`BigBuy order failed: ${res.status} ${JSON.stringify(data)}`)
  }

  return {
    supplier_order_id: data.id || data.orderId,
    status: 'confirmed',
    method: 'api',
    platform: 'bigbuy',
    raw: data,
  }
}

// ─── Track order via 17Track or carrier API ──────────────────────────
async function handleTrack(supabase: any, userId: string, body: any) {
  const { tracking_number, carrier, order_id } = body

  // If order_id provided, get tracking from auto_order_queue
  if (order_id && !tracking_number) {
    const { data: order } = await supabase.from('auto_order_queue')
      .select('tracking_number, carrier, result, supplier_order_id')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single()

    if (!order?.tracking_number) {
      return jsonResponse({ ok: true, status: 'awaiting_tracking', message: 'Tracking number not yet available' })
    }

    return await fetchTrackingInfo(order.tracking_number, order.carrier)
  }

  if (!tracking_number) throw new Error('tracking_number or order_id required')
  return await fetchTrackingInfo(tracking_number, carrier)
}

async function fetchTrackingInfo(trackingNumber: string, carrier?: string): Promise<Response> {
  const trackApiKey = Deno.env.get('TRACK17_API_KEY')

  if (trackApiKey) {
    // Real 17Track API v2
    try {
      const res = await fetch('https://api.17track.net/track/v2.2/gettrackinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          '17token': trackApiKey,
        },
        body: JSON.stringify([{ number: trackingNumber, carrier: carrier ? parseInt(carrier) : undefined }]),
      })

      const data = await res.json()
      const trackInfo = data?.data?.accepted?.[0] || data?.data?.rejected?.[0]

      if (trackInfo?.track) {
        const events = trackInfo.track.z0?.z || []
        const latestEvent = events[0]

        return jsonResponse({
          ok: true,
          tracking_number: trackingNumber,
          carrier: trackInfo.track.w1,
          status: mapTrackStatus(trackInfo.track.e),
          latest_event: latestEvent ? {
            description: latestEvent.z,
            location: latestEvent.c,
            timestamp: latestEvent.a,
          } : null,
          events: events.slice(0, 20).map((e: any) => ({
            description: e.z,
            location: e.c,
            timestamp: e.a,
          })),
        })
      }
    } catch (err) {
      console.error('17Track API error:', err)
    }
  }

  // Fallback: return basic info
  return jsonResponse({
    ok: true,
    tracking_number: trackingNumber,
    carrier: carrier || 'unknown',
    status: 'pending',
    message: trackApiKey ? 'Tracking info not yet available' : 'Configure TRACK17_API_KEY for real tracking',
  })
}

function mapTrackStatus(statusCode: number): string {
  const map: Record<number, string> = {
    0: 'not_found',
    10: 'in_transit',
    20: 'expired',
    30: 'pick_up',
    35: 'undelivered',
    40: 'delivered',
    50: 'alert',
  }
  return map[statusCode] || 'unknown'
}

// ─── JSON response helper ────────────────────────────────────────────
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
