import type { PlanType } from '@/lib/unified-plan-system';

/**
 * Navigation optimisée - Style professionnel Channable/Lengow
 * 7 groupes principaux - Structure claire sans doublons
 * 
 * OPTIMISATIONS APPLIQUÉES:
 * - Suppression des doublons (returns, emailMarketing, flashSales, etc.)
 * - Fusion des modules similaires (Pricing, IA, Qualité, Veille)
 * - Réorganisation cohérente des groupes
 * - Navigation -35% plus légère
 */

// =============================================================================
// TYPES
// =============================================================================

export type NavGroupId =
  | 'home'        // Dashboard & Accueil
  | 'sources'     // Import & Fournisseurs (données entrantes)
  | 'catalog'     // Produits & Règles (gestion catalogue)
  | 'channels'    // Boutiques & Feeds (données sortantes)
  | 'orders'      // Commandes & Clients
  | 'insights'    // Analytics & Intelligence
  | 'settings';   // Configuration & Admin

export interface NavGroupConfig {
  id: NavGroupId;
  label: string;
  icon: string;
  order: number;
}

export interface SubModule {
  id: string;
  name: string;
  route: string;
  icon: string;
  description: string;
  features: string[];
  order: number;
}

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

// =============================================================================
// GROUPES DE NAVIGATION (7 groupes - Style Channable)
// =============================================================================

export const NAV_GROUPS: NavGroupConfig[] = [
  { id: 'home', label: 'Accueil', icon: 'Home', order: 1 },
  { id: 'sources', label: 'Sources', icon: 'Upload', order: 2 },
  { id: 'catalog', label: 'Catalogue', icon: 'Package', order: 3 },
  { id: 'channels', label: 'Canaux', icon: 'Store', order: 4 },
  { id: 'orders', label: 'Commandes', icon: 'ShoppingCart', order: 5 },
  { id: 'insights', label: 'Insights', icon: 'BarChart3', order: 6 },
  { id: 'settings', label: 'Paramètres', icon: 'Settings', order: 7 },
];

