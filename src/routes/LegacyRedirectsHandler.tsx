/**
 * Gestionnaire centralisé des redirections legacy
 * Évite de polluer le router principal avec des dizaines de <Navigate />
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LEGACY_ROUTE_REDIRECTS } from './legacy-redirects';

// Extended redirects for cleanup
const EXTENDED_REDIRECTS: Record<string, string> = {
  ...LEGACY_ROUTE_REDIRECTS,
  
  // Dashboard legacy
  '/dashboard/super': '/dashboard',
  '/dashboard/classic': '/dashboard',
  '/dashboardbilling': '/dashboard/billing',
  '/modern': '/dashboard',
  '/unified-dashboard': '/dashboard',
  '/home-optimized': '/dashboard',
  
  // Profile & Subscription
  '/subscription-dashboard': '/subscription',
  
  // Orders
  '/dashboard/orders/center': '/orders',
  
  
  // Stores
  '/stores': '/stores-channels',
  
  // CRM (legacy marketing/crm redirects to /crm)
  '/marketing/crm': '/crm',
  '/marketing/crm/leads': '/crm/leads',
  '/marketing/crm/emails': '/crm/emails',
  '/marketing/crm/calls': '/crm/calls',
  '/marketing/crm/calendar': '/crm/calendar',
  '/marketing/crm/activity': '/crm/activity',
  '/marketing/crm/pipeline': '/crm/pipeline',
  '/marketing/crm/scoring': '/crm/scoring',
  
  // SEO  
  '/seo': '/marketing/seo',
  '/seo/rank-tracker': '/marketing/seo/rank-tracker',
  '/seo/keywords': '/marketing/seo/keywords',
  '/seo/keyword-research': '/marketing/seo/keywords',
  '/seo/schema-generator': '/marketing/seo/schema',
  '/seo/schema': '/marketing/seo/schema',
  '/seo/competitor-analysis': '/marketing/seo',
  '/seo/analytics': '/marketing/seo',
  '/seo/tools': '/marketing/seo/tools',
  
  // Attributes
  '/attributes': '/catalog/attributes',
  
  // API
  '/swagger': '/api/documentation',
  
  // Fulfillment (already handled by orders routes)
  '/fulfillment/carriers': '/orders/fulfillment',
  '/fulfillment/rules': '/orders/fulfillment',
  '/fulfillment/dashboard': '/orders/fulfillment',
  
  // Suppliers (French aliases)
  '/fournisseurs': '/suppliers',
  '/fournisseurs/moteur': '/suppliers/engine',
  '/fournisseurs/catalogue': '/suppliers/catalog',
  '/fournisseurs/mes-fournisseurs': '/suppliers/my',
  '/fournisseurs/analytics': '/suppliers/analytics',
  '/fournisseurs/b2b': '/suppliers/b2b',
  
  // Help Center (French)
  '/centre-d-aide': '/help-center',
  '/centre-d-aide/documentation': '/help-center/documentation',
  
  // Import (French aliases)
  '/import/historique': '/import/history',
  '/import/planifies': '/import/scheduled',
  '/import/configuration': '/import/config',
  '/import/masse': '/import/bulk',
  '/import/rapide': '/import/autods',
  '/import/simplified': '/import',
  
  // Products (French aliases)
  '/produits': '/products',
  '/produits/creer': '/products/create',
  
  // Orders (French aliases)
  '/commandes': '/orders',
  '/commandes/creer': '/orders/create',
  '/commandes/masse': '/orders/bulk',
  '/commandes/fulfillment': '/orders/fulfillment',
  
  // Customers (French aliases)
  '/clients': '/customers',
  '/clients/creer': '/customers/create',
  '/clients/segmentation': '/customers/segmentation',
  
  // Stock (French aliases)
  '/inventaire': '/stock',
  
  // Analytics (French aliases)
  '/statistiques': '/analytics',
  '/rapports': '/reports',
  
  // Marketing (French aliases)
  '/publicites': '/marketing/ads',
  '/promotions': '/marketing/promotions',
  
  // Settings (French aliases)
  '/parametres': '/settings',
  '/profil': '/profile',
  '/abonnement': '/subscription',
  
  // Notifications (French aliases)
  '/alertes': '/notifications',
  
  // Fulfillment & Tracking (French aliases)
  '/fulfillment': '/automation/fulfillment',
  '/auto-fulfillment': '/automation/fulfillment',
  '/suivi-colis': '/automation/tracking',
  '/tracking': '/automation/tracking',
  
  // Marketplace fournisseurs
  '/marketplace-fournisseurs': '/suppliers/marketplace',
  
  // Enrichment
  '/enrichment/settings': '/catalog/attributes',
  '/enrichment': '/catalog/attributes',
  
  // Repricing
  '/repricing': '/pricing-manager/repricing',
};

/**
 * Hook to handle legacy redirects automatically
 * Use this in the router to catch old URLs
 */
export function useLegacyRedirect(): boolean {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const path = location.pathname;
    const redirect = EXTENDED_REDIRECTS[path];
    
    if (redirect) {
      navigate(redirect, { replace: true });
    }
  }, [location.pathname, navigate]);
  
  return location.pathname in EXTENDED_REDIRECTS;
}

/**
 * Component that handles legacy redirects
 * Place at the top of your route tree
 */
export function LegacyRedirectHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const path = location.pathname;
    
    // Check exact match first
    if (EXTENDED_REDIRECTS[path]) {
      navigate(EXTENDED_REDIRECTS[path], { replace: true });
      return;
    }
    
    // Check wildcard patterns
    const wildcardPatterns = [
      { pattern: '/dashboard/orders/', redirect: '/orders/' },
      { pattern: '/dashboard/customers/', redirect: '/customers/' },
      { pattern: '/dashboard/stores/', redirect: '/stores-channels/' },
      { pattern: '/dashboard/settings/', redirect: '/settings/' },
      { pattern: '/stores/', redirect: '/stores-channels/' },
      { pattern: '/marketing/crm/', redirect: '/crm/' },
      { pattern: '/produits/', redirect: '/products/' },
      { pattern: '/fournisseurs/', redirect: '/suppliers/' },
      { pattern: '/attributes/', redirect: '/catalog/attributes/' },
      { pattern: '/seo/', redirect: '/marketing/seo/' },
      { pattern: '/modern/', redirect: '/dashboard' },
      { pattern: '/commandes/', redirect: '/orders/' },
      { pattern: '/clients/', redirect: '/customers/' },
    ];
    
    for (const { pattern, redirect } of wildcardPatterns) {
      if (path.startsWith(pattern)) {
        const newPath = path.replace(pattern, redirect);
        navigate(newPath, { replace: true });
        return;
      }
    }
  }, [location.pathname, navigate]);
  
  return <>{children}</>;
}

/**
 * Get all redirect entries for reference
 */
export function getAllRedirects(): Record<string, string> {
  return { ...EXTENDED_REDIRECTS };
}
