/**
 * Structured Logger v1.0
 * 
 * Provides consistent, structured logging for all edge functions.
 * All logs include: timestamp, request_id, user_id, action, duration, level.
 */

import { GatewayContext } from '../types.ts'

// =============================================================================
// TYPES
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  request_id: string
  user_id: string | null
  action: string
  message: string
  duration_ms?: number
  error_code?: string
  error_message?: string
  metadata?: Record<string, unknown>
  trace_id?: string
  span_id?: string
}

export interface LoggerOptions {
  minLevel?: LogLevel
  enableConsole?: boolean
  enableDatabase?: boolean
}

// =============================================================================
// LOG LEVEL PRIORITY
// =============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

// =============================================================================
// STRUCTURED LOGGER CLASS
// =============================================================================

export class StructuredLogger {
  private ctx: GatewayContext
  private action: string
  private minLevel: LogLevel
  private enableConsole: boolean
  private enableDatabase: boolean
  private spans: Map<string, number> = new Map()

  constructor(ctx: GatewayContext, action: string, options: LoggerOptions = {}) {
    this.ctx = ctx
    this.action = action
    this.minLevel = options.minLevel || 'info'
    this.enableConsole = options.enableConsole !== false
    this.enableDatabase = options.enableDatabase || false
  }

  // ==========================================================================
  // PUBLIC LOGGING METHODS
  // ==========================================================================

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata)
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorMeta = this.extractErrorMetadata(error)
    this.log('error', message, { ...metadata, ...errorMeta })
  }

  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    const errorMeta = this.extractErrorMetadata(error)
    this.log('fatal', message, { ...metadata, ...errorMeta })
  }

  // ==========================================================================
  // SPAN TRACKING (for timing sub-operations)
  // ==========================================================================

  startSpan(spanName: string): void {
    this.spans.set(spanName, Date.now())
    this.debug(`Span started: ${spanName}`)
  }

  endSpan(spanName: string, metadata?: Record<string, unknown>): number {
    const startTime = this.spans.get(spanName)
    if (!startTime) {
      this.warn(`Span not found: ${spanName}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.spans.delete(spanName)
    this.info(`Span completed: ${spanName}`, { ...metadata, span_duration_ms: duration })
    return duration
  }

  // ==========================================================================
  // REQUEST LIFECYCLE LOGGING
  // ==========================================================================

  logRequestStart(payload?: Record<string, unknown>): void {
    this.info('Request started', {
      extension_id: this.ctx.extensionId,
      extension_version: this.ctx.extensionVersion,
      user_plan: this.ctx.userPlan,
      payload_size: payload ? JSON.stringify(payload).length : 0,
    })
  }

  logRequestSuccess(data?: unknown): void {
    const durationMs = Date.now() - this.ctx.startTime
    this.info('Request completed successfully', {
      duration_ms: durationMs,
      has_data: data !== null && data !== undefined,
    })
  }

  logRequestError(code: string, message: string, details?: Record<string, unknown>): void {
    const durationMs = Date.now() - this.ctx.startTime
    this.error(`Request failed: ${message}`, undefined, {
      error_code: code,
      duration_ms: durationMs,
      ...details,
    })
  }

  // ==========================================================================
  // SPECIALIZED LOGGING METHODS
  // ==========================================================================

  logSecurity(event: string, details: Record<string, unknown>): void {
    this.warn(`Security event: ${event}`, {
      security_event: event,
      ...details,
    })
  }

  logIdempotency(status: 'new' | 'cached' | 'in_progress', key: string): void {
    this.info(`Idempotency check: ${status}`, {
      idempotency_key: key,
      idempotency_status: status,
    })
  }

  logAntiReplay(allowed: boolean, requestId: string): void {
    if (allowed) {
      this.debug('Anti-replay check passed', { request_id: requestId })
    } else {
      this.warn('Anti-replay: duplicate request detected', {
        request_id: requestId,
        blocked: true,
      })
    }
  }

  logRateLimit(allowed: boolean, remaining: number, action: string): void {
    if (allowed) {
      this.debug('Rate limit check passed', { remaining, action })
    } else {
      this.warn('Rate limit exceeded', {
        action,
        remaining: 0,
        blocked: true,
      })
    }
  }

  logDatabaseOperation(
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
    table: string,
    success: boolean,
    rowCount?: number,
    error?: string
  ): void {
    if (success) {
      this.debug(`DB ${operation} on ${table}`, {
        db_operation: operation,
        db_table: table,
        row_count: rowCount,
      })
    } else {
      this.error(`DB ${operation} failed on ${table}`, undefined, {
        db_operation: operation,
        db_table: table,
        db_error: error,
      })
    }
  }

  logExternalCall(
    service: string,
    endpoint: string,
    statusCode: number,
    durationMs: number
  ): void {
    const isSuccess = statusCode >= 200 && statusCode < 300
    const level = isSuccess ? 'info' : 'warn'
    this.log(level, `External call to ${service}`, {
      external_service: service,
      external_endpoint: endpoint,
      status_code: statusCode,
      call_duration_ms: durationMs,
    })
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    // Check minimum level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      request_id: this.ctx.requestId,
      user_id: this.ctx.userId,
      action: this.action,
      message,
      duration_ms: Date.now() - this.ctx.startTime,
      metadata,
    }

    // Console output
    if (this.enableConsole) {
      this.writeToConsole(entry)
    }

    // Database logging (async, non-blocking)
    if (this.enableDatabase && LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY['warn']) {
      this.writeToDatabase(entry).catch(() => {
        // Silently fail - don't let logging break the main flow
      })
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const prefix = `[${entry.action}]`
    const requestInfo = `(req:${entry.request_id.slice(0, 8)})`
    const durationInfo = entry.duration_ms ? `[${entry.duration_ms}ms]` : ''

    const logLine = `${prefix} ${requestInfo} ${durationInfo} ${entry.message}`
    const metaStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : ''

    switch (entry.level) {
      case 'debug':
        console.debug(logLine + metaStr)
        break
      case 'info':
        console.log(logLine + metaStr)
        break
      case 'warn':
        console.warn(logLine + metaStr)
        break
      case 'error':
      case 'fatal':
        console.error(logLine + metaStr)
        break
    }
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    try {
      await this.ctx.supabase.from('gateway_logs').insert({
        request_id: entry.request_id,
        user_id: entry.user_id,
        action: entry.action,
        level: entry.level,
        message: entry.message,
        duration_ms: entry.duration_ms,
        error_code: entry.metadata?.error_code,
        metadata: entry.metadata,
      })
    } catch {
      // Ignore - logging should never break the main flow
    }
  }

  private extractErrorMetadata(error: Error | unknown): Record<string, unknown> {
    if (!error) return {}

    if (error instanceof Error) {
      return {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      }
    }

    return { error_value: String(error) }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createLogger(
  ctx: GatewayContext,
  action: string,
  options?: LoggerOptions
): StructuredLogger {
  return new StructuredLogger(ctx, action, options)
}

// =============================================================================
// QUICK LOGGING HELPERS (for use without context)
// =============================================================================

export function quickLog(level: LogLevel, action: string, message: string, metadata?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const logLine = `[${action}] ${message}`
  const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : ''

  switch (level) {
    case 'debug':
      console.debug(`[${timestamp}] DEBUG: ${logLine}${metaStr}`)
      break
    case 'info':
      console.log(`[${timestamp}] INFO: ${logLine}${metaStr}`)
      break
    case 'warn':
      console.warn(`[${timestamp}] WARN: ${logLine}${metaStr}`)
      break
    case 'error':
    case 'fatal':
      console.error(`[${timestamp}] ERROR: ${logLine}${metaStr}`)
      break
  }
}
