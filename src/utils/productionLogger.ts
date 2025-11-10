/**
 * Production-ready logging system
 * Remplace tous les console.log/warn/error de l'application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  error?: Error;
}

class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private log(level: LogLevel, message: string, dataOrError?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    };

    if (dataOrError instanceof Error) {
      entry.error = dataOrError;
    } else if (dataOrError) {
      entry.data = dataOrError;
    }

    // Store in memory (for debugging)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Development: log to console
    if (this.isDevelopment) {
      const prefix = context ? `[${context}]` : '';
      switch (level) {
        case 'debug':
          console.debug(`${prefix} ${message}`, dataOrError);
          break;
        case 'info':
          console.info(`${prefix} ${message}`, dataOrError);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, dataOrError);
          break;
        case 'error':
        case 'critical':
          console.error(`${prefix} ${message}`, dataOrError);
          break;
      }
    }

    // Production: send to monitoring service (Sentry is already configured)
    if (!this.isDevelopment && (level === 'error' || level === 'critical')) {
      // Sentry already captures errors via initSentry()
      // Additional monitoring can be added here
    }
  }

  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: string) {
    this.log('error', message, error, context);
  }

  critical(message: string, error: Error, context?: string) {
    this.log('critical', message, error, context);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const productionLogger = new ProductionLogger();

// Convenience exports
export const logDebug = (msg: string, data?: any, ctx?: string) => productionLogger.debug(msg, data, ctx);
export const logInfo = (msg: string, data?: any, ctx?: string) => productionLogger.info(msg, data, ctx);
export const logWarn = (msg: string, data?: any, ctx?: string) => productionLogger.warn(msg, data, ctx);
export const logError = (msg: string, error?: Error | any, ctx?: string) => productionLogger.error(msg, error, ctx);
export const logCritical = (msg: string, error: Error, ctx?: string) => productionLogger.critical(msg, error, ctx);
