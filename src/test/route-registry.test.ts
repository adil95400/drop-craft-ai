import { describe, it, expect } from 'vitest';

describe('Route Registry Integrity', () => {
  it('should export ROUTES_REGISTRY array', async () => {
    const { ROUTES_REGISTRY } = await import('@/config/routesRegistry');
    expect(Array.isArray(ROUTES_REGISTRY)).toBe(true);
    expect(ROUTES_REGISTRY.length).toBeGreaterThan(10);
  });

  it('should not have duplicate paths', async () => {
    const { ROUTES_REGISTRY } = await import('@/config/routesRegistry');
    const paths = ROUTES_REGISTRY.map((r: any) => r.path);
    const uniquePaths = [...new Set(paths)];
    expect(paths.length).toBe(uniquePaths.length);
  });

  it('all routes should have required fields', async () => {
    const { ROUTES_REGISTRY } = await import('@/config/routesRegistry');
    for (const route of ROUTES_REGISTRY) {
      expect(route.path, 'path missing').toBeDefined();
      expect(route.category, `category missing for ${route.path}`).toBeDefined();
      expect(route.description, `description missing for ${route.path}`).toBeDefined();
    }
  });
});
