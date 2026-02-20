interface LogLevel {
  DEBUG: 'debug'
  INFO: 'info'  
  WARN: 'warn'
  ERROR: 'error'
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn', 
  ERROR: 'error'
}

interface LogEvent {
  level: keyof LogLevel
  message: string
  data?: any
  timestamp: string
  userId?: string
  sessionId?: string
}

class MonitoringService {
  private sessionId: string
  private userId?: string
  private isProduction: boolean
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.isProduction = import.meta.env.PROD
    this.setupErrorHandling()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError('Global Error', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Unhandled promise rejection handler  
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      })
    })
  }

  private createLogEvent(level: keyof LogLevel, message: string, data?: any): LogEvent {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    if (!this.isProduction) return true
    
    // In production, only log warn and error by default
    const logLevel = import.meta.env.VITE_LOG_LEVEL || 'warn'
    
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levelPriority[level] >= levelPriority[logLevel as keyof typeof levelPriority]
  }

  private sendToRemote(logEvent: LogEvent) {
    // Only send critical events via Sentry in production
    if (this.isProduction && (logEvent.level === 'ERROR' || logEvent.level === 'WARN')) {
      try {
        // Sentry captures errors automatically via its integration
        // This is a no-op placeholder for future remote logging services
        if (import.meta.env.DEV) {
          console.log('[Remote Log]', logEvent.level, logEvent.message)
        }
      } catch {
        // Fail silently for logging errors
      }
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('DEBUG')) return
    
    const logEvent = this.createLogEvent('DEBUG', message, data)
    console.log(`[DEBUG] ${message}`, data)
    this.sendToRemote(logEvent)
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('INFO')) return
    
    const logEvent = this.createLogEvent('INFO', message, data)
    console.info(`[INFO] ${message}`, data)
    this.sendToRemote(logEvent)
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('WARN')) return
    
    const logEvent = this.createLogEvent('WARN', message, data)
    console.warn(`[WARN] ${message}`, data)
    this.sendToRemote(logEvent)
  }

  error(message: string, data?: any) {
    const logEvent = this.createLogEvent('ERROR', message, data)
    console.error(`[ERROR] ${message}`, data)
    this.sendToRemote(logEvent)
  }

  logError(message: string, error: any) {
    this.error(message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
  }

  // Business event tracking
  trackEvent(eventName: string, properties?: Record<string, any>) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.href
      }
    }

    this.info(`Event: ${eventName}`, event)

    // Send to analytics service
    if (import.meta.env.VITE_GA_TRACKING_ID && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties)
    }
  }

  // Performance monitoring
  measurePerformance(name: string, fn: () => Promise<any> | any) {
    const start = performance.now()
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          this.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` })
        })
      } else {
        const duration = performance.now() - start
        this.info(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms` })
        return result
      }
    } catch (error) {
      const duration = performance.now() - start
      this.error(`Performance Error: ${name}`, { 
        duration: `${duration.toFixed(2)}ms`, 
        error 
      })
      throw error
    }
  }
}

// Global monitoring instance
export const monitoring = new MonitoringService()

// Convenience functions
export const logDebug = (message: string, data?: any) => monitoring.debug(message, data)
export const logInfo = (message: string, data?: any) => monitoring.info(message, data)
export const logWarn = (message: string, data?: any) => monitoring.warn(message, data)
export const logError = (message: string, data?: any) => monitoring.error(message, data)
export const trackEvent = (eventName: string, properties?: Record<string, any>) => monitoring.trackEvent(eventName, properties)

// Note: Real Error Boundary is implemented via Sentry.withErrorBoundary in main.tsx
// This export is kept for backward compatibility but delegates to monitoring.logError
export const logComponentError = (componentName: string, error: unknown) => {
  monitoring.logError(`Component error in ${componentName}`, error)
}