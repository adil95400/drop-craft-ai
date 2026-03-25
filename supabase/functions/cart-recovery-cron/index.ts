/**
 * Cart Recovery Cron — Detects abandoned carts and triggers recovery emails
 * Runs every 15 minutes via pg_cron
 * 
 * Logic:
 * 1. Find carts abandoned > 1 hour ago with status 'pending' and < 3 attempts
 * 2. Send recovery email via Brevo
 * 3. Update cart status and attempt count
 * 4. Send push notification via notification-hub
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find abandoned carts that need recovery attempts
    // Criteria: pending, abandoned > 1h ago, < 3 attempts, not contacted in last 4h
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

    const { data: carts, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('recovery_status', 'pending')
      .lt('abandoned_at', oneHourAgo)
      .lt('recovery_attempts', 3)
      .or(`last_contacted_at.is.null,last_contacted_at.lt.${fourHoursAgo}`)
      .order('cart_value', { ascending: false }) // Prioritize high-value carts
      .limit(50)

    if (error) throw error

    if (!carts || carts.length === 0) {
      console.log('[cart-recovery-cron] No carts to process')
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[cart-recovery-cron] Processing ${carts.length} abandoned carts`)

    let emailsSent = 0
    let pushSent = 0
    let errors = 0

    for (const cart of carts) {
      try {
        // 1. Send recovery email via Brevo
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/brevo-hub`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: 'abandoned_cart_email',
            customerEmail: cart.customer_email,
            customerName: cart.customer_name,
            cartItems: cart.cart_items,
            cartValue: cart.cart_value,
            currency: cart.currency || 'EUR',
            recoveryUrl: `${supabaseUrl.replace('.supabase.co', '')}/recover-cart/${cart.id}`,
          }),
        })

        const emailResult = await emailRes.json()
        if (emailResult.success) emailsSent++

        // 2. Send push notification via notification-hub
        const pushRes = await fetch(`${supabaseUrl}/functions/v1/firebase-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            action: 'send_push',
            userId: cart.user_id,
            title: '🛒 Panier abandonné détecté',
            body: `${cart.customer_name || cart.customer_email} a abandonné un panier de ${cart.cart_value}${cart.currency || '€'}`,
            url: '/marketing-automation?tab=carts',
            data: { cartId: cart.id, type: 'abandoned_cart' },
          }),
        })

        const pushResult = await pushRes.json()
        if (pushResult.success && pushResult.sent > 0) pushSent++

        // 3. Update cart status
        await supabase
          .from('abandoned_carts')
          .update({
            recovery_status: 'contacted',
            recovery_attempts: (cart.recovery_attempts || 0) + 1,
            last_contacted_at: new Date().toISOString(),
          })
          .eq('id', cart.id)

        // 4. Create in-app notification for the merchant
        await supabase.from('user_notifications').insert({
          user_id: cart.user_id,
          title: 'Relance panier envoyée',
          message: `Email de relance envoyé à ${cart.customer_email} (${cart.cart_value}${cart.currency || '€'})`,
          notification_type: 'info',
          category: 'order',
          priority: 'normal',
          action_url: '/marketing-automation?tab=carts',
          metadata: { cart_id: cart.id, attempt: (cart.recovery_attempts || 0) + 1 },
        }).catch(() => {})

      } catch (err: any) {
        console.error(`[cart-recovery-cron] Error processing cart ${cart.id}:`, err.message)
        errors++
      }
    }

    const summary = {
      success: true,
      processed: carts.length,
      emailsSent,
      pushSent,
      errors,
      timestamp: new Date().toISOString(),
    }

    console.log('[cart-recovery-cron] Summary:', JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[cart-recovery-cron] Fatal error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
