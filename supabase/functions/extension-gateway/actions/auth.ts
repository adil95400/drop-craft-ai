/**
 * Auth Handler
 * Handles AUTH_* actions for extension authentication
 * P1.3: Updated with legacy scope compatibility mapping
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { expandLegacyScopes } from '../lib/scope-validator.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const GenerateTokenPayload = z.object({
  refreshToken: z.string().optional(),
})

const RefreshTokenPayload = z.object({
  refreshToken: z.string().min(1),
})

// =============================================================================
// HANDLERS
// =============================================================================

async function handleGenerateToken(
  payload: Record<string, unknown>,
  ctx: GatewayContext,
  req: Request
): Promise<HandlerResult> {
  // Get JWT from Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'JWT authentication required' }
    }
  }

  const jwt = authHeader.replace('Bearer ', '')
  
  try {
    const { data: { user }, error } = await ctx.supabase.auth.getUser(jwt)
    
    if (error || !user) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid JWT token' }
      }
    }

    // Generate extension token
    const { data: tokenData, error: tokenError } = await ctx.supabase.rpc('generate_extension_token', {
      p_user_id: user.id,
      p_email: user.email,
    })

    if (tokenError) {
      console.error('[Auth] Token generation error:', tokenError)
      return {
        success: false,
        error: { code: 'HANDLER_ERROR', message: 'Failed to generate token' }
      }
    }

    // Get user plan info
    const { data: profile } = await ctx.supabase
      .from('user_profiles')
      .select('plan, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle()

    return {
      success: true,
      data: {
        token: tokenData.token,
        expiresAt: tokenData.expires_at,
        refreshToken: tokenData.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          plan: profile?.plan || 'free',
        },
        permissions: tokenData.permissions || [],
      }
    }
  } catch (error) {
    console.error('[Auth] Error:', error)
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleValidateToken(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  // Token is already validated by the gateway if we reach here
  return {
    success: true,
    data: {
      valid: true,
      user: {
        id: ctx.userId,
        email: ctx.userEmail,
        plan: ctx.userPlan,
      },
      permissions: ctx.permissions,
    }
  }
}

async function handleRefreshToken(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = RefreshTokenPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Refresh token required' }
    }
  }

  try {
    const { data, error } = await ctx.supabase.rpc('refresh_extension_token', {
      p_refresh_token: parsed.data.refreshToken,
    })

    if (error || !data?.success) {
      return {
        success: false,
        error: { code: 'INVALID_TOKEN', message: data?.error || 'Invalid refresh token' }
      }
    }

    return {
      success: true,
      data: {
        token: data.token,
        expiresAt: data.expires_at,
        refreshToken: data.refresh_token,
        user: data.user,
        permissions: data.permissions || [],
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleRevokeToken(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    await ctx.supabase
      .from('extension_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', ctx.userId)
      .is('revoked_at', null)

    return {
      success: true,
      data: { revoked: true }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

async function handleHeartbeat(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  try {
    // Update session last_seen
    await ctx.supabase
      .from('extension_sessions')
      .upsert({
        user_id: ctx.userId,
        extension_id: ctx.extensionId,
        extension_version: ctx.extensionVersion,
        last_seen_at: new Date().toISOString(),
        status: 'active',
      }, {
        onConflict: 'user_id,extension_id',
      })

    return {
      success: true,
      data: { acknowledged: true }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleAuthAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext,
  req: Request
): Promise<HandlerResult> {
  switch (action) {
    case 'AUTH_GENERATE_TOKEN':
      return handleGenerateToken(payload, ctx, req)
    case 'AUTH_VALIDATE_TOKEN':
      return handleValidateToken(payload, ctx)
    case 'AUTH_REFRESH_TOKEN':
      return handleRefreshToken(payload, ctx)
    case 'AUTH_REVOKE_TOKEN':
      return handleRevokeToken(payload, ctx)
    case 'AUTH_HEARTBEAT':
      return handleHeartbeat(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown auth action: ${action}` }
      }
  }
}
