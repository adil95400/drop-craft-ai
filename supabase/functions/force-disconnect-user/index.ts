import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DisconnectRequest {
  targetUserId: string
  reason?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('Force disconnect user function called')

  try {
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // Extract and verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying admin token')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.log('Invalid token:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: corsHeaders }
      )
    }

    console.log('User authenticated:', user.id)

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (adminError || !adminCheck) {
      console.log('User is not admin:', adminError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: corsHeaders }
      )
    }

    console.log('Admin verified, processing request')

    // Parse request body
    const { targetUserId, reason = 'force_disconnect' }: DisconnectRequest = await req.json()

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'targetUserId is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('Disconnecting user:', targetUserId)

    // Call the database function to revoke user token
    const { data: revokeResult, error: revokeError } = await supabase
      .rpc('revoke_user_token', {
        target_user_id: targetUserId,
        admin_user_id: user.id,
        revoke_reason: reason
      })

    if (revokeError) {
      console.error('Error revoking token:', revokeError)
      return new Response(
        JSON.stringify({ error: 'Failed to disconnect user', details: revokeError.message }),
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('Token revoked successfully:', revokeResult)

    // Get target user info for notification
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', targetUserId)
      .single()

    if (userError) {
      console.log('Could not fetch target user info:', userError)
    }

    // Create notification for the disconnected user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: 'security',
        title: 'Session terminée',
        message: 'Votre session a été terminée par un administrateur. Veuillez vous reconnecter.',
        action_label: 'Se reconnecter',
        action_url: '/auth'
      })

    if (notificationError) {
      console.log('Could not create notification:', notificationError)
    }

    // Use Supabase's admin API to sign out the user from all sessions
    try {
      const { error: signOutError } = await supabase.auth.admin.signOut(targetUserId, 'global')
      if (signOutError) {
        console.log('Could not sign out user globally:', signOutError)
      } else {
        console.log('User signed out globally')
      }
    } catch (globalSignOutError) {
      console.log('Global sign out failed:', globalSignOutError)
    }

    // Send real-time notification via Supabase channels
    const channel = supabase.channel('user-disconnections')
    await channel.send({
      type: 'broadcast',
      event: 'force_disconnect',
      payload: {
        userId: targetUserId,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    })

    console.log('User disconnected successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetUser?.full_name || targetUserId} has been disconnected`,
        targetUserId: targetUserId
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})