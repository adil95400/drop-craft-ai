/**
 * Check Plan - Secured Implementation
 * P0.1: JWT authentication required
 * P0.2: Users can only check their own plan (or admins for any)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts'
import { parseJsonValidated, z } from '../_shared/validators.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const BodySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID').optional(),
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

    // P0.1: Require JWT authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, requiredPlan } = await parseJsonValidated(req, BodySchema)

    // P0.2: Use authenticated user's ID, ignore any provided userId
    // This prevents users from checking other users' plans
    const targetUserId = user.id

    console.log(`Checking plan access for user ${targetUserId}, required: ${requiredPlan}`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's current plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', targetUserId)
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
