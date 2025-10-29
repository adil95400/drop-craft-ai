import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { action, data } = await req.json()

    // Generate extension token
    if (action === 'generate_token') {
      const { userId, deviceInfo } = data
      
      // Generate secure token
      const token = crypto.randomUUID() + '-' + Date.now()
      
      // Store in database
      const { data: extensionAuth, error } = await supabase
        .from('extension_auth_tokens')
        .insert({
          user_id: userId,
          token: token,
          device_info: deviceInfo,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          success: true, 
          token: token,
          expiresAt: extensionAuth.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate extension token
    if (action === 'validate_token') {
      const token = req.headers.get('x-extension-token') || data.token
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: authData, error } = await supabase
        .from('extension_auth_tokens')
        .select('*, profiles(*)')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (error || !authData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check expiration
      if (new Date(authData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: 'Token expired' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update last used
      await supabase
        .from('extension_auth_tokens')
        .update({ 
          last_used_at: new Date().toISOString(),
          usage_count: (authData.usage_count || 0) + 1
        })
        .eq('id', authData.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: authData.user_id,
            email: authData.profiles?.email,
            plan: authData.profiles?.subscription_plan
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Revoke token
    if (action === 'revoke_token') {
      const { token } = data
      
      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('token', token)

      return new Response(
        JSON.stringify({ success: true, message: 'Token revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Extension auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
