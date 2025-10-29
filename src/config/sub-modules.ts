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
      route: '/stores',
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
      route: '/stores/connect',
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
      route: '/stores/integrations',
      icon: 'Layers',
      description: 'Gérer vos intégrations e-commerce',
      features: ['integration-management', 'sync-control'],
      parentModule: 'stores',
      order: 3,
      minPlan: 'standard'
    },
    {
      id: 'store-analytics',
      name: 'Analytics',
      route: '/stores/analytics',
      icon: 'LineChart',
      description: 'Analytics par boutique',
      features: ['store-analytics', 'performance-tracking'],
      parentModule: 'stores',
      order: 4,
      minPlan: 'standard'
    },
    {
      id: 'store-settings',
      name: 'Paramètres',
      route: '/stores/settings',
      icon: 'Settings',
      description: 'Configuration des boutiques',
      features: ['store-config', 'preferences'],
      parentModule: 'stores',
      order: 5,
      minPlan: 'standard'
    }
  ],

  // Sous-modules de "Import Produits"
  import: [
    {
      id: 'import-csv',
      name: 'Import CSV',
      route: '/import/csv',
      icon: 'FileSpreadsheet',
      description: 'Import depuis fichiers CSV',
      features: ['csv-import', 'bulk-upload'],
      parentModule: 'import',
      order: 1,
      minPlan: 'standard'
    },
    {
      id: 'import-api',
      name: 'Import API',
      route: '/import/api',
      icon: 'Code',
      description: 'Import via API',
      features: ['api-import', 'automated-sync'],
      parentModule: 'import',
      order: 2,
      minPlan: 'standard'
    },
    {
      id: 'import-url',
      name: 'Import URL',
      route: '/import/url',
      icon: 'Link',
      description: 'Import depuis URLs',
      features: ['url-scraping', 'web-import'],
      parentModule: 'import',
      order: 3,
      minPlan: 'standard'
    },
    {
      id: 'import-scraping',
      name: 'Web Scraping',
      route: '/import/scraping',
      icon: 'Search',
      description: 'Extraction automatique de données',
      features: ['web-scraping', 'data-extraction'],
      parentModule: 'import',
      order: 4,
      minPlan: 'standard'
    },
    {
      id: 'import-ai',
      name: 'Génération IA',
      route: '/import/ai-generation',
      icon: 'Sparkles',
      description: 'Génération de produits par IA',
      features: ['ai-generation', 'smart-content'],
      parentModule: 'import',
      order: 5,
      minPlan: 'pro'
    },
    {
      id: 'import-database',
      name: 'Import Database',
      route: '/import/database',
      icon: 'Database',
      description: 'Import depuis base de données',
      features: ['database-import', 'sql-sync'],
      parentModule: 'import',
      order: 6,
      minPlan: 'pro'
    },
    {
      id: 'import-scheduled',
      name: 'Imports Planifiés',
      route: '/import/scheduled',
      icon: 'Clock',
      description: 'Planification d\'imports automatiques',
      features: ['scheduled-import', 'automation'],
      parentModule: 'import',
      order: 7,
      minPlan: 'pro'
    },
    {
      id: 'import-history',
      name: 'Historique',
      route: '/import/history',
      icon: 'History',
      description: 'Historique des imports',
      features: ['import-logs', 'tracking'],
      parentModule: 'import',
      order: 8,
      minPlan: 'standard'
    }
  ],

  // Sous-modules de "Extension Chrome"
  extension: [
    {
      id: 'extension-install',
      name: 'Installation',
      route: '/extension',
      icon: 'Download',
      description: 'Installer l\'extension Chrome',
      features: ['extension-install', 'setup-guide'],
      parentModule: 'extension',
      order: 1,
      minPlan: 'pro'
    },
    {
      id: 'extension-auth',
      name: 'Authentification',
      route: '/extension/auth',
      icon: 'Key',
      description: 'Configuration de l\'authentification',
      features: ['extension-auth', 'token-management'],
      parentModule: 'extension',
      order: 2,
      minPlan: 'pro'
    },
    {
      id: 'extension-config',
      name: 'Configuration',
      route: '/extension/config',
      icon: 'Settings',
      description: 'Paramètres de l\'extension',
      features: ['extension-settings', 'preferences'],
      parentModule: 'extension',
      order: 3,
      minPlan: 'pro'
    },
    {
      id: 'extension-analytics',
      name: 'Analytics',
      route: '/extension/analytics',
      icon: 'BarChart3',
      description: 'Statistiques d\'utilisation',
      features: ['extension-analytics', 'usage-stats'],
      parentModule: 'extension',
      order: 4,
      minPlan: 'pro'
    },
    {
      id: 'extension-history',
      name: 'Historique',
      route: '/extension/history',
      icon: 'History',
      description: 'Historique des imports via extension',
      features: ['import-history', 'activity-log'],
      parentModule: 'extension',
      order: 5,
      minPlan: 'pro'
    },
    {
      id: 'extension-monitoring',
      name: 'Monitoring',
      route: '/extension/monitoring',
      icon: 'Activity',
      description: 'Surveillance de l\'extension',
      features: ['health-monitoring', 'status-check'],
      parentModule: 'extension',
      order: 6,
      minPlan: 'pro'
    },
    {
      id: 'extension-marketplace',
      name: 'Marketplace',
      route: '/extension/marketplace',
      icon: 'Store',
      description: 'Marketplace d\'extensions',
      features: ['extension-marketplace', 'plugins'],
      parentModule: 'extension',
      order: 7,
      minPlan: 'pro'
    }
  ],

  // Sous-modules de "CRM"
  crm: [
    {
      id: 'crm-leads',
      name: 'Prospects',
      route: '/crm/leads',
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
      route: '/crm/emails',
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
      route: '/crm/calls',
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
      route: '/crm/calendar',
      icon: 'Calendar',
      description: 'Gestion du calendrier',
      features: ['calendar', 'appointments'],
      parentModule: 'crm',
      order: 4,
      minPlan: 'pro'
    },
    {
      id: 'crm-activities',
      name: 'Activités',
      route: '/crm/activities',
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
      id: 'ai-assistant',
      name: 'Assistant IA',
      route: '/ai/assistant',
      icon: 'MessageSquare',
      description: 'Assistant intelligent conversationnel',
      features: ['ai-chat', 'smart-assistant'],
      parentModule: 'ai',
      order: 1,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-content',
      name: 'Génération de Contenu',
      route: '/ai/content-generation',
      icon: 'FileText',
      description: 'Génération automatique de contenu',
      features: ['content-generation', 'ai-writing'],
      parentModule: 'ai',
      order: 2,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-product-analysis',
      name: 'Analyse Produits',
      route: '/ai/product-analysis',
      icon: 'Search',
      description: 'Analyse IA des produits',
      features: ['product-analysis', 'market-insights'],
      parentModule: 'ai',
      order: 3,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-descriptions',
      name: 'Descriptions Auto',
      route: '/ai/descriptions',
      icon: 'Type',
      description: 'Génération automatique de descriptions',
      features: ['auto-descriptions', 'seo-content'],
      parentModule: 'ai',
      order: 4,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-pricing',
      name: 'Pricing IA',
      route: '/ai/pricing',
      icon: 'DollarSign',
      description: 'Optimisation des prix par IA',
      features: ['ai-pricing', 'dynamic-pricing'],
      parentModule: 'ai',
      order: 5,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-marketing',
      name: 'Marketing Automation',
      route: '/ai/marketing-automation',
      icon: 'Megaphone',
      description: 'Automatisation marketing par IA',
      features: ['marketing-automation', 'campaigns'],
      parentModule: 'ai',
      order: 6,
      minPlan: 'ultra_pro'
    },
    {
      id: 'ai-sentiment',
      name: 'Analyse Sentiment',
      route: '/ai/sentiment-analysis',
      icon: 'Heart',
      description: 'Analyse des sentiments clients',
      features: ['sentiment-analysis', 'customer-insights'],
      parentModule: 'ai',
      order: 7,
      minPlan: 'ultra_pro'
    }
  ],

  // Sous-modules de "Intégrations Premium"
  integrations: [
    {
      id: 'integrations-api-docs',
      name: 'Documentation API',
      route: '/integrations/api-docs',
      icon: 'BookOpen',
      description: 'Documentation complète des APIs',
      features: ['api-docs', 'developer-guides'],
      parentModule: 'integrations',
      order: 1,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-api-keys',
      name: 'Clés API',
      route: '/integrations/api-keys',
      icon: 'Key',
      description: 'Gestion des clés API',
      features: ['api-keys', 'token-management'],
      parentModule: 'integrations',
      order: 2,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-webhooks',
      name: 'Webhooks',
      route: '/integrations/webhooks',
      icon: 'Webhook',
      description: 'Configuration des webhooks',
      features: ['webhooks', 'event-triggers'],
      parentModule: 'integrations',
      order: 3,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-analytics',
      name: 'Analytics API',
      route: '/integrations/analytics',
      icon: 'BarChart3',
      description: 'Statistiques d\'utilisation des APIs',
      features: ['api-analytics', 'usage-stats'],
      parentModule: 'integrations',
      order: 4,
      minPlan: 'ultra_pro'
    },
    {
      id: 'integrations-playground',
      name: 'API Playground',
      route: '/integrations/playground',
      icon: 'Code',
      description: 'Test des APIs en direct',
      features: ['api-testing', 'interactive-docs'],
      parentModule: 'integrations',
      order: 5,
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
      id: 'analytics-reports',
      name: 'Rapports Personnalisés',
      route: '/analytics/reports',
      icon: 'FileText',
      description: 'Création de rapports sur mesure',
      features: ['custom-reports', 'report-builder'],
      parentModule: 'analytics',
      order: 2,
      minPlan: 'pro'
    },
    {
      id: 'analytics-ai-insights',
      name: 'Insights IA',
      route: '/analytics/ai-insights',
      icon: 'Brain',
      description: 'Insights générés par IA',
      features: ['ai-insights', 'smart-recommendations'],
      parentModule: 'analytics',
      order: 3,
      minPlan: 'ultra_pro'
    },
    {
      id: 'analytics-predictive',
      name: 'Analytics Prédictifs',
      route: '/analytics/predictive',
      icon: 'TrendingUp',
      description: 'Prévisions et tendances',
      features: ['predictive-analytics', 'forecasting'],
      parentModule: 'analytics',
      order: 4,
      minPlan: 'ultra_pro'
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
