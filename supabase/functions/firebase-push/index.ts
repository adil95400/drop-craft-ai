/**
 * Firebase Cloud Messaging (FCM) Push Notification Edge Function
 * Uses Firebase Admin SDK service account for HTTP v1 API
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ─── Firebase Auth ───────────────────────────────────────────────
async function getFirebaseAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT not configured')

  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)

  // Build JWT header + claims
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  }

  const enc = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsignedToken = `${enc(header)}.${enc(claims)}`

  // Import private key and sign
  const pemBody = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  )
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${unsignedToken}.${signature}`

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`Failed to get Firebase access token: ${err}`)
  }

  const { access_token } = await tokenRes.json()
  return access_token
}

// ─── FCM Send ────────────────────────────────────────────────────
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  notification: { title: string; body: string; image?: string },
  data?: Record<string, string>,
  webpushLink?: string
) {
  const message: any = {
    token: fcmToken,
    notification,
    data: data || {},
  }

  // Add webpush config for click action
  if (webpushLink) {
    message.webpush = {
      fcm_options: { link: webpushLink },
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      },
    }
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  )

  if (!res.ok) {
    const errBody = await res.text()
    const status = res.status
    return { success: false, status, error: errBody }
  }

  const result = await res.json()
  return { success: true, messageId: result.name }
}

// ─── Main Handler ────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, ...params } = await req.json()

    console.log(`[firebase-push] Action: ${action}`)

    switch (action) {
      // ── Register FCM token ──
      case 'register_token': {
        const { userId, fcmToken, platform = 'web', deviceInfo = {} } = params

        // Upsert: update if same token exists, insert otherwise
        const { data: existing } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('endpoint', fcmToken)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('push_subscriptions')
            .update({ user_id: userId, platform, device_info: deviceInfo, is_active: true, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('push_subscriptions')
            .insert({ user_id: userId, endpoint: fcmToken, keys: {}, platform, device_info: deviceInfo, is_active: true })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ── Send push to a single user ──
      case 'send_push': {
        const { userId, title, body, image, url, data } = params

        // Fetch active FCM tokens for user
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint')
          .eq('user_id', userId)
          .eq('is_active', true)

        if (!subs || subs.length === 0) {
          return new Response(JSON.stringify({ success: true, sent: 0, message: 'No active tokens' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
        const accessToken = await getFirebaseAccessToken()
        let sent = 0, failed = 0
        const staleIds: string[] = []

        for (const sub of subs) {
          const result = await sendFCMNotification(
            accessToken, sa.project_id, sub.endpoint,
            { title, body, image },
            data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
            url
          )

          if (result.success) {
            sent++
          } else {
            failed++
            // Token expired or invalid → mark inactive
            if (result.status === 404 || result.status === 410 || result.error?.includes('NOT_FOUND') || result.error?.includes('UNREGISTERED')) {
              staleIds.push(sub.id)
            }
          }
        }

        // Cleanup stale tokens
        if (staleIds.length > 0) {
          await supabase.from('push_subscriptions').update({ is_active: false }).in('id', staleIds)
        }

        // Log
        await supabase.from('push_notification_logs').insert({
          user_id: userId, title, body, data: data || {}, status: sent > 0 ? 'sent' : 'failed', sent_at: new Date().toISOString(),
        }).catch(() => {}) // best-effort logging

        return new Response(JSON.stringify({ success: true, sent, failed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ── Batch push to multiple users ──
      case 'send_batch': {
        const { userIds, title, body, image, url, data } = params
        const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
        const accessToken = await getFirebaseAccessToken()

        let totalSent = 0, totalFailed = 0

        for (const uid of userIds) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint')
            .eq('user_id', uid)
            .eq('is_active', true)

          for (const sub of subs || []) {
            const result = await sendFCMNotification(
              accessToken, sa.project_id, sub.endpoint,
              { title, body, image },
              data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
              url
            )
            result.success ? totalSent++ : totalFailed++
          }
        }

        return new Response(JSON.stringify({ success: true, totalSent, totalFailed }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ── Test push ──
      case 'test_push': {
        const { userId } = params
        const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!)
        const accessToken = await getFirebaseAccessToken()

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('id, endpoint')
          .eq('user_id', userId)
          .eq('is_active', true)

        if (!subs || subs.length === 0) {
          return new Response(JSON.stringify({ success: true, sent: 0, message: 'Aucun abonnement actif' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        let sent = 0
        for (const sub of subs) {
          const result = await sendFCMNotification(
            accessToken, sa.project_id, sub.endpoint,
            { title: '🔔 Test Notification', body: 'Les notifications push FCM fonctionnent!' },
            { type: 'test' },
            '/settings/notifications'
          )
          if (result.success) sent++
        }

        return new Response(JSON.stringify({ success: true, sent }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('[firebase-push] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
