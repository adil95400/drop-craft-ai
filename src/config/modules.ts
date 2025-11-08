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
}

/**
 * Registry principal de tous les modules de l'application
 * Organisé par plan et catégorie
 */
export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  // ============= MODULES STANDARD (11 modules) =============
  
  // Catégorie: Core Business
  dashboard: {
    id: 'dashboard',
    name: 'Tableau de Bord',
    icon: 'BarChart3',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard',
    features: ['basic-analytics', 'product-overview'],
    description: 'Vue d\'ensemble de votre activité',
    category: 'core',
    order: 1
  },
  products: {
    id: 'products',
    name: 'Catalogue Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['product-management', 'basic-search'],
    description: 'Gestion de votre catalogue produit',
    category: 'product',
    order: 4
  },
  import: {
    id: 'import',
    name: 'Import Produits',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/products/import',
    features: ['basic-import', 'bulk-import', 'url-scraping'],
    description: 'Import de données produits',
    category: 'product',
    order: 5
  },
  winners: {
    id: 'winners',
    name: 'Winning Products',
    icon: 'Trophy',
    enabled: true,
    minPlan: 'standard',
    route: '/products/winners',
    features: ['product-research', 'trend-analysis', 'competitor-analysis'],
    description: 'Découvrez les produits gagnants',
    category: 'product',
    order: 6
  },
  productResearch: {
    id: 'productResearch',
    name: 'Product Research',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/products/research',
    features: ['trend-scanner', 'viral-finder', 'saturation-analyzer', 'winning-score'],
    description: 'Recherche de produits tendances et analyse',
    category: 'product',
    order: 7
  },
  marketplace: {
    id: 'marketplace',
    name: 'AI Marketplace',
    icon: 'Sparkles',
    enabled: true,
    minPlan: 'standard',
    route: '/products/ai-marketplace',
    features: ['ai-validated-products', 'virality-score', 'winning-database'],
    description: '10,000+ produits analysés par IA',
    category: 'product',
    order: 8
  },
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/products/suppliers',
    features: ['supplier-management', 'basic-import'],
    description: 'Gestion des fournisseurs',
    category: 'product',
    order: 9
  },
  premiumSuppliers: {
    id: 'premiumSuppliers',
    name: 'Fournisseurs Premium',
    icon: 'Crown',
    enabled: true,
    minPlan: 'pro',
    route: '/products/suppliers/marketplace',
    features: ['premium-suppliers', 'supplier-sync', 'bts-wholesaler'],
    description: 'Synchronisez BTS Wholesaler',
    category: 'product',
    order: 9.5
  },
  premiumCatalog: {
    id: 'premiumCatalog',
    name: 'Catalogue Premium',
    icon: 'ShoppingBag',
    enabled: true,
    minPlan: 'standard',
    route: '/products/premium-catalog',
    features: ['premium-products', 'quick-import', 'supplier-catalog'],
    description: 'Produits premium de vos fournisseurs',
    category: 'product',
    order: 10
  },
  profitCalculator: {
    id: 'profitCalculator',
    name: 'Calculateur de Marge',
    icon: 'Calculator',
    enabled: true,
    minPlan: 'pro',
    route: '/products/profit-calculator',
    features: ['margin-calculator', 'pricing-optimizer', 'cost-analysis'],
    description: 'Calculez vos marges et optimisez vos prix',
    category: 'product',
    order: 11
  },
  stores: {
    id: 'stores',
    name: 'Mes Boutiques',
    icon: 'Store',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/stores',
    features: ['store-management', 'multi-store', 'store-sync'],
    description: 'Gestion de vos boutiques e-commerce',
    category: 'core',
    order: 2
  },
  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/orders',
    features: ['order-management', 'tracking', 'fulfillment'],
    description: 'Gestion de vos commandes',
    category: 'core',
    order: 3
  },
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/customers',
    features: ['customer-management', 'customer-insights'],
    description: 'Gestion de vos clients',
    category: 'customer',
    order: 4
  },
  marketplaceHub: {
    id: 'marketplaceHub',
    name: 'Marketplace Hub',
    icon: 'Globe',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/marketplace/hub',
    features: ['marketplace-listing', 'multi-marketplace', 'centralized-management'],
    description: 'Hub centralisé pour vos marketplaces',
    category: 'core',
    order: 5
  },

  // Catégorie: Product Management
  network: {
    id: 'network',
    name: 'Fournisseurs Premium',
    icon: 'Crown',
    enabled: true,
    minPlan: 'standard',
    route: '/products/premium-network',
    features: ['premium-suppliers', 'exclusive-deals', 'fast-shipping'],
    description: 'Réseau de fournisseurs premium',
    category: 'product',
    order: 12
  },
  bulkContent: {
    id: 'bulkContent',
    name: 'Création de Contenu',
    icon: 'FileText',
    enabled: true,
    minPlan: 'pro',
    route: '/products/bulk-content',
    features: ['bulk-description-ai', 'seo-content', 'product-naming'],
    description: 'Création en masse de contenu par IA',
    category: 'product',
    order: 13
  },
  inventoryPredictor: {
    id: 'inventoryPredictor',
    name: 'Prédiction Stock',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/products/inventory-predictor',
    features: ['stock-prediction', 'demand-forecasting', 'reorder-alerts'],
    description: 'Prédiction intelligente des stocks',
    category: 'product',
    order: 14
  },
  importSources: {
    id: 'importSources',
    name: 'Sources d\'Import',
    icon: 'Database',
    enabled: true,
    minPlan: 'standard',
    route: '/products/import/manage',
    features: ['source-management', 'custom-sources', 'api-connectors'],
    description: 'Gestion des sources d\'importation',
    category: 'product',
    order: 15
  },

  // Catégorie: Learning
  academy: {
    id: 'academy',
    name: 'Academy',
    icon: 'GraduationCap',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/academy',
    features: ['video-courses', 'guides', 'webinars', 'certifications'],
    description: 'Formation dropshipping complète',
    category: 'learning',
    order: 16
  },

  // ============= MODULES PRO (+8 modules = 19 total) =============
  
  // Catégorie: Advanced Analytics
  analytics: {
    id: 'analytics',
    name: 'Analytics Pro',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics',
    features: ['advanced-analytics', 'custom-reports', 'ai-insights'],
    description: 'Analytics avancés avec IA',
    category: 'analytics',
    order: 17
  },
  customerIntelligence: {
    id: 'customerIntelligence',
    name: 'Intelligence Client',
    icon: 'Brain',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics/customer-intelligence',
    features: ['customer-insights', 'behavior-analysis', 'segmentation'],
    description: 'Analyse comportementale des clients',
    category: 'customer',
    order: 18
  },
  competitiveComparison: {
    id: 'competitiveComparison',
    name: 'Comparaison Concurrentielle',
    icon: 'GitCompare',
    enabled: true,
    minPlan: 'pro',
    route: '/analytics/competitive-comparison',
    features: ['competitor-comparison', 'market-positioning', 'competitive-insights'],
    description: 'Comparez vos concurrents',
    category: 'analytics',
    order: 18.5
  },

  // Catégorie: Automation & Tools
  automation: {
    id: 'automation',
    name: 'Automatisation',
    icon: 'Zap',
    enabled: true,
    minPlan: 'pro',
    route: '/automation',
    features: ['workflow-builder', 'auto-pricing', 'inventory-sync'],
    description: 'Automatisation des processus',
    category: 'automation',
    order: 19
  },
  autoFulfillment: {
    id: 'autoFulfillment',
    name: 'Auto-Fulfillment',
    icon: 'Package',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/fulfillment',
    features: ['automated-ordering', 'supplier-sync', 'inventory-automation'],
    description: 'Automatisation du traitement des commandes',
    category: 'automation',
    order: 20
  },
  adsManager: {
    id: 'adsManager',
    name: 'Gestionnaire Pub',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/marketing/ads',
    features: ['ad-campaigns', 'multi-platform', 'performance-tracking'],
    description: 'Gestion des campagnes publicitaires',
    category: 'automation',
    order: 21
  },
  extension: {
    id: 'extension',
    name: 'Extension Navigateur',
    icon: 'PuzzlePiece',
    enabled: true,
    minPlan: 'pro',
    route: '/integrations/extensions',
    features: ['browser-extension', 'quick-import', 'extension-marketplace', 'real-time-sync'],
    description: 'Extension Chrome pour import rapide',
    category: 'automation',
    order: 22
  },

  // Catégorie: Customer Relations
  crm: {
    id: 'crm',
    name: 'CRM',
    icon: 'Users',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/crm',
    features: ['customer-management', 'lead-tracking', 'sales-pipeline'],
    description: 'Gestion de la relation client',
    category: 'customer',
    order: 23
  },
  seo: {
    id: 'seo',
    name: 'SEO Manager',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/seo',
    features: ['seo-optimization', 'keyword-tracking', 'content-analysis'],
    description: 'Optimisation SEO avancée',
    category: 'customer',
    order: 24
  },

  // ============= MODULES ULTRA PRO (+7 modules = 23 total) =============
  
  // Catégorie: Enterprise
  ai: {
    id: 'ai',
    name: 'IA Avancée',
    icon: 'Brain',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/automation/ai',
    features: ['ai-analysis', 'predictive-analytics', 'ai-import', 'smart-recommendations'],
    description: 'Suite complète d\'intelligence artificielle',
    category: 'enterprise',
    order: 17
  },
  commerce: {
    id: 'commerce',
    name: 'Commerce Pro',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/enterprise/commerce',
    features: ['multi-channel', 'inventory-management', 'order-management'],
    description: 'Solution e-commerce complète',
    category: 'enterprise',
    order: 18
  },
  multiTenant: {
    id: 'multiTenant',
    name: 'Multi-Tenant',
    icon: 'Building2',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/enterprise/multi-tenant',
    features: ['tenant-management', 'white-label', 'tenant-isolation'],
    description: 'Gestion multi-tenant enterprise',
    category: 'enterprise',
    order: 19
  },
  adminPanel: {
    id: 'adminPanel',
    name: 'Admin Panel',
    icon: 'Settings',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin',
    features: ['admin-access', 'user-management', 'system-config', 'advanced-settings'],
    description: 'Panneau d\'administration système',
    category: 'enterprise',
    order: 20
  },
  supplierAdmin: {
    id: 'supplierAdmin',
    name: 'Admin Fournisseurs',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin/suppliers',
    features: ['supplier-crud', 'import-api', 'export-data', 'advanced-filters'],
    description: 'Administration complète des fournisseurs',
    category: 'enterprise',
    order: 21
  },

  // Catégorie: Integrations
  integrations: {
    id: 'integrations',
    name: 'Intégrations Premium',
    icon: 'Plug',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/integrations',
    features: ['premium-apis', 'custom-connectors', 'webhooks'],
    description: 'Intégrations avancées et API premium',
    category: 'integrations',
    order: 22
  },
  security: {
    id: 'security',
    name: 'Sécurité Avancée',
    icon: 'Shield',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin/security',
    features: ['security-monitoring', 'audit-logs', 'access-control'],
    description: 'Sécurité et conformité enterprise',
    category: 'integrations',
    order: 23
  },
  videoTutorials: {
    id: 'videoTutorials',
    name: 'Vidéos Tutoriels',
    icon: 'Video',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/admin/video-tutorials',
    features: ['video-management', 'upload-videos', 'tutorial-guides'],
    description: 'Gestion des vidéos tutoriels marketplace',
    category: 'integrations',
    order: 24
  },

  // Système et configuration
  observability: {
    id: 'observability',
    name: 'Observabilité',
    icon: 'Activity',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/enterprise/monitoring',
    features: ['advanced-monitoring', 'real-time-metrics', 'alerts', 'logs-analytics'],
    description: 'Monitoring et métriques avancés',
    category: 'system',
    order: 25
  },
  support: {
    id: 'support',
    name: 'Support',
    icon: 'HelpCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/integrations/support',
    features: ['faq', 'tickets', 'live-chat', 'documentation'],
    description: 'Centre de support et assistance',
    category: 'system',
    order: 25
  }
};

