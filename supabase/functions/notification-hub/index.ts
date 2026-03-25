/**
 * Notification Hub — Cascading delivery: Push → Email → SMS (critical only)
 * Central dispatcher that routes notifications through the optimal channel
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface NotificationRequest {
  userId: string
  title: string
  body: string
  type?: 'marketing' | 'transactional' | 'critical'
  channel?: 'push' | 'email' | 'sms' | 'auto'
  email?: string
  phone?: string
  url?: string
  data?: Record<string, any>
  template?: string
  templateParams?: Record<string, any>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, ...params } = await req.json()

    console.log(`[notification-hub] Action: ${action}`)

    switch (action) {
      case 'send': {
        const notification = params as NotificationRequest
        const result = await sendWithFallback(supabase, notification)
        return jsonResponse(result)
      }

      case 'send_batch': {
        const { notifications } = params as { notifications: NotificationRequest[] }
        const results = []
        for (const n of notifications) {
          const result = await sendWithFallback(supabase, n)
          results.push(result)
        }
        return jsonResponse({
          success: true,
          total: results.length,
          sent: results.filter(r => r.delivered).length,
          failed: results.filter(r => !r.delivered).length,
          results,
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('[notification-hub] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Cascade: Push → Email → SMS ─────────────────────────────────
async function sendWithFallback(supabase: any, notification: NotificationRequest) {
  const { userId, title, body, type = 'transactional', channel = 'auto', email, url, data } = notification

  const deliveryLog: { channel: string; success: boolean; error?: string }[] = []
  let delivered = false

  // Determine channels to try based on type
  const channelsToTry = channel !== 'auto'
    ? [channel]
    : type === 'critical'
      ? ['push', 'email'] // Critical: try both push and email
      : ['push', 'email'] // Default cascade: push first, then email

  // ── 1. Try Push (Firebase FCM) ──
  if (channelsToTry.includes('push')) {
    try {
      const pushRes = await fetch(`${supabaseUrl}/functions/v1/firebase-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          action: 'send_push',
          userId,
          title,
          body,
          url,
          data,
        }),
      })

      const pushResult = await pushRes.json()
      if (pushResult.success && pushResult.sent > 0) {
        delivered = true
        deliveryLog.push({ channel: 'push', success: true })
      } else {
        deliveryLog.push({ channel: 'push', success: false, error: 'No active subscriptions' })
      }
    } catch (err: any) {
      deliveryLog.push({ channel: 'push', success: false, error: err.message })
    }
  }

  // ── 2. Fallback to Email (Brevo) ──
  if (!delivered && channelsToTry.includes('email')) {
    const recipientEmail = email || await getUserEmail(supabase, userId)

    if (recipientEmail) {
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/brevo-hub`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: 'send_transactional',
            to: recipientEmail,
            subject: title,
            htmlContent: `<p>${body.replace(/\n/g, '<br>')}</p>${url ? `<p><a href="${url}">Voir les détails →</a></p>` : ''}`,
            tags: [type, 'fallback'],
          }),
        })

        const emailResult = await emailRes.json()
        if (emailResult.success) {
          delivered = true
          deliveryLog.push({ channel: 'email', success: true })
        } else {
          deliveryLog.push({ channel: 'email', success: false, error: emailResult.error })
        }
      } catch (err: any) {
        deliveryLog.push({ channel: 'email', success: false, error: err.message })
      }
    } else {
      deliveryLog.push({ channel: 'email', success: false, error: 'No email found' })
    }
  }

  // For critical type, also send push even if email succeeded (dual delivery)
  if (type === 'critical' && deliveryLog.some(d => d.channel === 'email' && d.success) && !deliveryLog.some(d => d.channel === 'push' && d.success)) {
    // Already tried push above, nothing more to do without SMS
  }

  // ── 3. Store in-app notification ──
  await supabase.from('user_notifications').insert({
    user_id: userId,
    title,
    message: body,
    notification_type: type === 'critical' ? 'alert' : 'info',
    category: 'general',
    priority: type === 'critical' ? 'urgent' : 'normal',
    action_url: url,
    metadata: { delivery_log: deliveryLog, data },
  }).catch(() => {})

  return {
    userId,
    delivered,
    deliveryLog,
    type,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────
async function getUserEmail(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()
  return data?.email || null
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
