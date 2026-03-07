/**
 * @deprecated — Use `import { logger } from '@/lib/logger'` instead.
 * This file re-exports the canonical logger for backward compatibility.
 */
import { logger } from '@/lib/logger';

export { logger };
export type { LogLevel, LogMeta as LogContext } from '@/lib/logger';
export { LogLevel as LogLevelEnum } from '@/lib/logger';
