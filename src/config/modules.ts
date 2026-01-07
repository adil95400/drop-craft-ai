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
        id: 'import-url',
        name: 'Import par URL',
        route: '/import/url',
        icon: 'Link',
        description: 'Importer depuis une URL',
        features: ['url-import', 'auto-detect'],
        order: 1
      },
      {
        id: 'import-quick',
        name: 'Import Rapide',
        route: '/import/quick',
        icon: 'Zap',
        description: 'Upload CSV rapide',
        features: ['csv-upload', 'drag-drop'],
        order: 2
      },
      {
        id: 'import-advanced',
        name: 'Import Avancé',
        route: '/import/advanced',
        icon: 'Settings',
        description: 'Mapping et transformations',
        features: ['field-mapping', 'rules'],
        order: 3
      },
      {
        id: 'import-management',
        name: 'Gestion des Imports',
        route: '/import/management',
        icon: 'FolderOpen',
        description: 'Gérer vos imports',
        features: ['import-history', 'scheduled'],
        order: 4
      },
      {
        id: 'import-products',
        name: 'Produits Importés',
        route: '/import/products',
        icon: 'Package',
        description: 'Produits en attente',
        features: ['review', 'approve'],
        order: 5
      },
      {
        id: 'import-history',
        name: 'Historique',
        route: '/import/history',
        icon: 'History',
        description: 'Historique des imports',
        features: ['logs', 'stats'],
        order: 6
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
    features: ['supplier-management', 'catalog-sync', 'dropshipping'],
    description: 'Connectez vos fournisseurs et grossistes',
    category: 'product',
    order: 2,
    groupId: 'sources',
    subModules: [
      // === Gestion ===
      {
        id: 'suppliers-hub',
        name: 'Hub Fournisseurs',
        route: '/suppliers',
        icon: 'Truck',
        description: 'Vue d\'ensemble de vos fournisseurs',
        features: ['overview', 'stats', 'status'],
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
        id: 'suppliers-add',
        name: 'Ajouter un fournisseur',
        route: '/suppliers/add',
        icon: 'Plus',
        description: 'Connecter un nouveau fournisseur',
        features: ['add', 'configure', 'wizard'],
        order: 3
      },
      
      // === Grossistes européens (Dropshipping) ===
      {
        id: 'supplier-bigbuy',
        name: 'BigBuy',
        route: '/suppliers/bigbuy',
        icon: 'Truck',
        description: 'Grossiste européen #1 - 100k+ produits',
        features: ['bigbuy-api', 'dropshipping', 'catalog', 'fulfillment'],
        order: 10
      },
      {
        id: 'supplier-cj',
        name: 'CJ Dropshipping',
        route: '/suppliers/cj-dropshipping',
        icon: 'Plane',
        description: 'Dropshipping Chine vers monde entier',
        features: ['cj-api', 'fulfillment', 'sourcing'],
        order: 11
      },
      {
        id: 'supplier-dropshipping-europe',
        name: 'Dropshipping Europe',
        route: '/suppliers/dropshipping-europe',
        icon: 'Globe',
        description: 'Fournisseurs européens multiples',
        features: ['europe', 'dropshipping', 'fast-shipping'],
        order: 12
      },
      {
        id: 'supplier-bts',
        name: 'BTS Wholesaler',
        route: '/suppliers/bts',
        icon: 'Package',
        description: 'Mode et accessoires en gros',
        features: ['bts-api', 'fashion', 'accessories'],
        order: 13
      },
      {
        id: 'supplier-matterhorn',
        name: 'Matterhorn',
        route: '/suppliers/matterhorn',
        icon: 'Mountain',
        description: 'Mode et textile européen',
        features: ['matterhorn-api', 'textile', 'fashion'],
        order: 14
      },
      {
        id: 'supplier-b2b-sports',
        name: 'B2B Sports Wholesale',
        route: '/suppliers/b2b-sports',
        icon: 'Dumbbell',
        description: 'Articles de sport en gros',
        features: ['sports', 'b2b', 'fitness'],
        order: 15
      },
      {
        id: 'supplier-watch-import',
        name: 'Watch Import',
        route: '/suppliers/watch-import',
        icon: 'Watch',
        description: 'Montres et bijoux en gros',
        features: ['watches', 'jewelry', 'luxury'],
        order: 16
      },
      {
        id: 'supplier-dropshipping-generic',
        name: 'Autres Dropshippers',
        route: '/suppliers/dropshipping',
        icon: 'Send',
        description: 'Fournisseurs dropshipping génériques',
        features: ['dropshipping', 'generic'],
        order: 17
      },
      
      // === Marketplaces globales (comme source) ===
      {
        id: 'supplier-amazon',
        name: 'Amazon',
        route: '/suppliers/amazon',
        icon: 'ShoppingBag',
        description: 'Amazon Seller/Vendor Central',
        features: ['amazon-api', 'mws', 'sp-api'],
        order: 20
      },
      {
        id: 'supplier-aliexpress',
        name: 'AliExpress',
        route: '/suppliers/aliexpress',
        icon: 'Globe',
        description: 'Import produits AliExpress',
        features: ['aliexpress-api', 'dropshipping', 'sourcing'],
        order: 21
      },
      {
        id: 'supplier-wish',
        name: 'Wish',
        route: '/suppliers/wish',
        icon: 'Star',
        description: 'Marketplace Wish',
        features: ['wish-api', 'global'],
        order: 22
      },
      {
        id: 'supplier-shopee',
        name: 'Shopee',
        route: '/suppliers/shopee',
        icon: 'ShoppingBag',
        description: 'Marketplace Asie-Pacifique',
        features: ['shopee-api', 'asia'],
        order: 23
      },
      
      // === Marketplaces européennes ===
      {
        id: 'supplier-cdiscount',
        name: 'Cdiscount',
        route: '/suppliers/cdiscount',
        icon: 'ShoppingCart',
        description: 'Marketplace française #1',
        features: ['cdiscount-api', 'france'],
        order: 30
      },
      {
        id: 'supplier-rakuten',
        name: 'Rakuten',
        route: '/suppliers/rakuten',
        icon: 'Circle',
        description: 'Rakuten France (ex PriceMinister)',
        features: ['rakuten-api', 'france'],
        order: 31
      },
      {
        id: 'supplier-fnac',
        name: 'Fnac',
        route: '/suppliers/fnac',
        icon: 'BookOpen',
        description: 'Marketplace Fnac/Darty',
        features: ['fnac-api', 'culture', 'electronics'],
        order: 32
      },
      {
        id: 'supplier-zalando',
        name: 'Zalando',
        route: '/suppliers/zalando',
        icon: 'Shirt',
        description: 'Mode et chaussures Europe',
        features: ['zalando-api', 'fashion'],
        order: 33
      },
      {
        id: 'supplier-mirakl',
        name: 'Mirakl',
        route: '/suppliers/mirakl',
        icon: 'Layers',
        description: 'Plateformes Mirakl (Carrefour, etc.)',
        features: ['mirakl-api', 'b2b', 'enterprise'],
        order: 34
      },
      {
        id: 'supplier-mercadolibre',
        name: 'MercadoLibre',
        route: '/suppliers/mercadolibre',
        icon: 'Handshake',
        description: 'Marketplace Amérique Latine',
        features: ['mercadolibre-api', 'latam'],
        order: 35
      },
      
      // === Plateformes E-commerce (comme source) ===
      {
        id: 'supplier-shopify',
        name: 'Shopify',
        route: '/suppliers/shopify',
        icon: 'ShoppingBag',
        description: 'Import depuis boutique Shopify',
        features: ['shopify-api', 'import', 'sync'],
        order: 40
      },
      {
        id: 'supplier-woocommerce',
        name: 'WooCommerce',
        route: '/suppliers/woocommerce',
        icon: 'ShoppingCart',
        description: 'Import depuis WooCommerce',
        features: ['woo-api', 'import', 'wordpress'],
        order: 41
      },
      {
        id: 'supplier-prestashop',
        name: 'PrestaShop',
        route: '/suppliers/prestashop',
        icon: 'Store',
        description: 'Import depuis PrestaShop',
        features: ['presta-api', 'import'],
        order: 42
      },
      {
        id: 'supplier-magento',
        name: 'Magento',
        route: '/suppliers/magento',
        icon: 'Box',
        description: 'Import depuis Magento/Adobe Commerce',
        features: ['magento-api', 'import', 'enterprise'],
        order: 43
      },
      {
        id: 'supplier-bigcommerce',
        name: 'BigCommerce',
        route: '/suppliers/bigcommerce',
        icon: 'Building',
        description: 'Import depuis BigCommerce',
        features: ['bigcommerce-api', 'import'],
        order: 44
      },
      {
        id: 'supplier-opencart',
        name: 'OpenCart',
        route: '/suppliers/opencart',
        icon: 'ShoppingCart',
        description: 'Import depuis OpenCart',
        features: ['opencart-api', 'import'],
        order: 45
      },
      {
        id: 'supplier-wix',
        name: 'Wix Stores',
        route: '/suppliers/wix',
        icon: 'Palette',
        description: 'Import depuis Wix eCommerce',
        features: ['wix-api', 'import'],
        order: 46
      },
      {
        id: 'supplier-ecwid',
        name: 'Ecwid',
        route: '/suppliers/ecwid',
        icon: 'Grid',
        description: 'Import depuis Ecwid',
        features: ['ecwid-api', 'import'],
        order: 47
      },
      {
        id: 'supplier-lightspeed',
        name: 'Lightspeed',
        route: '/suppliers/lightspeed',
        icon: 'Zap',
        description: 'Import depuis Lightspeed eCom',
        features: ['lightspeed-api', 'import', 'pos'],
        order: 48
      },
      {
        id: 'supplier-square',
        name: 'Square',
        route: '/suppliers/square',
        icon: 'Square',
        description: 'Import depuis Square Online',
        features: ['square-api', 'import', 'pos'],
        order: 49
      },
      {
        id: 'supplier-etsy',
        name: 'Etsy',
        route: '/suppliers/etsy',
        icon: 'Heart',
        description: 'Import depuis Etsy (artisanat)',
        features: ['etsy-api', 'artisan', 'handmade'],
        order: 50
      },
      
      // === Analytics ===
      {
        id: 'suppliers-analytics',
        name: 'Performances',
        route: '/suppliers/analytics',
        icon: 'BarChart3',
        description: 'KPIs et rapports fournisseurs',
        features: ['kpis', 'charts', 'comparison'],
        order: 99
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
