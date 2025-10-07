import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class LoggingService {
  private sessionId: string;
  private userId?: string;
  private logQueue: LogEntry[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private maxQueueSize: number = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushInterval();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUser(userId: string) {
    this.userId = userId;
    logger.setUser(userId);
  }

  clearUser() {
    this.userId = undefined;
    logger.clearUser();
  }

  private async flushLogs() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      // Store logs in Supabase for analytics
      const { error } = await supabase
        .from('system_logs')
        .insert(
          logsToSend.map(log => ({
            level: log.level,
            message: log.message,
            component: log.component,
            metadata: log.metadata,
            user_id: log.userId,
          }))
        );

      if (error) {
        console.error('Failed to flush logs to Supabase:', error);
      }
    } catch (error) {
      console.error('Error flushing logs:', error);
    }
  }

  private startFlushInterval() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs();
    });
  }

  private addToQueue(entry: LogEntry) {
    this.logQueue.push(entry);
    
    // Auto-flush if queue is too large
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flushLogs();
    }
  }

  debug(message: string, component?: string, metadata?: Record<string, any>) {
    logger.debug(message, { component, metadata });
    
    this.addToQueue({
      level: 'debug',
      message,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  info(message: string, component?: string, metadata?: Record<string, any>) {
    logger.info(message, { component, metadata });
    
    this.addToQueue({
      level: 'info',
      message,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  warn(message: string, component?: string, metadata?: Record<string, any>) {
    logger.warn(message, { component, metadata });
    
    this.addToQueue({
      level: 'warn',
      message,
      component,
      metadata,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  error(message: string, error?: Error, component?: string, metadata?: Record<string, any>) {
    logger.error(message, error, { component, metadata });
    
    this.addToQueue({
      level: 'error',
      message,
      component,
      metadata: {
        ...metadata,
        error: error?.message,
        stack: error?.stack,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  critical(message: string, error?: Error, component?: string, metadata?: Record<string, any>) {
    logger.critical(message, error, { component, metadata });
    
    const entry: LogEntry = {
      level: 'critical',
      message,
      component,
      metadata: {
        ...metadata,
        error: error?.message,
        stack: error?.stack,
      },
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.addToQueue(entry);
    
    // Immediate flush for critical errors
    this.flushLogs();
  }

  // Specialized logging methods
  logApiError(endpoint: string, method: string, error: Error, statusCode?: number) {
    this.error(
      `API Error: ${method} ${endpoint}`,
      error,
      'API',
      { endpoint, method, statusCode }
    );
  }

  logAuthEvent(event: string, success: boolean, metadata?: Record<string, any>) {
    if (success) {
      this.info(`Auth: ${event} succeeded`, 'Auth', metadata);
    } else {
      this.warn(`Auth: ${event} failed`, 'Auth', metadata);
    }
  }

  logDatabaseOperation(operation: string, table: string, success: boolean, duration?: number) {
    const message = `DB ${operation} on ${table} - ${success ? 'success' : 'failed'}`;
    if (success) {
      this.debug(message, 'Database', { operation, table, duration });
    } else {
      this.error(message, undefined, 'Database', { operation, table, duration });
    }
  }

  logUserAction(action: string, component: string, metadata?: Record<string, any>) {
    logger.logUserAction(action, component, metadata);
    
    this.addToQueue({
      level: 'info',
      message: `User action: ${action}`,
      component,
      action,
      metadata,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
    });
  }

  logPerformance(name: string, duration: number, component?: string) {
    this.debug(
      `Performance: ${name} took ${duration.toFixed(2)}ms`,
      component || 'Performance',
      { name, duration }
    );
  }
}

export const loggingService = new LoggingService();
