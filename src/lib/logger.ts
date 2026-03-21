/**
 * Centralized Logger — Single source of truth for all application logging
 * 
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User loaded', { userId: '123' })
 *   logger.error('API failure', error, { endpoint: '/api/products' })
 * 
 * In production:
 *   - debug/info logs are suppressed (zero console output)
 *   - warn/error/critical are sent to Sentry
 * In development:
 *   - All levels are printed to console with structured formatting
 */
// Lazy Sentry reference — loaded async to prevent blank pages if @sentry/react fails
let SentryRef: any = null;
import('@sentry/react').then(m => { SentryRef = m; }).catch(() => { /* Sentry unavailable */ });

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogMeta {
  [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#9ca3af',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
};

class AppLogger {
  private isDev = import.meta.env.DEV;
  private isProd = import.meta.env.PROD;
  private minLevel: LogLevel = this.isDev ? 'debug' : 'warn';
  private userId?: string;

  /** Set the current user for Sentry context */
  setUser(userId: string, email?: string) {
    this.userId = userId;
    if (this.isProd && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser({ id: userId, email });
    }
  }

  /** Clear user context */
  clearUser() {
    this.userId = undefined;
    if (this.isProd && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser(null);
    }
  }

  /** Debug — dev only, never reaches Sentry */
  debug(message: string, meta?: LogMeta) {
    this.log('debug', message, undefined, meta);
  }

  /** Informational — dev only, never reaches Sentry */
  info(message: string, meta?: LogMeta) {
    this.log('info', message, undefined, meta);
  }

  /** Warning — visible in dev, sent to Sentry in prod */
  warn(message: string, meta?: LogMeta) {
    this.log('warn', message, undefined, meta);
  }

  /** Error — always visible, sent to Sentry in prod */
  error(message: string, error?: Error | unknown, meta?: LogMeta) {
    const err = error instanceof Error ? error : undefined;
    this.log('error', message, err, { ...meta, rawError: error instanceof Error ? undefined : error });
  }

  /** Critical — always visible, immediately sent to Sentry */
  critical(message: string, error?: Error | unknown, meta?: LogMeta) {
    const err = error instanceof Error ? error : undefined;
    this.log('critical', message, err, { ...meta, rawError: error instanceof Error ? undefined : error });
  }

  /** Log an API call with structured metadata */
  logApiCall(endpoint: string, method: string, duration: number, status: number, meta?: LogMeta) {
    const message = `API ${method} ${endpoint} — ${status} (${duration}ms)`;
    if (status >= 500) {
      this.error(message, undefined, { ...meta, endpoint, method, duration, status });
    } else if (status >= 400) {
      this.warn(message, { ...meta, endpoint, method, duration, status });
    } else {
      this.debug(message, { ...meta, endpoint, method, duration, status });
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private log(level: LogLevel, message: string, error?: Error, meta?: LogMeta) {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return;

    // Dev: structured console output
    if (this.isDev) {
      this.devOutput(level, message, error, meta);
    }

    // Prod: route warn+ to Sentry
    if (this.isProd && LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY['warn']) {
      this.sendToSentry(level, message, error, meta);
    }
  }

  private devOutput(level: LogLevel, message: string, error?: Error, meta?: LogMeta) {
    const color = LOG_LEVEL_COLORS[level];
    const tag = level.toUpperCase().padEnd(8);
    const prefix = `%c[${tag}]`;
    const style = `color: ${color}; font-weight: bold;`;

    const args: unknown[] = [prefix, style, message];
    if (meta && Object.keys(meta).length > 0) args.push(meta);
    if (error) args.push(error);

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(...args);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(...args);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(...args);
        break;
      case 'error':
      case 'critical':
        // eslint-disable-next-line no-console
        console.error(...args);
        break;
    }
  }

  private sendToSentry(level: LogLevel, message: string, error?: Error, meta?: LogMeta) {
    if (!import.meta.env.VITE_SENTRY_DSN) return;

    const sentryLevel = level === 'critical' ? 'fatal' : level;
    const context = {
      level: sentryLevel as Sentry.SeverityLevel,
      extra: { ...meta, userId: this.userId },
    };

    if (error) {
      Sentry.captureException(error, context);
    } else {
      Sentry.captureMessage(message, context);
    }
  }
}

/** Singleton logger instance — import and use everywhere */
export const logger = new AppLogger();
