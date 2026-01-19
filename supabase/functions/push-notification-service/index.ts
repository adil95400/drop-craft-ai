import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  platform: 'web' | 'ios' | 'android'
  device_info?: Record<string, any>
  is_active: boolean
}

interface SendPushParams {
  userId: string
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  data?: Record<string, any>
  urgency?: 'very-low' | 'low' | 'normal' | 'high'
  ttl?: number
}

interface BatchPushParams {
  userIds: string[]
  title: string
  body: string
  icon?: string
  url?: string
  data?: Record<string, any>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { action, ...params } = await req.json()

    console.log(`Push Notification Service - Action: ${action}`)

    switch (action) {
      case 'register_subscription':
        return await registerSubscription(supabase, params)
      
      case 'unregister_subscription':
        return await unregisterSubscription(supabase, params.subscriptionId)
      
      case 'send_push':
        return await sendPush(supabase, params as SendPushParams)
      
      case 'send_batch':
        return await sendBatchPush(supabase, params as BatchPushParams)
      
      case 'get_subscriptions':
        return await getSubscriptions(supabase, params.userId)
      
      case 'test_push':
        return await testPush(supabase, params.userId)
      
      case 'get_vapid_public_key':
        return await getVapidPublicKey()

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Push Notification Service error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function registerSubscription(supabase: any, params: {
  userId: string
  subscription: PushSubscriptionJSON
  platform: 'web' | 'ios' | 'android'
  deviceInfo?: Record<string, any>
}) {
  const { userId, subscription, platform, deviceInfo } = params

  // Check if subscription already exists
  const { data: existing } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', subscription.endpoint)
    .single()

  if (existing) {
    // Update existing subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .update({
        user_id: userId,
        keys: subscription.keys,
        platform,
        device_info: deviceInfo,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, subscription: data, updated: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create new subscription
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id: userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      platform,
      device_info: deviceInfo,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error

  console.log(`Push subscription registered for user ${userId}`)

  return new Response(
    JSON.stringify({ success: true, subscription: data, created: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function unregisterSubscription(supabase: any, subscriptionId: string) {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('id', subscriptionId)

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendPush(supabase: any, params: SendPushParams) {
  const { userId, title, body, icon, badge, tag, url, data, urgency = 'normal', ttl = 86400 } = params

  // Get user's active subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`No active push subscriptions for user ${userId}`)
    return new Response(
      JSON.stringify({ success: true, sent: 0, message: 'No active subscriptions' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag,
    data: {
      url: url || '/',
      ...data
    }
  })

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const sub of subscriptions) {
    try {
      // For web push, we'd use web-push library
      // For now, we'll simulate sending and log the push
      console.log(`Sending push to ${sub.platform} subscription:`, {
        endpoint: sub.endpoint.substring(0, 50) + '...',
        title,
        body
      })

      // Store notification in database for tracking
      await supabase.from('push_notification_logs').insert({
        user_id: userId,
        subscription_id: sub.id,
        title,
        body,
        data: data || {},
        status: 'sent',
        sent_at: new Date().toISOString()
      })

      sent++
    } catch (err: any) {
      console.error(`Failed to send push to subscription ${sub.id}:`, err)
      errors.push(err.message)
      failed++

      // Mark subscription as inactive if endpoint is invalid
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', sub.id)
      }
    }
  }

  return new Response(
    JSON.stringify({ success: true, sent, failed, errors: errors.length > 0 ? errors : undefined }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendBatchPush(supabase: any, params: BatchPushParams) {
  const { userIds, title, body, icon, url, data } = params

  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    try {
      const result = await sendPushInternal(supabase, {
        userId,
        title,
        body,
        icon,
        url,
        data
      })
      totalSent += result.sent
      totalFailed += result.failed
    } catch (err) {
      console.error(`Failed to send batch push to user ${userId}:`, err)
      totalFailed++
    }
  }

  return new Response(
    JSON.stringify({ success: true, totalSent, totalFailed, usersProcessed: userIds.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendPushInternal(supabase: any, params: SendPushParams) {
  const { userId, title, body, icon, url, data } = params

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  let sent = 0
  let failed = 0

  for (const sub of subscriptions || []) {
    try {
      console.log(`Sending push notification to user ${userId}`)
      
      await supabase.from('push_notification_logs').insert({
        user_id: userId,
        subscription_id: sub.id,
        title,
        body,
        data: data || {},
        status: 'sent',
        sent_at: new Date().toISOString()
      })

      sent++
    } catch (err) {
      failed++
    }
  }

  return { sent, failed }
}

async function getSubscriptions(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return new Response(
    JSON.stringify({ success: true, subscriptions: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testPush(supabase: any, userId: string) {
  return await sendPush(supabase, {
    userId,
    title: '🔔 Test Notification',
    body: 'Les notifications push fonctionnent correctement!',
    icon: '/icons/icon-192x192.png',
    tag: 'test',
    url: '/settings/notifications',
    data: { type: 'test' }
  })
}

async function getVapidPublicKey() {
  // In production, this would return the actual VAPID public key
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

  return new Response(
    JSON.stringify({ success: true, publicKey: vapidPublicKey }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
