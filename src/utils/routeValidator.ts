import { MODULE_REGISTRY, type ModuleConfig, type SubModule } from '@/config/modules';

interface RouteDefinition {
  path: string;
  exists: boolean;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  category: 'module' | 'sub-module';
  route: string;
  name: string;
  issue: string;
  suggestion?: string;
}

/**
 * Routes définies dans les fichiers de routing
 * Basé sur l'analyse des fichiers CoreRoutes, ProductRoutes, etc.
 */
const DEFINED_ROUTES: Set<string> = new Set([
  // Dashboard / Core
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/settings',
  '/dashboard/parametres',
  '/dashboard/stores',
  '/dashboard/stores/connect',
  '/dashboard/stores/integrations',
  '/dashboard/stores/integrations/:id',
  '/dashboard/orders',
  '/dashboard/orders/center',
  '/dashboard/orders/returns',
  '/dashboard/orders/shipping',
  '/dashboard/customers',
  '/dashboard/sync-manager',
  '/dashboard/marketplace-sync',
  
  // Products
  '/products',
  '/products/:id',
  '/products/publish',
  '/products/catalogue',
  '/products/import',
  '/products/import/quick',
  '/products/import/advanced',
  '/products/import/manage',
  '/products/import/manage/products',
  '/products/import/manage/history',
  '/products/suppliers',
  '/products/suppliers/marketplace',
  '/products/suppliers/manage',
  '/products/suppliers/manage/list',
  '/products/suppliers/manage/connectors',
  '/products/winners',
  '/products/research',
  '/products/ai-marketplace',
  '/products/premium-catalog',
  '/products/premium-network',
  '/products/profit-calculator',
  '/products/bulk-content',
  '/products/inventory-predictor',
  '/products/variants',
  '/products/warehouse',
  '/products/dropshipping-center',
  '/products/vendors',
  
  // Marketing
  '/marketing',
  '/marketing/crm',
  '/marketing/crm/leads',
  '/marketing/crm/activity',
  '/marketing/crm/emails',
  '/marketing/crm/calls',
  '/marketing/crm/calendar',
  '/marketing/seo',
  '/marketing/seo/tools',
  '/marketing/ads',
  '/marketing/ab-testing',
  '/marketing/abandoned-cart',
  '/marketing/affiliate',
  '/marketing/email',
  '/marketing/flash-sales',
  '/marketing/loyalty',
  '/marketing/coupons',
  '/marketing/calendar',
  '/marketing/social-commerce',
  '/marketing/creative-studio',
  '/marketing/content-generation',
  '/marketing/seo/keywords',
  '/marketing/seo/rank-tracker',
  '/marketing/seo/schema',
  
  // Analytics
  '/analytics',
  '/analytics/advanced',
  '/analytics/studio',
  '/analytics/ai-intelligence',
  '/analytics/customer-intelligence',
  '/analytics/global-intelligence',
  '/analytics/competitor-analysis',
  '/analytics/competitive-comparison',
  '/analytics/price-monitoring',
  '/analytics/reports',
  '/analytics/profit-analytics',
  '/analytics/business-intelligence',
  '/analytics/customer-segmentation',
  '/analytics/product-intelligence',
  
  // Automation
  '/automation',
  '/automation/studio',
  '/automation/ai-hub',
  '/automation/ai',
  '/automation/ai-studio',
  '/automation/fulfillment',
  '/automation/fulfillment/dashboard',
  '/automation/optimization',
  '/automation/feed-optimization',
  '/automation/stock-sync',
  '/automation/sourcing-assistant',
  '/automation/workflow-builder',
  '/automation/price-optimization',
  '/automation/pricing-automation',
  '/automation/recommendations',
  '/automation/dynamic-pricing',
  
  // Integrations
  '/integrations',
  '/integrations/hub',
  '/integrations/settings',
  '/integrations/marketplace',
  '/integrations/marketplace/hub',
  '/integrations/marketplace/integrations',
  '/integrations/marketplace/feed-manager',
  '/integrations/marketplace/multi-store',
  '/integrations/extensions',
  '/integrations/extensions/hub',
  '/integrations/extensions/api',
  '/integrations/extensions/chrome-config',
  '/integrations/api/developer',
  '/integrations/api/documentation',
  '/integrations/support',
  '/integrations/support/live-chat',
  '/integrations/support/qa',
  '/integrations/academy',
  '/integrations/academy/course/:id',
  '/integrations/content',
  
  // Enterprise
  '/enterprise/commerce',
  '/enterprise/multi-tenant',
  '/enterprise/multi-tenant/management',
  '/enterprise/monitoring',
  '/enterprise/monitoring/advanced',
  '/enterprise/platform',
  '/enterprise/status',
  '/enterprise/tax',
  '/enterprise/team',
  '/enterprise/i18n',
  '/enterprise/quotas',
  '/enterprise/subscriptions',
  '/enterprise/compliance',
  
  // Admin
  '/admin',
  '/admin/products',
  '/admin/orders',
  '/admin/import',
  '/admin/suppliers',
  '/admin/customers',
  '/admin/crm',
  '/admin/analytics',
  '/admin/monitoring',
  '/admin/marketing',
  '/admin/blog',
  '/admin/seo',
  '/admin/ai',
  '/admin/ai-studio',
  '/admin/automation',
  '/admin/automation-studio',
  '/admin/analytics-studio',
  '/admin/security',
  '/admin/integrations',
  '/admin/subscriptions',
  '/admin/extensions',
  '/admin/video-tutorials',
  '/admin/super',
  '/admin/stores',
  '/admin/catalog',
  '/admin/users',
]);

