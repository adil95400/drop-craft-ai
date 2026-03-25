/**
 * inbound-webhook — Receives marketplace webhook notifications in real-time
 * Public endpoint (no JWT) — validates via HMAC signature or secret key
 * 
 * URL pattern: /inbound-webhook?endpoint_id=<uuid>
 * Or: /inbound-webhook/<endpoint_id>
 */
import { createClient } from 'npm:@supabase/supabase-js@2
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-webhook-signature, x-shopify-hmac-sha256, x-wc-webhook-signature',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function verifyHmac(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signed)))
    return signature === expectedSig
  } catch {
    return false
  }
}

function detectEventType(platform: string, headers: Record<string, string>, body: Record<string, unknown>): string {
  switch (platform) {
    case 'shopify':
      return headers['x-shopify-topic'] || body?.topic as string || 'unknown'
    case 'woocommerce':
      return headers['x-wc-webhook-topic'] || body?.action as string || 'unknown'
    case 'amazon':
      return body?.NotificationType as string || body?.eventType as string || 'unknown'
    case 'ebay':
      return body?.metadata?.topic as string || 'unknown'
    default:
      return body?.event_type as string || body?.type as string || body?.event as string || 'generic'
  }
}

function getSignature(platform: string, headers: Record<string, string>): string | null {
  switch (platform) {
    case 'shopify':
      return headers['x-shopify-hmac-sha256'] || null
    case 'woocommerce':
      return headers['x-wc-webhook-signature'] || null
    default:
      return headers['x-webhook-signature'] || null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Extract endpoint_id from query params or path
    let endpointId = url.searchParams.get('endpoint_id')
    if (!endpointId) {
      const pathParts = url.pathname.split('/').filter(Boolean)
      endpointId = pathParts[pathParts.length - 1]
      // If it's the function name itself, no endpoint
      if (endpointId === 'inbound-webhook') endpointId = null
    }

    if (!endpointId) {
      return jsonResponse({ error: 'Missing endpoint_id parameter' }, 400)
    }

    // Parse body
    const rawBody = await req.text()
    let body: Record<string, unknown> = {}
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = { raw: rawBody }
    }

    // Collect headers
    const headersObj: Record<string, string> = {}
    req.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v })

    // Service role client for DB operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find endpoint
    const { data: endpoint, error: epErr } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', endpointId)
      .eq('is_active', true)
      .single()

    if (epErr || !endpoint) {
      return jsonResponse({ error: 'Webhook endpoint not found or inactive' }, 404)
    }

    // Verify signature if present
    const signature = getSignature(endpoint.platform, headersObj)
    if (signature) {
      const valid = await verifyHmac(rawBody, signature, endpoint.secret_key)
      if (!valid) {
        // Log failed attempt
        await supabase.from('webhook_events').insert({
          endpoint_id: endpointId,
          user_id: endpoint.user_id,
          platform: endpoint.platform,
          event_type: 'signature_failed',
          payload: { error: 'Invalid HMAC signature' },
          headers: headersObj,
          status: 'failed',
          error_message: 'HMAC signature verification failed',
        })
        return jsonResponse({ error: 'Invalid signature' }, 401)
      }
    }

    // Detect event type
    const eventType = detectEventType(endpoint.platform, headersObj, body)

    // Store webhook event
    const { data: event, error: insertErr } = await supabase
      .from('webhook_events')
      .insert({
        endpoint_id: endpointId,
        user_id: endpoint.user_id,
        platform: endpoint.platform,
        event_type: eventType,
        payload: body,
        headers: headersObj,
        status: 'received',
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Failed to store webhook event:', insertErr)
      return jsonResponse({ error: 'Failed to store event' }, 500)
    }

    // Update endpoint stats
    await supabase
      .from('webhook_endpoints')
      .update({
        last_triggered_at: new Date().toISOString(),
        trigger_count: (endpoint.trigger_count || 0) + 1,
      })
      .eq('id', endpointId)

    // Process event based on type (async, non-blocking)
    processEvent(supabase, endpoint, eventType, body, event.id).catch(err =>
      console.error('Background processing failed:', err)
    )

    return jsonResponse({ 
      received: true, 
      event_id: event.id,
      event_type: eventType,
    })

  } catch (err) {
    console.error('Webhook handler error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

async function processEvent(
  supabase: any,
  endpoint: any,
  eventType: string,
  payload: Record<string, unknown>,
  eventId: string
) {
  try {
    await supabase
      .from('webhook_events')
      .update({ status: 'processing' })
      .eq('id', eventId)

    // Route to appropriate handler
    switch (endpoint.platform) {
      case 'shopify':
        await processShopifyEvent(supabase, endpoint.user_id, eventType, payload)
        break
      case 'woocommerce':
        await processWooCommerceEvent(supabase, endpoint.user_id, eventType, payload)
        break
      default:
        // Generic: just store and mark processed
        break
    }

    await supabase
      .from('webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', eventId)

  } catch (err) {
    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', eventId)
  }
}

async function processShopifyEvent(supabase: any, userId: string, eventType: string, payload: any) {
  switch (eventType) {
    case 'orders/create':
    case 'orders/updated':
      // Sync order to local orders table
      if (payload?.id) {
        await supabase.from('orders').upsert({
          user_id: userId,
          external_id: String(payload.id),
          external_platform: 'shopify',
          status: payload.financial_status || 'pending',
          total_amount: parseFloat(payload.total_price || '0'),
          currency: payload.currency || 'EUR',
          customer_email: payload.email,
          customer_name: `${payload.customer?.first_name || ''} ${payload.customer?.last_name || ''}`.trim(),
          raw_data: payload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'external_id,external_platform' })
      }
      break

    case 'products/update':
      // Queue product sync
      await supabase.from('unified_sync_queue').insert({
        user_id: userId,
        entity_type: 'product',
        entity_id: String(payload.id),
        action: 'update',
        platform: 'shopify',
        payload,
        status: 'pending',
      })
      break

    case 'inventory_levels/update':
      // Update stock via sync queue
      if (payload?.inventory_item_id) {
        await supabase.from('unified_sync_queue').insert({
          user_id: userId,
          entity_type: 'inventory',
          entity_id: String(payload.inventory_item_id),
          action: 'update',
          platform: 'shopify',
          payload: { available: payload.available },
          status: 'pending',
        })
      }
      break
  }
}

async function processWooCommerceEvent(supabase: any, userId: string, eventType: string, payload: any) {
  switch (eventType) {
    case 'order.created':
    case 'order.updated':
      if (payload?.id) {
        await supabase.from('orders').upsert({
          user_id: userId,
          external_id: String(payload.id),
          external_platform: 'woocommerce',
          status: payload.status || 'pending',
          total_amount: parseFloat(payload.total || '0'),
          currency: payload.currency || 'EUR',
          customer_email: payload.billing?.email,
          customer_name: `${payload.billing?.first_name || ''} ${payload.billing?.last_name || ''}`.trim(),
          raw_data: payload,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'external_id,external_platform' })
      }
      break

    case 'product.updated':
      await supabase.from('unified_sync_queue').insert({
        user_id: userId,
        entity_type: 'product',
        entity_id: String(payload.id),
        action: 'update',
        platform: 'woocommerce',
        payload,
        status: 'pending',
      })
      break
  }
}
