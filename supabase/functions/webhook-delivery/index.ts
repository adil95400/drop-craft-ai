import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * Webhook Delivery — Delivers webhook payloads to subscriber URLs with HMAC signing and retry
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { webhook_id, event_type, payload } = await req.json()

    if (!webhook_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'webhook_id and event_type required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get webhook subscription
    const { data: webhook, error: whError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('id', webhook_id)
      .eq('is_active', true)
      .single()

    if (whError || !webhook) {
      return new Response(
        JSON.stringify({ error: 'Webhook not found or inactive' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build delivery payload
    const deliveryPayload = JSON.stringify({
      event: event_type,
      timestamp: new Date().toISOString(),
      data: payload,
    })

    // Sign with HMAC
    const signature = webhook.secret
      ? await hmacSign(webhook.secret, deliveryPayload)
      : ''

    // Deliver with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let statusCode = 0
    let success = false
    let errorMsg = ''

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ShopOpti-Signature': signature,
          'X-ShopOpti-Event': event_type,
          'X-ShopOpti-Delivery': crypto.randomUUID(),
        },
        body: deliveryPayload,
        signal: controller.signal,
      })

      statusCode = response.status
      success = response.ok
    } catch (err) {
      errorMsg = (err as Error).message || 'Delivery failed'
    } finally {
      clearTimeout(timeout)
    }

    // Log delivery
    await supabase.from('webhook_delivery_logs').insert({
      subscription_id: webhook.id,
      event_type,
      payload: payload,
      status_code: statusCode,
      success,
      error_message: errorMsg || null,
      delivered_at: new Date().toISOString(),
    })

    // Update last_triggered_at
    await supabase
      .from('webhook_subscriptions')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', webhook.id)

    return new Response(
      JSON.stringify({ success, status_code: statusCode, error: errorMsg || undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook delivery error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
