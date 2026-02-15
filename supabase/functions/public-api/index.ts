import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'

/**
 * Public API v1 — Enterprise-grade with API Key Auth, rate limiting, expanded endpoints
 * 
 * Endpoints:
 *   GET    /products          — List products
 *   GET    /products/:id      — Get product
 *   POST   /products          — Create product
 *   PUT    /products/:id      — Update product
 *   DELETE /products/:id      — Delete product
 *   GET    /orders            — List orders
 *   GET    /customers         — List customers
 *   GET    /stock             — Inventory snapshot
 *   PUT    /stock/:sku        — Update stock
 *   GET    /analytics/summary — Dashboard KPIs
 */

interface ApiKeyValidation {
  isValid: boolean
  userId?: string
  keyId?: string
  scopes?: string[]
  environment?: string
  rateLimit?: number
  message?: string
}

async function sha256(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function validateApiKey(supabase: any, apiKey: string, requestIp: string): Promise<ApiKeyValidation> {
  try {
    const keyHash = await sha256(apiKey)

    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (error || !keyData) {
      return { isValid: false, message: 'Invalid API key' }
    }

    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { isValid: false, message: 'API key expired' }
    }

    if (keyData.allowed_ips?.length > 0 && !keyData.allowed_ips.includes(requestIp) && requestIp !== 'unknown') {
      return { isValid: false, message: 'IP not allowed' }
    }

    // Rate limiting — sliding window (1 hour)
    const windowStart = new Date(Date.now() - 3600000).toISOString()
    const { count } = await supabase
      .from('api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', keyData.user_id)
      .gte('created_at', windowStart)

    const rateLimit = keyData.rate_limit || 1000
    if ((count || 0) >= rateLimit) {
      return { isValid: false, message: `Rate limit exceeded (${rateLimit}/hour)` }
    }

    // Update last used
    await supabase.from('api_keys')
      .update({ last_used_at: new Date().toISOString(), last_used_ip: requestIp })
      .eq('id', keyData.id)

    return {
      isValid: true,
      userId: keyData.user_id,
      keyId: keyData.id,
      scopes: keyData.scopes || [],
      environment: keyData.environment,
      rateLimit,
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { isValid: false, message: 'Validation error' }
  }
}

function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes(required.split(':')[0] + ':write')
}

