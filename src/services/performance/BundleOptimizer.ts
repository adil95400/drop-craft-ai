/**
 * @deprecated Use PerformanceService from @/services/performance/PerformanceService instead
 * This file is kept for backward compatibility only
 */

import { performanceService } from './PerformanceService';

// Re-export the new service as BundleOptimizer for backward compatibility
export const BundleOptimizer = class {
  static getInstance() {
    console.warn('BundleOptimizer is deprecated. Use PerformanceService instead.');
    return performanceService;
  }
};

export const bundleOptimizer = performanceService;