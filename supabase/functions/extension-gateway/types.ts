/**
 * Shared Types for Extension Gateway
 * Central type definitions for all handlers
 */

import { z } from 'https://esm.sh/zod@3.22.4'

// =============================================================================
// CONFIGURATION CONSTANTS
// =============================================================================

export const GATEWAY_VERSION = '2.1.0'
export const MIN_EXTENSION_VERSION = '5.7.0'
export const CURRENT_EXTENSION_VERSION = '5.8.1'

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface GatewayContext {
  requestId: string
  extensionId: string
  extensionVersion: string
  idempotencyKey: string | null
  userId: string | null
  userEmail?: string
  userPlan?: string
  permissions: string[]
  startTime: number
  supabase: any
}

export interface TokenValidation {
  success: boolean
  user?: { id: string; email?: string; plan?: string }
  permissions?: string[]
  error?: string
}

export interface HandlerResult {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export interface ActionHandler {
  (
    payload: Record<string, unknown>,
    ctx: GatewayContext,
    req: Request
  ): Promise<HandlerResult>
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
  // Auth errors (4xx)
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401, message: 'Authentication required' },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', status: 401, message: 'Invalid or expired token' },
  FORBIDDEN_SCOPE: { code: 'FORBIDDEN_SCOPE', status: 403, message: 'Insufficient permissions for this action' },
  
  // Request errors (4xx)
  INVALID_PAYLOAD: { code: 'INVALID_PAYLOAD', status: 400, message: 'Invalid request payload' },
  INVALID_HEADERS: { code: 'INVALID_HEADERS', status: 400, message: 'Missing or invalid required headers' },
  UNKNOWN_ACTION: { code: 'UNKNOWN_ACTION', status: 400, message: 'Unknown action type' },
  VERSION_OUTDATED: { code: 'VERSION_OUTDATED', status: 426, message: 'Extension update required' },
  INVALID_EXTENSION: { code: 'INVALID_EXTENSION', status: 403, message: 'Unknown extension ID' },
  
  // Replay/Idempotency errors (4xx)
  REPLAY_DETECTED: { code: 'REPLAY_DETECTED', status: 409, message: 'Request already processed' },
  IN_PROGRESS: { code: 'IN_PROGRESS', status: 409, message: 'Operation already in progress' },
  
  // Rate limiting (4xx)
  QUOTA_EXCEEDED: { code: 'QUOTA_EXCEEDED', status: 429, message: 'Rate limit exceeded' },
  
  // Server errors (5xx)
  INTERNAL: { code: 'INTERNAL', status: 500, message: 'Internal server error' },
  HANDLER_ERROR: { code: 'HANDLER_ERROR', status: 500, message: 'Action handler failed' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// =============================================================================
// ACTION CONFIGURATION
// =============================================================================

export interface ActionConfig {
  rateLimit: { maxRequests: number; windowMinutes: number }
  requiresToken: boolean
  requiredScope?: string
  handler: 'auth' | 'import' | 'ai' | 'sync' | 'utility' | 'scrape'
}

export const ACTION_CONFIG: Record<string, ActionConfig> = {
  // Auth actions
  'AUTH_GENERATE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_VALIDATE_TOKEN': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_REFRESH_TOKEN': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_REVOKE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_HEARTBEAT': { rateLimit: { maxRequests: 60, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  
  // Product actions
  'IMPORT_PRODUCT': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'import' },
  'IMPORT_BULK': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:bulk', handler: 'import' },
  'SCRAPE_URL': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:read', handler: 'scrape' },
  
  // AI actions
  'AI_OPTIMIZE_TITLE': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_OPTIMIZE_DESCRIPTION': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_OPTIMIZE_FULL': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  'AI_GENERATE_SEO': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:seo', handler: 'ai' },
  'AI_GENERATE_TAGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'ai:optimize', handler: 'ai' },
  
  // Sync actions
  'SYNC_STOCK': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'sync:stock', handler: 'sync' },
  'SYNC_PRICE': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'sync:price', handler: 'sync' },
  
  // Utility actions
  'CHECK_VERSION': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: false, handler: 'utility' },
  'GET_SETTINGS': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ANALYTICS': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'LOG_ACTION': { rateLimit: { maxRequests: 200, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'CHECK_QUOTA': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
}

// Write actions that require idempotency
export const WRITE_ACTIONS = new Set([
  'IMPORT_PRODUCT',
  'IMPORT_BULK',
  'AI_OPTIMIZE_TITLE',
  'AI_OPTIMIZE_DESCRIPTION',
  'AI_OPTIMIZE_FULL',
  'AI_GENERATE_SEO',
  'AI_GENERATE_TAGS',
  'SYNC_STOCK',
  'SYNC_PRICE',
])

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const GatewayRequestSchema = z.object({
  action: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  payload: z.record(z.unknown()).optional().default({}),
  metadata: z.object({
    platform: z.string().max(50).optional(),
    url: z.string().url().max(2000).optional(),
    userAgent: z.string().max(500).optional(),
    timestamp: z.string().optional(),
  }).optional().default({}),
})

export type GatewayRequest = z.infer<typeof GatewayRequestSchema>
