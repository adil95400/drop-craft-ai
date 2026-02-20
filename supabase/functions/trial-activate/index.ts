import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Extract user from JWT — never trust user_id from body
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { trialDays = 14, plan = 'pro', couponCode } = await req.json()

    console.log(`[trial-activate] Activating ${trialDays}-day trial for user ${user.id}`)

    // Check if user already had a free trial
    const { data: existingTrial } = await supabaseAdmin
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

    // Calculate end date
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    // Create free trial record
    const { data: trial, error: trialError } = await supabaseAdmin
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

    // Update user profile
    const { error: profileError } = await supabaseAdmin
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

    // Send confirmation email (fire-and-forget)
    try {
      const emailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-transactional-email`
      fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: 'trial_confirmation',
          data: { plan, trialDays, endsAt: trialEndsAt.toISOString() }
        }),
      }).catch(e => console.error('[trial-activate] Email send failed:', e))
    } catch (emailErr) {
      console.error('[trial-activate] Email error:', emailErr)
    }
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
