/**
 * Mapping des anciennes routes vers les nouvelles
 * Utilisé pour maintenir la compatibilité avec les anciens liens
 */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  // Dashboard variants
  '/dashboard-super': '/dashboard',
  '/dashboard-classic': '/dashboard',
  '/dashboard-ultra-pro': '/dashboard',
  
  // Products
  '/catalogue': '/products/catalogue',
  '/catalogue-ultra-pro': '/products/catalogue',
  '/catalogue-ultra-pro-advanced': '/products/catalogue',
  '/my-products': '/products',
  
  // Import - All import routes redirect to products/import
  '/import': '/products/import',
  '/import/quick': '/products/import/quick',
  '/import/advanced': '/products/import/advanced',
  '/import/manage': '/products/import/manage',
  '/import/manage/products': '/products/import/manage/products',
  '/import/manage/history': '/products/import/manage/history',
  '/import-advanced': '/products/import/advanced',
  '/import-ultra-pro': '/products/import/advanced',
  
  // Orders - Routes uniformisées
  '/orders-ultra-pro': '/orders',
  '/orders-center': '/orders/center',
  '/dashboard/orders': '/orders',
  '/dashboard/orders/center': '/orders/center',
  '/dashboard/orders/returns': '/orders/returns',
  '/dashboard/orders/shipping': '/fulfillment',
  
  // Customers - Routes uniformisées
  '/customers-page': '/customers',
  '/dashboard/customers': '/customers',
  
  // Settings - Routes uniformisées
  '/dashboard/settings': '/settings',
  '/dashboard/settings/api': '/settings/api',
  
  // Stores - Routes uniformisées
  '/dashboard/stores': '/stores-channels',
  '/dashboard/stores/connect': '/stores-channels/connect',
  '/dashboard/stores/integrations': '/stores-channels/integrations',
  
  // Analytics
  '/analytics-ultra-pro': '/analytics/advanced',
  '/advanced-analytics': '/analytics/advanced',
  
  // Automation
  '/automation-ultra-pro': '/automation',
  '/ai-automation': '/automation/ai-hub',
  
  // CRM
  '/crm-ultra-pro': '/marketing/crm',
  '/crm-prospects': '/marketing/crm/leads',
  
  // SEO
  '/seo-ultra-pro': '/marketing/seo',
  
  // Marketing
  '/marketing-ultra-pro': '/marketing',
  
  // Inventory
  '/inventory-ultra-pro': '/products/inventory-predictor',
  '/stock': '/automation/stock-sync',
  
  // Tracking - Routes uniformisées
  '/tracking-ultra-pro': '/orders/tracking',
  '/tracking': '/orders/tracking',
  
  // Reviews
  '/reviews-ultra-pro': '/marketing/crm',
  '/reviews': '/marketing/crm',
  
  // Plugins
  '/plugins-ultra-pro': '/integrations/extensions',
  '/plugins': '/integrations/extensions',
  
  // Mobile
  '/mobile-ultra-pro': '/integrations/extensions',
  '/mobile': '/integrations/extensions',
  
  // Admin & Enterprise
  '/admin-panel': '/admin/dashboard',
  '/supplier-admin': '/admin/suppliers',
  '/multi-tenant-management': '/admin/multi-tenant/management',
  '/platform-management': '/admin/platform',
  
  // API
  '/api-docs': '/integrations/api/documentation',
  '/api-developer': '/integrations/api/developer',
  
  // Support
  '/support-ultra-pro': '/integrations/support',
  '/academy': '/integrations/academy',
  
  // Marketplace
  '/marketplace-hub': '/integrations/marketplace/hub',
  '/marketplace-sync': '/marketplace-sync',
  '/dashboard/marketplace-sync': '/marketplace-sync',
  '/feed-manager': '/integrations/marketplace/feed-manager',
  
  // Extensions
  '/extension-ultra-pro': '/integrations/extensions',
  '/extensions-hub': '/integrations/extensions',
  '/extension-api': '/integrations/extensions/api',
  
  // Observability
  '/observability': '/admin/monitoring',
  '/monitoring': '/admin/monitoring',
  '/performance-monitoring': '/admin/monitoring',
  '/advanced-monitoring': '/admin/monitoring/advanced',
  
  // Security
  '/security-ultra-pro': '/admin/security',
  
  // Integrations
  '/integrations-ultra-pro': '/integrations',
};

/**
 * Fonction helper pour obtenir la nouvelle route depuis une ancienne
 */
export function getLegacyRedirect(oldPath: string): string | null {
  return LEGACY_ROUTE_REDIRECTS[oldPath] || null;
}

/**
 * Fonction pour vérifier si un chemin est une ancienne route
 */
export function isLegacyRoute(path: string): boolean {
  return path in LEGACY_ROUTE_REDIRECTS;
}
