import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateSignature(secret: string, payload: string): Promise<string> {
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
    encoder.encode(payload)
  )
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function deliverWebhook(
  webhookUrl: string,
  secret: string,
  eventType: string,
  payload: any,
  attemptNumber: number = 1
): Promise<{ success: boolean; statusCode?: number; error?: string; responseTime: number }> {
  const startTime = Date.now()
  
  try {
    const payloadString = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload
    })

    const signature = await generateSignature(secret, payloadString)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'X-Webhook-Attempt': attemptNumber.toString(),
        'User-Agent': 'DropCraft-Webhook/1.0'
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000) // 30s timeout
    })

    const responseTime = Date.now() - startTime

    if (response.ok) {
      return { success: true, statusCode: response.status, responseTime }
    } else {
      const errorText = await response.text().catch(() => 'Unknown error')
      return { 
        success: false, 
        statusCode: response.status, 
        error: `HTTP ${response.status}: ${errorText}`,
        responseTime 
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return { 
      success: false, 
      error: error.message || 'Network error',
      responseTime 
    }
  }
}

async function logDelivery(
  supabase: any,
  webhookId: string,
  eventType: string,
  payload: any,
  success: boolean,
  statusCode: number | undefined,
  error: string | undefined,
  responseTime: number,
  attemptNumber: number
) {
  await supabase.from('webhook_delivery_logs').insert({
    webhook_id: webhookId,
    event_type: eventType,
    payload,
    status: success ? 'delivered' : 'failed',
    status_code: statusCode,
    error_message: error,
    response_time_ms: responseTime,
    attempt_number: attemptNumber
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { webhook_id, event_type, payload } = await req.json()

    // Get webhook details
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('id', webhook_id)
      .single()

    if (webhookError || !webhook) {
      console.error('Webhook not found:', webhook_id)
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhook.is_active) {
      console.log('Webhook is inactive:', webhook_id)
      return new Response(
        JSON.stringify({ error: 'Webhook is inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deliver webhook with retry logic
    const maxAttempts = 3
    let result: any
    let attemptNumber = 1

    for (attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
      result = await deliverWebhook(
        webhook.url,
        webhook.secret,
        event_type,
        payload,
        attemptNumber
      )

      // Log delivery attempt
      await logDelivery(
        supabase,
        webhook_id,
        event_type,
        payload,
        result.success,
        result.statusCode,
        result.error,
        result.responseTime,
        attemptNumber
      )

      if (result.success) {
        // Update webhook stats
        await supabase
          .from('webhook_subscriptions')
          .update({
            last_delivery_at: new Date().toISOString(),
            delivery_count: (webhook.delivery_count || 0) + 1,
            success_count: (webhook.success_count || 0) + 1
          })
          .eq('id', webhook_id)

        break
      }

      // Wait before retry (exponential backoff)
      if (attemptNumber < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attemptNumber) * 1000))
      }
    }

    if (!result.success) {
      // Update failure count
      await supabase
        .from('webhook_subscriptions')
        .update({
          failure_count: (webhook.failure_count || 0) + 1
        })
        .eq('id', webhook_id)

      // Disable webhook if too many failures
      const totalFailures = (webhook.failure_count || 0) + 1
      if (totalFailures >= 10) {
        await supabase
          .from('webhook_subscriptions')
          .update({ is_active: false })
          .eq('id', webhook_id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: result.success,
        attempts: attemptNumber,
        message: result.success ? 'Webhook delivered successfully' : 'Webhook delivery failed',
        details: result
      }),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook delivery error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
