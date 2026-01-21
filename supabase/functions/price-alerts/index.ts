import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceAlert {
  type: 'price_drop' | 'price_increase' | 'target_reached'
  product: {
    id: string
    title: string
    url: string
    currentPrice: number
    image?: string
  }
  oldPrice?: number
  newPrice?: number
  change?: number
  targetPrice?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    let userId: string

    // Support both JWT and extension tokens
    if (token.startsWith('ext_')) {
      const { data: session } = await supabase
        .from('extension_sessions')
        .select('user_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()
      
      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Invalid extension token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = session.user_id
    } else {
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = user.id
    }

    const { alerts } = await req.json() as { alerts: PriceAlert[] }

    if (!alerts || !Array.isArray(alerts)) {
      return new Response(
        JSON.stringify({ error: 'Invalid alerts data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${alerts.length} price alerts for user ${userId}`)

    // Store alerts in database
    const alertRecords = alerts.map(alert => ({
      user_id: userId,
      alert_type: `price_${alert.type}`,
      title: getAlertTitle(alert),
      message: getAlertMessage(alert),
      metadata: {
        product_id: alert.product.id,
        product_title: alert.product.title,
        product_url: alert.product.url,
        product_image: alert.product.image,
        old_price: alert.oldPrice,
        new_price: alert.newPrice || alert.product.currentPrice,
        change_percent: alert.change,
        target_price: alert.targetPrice
      },
      severity: alert.type === 'price_drop' ? 'info' : alert.type === 'target_reached' ? 'success' : 'warning',
      status: 'active'
    }))

    const { error: insertError } = await supabase
      .from('active_alerts')
      .insert(alertRecords)

    if (insertError) {
      console.error('Failed to store alerts:', insertError)
    }

    // Get user's notification preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, notification_preferences')
      .eq('id', userId)
      .single()

    const notificationChannels: string[] = []

    // Send email notifications if enabled
    if (profile?.notification_preferences?.price_alerts_email !== false && profile?.email) {
      try {
        await sendEmailNotifications(alerts, profile.email)
        notificationChannels.push('email')
      } catch (error) {
        console.error('Failed to send email notifications:', error)
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'price_alerts_received',
      entity_type: 'price_alert',
      description: `${alerts.length} alertes de prix reçues`,
      details: {
        alert_count: alerts.length,
        types: alerts.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        channels: notificationChannels
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: alerts.length,
        notifications: notificationChannels
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Price alerts error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getAlertTitle(alert: PriceAlert): string {
  switch (alert.type) {
    case 'price_drop':
      return '📉 Prix en baisse!'
    case 'price_increase':
      return '📈 Prix en hausse!'
    case 'target_reached':
      return '🎯 Prix cible atteint!'
    default:
      return 'Alerte de prix'
  }
}

function getAlertMessage(alert: PriceAlert): string {
  const productName = alert.product.title.length > 50 
    ? alert.product.title.substring(0, 47) + '...'
    : alert.product.title

  if (alert.type === 'target_reached') {
    return `${productName}: ${alert.product.currentPrice}€ (cible: ${alert.targetPrice}€)`
  }

  const changeStr = alert.change 
    ? ` (${alert.change > 0 ? '+' : ''}${alert.change.toFixed(1)}%)`
    : ''

  return `${productName}: ${alert.oldPrice}€ → ${alert.newPrice || alert.product.currentPrice}€${changeStr}`
}

async function sendEmailNotifications(alerts: PriceAlert[], email: string) {
  // In production, integrate with email service (SendGrid, Resend, etc.)
  console.log(`Would send email to ${email} with ${alerts.length} price alerts`)
  
  // For now, just log the intent
  // When email service is configured, implement actual sending here
}
