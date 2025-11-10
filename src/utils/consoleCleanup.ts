/**
 * @deprecated Use productionLogger from @/utils/productionLogger instead
 * This file is kept for backward compatibility
 */
import { productionLogger } from './productionLogger';

export const logAction = (action: string, data?: any) => {
  productionLogger.info(action, data);
};

export const logError = (error: string | Error, context?: string) => {
  if (error instanceof Error) {
    productionLogger.error(error.message, error, context);
  } else {
    productionLogger.error(error, undefined, context);
  }
};

export const logWarning = (warning: string, context?: string) => {
  productionLogger.warn(warning, undefined, context);
};