/**
 * Valide qu'une route existe dans les définitions
 */
function validateRoute(route: string): boolean {
  // Vérification exacte
  if (DEFINED_ROUTES.has(route)) {
    return true;
  }
  
  // Vérification avec paramètres dynamiques
  const routeWithoutParams = route.replace(/\/:[^/]+/g, '/:id');
  if (DEFINED_ROUTES.has(routeWithoutParams)) {
    return true;
  }
  
  return false;
}

/**
 * Valide tous les modules
 */
function validateModules(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  Object.values(MODULE_REGISTRY).forEach((module: ModuleConfig) => {
    if (!validateRoute(module.route)) {
      issues.push({
        type: 'error',
        category: 'module',
        route: module.route,
        name: module.name,
        issue: `Route non définie dans les fichiers de routing`,
        suggestion: `Vérifier les fichiers de routing (CoreRoutes, ProductRoutes, etc.) et ajouter la route manquante`
      });
    }
  });
  
  return issues;
}

/**
 * Valide tous les sous-modules
 */
function validateSubModules(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  Object.values(MODULE_REGISTRY).forEach((module) => {
    if (module.subModules) {
      module.subModules.forEach((subModule: SubModule) => {
        if (!validateRoute(subModule.route)) {
          issues.push({
            type: 'error',
            category: 'sub-module',
            route: subModule.route,
            name: subModule.name,
            issue: `Route non définie dans les fichiers de routing`,
            suggestion: `Parent: ${module.id} - Vérifier que la route existe dans le fichier de routing approprié`
          });
        }
      });
    }
  });
  
  return issues;
}

/**
 * Exécute la validation complète des routes
 */
export function validateAllRoutes(): {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalModules: number;
    totalSubModules: number;
    errors: number;
    warnings: number;
  };
} {
  const moduleIssues = validateModules();
  const subModuleIssues = validateSubModules();
  const allIssues = [...moduleIssues, ...subModuleIssues];
  
  const errors = allIssues.filter(i => i.type === 'error').length;
  const warnings = allIssues.filter(i => i.type === 'warning').length;
  
  const totalModules = Object.keys(MODULE_REGISTRY).length;
  const totalSubModules = Object.values(MODULE_REGISTRY).reduce(
    (sum, module) => sum + (module.subModules?.length || 0),
    0
  );
  
  return {
    isValid: errors === 0,
    issues: allIssues,
    summary: {
      totalModules,
      totalSubModules,
      errors,
      warnings
    }
  };
}

/**
 * Affiche les résultats de validation dans la console
 */
export function logValidationResults(results: ReturnType<typeof validateAllRoutes>): void {
  console.group('🔍 Validation des Routes');
  
  console.log(`📊 Résumé:`);
  console.log(`  - Modules: ${results.summary.totalModules}`);
  console.log(`  - Sous-modules: ${results.summary.totalSubModules}`);
  console.log(`  - Erreurs: ${results.summary.errors}`);
  console.log(`  - Avertissements: ${results.summary.warnings}`);
  
  if (results.isValid) {
    console.log('✅ Toutes les routes sont valides!');
  } else {
    console.error('❌ Des erreurs ont été détectées dans la configuration des routes');
    
    results.issues.forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : '⚠️';
      const categoryLabel = issue.category === 'module' ? 'MODULE' : 'SUB-MODULE';
      
      console.group(`${icon} ${index + 1}. [${categoryLabel}] ${issue.name}`);
      console.log(`Route: ${issue.route}`);
      console.log(`Problème: ${issue.issue}`);
      if (issue.suggestion) {
        console.log(`💡 Suggestion: ${issue.suggestion}`);
      }
      console.groupEnd();
    });
  }
  
  console.groupEnd();
}
