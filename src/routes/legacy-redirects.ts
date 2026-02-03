/**
 * Mapping des anciennes routes vers les nouvelles
 * Consolidé v7.0 - Réduction de 128 à ~40 redirects essentiels
 */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  // Dashboard - Toutes les variantes vers /dashboard
  '/dashboard-super': '/dashboard',
  '/dashboard-classic': '/dashboard',
  
  // Products - Consolidation catalogue
  '/catalogue': '/products/catalogue',
  '/my-products': '/products',
  
  // Import - Vers /products/import
  '/import': '/products/import',
  '/import/quick': '/products/import/quick',
  '/import/advanced': '/products/import/advanced',
  
  // Orders - Routes uniformisées
  '/orders-center': '/orders/center',
  '/dashboard/orders': '/orders',
  '/fulfillment': '/orders/fulfillment',
  
  // Customers
  '/customers-page': '/customers',
  '/dashboard/customers': '/customers',
  
  // Settings
  '/dashboard/settings': '/settings',
  
  // Stores & Channels
  '/dashboard/stores': '/stores-channels',
  
  // Analytics
  '/advanced-analytics': '/analytics/advanced',
  
  // Automation
  '/ai-automation': '/automation/ai-hub',
  
  // Marketing (CRM, SEO fusionnés)
  '/crm-prospects': '/marketing/crm/leads',
  '/seo-ultra-pro': '/marketing/seo',
  
  // Inventory & Stock
  '/stock': '/automation/stock-sync',
  
  // Tracking
  '/tracking': '/orders/tracking',
  
  // Reviews → Marketing CRM
  '/reviews': '/marketing/crm',
  
  // Plugins & Extensions
  '/plugins': '/integrations/extensions',
  '/mobile': '/integrations/extensions',
  
  // Admin & Enterprise
  '/admin-panel': '/admin/dashboard',
  '/supplier-admin': '/admin/suppliers',
  '/multi-tenant-management': '/admin/multi-tenant/management',
  
  // API
  '/api-docs': '/integrations/api/documentation',
  
  // Support & Academy
  '/academy': '/integrations/academy',
  
  // Marketplace
  '/marketplace-hub': '/integrations/marketplace/hub',
  '/marketplace-sync': '/marketplace-sync',
  '/feed-manager': '/integrations/marketplace/feed-manager',
  
  // Monitoring
  '/observability': '/admin/monitoring',
  '/monitoring': '/admin/monitoring',
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

/**
 * Nombre total de redirections legacy
 */
export const LEGACY_REDIRECT_COUNT = Object.keys(LEGACY_ROUTE_REDIRECTS).length;
