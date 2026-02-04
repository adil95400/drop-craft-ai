/**
 * Shared Types for Extension Gateway
 * Central type definitions for all handlers
 */

import { z } from "zod"

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
  TIMEOUT: { code: 'TIMEOUT', status: 504, message: 'Request timed out' },
  
  // Import specific
  JOB_CREATE_FAILED: { code: 'JOB_CREATE_FAILED', status: 500, message: 'Failed to create import job' },
  JOB_NOT_FOUND: { code: 'JOB_NOT_FOUND', status: 404, message: 'Import job not found' },
  IMPORT_FAILED: { code: 'IMPORT_FAILED', status: 500, message: 'Product import failed' },
  REVIEWS_UNAVAILABLE: { code: 'REVIEWS_UNAVAILABLE', status: 404, message: 'Reviews not available for this product' },
  
  // Network/External
  NETWORK_ERROR: { code: 'NETWORK_ERROR', status: 502, message: 'External service unavailable' },
  SCRAPE_FAILED: { code: 'SCRAPE_FAILED', status: 502, message: 'Failed to extract product data' },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

// =============================================================================
// ACTION CONFIGURATION
// =============================================================================

export interface ActionConfig {
  rateLimit: { maxRequests: number; windowMinutes: number }
  handler: 'auth' | 'import' | 'ai' | 'sync' | 'utility' | 'scrape' | 'analyze' | 'progressive' | 'reviews'
  requiresToken: boolean
  requiredScope?: string
}

export const ACTION_CONFIG: Record<string, ActionConfig> = {
  // Auth actions
  'AUTH_GENERATE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_VALIDATE_TOKEN': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_REFRESH_TOKEN': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: false, handler: 'auth' },
  'AUTH_REVOKE_TOKEN': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  'AUTH_HEARTBEAT': { rateLimit: { maxRequests: 60, windowMinutes: 60 }, requiresToken: true, handler: 'auth' },
  
  // Product import actions (Backend-First v3.2 with Pipeline Router)
  'IMPORT_PRODUCT': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'import' },
  'IMPORT_PRODUCT_BACKEND': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'import' },
  'IMPORT_PRODUCT_LEGACY': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'import' },
  'IMPORT_BULK': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:bulk', handler: 'import' },
  'IMPORT_BULK_BACKEND': { rateLimit: { maxRequests: 5, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:bulk', handler: 'import' },
  'IMPORT_BULK_LEGACY': { rateLimit: { maxRequests: 10, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:bulk', handler: 'import' },
  'IMPORT_REVIEWS': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'reviews' },
  'REVIEW_JOB_STATUS': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'reviews' },
  'UPSERT_PRODUCT': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:write', handler: 'import' },
  'PUBLISH_TO_STORE': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'store:publish', handler: 'import' },
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
  'GET_IMPORT_JOB': { rateLimit: { maxRequests: 100, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  'GET_PIPELINE_STATUS': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, handler: 'utility' },
  
  // Analyze actions
  'ANALYZE_PRODUCT': { rateLimit: { maxRequests: 30, windowMinutes: 60 }, requiresToken: true, requiredScope: 'analyze:product', handler: 'analyze' },
  'ANALYZE_COMPETITORS': { rateLimit: { maxRequests: 20, windowMinutes: 60 }, requiresToken: true, requiredScope: 'analyze:competitors', handler: 'analyze' },
  'ANALYZE_MARKET': { rateLimit: { maxRequests: 15, windowMinutes: 60 }, requiresToken: true, requiredScope: 'analyze:market', handler: 'analyze' },
  
  // Progressive Import actions (async job-based)
  'IMPORT_PROGRESSIVE': { rateLimit: { maxRequests: 50, windowMinutes: 60 }, requiresToken: true, requiredScope: 'products:import', handler: 'progressive' },
  'JOB_STATUS': { rateLimit: { maxRequests: 200, windowMinutes: 60 }, requiresToken: true, handler: 'progressive' },
}

// Write actions that require idempotency
export const WRITE_ACTIONS = new Set([
  'IMPORT_PRODUCT',
  'IMPORT_PRODUCT_BACKEND',
  'IMPORT_PROGRESSIVE',
  'IMPORT_BULK',
  'IMPORT_BULK_BACKEND',
  'IMPORT_REVIEWS',
  'UPSERT_PRODUCT',
  'PUBLISH_TO_STORE',
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
