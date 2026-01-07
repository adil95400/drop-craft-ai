import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Identifiants des groupes de navigation - Inspiré Channable
 * Structure par flux métier simplifié
 */
export type NavGroupId =
  | 'home'           // Accueil & Dashboard
  | 'sources'        // Import de données (produits, fournisseurs)
  | 'catalog'        // Gestion du catalogue
  | 'channels'       // Export vers canaux de vente
  | 'orders'         // Commandes & fulfillment
  | 'insights'       // Analytics & IA
  | 'marketing'      // Marketing & campagnes
  | 'settings';      // Configuration

/**
 * Configuration d'un groupe de navigation
 */
export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
  icon: string;
  order: number;
  collapsed?: boolean; // Groupe collapsé par défaut
}

/**
 * Configuration des groupes de navigation - Structure Channable-style
 */
export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'home', label: 'Accueil', icon: 'Home', order: 1 },
  { id: 'sources', label: 'Sources', icon: 'Upload', order: 2 },
  { id: 'catalog', label: 'Catalogue', icon: 'Package', order: 3 },
  { id: 'channels', label: 'Canaux', icon: 'Store', order: 4 },
  { id: 'orders', label: 'Commandes', icon: 'ShoppingCart', order: 5 },
  { id: 'insights', label: 'Insights', icon: 'BarChart3', order: 6 },
  { id: 'marketing', label: 'Marketing', icon: 'Megaphone', order: 7 },
  { id: 'settings', label: 'Paramètres', icon: 'Settings', order: 8, collapsed: true },
];

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
  order: number;
}

/**
 * Configuration d'un module principal
 */
export interface ModuleConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  minPlan: PlanType;
  route: string;
  features: string[];
  description: string;
  category: 'core' | 'product' | 'learning' | 'analytics' | 'automation' | 'customer' | 'enterprise' | 'integrations' | 'system';
  subModules?: SubModule[];
  order: number;
  groupId: NavGroupId;
  badge?: 'new' | 'beta' | 'pro' | 'ultra';
}

/**
 * Registry principal de tous les modules - Structure Channable-style
 * Organisé par flux métier
 */
