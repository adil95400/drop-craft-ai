import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

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
    // Get API key from database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_value', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return { isValid: false, message: 'Invalid API key' }
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { isValid: false, message: 'API key expired' }
    }

    // Check IP whitelist
    if (keyData.allowed_ips && keyData.allowed_ips.length > 0) {
      if (!keyData.allowed_ips.includes(requestIp)) {
        return { isValid: false, message: 'IP not allowed' }
      }
    }

    // Check rate limit
    const { data: rateLimitData } = await supabase.rpc('check_api_rate_limit', {
      p_api_key_id: keyData.id,
      p_limit: keyData.rate_limit || 1000,
      p_window_minutes: 60
    })

    if (!rateLimitData) {
      return { isValid: false, message: 'Rate limit exceeded' }
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ 
        last_used_at: new Date().toISOString(),
        last_used_ip: requestIp,
        request_count: (keyData.request_count || 0) + 1
      })
      .eq('id', keyData.id)

    // Record rate limit
    await supabase
      .from('api_rate_limits')
      .insert({
        api_key_id: keyData.id,
        request_count: 1,
        window_start: new Date(Math.floor(Date.now() / 60000) * 60000).toISOString()
      })

    return {
      isValid: true,
      userId: keyData.user_id,
      keyId: keyData.id,
      scopes: keyData.scopes || [],
      environment: keyData.environment
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return { isValid: false, message: 'Validation error' }
  }
}

async function logApiRequest(
  supabase: any,
  keyId: string,
  method: string,
  endpoint: string,
  statusCode: number,
  responseTime: number,
  requestIp: string,
  userAgent: string
) {
  await supabase.from('api_logs').insert({
    api_key_id: keyId,
    method,
    endpoint,
    status_code: statusCode,
    response_time_ms: responseTime,
    ip_address: requestIp,
    user_agent: userAgent
  })
}

async function triggerWebhook(supabase: any, userId: string, eventType: string, data: any) {
  // Find active webhooks for this event
  const { data: webhooks } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [eventType])

  if (!webhooks || webhooks.length === 0) return

  // Trigger webhook delivery function
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const startTime = Date.now()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Extract API key
    const apiKey = req.headers.get('x-api-key')
    const requestIp = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
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

    // Parse URL and method
    const url = new URL(req.url)
    const path = url.pathname.replace('/public-api', '')
    const method = req.method

    let response: any
    let statusCode = 200

    // Route handling
    if (path.startsWith('/products')) {
      const productId = path.split('/')[2]

      if (method === 'GET' && !productId) {
        // List products
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const category = url.searchParams.get('category')

        let query = supabase
          .from('supplier_products')
          .select('*')
          .eq('user_id', validation.userId)
          .range(offset, offset + limit - 1)

        if (category) {
          query = query.eq('category', category)
        }

        const { data, error } = await query
        
        if (error) throw error
        response = { products: data, total: data.length }
        
        await triggerWebhook(supabase, validation.userId!, 'products.listed', { count: data.length })
      } 
      else if (method === 'GET' && productId) {
        // Get single product
        const { data, error } = await supabase
          .from('supplier_products')
          .select('*')
          .eq('id', productId)
          .eq('user_id', validation.userId)
          .single()

        if (error) {
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
          .insert({ ...body, user_id: validation.userId })
          .select()
          .single()

        if (error) throw error
        statusCode = 201
        response = { product: data }
        
        await triggerWebhook(supabase, validation.userId!, 'product.created', data)
      }
      else if (method === 'PUT' && productId) {
        // Update product
        const body = await req.json()
        const { data, error } = await supabase
          .from('supplier_products')
          .update(body)
          .eq('id', productId)
          .eq('user_id', validation.userId)
          .select()
          .single()

        if (error) throw error
        response = { product: data }
        
        await triggerWebhook(supabase, validation.userId!, 'product.updated', data)
      }
      else if (method === 'DELETE' && productId) {
        // Delete product
        const { error } = await supabase
          .from('supplier_products')
          .delete()
          .eq('id', productId)
          .eq('user_id', validation.userId)

        if (error) throw error
        statusCode = 204
        response = null
        
        await triggerWebhook(supabase, validation.userId!, 'product.deleted', { id: productId })
      }
    }
    else if (path.startsWith('/orders')) {
      // List orders
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const status = url.searchParams.get('status')

      let query = supabase
        .from('orders')
        .select('*')
        .eq('user_id', validation.userId)
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      response = { orders: data }
    }
    else if (path.startsWith('/customers')) {
      // List customers
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', validation.userId)
        .limit(50)

      if (error) throw error
      response = { customers: data }
    }
    else {
      statusCode = 404
      response = { error: 'Endpoint not found' }
    }

    // Log request
    const responseTime = Date.now() - startTime
    await logApiRequest(
      supabase,
      validation.keyId!,
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
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
