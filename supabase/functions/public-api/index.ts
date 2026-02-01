import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/secure-cors.ts'

/**
 * Public API - Enterprise-Safe with API Key Authentication
 * 
 * Security:
 * - API key authentication (x-api-key header)
 * - Rate limiting per API key
 * - IP whitelist support
 * - User data scoping
 * - Request logging
 */

interface ApiKeyValidation {
  isValid: boolean
  userId?: string
  keyId?: string
  scopes?: string[]
  environment?: string
  message?: string
}

async function validateApiKey(supabase: any, apiKey: string, requestIp: string): Promise<ApiKeyValidation> {
  try {
    // Validate API key by hash for security
    const keyHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(apiKey)
    )
    const hashHex = Array.from(new Uint8Array(keyHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Get API key from database by hash
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', hashHex)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      // Fallback to legacy key_value check (for migration)
      const { data: legacyKey } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key', apiKey.substring(0, 15) + '...')
        .eq('is_active', true)
        .single()
      
      if (!legacyKey) {
        return { isValid: false, message: 'Invalid API key' }
      }
      
      // Use legacy key data
      Object.assign(keyData || {}, legacyKey)
    }

    const finalKeyData = keyData || {}

    // Check if key is expired
    if (finalKeyData.expires_at && new Date(finalKeyData.expires_at) < new Date()) {
      return { isValid: false, message: 'API key expired' }
    }

    // Check IP whitelist
    if (finalKeyData.allowed_ips && finalKeyData.allowed_ips.length > 0) {
      if (!finalKeyData.allowed_ips.includes(requestIp) && requestIp !== 'unknown') {
        return { isValid: false, message: 'IP not allowed' }
      }
    }

    // Check rate limit
    const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString()
    
    const { data: rateLimitData } = await supabase
      .from('api_logs')
      .select('id')
      .eq('api_key_id', finalKeyData.id)
      .gte('created_at', windowStart)

    const requestCount = rateLimitData?.length || 0
    const rateLimit = finalKeyData.rate_limit || 1000

    if (requestCount >= rateLimit) {
      return { isValid: false, message: 'Rate limit exceeded' }
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        last_used_ip: requestIp
      })
      .eq('id', finalKeyData.id)

    return {
      isValid: true,
      userId: finalKeyData.user_id,
      keyId: finalKeyData.id,
      scopes: finalKeyData.scopes || [],
      environment: finalKeyData.environment
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { isValid: false, message: 'Validation error' }
  }
}

async function logApiRequest(
  supabase: any,
  keyId: string,
  userId: string,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  requestIp: string,
  userAgent: string
) {
  await supabase.from('api_logs').insert({
    user_id: userId,
    endpoint,
    method,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: requestIp
  })
}

async function triggerWebhook(supabase: any, userId: string, eventType: string, data: any) {
  const { data: webhooks } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (!webhooks || webhooks.length === 0) return

  for (const webhook of webhooks) {
    try {
      await supabase.functions.invoke('webhook-delivery', {
        body: {
          webhook_id: webhook.id,
          event_type: eventType,
          payload: data
        }
      })
    } catch (error) {
      console.error('Webhook trigger error:', error)
    }
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)
  
  const preflightResponse = handleCorsPreflightRequest(req, corsHeaders)
  if (preflightResponse) return preflightResponse

  const startTime = Date.now()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Extract API key
    const apiKey = req.headers.get('x-api-key')
    const requestIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required. Include x-api-key header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate API key
    const validation = await validateApiKey(supabase, apiKey, requestIp)
    
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ error: validation.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = validation.userId!

    // Parse URL and method
    const url = new URL(req.url)
    const path = url.pathname.replace('/public-api', '')
    const method = req.method

    let response: any
    let statusCode = 200

    // Route handling - ALL DATA SCOPED TO USER
    if (path.startsWith('/products')) {
      const productId = path.split('/')[2]

      if (method === 'GET' && !productId) {
        // List products
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const category = url.searchParams.get('category')

        let query = supabase
          .from('supplier_products')
          .select('*')
          .eq('user_id', userId) // CRITICAL: Scope to user
          .range(offset, offset + limit - 1)

        if (category) {
          query = query.eq('category', category)
        }

        const { data, error } = await query
        
        if (error) throw error
        response = { products: data, total: data.length }
        
        await triggerWebhook(supabase, userId, 'products.listed', { count: data.length })
      } 
      else if (method === 'GET' && productId) {
        // Get single product - SCOPED TO USER
        const { data, error } = await supabase
          .from('supplier_products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', userId) // CRITICAL: Scope to user
          .single()

        if (error || !data) {
          statusCode = 404
          response = { error: 'Product not found' }
        } else {
          response = { product: data }
        }
      }
      else if (method === 'POST') {
        // Create product
        const body = await req.json()
        const { data, error } = await supabase
          .from('supplier_products')
          .insert({ ...body, user_id: userId }) // CRITICAL: Force user_id
          .select()
          .single()

        if (error) throw error
        statusCode = 201
        response = { product: data }
        
        await triggerWebhook(supabase, userId, 'product.created', data)
      }
      else if (method === 'PUT' && productId) {
        // Update product - SCOPED TO USER
        const body = await req.json()
        delete body.user_id // Prevent user_id override
        
        const { data, error } = await supabase
          .from('supplier_products')
          .update(body)
          .eq('id', productId)
          .eq('user_id', userId) // CRITICAL: Scope to user
          .select()
          .single()

        if (error) throw error
        response = { product: data }
        
        await triggerWebhook(supabase, userId, 'product.updated', data)
      }
      else if (method === 'DELETE' && productId) {
        // Delete product - SCOPED TO USER
        const { error } = await supabase
          .from('supplier_products')
          .delete()
          .eq('id', productId)
          .eq('user_id', userId) // CRITICAL: Scope to user

        if (error) throw error
        statusCode = 204
        response = null
        
        await triggerWebhook(supabase, userId, 'product.deleted', { id: productId })
      }
    }
    else if (path.startsWith('/orders')) {
      // List orders - SCOPED TO USER
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
      const status = url.searchParams.get('status')

      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId) // CRITICAL: Scope to user
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      response = { orders: data }
    }
    else if (path.startsWith('/customers')) {
      // List customers - SCOPED TO USER
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, status, created_at') // Limit exposed fields
        .eq('user_id', userId) // CRITICAL: Scope to user
        .limit(50)

      if (error) throw error
      response = { customers: data }
    }
    else {
      statusCode = 404
      response = { error: 'Endpoint not found', available_endpoints: ['/products', '/orders', '/customers'] }
    }

    // Log request
    const responseTime = Date.now() - startTime
    await logApiRequest(
      supabase,
      validation.keyId!,
      userId,
      method,
      path,
      statusCode,
      responseTime,
      requestIp,
      userAgent
    )

    return new Response(
      statusCode === 204 ? null : JSON.stringify(response),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