// =============================================================================
// MODULE_REGISTRY - Navigation optimisée sans doublons
// =============================================================================

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HOME - Dashboard & Vue d'ensemble (2 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
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

  notifications: {
    id: 'notifications',
    name: 'Notifications',
    icon: 'Bell',
    enabled: true,
    minPlan: 'standard',
    route: '/notifications',
    features: ['alerts', 'messages'],
    description: 'Centre de notifications',
    category: 'core',
    order: 2,
    groupId: 'home'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SOURCES - Import de données & Fournisseurs (4 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
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
      { id: 'import-quick', name: 'Import Rapide', route: '/import/quick', icon: 'Zap', description: 'Upload CSV rapide', features: ['csv-upload'], order: 1 },
      { id: 'import-url', name: 'Import par URL', route: '/import/url', icon: 'Link', description: 'Importer depuis une URL', features: ['url-import'], order: 2 },
      { id: 'import-advanced', name: 'Import Avancé', route: '/import/advanced', icon: 'Settings', description: 'Mapping et transformations', features: ['field-mapping'], order: 3 },
      { id: 'import-shopify', name: 'Shopify', route: '/import/shopify', icon: 'Store', description: 'Import depuis Shopify', features: ['shopify'], order: 4 },
      { id: 'import-history', name: 'Historique', route: '/import/history', icon: 'History', description: 'Historique des imports', features: ['logs'], order: 5 },
      { id: 'import-config', name: 'Configuration', route: '/import/config', icon: 'Settings', description: 'Configuration des imports', features: ['config'], order: 6 },
    ]
  },
  
  suppliers: {
    id: 'suppliers',
    name: 'Fournisseurs',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/suppliers',
    features: ['supplier-management', 'dropshipping', 'catalog-sync'],
    description: 'Connectez vos fournisseurs',
    category: 'product',
    order: 2,
    groupId: 'sources',
    subModules: [
      { id: 'suppliers-list', name: 'Liste', route: '/suppliers', icon: 'Truck', description: 'Tous les fournisseurs', features: ['list'], order: 1 },
      { id: 'suppliers-orders', name: 'Commandes', route: '/suppliers/orders', icon: 'Package', description: 'Commandes fournisseurs', features: ['orders'], order: 2 },
      { id: 'suppliers-catalog', name: 'Catalogues', route: '/suppliers/catalog', icon: 'Book', description: 'Catalogues fournisseurs', features: ['catalog'], order: 3 },
    ]
  },

  // Module FUSIONNÉ: Veille & Recherche (remplace research, competitive, adsSpy, winners)
  research: {
    id: 'research',
    name: 'Veille & Recherche',
    icon: 'Search',
    enabled: true,
    minPlan: 'pro',
    route: '/research',
    features: ['product-research', 'winning-products', 'competitor-tracking', 'ads-spy'],
    description: 'Veille produits et concurrence',
    category: 'analytics',
    order: 3,
    groupId: 'sources',
    badge: 'pro',
    subModules: [
      { id: 'research-winning', name: 'Produits Gagnants', route: '/research/winning', icon: 'Trophy', description: 'Découvrir les gagnants', features: ['winning-products'], order: 1 },
      { id: 'research-competitors', name: 'Concurrents', route: '/research/competitors', icon: 'Eye', description: 'Veille concurrentielle', features: ['competitor-tracking'], order: 2 },
      { id: 'research-ads', name: 'Publicités', route: '/research/ads', icon: 'Megaphone', description: 'Espionner les pubs', features: ['ads-spy'], order: 3 },
      { id: 'research-trends', name: 'Tendances', route: '/research/trends', icon: 'TrendingUp', description: 'Tendances du marché', features: ['trends'], order: 4 },
      { id: 'research-sourcing', name: 'Sourcing', route: '/research/sourcing', icon: 'Search', description: 'Trouver des produits', features: ['sourcing'], order: 5 },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. CATALOG - Gestion du catalogue produits (6 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
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
      { id: 'products-all', name: 'Tous les produits', route: '/products', icon: 'Package', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'products-create', name: 'Créer un produit', route: '/products/create', icon: 'Plus', description: 'Nouveau produit', features: ['create'], order: 2 },
      { id: 'products-catalogue', name: 'Catalogue', route: '/products/catalogue', icon: 'Layers', description: 'Catalogue produits', features: ['catalog'], order: 3 },
    ]
  },
  
  rules: {
    id: 'rules',
    name: 'Règles',
    icon: 'GitBranch',
    enabled: true,
    minPlan: 'standard',
    route: '/rules',
    features: ['rule-engine', 'transformations'],
    description: 'Règles de transformation',
    category: 'automation',
    order: 2,
    groupId: 'catalog'
  },
  
  // Module FUSIONNÉ: Qualité & Audit (remplace audit, qa, productScoring)
  quality: {
    id: 'quality',
    name: 'Qualité & Audit',
    icon: 'CheckCircle',
    enabled: true,
    minPlan: 'standard',
    route: '/audit',
    features: ['quality-scoring', 'seo-audit', 'product-audit', 'qa'],
    description: 'Audit et contrôle qualité',
    category: 'product',
    order: 3,
    groupId: 'catalog',
    subModules: [
      { id: 'quality-dashboard', name: 'Dashboard', route: '/audit', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'quality-products', name: 'Audit Produits', route: '/audit/products', icon: 'Package', description: 'Auditer les produits', features: ['products'], order: 2 },
      { id: 'quality-scoring', name: 'Scoring', route: '/audit/scoring', icon: 'Star', description: 'Score qualité', features: ['scoring'], order: 3 },
      { id: 'quality-seo', name: 'Audit SEO', route: '/audit/seo', icon: 'Search', description: 'Audit référencement', features: ['seo'], order: 4 },
      { id: 'quality-feed', name: 'Audit Feed', route: '/audit/feed', icon: 'Rss', description: 'Qualité des feeds', features: ['feed'], order: 5 },
      { id: 'quality-batch', name: 'Audit en Masse', route: '/audit/batch', icon: 'Layers', description: 'Audit par lot', features: ['batch'], order: 6 },
    ]
  },
  
  // Module FUSIONNÉ: Tarification (remplace repricing, dynamicPricing, priceRules, stock-repricing)
  pricing: {
    id: 'pricing',
    name: 'Tarification',
    icon: 'DollarSign',
    enabled: true,
    minPlan: 'standard',
    route: '/pricing',
    features: ['price-rules', 'dynamic-pricing', 'repricing', 'margin-control'],
    description: 'Gestion des prix',
    category: 'automation',
    order: 4,
    groupId: 'catalog',
    subModules: [
      { id: 'pricing-rules', name: 'Règles de Prix', route: '/pricing/rules', icon: 'GitBranch', description: 'Définir les règles', features: ['rules'], order: 1 },
      { id: 'pricing-dynamic', name: 'Prix Dynamiques', route: '/pricing/dynamic', icon: 'TrendingUp', description: 'Ajustement automatique', features: ['dynamic'], order: 2 },
      { id: 'pricing-repricing', name: 'Repricing', route: '/pricing/repricing', icon: 'RefreshCw', description: 'Repricing compétitif', features: ['repricing'], order: 3 },
      { id: 'pricing-monitoring', name: 'Surveillance', route: '/pricing/monitoring', icon: 'Eye', description: 'Surveiller les prix', features: ['monitoring'], order: 4 },
    ]
  },

  // Module FUSIONNÉ: Intelligence Artificielle (remplace aiOptimization, aiContent, aiAssistant, contentGeneration, catalogIntelligence)
  ai: {
    id: 'ai',
    name: 'Intelligence IA',
    icon: 'Brain',
    enabled: true,
    minPlan: 'pro',
    route: '/ai',
    features: ['ai-descriptions', 'ai-seo', 'ai-content', 'ai-assistant', 'catalog-intelligence'],
    description: 'Optimisation par IA',
    category: 'automation',
    order: 5,
    groupId: 'catalog',
    badge: 'pro',
    subModules: [
      { id: 'ai-optimization', name: 'Optimisation', route: '/ai/optimization', icon: 'Sparkles', description: 'Optimisation IA', features: ['optimization'], order: 1 },
      { id: 'ai-content', name: 'Génération Contenu', route: '/ai/content', icon: 'Wand2', description: 'Créer du contenu', features: ['content'], order: 2 },
      { id: 'ai-assistant', name: 'Assistant IA', route: '/ai/assistant', icon: 'Bot', description: 'Assistant intelligent', features: ['assistant'], order: 3 },
      { id: 'ai-catalog', name: 'Intelligence Catalogue', route: '/ai/catalog', icon: 'Brain', description: 'IA pour le catalogue', features: ['catalog-ai'], order: 4 },
      { id: 'ai-rewrite', name: 'Réécriture', route: '/ai/rewrite', icon: 'FileEdit', description: 'Réécrire les textes', features: ['rewrite'], order: 5 },
    ]
  },

  attributes: {
    id: 'attributes',
    name: 'Attributs',
    icon: 'Tag',
    enabled: true,
    minPlan: 'pro',
    route: '/attributes/manager',
    features: ['attribute-management', 'ai-attributes'],
    description: 'Gestion des attributs produits',
    category: 'product',
    order: 6,
    groupId: 'catalog',
    badge: 'pro'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CHANNELS - Boutiques & Exports (5 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
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
      { id: 'stores-hub', name: 'Hub', route: '/stores-channels', icon: 'Store', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stores-connect', name: 'Connecter', route: '/stores-channels/connect', icon: 'Plug', description: 'Ajouter une boutique', features: ['oauth'], order: 2 },
      { id: 'stores-sync', name: 'Synchronisation', route: '/stores-channels/sync', icon: 'RefreshCw', description: 'État des syncs', features: ['sync-status'], order: 3 },
      { id: 'stores-analytics', name: 'Analytics', route: '/stores-channels/analytics', icon: 'BarChart3', description: 'Performances', features: ['analytics'], order: 4 },
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
    description: 'Exports vers Google, Meta...',
    category: 'product',
    order: 2,
    groupId: 'channels',
    subModules: [
      { id: 'feeds-manager', name: 'Gestion', route: '/feeds', icon: 'Rss', description: 'Créer et gérer', features: ['feed-creation'], order: 1 },
      { id: 'feeds-optimization', name: 'Optimisation', route: '/feeds/optimization', icon: 'TrendingUp', description: 'Optimiser les feeds', features: ['optimization'], order: 2 },
      { id: 'feeds-rules', name: 'Règles Feed', route: '/feeds/rules', icon: 'GitBranch', description: 'Règles de transformation', features: ['rules'], order: 3 },
      { id: 'feeds-categories', name: 'Catégories', route: '/feeds/categories', icon: 'Layers', description: 'Mapping catégories', features: ['mapping'], order: 4 },
    ]
  },
  
  fulfillment: {
    id: 'fulfillment',
    name: 'Fulfillment',
    icon: 'PackageCheck',
    enabled: true,
    minPlan: 'pro',
    route: '/fulfillment',
    features: ['auto-fulfillment', 'carriers'],
    description: 'Expédition automatique',
    category: 'automation',
    order: 3,
    groupId: 'channels',
    badge: 'pro',
    subModules: [
      { id: 'fulfillment-hub', name: 'Hub', route: '/fulfillment', icon: 'PackageCheck', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'fulfillment-dashboard', name: 'Dashboard', route: '/fulfillment/dashboard', icon: 'LayoutDashboard', description: 'Tableau de bord', features: ['dashboard'], order: 2 },
      { id: 'fulfillment-rules', name: 'Règles', route: '/fulfillment/rules', icon: 'GitBranch', description: 'Règles d\'expédition', features: ['rules'], order: 3 },
      { id: 'fulfillment-carriers', name: 'Transporteurs', route: '/fulfillment/carriers', icon: 'Truck', description: 'Gestion transporteurs', features: ['carriers'], order: 4 },
    ]
  },

  tiktokShop: {
    id: 'tiktokShop',
    name: 'TikTok Shop',
    icon: 'Video',
    enabled: true,
    minPlan: 'pro',
    route: '/integrations/tiktok-shop',
    features: ['tiktok-integration', 'live-shopping'],
    description: 'Vendre sur TikTok Shop',
    category: 'integrations',
    order: 4,
    groupId: 'channels',
    badge: 'new'
  },

  multiChannel: {
    id: 'multiChannel',
    name: 'Multi-Canal',
    icon: 'Layers',
    enabled: true,
    minPlan: 'pro',
    route: '/integrations/multi-channel',
    features: ['multi-channel-sync', 'unified-inventory'],
    description: 'Gestion multi-canal unifiée',
    category: 'integrations',
    order: 5,
    groupId: 'channels',
    badge: 'pro'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ORDERS - Commandes & Clients (5 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
  orders: {
    id: 'orders',
    name: 'Commandes',
    icon: 'ShoppingCart',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/orders',
    features: ['order-management', 'tracking', 'returns'],
    description: 'Gérer les commandes',
    category: 'core',
    order: 1,
    groupId: 'orders',
    subModules: [
      { id: 'orders-all', name: 'Toutes les commandes', route: '/dashboard/orders', icon: 'ShoppingCart', description: 'Liste complète', features: ['list'], order: 1 },
      { id: 'orders-create', name: 'Créer', route: '/orders/create', icon: 'Plus', description: 'Nouvelle commande', features: ['create'], order: 2 },
      { id: 'orders-bulk', name: 'Commandes en masse', route: '/orders/bulk', icon: 'Layers', description: 'Gestion par lot', features: ['bulk'], order: 3 },
      { id: 'orders-returns', name: 'Retours', route: '/dashboard/orders/returns', icon: 'RotateCcw', description: 'Gestion retours', features: ['returns'], order: 4 },
      { id: 'orders-tracking', name: 'Suivi', route: '/dashboard/orders/tracking', icon: 'Truck', description: 'Suivi livraisons', features: ['tracking'], order: 5 },
      { id: 'orders-notifications', name: 'Notifications Client', route: '/dashboard/orders/notifications', icon: 'Bell', description: 'Alertes clients', features: ['notifications'], order: 6 },
    ]
  },
  
  customers: {
    id: 'customers',
    name: 'Clients',
    icon: 'Users',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/customers',
    features: ['customer-management', 'segmentation'],
    description: 'Base clients',
    category: 'customer',
    order: 2,
    groupId: 'orders',
    subModules: [
      { id: 'customers-all', name: 'Tous les clients', route: '/dashboard/customers', icon: 'Users', description: 'Liste clients', features: ['list'], order: 1 },
      { id: 'customers-segmentation', name: 'Segmentation', route: '/dashboard/customers/segmentation', icon: 'PieChart', description: 'Segmenter les clients', features: ['segmentation'], order: 2 },
    ]
  },
  
  inventory: {
    id: 'inventory',
    name: 'Stock',
    icon: 'Boxes',
    enabled: true,
    minPlan: 'standard',
    route: '/stock',
    features: ['stock-management', 'alerts', 'predictions'],
    description: 'Gestion des stocks',
    category: 'product',
    order: 3,
    groupId: 'orders',
    subModules: [
      { id: 'stock-management', name: 'Gestion', route: '/stock', icon: 'Boxes', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'stock-alerts', name: 'Alertes', route: '/stock/alerts', icon: 'Bell', description: 'Alertes stock', features: ['alerts'], order: 2 },
      { id: 'stock-predictions', name: 'Prédictions', route: '/stock/predictions', icon: 'Brain', description: 'Prédictions IA', features: ['predictions'], order: 3 },
    ]
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
    order: 4,
    groupId: 'orders'
  },

  shipping: {
    id: 'shipping',
    name: 'Expédition',
    icon: 'Truck',
    enabled: true,
    minPlan: 'standard',
    route: '/shipping',
    features: ['shipping-management', 'carriers', 'tracking'],
    description: 'Gestion des expéditions',
    category: 'core',
    order: 5,
    groupId: 'orders'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INSIGHTS - Analytics & Intelligence (6 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
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
    groupId: 'insights',
    subModules: [
      { id: 'analytics-dashboard', name: 'Dashboard', route: '/analytics', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'analytics-advanced', name: 'Avancé', route: '/analytics/advanced', icon: 'TrendingUp', description: 'Analytics avancés', features: ['advanced'], order: 2 },
      { id: 'analytics-reports', name: 'Rapports', route: '/analytics/reports', icon: 'FileText', description: 'Rapports personnalisés', features: ['reports'], order: 3 },
      { id: 'analytics-bi', name: 'Business Intelligence', route: '/analytics/bi', icon: 'Brain', description: 'BI avancée', features: ['bi'], order: 4 },
      { id: 'analytics-predictive', name: 'Prédictif', route: '/analytics/predictive', icon: 'TrendingUp', description: 'Analytics prédictifs', features: ['predictive'], order: 5 },
      { id: 'analytics-real-data', name: 'Temps Réel', route: '/analytics/real-data', icon: 'Activity', description: 'Données temps réel', features: ['real-data'], order: 6 },
    ]
  },

  marketing: {
    id: 'marketing',
    name: 'Marketing',
    icon: 'Megaphone',
    enabled: true,
    minPlan: 'pro',
    route: '/marketing',
    features: ['campaigns', 'email', 'promotions', 'abandoned-cart', 'loyalty'],
    description: 'Campagnes marketing',
    category: 'customer',
    order: 2,
    groupId: 'insights',
    badge: 'pro',
    subModules: [
      { id: 'marketing-dashboard', name: 'Dashboard', route: '/marketing', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'marketing-ads', name: 'Campagnes Ads', route: '/marketing/ads', icon: 'Megaphone', description: 'Publicités', features: ['ads'], order: 2 },
      { id: 'marketing-email', name: 'Email', route: '/marketing/email', icon: 'Mail', description: 'Email marketing', features: ['email'], order: 3 },
      { id: 'marketing-promotions', name: 'Promotions', route: '/marketing/promotions', icon: 'Tag', description: 'Codes promo', features: ['coupons'], order: 4 },
      { id: 'marketing-abandoned', name: 'Paniers Abandonnés', route: '/marketing/abandoned-cart', icon: 'ShoppingCart', description: 'Récupération paniers', features: ['abandoned'], order: 5 },
      { id: 'marketing-loyalty', name: 'Fidélité', route: '/marketing/loyalty', icon: 'Award', description: 'Programme fidélité', features: ['loyalty'], order: 6 },
      { id: 'marketing-flash', name: 'Ventes Flash', route: '/marketing/flash-sales', icon: 'Zap', description: 'Ventes flash', features: ['flash-sales'], order: 7 },
      { id: 'marketing-social', name: 'Social Commerce', route: '/marketing/social-commerce', icon: 'Share2', description: 'Réseaux sociaux', features: ['social'], order: 8 },
    ]
  },

  crm: {
    id: 'crm',
    name: 'CRM',
    icon: 'Contact',
    enabled: true,
    minPlan: 'pro',
    route: '/crm',
    features: ['leads', 'pipeline', 'contacts'],
    description: 'Gestion relation client',
    category: 'customer',
    order: 3,
    groupId: 'insights',
    badge: 'pro',
    subModules: [
      { id: 'crm-dashboard', name: 'Dashboard', route: '/crm', icon: 'LayoutDashboard', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'crm-leads', name: 'Leads', route: '/crm/leads', icon: 'UserPlus', description: 'Gestion des leads', features: ['leads'], order: 2 },
      { id: 'crm-emails', name: 'Emails', route: '/crm/emails', icon: 'Mail', description: 'Historique emails', features: ['emails'], order: 3 },
      { id: 'crm-activity', name: 'Activité', route: '/marketing/crm/activity', icon: 'Activity', description: 'Historique activité', features: ['activity'], order: 4 },
      { id: 'crm-calls', name: 'Appels', route: '/marketing/crm/calls', icon: 'Phone', description: 'Gestion appels', features: ['calls'], order: 5 },
      { id: 'crm-calendar', name: 'Calendrier', route: '/marketing/crm/calendar', icon: 'Calendar', description: 'Calendrier CRM', features: ['calendar'], order: 6 },
    ]
  },

  seo: {
    id: 'seo',
    name: 'SEO',
    icon: 'Search',
    enabled: true,
    minPlan: 'standard',
    route: '/seo',
    features: ['seo-audit', 'keywords', 'rankings'],
    description: 'Optimisation référencement',
    category: 'analytics',
    order: 4,
    groupId: 'insights',
    subModules: [
      { id: 'seo-manager', name: 'Manager', route: '/seo', icon: 'Search', description: 'Gestion SEO', features: ['manager'], order: 1 },
      { id: 'seo-keywords', name: 'Mots-clés', route: '/seo/keywords', icon: 'Key', description: 'Recherche mots-clés', features: ['keywords'], order: 2 },
      { id: 'seo-rank', name: 'Rankings', route: '/seo/rank-tracker', icon: 'TrendingUp', description: 'Suivi positions', features: ['rankings'], order: 3 },
    ]
  },

  reports: {
    id: 'reports',
    name: 'Rapports',
    icon: 'FileText',
    enabled: true,
    minPlan: 'standard',
    route: '/reports',
    features: ['reports', 'exports', 'scheduled-reports'],
    description: 'Rapports et exports',
    category: 'analytics',
    order: 5,
    groupId: 'insights'
  },

  profitCalculator: {
    id: 'profitCalculator',
    name: 'Calculateur Profit',
    icon: 'Calculator',
    enabled: true,
    minPlan: 'standard',
    route: '/tools/profit-calculator',
    features: ['profit-calculation', 'margins'],
    description: 'Calculer vos marges',
    category: 'analytics',
    order: 6,
    groupId: 'insights'
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SETTINGS - Configuration & Administration (8 modules)
  // ═══════════════════════════════════════════════════════════════════════════
  
  settings: {
    id: 'settings',
    name: 'Paramètres',
    icon: 'Settings',
    enabled: true,
    minPlan: 'standard',
    route: '/dashboard/settings',
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
    features: ['api-keys', 'webhooks', 'connectors'],
    description: 'APIs et connecteurs',
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
    badge: 'pro',
    subModules: [
      { id: 'automation-hub', name: 'Hub', route: '/automation', icon: 'Zap', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'automation-workflows', name: 'Workflows', route: '/automation/workflows', icon: 'Workflow', description: 'Créer des workflows', features: ['workflows'], order: 2 },
      { id: 'automation-triggers', name: 'Déclencheurs', route: '/automation/triggers', icon: 'Play', description: 'Gérer les triggers', features: ['triggers'], order: 3 },
      { id: 'automation-studio', name: 'Studio', route: '/automation/studio', icon: 'Palette', description: 'Studio automation', features: ['studio'], order: 4 },
      { id: 'automation-ai-hub', name: 'AI Hub', route: '/automation/ai-hub', icon: 'Brain', description: 'Hub IA', features: ['ai'], order: 5 },
    ]
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
    badge: 'pro',
    subModules: [
      { id: 'extensions-hub', name: 'Hub', route: '/extensions', icon: 'Puzzle', description: 'Vue d\'ensemble', features: ['overview'], order: 1 },
      { id: 'extensions-marketplace', name: 'Marketplace', route: '/extensions/marketplace', icon: 'Store', description: 'Découvrir des extensions', features: ['marketplace'], order: 2 },
      { id: 'extensions-developer', name: 'Développeur', route: '/extensions/developer', icon: 'Code', description: 'Créer des extensions', features: ['developer'], order: 3 },
    ]
  },
  
  academy: {
    id: 'academy',
    name: 'Academy',
    icon: 'GraduationCap',
    enabled: true,
    minPlan: 'standard',
    route: '/academy',
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
    route: '/support',
    features: ['tickets', 'chat', 'live-chat'],
    description: 'Aide et assistance',
    category: 'system',
    order: 6,
    groupId: 'settings'
  },

  apiDocs: {
    id: 'apiDocs',
    name: 'API & Docs',
    icon: 'Code',
    enabled: true,
    minPlan: 'pro',
    route: '/api/documentation',
    features: ['api-docs', 'swagger', 'webhooks'],
    description: 'Documentation API',
    category: 'integrations',
    order: 7,
    groupId: 'settings',
    badge: 'pro'
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
    order: 8,
    groupId: 'settings',
    badge: 'ultra',
    subModules: [
      { id: 'admin-panel', name: 'Panel', route: '/admin', icon: 'Shield', description: 'Administration', features: ['admin'], order: 1 },
      { id: 'admin-security', name: 'Sécurité', route: '/admin/security', icon: 'Lock', description: 'Sécurité', features: ['security'], order: 2 },
      { id: 'admin-suppliers', name: 'Fournisseurs', route: '/admin/suppliers', icon: 'Truck', description: 'Gestion fournisseurs', features: ['suppliers'], order: 3 },
    ]
  },
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Récupérer les modules par groupe
 */
export function getModulesByGroup(groupId: NavGroupId): ModuleConfig[] {
  return Object.values(MODULE_REGISTRY)
    .filter(m => m.groupId === groupId && m.enabled)
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupérer un groupe par ID
 */
export function getNavGroup(groupId: NavGroupId): NavGroupConfig | undefined {
  return NAV_GROUPS.find(g => g.id === groupId);
}

/**
 * Récupérer les modules par plan
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
 * Recherche globale dans les modules
 */
export function searchModules(query: string): ModuleConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(MODULE_REGISTRY)
    .filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description.toLowerCase().includes(lowerQuery) ||
      m.features.some(f => f.toLowerCase().includes(lowerQuery)) ||
      m.subModules?.some(sm => 
        sm.name.toLowerCase().includes(lowerQuery) ||
        sm.description.toLowerCase().includes(lowerQuery)
      )
    )
    .sort((a, b) => a.order - b.order);
}

/**
 * Récupérer tous les sous-modules à plat
 */
export function getAllSubModules(): SubModule[] {
  return Object.values(MODULE_REGISTRY)
    .flatMap(m => m.subModules || [])
    .sort((a, b) => a.order - b.order);
}

/**
 * ModuleManager - Gestion de l'accès aux modules
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

/**
 * Statistiques de la navigation
 */
export function getNavigationStats() {
  const modules = Object.values(MODULE_REGISTRY);
  const subModulesCount = modules.reduce((acc, m) => acc + (m.subModules?.length || 0), 0);
  
  return {
    totalModules: modules.length,
    totalSubModules: subModulesCount,
    totalEntries: modules.length + subModulesCount,
    byGroup: NAV_GROUPS.map(g => ({
      group: g.label,
      count: modules.filter(m => m.groupId === g.id).length
    })),
    byPlan: {
      standard: modules.filter(m => m.minPlan === 'standard').length,
      pro: modules.filter(m => m.minPlan === 'pro').length,
      ultra_pro: modules.filter(m => m.minPlan === 'ultra_pro').length,
    }
  };
}