export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  
  // ==========================================
  // GROUPE: HOME - Accueil & Vue d'ensemble
  // ==========================================
  
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['overview', 'quick-stats', 'recent-activity'],
    description: 'Vue d\'ensemble de votre activité',
    category: 'core',
    order: 1,
    groupId: 'home'
  },
  
  onboarding: {
    id: 'onboarding',
    name: 'Démarrage rapide',
    icon: 'Rocket',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/onboarding',
    features: ['tutorials', 'video-guides', 'checklist'],
    description: 'Guide de démarrage interactif',
    category: 'learning',
    order: 2,
    groupId: 'home'
  },

  // ==========================================
  // GROUPE: SOURCES - Import de données
  // ==========================================
  
  import: {
    id: 'import',
    name: 'Import',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/import',
    features: ['csv-import', 'url-import', 'api-import'],
    description: 'Importer des produits',
    category: 'product',
    order: 1,
    groupId: 'sources',
    subModules: [
      {
        id: 'import-quick',
        name: 'Import rapide',
        route: '/import/quick',
        icon: 'Zap',
        description: 'Upload CSV ou URL',
        features: ['csv-upload', 'drag-drop'],
        order: 1
      },
      {
        id: 'import-advanced',
        name: 'Import avancé',
        route: '/import/advanced',
        icon: 'Settings',
        description: 'Mapping et transformations',
        features: ['field-mapping', 'rules'],
        order: 2
      },
      {
        id: 'import-scheduled',
        name: 'Planifiés',
        route: '/import/scheduled',
        icon: 'Calendar',
        description: 'Imports automatiques',
        features: ['schedule', 'cron'],
        order: 3
      }
    ]
  },
  
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'catalog-sync'],
    description: 'Gérer vos fournisseurs',
    category: 'product',
    order: 2,
    groupId: 'sources',
    subModules: [
      {
        id: 'suppliers-hub',
        name: 'Hub',
        route: '/suppliers',
        icon: 'Truck',
        description: 'Vue d\'ensemble',
        features: ['overview', 'stats'],
        order: 1
      },
      {
        id: 'suppliers-my',
        name: 'Mes fournisseurs',
        route: '/suppliers/my',
        icon: 'Users',
        description: 'Fournisseurs connectés',
        features: ['manage', 'sync'],
        order: 2
      },
      {
        id: 'suppliers-analytics',
        name: 'Performances',
        route: '/suppliers/analytics',
        icon: 'BarChart3',
        description: 'KPIs et rapports',
        features: ['kpis', 'charts'],
        order: 3
      }
    ]
  },
  
  connectors: {
    id: 'connectors',
    name: 'Connecteurs',
    icon: 'Plug',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/connectors',
    features: ['90+ connectors', 'api-sync'],
    description: '90+ intégrations',
    category: 'integrations',
    order: 3,
    groupId: 'sources',
    badge: 'new'
  },

  // ==========================================
  // GROUPE: CATALOG - Gestion du catalogue
  // ==========================================
  
  products: {
    id: 'products',
    name: 'Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['product-management', 'bulk-actions'],
    description: 'Gérer votre catalogue',
    category: 'product',
    order: 1,
    groupId: 'catalog',
    subModules: [
      {
        id: 'products-all',
        name: 'Tous les produits',
        route: '/products',
        icon: 'Package',
        description: 'Liste complète',
        features: ['list', 'filters', 'bulk'],
        order: 1
      },
      {
        id: 'products-audit',
        name: 'Audit qualité',
        route: '/products/audit',
        icon: 'CheckCircle',
        description: 'Vérification qualité',
        features: ['quality-scoring', 'issues'],
        order: 2
      },
      {
        id: 'products-rules',
        name: 'Règles',
        route: '/products/rules',
        icon: 'Settings',
        description: 'Règles de transformation',
        features: ['rules-engine', 'automation'],
        order: 3
      }
    ]
  },
  
  rules: {
    id: 'rules',
    name: 'Règles',
    icon: 'GitBranch',
    enabled: true,
    minPlan: 'pro',
    route: '/products/rules',
    features: ['rule-engine', 'conditions', 'actions'],
    description: 'Règles de transformation',
    category: 'automation',
    order: 2,
    groupId: 'catalog',
    badge: 'pro'
  },
  
  aiOptimization: {
    id: 'aiOptimization',
    name: 'Optimisation IA',
    icon: 'Sparkles',
    enabled: true,
    minPlan: 'pro',
    route: '/products/intelligence',
    features: ['ai-descriptions', 'ai-seo', 'ai-images'],
    description: 'Optimisation automatique par IA',
    category: 'automation',
    order: 3,
    groupId: 'catalog',
    badge: 'pro'
  },
  
  research: {
    id: 'research',
    name: 'Recherche produits',
    icon: 'Search',
    enabled: true,
    minPlan: 'standard',
    route: '/products/research',
    features: ['trend-analysis', 'competitor-analysis'],
    description: 'Trouver des produits gagnants',
    category: 'product',
    order: 4,
    groupId: 'catalog'
  },
  
  winners: {
    id: 'winners',
    name: 'Winning Products',
    icon: 'Trophy',
    enabled: true,
    minPlan: 'standard',
    route: '/products/winners',
    features: ['winning-products', 'virality-score'],
    description: 'Produits tendances validés',
    category: 'product',
    order: 5,
    groupId: 'catalog'
  },

  // ==========================================
  // GROUPE: CHANNELS - Export vers canaux
  // ==========================================
  
  stores: {
    id: 'stores',
    name: 'Boutiques',
    icon: 'Store',
    enabled: true,
    minPlan: 'standard',
    route: '/stores-channels',
    features: ['store-management', 'multi-store'],
    description: 'Gérer vos boutiques',
    category: 'core',
    order: 1,
    groupId: 'channels',
    subModules: [
      {
        id: 'stores-hub',
        name: 'Hub',
        route: '/stores-channels',
        icon: 'Store',
        description: 'Vue d\'ensemble',
        features: ['overview'],
        order: 1
      },
      {
        id: 'stores-connect',
        name: 'Connecter',
        route: '/stores-channels/connect',
        icon: 'Plug',
        description: 'Ajouter une boutique',
        features: ['oauth', 'wizard'],
        order: 2
      },
      {
        id: 'stores-sync',
        name: 'Synchronisation',
        route: '/stores-channels/sync',
        icon: 'RefreshCw',
        description: 'État des syncs',
        features: ['sync-status', 'logs'],
        order: 3
      }
    ]
  },
  
  feeds: {
    id: 'feeds',
    name: 'Feeds',
    icon: 'Rss',
    enabled: true,
    minPlan: 'standard',
    route: '/feeds',
    features: ['google-feed', 'meta-feed', 'amazon-feed'],
    description: 'Exports vers Google, Meta, etc.',
    category: 'product',
    order: 2,
    groupId: 'channels',
    subModules: [
      {
        id: 'feeds-manager',
        name: 'Gestion',
        route: '/feeds',
        icon: 'Rss',
        description: 'Créer et gérer',
        features: ['feed-creation'],
        order: 1
      },
      {
        id: 'feeds-google',
        name: 'Google Shopping',
        route: '/feeds?channel=google',
        icon: 'Globe',
        description: 'Feed Google Merchant',
        features: ['google-merchant'],
        order: 2
      },
      {
        id: 'feeds-meta',
        name: 'Meta / Facebook',
        route: '/feeds?channel=meta',
        icon: 'Facebook',
        description: 'Catalogue Meta',
        features: ['meta-catalog'],
        order: 3
      }
    ]
  },
  
  marketplaces: {
    id: 'marketplaces',
    name: 'Marketplaces',
    icon: 'Globe',
    enabled: true,
    minPlan: 'pro',
    route: '/integrations/marketplace/hub',
    features: ['amazon', 'ebay', 'cdiscount'],
    description: 'Amazon, eBay, Cdiscount...',
    category: 'integrations',
    order: 3,
    groupId: 'channels',
    badge: 'pro'
  },

  // ==========================================
  // GROUPE: ORDERS - Commandes & Fulfillment
  // ==========================================
  
  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/orders',
    features: ['order-management', 'tracking'],
    description: 'Gérer les commandes',
    category: 'core',
    order: 1,
    groupId: 'orders'
  },
  
  fulfillment: {
    id: 'fulfillment',
    name: 'Fulfillment',
    icon: 'Package',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/fulfillment',
    features: ['auto-fulfillment', 'supplier-ordering'],
    description: 'Traitement automatique',
    category: 'automation',
    order: 2,
    groupId: 'orders',
    badge: 'pro'
  },
  
  inventory: {
    id: 'inventory',
    name: 'Stock',
    icon: 'Boxes',
    enabled: true,
    minPlan: 'standard',
    route: '/products/inventory-predictor',
    features: ['stock-management', 'alerts'],
    description: 'Gestion des stocks',
    category: 'product',
    order: 3,
    groupId: 'orders'
  },
  
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/customers',
    features: ['customer-management'],
    description: 'Base clients',
    category: 'customer',
    order: 4,
    groupId: 'orders'
  },

  // ==========================================
  // GROUPE: INSIGHTS - Analytics & IA
  // ==========================================
  
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: 'BarChart3',
    enabled: true,
    minPlan: 'standard',
    route: '/analytics',
    features: ['dashboards', 'reports', 'charts'],
    description: 'Tableaux de bord et rapports',
    category: 'analytics',
    order: 1,
    groupId: 'insights'
  },
  
  aiInsights: {
    id: 'aiInsights',
    name: 'IA Insights',
    icon: 'Brain',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/ai',
    features: ['ai-analysis', 'predictions', 'recommendations'],
    description: 'Analyses prédictives IA',
    category: 'analytics',
    order: 2,
    groupId: 'insights',
    badge: 'pro'
  },
  
  competitive: {
    id: 'competitive',
    name: 'Veille concurrentielle',
    icon: 'Eye',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics/competitive-comparison',
    features: ['competitor-tracking', 'price-monitoring'],
    description: 'Surveiller la concurrence',
    category: 'analytics',
    order: 3,
    groupId: 'insights',
    badge: 'pro'
  },
  
  repricing: {
    id: 'repricing',
    name: 'Repricing',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/repricing',
    features: ['dynamic-pricing', 'buybox'],
    description: 'Prix dynamiques automatiques',
    category: 'automation',
    order: 4,
    groupId: 'insights',
    badge: 'pro'
  },

  // ==========================================
  // GROUPE: MARKETING - Campagnes & Promo
  // ==========================================
  
  campaigns: {
    id: 'campaigns',
    name: 'Campagnes',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/ads',
    features: ['ad-management', 'multi-platform'],
    description: 'Campagnes publicitaires',
    category: 'customer',
    order: 1,
    groupId: 'marketing',
    badge: 'pro'
  },
  
  emailMarketing: {
    id: 'emailMarketing',
    name: 'Email Marketing',
    icon: 'Mail',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/email',
    features: ['email-campaigns', 'automation'],
    description: 'Emails automatisés',
    category: 'customer',
    order: 2,
    groupId: 'marketing',
    badge: 'pro'
  },
  
  promotions: {
    id: 'promotions',
    name: 'Promotions',
    icon: 'Tag',
    enabled: true,
    minPlan: 'standard',
    route: '/marketing/promotions',
    features: ['coupons', 'flash-sales'],
    description: 'Codes promo et ventes flash',
    category: 'customer',
    order: 3,
    groupId: 'marketing'
  },
  
  socialCommerce: {
    id: 'socialCommerce',
    name: 'Social Commerce',
    icon: 'Share2',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/social-commerce',
    features: ['instagram-shop', 'tiktok-shop'],
    description: 'Vente sur réseaux sociaux',
    category: 'customer',
    order: 4,
    groupId: 'marketing',
    badge: 'pro'
  },
  
  crm: {
    id: 'crm',
    name: 'CRM',
    icon: 'Heart',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/crm',
    features: ['customer-segments', 'lifecycle'],
    description: 'Relation client avancée',
    category: 'customer',
    order: 5,
    groupId: 'marketing',
    badge: 'pro'
  },
  
  reviews: {
    id: 'reviews',
    name: 'Avis clients',
    icon: 'Star',
    enabled: true,
    minPlan: 'standard',
    route: '/reviews',
    features: ['review-management'],
    description: 'Gérer les avis',
    category: 'customer',
    order: 6,
    groupId: 'marketing'
  },

  // ==========================================
  // GROUPE: SETTINGS - Configuration
  // ==========================================
  
  settings: {
    id: 'settings',
    name: 'Paramètres',
    icon: 'Settings',
    enabled: true,
    minPlan: 'standard',
    route: '/settings',
    features: ['account', 'preferences'],
    description: 'Configuration générale',
    category: 'system',
    order: 1,
    groupId: 'settings'
  },
  
  integrations: {
    id: 'integrations',
    name: 'Intégrations',
    icon: 'Plug',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations',
    features: ['api-keys', 'webhooks'],
    description: 'APIs et webhooks',
    category: 'integrations',
    order: 2,
    groupId: 'settings'
  },
  
  automation: {
    id: 'automation',
    name: 'Automatisation',
    icon: 'Zap',
    enabled: true,
    minPlan: 'pro',
    route: '/automation',
    features: ['workflows', 'triggers'],
    description: 'Workflows automatisés',
    category: 'automation',
    order: 3,
    groupId: 'settings',
    badge: 'pro'
  },
  
  extensions: {
    id: 'extensions',
    name: 'Extensions',
    icon: 'Puzzle',
    enabled: true,
    minPlan: 'pro',
    route: '/extensions',
    features: ['marketplace', 'plugins'],
    description: 'Apps et extensions',
    category: 'system',
    order: 4,
    groupId: 'settings',
    badge: 'pro'
  },
  
  academy: {
    id: 'academy',
    name: 'Academy',
    icon: 'GraduationCap',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/academy',
    features: ['courses', 'tutorials'],
    description: 'Formation et tutoriels',
    category: 'learning',
    order: 5,
    groupId: 'settings'
  },
  
  support: {
    id: 'support',
    name: 'Support',
    icon: 'HelpCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/support',
    features: ['tickets', 'chat'],
    description: 'Aide et assistance',
    category: 'system',
    order: 6,
    groupId: 'settings'
  },
  
  admin: {
    id: 'admin',
    name: 'Administration',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin',
    features: ['admin-panel', 'security'],
    description: 'Administration système',
    category: 'enterprise',
    order: 7,
    groupId: 'settings',
    badge: 'ultra'
  }
};

