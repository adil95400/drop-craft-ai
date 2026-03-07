/**
 * @deprecated — Use `import { logger } from '@/lib/logger'` instead.
 * Thin re-export shim kept for backward compatibility.
 */
import { logger } from '@/lib/logger';

export const productionLogger = {
  debug: (msg: string, data?: unknown, _ctx?: string) => logger.debug(msg, { data }),
  info: (msg: string, data?: unknown, _ctx?: string) => logger.info(msg, { data }),
  warn: (msg: string, data?: unknown, _ctx?: string) => logger.warn(msg, { data }),
  error: (msg: string, error?: Error | unknown, _ctx?: string) => logger.error(msg, error),
  critical: (msg: string, error?: Error | unknown, _ctx?: string) => logger.critical(msg, error),
};

export const logDebug = (msg: string, data?: unknown, ctx?: string) => productionLogger.debug(msg, data, ctx);
export const logInfo = (msg: string, data?: unknown, ctx?: string) => productionLogger.info(msg, data, ctx);
export const logWarn = (msg: string, data?: unknown, ctx?: string) => productionLogger.warn(msg, data, ctx);
export const logError = (msg: string, error?: Error | unknown, ctx?: string) => productionLogger.error(msg, error, ctx);
export const logCritical = (msg: string, error?: Error | unknown, ctx?: string) => productionLogger.critical(msg, error, ctx);
