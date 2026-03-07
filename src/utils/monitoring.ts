/**
 * @deprecated — Use `import { logger } from '@/lib/logger'` instead.
 * Thin re-export shim kept for backward compatibility.
 */
import { logger } from '@/lib/logger';

class MonitoringShim {
  setUserId(userId: string) { logger.setUser(userId); }
  debug(message: string, data?: unknown) { logger.debug(message, { data }); }
  info(message: string, data?: unknown) { logger.info(message, { data }); }
  warn(message: string, data?: unknown) { logger.warn(message, { data }); }
  error(message: string, data?: unknown) { logger.error(message, data instanceof Error ? data : undefined, { data }); }
  logError(message: string, error: unknown) { logger.error(message, error); }
  trackEvent(eventName: string, properties?: Record<string, unknown>) {
    logger.info(`Event: ${eventName}`, { ...properties });
    if (import.meta.env.VITE_GA_TRACKING_ID && (window as any).gtag) {
      (window as any).gtag('event', eventName, properties);
    }
  }
  measurePerformance(name: string, fn: () => Promise<unknown> | unknown) {
    const start = performance.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.finally(() => {
          logger.debug(`Performance: ${name}`, { duration: `${(performance.now() - start).toFixed(2)}ms` });
        });
      }
      logger.debug(`Performance: ${name}`, { duration: `${(performance.now() - start).toFixed(2)}ms` });
      return result;
    } catch (error) {
      logger.error(`Performance Error: ${name}`, error);
      throw error;
    }
  }
}

export const monitoring = new MonitoringShim();
export const logDebug = (message: string, data?: unknown) => logger.debug(message, { data });
export const logInfo = (message: string, data?: unknown) => logger.info(message, { data });
export const logWarn = (message: string, data?: unknown) => logger.warn(message, { data });
export const logError = (message: string, data?: unknown) => logger.error(message, data instanceof Error ? data : undefined, { data });
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => monitoring.trackEvent(eventName, properties);
export const logComponentError = (componentName: string, error: unknown) => logger.error(`Component error in ${componentName}`, error);