// Hiérarchie des plans
export const PLAN_HIERARCHY: Record<PlanType, number> = {
  'free': 1,
  'standard': 1,
  'pro': 2,
  'ultra_pro': 3,
};

// Hook pour la gestion des modules
export class ModuleManager {
  private currentPlan: PlanType = 'standard';
  
  constructor(plan: PlanType) {
    this.currentPlan = plan;
  }

  // Obtenir les modules disponibles pour le plan actuel
  getAvailableModules(): ModuleConfig[] {
    return Object.values(MODULE_REGISTRY).filter(module => 
      PLAN_HIERARCHY[this.currentPlan] >= PLAN_HIERARCHY[module.minPlan]
    );
  }

  // Vérifier si un module est accessible
  canAccessModule(moduleId: string): boolean {
    const module = MODULE_REGISTRY[moduleId];
    if (!module) return false;
    
    return PLAN_HIERARCHY[this.currentPlan] >= PLAN_HIERARCHY[module.minPlan];
  }

  // Obtenir les fonctionnalités disponibles
  getAvailableFeatures(): string[] {
    return this.getAvailableModules()
      .flatMap(module => module.features);
  }

  // Vérifier l'accès à une fonctionnalité
  hasFeature(feature: string): boolean {
    return this.getAvailableFeatures().includes(feature);
  }

  // Obtenir la configuration d'un module
  getModuleConfig(moduleId: string): ModuleConfig | null {
    return MODULE_REGISTRY[moduleId] || null;
  }

  // Mettre à jour le plan
  updatePlan(newPlan: PlanType): void {
    this.currentPlan = newPlan;
  }
}