async function triggerWebhooks(supabase: any, userId: string, eventType: string, data: any) {
  try {
    const { data: webhooks } = await supabase
      .from('webhook_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType])

    if (!webhooks?.length) return

    for (const wh of webhooks) {
      supabase.functions.invoke('webhook-delivery', {
        body: { webhook_id: wh.id, event_type: eventType, payload: data }
      }).catch((e: any) => console.error('Webhook trigger failed:', e))
    }
  } catch { /* non-blocking */ }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  const startTime = Date.now()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' }

  try {
    const apiKey = req.headers.get('x-api-key')
    const requestIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required. Include x-api-key header.' }), { status: 401, headers })
    }

    const auth = await validateApiKey(supabase, apiKey, requestIp)
    if (!auth.isValid) {
      return new Response(JSON.stringify({ error: auth.message }), { status: 401, headers })
    }

    const userId = auth.userId!
    const scopes = auth.scopes!
    const url = new URL(req.url)
    const path = url.pathname.replace('/public-api', '')
    const method = req.method
    const getParam = (k: string, def: string) => url.searchParams.get(k) || def

    let response: any = null
    let statusCode = 200

    // ─── PRODUCTS ──────────────────────────────────────────────
    if (path.startsWith('/products')) {
      const productId = path.split('/')[2]

      if (method === 'GET' && !productId) {
        if (!hasScope(scopes, 'products:read')) return new Response(JSON.stringify({ error: 'Scope products:read required' }), { status: 403, headers })
        const limit = Math.min(parseInt(getParam('limit', '50')), 100)
        const offset = parseInt(getParam('offset', '0'))
        const status = getParam('status', '')

        let q = supabase.from('supplier_products').select('*', { count: 'exact' }).eq('user_id', userId).range(offset, offset + limit - 1).order('created_at', { ascending: false })
        if (status) q = q.eq('status', status)

        const { data, error, count } = await q
        if (error) throw error
        response = { products: data, total: count, limit, offset }
      }
      else if (method === 'GET' && productId) {
        if (!hasScope(scopes, 'products:read')) return new Response(JSON.stringify({ error: 'Scope products:read required' }), { status: 403, headers })
        const { data, error } = await supabase.from('supplier_products').select('*').eq('id', productId).eq('user_id', userId).single()
        if (error || !data) { statusCode = 404; response = { error: 'Product not found' } }
        else response = { product: data }
      }
      else if (method === 'POST') {
        if (!hasScope(scopes, 'products:write')) return new Response(JSON.stringify({ error: 'Scope products:write required' }), { status: 403, headers })
        const body = await req.json()
        const { data, error } = await supabase.from('supplier_products').insert({ ...body, user_id: userId }).select().single()
        if (error) throw error
        statusCode = 201; response = { product: data }
        triggerWebhooks(supabase, userId, 'product.created', data)
      }
      else if (method === 'PUT' && productId) {
        if (!hasScope(scopes, 'products:write')) return new Response(JSON.stringify({ error: 'Scope products:write required' }), { status: 403, headers })
        const body = await req.json(); delete body.user_id
        const { data, error } = await supabase.from('supplier_products').update(body).eq('id', productId).eq('user_id', userId).select().single()
        if (error) throw error
        response = { product: data }
        triggerWebhooks(supabase, userId, 'product.updated', data)
      }
      else if (method === 'DELETE' && productId) {
        if (!hasScope(scopes, 'products:write')) return new Response(JSON.stringify({ error: 'Scope products:write required' }), { status: 403, headers })
        const { error } = await supabase.from('supplier_products').delete().eq('id', productId).eq('user_id', userId)
        if (error) throw error
        statusCode = 204; response = null
        triggerWebhooks(supabase, userId, 'product.deleted', { id: productId })
      }
    }

    // ─── ORDERS ────────────────────────────────────────────────
    else if (path.startsWith('/orders')) {
      if (!hasScope(scopes, 'orders:read')) return new Response(JSON.stringify({ error: 'Scope orders:read required' }), { status: 403, headers })
      const orderId = path.split('/')[2]
      const limit = Math.min(parseInt(getParam('limit', '50')), 100)
      const status = getParam('status', '')

      if (method === 'GET' && !orderId) {
        let q = supabase.from('orders').select('*', { count: 'exact' }).eq('user_id', userId).limit(limit).order('created_at', { ascending: false })
        if (status) q = q.eq('status', status)
        const { data, error, count } = await q
        if (error) throw error
        response = { orders: data, total: count }
      }
      else if (method === 'GET' && orderId) {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).eq('user_id', userId).single()
        if (error || !data) { statusCode = 404; response = { error: 'Order not found' } }
        else response = { order: data }
      }
    }

    // ─── CUSTOMERS ─────────────────────────────────────────────
    else if (path.startsWith('/customers')) {
      if (!hasScope(scopes, 'orders:read')) return new Response(JSON.stringify({ error: 'Scope orders:read required' }), { status: 403, headers })
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, status, created_at, total_orders, total_spent')
        .eq('user_id', userId)
        .limit(Math.min(parseInt(getParam('limit', '50')), 100))
        .order('created_at', { ascending: false })
      if (error) throw error
      response = { customers: data }
    }

    // ─── STOCK / INVENTORY ─────────────────────────────────────
    else if (path.startsWith('/stock')) {
      const sku = path.split('/')[2]

      if (method === 'GET') {
        if (!hasScope(scopes, 'stock:read')) return new Response(JSON.stringify({ error: 'Scope stock:read required' }), { status: 403, headers })
        let q = supabase.from('product_variants').select('id, sku, inventory_qty, price, product_id').limit(200)
        if (sku) q = q.eq('sku', sku)
        const { data, error } = await q
        if (error) throw error
        response = sku ? { variant: data?.[0] || null } : { inventory: data }
      }
      else if (method === 'PUT' && sku) {
        if (!hasScope(scopes, 'stock:write') && !hasScope(scopes, 'products:write')) {
          return new Response(JSON.stringify({ error: 'Scope stock:write required' }), { status: 403, headers })
        }
        const body = await req.json()
        const { data, error } = await supabase.from('product_variants').update({ inventory_qty: body.quantity }).eq('sku', sku).select().single()
        if (error) throw error
        response = { variant: data }
        triggerWebhooks(supabase, userId, 'stock.updated', { sku, quantity: body.quantity })
      }
    }

    // ─── ANALYTICS ─────────────────────────────────────────────
    else if (path.startsWith('/analytics')) {
      if (!hasScope(scopes, 'analytics:read')) return new Response(JSON.stringify({ error: 'Scope analytics:read required' }), { status: 403, headers })

      const { data: products } = await supabase.from('supplier_products').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      const { data: orders } = await supabase.from('orders').select('total_amount, status').eq('user_id', userId)

      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((s: number, o: any) => s + (o.total_amount || 0), 0) || 0
      const delivered = orders?.filter((o: any) => o.status === 'delivered').length || 0

      response = {
        summary: {
          total_products: products || 0,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          fulfilled_orders: delivered,
          average_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders * 100) / 100 : 0,
        }
      }
    }

    // ─── 404 ───────────────────────────────────────────────────
    else {
      statusCode = 404
      response = {
        error: 'Endpoint not found',
        available_endpoints: [
          'GET /products', 'GET /products/:id', 'POST /products', 'PUT /products/:id', 'DELETE /products/:id',
          'GET /orders', 'GET /orders/:id',
          'GET /customers',
          'GET /stock', 'PUT /stock/:sku',
          'GET /analytics/summary',
        ]
      }
    }

    // Log request
    const responseTime = Date.now() - startTime
    supabase.from('api_logs').insert({
      user_id: userId,
      endpoint: path,
      method,
      status_code: statusCode,
      response_time_ms: responseTime,
      ip_address: requestIp,
    }).then(() => {}) // fire-and-forget

    // Add rate limit headers
    const resHeaders = {
      ...headers,
      'X-RateLimit-Limit': String(auth.rateLimit || 1000),
      'X-RateLimit-Remaining': String(Math.max(0, (auth.rateLimit || 1000) - 1)),
    }

    return new Response(
      statusCode === 204 ? null : JSON.stringify(response),
      { status: statusCode, headers: resHeaders }
    )
  } catch (error) {
    console.error('Public API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
      { status: 500, headers }
    )
  }
})
