/**
 * Catégories de modules consolidées - Architecture 6 pôles
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
 * 6 pôles de navigation essentiels
 * Structure: 1 fonctionnalité = 1 endroit clair
 */
export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  home: {
    id: 'home',
    name: 'Accueil',
    icon: 'Home',
    order: 1,
    description: 'Dashboard & Vue d\'ensemble'
  },
  catalog: {
    id: 'catalog',
    name: 'Catalogue',
    icon: 'Package',
    order: 2,
    description: 'Gestion produits & Exécution quotidienne'
  },
  sourcing: {
    id: 'sourcing',
    name: 'Sourcing',
    icon: 'Truck',
    order: 3,
    description: 'Import, Fournisseurs & Veille'
  },
  sales: {
    id: 'sales',
    name: 'Ventes',
    icon: 'ShoppingCart',
    order: 4,
    description: 'Boutiques, Commandes & Clients'
  },
  performance: {
    id: 'performance',
    name: 'Performance',
    icon: 'BarChart3',
    order: 5,
    description: 'Analytics, Audit & Marketing'
  },
  config: {
    id: 'config',
    name: 'Configuration',
    icon: 'Settings',
    order: 6,
    description: 'Paramètres, IA & Administration'
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
  core: 'home',
  product: 'catalog',
  learning: 'config',
  analytics: 'performance',
  automation: 'sales',
  customer: 'sales',
  enterprise: 'config',
  integrations: 'sourcing',
  system: 'config'
};

/**
 * Convertir une ancienne catégorie vers le nouveau pôle
 */
export function mapLegacyCategory(legacyCategory: string): string {
  return LEGACY_CATEGORY_MAP[legacyCategory] || 'config';
}

/**
 * Obtenir les catégories pour un plan spécifique
 */
export function getCategoriesForPlan(plan: 'standard' | 'pro' | 'ultra_pro'): ModuleCategory[] {
  // Tous les plans ont accès aux 6 pôles de base
  // La restriction se fait au niveau des modules individuels
  return getAllCategories();
}
