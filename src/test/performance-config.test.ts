import { describe, it, expect } from 'vitest';
import { PERFORMANCE_CONFIG, CACHE_STRATEGIES } from '@/config/performanceOptimizations';

describe('Performance Config', () => {
  it('should have valid staleTime values', () => {
    expect(PERFORMANCE_CONFIG.queryClient.defaultOptions.queries.staleTime).toBeGreaterThan(0);
    expect(PERFORMANCE_CONFIG.queryClient.defaultOptions.queries.gcTime).toBeGreaterThan(
      PERFORMANCE_CONFIG.queryClient.defaultOptions.queries.staleTime
    );
  });

  it('should have reasonable network timeout', () => {
    expect(PERFORMANCE_CONFIG.network.timeout).toBeGreaterThanOrEqual(10000);
    expect(PERFORMANCE_CONFIG.network.timeout).toBeLessThanOrEqual(60000);
  });

  it('should have valid cache strategies', () => {
    for (const [name, strategy] of Object.entries(CACHE_STRATEGIES)) {
      expect(strategy.staleTime, `${name}.staleTime`).toBeGreaterThan(0);
      expect(strategy.gcTime, `${name}.gcTime`).toBeGreaterThanOrEqual(strategy.staleTime);
    }
  });
});
