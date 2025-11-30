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

    const { trialDays = 14, plan = 'pro', couponCode } = await req.json()

    console.log(`[trial-activate] Activating ${trialDays}-day trial for user ${user.id}`)

    // Vérifier si l'utilisateur a déjà eu un essai gratuit
    const { data: existingTrial } = await supabase
      .from('free_trial_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingTrial) {
      return new Response(JSON.stringify({ 
        error: 'Vous avez déjà utilisé votre période d\'essai gratuite' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculer la date de fin
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    // Créer l'essai gratuit
    const { data: trial, error: trialError } = await supabase
      .from('free_trial_subscriptions')
      .insert({
        user_id: user.id,
        trial_plan: plan,
        trial_days: trialDays,
        ends_at: trialEndsAt.toISOString(),
        coupon_code: couponCode,
        status: 'active'
      })
      .select()
      .single()

    if (trialError) {
      console.error('[trial-activate] Error creating trial:', trialError)
      throw trialError
    }

    // Mettre à jour le profil utilisateur
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: plan,
        subscription_status: 'trial',
        subscription_expires_at: trialEndsAt.toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('[trial-activate] Error updating profile:', profileError)
      throw profileError
    }

    console.log(`[trial-activate] Trial activated successfully for user ${user.id}`)

    return new Response(JSON.stringify({
      success: true,
      trial: {
        id: trial.id,
        plan: trial.trial_plan,
        days: trial.trial_days,
        started_at: trial.started_at,
        ends_at: trial.ends_at,
        status: trial.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[trial-activate] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
