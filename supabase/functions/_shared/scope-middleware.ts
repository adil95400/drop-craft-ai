/**
 * P1.3 - Scope-based Authorization Middleware
 * Validates extension token scopes for API access
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ============= Types =============

export interface ScopeValidationResult {
  valid: boolean
  tokenId?: string
  userId?: string
  userEmail?: string
  userPlan?: string
  grantedScopes: string[]
  missingScopes: string[]
  error?: string
  code?: string
}

export interface ScopeConfig {
  requiredScopes: string[]
  requireAll?: boolean  // If true, all scopes required. If false, any one scope is sufficient
  logUsage?: boolean    // Log scope usage for audit
}

// ============= Scope Validation =============

/**
 * Validate extension token and check for required scopes
 */
export async function validateTokenScopes(
  token: string,
  config: ScopeConfig
): Promise<ScopeValidationResult> {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Sanitize token
  const sanitized = token.trim().replace(/[^a-zA-Z0-9\-_+=/]/g, '')
  if (sanitized.length < 10 || sanitized.length > 150) {
    return {
      valid: false,
      grantedScopes: [],
      missingScopes: config.requiredScopes,
      error: 'Invalid token format',
      code: 'TOKEN_INVALID'
    }
  }
  
  // Validate token with scopes using the database function
  const { data: result, error } = await adminClient.rpc('validate_token_with_scopes', {
    p_token: sanitized,
    p_required_scopes: config.requireAll !== false ? config.requiredScopes : null
  })
  
  if (error) {
    console.error('[scope-middleware] RPC error:', error)
    return {
      valid: false,
      grantedScopes: [],
      missingScopes: config.requiredScopes,
      error: 'Token validation failed',
      code: 'VALIDATION_ERROR'
    }
  }
  
  if (!result?.success) {
    return {
      valid: false,
      grantedScopes: result?.scopes || [],
      missingScopes: result?.missing_scopes || config.requiredScopes,
      error: result?.error || 'Invalid token',
      code: result?.code || 'TOKEN_INVALID'
    }
  }
  
  const grantedScopes: string[] = result.scopes || []
  
  // For requireAll=false, check if at least one required scope is present
  if (config.requireAll === false && config.requiredScopes.length > 0) {
    const hasAnyScope = config.requiredScopes.some(s => grantedScopes.includes(s))
    if (!hasAnyScope) {
      return {
        valid: false,
        tokenId: result.token_id,
        userId: result.user?.id,
        grantedScopes,
        missingScopes: config.requiredScopes,
        error: `Au moins un de ces scopes est requis: ${config.requiredScopes.join(', ')}`,
        code: 'INSUFFICIENT_SCOPES'
      }
    }
  }
  
  return {
    valid: true,
    tokenId: result.token_id,
    userId: result.user?.id,
    userEmail: result.user?.email,
    userPlan: result.user?.plan,
    grantedScopes,
    missingScopes: []
  }
}

/**
 * Log scope usage for audit trail
 */
export async function logScopeUsage(
  tokenId: string,
  userId: string,
  scopeName: string,
  action: string,
  success: boolean,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    await adminClient.rpc('log_scope_usage', {
      p_token_id: tokenId,
      p_user_id: userId,
      p_scope_name: scopeName,
      p_action: action,
      p_success: success,
      p_error_message: errorMessage,
      p_metadata: metadata || {},
      p_ip_address: ipAddress
    })
  } catch (e) {
    console.warn('[scope-middleware] Failed to log scope usage:', e)
  }
}

/**
 * Check per-scope rate limiting
 */
export async function checkScopeRateLimit(
  tokenId: string,
  userId: string,
  scopeName: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey)
  
  // Get scope rate limit
  const { data: rateLimit } = await adminClient.rpc('get_scope_rate_limit', {
    p_scope_name: scopeName
  })
  
  const limit = rateLimit || 100
  
  // Count recent usage in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count, error } = await adminClient
    .from('extension_scope_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('token_id', tokenId)
    .eq('scope_name', scopeName)
    .gte('created_at', oneHourAgo)
  
  if (error) {
    console.warn('[scope-middleware] Rate limit check error:', error)
    return { allowed: true, remaining: limit, limit }
  }
  
  const used = count || 0
  const remaining = Math.max(0, limit - used)
  
  return {
    allowed: remaining > 0,
    remaining,
    limit
  }
}

// ============= Scope Presets =============

export const SCOPE_PRESETS = {
  // Product operations
  PRODUCT_READ: ['products:read'],
  PRODUCT_WRITE: ['products:read', 'products:write'],
  PRODUCT_IMPORT: ['products:read', 'products:import'],
  PRODUCT_BULK: ['products:read', 'products:import', 'products:bulk'],
  PRODUCT_FULL: ['products:read', 'products:write', 'products:import', 'products:bulk', 'products:delete'],
  
  // Order operations
  ORDER_READ: ['orders:read'],
  ORDER_MANAGE: ['orders:read', 'orders:write', 'orders:fulfill'],
  
  // Sync operations
  SYNC_READ: ['sync:read'],
  SYNC_TRIGGER: ['sync:read', 'sync:trigger'],
  SYNC_FULL: ['sync:read', 'sync:trigger', 'sync:auto'],
  
  // Analytics
  ANALYTICS_READ: ['analytics:read'],
  ANALYTICS_FULL: ['analytics:read', 'analytics:export'],
  
  // Settings
  SETTINGS_READ: ['settings:read'],
  SETTINGS_FULL: ['settings:read', 'settings:write'],
  
  // AI features
  AI_GENERATE: ['ai:generate'],
  AI_FULL: ['ai:generate', 'ai:optimize'],
  
  // Admin
  ADMIN: ['admin:users', 'admin:system'],
  
  // Default extension scopes
  EXTENSION_DEFAULT: ['products:read', 'products:import', 'sync:read', 'settings:read'],
  EXTENSION_PRO: ['products:read', 'products:write', 'products:import', 'products:bulk', 'sync:read', 'sync:trigger', 'analytics:read', 'settings:read', 'settings:write', 'ai:generate']
} as const

// ============= Helper to create scope requirement decorator =============

export function requireScopes(scopes: string[], options?: { requireAll?: boolean }) {
  return {
    requiredScopes: scopes,
    requireAll: options?.requireAll ?? true,
    logUsage: true
  } satisfies ScopeConfig
}
