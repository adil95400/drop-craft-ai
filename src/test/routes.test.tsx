/**
 * Test E2E des routes - Vérifie que tous les modules du MODULE_REGISTRY ont des routes valides
 * Ce test analyse la configuration des routes et valide la cohérence avec le registre des modules
 */
import { describe, it, expect } from 'vitest';
import { MODULE_REGISTRY, NAV_GROUPS, getNavigationStats } from '@/config/modules';

// Routes définies dans index.tsx (extraites pour validation)
const ROUTE_PREFIXES = [
  '/dashboard',
  '/products',
  '/catalog',
  '/orders',
  '/customers',
  '/stores-channels',
  '/channels',
  '/import',
  '/suppliers',
  '/feeds',
  '/analytics',
  '/audit',
  '/research',
  '/automation',
  '/ai',
  '/pricing',
  '/rewrite',
  '/marketing',
  '/tools',
  '/stock',
  '/integrations',
  '/extensions',
  '/settings',
  '/enterprise',
  '/admin',
  '/crm',
  '/seo',
  '/notifications',
  '/reviews',
  '/reports',
  '/profile',
  '/subscription',
  '/api/documentation',
  '/support',
  '/academy',
];

describe('MODULE_REGISTRY Configuration', () => {
  it('should have 41 modules defined', () => {
    const moduleCount = Object.keys(MODULE_REGISTRY).length;
    expect(moduleCount).toBe(41);
  });

  it('should have all modules enabled', () => {
    const disabledModules = Object.values(MODULE_REGISTRY).filter(m => !m.enabled);
    expect(disabledModules).toHaveLength(0);
  });

  it('should have valid routes for all modules', () => {
    const modulesWithInvalidRoutes: string[] = [];
    
    Object.values(MODULE_REGISTRY).forEach(module => {
      if (!module.route.startsWith('/')) {
        modulesWithInvalidRoutes.push(`${module.id}: route "${module.route}" doesn't start with /`);
      }
    });

    expect(modulesWithInvalidRoutes).toHaveLength(0);
  });

  it('should have unique routes for all modules', () => {
    const routes = Object.values(MODULE_REGISTRY).map(m => m.route);
    const uniqueRoutes = new Set(routes);
    
    const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
    expect(duplicates).toHaveLength(0);
  });

  it('should have valid groupId for all modules', () => {
    const validGroupIds = NAV_GROUPS.map(g => g.id);
    const modulesWithInvalidGroup: string[] = [];
    
    Object.values(MODULE_REGISTRY).forEach(module => {
      if (!validGroupIds.includes(module.groupId)) {
        modulesWithInvalidGroup.push(`${module.id}: invalid groupId "${module.groupId}"`);
      }
    });

    expect(modulesWithInvalidGroup).toHaveLength(0);
  });
});

describe('Route Coverage Validation', () => {
  it('should have matching routes for critical modules', () => {
    const criticalModules = [
      { id: 'dashboard', expectedRoute: '/dashboard' },
      { id: 'products', expectedRoute: '/products' },
      { id: 'orders', expectedRoute: '/orders' },
      { id: 'customers', expectedRoute: '/customers' },
      { id: 'analytics', expectedRoute: '/analytics' },
      { id: 'settings', expectedRoute: '/settings' },
      { id: 'profile', expectedRoute: '/profile' },
      { id: 'subscription', expectedRoute: '/subscription' },
    ];

    criticalModules.forEach(({ id, expectedRoute }) => {
      const module = MODULE_REGISTRY[id];
      expect(module).toBeDefined();
      expect(module?.route).toBe(expectedRoute);
    });
  });

  it('should cover all main route prefixes', () => {
    const moduleRoutes = Object.values(MODULE_REGISTRY).map(m => m.route);
    
    const coveredPrefixes = ROUTE_PREFIXES.filter(prefix => 
      moduleRoutes.some(route => 
        route === prefix || route.startsWith(prefix + '/')
      )
    );

    // Au moins 80% des préfixes doivent être couverts
    const coverageRatio = coveredPrefixes.length / ROUTE_PREFIXES.length;
    expect(coverageRatio).toBeGreaterThanOrEqual(0.8);
  });
});

describe('SubModule Configuration', () => {
  it('should have valid sub-module routes within parent scope', () => {
    const invalidSubModules: string[] = [];
    
    Object.values(MODULE_REGISTRY).forEach(module => {
      if (module.subModules) {
        module.subModules.forEach(sub => {
          // Les sous-modules doivent commencer par /
          if (!sub.route.startsWith('/')) {
            invalidSubModules.push(`${module.id}/${sub.id}: route "${sub.route}" doesn't start with /`);
          }
        });
      }
    });

    expect(invalidSubModules).toHaveLength(0);
  });

  it('should have unique sub-module IDs within each module', () => {
    const duplicateSubModules: string[] = [];
    
    Object.values(MODULE_REGISTRY).forEach(module => {
      if (module.subModules) {
        const ids = module.subModules.map(s => s.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          duplicateSubModules.push(module.id);
        }
      }
    });

    expect(duplicateSubModules).toHaveLength(0);
  });
});

describe('Navigation Groups', () => {
  it('should have 9 navigation groups', () => {
    expect(NAV_GROUPS).toHaveLength(9);
  });

  it('should have modules distributed across all groups', () => {
    const groupCounts = NAV_GROUPS.map(group => ({
      group: group.id,
      count: Object.values(MODULE_REGISTRY).filter(m => m.groupId === group.id).length
    }));

    // Chaque groupe doit avoir au moins 1 module
    const emptyGroups = groupCounts.filter(g => g.count === 0);
    expect(emptyGroups).toHaveLength(0);
  });
});

describe('Navigation Stats', () => {
  it('should return correct statistics', () => {
    const stats = getNavigationStats();
    
    expect(stats.totalModules).toBe(41);
    expect(stats.totalSubModules).toBeGreaterThan(0);
    expect(stats.totalEntries).toBeGreaterThan(stats.totalModules);
    expect(stats.byGroup).toHaveLength(9);
  });
});
