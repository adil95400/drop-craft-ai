import type { LucideIcon } from 'lucide-react';

/**
 * Catégories de modules pour une organisation claire de l'interface
 */
export interface ModuleCategory {
  id: string;
  name: string;
  icon: string;
  order: number;
  description: string;
}

export const MODULE_CATEGORIES: Record<string, ModuleCategory> = {
  core: {
    id: 'core',
    name: 'Core Business',
    icon: 'Building',
    order: 1,
    description: 'Fonctionnalités essentielles de gestion'
  },
  product: {
    id: 'product',
    name: 'Gestion Produits',
    icon: 'Package',
    order: 2,
    description: 'Catalogue, import et gestion des produits'
  },
  learning: {
    id: 'learning',
    name: 'Formation',
    icon: 'GraduationCap',
    order: 3,
    description: 'Ressources de formation et apprentissage'
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics & Insights',
    icon: 'BarChart3',
    order: 4,
    description: 'Analyses et rapports avancés'
  },
  automation: {
    id: 'automation',
    name: 'Automation & Tools',
    icon: 'Zap',
    order: 5,
    description: 'Automatisation et outils de productivité'
  },
  customer: {
    id: 'customer',
    name: 'Relations Clients',
    icon: 'Users',
    order: 6,
    description: 'CRM et optimisation SEO'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    icon: 'Building2',
    order: 7,
    description: 'Fonctionnalités enterprise avancées'
  },
  integrations: {
    id: 'integrations',
    name: 'Intégrations',
    icon: 'Plug',
    order: 8,
    description: 'Connecteurs et APIs externes'
  },
  system: {
    id: 'system',
    name: 'Système',
    icon: 'Settings',
    order: 9,
    description: 'Monitoring et administration système'
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
 * Obtenir les catégories pour un plan spécifique
 */
export function getCategoriesForPlan(plan: 'standard' | 'pro' | 'ultra_pro'): ModuleCategory[] {
  const planCategoryMap: Record<string, string[]> = {
    standard: ['core', 'product', 'learning'],
    pro: ['core', 'product', 'learning', 'analytics', 'automation', 'customer'],
    ultra_pro: ['core', 'product', 'learning', 'analytics', 'automation', 'customer', 'enterprise', 'integrations', 'system']
  };

  const categoryIds = planCategoryMap[plan] || [];
  return categoryIds
    .map(id => MODULE_CATEGORIES[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}