/**
 * Helper: Récupérer les modules par groupe
 */
export function getModulesByGroup(groupId: NavGroupId): ModuleConfig[] {
  return Object.values(MODULE_REGISTRY)
    .filter(m => m.groupId === groupId && m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Helper: Récupérer un groupe par ID
 */
export function getNavGroup(groupId: NavGroupId): NavGroupConfig | undefined {
  return NAV_GROUPS.find(g => g.id === groupId);
}

/**
 * Helper: Récupérer les modules par plan
 */
export function getModulesByPlan(plan: PlanType): ModuleConfig[] {
  const planHierarchy: Record<PlanType, number> = {
    free: 0,
    standard: 1,
    pro: 2,
    ultra_pro: 3
  };
  
  const userPlanLevel = planHierarchy[plan] || 0;
  
  return Object.values(MODULE_REGISTRY)
    .filter(m => planHierarchy[m.minPlan] <= userPlanLevel && m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * ModuleManager - Classe pour gérer l'accès aux modules
 */
export class ModuleManager {
  private currentPlan: PlanType;
  private planHierarchy: Record<PlanType, number> = {
    free: 0,
    standard: 1,
    pro: 2,
    ultra_pro: 3
  };

  constructor(plan: PlanType) {
    this.currentPlan = plan;
  }

  canAccessModule(moduleId: string): boolean {
    const module = MODULE_REGISTRY[moduleId];
    if (!module || !module.enabled) return false;
    
    const userLevel = this.planHierarchy[this.currentPlan] || 0;
    const requiredLevel = this.planHierarchy[module.minPlan] || 0;
    
    return userLevel >= requiredLevel;
  }

  getAvailableModules(): ModuleConfig[] {
    return Object.values(MODULE_REGISTRY)
      .filter(m => this.canAccessModule(m.id))
      .sort((a, b) => a.order - b.order);
  }

  getModuleConfig(moduleId: string): ModuleConfig | null {
    return MODULE_REGISTRY[moduleId] || null;
  }

  hasFeature(feature: string): boolean {
    const modules = this.getAvailableModules();
    return modules.some(m => m.features.includes(feature));
  }

  getAvailableFeatures(): string[] {
    const modules = this.getAvailableModules();
    const features = new Set<string>();
    modules.forEach(m => m.features.forEach(f => features.add(f)));
    return Array.from(features);
  }
}
