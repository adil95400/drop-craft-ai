/**
 * Registre centralisé de toutes les routes de l'application
 * Source de vérité unique — synchronisé avec src/routes/index.tsx
 * 
 * Consolidation S3 — Nettoyé, routes obsolètes supprimées, flags corrigés
 */

export type RouteGroup = 'core' | 'analytics' | 'automation' | 'marketing' | 'ai' | 'enterprise' | 'tools' | 'settings' | 'public';

export interface RouteConfig {
  path: string;
  protected: boolean;
  adminOnly?: boolean;
  category: RouteGroup;
  description: string;
  implemented: boolean;
  label?: string;
  icon?: string;
  redirectTo?: string;
}

export const ROUTES_REGISTRY: RouteConfig[] = [
  // ===== PUBLIC =====
  { path: '/', protected: false, category: 'public', description: 'Page d\'accueil', implemented: true },
  { path: '/auth', protected: false, category: 'public', description: 'Authentification', implemented: true },
  { path: '/pricing', protected: false, category: 'public', description: 'Tarifs', implemented: true },
  { path: '/features', protected: false, category: 'public', description: 'Fonctionnalités', implemented: true },
  { path: '/about', protected: false, category: 'public', description: 'À propos', implemented: true },
  { path: '/contact', protected: false, category: 'public', description: 'Contact', implemented: true },
  { path: '/faq', protected: false, category: 'public', description: 'FAQ', implemented: true },
  { path: '/store', protected: false, category: 'public', description: 'Boutique Shopify', implemented: true },
  { path: '/academy', protected: false, category: 'public', description: 'Académie', implemented: true },
  { path: '/guides/getting-started', protected: false, category: 'public', description: 'Guide démarrage', implemented: true },

  // ===== CORE =====
  { path: '/dashboard', protected: true, category: 'core', description: 'Tableau de bord', implemented: true },
  { path: '/products', protected: true, category: 'core', description: 'Produits', implemented: true },
  { path: '/orders', protected: true, category: 'core', description: 'Commandes', implemented: true },
  { path: '/customers', protected: true, category: 'core', description: 'Clients', implemented: true },
  { path: '/suppliers', protected: true, category: 'core', description: 'Fournisseurs', implemented: true },
  { path: '/stock', protected: true, category: 'core', description: 'Stock', implemented: true },
  { path: '/catalog', protected: true, category: 'core', description: 'Catalogue', implemented: true },
  { path: '/crm', protected: true, category: 'core', description: 'CRM', implemented: true },
  { path: '/notifications', protected: true, category: 'core', description: 'Notifications', implemented: true },
  { path: '/alerts', protected: true, category: 'core', description: 'Centre d\'alertes', implemented: true },
  { path: '/reports', protected: true, category: 'core', description: 'Rapports', implemented: true },

  // ===== ANALYTICS =====
  { path: '/analytics', protected: true, category: 'analytics', description: 'Analytics principal', implemented: true },
  { path: '/analytics/predictive', protected: true, category: 'analytics', description: 'Analytique prédictive', implemented: true },
  { path: '/analytics/competitive', protected: true, category: 'analytics', description: 'Analyse concurrentielle', implemented: true },
  { path: '/analytics/real-data', protected: true, category: 'analytics', description: 'Données réelles', implemented: true },
  { path: '/analytics/bi', protected: true, category: 'analytics', description: 'Business Intelligence', implemented: true },
  { path: '/analytics/bi-advanced', protected: true, category: 'analytics', description: 'BI avancée', implemented: true },
  { path: '/analytics/performance', protected: true, category: 'analytics', description: 'Performance', implemented: true },
  { path: '/analytics/interactive', protected: true, category: 'analytics', description: 'Analytics interactif', implemented: true },
  { path: '/analytics/forecasting', protected: true, category: 'analytics', description: 'Prévisions', implemented: true },
  { path: '/analytics/reports', protected: true, category: 'analytics', description: 'Rapports analytics', implemented: true },
  { path: '/intelligence/bi', protected: true, category: 'analytics', description: 'Hub BI', implemented: true },

  // ===== AUTOMATION =====
  { path: '/automation', protected: true, category: 'automation', description: 'Automatisation', implemented: true },
  { path: '/automation/studio', protected: true, category: 'automation', description: 'Workflow Studio', implemented: true },
  { path: '/automation/history', protected: true, category: 'automation', description: 'Historique workflows', implemented: true },
  { path: '/automation/fulfillment', protected: true, category: 'automation', description: 'Auto-fulfillment', implemented: true },
  { path: '/automation/tracking', protected: true, category: 'automation', description: 'Suivi automatique', implemented: true },
  { path: '/automation/promotions', protected: true, category: 'automation', description: 'Promotions auto', implemented: true },

  // ===== AI =====
  { path: '/ai', protected: true, category: 'ai', description: 'Hub IA', implemented: true },
  { path: '/ai/assistant', protected: true, category: 'ai', description: 'Assistant IA', implemented: true },
  { path: '/ai/content', protected: true, category: 'ai', description: 'Génération de contenu', implemented: true },
  { path: '/ai/catalog', protected: true, category: 'ai', description: 'Intelligence catalogue', implemented: true },
  { path: '/ai/optimization', protected: true, category: 'ai', description: 'Optimisation IA', implemented: true },
  { path: '/ai/auto-actions', protected: true, category: 'ai', description: 'Actions automatiques', implemented: true },
  { path: '/ai/snapshots', protected: true, category: 'ai', description: 'Snapshots enrichissement', implemented: true },

  // ===== MARKETING =====
  { path: '/marketing', protected: true, category: 'marketing', description: 'Marketing', implemented: true },
  { path: '/marketing/ads', protected: true, category: 'marketing', description: 'Publicités', implemented: true },
  { path: '/marketing/email', protected: true, category: 'marketing', description: 'Email marketing', implemented: true },
  { path: '/marketing/seo', protected: true, category: 'marketing', description: 'SEO', implemented: true },
  { path: '/marketing/automation', protected: true, category: 'marketing', description: 'Marketing automation', implemented: true },

  // ===== PRICING =====
  { path: '/pricing-manager', protected: true, category: 'tools', description: 'Gestionnaire prix', implemented: true },
  { path: '/pricing-manager/repricing', protected: true, category: 'tools', description: 'Repricing', implemented: true },

  // ===== IMPORT & FEEDS =====
  { path: '/import', protected: true, category: 'tools', description: 'Import', implemented: true },
  { path: '/feeds', protected: true, category: 'tools', description: 'Flux produits', implemented: true },

  // ===== INTEGRATIONS =====
  { path: '/integrations', protected: true, category: 'tools', description: 'Intégrations', implemented: true },
  { path: '/stores-channels', protected: true, category: 'tools', description: 'Boutiques & canaux', implemented: true },
  { path: '/extensions', protected: true, category: 'tools', description: 'Extensions', implemented: true },

  // ===== RESEARCH =====
  { path: '/research', protected: true, category: 'tools', description: 'Recherche', implemented: true },

  // ===== TOOLS =====
  { path: '/tools', protected: true, category: 'tools', description: 'Outils', implemented: true },
  { path: '/sync-manager', protected: true, category: 'tools', description: 'Sync manager', implemented: true },
  { path: '/reviews', protected: true, category: 'tools', description: 'Avis', implemented: true },
  { path: '/coupons', protected: true, category: 'tools', description: 'Coupons', implemented: true },
  { path: '/page-builder', protected: true, category: 'tools', description: 'Page builder', implemented: true },
  { path: '/ab-testing', protected: true, category: 'tools', description: 'A/B Testing', implemented: true },

  // ===== SETTINGS =====
  { path: '/settings', protected: true, category: 'settings', description: 'Paramètres', implemented: true },
  { path: '/profile', protected: true, category: 'settings', description: 'Profil', implemented: true },
  { path: '/subscription', protected: true, category: 'settings', description: 'Abonnement', implemented: true },
  { path: '/choose-plan', protected: true, category: 'settings', description: 'Choix du plan', implemented: true },

  // ===== ENTERPRISE =====
  { path: '/enterprise', protected: true, category: 'enterprise', description: 'Enterprise', implemented: true },

  // ===== ADMIN =====
  { path: '/admin', protected: true, adminOnly: true, category: 'enterprise', description: 'Administration', implemented: true },

  // ===== SUPPORT =====
  { path: '/help-center', protected: true, category: 'public', description: 'Centre d\'aide', implemented: true },
  { path: '/support', protected: true, category: 'public', description: 'Support', implemented: true },
  { path: '/sitemap', protected: true, category: 'public', description: 'Plan du site', implemented: true },
];

/** Obtenir les routes par catégorie */
export function getRoutesByCategory(category: RouteGroup): RouteConfig[] {
  return ROUTES_REGISTRY.filter(route => route.category === category);
}

/** Trouver une route par path */
export function findRoute(path: string): RouteConfig | undefined {
  return ROUTES_REGISTRY.find(r => r.path === path);
}

/** Obtenir le label d'une route (breadcrumbs) */
export function getRouteLabel(path: string): string {
  const route = findRoute(path);
  return route?.label || route?.description || path;
}

/** Vérifier si un path est public */
export function isPublicRoute(path: string): boolean {
  const route = findRoute(path);
  return route ? !route.protected : false;
}

/** Statistiques des routes */
export function getRoutesStats() {
  const total = ROUTES_REGISTRY.length;
  const implemented = ROUTES_REGISTRY.filter(r => r.implemented).length;
  return { total, implemented, missing: total - implemented, percentage: Math.round((implemented / total) * 100) };
}
