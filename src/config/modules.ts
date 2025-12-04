import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Identifiants des groupes de navigation
 */
export type NavGroupId =
  | 'overview'
  | 'products'
  | 'suppliers'
  | 'import_feeds'
  | 'orders'
  | 'customers'
  | 'marketing'
  | 'analytics'
  | 'ai'
  | 'automation'
  | 'stock'
  | 'stores_channels'
  | 'billing'
  | 'settings'
  | 'support';

/**
 * Configuration d'un groupe de navigation
 */
export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
  icon: string;
  order: number;
}

/**
 * Configuration des groupes de navigation - Structure organisée par métier
 */
export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: 'Home', order: 1 },
  { id: 'products', label: 'Catalogue & Produits', icon: 'Package', order: 2 },
  { id: 'suppliers', label: 'Fournisseurs & Marketplace', icon: 'Truck', order: 3 },
  { id: 'import_feeds', label: 'Import & Flux', icon: 'Upload', order: 4 },
  { id: 'orders', label: 'Commandes', icon: 'ShoppingCart', order: 5 },
  { id: 'customers', label: 'Clients & CRM', icon: 'Users', order: 6 },
  { id: 'marketing', label: 'Marketing & Growth', icon: 'Megaphone', order: 7 },
  { id: 'analytics', label: 'Analytics & BI', icon: 'BarChart3', order: 8 },
  { id: 'ai', label: 'IA & Intelligence', icon: 'Bot', order: 9 },
  { id: 'automation', label: 'Automations & Workflows', icon: 'Zap', order: 10 },
  { id: 'stock', label: 'Stock & Logistique', icon: 'Boxes', order: 11 },
  { id: 'stores_channels', label: 'Boutiques & Canaux', icon: 'Store', order: 12 },
  { id: 'billing', label: 'Abonnements & Facturation', icon: 'CreditCard', order: 13 },
  { id: 'settings', label: 'Paramètres & Administration', icon: 'Settings', order: 14 },
  { id: 'support', label: 'Support & Aide', icon: 'LifeBuoy', order: 15 },
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
  groupId: NavGroupId; // Nouveau: Association au groupe de navigation
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
    order: 1,
    groupId: 'overview'
  },
  products: {
    id: 'products',
    name: 'Catalogue Produits',
    icon: 'Package',
    enabled: true,
    minPlan: 'standard',
    route: '/products',
    features: ['product-management', 'basic-search', 'audit-engine', 'ai-optimization'],
    description: 'Gestion de votre catalogue produit',
    category: 'product',
    order: 4,
    groupId: 'products',
    subModules: [
      {
        id: 'products-catalog',
        name: 'Catalogue',
        route: '/products',
        icon: 'Package',
        description: 'Liste complète de vos produits',
        features: ['product-list', 'filters', 'bulk-actions'],
        order: 1
      },
      {
        id: 'products-audit',
        name: 'Audit',
        route: '/products/audit',
        icon: 'Target',
        description: 'Audit qualité du catalogue',
        features: ['quality-scoring', 'issue-detection', 'recommendations'],
        order: 2
      },
      {
        id: 'products-intelligence',
        name: 'Intelligence',
        route: '/products/intelligence',
        icon: 'Brain',
        description: 'Hub IA du catalogue',
        features: ['ai-insights', 'recommendations', 'predictions'],
        order: 3
      },
      {
        id: 'products-research',
        name: 'Recherche',
        route: '/products/research',
        icon: 'Search',
        description: 'Recherche de produits gagnants',
        features: ['trend-detection', 'winning-products', 'market-analysis'],
        order: 4
      },
      {
        id: 'products-rules',
        name: 'Règles',
        route: '/products/rules',
        icon: 'Settings',
        description: 'Automatisation du catalogue',
        features: ['rule-engine', 'automation', 'bulk-updates'],
        order: 5
      },
      {
        id: 'products-qa',
        name: 'QA Finale',
        route: '/products/qa',
        icon: 'CheckCircle',
        description: 'Contrôle qualité avant publication',
        features: ['quality-check', 'validation', 'pre-publish'],
        order: 6
      },
      {
        id: 'products-sourcing',
        name: 'Sourcing',
        route: '/products/sourcing',
        icon: 'Search',
        description: 'Sourcing et import produits',
        features: ['product-sourcing', 'supplier-search', 'import'],
        order: 7
      }
    ]
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
    order: 6,
    groupId: 'products'
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
    order: 7,
    groupId: 'products'
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
    order: 8,
    groupId: 'products'
  },
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'marketplace', 'supplier-sync', 'analytics'],
    description: 'Hub central de gestion des fournisseurs',
    category: 'product',
    order: 9,
    groupId: 'suppliers',
    subModules: [
      {
        id: 'suppliers-hub',
        name: 'Hub Fournisseurs',
        route: '/suppliers',
        icon: 'Truck',
        description: 'Vue d\'ensemble des fournisseurs',
        features: ['overview', 'quick-actions'],
        order: 1
      },
      {
        id: 'suppliers-marketplace',
        name: 'Marketplace',
        route: '/suppliers/marketplace',
        icon: 'Store',
        description: 'Découvrir et connecter des fournisseurs',
        features: ['discovery', 'connect', 'filters'],
        order: 2
      },
      {
        id: 'suppliers-my',
        name: 'Mes Fournisseurs',
        route: '/suppliers/my',
        icon: 'Users',
        description: 'Fournisseurs connectés',
        features: ['sync', 'manage', 'import'],
        order: 3
      },
      {
        id: 'suppliers-analytics',
        name: 'Analytics',
        route: '/suppliers/analytics',
        icon: 'BarChart3',
        description: 'Performances des fournisseurs',
        features: ['kpis', 'charts', 'reports'],
        order: 4
      },
      {
        id: 'suppliers-feeds',
        name: 'Feeds & Marketplaces',
        route: '/feeds',
        icon: 'Rss',
        description: 'Gestion des flux marketplace',
        features: ['feed-management', 'multi-channel'],
        order: 5
      },
      {
        id: 'suppliers-settings',
        name: 'Paramètres',
        route: '/suppliers/settings',
        icon: 'Settings',
        description: 'Configuration et API',
        features: ['api-keys', 'credentials'],
        order: 6
      }
    ]
  },
  
  // ============= MODULES IMPORT & FEEDS =============
  
  import: {
    id: 'import',
    name: 'Import Hub',
    icon: 'Upload',
    enabled: true,
    minPlan: 'standard',
    route: '/import',
    features: ['import-csv', 'import-url', 'import-api', 'import-db'],
    description: 'Centre de gestion des imports multi-sources',
    category: 'product',
    order: 11,
    groupId: 'import_feeds',
    subModules: [
      {
        id: 'import-quick',
        name: 'Import Rapide',
        route: '/import/quick',
        icon: 'Zap',
        description: 'Import simple et rapide',
        features: ['csv-upload', 'drag-drop'],
        order: 1
      },
      {
        id: 'import-advanced',
        name: 'Import Avancé',
        route: '/import/advanced',
        icon: 'Settings',
        description: 'Import avec mapping intelligent',
        features: ['field-mapping', 'bulk-import'],
        order: 2
      },
      {
        id: 'import-history',
        name: 'Historique',
        route: '/import/history',
        icon: 'Clock',
        description: 'Historique des imports',
        features: ['import-logs', 'tracking'],
        order: 3
      },
      {
        id: 'import-scheduled',
        name: 'Imports Planifiés',
        route: '/import/scheduled',
        icon: 'Calendar',
        description: 'Automatisation des imports',
        features: ['schedule', 'automation'],
        order: 4
      },
      {
        id: 'import-config',
        name: 'Configurations',
        route: '/import/config',
        icon: 'Settings',
        description: 'Configurations par source',
        features: ['csv-config', 'xml-config', 'api-config'],
        order: 5
      }
    ]
  },
  
  feeds: {
    id: 'feeds',
    name: 'Gestion des Feeds',
    icon: 'Rss',
    enabled: true,
    minPlan: 'pro',
    route: '/feeds',
    features: ['feed-google', 'feed-meta', 'feed-tiktok', 'feed-amazon'],
    description: 'Feeds multi-canaux (Google, Meta, TikTok, Amazon)',
    category: 'product',
    order: 12,
    groupId: 'import_feeds',
    subModules: [
      {
        id: 'feeds-manager',
        name: 'Gestion Feeds',
        route: '/feeds',
        icon: 'Rss',
        description: 'Créer et gérer les feeds',
        features: ['feed-creation', 'feed-export'],
        order: 1
      },
      {
        id: 'feeds-optimization',
        name: 'Optimisation',
        route: '/feeds/optimization',
        icon: 'Zap',
        description: 'Optimiser les feeds avec IA',
        features: ['ai-optimization', 'feed-quality'],
        order: 2
      }
    ]
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
    order: 10,
    groupId: 'products'
  },
  audit: {
    id: 'audit',
    name: 'Audit Produits',
    icon: 'CheckCircle',
    enabled: true,
    minPlan: 'pro',
    route: '/audit',
    features: ['product-audit', 'quality-scoring', 'seo-audit', 'auto-fix'],
    description: 'Audit qualité et optimisation des produits',
    category: 'product',
    order: 10.5,
    groupId: 'products'
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
    order: 11,
    groupId: 'products'
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
    order: 2,
    groupId: 'stores_channels'
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
    features: ['customer-management', 'customer-insights'],
    description: 'Gestion de vos clients',
    category: 'customer',
    order: 4,
    groupId: 'customers'
  },
  reviews: {
    id: 'reviews',
    name: 'Avis Clients',
    icon: 'Star',
    enabled: true,
    minPlan: 'standard',
    route: '/reviews',
    features: ['review-management', 'review-moderation', 'review-import'],
    description: 'Gestion des avis et témoignages clients',
    category: 'customer',
    order: 4.5,
    groupId: 'customers'
  },
  extensions: {
    id: 'extensions',
    name: 'Extensions',
    icon: 'Puzzle',
    enabled: true,
    minPlan: 'pro',
    route: '/extensions',
    features: ['extensions-marketplace', 'white-label', 'developer-api'],
    description: 'Extensions et personnalisations avancées',
    category: 'system',
    order: 13,
    groupId: 'settings'
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
    order: 5,
    groupId: 'import_feeds'
  },

  // ============= MODULES PHASE 2 - MARKETPLACE AVANCÉE =============
  
  dynamicRepricing: {
    id: 'dynamicRepricing',
    name: 'Repricing Dynamique',
    icon: 'TrendingUp',
    enabled: true,
    minPlan: 'pro',
    route: '/automation/repricing',
    features: ['dynamic-repricing', 'competitor-analysis', 'buybox-optimization', 'margin-protection'],
    description: 'Repricing automatique basé sur la concurrence et les marges',
    category: 'automation',
    order: 5.5,
    groupId: 'automation'
  },

  predictiveAnalytics: {
    id: 'predictiveAnalytics',
    name: 'Analytics Prédictive',
    icon: 'Brain',
    enabled: true,
    minPlan: 'ultra_pro',
    route: '/analytics/predictive',
    features: ['sales-forecasting', 'restock-recommendations', 'pricing-recommendations', 'trend-analysis'],
    description: 'Prévisions IA pour stock et prix',
    category: 'analytics',
    order: 8.5,
    groupId: 'analytics'
  },

  promotionsAutomation: {
    id: 'promotionsAutomation',
    name: 'Promotions Auto',
    icon: 'Tag',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing/promotions',
    features: ['automated-campaigns', 'multi-marketplace-promotions', 'rule-based-triggers', 'performance-tracking'],
    description: 'Promotions automatisées multi-canaux',
    category: 'automation',
    order: 5.7,
    groupId: 'marketing'
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
    order: 12,
    groupId: 'suppliers'
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
    order: 13,
    groupId: 'ai'
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
    order: 14,
    groupId: 'stock'
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
    order: 15,
    groupId: 'import_feeds'
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
    order: 16,
    groupId: 'support'
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
    order: 17,
    groupId: 'analytics'
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
    order: 18,
    groupId: 'customers'
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
    order: 18.5,
    groupId: 'analytics'
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
    order: 19,
    groupId: 'automation'
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
    order: 20,
    groupId: 'stock'
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
    order: 21,
    groupId: 'marketing'
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
    order: 22,
    groupId: 'automation'
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
    order: 23,
    groupId: 'customers'
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
    order: 24,
    groupId: 'marketing'
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
    order: 17,
    groupId: 'ai'
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
    order: 18,
    groupId: 'stores_channels'
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
    order: 19,
    groupId: 'settings'
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
    order: 20,
    groupId: 'settings'
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
    order: 21,
    groupId: 'suppliers'
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
    order: 22,
    groupId: 'settings'
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
    order: 23,
    groupId: 'settings'
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
    order: 24,
    groupId: 'support'
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
    order: 25,
    groupId: 'settings'
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
    order: 25,
    groupId: 'support'
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