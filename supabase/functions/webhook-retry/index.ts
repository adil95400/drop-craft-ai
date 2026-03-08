/**
 * webhook-retry — Retries failed webhook events with exponential backoff
 * Called by pg_cron every 2 minutes
 * 
 * Backoff schedule: 30s, 2m, 8m, 32m, 2h (base=30s, multiplier=4)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const MAX_RETRIES = 5
const BASE_DELAY_SECONDS = 30
const BACKOFF_MULTIPLIER = 4

function calculateNextRetry(retryCount: number): Date {
  const delaySeconds = BASE_DELAY_SECONDS * Math.pow(BACKOFF_MULTIPLIER, retryCount)
  return new Date(Date.now() + delaySeconds * 1000)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // Find failed events eligible for retry
    const { data: failedEvents, error: fetchErr } = await supabase
      .from('webhook_events')
      .select('id, endpoint_id, user_id, platform, event_type, payload, headers, retry_count, max_retries')
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRIES)
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(20)

    if (fetchErr) throw fetchErr

    if (!failedEvents || failedEvents.length === 0) {
      return new Response(JSON.stringify({ retried: 0, message: 'No events to retry' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let successCount = 0
    let failCount = 0
    let permanentFailCount = 0

    for (const event of failedEvents) {
      const newRetryCount = (event.retry_count || 0) + 1

      try {
        // Mark as processing
        await supabase
          .from('webhook_events')
          .update({ status: 'processing', retry_count: newRetryCount })
          .eq('id', event.id)

        // Fetch endpoint to get platform-specific processing info
        const { data: endpoint } = await supabase
          .from('webhook_endpoints')
          .select('*')
          .eq('id', event.endpoint_id)
          .single()

        if (!endpoint || !endpoint.is_active) {
          // Endpoint deleted or disabled — mark permanently failed
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: 'Endpoint inactive or deleted — retry abandoned',
              next_retry_at: null,
              retry_count: newRetryCount,
            })
            .eq('id', event.id)
          permanentFailCount++
          continue
        }

        // Re-process the event
        await reprocessEvent(supabase, endpoint, event.event_type, event.payload || {})

        // Success — mark processed
        await supabase
          .from('webhook_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
            next_retry_at: null,
            retry_count: newRetryCount,
            error_message: null,
          })
          .eq('id', event.id)

        successCount++
      } catch (err) {
        // Still failing — schedule next retry or mark permanently failed
        if (newRetryCount >= MAX_RETRIES) {
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: `Max retries (${MAX_RETRIES}) exceeded. Last error: ${String(err)}`,
              next_retry_at: null,
              retry_count: newRetryCount,
            })
            .eq('id', event.id)
          permanentFailCount++
        } else {
          const nextRetry = calculateNextRetry(newRetryCount)
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: `Retry ${newRetryCount}/${MAX_RETRIES} failed: ${String(err)}`,
              next_retry_at: nextRetry.toISOString(),
              retry_count: newRetryCount,
            })
            .eq('id', event.id)
          failCount++
        }
      }
    }

    return new Response(
      JSON.stringify({
        retried: failedEvents.length,
        success: successCount,
        scheduled_retry: failCount,
        permanently_failed: permanentFailCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Webhook retry error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Re-process a webhook event (same logic as inbound-webhook processEvent)
 */
async function reprocessEvent(supabase: any, endpoint: any, eventType: string, payload: Record<string, unknown>) {
  switch (endpoint.platform) {
    case 'shopify':
      await processShopifyEvent(supabase, endpoint.user_id, eventType, payload)
      break
    case 'woocommerce':
      await processWooCommerceEvent(supabase, endpoint.user_id, eventType, payload)
      break
    default:
      // Generic — nothing to reprocess, just mark as done
      break
  }
}

async function processShopifyEvent(supabase: any, userId: string, eventType: string, payload: any) {
  switch (eventType) {
    case 'orders/create':
    case 'orders/updated':
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
