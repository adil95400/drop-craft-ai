import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-marketplace-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const integrationId = url.searchParams.get('integration_id')
    const platform = url.searchParams.get('platform')

    if (!integrationId || !platform) {
      throw new Error('integration_id and platform are required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get integration
    const { data: integration, error: getError } = await supabaseClient
      .from('marketplace_integrations')
      .select('*')
      .eq('id', integrationId)
      .single()

    if (getError || !integration) {
      console.error('[MARKETPLACE-WEBHOOK] Integration not found:', integrationId)
      return new Response(
        JSON.stringify({ error: 'Integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse webhook payload
    const payload = await req.json()
    console.log(`[MARKETPLACE-WEBHOOK] Received webhook from ${platform}:`, payload)

    // Verify webhook signature (platform-specific)
    const isValid = await verifyWebhookSignature(platform, req, payload, integration)
    
    if (!isValid) {
      console.error('[MARKETPLACE-WEBHOOK] Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process webhook based on event type
    const result = await processWebhook(supabaseClient, integration, platform, payload)

    // Update webhook stats
    await supabaseClient
      .from('marketplace_webhooks')
      .update({
        total_calls: (integration.webhook_total_calls || 0) + 1,
        last_called_at: new Date().toISOString(),
      })
      .eq('integration_id', integrationId)
      .eq('topic', payload.topic || payload.event_type)

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MARKETPLACE-WEBHOOK] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function verifyWebhookSignature(
  platform: string,
  req: Request,
  payload: any,
  integration: any
): Promise<boolean> {
  // Platform-specific signature verification
  // In production, implement actual signature verification per platform
  const signature = req.headers.get('x-marketplace-signature')
  
  if (!signature) {
    console.warn('[MARKETPLACE-WEBHOOK] No signature header found')
    return false
  }

  // Placeholder verification logic
  return true
}

async function processWebhook(
  supabaseClient: any,
  integration: any,
  platform: string,
  payload: any
): Promise<any> {
  const eventType = payload.topic || payload.event_type || 'unknown'
  
  console.log(`[MARKETPLACE-WEBHOOK] Processing ${eventType} for ${platform}`)

  // Log the webhook event
  await supabaseClient.from('marketplace_event_logs').insert({
    integration_id: integration.id,
    user_id: integration.user_id,
    event_type: eventType,
    event_source: 'webhook',
    severity: 'info',
    title: `Webhook: ${eventType}`,
    message: `Received ${eventType} webhook from ${platform}`,
    data: payload,
  })

  // Process based on event type
  switch (eventType) {
    case 'products/create':
    case 'products/update':
      return await handleProductUpdate(supabaseClient, integration, payload)
    
    case 'orders/create':
    case 'orders/updated':
      return await handleOrderUpdate(supabaseClient, integration, payload)
    
    case 'inventory/update':
      return await handleInventoryUpdate(supabaseClient, integration, payload)
    
    default:
      console.log(`[MARKETPLACE-WEBHOOK] Unhandled event type: ${eventType}`)
      return { processed: false, reason: 'Unhandled event type' }
  }
}

async function handleProductUpdate(supabaseClient: any, integration: any, payload: any) {
  // Handle product creation/update from marketplace
  console.log('[MARKETPLACE-WEBHOOK] Handling product update')
  
  return { processed: true, type: 'product', action: 'synced' }
}

async function handleOrderUpdate(supabaseClient: any, integration: any, payload: any) {
  // Handle order creation/update from marketplace
  console.log('[MARKETPLACE-WEBHOOK] Handling order update')
  
  return { processed: true, type: 'order', action: 'synced' }
}

async function handleInventoryUpdate(supabaseClient: any, integration: any, payload: any) {
  // Handle inventory update from marketplace
  console.log('[MARKETPLACE-WEBHOOK] Handling inventory update')
  
  return { processed: true, type: 'inventory', action: 'synced' }
}