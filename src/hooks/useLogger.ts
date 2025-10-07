import { useCallback, useEffect, useRef } from 'react';
import { loggingService } from '@/services/LoggingService';
import { logger } from '@/utils/logger';

export const useLogger = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    logger.debug(`${componentName} mounted`, { component: componentName });
    
    return () => {
      const duration = Date.now() - mountTime.current;
      logger.debug(`${componentName} unmounted after ${duration}ms`, { 
        component: componentName,
        metadata: { duration }
      });
    };
  }, [componentName]);

  const logAction = useCallback((action: string, metadata?: Record<string, any>) => {
    loggingService.logUserAction(action, componentName, metadata);
  }, [componentName]);

  const logError = useCallback((message: string, error?: Error, metadata?: Record<string, any>) => {
    loggingService.error(message, error, componentName, metadata);
  }, [componentName]);

  const logWarning = useCallback((message: string, metadata?: Record<string, any>) => {
    loggingService.warn(message, componentName, metadata);
  }, [componentName]);

  const logInfo = useCallback((message: string, metadata?: Record<string, any>) => {
    loggingService.info(message, componentName, metadata);
  }, [componentName]);

  const logDebug = useCallback((message: string, metadata?: Record<string, any>) => {
    loggingService.debug(message, componentName, metadata);
  }, [componentName]);

  const measurePerformance = useCallback(<T,>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> => {
    const startTime = performance.now();
    logger.startPerformanceMeasure(`${componentName}-${name}`);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        logger.endPerformanceMeasure(`${componentName}-${name}`, { component: componentName });
        loggingService.logPerformance(name, duration, componentName);
      });
    } else {
      const duration = performance.now() - startTime;
      logger.endPerformanceMeasure(`${componentName}-${name}`, { component: componentName });
      loggingService.logPerformance(name, duration, componentName);
      return Promise.resolve(result);
    }
  }, [componentName]);

  return {
    logAction,
    logError,
    logWarning,
    logInfo,
    logDebug,
    measurePerformance,
  };
};
