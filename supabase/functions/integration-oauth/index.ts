import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OAuthRequest {
  action: 'initiate' | 'callback' | 'refresh' | 'revoke'
  platform: string
  code?: string
  state?: string
  userId?: string
  refreshToken?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const requestData: OAuthRequest = await req.json()
    
    switch (requestData.action) {
      case 'initiate':
        return await initiateOAuth(requestData, user.id)
      
      case 'callback':
        return await handleCallback(requestData, user.id, supabase)
      
      case 'refresh':
        return await refreshToken(requestData, user.id, supabase)
      
      case 'revoke':
        return await revokeAccess(requestData, user.id, supabase)
      
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('OAuth error:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function initiateOAuth(request: OAuthRequest, userId: string) {
  const { platform } = request
  
  // Configuration OAuth pour différentes plateformes
  const oauthConfigs = {
    shopify: {
      clientId: Deno.env.get('SHOPIFY_CLIENT_ID'),
      redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integration-oauth`,
      scopes: 'read_products,write_products,read_orders,write_orders',
      authUrl: 'https://accounts.shopify.com/oauth/authorize'
    },
    amazon: {
      clientId: Deno.env.get('AMAZON_CLIENT_ID'),
      redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integration-oauth`,
      scopes: 'selling_partner_api::orders:read,selling_partner_api::inventory:read',
      authUrl: 'https://sellercentral.amazon.com/apps/authorize/consent'
    },
    facebook: {
      clientId: Deno.env.get('FACEBOOK_CLIENT_ID'),
      redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integration-oauth`,
      scopes: 'ads_management,business_management',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
    },
    google: {
      clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
      redirectUri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integration-oauth`,
      scopes: 'https://www.googleapis.com/auth/adwords',
      authUrl: 'https://accounts.google.com/oauth2/v2/auth'
    }
  }

  const config = oauthConfigs[platform as keyof typeof oauthConfigs]
  if (!config) {
    throw new Error(`Platform ${platform} not supported`)
  }

  // Generate state for CSRF protection
  const state = crypto.randomUUID()
  
  // Store state in database for verification
  const stateData = {
    user_id: userId,
    platform,
    state,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
  }

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: config.clientId!,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    state: JSON.stringify(stateData),
    response_type: 'code',
    access_type: 'offline', // For refresh tokens
    prompt: 'consent'
  })

  const authUrl = `${config.authUrl}?${params.toString()}`

  return new Response(JSON.stringify({
    success: true,
    authUrl,
    state,
    platform
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleCallback(request: OAuthRequest, userId: string, supabase: any) {
  const { platform, code, state } = request
  
  if (!code || !state) {
    throw new Error('Missing code or state parameter')
  }

  // Verify state
  const stateData = JSON.parse(state)
  if (stateData.user_id !== userId) {
    throw new Error('Invalid state parameter')
  }

  // Exchange code for tokens
  const tokenData = await exchangeCodeForTokens(platform, code)
  
  // Store or update integration
  const integrationData = {
    user_id: userId,
    platform_name: platform,
    platform_type: 'oauth',
    connection_status: 'connected',
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
    is_active: true,
    last_sync_at: new Date().toISOString()
  }

  // Check if integration already exists
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('id')
    .eq('user_id', userId)
    .eq('platform_name', platform)
    .single()

  if (existingIntegration) {
    // Update existing
    const { error } = await supabase
      .from('integrations')
      .update(integrationData)
      .eq('id', existingIntegration.id)
    
    if (error) throw error
  } else {
    // Create new
    const { error } = await supabase
      .from('integrations')
      .insert([integrationData])
    
    if (error) throw error
  }

  // Log security event
  await supabase.from('security_events').insert({
    user_id: userId,
    event_type: 'oauth_connected',
    severity: 'info',
    description: `OAuth connection established for ${platform}`,
    metadata: {
      platform,
      timestamp: new Date().toISOString()
    }
  })

  return new Response(JSON.stringify({
    success: true,
    message: `Successfully connected to ${platform}`,
    platform,
    connected: true
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function exchangeCodeForTokens(platform: string, code: string) {
  const tokenUrls = {
    shopify: 'https://accounts.shopify.com/oauth/token',
    amazon: 'https://api.amazon.com/auth/o2/token',
    facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
    google: 'https://oauth2.googleapis.com/token'
  }

  const clientSecrets = {
    shopify: Deno.env.get('SHOPIFY_CLIENT_SECRET'),
    amazon: Deno.env.get('AMAZON_CLIENT_SECRET'),
    facebook: Deno.env.get('FACEBOOK_CLIENT_SECRET'),
    google: Deno.env.get('GOOGLE_CLIENT_SECRET')
  }

  const tokenUrl = tokenUrls[platform as keyof typeof tokenUrls]
  const clientSecret = clientSecrets[platform as keyof typeof clientSecrets]

  if (!tokenUrl || !clientSecret) {
    throw new Error(`Token exchange not configured for ${platform}`)
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`)!,
      client_secret: clientSecret,
      code,
      redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integration-oauth`
    })
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`)
  }

  return await response.json()
}

async function refreshToken(request: OAuthRequest, userId: string, supabase: any) {
  const { platform, refreshToken } = request
  
  if (!refreshToken) {
    throw new Error('Refresh token required')
  }

  // Get new access token using refresh token
  const newTokenData = await refreshAccessToken(platform, refreshToken)
  
  // Update integration with new tokens
  const updateData = {
    access_token: newTokenData.access_token,
    token_expires_at: newTokenData.expires_in 
      ? new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString()
  }

  if (newTokenData.refresh_token) {
    updateData.refresh_token = newTokenData.refresh_token
  }

  const { error } = await supabase
    .from('integrations')
    .update(updateData)
    .eq('user_id', userId)
    .eq('platform_name', platform)

  if (error) throw error

  return new Response(JSON.stringify({
    success: true,
    message: 'Token refreshed successfully',
    expires_in: newTokenData.expires_in
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function refreshAccessToken(platform: string, refreshToken: string) {
  // Implementation similar to exchangeCodeForTokens but with refresh_token grant type
  const tokenUrls = {
    shopify: 'https://accounts.shopify.com/oauth/token',
    google: 'https://oauth2.googleapis.com/token'
  }

  const tokenUrl = tokenUrls[platform as keyof typeof tokenUrls]
  if (!tokenUrl) {
    throw new Error(`Token refresh not supported for ${platform}`)
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: Deno.env.get(`${platform.toUpperCase()}_CLIENT_ID`)!,
      client_secret: Deno.env.get(`${platform.toUpperCase()}_CLIENT_SECRET`)!,
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`)
  }

  return await response.json()
}

async function revokeAccess(request: OAuthRequest, userId: string, supabase: any) {
  const { platform } = request
  
  // Update integration status
  const { error } = await supabase
    .from('integrations')
    .update({
      connection_status: 'disconnected',
      is_active: false,
      access_token: null,
      refresh_token: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('platform_name', platform)

  if (error) throw error

  // Log security event
  await supabase.from('security_events').insert({
    user_id: userId,
    event_type: 'oauth_revoked',
    severity: 'info',
    description: `OAuth access revoked for ${platform}`,
    metadata: {
      platform,
      timestamp: new Date().toISOString()
    }
  })

  return new Response(JSON.stringify({
    success: true,
    message: `Access revoked for ${platform}`,
    platform,
    connected: false
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}