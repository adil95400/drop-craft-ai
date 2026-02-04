/**
 * Scope Validator Unit Tests
 * Tests for the scope validation logic in the extension gateway
 */

import { assertEquals, assertArrayIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts"
import {
  expandLegacyScopes,
  isValidGranularScope,
  isLegacyScope,
  hasRequiredScope,
  hasAllRequiredScopes,
  hasAnyRequiredScope,
  normalizeScopes,
  getRequiredScopeForAction,
  canPerformAction,
  LEGACY_SCOPE_MAP,
  VALID_GRANULAR_SCOPES,
} from "./scope-validator.ts"

// =============================================================================
// EXPAND LEGACY SCOPES TESTS
// =============================================================================

Deno.test("expandLegacyScopes - expands 'import' to granular scopes", () => {
  const result = expandLegacyScopes(['import'])
  
  assertArrayIncludes(result, ['products:read'])
  assertArrayIncludes(result, ['products:import'])
  assertArrayIncludes(result, ['products:write'])
  assertEquals(result.length, 3)
})

Deno.test("expandLegacyScopes - expands 'sync' to granular scopes", () => {
  const result = expandLegacyScopes(['sync'])
  
  assertArrayIncludes(result, ['sync:read'])
  assertArrayIncludes(result, ['sync:trigger'])
  assertEquals(result.length, 2)
})

Deno.test("expandLegacyScopes - expands 'logs' to analytics:read", () => {
  const result = expandLegacyScopes(['logs'])
  
  assertEquals(result, ['analytics:read'])
})

Deno.test("expandLegacyScopes - expands 'bulk' to products:bulk", () => {
  const result = expandLegacyScopes(['bulk'])
  
  assertEquals(result, ['products:bulk'])
})

Deno.test("expandLegacyScopes - expands 'ai_optimize' to AI scopes", () => {
  const result = expandLegacyScopes(['ai_optimize'])
  
  assertArrayIncludes(result, ['ai:generate'])
  assertArrayIncludes(result, ['ai:optimize'])
  assertEquals(result.length, 2)
})

Deno.test("expandLegacyScopes - expands 'stock_monitor' to sync:auto", () => {
  const result = expandLegacyScopes(['stock_monitor'])
  
  assertEquals(result, ['sync:auto'])
})

Deno.test("expandLegacyScopes - passes through granular scopes unchanged", () => {
  const result = expandLegacyScopes(['products:import', 'ai:seo'])
  
  assertEquals(result, ['products:import', 'ai:seo'])
})

Deno.test("expandLegacyScopes - handles mixed legacy and granular scopes", () => {
  const result = expandLegacyScopes(['import', 'ai:seo'])
  
  assertArrayIncludes(result, ['products:read'])
  assertArrayIncludes(result, ['products:import'])
  assertArrayIncludes(result, ['products:write'])
  assertArrayIncludes(result, ['ai:seo'])
  assertEquals(result.length, 4)
})

Deno.test("expandLegacyScopes - deduplicates repeated scopes", () => {
  const result = expandLegacyScopes(['import', 'products:read'])
  
  // Should deduplicate products:read
  const countProductsRead = result.filter(s => s === 'products:read').length
  assertEquals(countProductsRead, 1)
})

Deno.test("expandLegacyScopes - handles empty array", () => {
  const result = expandLegacyScopes([])
  
  assertEquals(result, [])
})

Deno.test("expandLegacyScopes - handles unknown scopes (pass through)", () => {
  const result = expandLegacyScopes(['unknown:scope'])
  
  assertEquals(result, ['unknown:scope'])
})

// =============================================================================
// IS VALID GRANULAR SCOPE TESTS
// =============================================================================

Deno.test("isValidGranularScope - returns true for valid product scopes", () => {
  assertEquals(isValidGranularScope('products:read'), true)
  assertEquals(isValidGranularScope('products:write'), true)
  assertEquals(isValidGranularScope('products:import'), true)
  assertEquals(isValidGranularScope('products:bulk'), true)
})

Deno.test("isValidGranularScope - returns true for valid sync scopes", () => {
  assertEquals(isValidGranularScope('sync:read'), true)
  assertEquals(isValidGranularScope('sync:trigger'), true)
  assertEquals(isValidGranularScope('sync:auto'), true)
  assertEquals(isValidGranularScope('sync:stock'), true)
  assertEquals(isValidGranularScope('sync:price'), true)
})

Deno.test("isValidGranularScope - returns true for valid AI scopes", () => {
  assertEquals(isValidGranularScope('ai:generate'), true)
  assertEquals(isValidGranularScope('ai:optimize'), true)
  assertEquals(isValidGranularScope('ai:seo'), true)
})

Deno.test("isValidGranularScope - returns false for legacy scopes", () => {
  assertEquals(isValidGranularScope('import'), false)
  assertEquals(isValidGranularScope('sync'), false)
  assertEquals(isValidGranularScope('logs'), false)
  assertEquals(isValidGranularScope('bulk'), false)
})

Deno.test("isValidGranularScope - returns false for unknown scopes", () => {
  assertEquals(isValidGranularScope('unknown'), false)
  assertEquals(isValidGranularScope('products:unknown'), false)
  assertEquals(isValidGranularScope(''), false)
})

// =============================================================================
// IS LEGACY SCOPE TESTS
// =============================================================================

Deno.test("isLegacyScope - returns true for all legacy scopes", () => {
  assertEquals(isLegacyScope('import'), true)
  assertEquals(isLegacyScope('sync'), true)
  assertEquals(isLegacyScope('logs'), true)
  assertEquals(isLegacyScope('bulk'), true)
  assertEquals(isLegacyScope('ai_optimize'), true)
  assertEquals(isLegacyScope('stock_monitor'), true)
  assertEquals(isLegacyScope('settings'), true)
})

Deno.test("isLegacyScope - returns false for granular scopes", () => {
  assertEquals(isLegacyScope('products:import'), false)
  assertEquals(isLegacyScope('sync:read'), false)
  assertEquals(isLegacyScope('ai:optimize'), false)
})

// =============================================================================
// HAS REQUIRED SCOPE TESTS
// =============================================================================

Deno.test("hasRequiredScope - returns true when user has exact granular scope", () => {
  const userScopes = ['products:import', 'ai:seo']
  
  assertEquals(hasRequiredScope(userScopes, 'products:import'), true)
  assertEquals(hasRequiredScope(userScopes, 'ai:seo'), true)
})

Deno.test("hasRequiredScope - returns true when legacy scope expands to required scope", () => {
  const userScopes = ['import'] // Expands to products:read, products:import, products:write
  
  assertEquals(hasRequiredScope(userScopes, 'products:import'), true)
  assertEquals(hasRequiredScope(userScopes, 'products:read'), true)
  assertEquals(hasRequiredScope(userScopes, 'products:write'), true)
})

Deno.test("hasRequiredScope - returns false when user lacks required scope", () => {
  const userScopes = ['products:read']
  
  assertEquals(hasRequiredScope(userScopes, 'products:import'), false)
  assertEquals(hasRequiredScope(userScopes, 'ai:seo'), false)
})

Deno.test("hasRequiredScope - handles mixed legacy and granular scopes", () => {
  const userScopes = ['import', 'ai:seo']
  
  assertEquals(hasRequiredScope(userScopes, 'products:import'), true)
  assertEquals(hasRequiredScope(userScopes, 'ai:seo'), true)
  assertEquals(hasRequiredScope(userScopes, 'ai:optimize'), false) // Not in import or ai:seo
})

Deno.test("hasRequiredScope - returns false for empty user scopes", () => {
  assertEquals(hasRequiredScope([], 'products:import'), false)
})

// =============================================================================
// HAS ALL REQUIRED SCOPES TESTS
// =============================================================================

Deno.test("hasAllRequiredScopes - returns true when user has all required scopes", () => {
  const userScopes = ['products:import', 'ai:seo', 'sync:read']
  const required = ['products:import', 'sync:read']
  
  assertEquals(hasAllRequiredScopes(userScopes, required), true)
})

Deno.test("hasAllRequiredScopes - returns false when user is missing one scope", () => {
  const userScopes = ['products:import']
  const required = ['products:import', 'sync:read']
  
  assertEquals(hasAllRequiredScopes(userScopes, required), false)
})

Deno.test("hasAllRequiredScopes - works with legacy scope expansion", () => {
  const userScopes = ['import', 'sync']
  const required = ['products:import', 'sync:read']
  
  assertEquals(hasAllRequiredScopes(userScopes, required), true)
})

Deno.test("hasAllRequiredScopes - returns true for empty required array", () => {
  assertEquals(hasAllRequiredScopes(['products:import'], []), true)
})

// =============================================================================
// HAS ANY REQUIRED SCOPE TESTS
// =============================================================================

Deno.test("hasAnyRequiredScope - returns true when user has one of required scopes", () => {
  const userScopes = ['products:import']
  const required = ['products:import', 'ai:seo']
  
  assertEquals(hasAnyRequiredScope(userScopes, required), true)
})

Deno.test("hasAnyRequiredScope - returns false when user has none of required scopes", () => {
  const userScopes = ['analytics:read']
  const required = ['products:import', 'ai:seo']
  
  assertEquals(hasAnyRequiredScope(userScopes, required), false)
})

Deno.test("hasAnyRequiredScope - works with legacy scope expansion", () => {
  const userScopes = ['import']
  const required = ['products:import', 'ai:seo']
  
  assertEquals(hasAnyRequiredScope(userScopes, required), true)
})

Deno.test("hasAnyRequiredScope - returns false for empty required array", () => {
  assertEquals(hasAnyRequiredScope(['products:import'], []), false)
})

// =============================================================================
// NORMALIZE SCOPES TESTS
// =============================================================================

Deno.test("normalizeScopes - expands legacy and filters invalid", () => {
  const scopes = ['import', 'unknown:invalid']
  const result = normalizeScopes(scopes)
  
  assertArrayIncludes(result, ['products:read'])
  assertArrayIncludes(result, ['products:import'])
  assertArrayIncludes(result, ['products:write'])
  assertEquals(result.includes('unknown:invalid'), false)
})

Deno.test("normalizeScopes - keeps valid granular scopes", () => {
  const scopes = ['products:import', 'ai:seo']
  const result = normalizeScopes(scopes)
  
  assertEquals(result, ['products:import', 'ai:seo'])
})

Deno.test("normalizeScopes - handles empty array", () => {
  assertEquals(normalizeScopes([]), [])
})

// =============================================================================
// GET REQUIRED SCOPE FOR ACTION TESTS
// =============================================================================

Deno.test("getRequiredScopeForAction - returns correct scope for import actions", () => {
  assertEquals(getRequiredScopeForAction('IMPORT_PRODUCT'), 'products:import')
  assertEquals(getRequiredScopeForAction('IMPORT_PRODUCT_BACKEND'), 'products:import')
  assertEquals(getRequiredScopeForAction('IMPORT_PROGRESSIVE'), 'products:import')
})

Deno.test("getRequiredScopeForAction - returns correct scope for bulk actions", () => {
  assertEquals(getRequiredScopeForAction('IMPORT_BULK'), 'products:bulk')
  assertEquals(getRequiredScopeForAction('IMPORT_BULK_BACKEND'), 'products:bulk')
})

Deno.test("getRequiredScopeForAction - returns correct scope for AI actions", () => {
  assertEquals(getRequiredScopeForAction('AI_OPTIMIZE_TITLE'), 'ai:optimize')
  assertEquals(getRequiredScopeForAction('AI_OPTIMIZE_DESCRIPTION'), 'ai:optimize')
  assertEquals(getRequiredScopeForAction('AI_GENERATE_SEO'), 'ai:seo')
})

Deno.test("getRequiredScopeForAction - returns correct scope for sync actions", () => {
  assertEquals(getRequiredScopeForAction('SYNC_STOCK'), 'sync:stock')
  assertEquals(getRequiredScopeForAction('SYNC_PRICE'), 'sync:price')
})

Deno.test("getRequiredScopeForAction - returns null for actions without required scope", () => {
  assertEquals(getRequiredScopeForAction('AUTH_GENERATE_TOKEN'), null)
  assertEquals(getRequiredScopeForAction('HEALTHCHECK'), null)
  assertEquals(getRequiredScopeForAction('UNKNOWN_ACTION'), null)
})

// =============================================================================
// CAN PERFORM ACTION TESTS
// =============================================================================

Deno.test("canPerformAction - allows action when user has required scope", () => {
  const userScopes = ['products:import', 'ai:seo']
  
  const result = canPerformAction(userScopes, 'IMPORT_PRODUCT')
  assertEquals(result.allowed, true)
  assertEquals(result.missingScope, undefined)
})

Deno.test("canPerformAction - allows action when legacy scope expands to required", () => {
  const userScopes = ['import']
  
  const result = canPerformAction(userScopes, 'IMPORT_PRODUCT')
  assertEquals(result.allowed, true)
})

Deno.test("canPerformAction - denies action when user lacks required scope", () => {
  const userScopes = ['products:read']
  
  const result = canPerformAction(userScopes, 'IMPORT_PRODUCT')
  assertEquals(result.allowed, false)
  assertEquals(result.missingScope, 'products:import')
})

Deno.test("canPerformAction - allows action without required scope requirement", () => {
  const userScopes: string[] = []
  
  const result = canPerformAction(userScopes, 'HEALTHCHECK')
  assertEquals(result.allowed, true)
})

Deno.test("canPerformAction - denies AI action without AI scope", () => {
  const userScopes = ['products:import']
  
  const result = canPerformAction(userScopes, 'AI_OPTIMIZE_TITLE')
  assertEquals(result.allowed, false)
  assertEquals(result.missingScope, 'ai:optimize')
})

Deno.test("canPerformAction - allows AI action with ai_optimize legacy scope", () => {
  const userScopes = ['ai_optimize']
  
  const result = canPerformAction(userScopes, 'AI_OPTIMIZE_TITLE')
  assertEquals(result.allowed, true)
})

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

Deno.test("edge case - multiple legacy scopes with overlap", () => {
  const result = expandLegacyScopes(['import', 'bulk'])
  
  // Should have products:read, products:import, products:write from import
  // And products:bulk from bulk
  // No duplicates
  assertArrayIncludes(result, ['products:read'])
  assertArrayIncludes(result, ['products:import'])
  assertArrayIncludes(result, ['products:write'])
  assertArrayIncludes(result, ['products:bulk'])
})

Deno.test("edge case - case sensitivity", () => {
  // Scopes should be case-sensitive
  assertEquals(isValidGranularScope('PRODUCTS:IMPORT'), false)
  assertEquals(isLegacyScope('IMPORT'), false)
  assertEquals(hasRequiredScope(['PRODUCTS:IMPORT'], 'products:import'), false)
})

Deno.test("edge case - scope with special characters", () => {
  // Unknown scopes should pass through
  const result = expandLegacyScopes(['products:import:extra'])
  assertEquals(result, ['products:import:extra'])
  assertEquals(isValidGranularScope('products:import:extra'), false)
})

// =============================================================================
// LEGACY SCOPE MAP COMPLETENESS TEST
// =============================================================================

Deno.test("LEGACY_SCOPE_MAP - all mapped scopes are valid granular scopes", () => {
  for (const [legacy, granular] of Object.entries(LEGACY_SCOPE_MAP)) {
    for (const scope of granular) {
      assertEquals(
        isValidGranularScope(scope),
        true,
        `Legacy scope '${legacy}' maps to invalid scope '${scope}'`
      )
    }
  }
})

Deno.test("VALID_GRANULAR_SCOPES - has expected minimum count", () => {
  // Should have at least 15 valid scopes
  assertEquals(VALID_GRANULAR_SCOPES.size >= 15, true)
})
