import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleError, ValidationError, AuthenticationError } from '../_shared/error-handler.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-token',
}

// Input validation helper
function validateUUID(value: unknown, fieldName: string): string {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(`${fieldName} is required`)
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`)
  }
  return value
}

function validateDeviceInfo(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  // Sanitize device info - only allow safe fields
  const allowedFields = ['browser', 'platform', 'version', 'userAgent']
  const sanitized: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in (value as Record<string, unknown>)) {
      const fieldValue = (value as Record<string, unknown>)[key]
      if (typeof fieldValue === 'string' && fieldValue.length < 256) {
        sanitized[key] = fieldValue.substring(0, 255)
      }
    }
  }
  return sanitized
}

function sanitizeToken(value: unknown): string | null {
  if (!value || typeof value !== 'string') {
    return null
  }
  // Tokens can be alphanumeric with dashes and underscores (ext_xxx format)
  const sanitized = value.replace(/[^a-zA-Z0-9\-_]/g, '')
  if (sanitized.length < 10 || sanitized.length > 100) {
    return null
  }
  return sanitized
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

    if (!action || typeof action !== 'string') {
      throw new ValidationError('Action is required')
    }

    // Generate extension token
    if (action === 'generate_token') {
      // Validate inputs
      const userId = validateUUID(data?.userId, 'userId')
      const deviceInfo = validateDeviceInfo(data?.deviceInfo)
      
      // Verify user exists
      const { data: userExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (!userExists) {
        throw new AuthenticationError('User not found')
      }
      
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

      // Log security event
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'extension_token_created',
        severity: 'info',
        description: 'Extension authentication token generated',
        metadata: { device_info: deviceInfo }
      })

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
      const rawToken = req.headers.get('x-extension-token') || data?.token
      const token = sanitizeToken(rawToken)
      
      if (!token) {
        throw new AuthenticationError('Valid token required')
      }

      const { data: authData, error } = await supabase
        .from('extension_auth_tokens')
        .select('*, profiles(*)')
        .eq('token', token)
        .eq('is_active', true)
        .single()

      if (error || !authData) {
        throw new AuthenticationError('Invalid token')
      }

      // Check expiration
      if (new Date(authData.expires_at) < new Date()) {
        // Deactivate expired token
        await supabase
          .from('extension_auth_tokens')
          .update({ is_active: false })
          .eq('id', authData.id)
        
        throw new AuthenticationError('Token expired')
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
      const token = sanitizeToken(data?.token)
      
      if (!token) {
        throw new ValidationError('Valid token required')
      }
      
      const { data: tokenData } = await supabase
        .from('extension_auth_tokens')
        .select('user_id')
        .eq('token', token)
        .single()

      await supabase
        .from('extension_auth_tokens')
        .update({ is_active: false })
        .eq('token', token)

      // Log security event
      if (tokenData) {
        await supabase.from('security_events').insert({
          user_id: tokenData.user_id,
          event_type: 'extension_token_revoked',
          severity: 'info',
          description: 'Extension authentication token revoked',
          metadata: {}
        })
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Token revoked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new ValidationError('Invalid action')

  } catch (error) {
    console.error('Extension auth error:', error)
    return handleError(error, corsHeaders)
  }
})
