import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BodySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  requiredPlan: z.enum(['standard', 'pro', 'ultra_pro'], {
    errorMap: () => ({ message: 'requiredPlan must be standard, pro, or ultra_pro' })
  })
})

Deno.serve(
  withErrorHandler(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, requiredPlan } = await parseJsonValidated(req, BodySchema)

    console.log(`Checking plan access for user ${userId}, required: ${requiredPlan}`)

    // Get user's current plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      throw new ValidationError('Failed to fetch user profile')
    }

    const userPlan = profile?.plan || 'standard'
    
    // Plan hierarchy: standard < pro < ultra_pro
    const planHierarchy: Record<string, number> = { standard: 0, pro: 1, ultra_pro: 2 }
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
  }, corsHeaders)
)
