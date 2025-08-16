import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface QuotaCheckRequest {
  userId: string
  quotaKey: string
  incrementBy?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, quotaKey, incrementBy = 0 } = await req.json() as QuotaCheckRequest

    console.log(`Checking quota for user ${userId}, quota: ${quotaKey}, increment: ${incrementBy}`)

    // Use the database function to check quota
    const { data: canProceed, error: checkError } = await supabase.rpc('check_quota', {
      user_id_param: userId,
      quota_key_param: quotaKey
    })

    if (checkError) {
      console.error('Error checking quota:', checkError)
      throw new Error('Failed to check quota')
    }

    // If incrementBy is provided and quota check passes, increment the quota
    if (incrementBy > 0 && canProceed) {
      const { data: incrementResult, error: incrementError } = await supabase.rpc('increment_quota', {
        user_id_param: userId,
        quota_key_param: quotaKey,
        increment_by: incrementBy
      })

      if (incrementError) {
        console.error('Error incrementing quota:', incrementError)
        throw new Error('Failed to increment quota')
      }

      console.log(`Quota incremented successfully for ${quotaKey}`)
    }

    // Get current quota status
    const { data: quotaData, error: quotaError } = await supabase
      .from('user_quotas')
      .select('current_count, reset_date')
      .eq('user_id', userId)
      .eq('quota_key', quotaKey)
      .maybeSingle()

    if (quotaError) {
      console.error('Error fetching quota data:', quotaError)
    }

    // Get quota limit from plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    let limit = null
    if (!profileError && profile) {
      const { data: limitData, error: limitError } = await supabase
        .from('plans_limits')
        .select('limit_value')
        .eq('plan', profile.plan)
        .eq('limit_key', quotaKey)
        .maybeSingle()

      if (!limitError && limitData) {
        limit = limitData.limit_value
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        canProceed,
        currentCount: quotaData?.current_count || 0,
        limit,
        resetDate: quotaData?.reset_date,
        quotaKey
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Quota check error:', error)
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