/**
 * Scope Validator Module
 * Centralized scope validation logic for the extension gateway
 * Extracted for testability
 */

// =============================================================================
// LEGACY SCOPE COMPATIBILITY
// =============================================================================

/**
 * Maps legacy scope names to granular P1.3 scopes
 * This ensures backward compatibility with extensions < 5.8.1
 */
export const LEGACY_SCOPE_MAP: Record<string, string[]> = {
  'import': ['products:read', 'products:import', 'products:write'],
  'sync': ['sync:read', 'sync:trigger'],
  'logs': ['analytics:read'],
  'bulk': ['products:bulk'],
  'ai_optimize': ['ai:generate', 'ai:optimize'],
  'stock_monitor': ['sync:auto'],
  'settings': ['settings:read', 'settings:write'],
}

/**
 * All valid granular scopes in the system
 */
export const VALID_GRANULAR_SCOPES = new Set([
  // Products
  'products:read',
  'products:write',
  'products:import',
  'products:bulk',
  'products:delete',
  // Sync
  'sync:read',
  'sync:trigger',
  'sync:auto',
  'sync:stock',
  'sync:price',
  // AI
  'ai:generate',
  'ai:optimize',
  'ai:seo',
  // Analytics
  'analytics:read',
  'analytics:write',
  // Settings
  'settings:read',
  'settings:write',
  // Store
  'store:publish',
  'store:read',
  // Analyze
  'analyze:product',
  'analyze:competitors',
  'analyze:market',
])

/**
 * Expands legacy scopes to their granular equivalents
 * Pass-through for already granular scopes
 */
export function expandLegacyScopes(scopes: string[]): string[] {
  const expanded: string[] = []
  for (const scope of scopes) {
    if (LEGACY_SCOPE_MAP[scope]) {
      expanded.push(...LEGACY_SCOPE_MAP[scope])
    } else {
      expanded.push(scope)
    }
  }
  return [...new Set(expanded)] // Deduplicate
}

/**
 * Checks if a scope is a valid granular scope
 */
export function isValidGranularScope(scope: string): boolean {
  return VALID_GRANULAR_SCOPES.has(scope)
}

/**
 * Checks if a scope is a legacy scope that needs expansion
 */
export function isLegacyScope(scope: string): boolean {
  return scope in LEGACY_SCOPE_MAP
}

/**
 * Validates that a user has the required scope
 * Handles both legacy and granular scopes
 */
export function hasRequiredScope(
  userScopes: string[],
  requiredScope: string
): boolean {
  // Expand any legacy scopes the user might have
  const expandedUserScopes = expandLegacyScopes(userScopes)
  
  // Check if required scope is in expanded scopes
  return expandedUserScopes.includes(requiredScope)
}

/**
 * Validates multiple required scopes (all must be present)
 */
export function hasAllRequiredScopes(
  userScopes: string[],
  requiredScopes: string[]
): boolean {
  return requiredScopes.every(scope => hasRequiredScope(userScopes, scope))
}

/**
 * Validates at least one of the required scopes is present
 */
export function hasAnyRequiredScope(
  userScopes: string[],
  requiredScopes: string[]
): boolean {
  return requiredScopes.some(scope => hasRequiredScope(userScopes, scope))
}

/**
 * Normalizes scopes: expands legacy and validates
 * Returns only valid granular scopes
 */
export function normalizeScopes(scopes: string[]): string[] {
  const expanded = expandLegacyScopes(scopes)
  return expanded.filter(scope => isValidGranularScope(scope))
}

/**
 * Gets the required scope for an action from the ACTION_CONFIG
 * Returns null if no scope is required
 */
export function getRequiredScopeForAction(action: string): string | null {
  const actionConfig: Record<string, string | undefined> = {
    'IMPORT_PRODUCT': 'products:import',
    'IMPORT_PRODUCT_BACKEND': 'products:import',
    'IMPORT_PROGRESSIVE': 'products:import',
    'IMPORT_BULK': 'products:bulk',
    'IMPORT_BULK_BACKEND': 'products:bulk',
    'IMPORT_REVIEWS': 'products:import',
    'UPSERT_PRODUCT': 'products:write',
    'PUBLISH_TO_STORE': 'store:publish',
    'SCRAPE_URL': 'products:read',
    'AI_OPTIMIZE_TITLE': 'ai:optimize',
    'AI_OPTIMIZE_DESCRIPTION': 'ai:optimize',
    'AI_OPTIMIZE_FULL': 'ai:optimize',
    'AI_GENERATE_SEO': 'ai:seo',
    'AI_GENERATE_TAGS': 'ai:optimize',
    'SYNC_STOCK': 'sync:stock',
    'SYNC_PRICE': 'sync:price',
    'ANALYZE_PRODUCT': 'analyze:product',
    'ANALYZE_COMPETITORS': 'analyze:competitors',
    'ANALYZE_MARKET': 'analyze:market',
  }
  
  return actionConfig[action] || null
}

/**
 * Validates if a user can perform an action
 */
export function canPerformAction(
  userScopes: string[],
  action: string
): { allowed: boolean; missingScope?: string } {
  const requiredScope = getRequiredScopeForAction(action)
  
  // No scope required for this action
  if (!requiredScope) {
    return { allowed: true }
  }
  
  // Check if user has the required scope
  if (hasRequiredScope(userScopes, requiredScope)) {
    return { allowed: true }
  }
  
  return { allowed: false, missingScope: requiredScope }
}
