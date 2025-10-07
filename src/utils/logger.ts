import * as Sentry from "@sentry/react";

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;
  private userId?: string;

  setUser(userId: string, email?: string, role?: string) {
    this.userId = userId;
    if (this.isProduction && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser({ id: userId, email, role });
    }
  }

  clearUser() {
    this.userId = undefined;
    if (this.isProduction && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.setUser(null);
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : '';
    const action = context?.action ? `[${context.action}]` : '';
    return `${timestamp} [${level.toUpperCase()}] ${component}${action} ${message}`;
  }

  private sendToSentry(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.isProduction || !import.meta.env.VITE_SENTRY_DSN) return;

    const sentryContext = {
      level: level as Sentry.SeverityLevel,
      tags: {
        component: context?.component,
        action: context?.action,
      },
      extra: {
        ...context?.metadata,
        userId: this.userId,
      }
    };

    if (error) {
      Sentry.captureException(error, sentryContext);
    } else {
      Sentry.captureMessage(message, sentryContext);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context), context?.metadata);
    }
  }

  info(message: string, context?: LogContext) {
    const formatted = this.formatMessage(LogLevel.INFO, message, context);
    if (this.isDevelopment) {
      console.info(formatted, context?.metadata);
    }
    this.sendToSentry(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage(LogLevel.WARN, message, context);
    console.warn(formatted, context?.metadata);
    this.sendToSentry(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const formatted = this.formatMessage(LogLevel.ERROR, message, context);
    console.error(formatted, error, context?.metadata);
    this.sendToSentry(LogLevel.ERROR, message, context, error);
  }

  critical(message: string, error?: Error, context?: LogContext) {
    const formatted = this.formatMessage(LogLevel.CRITICAL, message, context);
    console.error(`🚨 ${formatted}`, error, context?.metadata);
    this.sendToSentry(LogLevel.CRITICAL, message, context, error);
  }

  // Performance monitoring
  startPerformanceMeasure(name: string) {
    if (this.isDevelopment) {
      performance.mark(`${name}-start`);
    }
  }

  endPerformanceMeasure(name: string, context?: LogContext) {
    if (this.isDevelopment) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name)[0];
        this.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`, context);
      } catch (e) {
        // Ignore measurement errors
      }
    }
  }

  // API call logging
  logApiCall(endpoint: string, method: string, duration: number, status: number, context?: LogContext) {
    const message = `API ${method} ${endpoint} - ${status} (${duration}ms)`;
    if (status >= 500) {
      this.error(message, undefined, { ...context, metadata: { endpoint, method, duration, status } });
    } else if (status >= 400) {
      this.warn(message, { ...context, metadata: { endpoint, method, duration, status } });
    } else {
      this.debug(message, { ...context, metadata: { endpoint, method, duration, status } });
    }
  }

  // User action tracking
  logUserAction(action: string, component: string, metadata?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      component,
      action,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    });
  }

  // Business event logging
  logBusinessEvent(event: string, data?: Record<string, any>) {
    this.info(`Business event: ${event}`, {
      action: event,
      metadata: data
    });
  }
}

export const logger = new Logger();
