/**
 * Mapping des anciennes routes vers les nouvelles
 * Consolidé v8.0 - Source unique de vérité pour les redirections legacy
 * Note: Les redirections étendues sont dans LegacyRedirectsHandler.tsx
 */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  // Dashboard
  '/dashboard-super': '/dashboard',
  '/dashboard-classic': '/dashboard',
  
  // Products
  '/catalogue': '/products/catalogue',
  '/my-products': '/products',
  '/produits': '/products',
  
  // Orders
  '/orders-center': '/orders',
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
  
  // Marketing
  '/crm-prospects': '/marketing/crm/leads',
  '/seo-ultra-pro': '/marketing/seo',
  
  // Stock
  '/inventory': '/stock',
  
  // Tracking
  '/tracking': '/orders',
  
  // Plugins & Extensions
  '/plugins': '/extensions',
  '/mobile': '/extensions',
  
  // Admin
  '/admin-panel': '/admin',
  '/supplier-admin': '/admin/suppliers',
  
  // API
  '/api-docs': '/api/documentation',
  
  // Academy
  '/academy': '/academy',
  
  // Marketplace
  '/marketplace-hub': '/integrations/marketplace/hub',
  '/marketplace-sync': '/integrations/marketplace/sync',
  '/feed-manager': '/feeds',
  
  // Monitoring
  '/observability': '/admin/monitoring',
  '/monitoring': '/monitoring',
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
