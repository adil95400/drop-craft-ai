/**
 * Gestionnaire centralisé des redirections legacy
 * Source unique de vérité — Consolidé (legacy-redirects.ts fusionné ici)
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Toutes les redirections legacy en un seul endroit
 * Organisées par domaine pour la lisibilité
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  // ── Dashboard ──
  '/dashboard-super': '/dashboard',
  '/dashboard-classic': '/dashboard',
  '/dashboard/super': '/dashboard',
  '/dashboard/classic': '/dashboard',
  '/dashboardbilling': '/dashboard/billing',
  '/modern': '/dashboard',
  '/unified-dashboard': '/dashboard',
  '/home-optimized': '/dashboard',

  // ── Profile & Subscription ──
  '/subscription-dashboard': '/subscription',

  // ── Products (FR aliases) ──
  '/catalogue': '/products/catalogue',
  '/my-products': '/products',
  '/produits': '/products',
  '/produits/creer': '/products/create',

  // ── Orders ──
  '/orders-center': '/orders',
  '/dashboard/orders': '/orders',
  '/dashboard/orders/center': '/orders',
  '/commandes': '/orders',
  '/commandes/creer': '/orders/create',
  '/commandes/masse': '/orders/bulk',
  '/commandes/fulfillment': '/orders/fulfillment',

  // ── Fulfillment ──
  '/fulfillment': '/automation/fulfillment',
  '/fulfillment/carriers': '/orders/fulfillment',
  '/fulfillment/rules': '/orders/fulfillment',
  '/fulfillment/dashboard': '/orders/fulfillment',
  '/auto-fulfillment': '/automation/fulfillment',
  '/suivi-colis': '/automation/tracking',
  '/tracking': '/automation/tracking',

  // ── Customers (FR aliases) ──
  '/customers-page': '/customers',
  '/dashboard/customers': '/customers',
  '/clients': '/customers',
  '/clients/creer': '/customers/create',
  '/clients/segmentation': '/customers/segmentation',

  // ── Stores & Channels ──
  '/dashboard/stores': '/stores-channels',
  '/stores': '/stores-channels',

  // ── Settings ──
  '/dashboard/settings': '/settings',
  '/parametres': '/settings',
  '/profil': '/profile',
  '/abonnement': '/subscription',

  // ── Analytics ──
  '/advanced-analytics': '/analytics',
  '/statistiques': '/analytics',
  '/rapports': '/reports',

  // ── Automation ──
  '/ai-automation': '/automation/ai-hub',

  // ── CRM ──
  '/crm-prospects': '/crm/leads',
  '/marketing/crm': '/crm',
  '/marketing/crm/leads': '/crm/leads',
  '/marketing/crm/emails': '/crm/emails',
  '/marketing/crm/calls': '/crm/calls',
  '/marketing/crm/calendar': '/crm/calendar',
  '/marketing/crm/activity': '/crm/activity',
  '/marketing/crm/pipeline': '/crm/pipeline',
  '/marketing/crm/scoring': '/crm/scoring',

  // ── SEO (moved under marketing) ──
  '/seo': '/marketing/seo',
  '/seo/rank-tracker': '/marketing/seo/rank-tracker',
  '/seo/keywords': '/marketing/seo/keywords',
  '/seo/keyword-research': '/marketing/seo/keywords',
  '/seo/schema-generator': '/marketing/seo/schema',
  '/seo/schema': '/marketing/seo/schema',
  '/seo/competitor-analysis': '/marketing/seo',
  '/seo/analytics': '/marketing/seo',
  '/seo/tools': '/marketing/seo/tools',
  '/seo-ultra-pro': '/marketing/seo',

  // ── Marketing (FR aliases) ──
  '/publicites': '/marketing/ads',
  '/promotions': '/marketing/promotions',

  // ── Notifications (FR aliases) ──
  '/alertes': '/notifications',

  // ── Suppliers (FR aliases) ──
  '/fournisseurs': '/suppliers',
  '/fournisseurs/moteur': '/suppliers/engine',
  '/fournisseurs/catalogue': '/suppliers/catalog',
  '/fournisseurs/mes-fournisseurs': '/suppliers/my',
  '/fournisseurs/analytics': '/suppliers/analytics',
  '/fournisseurs/b2b': '/suppliers/b2b',
  '/marketplace-fournisseurs': '/suppliers/marketplace',

  // ── Import (FR aliases) ──
  '/import/historique': '/import/history',
  '/import/planifies': '/import/scheduled',
  '/import/configuration': '/import/config',
  '/import/masse': '/import/bulk',
  '/import/rapide': '/import/autods',
  '/import/simplified': '/import',

  // ── Attributes / Enrichment ──
  '/attributes': '/catalog/attributes',
  '/enrichment/settings': '/catalog/attributes',
  '/enrichment': '/catalog/attributes',

  // ── Help Center (FR) ──
  '/centre-d-aide': '/help-center',
  '/centre-d-aide/documentation': '/help-center/documentation',

  // ── Stock (FR aliases) ──
  '/inventory': '/stock',
  '/inventaire': '/stock',

  // ── Repricing ──
  '/repricing': '/pricing-manager/repricing',

  // ── API ──
  '/swagger': '/api/documentation',
  '/api-docs': '/api/documentation',

  // ── Plugins & Extensions ──
  '/plugins': '/extensions',
  '/mobile': '/extensions',

  // ── Admin ──
  '/admin-panel': '/admin',
  '/supplier-admin': '/admin/suppliers',

  // ── Marketplace ──
  '/marketplace-hub': '/integrations/marketplace/hub',
  '/marketplace-sync': '/integrations/marketplace/sync',
  '/feed-manager': '/feeds',

  // ── Monitoring ──
  '/observability': '/admin/monitoring',
};

/**
 * Wildcard redirect patterns (prefix matching)
 */
const WILDCARD_PATTERNS = [
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
] as const;

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
    if (LEGACY_REDIRECTS[path]) {
      navigate(LEGACY_REDIRECTS[path], { replace: true });
      return;
    }

    // Check wildcard patterns
    for (const { pattern, redirect } of WILDCARD_PATTERNS) {
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
  return { ...LEGACY_REDIRECTS };
}
