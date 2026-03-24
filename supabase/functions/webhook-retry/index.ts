import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const MAX_RETRIES = 5

    // Fetch failed webhook events eligible for retry
    const { data: failedEvents, error: fetchError } = await supabase
      .from('webhook_events')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(20)

    if (fetchError) throw fetchError

    if (!failedEvents || failedEvents.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No failed events to retry', retried: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[webhook-retry] Found ${failedEvents.length} failed events to retry`)

    let retried = 0
    let succeeded = 0
    let permanentlyFailed = 0
    const results: Array<{ id: string; status: string; attempt: number }> = []

    for (const event of failedEvents) {
      const retryCount = (event.retry_count || 0) + 1

      // Exponential backoff check: 2^retry * 30s minimum delay since last attempt
      const backoffMs = Math.pow(2, event.retry_count || 0) * 30_000
      const lastAttempt = event.processed_at || event.created_at
      const nextRetryAt = new Date(new Date(lastAttempt).getTime() + backoffMs)

      if (new Date() < nextRetryAt) {
        // Not yet time to retry
        continue
      }

      retried++

      try {
        // Look up the endpoint URL for this webhook
        const { data: endpoint } = await supabase
          .from('webhook_endpoints')
          .select('url, secret')
          .eq('id', event.endpoint_id)
          .single()

        if (!endpoint?.url) {
          // Mark as permanently failed if no endpoint found
          await supabase
            .from('webhook_events')
            .update({
              status: 'permanently_failed',
              error_message: 'Endpoint not found or deleted',
              retry_count: retryCount,
              processed_at: new Date().toISOString(),
            })
            .eq('id', event.id)

          permanentlyFailed++
          results.push({ id: event.id, status: 'permanently_failed', attempt: retryCount })
          continue
        }

        // Attempt delivery
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Retry': retryCount.toString(),
            'X-Webhook-Event-Id': event.id,
          },
          body: JSON.stringify(event.payload || {}),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.ok) {
          // Success — mark as delivered
          await supabase
            .from('webhook_events')
            .update({
              status: 'delivered',
              retry_count: retryCount,
              processed_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', event.id)

          succeeded++
          results.push({ id: event.id, status: 'delivered', attempt: retryCount })
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed'

          await supabase
            .from('webhook_events')
            .update({
              status: newStatus,
              retry_count: retryCount,
              processed_at: new Date().toISOString(),
              error_message: `HTTP ${response.status}: ${errorText.slice(0, 500)}`,
            })
            .eq('id', event.id)

          if (newStatus === 'permanently_failed') permanentlyFailed++
          results.push({ id: event.id, status: newStatus, attempt: retryCount })
        }
      } catch (deliveryError) {
        const errMsg = deliveryError instanceof Error ? deliveryError.message : 'Unknown delivery error'
        const newStatus = retryCount >= MAX_RETRIES ? 'permanently_failed' : 'failed'

        await supabase
          .from('webhook_events')
          .update({
            status: newStatus,
            retry_count: retryCount,
            processed_at: new Date().toISOString(),
            error_message: errMsg.slice(0, 500),
          })
          .eq('id', event.id)

        if (newStatus === 'permanently_failed') permanentlyFailed++
        results.push({ id: event.id, status: newStatus, attempt: retryCount })
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'webhook_retry_cycle',
      entity_type: 'webhook',
      description: `Retried ${retried} webhooks: ${succeeded} delivered, ${permanentlyFailed} permanently failed`,
      source: 'automation',
      severity: permanentlyFailed > 0 ? 'warn' : 'info',
      details: { retried, succeeded, permanentlyFailed, results },
    })

    console.log(`[webhook-retry] Done: ${retried} retried, ${succeeded} succeeded, ${permanentlyFailed} permanently failed`)

    return new Response(
      JSON.stringify({ success: true, retried, succeeded, permanentlyFailed, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[webhook-retry] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
