import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Configuration d'un sous-module
 */
export interface SubModule {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  features: string[];
  parentModule: string;
  order: number;
  minPlan: PlanType;
}

/**
 * Registry complet de tous les sous-modules de l'application
 */
export const SUB_MODULES_REGISTRY: Record<string, SubModule[]> = {
  // Sous-modules de "Mes Boutiques"
  stores: [
    {
      id: 'store-dashboard',
      name: 'Dashboard',
      route: '/dashboard/stores',
      icon: 'LayoutDashboard',
      description: 'Vue d\'ensemble de vos boutiques',
      features: ['store-overview', 'quick-stats'],
      parentModule: 'stores',
      order: 1,
      minPlan: 'standard'
    },
    {
      id: 'store-connect',
      name: 'Connexion Boutique',
      route: '/dashboard/stores/connect',
      icon: 'Link',
      description: 'Connecter une nouvelle boutique',
      features: ['store-connection', 'multi-platform'],
      parentModule: 'stores',
      order: 2,
      minPlan: 'standard'
    },
    {
      id: 'store-integrations',
      name: 'Intégrations',
      route: '/dashboard/stores/integrations',
      icon: 'Layers',
      description: 'Gérer vos intégrations e-commerce',
      features: ['integration-management', 'sync-control'],
      parentModule: 'stores',
      order: 3,
      minPlan: 'standard'
    }
  ],

  // Sous-modules de "Import Produits"
  import: [
    {
      id: 'import-quick',
      name: 'Import Rapide',
      route: '/products/import/quick',
      icon: 'Zap',
      description: 'Import rapide de produits',
      features: ['quick-import', 'fast-upload'],
      parentModule: 'import',
      order: 1,
      minPlan: 'standard'
    },
    {
      id: 'import-advanced',
      name: 'Import Avancé',
      route: '/products/import/advanced',
      icon: 'Settings',
      description: 'Import avancé avec options',
      features: ['advanced-import', 'custom-mapping'],
      parentModule: 'import',
      order: 2,
      minPlan: 'standard'
    },
    {
      id: 'import-manage',
      name: 'Gestion des Imports',
      route: '/products/import/manage',
      icon: 'FolderOpen',
      description: 'Gérer vos imports',
      features: ['import-management', 'source-management'],
      parentModule: 'import',
      order: 3,
      minPlan: 'standard'
    },
    {
      id: 'import-products',
      name: 'Produits Importés',
      route: '/products/import/manage/products',
      icon: 'Package',
      description: 'Liste des produits importés',
      features: ['product-list', 'imported-catalog'],
      parentModule: 'import',
      order: 4,
      minPlan: 'standard'
    },
    {
      id: 'import-history',
      name: 'Historique',
      route: '/products/import/manage/history',
      icon: 'History',
      description: 'Historique des imports',
      features: ['import-logs', 'tracking'],
      parentModule: 'import',
      order: 5,
      minPlan: 'standard'
    }
  ],

  // Sous-modules de "Extension Chrome"
  extension: [
    {
      id: 'extension-install',
      name: 'Installation',
      route: '/integrations/extensions',
      icon: 'Download',
      description: 'Installer l\'extension Chrome',
      features: ['extension-install', 'setup-guide'],
      parentModule: 'extension',
      order: 1,
      minPlan: 'pro'
    },
    {
      id: 'extension-hub',
      name: 'Hub Extensions',
      route: '/integrations/extensions/hub',
      icon: 'Grid',
      description: 'Hub des extensions',
      features: ['extension-hub', 'marketplace'],
      parentModule: 'extension',
      order: 2,
      minPlan: 'pro'
    },
    {
      id: 'extension-api',
      name: 'API Extension',
      route: '/integrations/extensions/api',
      icon: 'Code',
      description: 'API de l\'extension',
      features: ['extension-api', 'developer-tools'],
      parentModule: 'extension',
      order: 3,
      minPlan: 'pro'
    },
    {
      id: 'extension-chrome-config',
      name: 'Configuration Chrome',
      route: '/integrations/extensions/chrome-config',
      icon: 'Settings',
      description: 'Configuration Chrome',
      features: ['chrome-config', 'browser-settings'],
      parentModule: 'extension',
      order: 4,
      minPlan: 'pro'
    }
  ],

  // Sous-modules de "CRM"
  crm: [
    {
      id: 'crm-leads',
      name: 'Prospects',
      route: '/marketing/crm/leads',
      icon: 'UserPlus',
      description: 'Gestion des prospects',
      features: ['lead-management', 'prospect-tracking'],
      parentModule: 'crm',
      order: 1,
      minPlan: 'pro'
    },
    {
      id: 'crm-emails',
      name: 'Emails',
      route: '/marketing/crm/emails',
      icon: 'Mail',
      description: 'Campagnes email',
      features: ['email-campaigns', 'newsletters'],
      parentModule: 'crm',
      order: 2,
      minPlan: 'pro'
    },
    {
      id: 'crm-calls',
      name: 'Appels',
      route: '/marketing/crm/calls',
      icon: 'Phone',
      description: 'Suivi des appels',
      features: ['call-tracking', 'phone-management'],
      parentModule: 'crm',
      order: 3,
      minPlan: 'pro'
    },
    {
      id: 'crm-calendar',
      name: 'Calendrier',
      route: '/marketing/crm/calendar',
      icon: 'Calendar',
      description: 'Gestion du calendrier',
      features: ['calendar', 'appointments'],
      parentModule: 'crm',
      order: 4,
      minPlan: 'pro'
    },
    {
      id: 'crm-activity',
      name: 'Activités',
      route: '/marketing/crm/activity',
      icon: 'Activity',
      description: 'Suivi des activités',
      features: ['activity-tracking', 'timeline'],
      parentModule: 'crm',
      order: 5,
      minPlan: 'pro'
    }
  ],

  // Sous-modules de "IA Avancée"
  ai: [
    {
      id: 'ai-page',
      name: 'IA Hub',
      route: '/automation/ai',
      icon: 'Brain',
      description: 'Hub principal de l\'IA',
      features: ['ai-hub', 'ai-tools'],
      parentModule: 'ai',
      order: 1,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-studio',
      name: 'Studio IA',
      route: '/automation/ai-studio',
      icon: 'Sparkles',
      description: 'Studio de création IA',
      features: ['ai-studio', 'creative-tools'],
      parentModule: 'ai',
      order: 2,
      minPlan: 'ultra_pro'
    }
  ],

  // Sous-modules de "Intégrations Premium"
  integrations: [
    {
      id: 'integrations-hub',
      name: 'Hub Intégrations',
      route: '/integrations/hub',
      icon: 'Grid',
      description: 'Hub des intégrations',
      features: ['integration-hub', 'app-marketplace'],
      parentModule: 'integrations',
      order: 1,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-api-developer',
      name: 'Developer API',
      route: '/integrations/api/developer',
      icon: 'Code',
      description: 'Outils développeur API',
      features: ['api-tools', 'developer-portal'],
      parentModule: 'integrations',
      order: 2,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-api-docs',
      name: 'Documentation API',
      route: '/integrations/api/documentation',
      icon: 'BookOpen',
      description: 'Documentation complète des APIs',
      features: ['api-docs', 'developer-guides'],
      parentModule: 'integrations',
      order: 3,
      minPlan: 'ultra_pro'
    }
  ],

  // Sous-modules de "Analytics Pro"
  analytics: [
    {
      id: 'analytics-dashboard',
      name: 'Dashboard',
      route: '/analytics',
      icon: 'LayoutDashboard',
      description: 'Vue d\'ensemble des analytics',
      features: ['analytics-dashboard', 'kpi-overview'],
      parentModule: 'analytics',
      order: 1,
      minPlan: 'pro'
    },
    {
      id: 'analytics-advanced',
      name: 'Analytics Avancés',
      route: '/analytics/advanced',
      icon: 'TrendingUp',
      description: 'Analytics avancés',
      features: ['advanced-analytics', 'deep-insights'],
      parentModule: 'analytics',
      order: 2,
      minPlan: 'pro'
    },
    {
      id: 'analytics-reports',
      name: 'Rapports',
      route: '/analytics/reports',
      icon: 'FileText',
      description: 'Rapports personnalisés',
      features: ['custom-reports', 'report-builder'],
      parentModule: 'analytics',
      order: 3,
      minPlan: 'pro'
    },
    {
      id: 'analytics-customer-intelligence',
      name: 'Intelligence Client',
      route: '/analytics/customer-intelligence',
      icon: 'Users',
      description: 'Analyse comportementale clients',
      features: ['customer-insights', 'behavior-analysis'],
      parentModule: 'analytics',
      order: 4,
      minPlan: 'pro'
    }
  ],

  // Sous-modules de "Fournisseurs"
  suppliers: [
    {
      id: 'suppliers-marketplace',
      name: 'Marketplace',
      route: '/products/suppliers/marketplace',
      icon: 'Store',
      description: 'Découvrir et comparer des fournisseurs',
      features: ['supplier-discovery', 'comparison-tool', 'reviews'],
      parentModule: 'suppliers',
      order: 1,
      minPlan: 'standard'
    },
    {
      id: 'suppliers-manage',
      name: 'Mes Fournisseurs',
      route: '/products/suppliers/manage',
      icon: 'Users',
      description: 'Gérer vos fournisseurs actifs',
      features: ['supplier-management', 'performance-tracking', 'orders'],
      parentModule: 'suppliers',
      order: 2,
      minPlan: 'standard'
    },
    {
      id: 'suppliers-list',
      name: 'Liste des Fournisseurs',
      route: '/products/suppliers/manage/list',
      icon: 'List',
      description: 'Voir tous vos fournisseurs',
      features: ['supplier-list', 'filters', 'search'],
      parentModule: 'suppliers',
      order: 3,
      minPlan: 'standard'
    },
    {
      id: 'suppliers-connectors',
      name: 'Connecteurs',
      route: '/products/suppliers/manage/connectors',
      icon: 'Plug',
      description: 'Connecteurs et intégrations fournisseurs',
      features: ['api-connectors', 'sync-settings', 'webhooks'],
      parentModule: 'suppliers',
      order: 4,
      minPlan: 'pro'
    }
  ]
};

