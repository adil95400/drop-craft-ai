import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { action, email, password } = await req.json()

    if (action === 'login') {
      // Authenticate user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Identifiants invalides' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Generate extension token
      const token = crypto.randomUUID() + '-' + Date.now()
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

      // Store token
      const { error: tokenError } = await supabase
        .from('extension_auth_tokens')
        .insert({
          user_id: authData.user.id,
          token,
          expires_at: expiresAt,
          is_active: true,
          device_info: { source: 'extension_login' }
        })

      if (tokenError) {
        console.error('Token insert error:', tokenError)
        throw new Error('Failed to create extension token')
      }

      // Log security event
      await supabase.from('security_events').insert({
        user_id: authData.user.id,
        event_type: 'extension_login',
        severity: 'info',
        description: 'User logged in via Chrome extension',
        metadata: {}
      })

      return new Response(
        JSON.stringify({
          success: true,
          token,
          expiresAt,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            plan: profile?.subscription_plan || 'free',
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            avatarUrl: profile?.avatar_url
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
