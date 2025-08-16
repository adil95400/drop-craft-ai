import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PlanUpgradeRequest {
  userId: string
  newPlan: 'standard' | 'pro' | 'ultra_pro'
  paymentIntentId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, newPlan, paymentIntentId } = await req.json() as PlanUpgradeRequest

    console.log(`Upgrading plan for user ${userId} to ${newPlan}`)

    // Validate plan hierarchy (can only upgrade, not downgrade)
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching current profile:', profileError)
      throw new Error('Failed to fetch user profile')
    }

    const currentPlan = currentProfile?.plan || 'standard'
    const planHierarchy = { standard: 0, pro: 1, ultra_pro: 2 }
    
    if (planHierarchy[newPlan] <= planHierarchy[currentPlan]) {
      throw new Error('Can only upgrade to a higher plan')
    }

    // Update the user's plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        plan: newPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user plan:', updateError)
      throw new Error('Failed to update user plan')
    }

    // Reset user quotas (new plan = fresh start)
    const { error: resetError } = await supabase
      .from('user_quotas')
      .delete()
      .eq('user_id', userId)

    if (resetError) {
      console.warn('Warning: Could not reset user quotas:', resetError)
    }

    // Log the upgrade event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'plan_upgrade',
        description: `Plan upgraded from ${currentPlan} to ${newPlan}`,
        metadata: {
          previous_plan: currentPlan,
          new_plan: newPlan,
          payment_intent_id: paymentIntentId,
          timestamp: new Date().toISOString()
        }
      })

    console.log(`Plan upgrade completed: ${currentPlan} -> ${newPlan}`)

    return new Response(
      JSON.stringify({
        success: true,
        previousPlan: currentPlan,
        newPlan,
        message: `Plan successfully upgraded to ${newPlan}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Plan upgrade error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})