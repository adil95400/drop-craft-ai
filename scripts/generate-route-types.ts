/**
 * Script de génération automatique des types de routes TypeScript
 * Garantit la cohérence entre la configuration des modules et les routes réelles
 */

import { MODULE_REGISTRY } from '../src/config/modules';
import { SUB_MODULES_REGISTRY } from '../src/config/sub-modules';
import * as fs from 'fs';
import * as path from 'path';

// Routes définies dans les fichiers de routing
const DEFINED_ROUTES = {
  core: [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/settings',
    '/dashboard/stores',
    '/dashboard/stores/connect',
    '/dashboard/stores/integrations',
    '/dashboard/orders',
    '/dashboard/orders/center',
    '/dashboard/orders/returns',
    '/dashboard/orders/shipping',
    '/dashboard/customers',
    '/dashboard/sync-manager',
    '/dashboard/marketplace-sync',
  ],
  product: [
    '/products',
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
  ],
  analytics: [
    '/analytics',
    '/analytics/advanced',
    '/analytics/reports',
    '/analytics/customer-intelligence',
    '/analytics/competitive-comparison',
  ],
  automation: [
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
  ],
  marketing: [
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
  ],
  integrations: [
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
    '/integrations/content',
  ],
  enterprise: [
    '/enterprise/commerce',
    '/enterprise/multi-tenant',
    '/enterprise/monitoring',
  ],
  admin: [
    '/admin',
    '/admin/suppliers',
    '/admin/security',
  ],
};

interface RouteIssue {
  moduleId: string;
  moduleName: string;
  configuredRoute: string;
  actualRoute?: string;
  type: 'missing' | 'mismatch';
  suggestion: string;
}

function getAllDefinedRoutes(): string[] {
  return Object.values(DEFINED_ROUTES).flat();
}

function validateModules() {
  const issues: RouteIssue[] = [];
  const allRoutes = getAllDefinedRoutes();

  // Vérifier tous les modules
  Object.values(MODULE_REGISTRY).forEach(module => {
    if (!allRoutes.includes(module.route)) {
      // Chercher une route similaire
      const similarRoute = allRoutes.find(r => 
        r.toLowerCase().includes(module.id.toLowerCase()) ||
        module.route.toLowerCase().includes(r.split('/').pop()?.toLowerCase() || '')
      );

      issues.push({
        moduleId: module.id,
        moduleName: module.name,
        configuredRoute: module.route,
        actualRoute: similarRoute,
        type: similarRoute ? 'mismatch' : 'missing',
        suggestion: similarRoute 
          ? `Mettre à jour la route vers "${similarRoute}"`
          : `Créer la route "${module.route}" dans le fichier de routing approprié`
      });
    }
  });

  // Vérifier tous les sous-modules
  Object.entries(SUB_MODULES_REGISTRY).forEach(([parentId, subModules]) => {
    subModules.forEach(subModule => {
      if (!allRoutes.includes(subModule.route)) {
        const similarRoute = allRoutes.find(r => 
          r.includes(parentId) && r.toLowerCase().includes(subModule.id.toLowerCase())
        );

        issues.push({
          moduleId: `${parentId}.${subModule.id}`,
          moduleName: `${parentId} > ${subModule.name}`,
          configuredRoute: subModule.route,
          actualRoute: similarRoute,
          type: similarRoute ? 'mismatch' : 'missing',
          suggestion: similarRoute 
            ? `Mettre à jour la route vers "${similarRoute}"`
            : `Créer la route "${subModule.route}" dans le fichier de routing approprié`
        });
      }
    });
  });

  return issues;
}

function generateRouteTypes() {
  const allRoutes = getAllDefinedRoutes();
  
  // Générer le type des routes
  const routeType = allRoutes.map(r => `  | '${r}'`).join('\n');
  
  const typeDefinition = `/**
 * Types de routes générés automatiquement
 * ⚠️ NE PAS MODIFIER MANUELLEMENT - Généré par scripts/generate-route-types.ts
 */

export type AppRoute = 
${routeType};

/**
 * Vérifier si une route existe
 */
export function isValidRoute(route: string): route is AppRoute {
  const validRoutes: AppRoute[] = [
${allRoutes.map(r => `    '${r}',`).join('\n')}
  ];
  return validRoutes.includes(route as AppRoute);
}

/**
 * Obtenir toutes les routes disponibles
 */
export function getAllRoutes(): AppRoute[] {
  return [
${allRoutes.map(r => `    '${r}',`).join('\n')}
  ];
}

/**
 * Routes par catégorie
 */
export const ROUTES_BY_CATEGORY = ${JSON.stringify(DEFINED_ROUTES, null, 2)};
`;

  return typeDefinition;
}

function generateReport() {
  console.log('🔍 Validation des routes...\n');
  
  const issues = validateModules();
  const types = generateRouteTypes();

  // Sauvegarder les types générés
  const typesPath = path.join(__dirname, '../src/types/routes.ts');
  fs.mkdirSync(path.dirname(typesPath), { recursive: true });
  fs.writeFileSync(typesPath, types);
  console.log(`✅ Types générés: ${typesPath}\n`);

  // Afficher le rapport
  if (issues.length === 0) {
    console.log('✅ Toutes les routes sont valides!\n');
  } else {
    console.log(`❌ ${issues.length} problème(s) détecté(s):\n`);
    
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.moduleName}`);
      console.log(`   ID: ${issue.moduleId}`);
      console.log(`   Route configurée: ${issue.configuredRoute}`);
      if (issue.actualRoute) {
        console.log(`   Route réelle: ${issue.actualRoute}`);
      }
      console.log(`   Type: ${issue.type === 'missing' ? '🔴 Route manquante' : '⚠️  Route incorrecte'}`);
      console.log(`   💡 ${issue.suggestion}\n`);
    });

    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, '../route-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
    console.log(`📄 Rapport sauvegardé: ${reportPath}\n`);
  }

  return issues.length;
}

// Exécuter la génération
const errorCount = generateReport();
process.exit(errorCount > 0 ? 1 : 0);
