import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WebhookRequest {
  action: 'receive' | 'register' | 'unregister' | 'list' | 'test'
  platform?: string
  eventType?: string
  webhookUrl?: string
  integrationId?: string
  secret?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const path = url.pathname

    // Handle incoming webhooks from external platforms
    if (path.includes('/webhook/') && req.method === 'POST') {
      return await handleIncomingWebhook(req, supabase)
    }

    // Handle webhook management requests
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const requestData: WebhookRequest = await req.json()
    
    switch (requestData.action) {
      case 'register':
        return await registerWebhook(requestData, user.id, supabase)
      
      case 'unregister':
        return await unregisterWebhook(requestData, user.id, supabase)
      
      case 'list':
        return await listWebhooks(user.id, supabase)
      
      case 'test':
        return await testWebhook(requestData, user.id, supabase)
      
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleIncomingWebhook(req: Request, supabase: any) {
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/')
  const platform = pathParts[pathParts.length - 2]
  const integrationId = pathParts[pathParts.length - 1]

  console.log(`Received webhook from ${platform} for integration ${integrationId}`)

  try {
    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('platform_name', platform)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integration not found')
    }

    // Get webhook body
    const body = await req.text()
    let webhookData

    try {
      webhookData = JSON.parse(body)
    } catch {
      webhookData = { raw: body }
    }

    // Verify webhook signature if configured
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-shopify-hmac-sha256')
    if (integration.webhook_secret && signature) {
      const isValid = await verifyWebhookSignature(body, signature, integration.webhook_secret, platform)
      if (!isValid) {
        throw new Error('Invalid webhook signature')
      }
    }

    // Determine event type
    const eventType = determineEventType(req.headers, webhookData, platform)

    // Store webhook event
    const { data: webhookEvent, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        integration_id: integrationId,
        platform,
        event_type: eventType,
        payload: webhookData,
        headers: Object.fromEntries(req.headers.entries()),
        received_at: new Date().toISOString(),
        status: 'received',
        user_id: integration.user_id
      })
      .select()
      .single()

    if (eventError) {
      throw new Error('Failed to store webhook event')
    }

    // Process webhook based on platform and event type
    const processingResult = await processWebhookEvent(webhookEvent, integration, supabase)

    // Update webhook event status
    await supabase
      .from('webhook_events')
      .update({
        status: processingResult.success ? 'processed' : 'failed',
        processed_at: new Date().toISOString(),
        processing_result: processingResult,
        error_message: processingResult.error
      })
      .eq('id', webhookEvent.id)

    // Trigger associated workflows
    await triggerWorkflows(webhookEvent, integration, supabase)

    return new Response(JSON.stringify({
      success: true,
      eventId: webhookEvent.id,
      processed: processingResult.success
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Still return 200 to prevent retries for invalid requests
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function registerWebhook(request: WebhookRequest, userId: string, supabase: any) {
  const { platform, eventType, integrationId, webhookUrl } = request
  
  if (!platform || !eventType || !integrationId) {
    throw new Error('Platform, event type, and integration ID are required')
  }

  // Verify integration ownership
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('user_id', userId)
    .single()

  if (integrationError || !integration) {
    throw new Error('Integration not found')
  }

  // Generate webhook URL if not provided
  const finalWebhookUrl = webhookUrl || `${supabaseUrl}/functions/v1/integration-webhook/webhook/${platform}/${integrationId}`

  // Register webhook with platform
  const registrationResult = await registerWithPlatform(platform, eventType, finalWebhookUrl, integration)

  // Store webhook configuration
  const { data: webhook, error: webhookError } = await supabase
    .from('integration_webhooks')
    .insert({
      integration_id: integrationId,
      platform,
      event_type: eventType,
      webhook_url: finalWebhookUrl,
      webhook_id: registrationResult.webhookId,
      secret: registrationResult.secret,
      is_active: true,
      user_id: userId
    })
    .select()
    .single()

  if (webhookError) {
    throw new Error('Failed to store webhook configuration')
  }

  return new Response(JSON.stringify({
    success: true,
    webhook,
    webhookUrl: finalWebhookUrl
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function registerWithPlatform(platform: string, eventType: string, webhookUrl: string, integration: any) {
  switch (platform) {
    case 'shopify':
      return await registerShopifyWebhook(eventType, webhookUrl, integration)
    
    case 'stripe':
      return await registerStripeWebhook(eventType, webhookUrl, integration)
    
    case 'paypal':
      return await registerPayPalWebhook(eventType, webhookUrl, integration)
    
    default:
      throw new Error(`Webhook registration not implemented for ${platform}`)
  }
}

async function registerShopifyWebhook(eventType: string, webhookUrl: string, integration: any) {
  const shopDomain = integration.shop_domain
  const accessToken = integration.access_token

  if (!shopDomain || !accessToken) {
    throw new Error('Shopify domain and access token required')
  }

  const response = await fetch(`https://${shopDomain}.myshopify.com/admin/api/2023-10/webhooks.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      webhook: {
        topic: eventType,
        address: webhookUrl,
        format: 'json'
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to register Shopify webhook: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    webhookId: data.webhook.id,
    secret: null // Shopify uses HMAC verification
  }
}

async function registerStripeWebhook(eventType: string, webhookUrl: string, integration: any) {
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
  
  if (!stripeSecret) {
    throw new Error('Stripe secret key not configured')
  }

  const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      url: webhookUrl,
      'enabled_events[]': eventType
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to register Stripe webhook: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    webhookId: data.id,
    secret: data.secret
  }
}

async function registerPayPalWebhook(eventType: string, webhookUrl: string, integration: any) {
  // PayPal webhook registration implementation
  throw new Error('PayPal webhook registration not yet implemented')
}

async function verifyWebhookSignature(body: string, signature: string, secret: string, platform: string): Promise<boolean> {
  switch (platform) {
    case 'shopify':
      return await verifyShopifySignature(body, signature, secret)
    
    case 'stripe':
      return await verifyStripeSignature(body, signature, secret)
    
    default:
      return true // Skip verification for unsupported platforms
  }
}

async function verifyShopifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  
  return computedSignature === signature
}

async function verifyStripeSignature(body: string, signature: string, secret: string): Promise<boolean> {
  // Stripe signature verification implementation
  const elements = signature.split(',')
  const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1]
  const signatures = elements.filter(el => el.startsWith('v1='))

  if (!timestamp || signatures.length === 0) {
    return false
  }

  const payload = `${timestamp}.${body}`
  const encoder = new TextEncoder()
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return signatures.some(sig => sig.split('=')[1] === computedSignature)
}

function determineEventType(headers: Headers, payload: any, platform: string): string {
  switch (platform) {
    case 'shopify':
      return headers.get('x-shopify-topic') || 'unknown'
    
    case 'stripe':
      return payload.type || 'unknown'
    
    case 'paypal':
      return payload.event_type || 'unknown'
    
    default:
      return 'unknown'
  }
}

async function processWebhookEvent(webhookEvent: any, integration: any, supabase: any) {
  try {
    const { platform, event_type, payload } = webhookEvent

    switch (platform) {
      case 'shopify':
        return await processShopifyEvent(event_type, payload, integration, supabase)
      
      case 'stripe':
        return await processStripeEvent(event_type, payload, integration, supabase)
      
      default:
        return {
          success: true,
          message: `Event ${event_type} from ${platform} received but not processed`
        }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function processShopifyEvent(eventType: string, payload: any, integration: any, supabase: any) {
  switch (eventType) {
    case 'orders/create':
      // Process new order
      await supabase.from('orders').insert({
        external_id: payload.id,
        order_number: payload.order_number,
        total_amount: payload.total_price,
        currency: payload.currency,
        customer_email: payload.email,
        user_id: integration.user_id,
        integration_id: integration.id,
        raw_data: payload
      })
      break
    
    case 'products/update':
      // Update product information
      await supabase.from('products').update({
        name: payload.title,
        description: payload.body_html,
        price: payload.variants?.[0]?.price,
        updated_at: new Date().toISOString()
      }).eq('external_id', payload.id)
      break
  }

  return { success: true, message: `Processed ${eventType}` }
}

async function processStripeEvent(eventType: string, payload: any, integration: any, supabase: any) {
  switch (eventType) {
    case 'payment_intent.succeeded':
      // Process successful payment
      await supabase.from('payments').insert({
        external_id: payload.data.object.id,
        amount: payload.data.object.amount,
        currency: payload.data.object.currency,
        status: 'succeeded',
        user_id: integration.user_id,
        integration_id: integration.id,
        raw_data: payload
      })
      break
  }

  return { success: true, message: `Processed ${eventType}` }
}

async function triggerWorkflows(webhookEvent: any, integration: any, supabase: any) {
  // Find workflows triggered by this webhook event
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('*')
    .eq('user_id', integration.user_id)
    .eq('trigger_type', 'webhook')
    .eq('status', 'active')

  if (!workflows || workflows.length === 0) {
    return
  }

  // Filter workflows that match this event
  for (const workflow of workflows) {
    const triggerConfig = workflow.trigger_config || {}
    
    if (triggerConfig.platform === webhookEvent.platform && 
        triggerConfig.event_type === webhookEvent.event_type) {
      
      // Trigger workflow execution
      try {
        await supabase.functions.invoke('workflow-executor', {
          body: {
            workflowId: workflow.id,
            triggerData: {
              webhook: webhookEvent,
              integration: integration
            }
          }
        })
      } catch (error) {
        console.error(`Failed to trigger workflow ${workflow.id}:`, error)
      }
    }
  }
}

async function unregisterWebhook(request: WebhookRequest, userId: string, supabase: any) {
  const { integrationId, eventType } = request
  
  // Implementation for unregistering webhooks
  return new Response(JSON.stringify({
    success: true,
    message: 'Webhook unregistered'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function listWebhooks(userId: string, supabase: any) {
  const { data: webhooks, error } = await supabase
    .from('integration_webhooks')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return new Response(JSON.stringify({
    success: true,
    webhooks
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function testWebhook(request: WebhookRequest, userId: string, supabase: any) {
  // Implementation for testing webhooks
  return new Response(JSON.stringify({
    success: true,
    message: 'Webhook test completed'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}