/**
 * Obtenir tous les sous-modules d'un module parent
 */
export function getSubModules(parentModuleId: string): SubModule[] {
  return SUB_MODULES_REGISTRY[parentModuleId] || [];
}

/**
 * Obtenir un sous-module spécifique par son ID
 */
export function getSubModule(parentModuleId: string, subModuleId: string): SubModule | undefined {
  const subModules = SUB_MODULES_REGISTRY[parentModuleId] || [];
  return subModules.find(sm => sm.id === subModuleId);
}

/**
 * Vérifier si un module a des sous-modules
 */
export function hasSubModules(parentModuleId: string): boolean {
  return SUB_MODULES_REGISTRY[parentModuleId]?.length > 0;
}

/**
 * Obtenir tous les sous-modules accessibles selon le plan
 */
export function getAccessibleSubModules(
  parentModuleId: string, 
  currentPlan: PlanType
): SubModule[] {
  const planHierarchy: Record<PlanType, number> = {
    'free': 1,
    'standard': 1,
    'pro': 2,
    'ultra_pro': 3
  };

  const subModules = SUB_MODULES_REGISTRY[parentModuleId] || [];
  return subModules.filter(
    sm => planHierarchy[currentPlan] >= planHierarchy[sm.minPlan]
  );
}

/**
 * Obtenir un sous-module par son ID seul (recherche dans tous les modules)
 */
export function getSubModuleById(subModuleId: string): SubModule | undefined {
  for (const parentModuleId in SUB_MODULES_REGISTRY) {
    const subModule = SUB_MODULES_REGISTRY[parentModuleId].find(sm => sm.id === subModuleId);
    if (subModule) return subModule;
  }
  return undefined;
}
