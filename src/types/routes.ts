/**
 * Types de routes générés automatiquement
 * Synchronisé avec modules.ts et sub-modules.ts
 * Routes uniformisées sans préfixe /dashboard/
 */

export type AppRoute = 
  | '/dashboard'
  | '/profile'
  | '/settings'
  | '/subscription'
  | '/stores-channels'
  | '/stores-channels/connect'
  | '/stores-channels/integrations'
  | '/orders'
  | '/orders/center'
  | '/orders/returns'
  | '/fulfillment'
  | '/customers'
  | '/sync-manager'
  | '/marketplace-sync'
  | '/products'
  | '/products/publish'
  | '/products/catalogue'
  | '/products/import'
  | '/products/import/quick'
  | '/products/import/advanced'
  | '/products/import/manage'
  | '/products/import/manage/products'
  | '/products/import/manage/history'
  | '/products/suppliers'
  | '/products/suppliers/marketplace'
  | '/products/suppliers/manage'
  | '/products/suppliers/manage/list'
  | '/products/suppliers/manage/connectors'
  | '/products/winners'
  | '/products/research'
  | '/products/ai-marketplace'
  | '/products/premium-catalog'
  | '/products/premium-network'
  | '/products/profit-calculator'
  | '/products/bulk-content'
  | '/products/inventory-predictor'
  | '/products/variants'
  | '/products/warehouse'
  | '/products/dropshipping-center'
  | '/products/vendors'
  | '/analytics'
  | '/analytics/advanced'
  | '/analytics/reports'
  | '/analytics/customer-intelligence'
  | '/analytics/competitive-comparison'
  | '/automation'
  | '/automation/studio'
  | '/automation/ai-hub'
  | '/automation/ai'
  | '/automation/ai-studio'
  | '/automation/fulfillment'
  | '/automation/fulfillment/dashboard'
  | '/automation/optimization'
  | '/automation/feed-optimization'
  | '/automation/stock-sync'
  | '/automation/sourcing-assistant'
  | '/automation/workflow-builder'
  | '/automation/price-optimization'
  | '/automation/pricing-automation'
  | '/automation/recommendations'
  | '/automation/dynamic-pricing'
  | '/marketing'
  | '/marketing/crm'
  | '/marketing/crm/leads'
  | '/marketing/crm/activity'
  | '/marketing/crm/emails'
  | '/marketing/crm/calls'
  | '/marketing/crm/calendar'
  | '/marketing/seo'
  | '/marketing/seo/tools'
  | '/marketing/ads'
  | '/marketing/ab-testing'
  | '/marketing/abandoned-cart'
  | '/marketing/affiliate'
  | '/marketing/email'
  | '/marketing/flash-sales'
  | '/marketing/loyalty'
  | '/marketing/coupons'
  | '/marketing/calendar'
  | '/marketing/social-commerce'
  | '/marketing/creative-studio'
  | '/marketing/content-generation'
  | '/marketing/seo/keywords'
  | '/marketing/seo/rank-tracker'
  | '/marketing/seo/schema'
  | '/integrations'
  | '/integrations/hub'
  | '/integrations/settings'
  | '/integrations/marketplace'
  | '/integrations/marketplace/hub'
  | '/integrations/marketplace/integrations'
  | '/integrations/marketplace/feed-manager'
  | '/integrations/marketplace/multi-store'
  | '/integrations/extensions'
  | '/integrations/extensions/hub'
  | '/integrations/extensions/api'
  | '/integrations/extensions/chrome-config'
  | '/integrations/api/developer'
  | '/integrations/api/documentation'
  | '/integrations/support'
  | '/integrations/support/live-chat'
  | '/integrations/support/qa'
  | '/integrations/academy'
  | '/integrations/content'
  | '/extensions'
  | '/extensions/marketplace'
  | '/extensions/cli'
  | '/extensions/developer'
  | '/extensions/white-label'
  | '/extensions/sso'
  | '/enterprise/commerce'
  | '/enterprise/multi-tenant'
  | '/enterprise/monitoring'
  | '/admin'
  | '/admin/suppliers'
  | '/admin/security';

/**
 * Vérifier si une route existe
 */
export function isValidRoute(route: string): route is AppRoute {
  const validRoutes: AppRoute[] = [
    '/dashboard',
    '/profile',
    '/settings',
    '/subscription',
    '/stores-channels',
    '/stores-channels/connect',
    '/stores-channels/integrations',
    '/orders',
    '/orders/center',
    '/orders/returns',
    '/fulfillment',
    '/customers',
    '/sync-manager',
    '/marketplace-sync',
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
    '/analytics',
    '/analytics/advanced',
    '/analytics/reports',
    '/analytics/customer-intelligence',
    '/analytics/competitive-comparison',
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
    '/extensions',
    '/extensions/marketplace',
    '/extensions/cli',
    '/extensions/developer',
    '/extensions/white-label',
    '/extensions/sso',
    '/enterprise/commerce',
    '/enterprise/multi-tenant',
    '/enterprise/monitoring',
    '/admin',
    '/admin/suppliers',
    '/admin/security',
  ];
  return validRoutes.includes(route as AppRoute);
}

/**
 * Obtenir toutes les routes disponibles
 */
export function getAllRoutes(): AppRoute[] {
  return [
    '/dashboard',
    '/profile',
    '/settings',
    '/subscription',
    '/stores-channels',
    '/stores-channels/connect',
    '/stores-channels/integrations',
    '/orders',
    '/orders/center',
    '/orders/returns',
    '/fulfillment',
    '/customers',
    '/sync-manager',
    '/marketplace-sync',
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
    '/analytics',
    '/analytics/advanced',
    '/analytics/reports',
    '/analytics/customer-intelligence',
    '/analytics/competitive-comparison',
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
    '/extensions',
    '/extensions/marketplace',
    '/extensions/cli',
    '/extensions/developer',
    '/extensions/white-label',
    '/extensions/sso',
    '/enterprise/commerce',
    '/enterprise/multi-tenant',
    '/enterprise/monitoring',
    '/admin',
    '/admin/suppliers',
    '/admin/security',
  ];
}
