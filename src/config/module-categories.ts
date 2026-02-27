/**
 * Catégories de modules consolidées - Architecture 10 pôles métier
 * Aligné avec NAV_GROUPS dans modules.ts
 */

export interface ModuleCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
  description: string;
}

/**
 * 10 pôles de navigation métier
 * Structure: 1 fonctionnalité = 1 endroit clair
 */
export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  dashboard: {
    id: 'dashboard',
    name: 'Tableau de bord',
    icon: 'LayoutDashboard',
    order: 1,
    description: 'Vue d\'ensemble & alertes'
  },
  catalog: {
    id: 'catalog',
    name: 'Catalogue',
    icon: 'Package',
    order: 2,
    description: 'Produits, catégories & fournisseurs'
  },
  orders: {
    id: 'orders',
    name: 'Commandes & Expéditions',
    icon: 'ShoppingCart',
    order: 3,
    description: 'Commandes, livraisons & stock'
  },
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    order: 4,
    description: 'CRM, fidélité & avis'
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing & Ventes',
    icon: 'Megaphone',
    order: 5,
    description: 'Campagnes, SEO & promotions'
  },
  automation: {
    id: 'automation',
    name: 'Automatisation',
    icon: 'Zap',
    order: 6,
    description: 'Scénarios IA & workflows'
  },
  integrations: {
    id: 'integrations',
    name: 'Extensions & Intégrations',
    icon: 'Plug',
    order: 7,
    description: 'Boutiques, flux & connecteurs'
  },
  reports: {
    id: 'reports',
    name: 'Rapports & Analyses',
    icon: 'BarChart3',
    order: 8,
    description: 'Statistiques & audit'
  },
  settings: {
    id: 'settings',
    name: 'Paramètres',
    icon: 'Settings',
    order: 9,
    description: 'Configuration & administration'
  },
  help: {
    id: 'help',
    name: 'Aide & Support',
    icon: 'HelpCircle',
    order: 10,
    description: 'Formation, support & docs'
  }
};

/**
 * Obtenir une catégorie par son ID
 */
export function getCategory(categoryId: string): ModuleCategory | undefined {
  return MODULE_CATEGORIES[categoryId];
}

/**
 * Obtenir toutes les catégories triées par ordre
 */
export function getAllCategories(): ModuleCategory[] {
  return Object.values(MODULE_CATEGORIES).sort((a, b) => a.order - b.order);
}

/**
 * Mapping des anciennes catégories vers les nouveaux pôles
 */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  core: 'dashboard',
  product: 'catalog',
  learning: 'help',
  analytics: 'reports',
  automation: 'automation',
  customer: 'customers',
  enterprise: 'settings',
  integrations: 'integrations',
  system: 'settings',
  // Ancien mapping 6-pôles → 10-pôles
  home: 'dashboard',
  catalog: 'catalog',
  sourcing: 'catalog',
  sales: 'orders',
  performance: 'reports',
  config: 'settings'
};

/**
 * Convertir une ancienne catégorie vers le nouveau pôle
 */
export function mapLegacyCategory(legacyCategory: string): string {
  return LEGACY_CATEGORY_MAP[legacyCategory] || 'settings';
}

/**
 * Obtenir les catégories pour un plan spécifique
 */
export function getCategoriesForPlan(plan: 'standard' | 'pro' | 'ultra_pro'): ModuleCategory[] {
  return getAllCategories();
}
