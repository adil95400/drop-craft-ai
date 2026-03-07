/**
 * @deprecated — Use `import { logger } from '@/lib/logger'` instead.
 * Thin re-export shim kept for backward compatibility.
 */
import { logger } from '@/lib/logger';

export const productionLogger = logger;
export const logDebug = (msg: string, data?: unknown, _ctx?: string) => logger.debug(msg, { data });
export const logInfo = (msg: string, data?: unknown, _ctx?: string) => logger.info(msg, { data });
export const logWarn = (msg: string, data?: unknown, _ctx?: string) => logger.warn(msg, { data });
export const logError = (msg: string, error?: Error | unknown, _ctx?: string) => logger.error(msg, error);
export const logCritical = (msg: string, error?: Error | unknown, _ctx?: string) => logger.critical(msg, error);
