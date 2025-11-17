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
    const shopifyShopDomain = req.headers.get('x-shopify-shop-domain')
    const shopifyHmac = req.headers.get('x-shopify-hmac-sha256')
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
      console.log(`📨 Shopify webhook: ${shopifyTopic} from ${shopifyShopDomain}`)
      
      // Verify Shopify webhook signature using global secret
      if (shopifyHmac && shopifyShopDomain) {
        const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET')
        if (!webhookSecret) {
          console.error('❌ SHOPIFY_WEBHOOK_SECRET not configured')
          return new Response(
            JSON.stringify({ success: false, error: 'Webhook verification not configured' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            }
          )
        }

        const isValid = await verifyShopifyWebhook(webhookSecret, body, shopifyHmac)
        if (!isValid) {
          console.error('❌ Invalid Shopify webhook signature')
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid signature' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401,
            }
          )
        }
        console.log('✅ Shopify webhook signature verified')
      } else {
        console.warn('⚠️ Shopify webhook received without signature headers')
      }
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

async function verifyShopifyWebhook(
  secret: string,
  body: string,
  hmacHeader: string
): Promise<boolean> {
  try {
    // Create HMAC-SHA256 hash
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    )

    // Convert to base64 for comparison
    const hashArray = Array.from(new Uint8Array(signature))
    const hashBase64 = btoa(String.fromCharCode(...hashArray))

    const isValid = hashBase64 === hmacHeader
    
    if (!isValid) {
      console.error('❌ HMAC verification failed', {
        expected: hmacHeader,
        computed: hashBase64
      })
    }

    return isValid
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error)
    return false
  }
}