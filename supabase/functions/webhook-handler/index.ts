import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-topic, x-shopify-hmac-sha256, x-webhook-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const body = await req.text()
    const contentType = req.headers.get('content-type') || ''
    
    // Detect webhook source
    const shopifyTopic = req.headers.get('x-shopify-topic')
    const webhookSignature = req.headers.get('x-webhook-signature')
    
    let parsedBody: any
    try {
      parsedBody = JSON.parse(body)
    } catch {
      parsedBody = body
    }

    let source = 'unknown'
    let eventType = 'webhook.received'
    
    if (shopifyTopic) {
      source = 'shopify'
      eventType = shopifyTopic
      console.log(`📨 Shopify webhook: ${shopifyTopic}`)
    } else if (webhookSignature) {
      source = 'internal'
      eventType = parsedBody.event || 'webhook.received'
      console.log(`📨 Internal webhook: ${eventType}`)
    }

    // Log webhook reception
    await supabase.from('webhook_delivery_logs').insert({
      event_type: eventType,
      payload: parsedBody,
      status: 'received',
      response_time_ms: 0
    })

    // Process webhook based on type
    let processingResult: any = { success: true, processed: true }

    if (shopifyTopic) {
      // Process Shopify webhooks
      switch (shopifyTopic) {
        case 'products/create':
        case 'products/update':
          processingResult.message = 'Product webhook processed'
          break
        case 'orders/create':
        case 'orders/updated':
          processingResult.message = 'Order webhook processed'
          break
        default:
          processingResult.message = `Webhook ${shopifyTopic} received`
      }
    }

    console.log('✅ Webhook processed successfully:', eventType)

    return new Response(
      JSON.stringify(processingResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})