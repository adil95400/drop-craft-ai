import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { code, amount, orderId, subscriptionId, metadata } = await req.json()

    console.log(`[coupon-redeem] Redeeming coupon ${code} for user ${user.id}`)

    // Valider d'abord le coupon
    const validateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/coupon-validate`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, amount })
    })

    const validation = await validateResponse.json()

    if (!validation.valid) {
      return new Response(JSON.stringify(validation), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Enregistrer l'utilisation
    const { data: redemption, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: validation.coupon.id,
        user_id: user.id,
        discount_applied: validation.discount.amount,
        original_amount: validation.discount.original_amount,
        final_amount: validation.discount.final_amount,
        order_id: orderId,
        subscription_id: subscriptionId,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (redemptionError) {
      console.error('[coupon-redeem] Redemption error:', redemptionError)
      throw redemptionError
    }

    // Incrémenter le compteur d'utilisation
    await supabase.rpc('increment', {
      row_id: validation.coupon.id,
      table_name: 'promotional_coupons',
      column_name: 'usage_count'
    }).catch(() => {
      // Fallback si la fonction RPC n'existe pas
      supabase
        .from('promotional_coupons')
        .update({ 
          usage_count: supabase.raw('usage_count + 1') 
        })
        .eq('id', validation.coupon.id)
    })

    // Si c'est un essai gratuit, créer l'entrée
    if (validation.coupon.type === 'free_trial' && validation.coupon.trial_days) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + validation.coupon.trial_days)

      await supabase
        .from('free_trial_subscriptions')
        .insert({
          user_id: user.id,
          trial_plan: metadata?.plan || 'pro',
          trial_days: validation.coupon.trial_days,
          ends_at: trialEndsAt.toISOString(),
          coupon_code: code
        })

      // Mettre à jour le profil utilisateur avec le plan d'essai
      await supabase
        .from('profiles')
        .update({
          plan: metadata?.plan || 'pro',
          subscription_status: 'trial',
          subscription_expires_at: trialEndsAt.toISOString()
        })
        .eq('id', user.id)
    }

    console.log(`[coupon-redeem] Successfully redeemed coupon ${code}`)

    return new Response(JSON.stringify({
      success: true,
      redemption,
      discount: validation.discount,
      trial: validation.coupon.trial_days ? {
        days: validation.coupon.trial_days,
        plan: metadata?.plan || 'pro'
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[coupon-redeem] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
