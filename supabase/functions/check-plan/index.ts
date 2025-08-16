import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface PlanCheckRequest {
  userId: string
  requiredPlan: 'standard' | 'pro' | 'ultra_pro'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, requiredPlan } = await req.json() as PlanCheckRequest

    console.log(`Checking plan access for user ${userId}, required: ${requiredPlan}`)

    // Get user's current plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      throw new Error('Failed to fetch user profile')
    }

    const userPlan = profile?.plan || 'standard'
    
    // Plan hierarchy: standard < pro < ultra_pro
    const planHierarchy = { standard: 0, pro: 1, ultra_pro: 2 }
    const hasAccess = planHierarchy[userPlan] >= planHierarchy[requiredPlan]

    console.log(`User plan: ${userPlan}, Required: ${requiredPlan}, Access: ${hasAccess}`)

    return new Response(
      JSON.stringify({
        success: true,
        hasAccess,
        userPlan,
        requiredPlan
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Plan check error:', error)
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