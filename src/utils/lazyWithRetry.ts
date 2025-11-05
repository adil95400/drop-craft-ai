/**
 * @deprecated Use performanceService.createLazyComponent() instead
 * This file is kept for backward compatibility only
 */

import { ComponentType } from 'react';
import { performanceService } from '@/services/performance/PerformanceService';

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
) {
  console.warn('lazyWithRetry is deprecated. Use performanceService.createLazyComponent() instead.');
  return performanceService.createLazyComponent(componentImport, 'UnknownComponent', retries);
}
